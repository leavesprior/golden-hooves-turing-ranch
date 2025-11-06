#!/usr/bin/env python3
"""
Debug script to check inventory structure after purchase
"""

import requests
import json
import uuid

BASE_URL = "https://mapquest-16.preview.emergentagent.com/api"

def debug_inventory():
    # Create test user
    debug_user = f"debug_{uuid.uuid4().hex[:8]}"
    
    # Initialize user with karma coins
    initial_state = {
        "state": {
            "karma_coins": 100,
            "clues": 3,
            "visited_locations": ["farmhouse"],
            "inventory": [],
            "activities": 5,
            "level": 1
        }
    }
    
    print(f"Creating debug user: {debug_user}")
    response = requests.post(f"{BASE_URL}/save-state/{debug_user}", json=initial_state)
    print(f"User creation: {response.status_code}")
    
    # Purchase a treat
    print("\nPurchasing carrots...")
    purchase_data = {"item_id": "carrots"}
    response = requests.post(f"{BASE_URL}/shop-purchase/{debug_user}/farmhouse", json=purchase_data)
    print(f"Purchase status: {response.status_code}")
    if response.status_code == 200:
        print(f"Purchase response: {json.dumps(response.json(), indent=2)}")
    
    # Check game state to see inventory structure
    print("\nChecking game state...")
    response = requests.get(f"{BASE_URL}/game-state/{debug_user}")
    print(f"Game state status: {response.status_code}")
    if response.status_code == 200:
        print(f"Game state: {json.dumps(response.json(), indent=2)}")
    
    # Try to get full user state from MongoDB (this might not work through API)
    print("\nTrying to interact to see full state...")
    response = requests.post(f"{BASE_URL}/map-interact/{debug_user}/farmhouse/browse_goods")
    print(f"Interaction status: {response.status_code}")

if __name__ == "__main__":
    debug_inventory()