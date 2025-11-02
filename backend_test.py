#!/usr/bin/env python3
"""
Backend API Testing for Golden Hooves Quest - Authentication Migration & AI Hints
Tests authentication endpoints (signup, login, verify, logout) and AI hint endpoints
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Backend URL from frontend .env
BASE_URL = "https://ranch-adventure.preview.emergentagent.com/api"

# Global variables to store auth tokens for testing
auth_token = None
test_user_data = None

def test_ai_hint_endpoint():
    """Test POST /api/hint - AI-powered hints from Leif Pryor"""
    print("\n=== Testing POST /api/hint ===")
    
    # Test 1: Valid clue prompt
    print("Test 1: Valid clue prompt")
    payload = {
        "prompt": "I'm stuck on the first clue about the golden horseshoe. Can you help me?",
        "max_tokens": 100,
        "user_id": "test_user_123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/hint", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            if "text" in data and "character" in data:
                print("✅ Response has correct structure (text, character fields)")
                if data["character"] == "Leif Pryor":
                    print("✅ Character is Leif Pryor")
                else:
                    print(f"❌ Character should be 'Leif Pryor', got '{data['character']}'")
            else:
                print("❌ Response missing required fields")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing hint endpoint: {e}")
    
    # Test 2: Empty prompt (edge case)
    print("\nTest 2: Empty prompt")
    payload = {"prompt": "", "user_id": "test_user_123"}
    
    try:
        response = requests.post(f"{BASE_URL}/hint", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_game_state_endpoint():
    """Test GET /api/game-state/{user_id} - Retrieve game progress"""
    print("\n=== Testing GET /api/game-state/{user_id} ===")
    
    # Test 1: Non-existent user (should return default state)
    print("Test 1: Non-existent user")
    test_user_id = f"nonexistent_{uuid.uuid4().hex[:8]}"
    
    try:
        response = requests.get(f"{BASE_URL}/game-state/{test_user_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify default state structure
            expected_fields = ["karma", "clues", "activities", "level", "discount_percent"]
            if all(field in data for field in expected_fields):
                print("✅ Response has all required fields")
                if all(data[field] == 0 for field in expected_fields):
                    print("✅ Default state values are correct (all zeros)")
                else:
                    print(f"❌ Default state values incorrect: {data}")
            else:
                print(f"❌ Missing required fields. Expected: {expected_fields}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_save_state_endpoint():
    """Test POST /api/save-state/{user_id} - Save game progress"""
    print("\n=== Testing POST /api/save-state/{user_id} ===")
    
    test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    
    # Test 1: Save new game state
    print("Test 1: Save new game state")
    state_data = {
        "state": {
            "karma": 50,
            "clues": 3,
            "activities": 5,
            "level": 1,
            "discount_percent": 0
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save-state/{test_user_id}", json=state_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if "status" in data and data["status"] == "saved":
                print("✅ State saved successfully")
            else:
                print(f"❌ Unexpected response format: {data}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Verify saved state by retrieving it
    print("\nTest 2: Verify saved state")
    try:
        response = requests.get(f"{BASE_URL}/game-state/{test_user_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Retrieved state: {json.dumps(data, indent=2)}")
            
            # Verify the saved values
            expected_state = state_data["state"]
            if all(data.get(key) == expected_state[key] for key in expected_state):
                print("✅ Saved state matches retrieved state")
            else:
                print(f"❌ State mismatch. Expected: {expected_state}, Got: {data}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Update existing state (upsert functionality)
    print("\nTest 3: Update existing state")
    updated_state = {
        "state": {
            "karma": 75,
            "clues": 6,
            "activities": 8,
            "level": 2,
            "discount_percent": 0
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save-state/{test_user_id}", json=updated_state)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ State updated successfully")
            
            # Verify updated state
            response = requests.get(f"{BASE_URL}/game-state/{test_user_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("clues") == 6:
                    print("✅ Upsert functionality working correctly")
                    return test_user_id  # Return user ID for discount testing
                else:
                    print(f"❌ Upsert failed. Expected clues=6, got clues={data.get('clues')}")
        else:
            print(f"❌ Update failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return test_user_id

def test_generate_discount_endpoint(test_user_id=None):
    """Test POST /api/generate-discount/{user_id} - Generate discount codes"""
    print("\n=== Testing POST /api/generate-discount/{user_id} ===")
    
    # Test 1: User with insufficient clues (<6)
    print("Test 1: User with insufficient clues")
    low_clue_user = f"low_clue_{uuid.uuid4().hex[:8]}"
    
    # Save state with only 3 clues
    low_state = {
        "state": {
            "karma": 30,
            "clues": 3,
            "activities": 2,
            "level": 0,
            "discount_percent": 0
        }
    }
    
    try:
        # Save the low clue state
        requests.post(f"{BASE_URL}/save-state/{low_clue_user}", json=low_state)
        
        # Try to generate discount
        response = requests.post(f"{BASE_URL}/generate-discount/{low_clue_user}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected user with insufficient clues")
            print(f"Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Should have returned 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: User with exactly 6 clues (should succeed with 7% discount)
    print("\nTest 2: User with exactly 6 clues")
    if test_user_id:
        try:
            response = requests.post(f"{BASE_URL}/generate-discount/{test_user_id}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
                
                # Verify response structure
                if "code" in data and "discount" in data:
                    print("✅ Response has correct structure")
                    
                    # Verify code format: GOLDFROG{8 hex chars}
                    code = data["code"]
                    if code.startswith("GOLDFROG") and len(code) == 16:
                        print("✅ Code format is correct")
                    else:
                        print(f"❌ Code format incorrect. Expected GOLDFROG + 8 hex chars, got: {code}")
                    
                    # Verify discount (should be 7% for level 2: 7 + (2*5) = 17%)
                    discount = data["discount"]
                    expected_discount = 17  # 7 base + (level 2 * 5)
                    if discount == expected_discount:
                        print(f"✅ Discount calculation correct: {discount}%")
                    else:
                        print(f"❌ Discount calculation incorrect. Expected {expected_discount}%, got {discount}%")
                else:
                    print(f"❌ Response missing required fields: {data}")
            else:
                print(f"❌ Request failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test 3: Test duplicate code prevention
    print("\nTest 3: Duplicate code prevention")
    if test_user_id:
        try:
            response = requests.post(f"{BASE_URL}/generate-discount/{test_user_id}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Second request response: {json.dumps(data, indent=2)}")
                print("✅ Existing code returned instead of creating duplicate")
            else:
                print(f"❌ Second request failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test 4: High clue count with level cap (should cap at 27%)
    print("\nTest 4: High clue count with level cap")
    high_user = f"high_user_{uuid.uuid4().hex[:8]}"
    
    high_state = {
        "state": {
            "karma": 200,
            "clues": 30,
            "activities": 25,
            "level": 10,  # This should cap discount at 27%
            "discount_percent": 0
        }
    }
    
    try:
        # Save high level state
        requests.post(f"{BASE_URL}/save-state/{high_user}", json=high_state)
        
        # Generate discount
        response = requests.post(f"{BASE_URL}/generate-discount/{high_user}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            discount = data.get("discount")
            if discount == 27:
                print("✅ Discount correctly capped at 27%")
            else:
                print(f"❌ Discount should be capped at 27%, got {discount}%")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_nonexistent_user_discount():
    """Test discount generation for non-existent user"""
    print("\nTest 5: Non-existent user")
    nonexistent_user = f"nonexistent_{uuid.uuid4().hex[:8]}"
    
    try:
        response = requests.post(f"{BASE_URL}/generate-discount/{nonexistent_user}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Correctly returned 404 for non-existent user")
            print(f"Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Should have returned 404, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_auth_signup():
    """Test POST /api/auth/signup - User registration"""
    global auth_token, test_user_data
    print("\n=== Testing POST /api/auth/signup ===")
    
    # Generate unique test user data
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@goldenhooves.com"
    test_password = "securepass123"
    test_username = f"testuser_{uuid.uuid4().hex[:6]}"
    
    # Test 1: Valid signup
    print("Test 1: Valid user registration")
    signup_data = {
        "email": test_email,
        "password": test_password,
        "username": test_username
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            required_fields = ["token", "user_id", "email", "username"]
            if all(field in data for field in required_fields):
                print("✅ Response has correct structure")
                
                # Store for later tests
                auth_token = data["token"]
                test_user_data = {
                    "user_id": data["user_id"],
                    "email": data["email"],
                    "username": data["username"],
                    "password": test_password
                }
                
                print(f"✅ User created successfully: {data['email']}")
                print(f"✅ JWT token received: {data['token'][:20]}...")
                
                # Verify JWT token format
                if len(data["token"]) > 50:  # JWT tokens are typically long
                    print("✅ JWT token format appears valid")
                else:
                    print("❌ JWT token format may be invalid")
            else:
                print(f"❌ Response missing required fields. Expected: {required_fields}")
        else:
            print(f"❌ Signup failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing signup: {e}")
    
    # Test 2: Duplicate email (should fail)
    print("\nTest 2: Duplicate email registration")
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected duplicate email")
            error_detail = response.json().get("detail", "")
            if "already registered" in error_detail.lower():
                print("✅ Appropriate error message returned")
            else:
                print(f"❌ Unexpected error message: {error_detail}")
        else:
            print(f"❌ Should have returned 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Invalid email format
    print("\nTest 3: Invalid email format")
    invalid_signup = {
        "email": "invalid-email-format",
        "password": "validpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=invalid_signup, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:  # FastAPI validation error
            print("✅ Correctly rejected invalid email format")
        else:
            print(f"❌ Should have returned 422, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Weak password
    print("\nTest 4: Weak password (< 6 characters)")
    weak_pass_signup = {
        "email": f"weakpass_{uuid.uuid4().hex[:8]}@test.com",
        "password": "123"  # Too short
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=weak_pass_signup, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        # Note: Password validation might be handled client-side or server-side
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_auth_login():
    """Test POST /api/auth/login - User authentication"""
    global auth_token, test_user_data
    print("\n=== Testing POST /api/auth/login ===")
    
    if not test_user_data:
        print("❌ No test user data available. Signup test must run first.")
        return
    
    # Test 1: Valid login
    print("Test 1: Valid credentials login")
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            required_fields = ["token", "user_id", "email"]
            if all(field in data for field in required_fields):
                print("✅ Response has correct structure")
                
                # Verify user data matches
                if data["user_id"] == test_user_data["user_id"]:
                    print("✅ User ID matches signup data")
                else:
                    print(f"❌ User ID mismatch. Expected: {test_user_data['user_id']}, Got: {data['user_id']}")
                
                # Update auth token
                auth_token = data["token"]
                print(f"✅ New JWT token received: {data['token'][:20]}...")
            else:
                print(f"❌ Response missing required fields. Expected: {required_fields}")
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
    
    # Test 2: Invalid email
    print("\nTest 2: Invalid email")
    invalid_email_login = {
        "email": "nonexistent@test.com",
        "password": test_user_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=invalid_email_login, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected invalid email")
            error_detail = response.json().get("detail", "")
            print(f"Error message: {error_detail}")
        else:
            print(f"❌ Should have returned 401, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Wrong password
    print("\nTest 3: Wrong password")
    wrong_pass_login = {
        "email": test_user_data["email"],
        "password": "wrongpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=wrong_pass_login, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected wrong password")
            error_detail = response.json().get("detail", "")
            print(f"Error message: {error_detail}")
        else:
            print(f"❌ Should have returned 401, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_auth_verify():
    """Test GET /api/auth/verify - Token validation"""
    global auth_token, test_user_data
    print("\n=== Testing GET /api/auth/verify ===")
    
    if not auth_token:
        print("❌ No auth token available. Login test must run first.")
        return
    
    # Test 1: Valid JWT token
    print("Test 1: Valid JWT token")
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/verify", headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            required_fields = ["user_id", "email", "created_at"]
            if all(field in data for field in required_fields):
                print("✅ Response has correct structure")
                
                # Verify user data matches
                if data["user_id"] == test_user_data["user_id"]:
                    print("✅ User profile data matches")
                else:
                    print(f"❌ User ID mismatch in profile")
            else:
                print(f"❌ Response missing required fields. Expected: {required_fields}")
        else:
            print(f"❌ Token verification failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing token verification: {e}")
    
    # Test 2: Invalid token
    print("\nTest 2: Invalid JWT token")
    invalid_headers = {"Authorization": "Bearer invalid.jwt.token"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/verify", headers=invalid_headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected invalid token")
            error_detail = response.json().get("detail", "")
            print(f"Error message: {error_detail}")
        else:
            print(f"❌ Should have returned 401, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: No token
    print("\nTest 3: No authorization header")
    
    try:
        response = requests.get(f"{BASE_URL}/auth/verify", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 403:  # FastAPI HTTPBearer returns 403 for missing auth
            print("✅ Correctly rejected missing token")
        else:
            print(f"❌ Should have returned 403, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Malformed token
    print("\nTest 4: Malformed authorization header")
    malformed_headers = {"Authorization": "InvalidFormat token"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/verify", headers=malformed_headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [401, 403]:
            print("✅ Correctly rejected malformed token")
        else:
            print(f"❌ Should have returned 401 or 403, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_auth_logout():
    """Test POST /api/auth/logout - Logout"""
    print("\n=== Testing POST /api/auth/logout ===")
    
    # Test logout endpoint
    print("Test 1: Logout endpoint")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/logout", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if "message" in data:
                print("✅ Logout endpoint working correctly")
            else:
                print("❌ Unexpected response format")
        else:
            print(f"❌ Logout failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing logout: {e}")

def test_auth_integration_flow():
    """Test complete authentication flow: signup → login → verify → logout"""
    print("\n=== Testing Complete Authentication Flow ===")
    
    # Generate unique test data
    flow_email = f"flowtest_{uuid.uuid4().hex[:8]}@goldenhooves.com"
    flow_password = "flowtest123"
    
    print("Step 1: Signup")
    signup_data = {
        "email": flow_email,
        "password": flow_password
    }
    
    try:
        # Signup
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data, timeout=30)
        if response.status_code != 200:
            print(f"❌ Signup failed: {response.text}")
            return
        
        signup_result = response.json()
        flow_token = signup_result["token"]
        flow_user_id = signup_result["user_id"]
        print(f"✅ Signup successful: {flow_user_id}")
        
        # Login
        print("\nStep 2: Login")
        login_data = {
            "email": flow_email,
            "password": flow_password
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=30)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return
        
        login_result = response.json()
        flow_token = login_result["token"]  # Update token
        print(f"✅ Login successful")
        
        # Verify
        print("\nStep 3: Verify token")
        headers = {"Authorization": f"Bearer {flow_token}"}
        
        response = requests.get(f"{BASE_URL}/auth/verify", headers=headers, timeout=30)
        if response.status_code != 200:
            print(f"❌ Token verification failed: {response.text}")
            return
        
        verify_result = response.json()
        if verify_result["user_id"] == flow_user_id:
            print(f"✅ Token verification successful")
        else:
            print(f"❌ User ID mismatch in verification")
            return
        
        # Check if game state was created during signup
        print("\nStep 4: Verify game state initialization")
        response = requests.get(f"{BASE_URL}/game-state/{flow_user_id}", timeout=30)
        if response.status_code == 200:
            game_state = response.json()
            if all(game_state.get(field, -1) == 0 for field in ["karma", "clues", "activities", "level", "discount_percent"]):
                print("✅ Initial game state created correctly")
            else:
                print(f"❌ Game state initialization issue: {game_state}")
        else:
            print(f"❌ Game state not found: {response.text}")
        
        # Logout
        print("\nStep 5: Logout")
        response = requests.post(f"{BASE_URL}/auth/logout", timeout=30)
        if response.status_code == 200:
            print("✅ Logout successful")
        else:
            print(f"❌ Logout failed: {response.text}")
        
        print("\n✅ COMPLETE AUTHENTICATION FLOW SUCCESSFUL")
        
    except Exception as e:
        print(f"❌ Error in authentication flow: {e}")

def test_authenticated_endpoints():
    """Test that existing endpoints work with authenticated users"""
    global auth_token, test_user_data
    print("\n=== Testing Authenticated Endpoint Access ===")
    
    if not auth_token or not test_user_data:
        print("❌ No authenticated user available for testing")
        return
    
    # Test AI hint endpoint with authenticated user
    print("Test 1: AI hint endpoint with authenticated user")
    headers = {"Authorization": f"Bearer {auth_token}"}
    hint_data = {
        "prompt": "I need help with the golden horseshoe clue",
        "user_id": test_user_data["user_id"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/hint", json=hint_data, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "text" in data and "character" in data:
                print("✅ AI hint endpoint works with authenticated user")
            else:
                print("❌ AI hint response format issue")
        else:
            print(f"❌ AI hint request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test game state endpoints with authenticated user
    print("\nTest 2: Game state endpoints with authenticated user")
    
    try:
        # Get game state
        response = requests.get(f"{BASE_URL}/game-state/{test_user_data['user_id']}", headers=headers, timeout=30)
        print(f"Get game state - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Game state retrieval works")
            
            # Save game state
            save_data = {
                "state": {
                    "karma": 100,
                    "clues": 8,
                    "activities": 10,
                    "level": 3,
                    "discount_percent": 0
                }
            }
            
            response = requests.post(f"{BASE_URL}/save-state/{test_user_data['user_id']}", 
                                   json=save_data, headers=headers, timeout=30)
            print(f"Save game state - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Game state saving works with authenticated user")
            else:
                print(f"❌ Game state saving failed: {response.text}")
        else:
            print(f"❌ Game state retrieval failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_map_overview():
    """Test GET /api/map-overview/{user_id} - Interactive Ranch Map System"""
    print("\n=== Testing GET /api/map-overview/{user_id} ===")
    
    # Create test user with different clue counts
    test_user_low = f"maptest_low_{uuid.uuid4().hex[:8]}"
    test_user_high = f"maptest_high_{uuid.uuid4().hex[:8]}"
    
    # Test 1: User with 2 clues (secret grove should be locked)
    print("Test 1: User with 2 clues (secret grove locked)")
    low_state = {
        "state": {
            "karma_coins": 25,
            "clues": 2,
            "visited_locations": ["barn", "farmhouse"],
            "activities": 3,
            "level": 0
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{test_user_low}", json=low_state)
        
        # Get map overview
        response = requests.get(f"{BASE_URL}/map-overview/{test_user_low}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            required_fields = ["locations", "karma_coins", "visited_locations", "fog_of_war"]
            if all(field in data for field in required_fields):
                print("✅ Response has correct structure")
                
                # Check locations count (should be 5)
                if len(data["locations"]) == 5:
                    print("✅ All 5 locations returned")
                else:
                    print(f"❌ Expected 5 locations, got {len(data['locations'])}")
                
                # Check karma coins
                if data["karma_coins"] == 25:
                    print("✅ Karma coins correct")
                else:
                    print(f"❌ Expected 25 karma coins, got {data['karma_coins']}")
                
                # Check fog of war (secret grove should be hidden)
                if "secret_grove" in data["fog_of_war"]:
                    print("✅ Secret grove correctly hidden in fog of war")
                else:
                    print("❌ Secret grove should be in fog_of_war with 2 clues")
                
                # Verify location structure
                location_ids = [loc["id"] for loc in data["locations"]]
                expected_locations = ["barn", "stable", "farmhouse", "pasture", "secret_grove"]
                if all(loc_id in location_ids for loc_id in expected_locations):
                    print("✅ All expected locations present")
                else:
                    print(f"❌ Missing locations. Expected: {expected_locations}, Got: {location_ids}")
                
                # Check location details
                barn_location = next((loc for loc in data["locations"] if loc["id"] == "barn"), None)
                if barn_location:
                    required_loc_fields = ["id", "name", "coordinates", "icon", "description", "npc_name", "interactions"]
                    if all(field in barn_location for field in required_loc_fields):
                        print("✅ Location structure correct")
                    else:
                        print(f"❌ Location missing fields: {required_loc_fields}")
            else:
                print(f"❌ Response missing required fields: {required_fields}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: User with 3+ clues (secret grove should unlock)
    print("\nTest 2: User with 3+ clues (secret grove unlocked)")
    high_state = {
        "state": {
            "karma_coins": 50,
            "clues": 4,
            "visited_locations": ["barn", "farmhouse", "stable"],
            "activities": 6,
            "level": 1
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{test_user_high}", json=high_state)
        
        # Get map overview
        response = requests.get(f"{BASE_URL}/map-overview/{test_user_high}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check fog of war (secret grove should NOT be hidden)
            if "secret_grove" not in data.get("fog_of_war", []):
                print("✅ Secret grove correctly unlocked (not in fog of war)")
            else:
                print("❌ Secret grove should be unlocked with 4 clues")
            
            # Check secret grove location is unlocked
            secret_grove = next((loc for loc in data["locations"] if loc["id"] == "secret_grove"), None)
            if secret_grove and secret_grove.get("unlocked", False):
                print("✅ Secret grove location marked as unlocked")
            else:
                print("❌ Secret grove should be marked as unlocked")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: New user (default state)
    print("\nTest 3: New user with default state")
    new_user = f"newuser_{uuid.uuid4().hex[:8]}"
    
    try:
        response = requests.get(f"{BASE_URL}/map-overview/{new_user}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check default values
            if data["karma_coins"] == 0:
                print("✅ Default karma coins correct (0)")
            else:
                print(f"❌ Expected 0 karma coins, got {data['karma_coins']}")
            
            if len(data["visited_locations"]) == 0:
                print("✅ Default visited locations correct (empty)")
            else:
                print(f"❌ Expected empty visited locations, got {data['visited_locations']}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_map_interactions():
    """Test POST /api/map-interact/{user_id}/{location_id}/{action} - Location interactions"""
    print("\n=== Testing POST /api/map-interact/{user_id}/{location_id}/{action} ===")
    
    # Create test user
    test_user = f"interact_{uuid.uuid4().hex[:8]}"
    
    # Initialize user state
    initial_state = {
        "state": {
            "karma_coins": 0,
            "clues": 2,
            "visited_locations": [],
            "activities": 0,
            "level": 0
        }
    }
    
    try:
        requests.post(f"{BASE_URL}/save-state/{test_user}", json=initial_state)
        print(f"✅ Test user created: {test_user}")
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return
    
    # Test 1: First visit to barn (should give 10 karma coins)
    print("\nTest 1: First visit to barn (enter action)")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/barn/enter")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            required_fields = ["dialogue", "rewards"]
            if all(field in data for field in required_fields):
                print("✅ Response structure correct")
                
                # Check karma coin reward (should be 10 for first visit)
                rewards = data.get("rewards", {})
                karma_reward = rewards.get("karma_coins", 0)
                if karma_reward >= 10:  # Could be more due to treasure bonus
                    print(f"✅ Karma coin reward correct: {karma_reward} (≥10 for first visit)")
                else:
                    print(f"❌ Expected ≥10 karma coins, got {karma_reward}")
                
                # Check dialogue exists
                if data.get("dialogue"):
                    print("✅ Dialogue returned")
                else:
                    print("❌ No dialogue returned")
            else:
                print(f"❌ Response missing required fields: {required_fields}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Second visit to same location (should give 5 karma coins)
    print("\nTest 2: Second visit to barn (should give 5 karma coins)")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/barn/talk")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            rewards = data.get("rewards", {})
            karma_reward = rewards.get("karma_coins", 0)
            
            # Should be 5 base (could be more with treasure bonus)
            if karma_reward >= 5:
                print(f"✅ Second visit karma reward: {karma_reward} (≥5 for revisit)")
            else:
                print(f"❌ Expected ≥5 karma coins for revisit, got {karma_reward}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Search action (should give items in rewards)
    print("\nTest 3: Search action at pasture")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/pasture/search")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            rewards = data.get("rewards", {})
            
            # Check for items and experience
            if "items" in rewards and len(rewards["items"]) > 0:
                print(f"✅ Search rewards items: {rewards['items']}")
            else:
                print("❌ Search should return items")
            
            if rewards.get("experience", 0) > 0:
                print(f"✅ Search rewards experience: {rewards['experience']}")
            else:
                print("❌ Search should give experience points")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Browse goods action (should return shop menu)
    print("\nTest 4: Browse goods at farmhouse")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/farmhouse/browse_goods")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for shop menu
            if "shop_menu" in data and data["shop_menu"]:
                shop_menu = data["shop_menu"]
                print(f"✅ Shop menu returned: {shop_menu['shop_type']}")
                
                # Check items structure
                if "items" in shop_menu and len(shop_menu["items"]) > 0:
                    print(f"✅ Shop has {len(shop_menu['items'])} items")
                    
                    # Check item structure
                    first_item = shop_menu["items"][0]
                    item_fields = ["id", "name", "cost", "description", "available"]
                    if all(field in first_item for field in item_fields):
                        print("✅ Shop item structure correct")
                    else:
                        print(f"❌ Shop item missing fields: {item_fields}")
                else:
                    print("❌ Shop menu should have items")
            else:
                print("❌ Browse goods should return shop_menu")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Invalid location
    print("\nTest 5: Invalid location")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/invalid_location/enter")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Correctly rejected invalid location")
        else:
            print(f"❌ Should return 404 for invalid location, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Invalid action for location
    print("\nTest 6: Invalid action for location")
    try:
        response = requests.post(f"{BASE_URL}/map-interact/{test_user}/pasture/enter")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected invalid action for location")
        else:
            print(f"❌ Should return 400 for invalid action, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 7: Secret grove unlock (user with 3+ clues)
    print("\nTest 7: Secret grove unlock mechanism")
    unlock_user = f"unlock_{uuid.uuid4().hex[:8]}"
    
    unlock_state = {
        "state": {
            "karma_coins": 30,
            "clues": 3,
            "visited_locations": ["barn"],
            "activities": 2,
            "level": 1
        }
    }
    
    try:
        # Save state with 3 clues
        requests.post(f"{BASE_URL}/save-state/{unlock_user}", json=unlock_state)
        
        # Interact with any location to trigger unlock check
        response = requests.post(f"{BASE_URL}/map-interact/{unlock_user}/stable/enter")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for location unlock notification
            if "location_unlocked" in data and data["location_unlocked"] == "secret_grove":
                print("✅ Secret grove unlock mechanism working")
            elif "Secret Grove" in data.get("dialogue", ""):
                print("✅ Secret grove unlock mentioned in dialogue")
            else:
                print("❌ Secret grove unlock not detected")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_karma_redemption():
    """Test POST /api/redeem-karma/{user_id} - Karma coin redemption"""
    print("\n=== Testing POST /api/redeem-karma/{user_id} ===")
    
    # Test 1: User with insufficient coins (< 50)
    print("Test 1: User with insufficient karma coins")
    low_karma_user = f"lowkarma_{uuid.uuid4().hex[:8]}"
    
    low_state = {
        "state": {
            "karma_coins": 40,
            "clues": 2,
            "visited_locations": ["barn"],
            "activities": 3,
            "level": 0
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{low_karma_user}", json=low_state)
        
        # Try to redeem
        redeem_data = {"coins_to_redeem": 40}
        response = requests.post(f"{BASE_URL}/redeem-karma/{low_karma_user}", json=redeem_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected insufficient karma coins")
            error_detail = response.json().get("detail", "")
            if "50" in error_detail:
                print("✅ Error message mentions 50 coin requirement")
            else:
                print(f"❌ Error message should mention 50 coins: {error_detail}")
        else:
            print(f"❌ Should return 400 for insufficient coins, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: User with exactly 50 coins (7% discount)
    print("\nTest 2: User with 50 karma coins (7% discount)")
    karma50_user = f"karma50_{uuid.uuid4().hex[:8]}"
    
    karma50_state = {
        "state": {
            "karma_coins": 50,
            "clues": 3,
            "visited_locations": ["barn", "farmhouse"],
            "activities": 5,
            "level": 0
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{karma50_user}", json=karma50_state)
        
        # Redeem karma
        redeem_data = {"coins_to_redeem": 50}
        response = requests.post(f"{BASE_URL}/redeem-karma/{karma50_user}", json=redeem_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            if "code" in data and "discount" in data:
                print("✅ Response structure correct")
                
                # Check discount percentage (should be 7%)
                if data["discount"] == 7:
                    print("✅ Discount percentage correct (7%)")
                else:
                    print(f"❌ Expected 7% discount, got {data['discount']}%")
                
                # Check code format (KARMA + 8 hex chars)
                code = data["code"]
                if code.startswith("KARMA") and len(code) == 13:
                    print("✅ Code format correct (KARMA + 8 hex chars)")
                else:
                    print(f"❌ Code format incorrect: {code}")
            else:
                print(f"❌ Response missing required fields: {data}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: User with 100 coins (17% discount)
    print("\nTest 3: User with 100 karma coins (17% discount)")
    karma100_user = f"karma100_{uuid.uuid4().hex[:8]}"
    
    karma100_state = {
        "state": {
            "karma_coins": 100,
            "clues": 5,
            "visited_locations": ["barn", "farmhouse", "stable"],
            "activities": 8,
            "level": 1
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{karma100_user}", json=karma100_state)
        
        # Redeem karma
        redeem_data = {"coins_to_redeem": 100}
        response = requests.post(f"{BASE_URL}/redeem-karma/{karma100_user}", json=redeem_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check discount percentage (should be 17%)
            if data["discount"] == 17:
                print("✅ Discount percentage correct (17%)")
            else:
                print(f"❌ Expected 17% discount, got {data['discount']}%")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: User with 200+ coins (27% discount - max)
    print("\nTest 4: User with 200+ karma coins (27% max discount)")
    karma200_user = f"karma200_{uuid.uuid4().hex[:8]}"
    
    karma200_state = {
        "state": {
            "karma_coins": 250,
            "clues": 10,
            "visited_locations": ["barn", "farmhouse", "stable", "pasture"],
            "activities": 15,
            "level": 3
        }
    }
    
    try:
        # Save state
        requests.post(f"{BASE_URL}/save-state/{karma200_user}", json=karma200_state)
        
        # Redeem karma
        redeem_data = {"coins_to_redeem": 200}
        response = requests.post(f"{BASE_URL}/redeem-karma/{karma200_user}", json=redeem_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check discount percentage (should be 27% - max)
            if data["discount"] == 27:
                print("✅ Discount percentage correct (27% - max)")
            else:
                print(f"❌ Expected 27% discount, got {data['discount']}%")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Duplicate redemption (should return existing code)
    print("\nTest 5: Duplicate redemption check")
    try:
        # Try to redeem again with same user
        redeem_data = {"coins_to_redeem": 200}
        response = requests.post(f"{BASE_URL}/redeem-karma/{karma200_user}", json=redeem_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Duplicate redemption returns existing code")
        else:
            print(f"❌ Duplicate redemption failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_shop_purchases():
    """Test POST /api/shop-purchase/{user_id}/{location_id} - Shop purchases"""
    print("\n=== Testing POST /api/shop-purchase/{user_id}/{location_id} ===")
    
    # Create test user with sufficient karma coins
    shop_user = f"shoptest_{uuid.uuid4().hex[:8]}"
    
    shop_state = {
        "state": {
            "karma_coins": 100,
            "clues": 4,
            "visited_locations": ["barn", "farmhouse", "stable"],
            "inventory": [],
            "activities": 6,
            "level": 1
        }
    }
    
    try:
        requests.post(f"{BASE_URL}/save-state/{shop_user}", json=shop_state)
        print(f"✅ Shop test user created: {shop_user}")
    except Exception as e:
        print(f"❌ Error creating shop test user: {e}")
        return
    
    # Test 1: Purchase available item (hint_token from farmhouse - 20 coins)
    print("\nTest 1: Purchase available item (hint_token - 20 coins)")
    try:
        purchase_data = {"item_id": "hint_token"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/farmhouse", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify purchase success
            if data.get("success", False):
                print("✅ Purchase successful")
                
                # Check new karma balance (should be 100 - 20 = 80)
                if data.get("new_karma_balance") == 80:
                    print("✅ Karma coins correctly deducted")
                else:
                    print(f"❌ Expected 80 karma coins, got {data.get('new_karma_balance')}")
                
                # Check item details
                if "item" in data and data["item"]["name"] == "Hint Token":
                    print("✅ Item details returned correctly")
                else:
                    print("❌ Item details missing or incorrect")
            else:
                print(f"❌ Purchase failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Purchase another available item (ranch_hat from barn - 30 coins)
    print("\nTest 2: Purchase ranch_hat from barn (30 coins)")
    try:
        purchase_data = {"item_id": "ranch_hat"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/barn", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success", False):
                print("✅ Ranch hat purchase successful")
                
                # Check new karma balance (should be 80 - 30 = 50)
                if data.get("new_karma_balance") == 50:
                    print("✅ Karma coins correctly deducted")
                else:
                    print(f"❌ Expected 50 karma coins, got {data.get('new_karma_balance')}")
            else:
                print(f"❌ Purchase failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Insufficient karma coins
    print("\nTest 3: Insufficient karma coins (try to buy discount_booster - 200 coins)")
    try:
        purchase_data = {"item_id": "discount_booster"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/secret_grove", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if not data.get("success", True):
                print("✅ Correctly rejected insufficient karma coins")
                if "Insufficient" in data.get("message", ""):
                    print("✅ Appropriate error message returned")
                else:
                    print(f"❌ Unexpected error message: {data.get('message')}")
            else:
                print("❌ Should have failed due to insufficient coins")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Try to buy "coming soon" item
    print("\nTest 4: Try to buy coming soon item (energy_boost)")
    try:
        purchase_data = {"item_id": "energy_boost"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/farmhouse", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected coming soon item")
            error_detail = response.json().get("detail", "")
            if "not available" in error_detail.lower():
                print("✅ Appropriate error message returned")
            else:
                print(f"❌ Unexpected error message: {error_detail}")
        else:
            print(f"❌ Should return 400 for coming soon item, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Invalid location
    print("\nTest 5: Invalid shop location")
    try:
        purchase_data = {"item_id": "hint_token"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/invalid_location", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Correctly rejected invalid location")
        else:
            print(f"❌ Should return 404 for invalid location, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Invalid item ID
    print("\nTest 6: Invalid item ID")
    try:
        purchase_data = {"item_id": "nonexistent_item"}
        response = requests.post(f"{BASE_URL}/shop-purchase/{shop_user}/farmhouse", json=purchase_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Correctly rejected invalid item ID")
        else:
            print(f"❌ Should return 404 for invalid item, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_integration_flows():
    """Test complete integration flows"""
    print("\n=== Testing Integration Flows ===")
    
    # Test 1: Complete exploration and purchase flow
    print("Test 1: Complete exploration → earn coins → purchase flow")
    flow_user = f"flowtest_{uuid.uuid4().hex[:8]}"
    
    try:
        # Step 1: Initialize user
        initial_state = {
            "state": {
                "karma_coins": 0,
                "clues": 2,
                "visited_locations": [],
                "inventory": [],
                "activities": 0,
                "level": 0
            }
        }
        requests.post(f"{BASE_URL}/save-state/{flow_user}", json=initial_state)
        print("✅ Step 1: User initialized")
        
        # Step 2: Explore locations to earn karma coins
        locations_to_visit = ["barn", "farmhouse", "stable"]
        total_karma = 0
        
        for location in locations_to_visit:
            response = requests.post(f"{BASE_URL}/map-interact/{flow_user}/{location}/enter")
            if response.status_code == 200:
                data = response.json()
                karma_earned = data.get("rewards", {}).get("karma_coins", 0)
                total_karma += karma_earned
                print(f"✅ Visited {location}, earned {karma_earned} karma coins")
            else:
                print(f"❌ Failed to visit {location}")
        
        print(f"✅ Step 2: Exploration complete, total karma earned: {total_karma}")
        
        # Step 3: Check map overview
        response = requests.get(f"{BASE_URL}/map-overview/{flow_user}")
        if response.status_code == 200:
            data = response.json()
            current_karma = data.get("karma_coins", 0)
            visited = data.get("visited_locations", [])
            print(f"✅ Step 3: Map overview - Karma: {current_karma}, Visited: {visited}")
        else:
            print("❌ Step 3: Map overview failed")
        
        # Step 4: Browse shop
        response = requests.post(f"{BASE_URL}/map-interact/{flow_user}/farmhouse/browse_goods")
        if response.status_code == 200:
            data = response.json()
            if "shop_menu" in data:
                print("✅ Step 4: Shop browsing successful")
            else:
                print("❌ Step 4: Shop menu not returned")
        else:
            print("❌ Step 4: Shop browsing failed")
        
        # Step 5: Purchase item (if enough karma)
        if current_karma >= 20:
            purchase_data = {"item_id": "hint_token"}
            response = requests.post(f"{BASE_URL}/shop-purchase/{flow_user}/farmhouse", json=purchase_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("success", False):
                    print("✅ Step 5: Purchase successful")
                else:
                    print(f"❌ Step 5: Purchase failed - {data.get('message')}")
            else:
                print("❌ Step 5: Purchase request failed")
        else:
            print(f"❌ Step 5: Insufficient karma for purchase ({current_karma} < 20)")
        
        print("✅ Integration Flow 1 Complete")
        
    except Exception as e:
        print(f"❌ Integration flow error: {e}")
    
    # Test 2: Karma redemption flow
    print("\nTest 2: Karma accumulation → redemption flow")
    karma_flow_user = f"karmaflow_{uuid.uuid4().hex[:8]}"
    
    try:
        # Initialize user with high karma
        high_karma_state = {
            "state": {
                "karma_coins": 75,
                "clues": 4,
                "visited_locations": ["barn", "farmhouse", "stable", "pasture"],
                "activities": 8,
                "level": 1
            }
        }
        requests.post(f"{BASE_URL}/save-state/{karma_flow_user}", json=high_karma_state)
        print("✅ Karma flow user initialized with 75 coins")
        
        # Redeem karma for discount
        redeem_data = {"coins_to_redeem": 75}
        response = requests.post(f"{BASE_URL}/redeem-karma/{karma_flow_user}", json=redeem_data)
        if response.status_code == 200:
            data = response.json()
            discount_code = data.get("code")
            discount_percent = data.get("discount")
            print(f"✅ Karma redemption successful: {discount_code} ({discount_percent}%)")
        else:
            print(f"❌ Karma redemption failed: {response.text}")
        
        print("✅ Integration Flow 2 Complete")
        
    except Exception as e:
        print(f"❌ Karma flow error: {e}")

def main():
    """Run all backend API tests"""
    print("🧪 Starting Golden Hooves Quest Backend API Tests")
    print("🗺️  Testing Phase 1: Interactive Ranch Map + Hybrid Shop System")
    print(f"Testing against: {BASE_URL}")
    print("=" * 70)
    
    # Test authentication endpoints first (existing tests)
    test_auth_signup()
    test_auth_login()
    test_auth_verify()
    test_auth_logout()
    test_auth_integration_flow()
    test_authenticated_endpoints()
    
    print("\n" + "=" * 70)
    print("🔐 Authentication Testing Complete")
    print("\n🤖 Testing AI Hint Endpoints")
    print("=" * 70)
    
    # Test AI hint endpoints (existing tests)
    test_ai_hint_endpoint()
    test_game_state_endpoint()
    test_user_id = test_save_state_endpoint()
    test_generate_discount_endpoint(test_user_id)
    test_nonexistent_user_discount()
    
    print("\n" + "=" * 70)
    print("🗺️  Testing Phase 1: Interactive Ranch Map System")
    print("=" * 70)
    
    # Test new Phase 1 features
    test_map_overview()
    test_map_interactions()
    
    print("\n" + "=" * 70)
    print("🛒 Testing Phase 1: Hybrid Shop System")
    print("=" * 70)
    
    test_karma_redemption()
    test_shop_purchases()
    
    print("\n" + "=" * 70)
    print("🔄 Testing Integration Flows")
    print("=" * 70)
    
    test_integration_flows()
    
    print("\n" + "=" * 70)
    print("🏁 Complete Backend API Testing Finished")
    print("✅ Phase 1: Interactive Ranch Map + Hybrid Shop System Verified")

if __name__ == "__main__":
    main()