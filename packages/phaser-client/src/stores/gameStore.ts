/**
 * @file Manages the game's UI state using Zustand.
 * @author Your Name
 */

import { create } from "zustand";
import type { DiscordUser, Player } from "../types";

/**
 * @interface Item
 * @description Defines the structure for an item in the game.
 */
export interface Item {
  id: string;
  name: string;
  quantity: number;
}

/**
 * @interface ChatMessage
 * @description Defines the structure for a chat message.
 */
export interface ChatMessage {
  sender: string;
  text: string;
  color?: string;
}

/**
 * @interface GameStore
 * @description Defines the state and actions for the game's UI and player data.
 * This store manages player stats, inventory, equipment, and Discord user information.
 */
export interface GameStore {
  // Player state
  health: number;
  maxHealth: number;
  prayer: number;
  maxPrayer: number;
  runEnergy: number;
  skills: Record<string, { level: number; xp: number }>;
  inventory: Item[];
  equipment: Record<string, Item | null>;

  // Discord user info
  discordUser: DiscordUser | null;

  // Chat messages
  messages: ChatMessage[];

  // Actions
  setHealth: (health: number) => void;
  setPrayer: (prayer: number) => void;
  setRunEnergy: (energy: number) => void;
  setSkill: (skill: string, level: number, xp: number) => void;
  addItemToInventory: (item: Item) => void;
  removeItemFromInventory: (itemId: string) => void;
  equipItem: (item: Item, slot: string) => void;
  unequipItem: (slot: string) => void;
  setDiscordUser: (user: DiscordUser | null) => void;
  setPlayerState: (player: Player) => void;
  addChatMessage: (message: ChatMessage) => void;
}

/**
 * @constant useGameStore
 * @description Zustand store for managing the game's UI state.
 */
export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  health: 10,
  maxHealth: 10,
  prayer: 1,
  maxPrayer: 1,
  runEnergy: 100,
  skills: {
    attack: { level: 1, xp: 0 },
    strength: { level: 1, xp: 0 },
    defence: { level: 1, xp: 0 },
    hitpoints: { level: 10, xp: 1154 },
    ranged: { level: 1, xp: 0 },
    prayer: { level: 1, xp: 0 },
    magic: { level: 1, xp: 0 },
  },
  inventory: [],
  equipment: {},
  discordUser: null,
  messages: [],

  // Actions
  setHealth: (health) => set({ health }),
  setPrayer: (prayer) => set({ prayer }),
  setRunEnergy: (energy) => set({ runEnergy: energy }),
  setSkill: (skill, level, xp) =>
    set((state) => ({
      skills: {
        ...state.skills,
        [skill]: { level, xp },
      },
    })),
  addItemToInventory: (item) =>
    set((state) => ({ inventory: [...state.inventory, item] })),
  removeItemFromInventory: (itemId) =>
    set((state) => ({
      inventory: state.inventory.filter((item) => item.id !== itemId),
    })),
  equipItem: (item, slot) =>
    set((state) => ({
      equipment: { ...state.equipment, [slot]: item },
    })),
  unequipItem: (slot) =>
    set((state) => ({
      equipment: { ...state.equipment, [slot]: null },
    })),
  setDiscordUser: (user) => set({ discordUser: user }),
  setPlayerState: (player) =>
    set({
      health: player.health,
      maxHealth: player.maxHealth,
      // ... map other player properties as they are added to the schema
    }),
  addChatMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));
