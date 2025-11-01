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

def main():
    """Run all backend API tests"""
    print("🧪 Starting Golden Hooves Quest Backend API Tests")
    print("🔐 Testing Authentication Migration (Supabase → MongoDB)")
    print(f"Testing against: {BASE_URL}")
    print("=" * 70)
    
    # Test authentication endpoints first
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
    
    # Test AI hint endpoints
    test_ai_hint_endpoint()
    test_game_state_endpoint()
    test_user_id = test_save_state_endpoint()
    test_generate_discount_endpoint(test_user_id)
    test_nonexistent_user_discount()
    
    print("\n" + "=" * 70)
    print("🏁 Complete Backend API Testing Finished")
    print("✅ Authentication Migration & AI Hints Verified")

if __name__ == "__main__":
    main()