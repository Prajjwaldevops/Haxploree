"""
Supabase Client Service.

This module handles all interactions with the Supabase Postgres database
via the Supabase REST API (PostgREST).

We use httpx for HTTP requests instead of the official supabase-py client
to avoid build dependencies (pyroaring) that may fail on Windows.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

import httpx
from django.conf import settings


logger = logging.getLogger(__name__)


class SupabaseError(Exception):
    """Custom exception for Supabase operation failures."""
    pass


def get_supabase_headers() -> Dict[str, str]:
    """
    Get the headers required for Supabase REST API requests.
    
    Uses the service role key for full database access.
    """
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise SupabaseError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",  # Return the inserted/updated row
    }


def get_supabase_url(table: str) -> str:
    """
    Construct the Supabase REST API URL for a table.
    """
    if not settings.SUPABASE_URL:
        raise SupabaseError("SUPABASE_URL is not configured")
    
    base_url = settings.SUPABASE_URL.rstrip('/')
    return f"{base_url}/rest/v1/{table}"


def get_user_by_clerk_id(clerk_id: str) -> Optional[Dict[str, Any]]:
    """
    Find a Supabase user by their Clerk ID.
    
    The users table has:
    - id (UUID): Supabase user ID
    - clerk_id (TEXT, UNIQUE): Clerk user ID
    
    Args:
        clerk_id: The Clerk user ID (from JWT 'sub' claim)
    
    Returns:
        User dict with 'id' and 'clerk_id', or None if not found
    
    Raises:
        SupabaseError: If the query fails
    """
    try:
        url = get_supabase_url("users")
        headers = get_supabase_headers()
        
        # Query by clerk_id
        params = {
            "clerk_id": f"eq.{clerk_id}",
            "select": "id,clerk_id",
        }
        
        logger.info(f"Looking up user by clerk_id: {clerk_id}")
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            users = response.json()
            
            if not users:
                logger.warning(f"No user found with clerk_id: {clerk_id}")
                return None
            
            logger.info(f"Found user: {users[0]['id']}")
            return users[0]
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase query failed: {e}")
        raise SupabaseError(f"Failed to query users: {e.response.text}")
    except Exception as e:
        logger.error(f"Unexpected error querying Supabase: {e}")
        raise SupabaseError(f"Failed to query users: {str(e)}")


def create_user_if_not_exists(clerk_id: str) -> Dict[str, Any]:
    """
    Get or create a user by Clerk ID.
    
    If the user doesn't exist in Supabase, creates a new record.
    This handles the case where a Clerk user hasn't been synced yet.
    
    Args:
        clerk_id: The Clerk user ID
    
    Returns:
        User dict with 'id' and 'clerk_id'
    
    Raises:
        SupabaseError: If the operation fails
    """
    print(f"\n[SUPABASE] create_user_if_not_exists called for: {clerk_id}")
    
    # First try to find existing user
    user = get_user_by_clerk_id(clerk_id)
    if user:
        print(f"[SUPABASE] Found existing user: {user['id']}")
        return user
    
    print(f"[SUPABASE] No user found, creating new user...")
    
    # Create new user if not found
    try:
        url = get_supabase_url("users")
        headers = get_supabase_headers()
        
        data = {
            "clerk_id": clerk_id,
        }
        
        print(f"[SUPABASE] POST to: {url}")
        print(f"[SUPABASE] Data: {data}")
        
        logger.info(f"Creating new user for clerk_id: {clerk_id}")
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=data)
            print(f"[SUPABASE] Response status: {response.status_code}")
            print(f"[SUPABASE] Response body: {response.text[:500] if response.text else 'empty'}")
            
            response.raise_for_status()
            
            users = response.json()
            
            if not users:
                raise SupabaseError("User creation returned empty response")
            
            print(f"[SUPABASE] Created user: {users[0]}")
            logger.info(f"Created new user: {users[0]['id']}")
            return users[0]
            
    except httpx.HTTPStatusError as e:
        print(f"[SUPABASE] HTTP Error: {e.response.status_code} - {e.response.text}")
        # Handle unique constraint violation (user created by another request)
        if e.response.status_code == 409:
            logger.info("User was created by another request, retrying lookup")
            user = get_user_by_clerk_id(clerk_id)
            if user:
                return user
        
        logger.error(f"Failed to create user: {e}")
        raise SupabaseError(f"Failed to create user: {e.response.text}")
    except Exception as e:
        print(f"[SUPABASE] Exception: {type(e).__name__}: {e}")
        import traceback
        print(f"[SUPABASE] Traceback: {traceback.format_exc()}")
        logger.error(f"Unexpected error creating user: {e}")
        raise SupabaseError(f"Failed to create user: {str(e)}")


def insert_transaction(
    user_id: str,
    image_url: str,
    r2_object_key: str,
    status: str = "pending",
    detected_confidence: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Insert a new transaction record.
    
    The transactions table has:
    - id (UUID): Transaction ID (auto-generated)
    - user_id (UUID, FK -> users.id): Foreign key to users table
    - image_url (TEXT): URL to access the image (signed URL)
    - detected_confidence (FLOAT, nullable): ML confidence score
    - status (TEXT): Transaction status
    - created_at (TIMESTAMP): When the transaction was created
    
    We also store r2_object_key in metadata for URL regeneration.
    
    Args:
        user_id: Supabase user ID (UUID)
        image_url: The signed URL for the uploaded image
        r2_object_key: The R2 object key (for URL regeneration)
        status: Transaction status (default: 'pending')
        detected_confidence: Optional ML confidence score
    
    Returns:
        The inserted transaction record
    
    Raises:
        SupabaseError: If the insert fails
    """
    try:
        url = get_supabase_url("transactions")
        headers = get_supabase_headers()
        
        data = {
            "user_id": user_id,
            "image_url": image_url,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Only include detected_confidence if provided
        if detected_confidence is not None:
            data["detected_confidence"] = detected_confidence
        
        logger.info(f"Inserting transaction for user: {user_id}")
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            transactions = response.json()
            
            if not transactions:
                raise SupabaseError("Transaction insert returned empty response")
            
            transaction = transactions[0]
            logger.info(f"Created transaction: {transaction['id']}")
            
            return transaction
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to insert transaction: {e}")
        raise SupabaseError(f"Failed to insert transaction: {e.response.text}")
    except Exception as e:
        logger.error(f"Unexpected error inserting transaction: {e}")
        raise SupabaseError(f"Failed to insert transaction: {str(e)}")


def update_transaction(
    transaction_id: str,
    **kwargs
) -> Optional[Dict[str, Any]]:
    """
    Update an existing transaction record.
    
    This is useful for:
    - Updating status after ML processing
    - Adding detected_confidence after inference
    - Updating image_url with a fresh signed URL
    
    Args:
        transaction_id: The transaction UUID
        **kwargs: Fields to update (status, detected_confidence, image_url)
    
    Returns:
        The updated transaction record, or None if not found
    
    Raises:
        SupabaseError: If the update fails
    """
    try:
        url = get_supabase_url("transactions")
        headers = get_supabase_headers()
        
        # Filter by transaction ID
        params = {"id": f"eq.{transaction_id}"}
        
        logger.info(f"Updating transaction: {transaction_id}")
        
        with httpx.Client() as client:
            response = client.patch(url, headers=headers, params=params, json=kwargs)
            response.raise_for_status()
            
            transactions = response.json()
            
            if not transactions:
                logger.warning(f"Transaction not found: {transaction_id}")
                return None
            
            logger.info(f"Updated transaction: {transaction_id}")
            return transactions[0]
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to update transaction: {e}")
        raise SupabaseError(f"Failed to update transaction: {e.response.text}")
    except Exception as e:
        logger.error(f"Unexpected error updating transaction: {e}")
        raise SupabaseError(f"Failed to update transaction: {str(e)}")
