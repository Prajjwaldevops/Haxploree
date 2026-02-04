"""
Quick test script for the deposits API.
Run from backend folder: python test_api.py
"""

import requests

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    try:
        r = requests.get(f"{BASE_URL}/api/deposits/health/")
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        return r.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_debug():
    """Test debug/config endpoint"""
    print("\n=== Testing Debug Endpoint ===")
    try:
        r = requests.get(f"{BASE_URL}/api/deposits/debug/")
        print(f"Status: {r.status_code}")
        data = r.json()
        print(f"R2 Configured: {data.get('r2_configured')}")
        print(f"R2 Test: {data.get('r2_test')}")
        print(f"Supabase Configured: {data.get('supabase_configured')}")
        print(f"Clerk Configured: {data.get('clerk_configured')}")
        if data.get('errors'):
            print(f"Errors: {data.get('errors')}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_upload():
    """Test upload with a dummy image (no auth)"""
    print("\n=== Testing Test-Upload Endpoint ===")
    try:
        # Create a minimal PNG file for testing
        # This is a 1x1 white PNG
        PNG_DATA = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG header
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'image': ('test.png', PNG_DATA, 'image/png')}
        
        r = requests.post(f"{BASE_URL}/api/deposits/test-upload/", files=files)
        print(f"Status: {r.status_code}")
        
        try:
            data = r.json()
            print(f"Success: {data.get('success')}")
            if data.get('success'):
                print(f"Object Key: {data.get('object_key')}")
            else:
                print(f"Error: {data.get('error')}")
                if data.get('traceback'):
                    print(f"Traceback:\n{data.get('traceback')}")
        except:
            print(f"Response text: {r.text[:500]}")
        
        return r.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("DEPOSITS API TEST")
    print("=" * 60)
    
    test_health()
    test_debug()
    test_upload()
    
    print("\n" + "=" * 60)
    print("TESTS COMPLETE")
    print("=" * 60)
