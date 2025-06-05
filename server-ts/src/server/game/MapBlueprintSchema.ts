import { z } from 'zod';

export const MapBlueprintSchema = z.object({
  id: z.string().min(1, { message: "Map ID cannot be empty." }),
  name: z.string().min(1, { message: "Map name cannot be empty." }),
  width: z.number().int().positive({ message: "Map width must be a positive integer." }),
  height: z.number().int().positive({ message: "Map height must be a positive integer." }),
  biome: z.string().optional(), // Default will be handled by AreaMap constructor or game logic
  collisionMap: z.array(z.array(z.boolean()))
    .refine(data => data.length > 0, {
      message: "Collision map cannot be empty.",
      path: ['collisionMap'],
    })
    .refine(data => data.every(row => row.length === data[0].length),
    {
      message: "All rows in the collision map must have the same width.",
      path: ['collisionMap'],
    }),
  // Optional: Define spawn points, interactive elements, etc. as the blueprint evolves
  // spawnPoints: z.array(z.object({
  //   id: z.string().min(1),
  //   x: z.number().int().nonnegative(),
  //   y: z.number().int().nonnegative(),
  //   entityType: z.string().min(1) // e.g., 'player_start', 'npc_goblin'
  // })).optional(),
  // npcs: z.array(z.object({
  //   npcTypeId: z.string().min(1),
  //   x: z.number().int().nonnegative(),
  //   y: z.number().int().nonnegative(),
  //   patrolPath: z.array(z.object({ x: z.number(), y: z.number() })).optional()
  // })).optional(),
  // lootSpawns: z.array(z.object({
  //   itemId: z.string().min(1),
  //   x: z.number().int().nonnegative(),
  //   y: z.number().int().nonnegative(),
  //   quantity: z.number().int().positive().optional()
  // })).optional(),
}).superRefine((data, ctx) => {
  if (data.collisionMap.length !== data.height) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Collision map height (${data.collisionMap.length}) must match map height (${data.height}).`,
      path: ['collisionMap'],
    });
  }
  // Check width only if height is valid and collisionMap is not empty
  if (data.collisionMap.length > 0 && data.collisionMap[0].length !== data.width) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Collision map width (${data.collisionMap[0].length}) must match map width (${data.width}).`,
      path: ['collisionMap'],
    });
  }
});

export type MapBlueprint = z.infer<typeof MapBlueprintSchema>;
