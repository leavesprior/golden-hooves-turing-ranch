/**
 * Ranch Map Service
 * Handles communication with map interaction endpoints
 */

import { auth } from './auth';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export interface Location {
  id: string;
  name: string;
  coordinates: number[];
  icon: string;
  unlocked: boolean;
  description: string;
  npc_name?: string;
  interactions: string[];
}

export interface MapOverview {
  locations: Location[];
  karma_coins: number;
  visited_locations: string[];
  fog_of_war: string[];
}

export interface InteractionReward {
  karma_coins: number;
  items: string[];
  experience: number;
}

export interface InteractionResponse {
  dialogue: string;
  rewards: InteractionReward;
  quest_update?: any;
  location_unlocked?: string;
  shop_menu?: ShopMenu;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  effect: string;
  available: boolean;
  coming_soon: boolean;
  icon: string;
}

export interface ShopMenu {
  shop_type: string;
  items: ShopItem[];
}

/**
 * Get map overview for user
 */
export async function getMapOverview(userId: string): Promise<MapOverview> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/map-overview/${userId}`, {
      headers: auth.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get map overview: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting map overview:', error);
    // Return empty map state
    return {
      locations: [],
      karma_coins: 0,
      visited_locations: [],
      fog_of_war: [],
    };
  }
}

/**
 * Interact with a location
 */
export async function mapInteraction(
  userId: string,
  locationId: string,
  action: string
): Promise<InteractionResponse | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/map-interact/${userId}/${locationId}/${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Interaction failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in map interaction:', error);
    return null;
  }
}

/**
 * Redeem karma coins for discount
 */
export async function redeemKarmaCoins(
  userId: string,
  coinsToRedeem: number
): Promise<{ code: string; discount: number } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/redeem-karma/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify({ coins_to_redeem: coinsToRedeem }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Redemption failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error redeeming karma coins:', error);
    return null;
  }
}

/**
 * Purchase item from shop
 */
export async function purchaseShopItem(
  userId: string,
  locationId: string,
  itemId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/shop-purchase/${userId}/${locationId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify({ item_id: itemId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Purchase failed');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error purchasing item:', error);
    return false;
  }
}

/**
 * Feed treat to creature at location
 */
export async function feedTreat(
  userId: string,
  locationId: string,
  treatId: string,
  creature: string
): Promise<InteractionResponse | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/map-interact/${userId}/${locationId}/feed_treat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify({ treat_id: treatId, creature: creature }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Feeding failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error feeding treat:', error);
    return null;
  }
}

/**
 * Get user's inventory
 */
export async function getUserInventory(userId: string): Promise<ShopItem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/game-state/${userId}`, {
      headers: auth.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to get inventory');
    }

    const state = await response.json();
    return state.inventory || [];
  } catch (error) {
    console.error('Error getting inventory:', error);
    return [];
  }
}
