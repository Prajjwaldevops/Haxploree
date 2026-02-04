"""
Clerk JWT Authentication for Django REST Framework.

This module verifies Clerk-issued JWTs using the JWKS endpoint.
It extracts the Clerk user ID (sub claim) for identifying users.
"""

import logging
from typing import Any, Tuple, Optional
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from django.conf import settings


logger = logging.getLogger(__name__)


class ClerkUser:
    """
    Lightweight user object representing a Clerk-authenticated user.
    
    This is not a Django User model - it's a simple container for the
    Clerk user ID and claims extracted from the JWT.
    """
    
    def __init__(self, clerk_user_id: str, email: Optional[str] = None, claims: dict = None):
        self.clerk_user_id = clerk_user_id
        self.email = email
        self.claims = claims or {}
        # Required by DRF's permission checks
        self.is_authenticated = True
    
    def __str__(self):
        return f"ClerkUser({self.clerk_user_id})"


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    """
    Get a cached JWKS client for Clerk JWT verification.
    
    The JWKS client fetches and caches the public keys from Clerk's
    JWKS endpoint, which are used to verify JWT signatures.
    """
    jwks_url = settings.CLERK_JWKS_URL
    if not jwks_url:
        raise AuthenticationFailed("CLERK_JWKS_URL is not configured")
    
    return PyJWKClient(jwks_url)


class ClerkJWTAuthentication(BaseAuthentication):
    """
    DRF authentication class that verifies Clerk JWTs.
    
    Expected header format:
        Authorization: Bearer <clerk_jwt_token>
    
    On success, returns (ClerkUser, token) tuple.
    On failure, raises AuthenticationFailed exception.
    """
    
    keyword = 'Bearer'
    
    def authenticate(self, request: Request) -> Optional[Tuple[ClerkUser, str]]:
        """
        Authenticate the request and return a (user, token) tuple.
        
        Returns None if no Authorization header is present (allows
        anonymous access to views that don't require authentication).
        """
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            # No auth header - let permission classes decide what to do
            return None
        
        # Split "Bearer <token>"
        parts = auth_header.split()
        
        if len(parts) != 2:
            raise AuthenticationFailed("Invalid Authorization header format")
        
        if parts[0] != self.keyword:
            raise AuthenticationFailed(f"Expected '{self.keyword}' authentication scheme")
        
        token = parts[1]
        
        return self._authenticate_token(token)
    
    def _authenticate_token(self, token: str) -> Tuple[ClerkUser, str]:
        """
        Verify the JWT token and extract user information.
        """
        try:
            print(f"\n[AUTH] Starting token verification...")
            print(f"[AUTH] Token (first 50 chars): {token[:50]}...")
            
            # Get the signing key from Clerk's JWKS
            jwks_client = get_jwks_client()
            print(f"[AUTH] Got JWKS client, fetching signing key...")
            
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            print(f"[AUTH] Got signing key: {signing_key.key_id}")
            
            # Decode and verify the token
            # Clerk tokens typically use RS256 algorithm
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "require": ["sub", "exp", "iat"],
                }
            )
            print(f"[AUTH] Token decoded successfully!")
            print(f"[AUTH] Payload keys: {list(payload.keys())}")
            
            # Extract the Clerk user ID from the 'sub' claim
            clerk_user_id = payload.get("sub")
            if not clerk_user_id:
                raise AuthenticationFailed("Token missing 'sub' claim")
            
            # Optionally extract email if present
            email = payload.get("email")
            
            print(f"[AUTH] Successfully authenticated: {clerk_user_id}")
            logger.info(f"Successfully authenticated Clerk user: {clerk_user_id}")
            
            return (ClerkUser(clerk_user_id, email, payload), token)
            
        except jwt.ExpiredSignatureError:
            print(f"[AUTH] ERROR: Token has expired")
            logger.warning("JWT token has expired")
            raise AuthenticationFailed("Token has expired")
        
        except jwt.InvalidTokenError as e:
            print(f"[AUTH] ERROR: Invalid token - {e}")
            logger.warning(f"Invalid JWT token: {e}")
            raise AuthenticationFailed(f"Invalid token: {str(e)}")
        
        except Exception as e:
            print(f"[AUTH] ERROR: Unexpected error - {type(e).__name__}: {e}")
            import traceback
            print(f"[AUTH] Traceback:\n{traceback.format_exc()}")
            logger.error(f"Unexpected authentication error: {e}")
            raise AuthenticationFailed("Authentication failed")
    
    def authenticate_header(self, request: Request) -> str:
        """
        Return the WWW-Authenticate header value for 401 responses.
        """
        return self.keyword
