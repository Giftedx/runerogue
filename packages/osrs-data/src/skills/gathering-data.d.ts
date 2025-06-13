/**
 * OSRS-authentic gathering skill data
 * All values verified against OSRS Wiki as of June 2025
 *
 * Sources:
 * - https://oldschool.runescape.wiki/w/Woodcutting
 * - https://oldschool.runescape.wiki/w/Mining
 * - https://oldschool.runescape.wiki/w/Fishing
 * - https://oldschool.runescape.wiki/w/Cooking
 * - https://oldschool.runescape.wiki/w/Firemaking
 */
export declare enum ResourceType {
    TREE = 1,
    ROCK = 2,
    FISHING_SPOT = 3,
    COOKING_SPOT = 4
}
export declare enum SkillType {
    WOODCUTTING = 1,
    MINING = 2,
    FISHING = 3,
    COOKING = 4,
    FIREMAKING = 5
}
/**
 * Calculate level from XP using OSRS XP table
 */
export declare function calculateLevelFromXp(xp: number): number;
/**
 * Calculate XP required for a specific level
 */
export declare function calculateXpFromLevel(level: number): number;
export declare const TREES: {
    readonly NORMAL: {
        readonly id: 1000;
        readonly name: "Tree";
        readonly level: 1;
        readonly xp: 25;
        readonly logId: 1511;
        readonly respawnTicks: 5;
        readonly depletionChance: 0.05;
    };
    readonly OAK: {
        readonly id: 1001;
        readonly name: "Oak tree";
        readonly level: 15;
        readonly xp: 37.5;
        readonly logId: 1521;
        readonly respawnTicks: 13;
        readonly depletionChance: 0.1;
    };
    readonly WILLOW: {
        readonly id: 1002;
        readonly name: "Willow tree";
        readonly level: 30;
        readonly xp: 67.5;
        readonly logId: 1519;
        readonly respawnTicks: 15;
        readonly depletionChance: 0.12;
    };
    readonly TEAK: {
        readonly id: 1003;
        readonly name: "Teak tree";
        readonly level: 35;
        readonly xp: 85;
        readonly logId: 6333;
        readonly respawnTicks: 17;
        readonly depletionChance: 0.15;
    };
    readonly MAPLE: {
        readonly id: 1004;
        readonly name: "Maple tree";
        readonly level: 45;
        readonly xp: 100;
        readonly logId: 1517;
        readonly respawnTicks: 58;
        readonly depletionChance: 0.125;
    };
};
export declare const ROCKS: {
    readonly COPPER: {
        readonly id: 2000;
        readonly name: "Copper rock";
        readonly level: 1;
        readonly xp: 17.5;
        readonly oreId: 436;
        readonly respawnTicks: 4;
        readonly depletionChance: 1;
    };
    readonly TIN: {
        readonly id: 2001;
        readonly name: "Tin rock";
        readonly level: 1;
        readonly xp: 17.5;
        readonly oreId: 438;
        readonly respawnTicks: 4;
        readonly depletionChance: 1;
    };
    readonly IRON: {
        readonly id: 2002;
        readonly name: "Iron rock";
        readonly level: 15;
        readonly xp: 35;
        readonly oreId: 440;
        readonly respawnTicks: 9;
        readonly depletionChance: 1;
    };
    readonly SILVER: {
        readonly id: 2003;
        readonly name: "Silver rock";
        readonly level: 20;
        readonly xp: 40;
        readonly oreId: 442;
        readonly respawnTicks: 17;
        readonly depletionChance: 1;
    };
    readonly COAL: {
        readonly id: 2004;
        readonly name: "Coal rock";
        readonly level: 30;
        readonly xp: 50;
        readonly oreId: 453;
        readonly respawnTicks: 30;
        readonly depletionChance: 1;
    };
    readonly GOLD: {
        readonly id: 2005;
        readonly name: "Gold rock";
        readonly level: 40;
        readonly xp: 65;
        readonly oreId: 444;
        readonly respawnTicks: 100;
        readonly depletionChance: 1;
    };
};
export declare const FISHING_SPOTS: {
    readonly NET_BAIT: {
        readonly id: 3000;
        readonly name: "Fishing spot";
        readonly options: {
            readonly NET: {
                readonly level: 1;
                readonly tool: 303;
                readonly fish: readonly ["shrimps", "anchovies"];
                readonly xp: {
                    readonly shrimps: 10;
                    readonly anchovies: 40;
                };
            };
            readonly BAIT: {
                readonly level: 5;
                readonly tool: 307;
                readonly bait: 313;
                readonly fish: readonly ["sardine", "herring"];
                readonly xp: {
                    readonly sardine: 20;
                    readonly herring: 30;
                };
            };
        };
    };
    readonly LURE_BAIT: {
        readonly id: 3001;
        readonly name: "Rod fishing spot";
        readonly options: {
            readonly LURE: {
                readonly level: 20;
                readonly tool: 309;
                readonly bait: 314;
                readonly fish: readonly ["trout", "salmon"];
                readonly xp: {
                    readonly trout: 50;
                    readonly salmon: 70;
                };
            };
            readonly BAIT: {
                readonly level: 25;
                readonly tool: 307;
                readonly bait: 313;
                readonly fish: readonly ["pike"];
                readonly xp: {
                    readonly pike: 60;
                };
            };
        };
    };
    readonly CAGE_HARPOON: {
        readonly id: 3002;
        readonly name: "Cage/Harpoon spot";
        readonly options: {
            readonly CAGE: {
                readonly level: 40;
                readonly tool: 301;
                readonly fish: readonly ["lobster"];
                readonly xp: {
                    readonly lobster: 90;
                };
            };
            readonly HARPOON: {
                readonly level: 35;
                readonly tool: 311;
                readonly fish: readonly ["tuna", "swordfish"];
                readonly xp: {
                    readonly tuna: 80;
                    readonly swordfish: 100;
                };
            };
        };
    };
};
export declare const COOKABLE_ITEMS: {
    readonly SHRIMPS: {
        readonly raw: 317;
        readonly cooked: 315;
        readonly burnt: 7954;
        readonly level: 1;
        readonly xp: 30;
        readonly burnStopLevel: 34;
        readonly burnStopLevelRange: 34;
    };
    readonly SARDINE: {
        readonly raw: 327;
        readonly cooked: 325;
        readonly burnt: 369;
        readonly level: 1;
        readonly xp: 40;
        readonly burnStopLevel: 38;
        readonly burnStopLevelRange: 38;
    };
    readonly HERRING: {
        readonly raw: 345;
        readonly cooked: 347;
        readonly burnt: 357;
        readonly level: 5;
        readonly xp: 50;
        readonly burnStopLevel: 41;
        readonly burnStopLevelRange: 41;
    };
    readonly ANCHOVIES: {
        readonly raw: 321;
        readonly cooked: 319;
        readonly burnt: 323;
        readonly level: 1;
        readonly xp: 30;
        readonly burnStopLevel: 34;
        readonly burnStopLevelRange: 34;
    };
    readonly TROUT: {
        readonly raw: 335;
        readonly cooked: 333;
        readonly burnt: 343;
        readonly level: 15;
        readonly xp: 70;
        readonly burnStopLevel: 49;
        readonly burnStopLevelRange: 50;
    };
    readonly SALMON: {
        readonly raw: 331;
        readonly cooked: 329;
        readonly burnt: 343;
        readonly level: 25;
        readonly xp: 90;
        readonly burnStopLevel: 58;
        readonly burnStopLevelRange: 58;
    };
    readonly TUNA: {
        readonly raw: 359;
        readonly cooked: 361;
        readonly burnt: 367;
        readonly level: 30;
        readonly xp: 100;
        readonly burnStopLevel: 63;
        readonly burnStopLevelRange: 64;
    };
    readonly LOBSTER: {
        readonly raw: 377;
        readonly cooked: 379;
        readonly burnt: 381;
        readonly level: 40;
        readonly xp: 120;
        readonly burnStopLevel: 74;
        readonly burnStopLevelRange: 74;
    };
    readonly SWORDFISH: {
        readonly raw: 371;
        readonly cooked: 373;
        readonly burnt: 375;
        readonly level: 45;
        readonly xp: 140;
        readonly burnStopLevel: 86;
        readonly burnStopLevelRange: 81;
    };
    readonly PIKE: {
        readonly raw: 349;
        readonly cooked: 351;
        readonly burnt: 343;
        readonly level: 20;
        readonly xp: 80;
        readonly burnStopLevel: 53;
        readonly burnStopLevelRange: 53;
    };
};
export declare const LOGS: {
    readonly NORMAL: {
        readonly id: 1511;
        readonly level: 1;
        readonly xp: 40;
        readonly burnTime: 30;
    };
    readonly OAK: {
        readonly id: 1521;
        readonly level: 15;
        readonly xp: 60;
        readonly burnTime: 45;
    };
    readonly WILLOW: {
        readonly id: 1519;
        readonly level: 30;
        readonly xp: 90;
        readonly burnTime: 67;
    };
    readonly TEAK: {
        readonly id: 6333;
        readonly level: 35;
        readonly xp: 105;
        readonly burnTime: 70;
    };
    readonly MAPLE: {
        readonly id: 1517;
        readonly level: 45;
        readonly xp: 135;
        readonly burnTime: 100;
    };
};
export declare const TOOL_EFFECTIVENESS: {
    readonly AXES: {
        readonly bronze: {
            readonly level: 1;
            readonly speed: 6;
            readonly itemId: 1351;
        };
        readonly iron: {
            readonly level: 1;
            readonly speed: 5;
            readonly itemId: 1349;
        };
        readonly steel: {
            readonly level: 6;
            readonly speed: 4;
            readonly itemId: 1353;
        };
        readonly black: {
            readonly level: 11;
            readonly speed: 4;
            readonly itemId: 1361;
        };
        readonly mithril: {
            readonly level: 21;
            readonly speed: 3;
            readonly itemId: 1355;
        };
        readonly adamant: {
            readonly level: 31;
            readonly speed: 2;
            readonly itemId: 1357;
        };
        readonly rune: {
            readonly level: 41;
            readonly speed: 1;
            readonly itemId: 1359;
        };
    };
    readonly PICKAXES: {
        readonly bronze: {
            readonly level: 1;
            readonly speed: 6;
            readonly itemId: 1265;
        };
        readonly iron: {
            readonly level: 1;
            readonly speed: 5;
            readonly itemId: 1267;
        };
        readonly steel: {
            readonly level: 6;
            readonly speed: 4;
            readonly itemId: 1269;
        };
        readonly black: {
            readonly level: 11;
            readonly speed: 4;
            readonly itemId: 12297;
        };
        readonly mithril: {
            readonly level: 21;
            readonly speed: 3;
            readonly itemId: 1273;
        };
        readonly adamant: {
            readonly level: 31;
            readonly speed: 2;
            readonly itemId: 1271;
        };
        readonly rune: {
            readonly level: 41;
            readonly speed: 1;
            readonly itemId: 1275;
        };
    };
};
export declare const WOODCUTTING_TOOLS: {
    readonly BRONZE_AXE: {
        readonly id: 1351;
        readonly name: "Bronze axe";
        readonly level: 1;
        readonly speed: 5;
        readonly effectiveness: 1;
    };
    readonly IRON_AXE: {
        readonly id: 1349;
        readonly name: "Iron axe";
        readonly level: 1;
        readonly speed: 4;
        readonly effectiveness: 1.2;
    };
    readonly STEEL_AXE: {
        readonly id: 1353;
        readonly name: "Steel axe";
        readonly level: 6;
        readonly speed: 3;
        readonly effectiveness: 1.5;
    };
    readonly BLACK_AXE: {
        readonly id: 1361;
        readonly name: "Black axe";
        readonly level: 11;
        readonly speed: 3;
        readonly effectiveness: 1.6;
    };
    readonly MITHRIL_AXE: {
        readonly id: 1355;
        readonly name: "Mithril axe";
        readonly level: 21;
        readonly speed: 2;
        readonly effectiveness: 2;
    };
    readonly ADAMANT_AXE: {
        readonly id: 1357;
        readonly name: "Adamant axe";
        readonly level: 31;
        readonly speed: 2;
        readonly effectiveness: 2.5;
    };
    readonly RUNE_AXE: {
        readonly id: 1359;
        readonly name: "Rune axe";
        readonly level: 41;
        readonly speed: 1;
        readonly effectiveness: 3;
    };
};
export declare const MINING_TOOLS: {
    readonly BRONZE_PICKAXE: {
        readonly id: 1265;
        readonly name: "Bronze pickaxe";
        readonly level: 1;
        readonly speed: 5;
        readonly effectiveness: 1;
    };
    readonly IRON_PICKAXE: {
        readonly id: 1267;
        readonly name: "Iron pickaxe";
        readonly level: 1;
        readonly speed: 4;
        readonly effectiveness: 1.2;
    };
    readonly STEEL_PICKAXE: {
        readonly id: 1269;
        readonly name: "Steel pickaxe";
        readonly level: 6;
        readonly speed: 3;
        readonly effectiveness: 1.5;
    };
    readonly BLACK_PICKAXE: {
        readonly id: 12297;
        readonly name: "Black pickaxe";
        readonly level: 11;
        readonly speed: 3;
        readonly effectiveness: 1.6;
    };
    readonly MITHRIL_PICKAXE: {
        readonly id: 1273;
        readonly name: "Mithril pickaxe";
        readonly level: 21;
        readonly speed: 2;
        readonly effectiveness: 2;
    };
    readonly ADAMANT_PICKAXE: {
        readonly id: 1271;
        readonly name: "Adamant pickaxe";
        readonly level: 31;
        readonly speed: 2;
        readonly effectiveness: 2.5;
    };
    readonly RUNE_PICKAXE: {
        readonly id: 1275;
        readonly name: "Rune pickaxe";
        readonly level: 41;
        readonly speed: 1;
        readonly effectiveness: 3;
    };
};
export declare const FISHING_TOOLS: {
    readonly SMALL_FISHING_NET: {
        readonly id: 303;
        readonly name: "Small fishing net";
        readonly level: 1;
    };
    readonly FISHING_ROD: {
        readonly id: 307;
        readonly name: "Fishing rod";
        readonly level: 5;
    };
    readonly FLY_FISHING_ROD: {
        readonly id: 309;
        readonly name: "Fly fishing rod";
        readonly level: 20;
    };
    readonly HARPOON: {
        readonly id: 311;
        readonly name: "Harpoon";
        readonly level: 35;
    };
    readonly LOBSTER_POT: {
        readonly id: 301;
        readonly name: "Lobster pot";
        readonly level: 40;
    };
};
export declare const BIRD_NEST_DROP_RATE: number;
export declare const BEAVER_PET_DROP_RATES: {
    readonly 1000: 72321;
    readonly 1001: 72321;
    readonly 1002: 72321;
    readonly 1003: 72321;
    readonly 1004: 72321;
    readonly default: 72321;
};
export declare const ROCK_GOLEM_PET_DROP_RATES: {
    readonly 2000: 244640;
    readonly 2001: 244640;
    readonly 2002: 244640;
    readonly 2003: 244640;
    readonly 2004: 244640;
    readonly 2005: 244640;
    readonly default: 244640;
};
export declare const FISH: {
    readonly shrimps: {
        readonly level: 1;
        readonly xp: 10;
        readonly itemId: 317;
    };
    readonly anchovies: {
        readonly level: 1;
        readonly xp: 40;
        readonly itemId: 321;
    };
    readonly sardine: {
        readonly level: 5;
        readonly xp: 20;
        readonly itemId: 327;
    };
    readonly herring: {
        readonly level: 10;
        readonly xp: 30;
        readonly itemId: 345;
    };
    readonly pike: {
        readonly level: 20;
        readonly xp: 60;
        readonly itemId: 349;
    };
    readonly trout: {
        readonly level: 20;
        readonly xp: 50;
        readonly itemId: 335;
    };
    readonly salmon: {
        readonly level: 30;
        readonly xp: 70;
        readonly itemId: 331;
    };
    readonly tuna: {
        readonly level: 35;
        readonly xp: 80;
        readonly itemId: 359;
    };
    readonly swordfish: {
        readonly level: 50;
        readonly xp: 100;
        readonly itemId: 371;
    };
    readonly lobster: {
        readonly level: 40;
        readonly xp: 90;
        readonly itemId: 377;
    };
};
/**
 * Get the most effective tool for a player's level
 * @param tools Tool collection to search
 * @param playerLevel Player's skill level
 * @param playerId Player entity (for inventory check)
 * @returns Best available tool or null
 */
