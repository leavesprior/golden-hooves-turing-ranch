#!/usr/bin/env python3
"""
Test the inventory fix for treat feeding
"""

import requests
import json
import uuid

BASE_URL = "https://mapquest-16.preview.emergentagent.com/api"

def test_fix():
    # Create test user
    test_user = f"testfix_{uuid.uuid4().hex[:8]}"
    
    # Initialize user with karma coins
    initial_state = {
        "state": {
            "karma_coins": 100,
            "clues": 3,
            "visited_locations": ["farmhouse"],
            "inventory": [],
            "affinities": {},
            "progression": {"xp": 0, "level": 1, "traits": []},
            "activities": 5,
            "level": 1
        }
    }
    
    print(f"Creating test user: {test_user}")
    response = requests.post(f"{BASE_URL}/save-state/{test_user}", json=initial_state)
    print(f"User creation: {response.status_code}")
    
    # Purchase carrots
    print("\nPurchasing carrots...")
    purchase_data = {"item_id": "carrots"}
    response = requests.post(f"{BASE_URL}/shop-purchase/{test_user}/farmhouse", json=purchase_data)
    print(f"Purchase status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Purchase successful")
    else:
        print(f"❌ Purchase failed: {response.text}")
        return
    
    # Try to feed carrots to horse at stable
    print("\nTesting treat feeding...")
    request_body = {
        "treat_id": "carrots",
        "creature": "horse"
    }
    
    response = requests.post(f"{BASE_URL}/map-interact/{test_user}/stable/feed_treat", json=request_body)
    print(f"Feed treat status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Treat feeding successful!")
        print(f"Dialogue: {data.get('dialogue', 'No dialogue')[:100]}...")
        
        rewards = data.get("rewards", {})
        print(f"XP gained: {rewards.get('experience', 0)}")
        print(f"Karma gained: {rewards.get('karma_coins', 0)}")
        
        if "quest_update" in data and data["quest_update"]:
            print(f"Quest update: {data['quest_update']}")
    else:
        print(f"❌ Treat feeding failed: {response.text}")

if __name__ == "__main__":
    test_fix()