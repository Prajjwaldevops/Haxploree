"""
Serializers for the Deposits API.

These handle request validation and response formatting.
"""

from rest_framework import serializers


class UploadRequestSerializer(serializers.Serializer):
    """
    Validates the image upload request.
    
    Expects multipart/form-data with an 'image' file field.
    """
    image = serializers.ImageField(
        required=True,
        help_text="E-waste image file (JPEG, PNG, WebP)",
    )
    
    def validate_image(self, value):
        """
        Additional validation for the uploaded image.
        """
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"Image file too large. Maximum size is {max_size // (1024*1024)}MB."
            )
        
        # Check file extension
        allowed_extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
        ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        return value


class UploadResponseSerializer(serializers.Serializer):
    """
    Formats the successful upload response.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    image_url = serializers.URLField()
    transaction_id = serializers.UUIDField()
    status = serializers.CharField()


class ErrorResponseSerializer(serializers.Serializer):
    """
    Formats error responses.
    """
    success = serializers.BooleanField(default=False)
    error = serializers.CharField()
    detail = serializers.CharField(required=False)