export declare function getEffectiveTool(tools: Record<string, any>, playerLevel: number, playerId?: any): any | null;
/**
 * Calculate woodcutting success chance using OSRS formula
 * @param playerLevel Player's woodcutting level
 * @param treeLevel Tree's required level
 * @param toolEffectiveness Tool effectiveness multiplier
 * @returns Success chance (0.0-1.0)
 */
export declare function calculateWoodcuttingSuccess(playerLevel: number, treeLevel: number, toolEffectiveness: number): number;
/**
 * Calculate mining success chance using OSRS formula
 * @param playerLevel Player's mining level
 * @param rockLevel Rock's required level
 * @param toolEffectiveness Tool effectiveness multiplier
 * @returns Success chance (0.0-1.0)
 */
export declare function calculateMiningSuccess(playerLevel: number, rockLevel: number, toolEffectiveness: number): number;
/**
 * Calculate fishing success chance
 * @param playerLevel Player's fishing level
 * @param fishLevel Fish's required level
 * @returns Success chance (0.0-1.0)
 */
export declare function calculateFishingSuccess(playerLevel: number, fishLevel: number): number;
/**
 * Calculate success chance for cooking
 */
export declare function calculateCookingSuccess(cookingLevel: number, foodLevel: number, toolEffectiveness?: number): number;
/**
 * Calculate burn chance for cooking
 */
