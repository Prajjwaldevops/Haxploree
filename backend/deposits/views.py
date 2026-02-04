"""
Deposits API Views.

This module contains the main upload endpoint for e-waste image deposits.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .serializers import UploadRequestSerializer
from .services.r2_upload import upload_image_to_r2, R2UploadError, delete_image_from_r2
from .services.supabase_client import (
    create_user_if_not_exists,
    insert_transaction,
    SupabaseError,
)


logger = logging.getLogger(__name__)


class DepositUploadView(APIView):
    """
    POST /api/deposits/upload/
    
    Upload an e-waste image and create a transaction record.
    
    This endpoint:
    1. Authenticates the user via Clerk JWT
    2. Validates the uploaded image
    3. Uploads the image to Cloudflare R2
    4. Creates/finds the user in Supabase
    5. Creates a transaction record with pending status
    6. Returns the image URL and transaction ID
    
    The image URL is a signed URL suitable for ML model inference.
    """
    
    permission_classes = [IsAuthenticated]
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch to catch ALL exceptions and return JSON."""
        try:
            return super().dispatch(request, *args, **kwargs)
        except Exception as e:
            logger.exception(f"Unhandled exception in deposit upload: {e}")
            return Response(
                {
                    "success": False,
                    "error": "Internal server error",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
    def post(self, request):
        """
        Handle image upload and transaction creation.
        """
        # Get the authenticated Clerk user from the request
        # This is set by ClerkJWTAuthentication
        clerk_user = request.user
        clerk_user_id = clerk_user.clerk_user_id
        
        logger.info(f"Processing upload for Clerk user: {clerk_user_id}")
        
        # Validate the request
        serializer = UploadRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Invalid upload request: {serializer.errors}")
            return Response(
                {
                    "success": False,
                    "error": "Invalid request",
                    "detail": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        image = serializer.validated_data['image']
        image_data = image.read()
        original_filename = image.name
        
        # Track the R2 object key for cleanup on failure
        r2_object_key = None
        
        try:
            # Step 1: Upload image to Cloudflare R2
            logger.info(f"Uploading image to R2: {original_filename}")
            r2_object_key, signed_url = upload_image_to_r2(
                file_data=image_data,
                original_filename=original_filename,
                clerk_user_id=clerk_user_id,
            )
            logger.info(f"Image uploaded successfully: {r2_object_key}")
            
            # Step 2: Find or create user in Supabase
            logger.info(f"Looking up/creating Supabase user for: {clerk_user_id}")
            supabase_user = create_user_if_not_exists(clerk_user_id)
            supabase_user_id = supabase_user['id']
            logger.info(f"Supabase user ID: {supabase_user_id}")
            
            # Step 3: Create transaction record
            logger.info("Creating transaction record")
            transaction = insert_transaction(
                user_id=supabase_user_id,
                image_url=signed_url,
                r2_object_key=r2_object_key,
                status="pending",
            )
            
            logger.info(f"Transaction created: {transaction['id']}")
            
            # Return success response
            return Response(
                {
                    "success": True,
                    "message": "Image uploaded successfully",
                    "image_url": signed_url,
                    "transaction_id": transaction['id'],
                    "status": "pending",
                },
                status=status.HTTP_201_CREATED,
            )
            
        except R2UploadError as e:
            logger.error(f"R2 upload failed: {e}")
            return Response(
                {
                    "success": False,
                    "error": "Image upload failed",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            
        except SupabaseError as e:
            # If Supabase fails after R2 upload, cleanup the R2 object
            if r2_object_key:
                logger.info(f"Cleaning up R2 object after Supabase failure: {r2_object_key}")
                delete_image_from_r2(r2_object_key)
            
            logger.error(f"Supabase operation failed: {e}")
            return Response(
                {
                    "success": False,
                    "error": "Database operation failed",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            
        except Exception as e:
            # Cleanup R2 on any unexpected error
            if r2_object_key:
                logger.info(f"Cleaning up R2 object after error: {r2_object_key}")
                delete_image_from_r2(r2_object_key)
            
            logger.exception(f"Unexpected error during upload: {e}")
            return Response(
                {
                    "success": False,
                    "error": "An unexpected error occurred",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HealthCheckView(APIView):
    """
    GET /api/health/
    
    Simple health check endpoint (no authentication required).
    Useful for monitoring and load balancer health checks.
    """
    
    permission_classes = []  # No auth required
    authentication_classes = []  # Skip auth entirely
    
    def get(self, request):
        return Response({"status": "ok", "service": "deposits-api"})


class DebugConfigView(APIView):
    """
    GET /api/deposits/debug/
    
    Debug endpoint to test configuration (no auth). Remove in production!
    """
    
    permission_classes = []
    authentication_classes = []
    
    def get(self, request):
        from django.conf import settings
        import traceback
        
        result = {
            "r2_configured": False,
            "r2_test": None,
            "supabase_configured": False,
            "clerk_configured": False,
            "errors": []
        }
        
        # Check R2 config
        try:
            result["r2_access_key"] = bool(settings.R2_ACCESS_KEY_ID)
            result["r2_secret_key"] = bool(settings.R2_SECRET_ACCESS_KEY)
            result["r2_bucket"] = settings.R2_BUCKET_NAME
            result["r2_endpoint"] = settings.R2_ENDPOINT_URL
            
            if all([settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY, 
                   settings.R2_BUCKET_NAME, settings.R2_ENDPOINT_URL]):
                result["r2_configured"] = True
                
                # Try to list bucket (will fail if credentials wrong)
                try:
                    from .services.r2_upload import get_r2_client
                    client = get_r2_client()
                    # Just try to head the bucket
                    client.head_bucket(Bucket=settings.R2_BUCKET_NAME)
                    result["r2_test"] = "SUCCESS - bucket accessible"
                except Exception as e:
                    result["r2_test"] = f"FAILED: {str(e)}"
                    result["errors"].append(f"R2: {traceback.format_exc()}")
        except Exception as e:
            result["errors"].append(f"R2 config error: {str(e)}")
        
        # Check Supabase config
        try:
            result["supabase_url"] = bool(settings.SUPABASE_URL)
            result["supabase_key"] = bool(settings.SUPABASE_SERVICE_ROLE_KEY)
            result["supabase_configured"] = bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            result["errors"].append(f"Supabase config error: {str(e)}")
        
        # Check Clerk config
        try:
            result["clerk_jwks_url"] = settings.CLERK_JWKS_URL
            result["clerk_configured"] = bool(settings.CLERK_JWKS_URL)
        except Exception as e:
            result["errors"].append(f"Clerk config error: {str(e)}")
        
        return Response(result)

