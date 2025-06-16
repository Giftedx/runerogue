# RuneRogue Map System

This document outlines the map system used in RuneRogue, focusing on map blueprint structure, validation, and how maps are managed within the game server.

## 1. Overview

The map system is responsible for defining the layout, collision data, and other properties of game areas. Maps are loaded into the `GameRoom` on the server and influence navigation, NPC placement, and potentially other game mechanics.

## 2. Map Blueprint Structure

A map blueprint defines the static properties of a game map. The core structure is represented by the `AreaMap` schema in `server-ts/src/server/game/EntitySchemas.ts` and validated against the Zod schema defined in `server-ts/src/server/game/MapBlueprintSchema.ts`.

### Key Fields:

*   `id` (string): A unique identifier for the map (e.g., "default_map_001").
*   `name` (string): A human-readable name for the map (e.g., "Starting Plains").
*   `width` (number): The width of the map in tile units. Must be a positive integer.
*   `height` (number): The height of the map in tile units. Must be a positive integer.
*   `biome` (string, optional): Describes the general environment of the map (e.g., "plains", "forest", "dungeon"). Defaults to "plains" if not specified in the `AreaMap` constructor, but the schema allows it to be optional.
*   `collisionMap` (boolean[][]): A 2D array representing the collision data for the map.
    *   `true` indicates an unwalkable/collision tile.
    *   `false` indicates a walkable tile.
    *   The dimensions of this array (height x width) **must** match the `height` and `width` properties of the map blueprint.

### Example Blueprint Data (Conceptual JSON):

```json
{
  "id": "forest_glade_01",
  "name": "Whispering Glade",
  "width": 30,
  "height": 25,
  "biome": "forest",
  "collisionMap": [
    [true, true,  false, ...], 
    [true, false, false, ...], 
    // ... (23 more rows)
  ]
}
```

## 3. Map Blueprint Validation

To ensure stability and prevent errors from malformed map data, map blueprints are validated when loaded by the server.

### Validation Schema (`MapBlueprintSchema.ts`):

A Zod schema (`MapBlueprintSchema`) is used to define the expected structure and constraints for map blueprints. This schema checks:
*   **Required Fields**: `id`, `name`, `width`, `height`, `collisionMap` must be present.
*   **Data Types**: Ensures fields are of the correct type (e.g., `id` is a string, `width` is a number).
*   **Constraints**:
    *   `id` and `name` cannot be empty.
    *   `width` and `height` must be positive integers.
    *   `collisionMap` must be a non-empty 2D array of booleans.
    *   All rows in `collisionMap` must have the same length.
*   **Cross-Field Validation (`superRefine`):**
    *   The height of `collisionMap` (number of rows) must be equal to the blueprint's `height` property.
    *   The width of `collisionMap` (length of rows) must be equal to the blueprint's `width` property.

### Integration in `GameRoom.ts`:

*   The `GameRoom` now uses `WorldState` (from `EntitySchemas.ts`) which can hold multiple `AreaMap` instances.
*   A new public method `loadAndValidateMapBlueprint(blueprintData: unknown, makeCurrent: boolean = true): AreaMap | null` has been added to `GameRoom.ts`.
*   This method takes raw blueprint data, attempts to parse it using `MapBlueprintSchema.parse()`.
    *   If validation is successful, an `AreaMap` instance is created, added to `this.state.maps`, and can be set as the `currentMapId`.
    *   If validation fails, a `ZodError` is caught, details are logged to the console, and `null` is returned, preventing the invalid map from being loaded.

## 4. Loading and Managing Maps in `GameRoom`

1.  **State Management**: `GameRoom` now extends `Room<WorldState>`, allowing it to manage a collection of maps (`this.state.maps: MapSchema<AreaMap>`) and track the active map (`this.state.currentMapId: string`).
2.  **Initialization**: During `onCreate`, `GameRoom` calls `initializeDefaultMap()`. This private method demonstrates loading a predefined default map blueprint using `loadAndValidateMapBlueprint`. It also attempts to load an intentionally invalid blueprint to showcase the validation error logging.
3.  **Dynamic Loading**: The `loadAndValidateMapBlueprint` method can be used to load maps from various sources (e.g., JSON files, database entries) at runtime or during room setup.

### Example: Initializing a Default Map

```typescript
// Inside GameRoom.ts
private initializeDefaultMap(): void {
  const defaultMapBlueprintData = {
    id: 'default_map_001',
    name: 'Starting Plains',
    width: 20,
    height: 15,
    biome: 'plains',
    collisionMap: Array(15).fill(null).map(() => Array(20).fill(false)),
  };
  this.loadAndValidateMapBlueprint(defaultMapBlueprintData, true);
}
```

## 5. Future Enhancements

*   Loading map blueprints from external JSON files or a database.
*   Expanding the `MapBlueprintSchema` to include:
    *   Tile layer data (for visual rendering).
    *   Spawn points for players and NPCs.
    *   Definitions for interactive elements (e.g., doors, chests, resource nodes).
    *   Region definitions within a map (e.g., for specific events or music).
*   Server-side tools or commands to hot-reload map data.
