"""
Custom exception handlers for Django REST Framework.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that ensures all errors return JSON.
    
    This catches exceptions that occur during authentication and
    other processing that happens before the view is called.
    """
    # Print to console for debugging
    print(f"\n{'='*60}")
    print(f"EXCEPTION TYPE: {type(exc).__name__}")
    print(f"EXCEPTION: {exc}")
    print(f"TRACEBACK:\n{traceback.format_exc()}")
    print(f"{'='*60}\n")
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If response is None, DRF didn't handle the exception
    # so we handle it ourselves to ensure JSON response
    if response is None:
        logger.exception(f"Unhandled exception: {exc}")
        return Response(
            {
                "success": False,
                "error": "Internal server error",
                "detail": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc(),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
    # Add consistent format to all error responses
    if response is not None:
        error_detail = response.data.get("detail", str(response.data)) if isinstance(response.data, dict) else str(response.data)
        response.data = {
            "success": False,
            "error": error_detail,
            "detail": str(response.data),
        }
    
    return response
