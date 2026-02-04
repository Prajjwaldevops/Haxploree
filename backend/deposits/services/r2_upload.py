"""
Cloudflare R2 Upload Service.

This module handles image uploads to Cloudflare R2 (S3-compatible storage).
It provides both public URLs and signed URLs for secure ML model access.
"""

import logging
import uuid
import mimetypes
from typing import Tuple, Optional

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config
from django.conf import settings


logger = logging.getLogger(__name__)


class R2UploadError(Exception):
    """Custom exception for R2 upload failures."""
    pass


def get_r2_client():
    """
    Create and return a boto3 S3 client configured for Cloudflare R2.
    
    R2 is fully S3-compatible, so we use boto3's S3 client with
    the R2 endpoint URL.
    """
    if not all([
        settings.R2_ACCESS_KEY_ID,
        settings.R2_SECRET_ACCESS_KEY,
        settings.R2_ENDPOINT_URL,
    ]):
        raise R2UploadError("R2 credentials are not fully configured")
    
    return boto3.client(
        's3',
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(
            signature_version='s3v4',
            s3={
                'addressing_style': 'path'
            }
        ),
        region_name='auto',  # R2 uses 'auto' for region
    )


def get_content_type(filename: str) -> str:
    """
    Determine the content type from the filename.
    Falls back to 'application/octet-stream' if unknown.
    """
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or 'application/octet-stream'


def get_file_extension(filename: str) -> str:
    """
    Extract the file extension from a filename.
    Returns 'jpg' as default if no extension found.
    """
    if '.' in filename:
        return filename.rsplit('.', 1)[-1].lower()
    return 'jpg'


def upload_image_to_r2(
    file_data: bytes,
    original_filename: str,
    clerk_user_id: str,
) -> Tuple[str, str]:
    """
    Upload an image to Cloudflare R2.
    
    Args:
        file_data: Raw bytes of the image file
        original_filename: Original filename (used for content type detection)
        clerk_user_id: Clerk user ID (used in the object key for organization)
    
    Returns:
        Tuple of (object_key, signed_url)
        - object_key: The S3/R2 object key (path) for future reference
        - signed_url: A pre-signed URL valid for the configured expiration time
    
    Raises:
        R2UploadError: If the upload fails for any reason
    """
    try:
        client = get_r2_client()
        bucket_name = settings.R2_BUCKET_NAME
        
        if not bucket_name:
            raise R2UploadError("R2_BUCKET_NAME is not configured")
        
        # Generate a unique object key
        # Format: deposits/{clerk_user_id}/{uuid}.{ext}
        extension = get_file_extension(original_filename)
        unique_id = str(uuid.uuid4())
        object_key = f"deposits/{clerk_user_id}/{unique_id}.{extension}"
        
        content_type = get_content_type(original_filename)
        
        logger.info(f"Uploading to R2: {object_key} ({content_type})")
        
        # Upload the file
        client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=file_data,
            ContentType=content_type,
        )
        
        logger.info(f"Successfully uploaded: {object_key}")
        
        # Generate a signed URL for secure access
        # This URL is time-limited and can be regenerated later if needed
        signed_url = generate_signed_url(object_key)
        
        return object_key, signed_url
        
    except (ClientError, BotoCoreError) as e:
        logger.error(f"R2 upload failed: {e}")
        raise R2UploadError(f"Failed to upload image: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during R2 upload: {e}")
        raise R2UploadError(f"Upload failed: {str(e)}")


def generate_signed_url(object_key: str, expiration: Optional[int] = None) -> str:
    """
    Generate a pre-signed URL for accessing an object in R2.
    
    This is useful for:
    - Secure access to images without making the bucket public
    - Time-limited access for ML model inference
    - Regenerating URLs when old ones expire
    
    Args:
        object_key: The S3/R2 object key
        expiration: URL expiration time in seconds (defaults to settings value)
    
    Returns:
        A pre-signed URL string
    
    Raises:
        R2UploadError: If URL generation fails
    """
    try:
        client = get_r2_client()
        bucket_name = settings.R2_BUCKET_NAME
        
        if not bucket_name:
            raise R2UploadError("R2_BUCKET_NAME is not configured")
        
        if expiration is None:
            expiration = settings.R2_SIGNED_URL_EXPIRATION
        
        signed_url = client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
            },
            ExpiresIn=expiration,
        )
        
        return signed_url
        
    except Exception as e:
        logger.error(f"Failed to generate signed URL: {e}")
        raise R2UploadError(f"Failed to generate signed URL: {str(e)}")


def delete_image_from_r2(object_key: str) -> bool:
    """
    Delete an image from R2.
    
    This is useful for cleanup operations if a transaction fails
    after the image was uploaded.
    
    Args:
        object_key: The S3/R2 object key to delete
    
    Returns:
        True if deletion was successful, False otherwise
    """
    try:
        client = get_r2_client()
        bucket_name = settings.R2_BUCKET_NAME
        
        client.delete_object(
            Bucket=bucket_name,
            Key=object_key,
        )
        
        logger.info(f"Deleted object from R2: {object_key}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to delete object from R2: {e}")
        return False