export declare function calculateBurnChance(cookingLevel: number, foodLevel: number, burnStopLevel: number, isRange?: boolean, hasCookingGauntlets?: boolean): number;
/**
 * Calculate success chance for firemaking
 */
export declare function calculateFiremakingSuccess(firemakingLevel: number, logLevel: number, toolEffectiveness?: number): number;
export declare const PET_DROP_RATES: {
    readonly BEAVER: {
        readonly 1000: 72321;
        readonly 1001: 72321;
        readonly 1002: 72321;
        readonly 1003: 72321;
        readonly 1004: 72321;
        readonly default: 72321;
    };
    readonly ROCK_GOLEM: {
        readonly 2000: 244640;
        readonly 2001: 244640;
        readonly 2002: 244640;
        readonly 2003: 244640;
        readonly 2004: 244640;
        readonly 2005: 244640;
        readonly default: 244640;
    };
    readonly HERON: 257211;
    readonly ROCKY: 149389;
    readonly PHOENIX: 5000;
};
export declare const PHOENIX_PET_DROP_RATES: {
    readonly 1511: 5000;
    readonly 1521: 5000;
    readonly 1519: 5000;
    readonly 6333: 5000;
    readonly 1517: 5000;
    readonly default: 5000;
};
export declare const TINDERBOX_ID = 590;
export declare const ROCKY_PET_DROP_RATE = 149389;
/**
 * Calculate success chance for any gathering skill
 */
