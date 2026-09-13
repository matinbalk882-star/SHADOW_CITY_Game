/**
 * SaveManager.js
 * Handles persistent game state in LocalStorage.
 * Saves coins, inventory, weapons, character customization, settings.
 */

const SAVE_KEY = 'SHADOW_CITY_SAVE_V1';

const DEFAULT_STATE = {
  coins: 2500, // starting coins
  ownedWeapons: ['bat', 'pistol'], // default owned weapons
  currentWeapon: 'bat',
  character: {
    gender: 'boy', // 'boy' | 'girl'
    skinColor: '#d69e7e',
    hairColor: '#1a1a1a',
    shirtIndex: 0,
    pantsIndex: 0,
  },
  settings: {
    quality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
    masterVolume: 0.8,
    radioVolume: 0.7,
    sfxVolume: 0.9,
    aimSensitivity: 1.0,
    crosshairStyle: 'cyber',
    shadows: true,
  },
  gallery: [], // Array of base64 photos with timestamp & id
  stats: {
    kills: 0,
    carsDestroyed: 0,
    moneyEarned: 0,
  }
};

export class SaveManager {
  static load() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          character: { ...DEFAULT_STATE.character, ...(parsed.character || {}) },
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
          stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
          gallery: Array.isArray(parsed.gallery) ? parsed.gallery : []
        };
      }
    } catch (e) {
      console.warn('Failed to load save state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  static save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  static reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn('Failed to reset save state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}
