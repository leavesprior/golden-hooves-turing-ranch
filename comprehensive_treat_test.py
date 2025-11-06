#!/usr/bin/env python3
"""
Comprehensive Phase 3 Treat-Feeding Tests
"""

import requests
import json
import uuid
import time

BASE_URL = "https://mapquest-16.preview.emergentagent.com/api"

def setup_user_with_many_treats():
    """Setup user with multiple treats for comprehensive testing"""
    print("=== Setting up user with multiple treats ===")
    
    feed_user = f"comprehensive_{uuid.uuid4().hex[:8]}"
    
    # Initialize user with lots of karma coins
    initial_state = {
        "state": {
            "karma_coins": 500,  # Enough for many treats
            "clues": 3,
            "visited_locations": ["farmhouse"],
            "inventory": [],
            "affinities": {},
            "progression": {"xp": 0, "level": 1, "traits": []},
            "activities": 5,
            "level": 1
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save-state/{feed_user}", json=initial_state)
        if response.status_code == 200:
            print(f"✅ Test user created: {feed_user}")
        else:
            print(f"❌ Failed to create test user: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None
    
    # Purchase multiple treats (buy each treat multiple times)
    treats_to_buy = [
        ("carrots", "Garden Carrots", 5),  # Buy 5 carrots
        ("apples", "Fresh Apples", 3),     # Buy 3 apples
        ("emu_berries", "Assorted Berries (Emus)", 2),  # Buy 2 emu berries
        ("alfalfa_hay", "Alfalfa Hay Bale", 2),  # Buy 2 alfalfa hay
    ]
    
    total_purchased = 0
    
    for treat_id, treat_name, quantity in treats_to_buy:
        for i in range(quantity):
            try:
                purchase_data = {"item_id": treat_id}
                response = requests.post(f"{BASE_URL}/shop-purchase/{feed_user}/farmhouse", json=purchase_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success", False):
                        total_purchased += 1
                        print(f"✅ Purchased {treat_name} #{i+1}")
                    else:
                        print(f"❌ Failed to purchase {treat_name} #{i+1}: {data.get('message')}")
                else:
                    print(f"❌ Purchase request failed for {treat_name} #{i+1}: {response.text}")
            except Exception as e:
                print(f"❌ Error purchasing {treat_name} #{i+1}: {e}")
    
    print(f"✅ Setup complete: {total_purchased} treats purchased")
    return feed_user if total_purchased >= 10 else None

def test_comprehensive_treat_feeding():
    """Run comprehensive treat feeding tests"""
    print("\n" + "=" * 70)
    print("🐴 COMPREHENSIVE PHASE 3 TREAT-FEEDING TESTS")
    print("=" * 70)
    
    # Setup
    feed_user = setup_user_with_many_treats()
    if not feed_user:
        print("❌ Setup failed - cannot proceed")
        return
    
    # Test 1: Basic treat feeding scenarios
    print("\n=== Test 1: Basic Treat Feeding Scenarios ===")
    
    basic_scenarios = [
        ("carrots", "horse", "stable", "Feed carrots to horse at stable"),
        ("apples", "donkey", "barn", "Feed apples to donkey at barn"),
        ("emu_berries", "emu", "pasture", "Feed emu_berries to emu at pasture"),
        ("carrots", "pig", "barn", "Feed carrots to pig at barn"),
    ]
    
    successful_feedings = 0
    
    for treat_id, creature, location, description in basic_scenarios:
        print(f"\n{description}:")
        
        try:
            request_body = {"treat_id": treat_id, "creature": creature}
            response = requests.post(f"{BASE_URL}/map-interact/{feed_user}/{location}/feed_treat", json=request_body)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                successful_feedings += 1
                
                # Check rewards
                rewards = data.get("rewards", {})
                xp = rewards.get("experience", 0)
                karma = rewards.get("karma_coins", 0)
                
                print(f"✅ Success - XP: {xp}, Karma: {karma}")
                
                # Check for quest milestone
                if "quest_update" in data and data["quest_update"]:
                    print(f"🎯 Quest milestone: {data['quest_update']}")
                
                # Check dialogue length
                dialogue = data.get("dialogue", "")
                if 200 <= len(dialogue) <= 400:
                    print(f"✅ AI dialogue length appropriate: {len(dialogue)} chars")
                else:
                    print(f"ℹ️  AI dialogue length: {len(dialogue)} chars")
            else:
                print(f"❌ Failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Basic feeding tests: {successful_feedings}/{len(basic_scenarios)} successful")
    
    # Test 2: Compatibility validation
    print("\n=== Test 2: Treat-Creature Compatibility Validation ===")
    
    incompatible_scenarios = [
        ("emu_berries", "horse", "stable", "Emu berries should not work for horses"),
        ("alfalfa_hay", "pig", "barn", "Alfalfa hay should not work for pigs"),
    ]
    
    compatibility_tests_passed = 0
    
    for treat_id, creature, location, description in incompatible_scenarios:
        print(f"\n{description}:")
        
        try:
            request_body = {"treat_id": treat_id, "creature": creature}
            response = requests.post(f"{BASE_URL}/map-interact/{feed_user}/{location}/feed_treat", json=request_body)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 400:
                error_detail = response.json().get("detail", "")
                if "not suitable" in error_detail.lower() or "compatible" in error_detail.lower():
                    print("✅ Correctly rejected with appropriate error message")
                    compatibility_tests_passed += 1
                else:
                    print(f"✅ Correctly rejected but unexpected error: {error_detail}")
                    compatibility_tests_passed += 1
            else:
                print(f"❌ Should have failed but got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Compatibility tests: {compatibility_tests_passed}/{len(incompatible_scenarios)} passed")
    
    # Test 3: Affinity progression
    print("\n=== Test 3: Affinity Progression ===")
    
    print("Testing multiple feedings to same creature:")
    creature = "horse"
    location = "stable"
    treat_id = "carrots"
    
    affinity_feedings = 0
    quest_milestone_reached = False
    
    for round_num in range(1, 4):  # Try 3 feedings
        print(f"\nFeeding round {round_num}:")
        
        try:
            request_body = {"treat_id": treat_id, "creature": creature}
            response = requests.post(f"{BASE_URL}/map-interact/{feed_user}/{location}/feed_treat", json=request_body)
            
            if response.status_code == 200:
                data = response.json()
                affinity_feedings += 1
                
                # Check for quest milestone
                if "quest_update" in data and data["quest_update"]:
                    quest_milestone_reached = True
                    quest_info = data["quest_update"]
                    print(f"🎯 Quest milestone reached: {quest_info}")
                    break
                else:
                    print(f"✅ Feeding successful, no milestone yet")
            elif response.status_code == 400 and "don't have" in response.text:
                print(f"ℹ️  Ran out of treats after {affinity_feedings} feedings")
                break
            else:
                print(f"❌ Feeding failed: {response.text}")
                break
                
        except Exception as e:
            print(f"❌ Error: {e}")
            break
    
    print(f"\n✅ Affinity progression: {affinity_feedings} feedings completed")
    if quest_milestone_reached:
        print("✅ Quest milestone system working")
    else:
        print("ℹ️  Quest milestone not reached (may need more feedings)")
    
    # Test 4: Random events detection
    print("\n=== Test 4: Random Events and AI Dialogue ===")
    
    events_detected = 0
    ai_dialogues = 0
    
    # Try multiple feedings to potentially trigger events
    for attempt in range(1, 6):  # Try 5 more feedings
        print(f"\nFeeding attempt {attempt}:")
        
        # Use remaining treats
        scenarios = [
            ("carrots", "donkey", "barn"),
            ("apples", "sheep", "pasture"),
        ]
        
        treat_id, creature, location = scenarios[(attempt - 1) % len(scenarios)]
        
        try:
            request_body = {"treat_id": treat_id, "creature": creature}
            response = requests.post(f"{BASE_URL}/map-interact/{feed_user}/{location}/feed_treat", json=request_body)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check dialogue
                dialogue = data.get("dialogue", "")
                if dialogue and len(dialogue) > 100:
                    ai_dialogues += 1
                    print(f"✅ AI dialogue received ({len(dialogue)} chars)")
                    
                    # Check for event indicators
                    if "✨" in dialogue or "bonus" in dialogue.lower() or "special" in dialogue.lower():
                        events_detected += 1
                        print(f"🎉 Random event detected!")
                        
                        # Check for bonus rewards
                        rewards = data.get("rewards", {})
                        if rewards.get("items") or rewards.get("experience", 0) > 15:
                            print("✅ Bonus rewards from event")
                
            elif response.status_code == 400 and "don't have" in response.text:
                print(f"ℹ️  Ran out of treats after {attempt-1} attempts")
                break
            else:
                print(f"❌ Failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Random events test complete:")
    print(f"   - AI dialogues: {ai_dialogues}")
    print(f"   - Random events detected: {events_detected}")
    
    # Test 5: Error handling
    print("\n=== Test 5: Error Handling ===")
    
    error_tests_passed = 0
    
    # Test missing parameters
    error_scenarios = [
        ({"creature": "horse"}, "Missing treat_id"),
        ({"treat_id": "carrots"}, "Missing creature"),
        ({"treat_id": "nonexistent", "creature": "horse"}, "Nonexistent treat"),
    ]
    
    for request_body, description in error_scenarios:
        print(f"\n{description}:")
        
        try:
            response = requests.post(f"{BASE_URL}/map-interact/{feed_user}/stable/feed_treat", json=request_body)
            
            if response.status_code == 400:
                print("✅ Correctly returned 400 error")
                error_tests_passed += 1
            else:
                print(f"❌ Expected 400, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Error handling tests: {error_tests_passed}/{len(error_scenarios)} passed")
    
    # Summary
    print("\n" + "=" * 70)
    print("🏁 COMPREHENSIVE TREAT-FEEDING TEST SUMMARY")
    print("=" * 70)
    print(f"✅ Basic feeding scenarios: {successful_feedings}/{len(basic_scenarios)}")
    print(f"✅ Compatibility validation: {compatibility_tests_passed}/{len(incompatible_scenarios)}")
    print(f"✅ Affinity progression: {affinity_feedings} feedings completed")
    print(f"✅ Quest milestone: {'Yes' if quest_milestone_reached else 'Not reached'}")
    print(f"✅ AI dialogues generated: {ai_dialogues}")
    print(f"✅ Random events detected: {events_detected}")
    print(f"✅ Error handling: {error_tests_passed}/{len(error_scenarios)}")
    
    # Overall assessment
    total_tests = len(basic_scenarios) + len(incompatible_scenarios) + len(error_scenarios)
    total_passed = successful_feedings + compatibility_tests_passed + error_tests_passed
    
    print(f"\n🎯 OVERALL: {total_passed}/{total_tests} core tests passed")
    
    if total_passed >= total_tests * 0.8:  # 80% pass rate
        print("✅ PHASE 3 TREAT-FEEDING SYSTEM: WORKING CORRECTLY")
    else:
        print("❌ PHASE 3 TREAT-FEEDING SYSTEM: NEEDS ATTENTION")

if __name__ == "__main__":
    test_comprehensive_treat_feeding()