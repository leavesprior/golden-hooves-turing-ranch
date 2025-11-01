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

def main():
    """Run all backend API tests"""
    print("🧪 Starting Golden Hooves Quest AI Hints Backend API Tests")
    print(f"Testing against: {BASE_URL}")
    print("=" * 60)
    
    # Test all endpoints
    test_ai_hint_endpoint()
    test_game_state_endpoint()
    test_user_id = test_save_state_endpoint()
    test_generate_discount_endpoint(test_user_id)
    test_nonexistent_user_discount()
    
    print("\n" + "=" * 60)
    print("🏁 Backend API Testing Complete")

if __name__ == "__main__":
    main()