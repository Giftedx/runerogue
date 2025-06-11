# RuneRogue 3D Rendering Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing 3D rendering in RuneRogue, building on the existing Godot 4.x client and ECS/Colyseus multiplayer foundation.

## Current Architecture Analysis

### ✅ Existing Strengths

- **Godot 4.x Client**: Web export configured for Discord Activities
- **ECS Server**: Transform component with x, y, z, rotation support
- **Multiplayer Sync**: Real-time player movement and combat synchronization
- **Component System**: Rich ECS with Health, Equipment, Skills, Movement, etc.
- **Network Infrastructure**: Colyseus rooms with state broadcasting

### 🔄 Areas for 3D Extension

- **Client Scenes**: Currently 2D (Node2D) → Convert to 3D (Node3D)
- **Rendering Pipeline**: No 3D models or materials
- **Camera System**: No 3D camera or perspective controls
- **UI Integration**: Need 3D world + 2D UI overlay

## Implementation Phases

### Phase 1: Project Foundation (1-2 days)

#### 1.1 Godot Project 3D Conversion

```bash
# Tasks:
- Convert project.godot to 3D renderer
- Update export presets for 3D web builds
- Create new 3D scene structure
- Set up basic 3D environment
```

**Files to Modify:**

- `client/godot/project.godot` - Enable 3D renderer
- `client/godot/export_presets.cfg` - Optimize for 3D web
- `client/godot/scenes/game_scene_3d.tscn` - New 3D game scene

#### 1.2 Basic 3D Scene Setup

```gdscript
# New 3D scene hierarchy:
GameScene3D (Node3D)
├── Environment (3D environment, lighting)
├── CameraController (Camera management)
├── PlayerManager (3D player entities)
├── EnemyManager (3D enemy entities)
├── WorldManager (3D environment objects)
└── UIOverlay (CanvasLayer for 2D UI)
```

### Phase 2: 3D Asset Pipeline (2-3 days)

#### 2.1 3D Model Creation

**Player Models:**

- Basic humanoid character (low-poly for web performance)
- Equipment slots for weapons, armor, accessories
- Animation controller for movement, combat, idle

**Enemy Models:**

- Goblin, skeleton, dragon variants based on OSRS enemies
- Scalable difficulty with model variations
- Attack and death animations

**Environment Models:**

- Terrain tiles for dungeon floors/walls
- Props: chests, doors, decorative elements
- Optimized for web rendering

#### 2.2 Material and Texture System

```gdscript
# Material pipeline:
- PBR materials for realistic lighting
- Texture atlasing for performance
- Equipment material swapping system
- Animated materials for special effects
```

### Phase 3: ECS-to-3D Integration (3-4 days)

#### 3.1 Server State Mapping

**Transform Synchronization:**

```typescript
// Server ECS Transform Component (already exists):
Transform = {
  x: f32, // World X position
  y: f32, // World Y position
  z: f32, // World Z position (height)
  rotation: f32, // Y-axis rotation (facing direction)
};

// Map to Godot 3D:
node.position = Vector3(transform.x, transform.z, transform.y); // Z-up conversion
node.rotation_degrees.y = (transform.rotation * 180) / PI;
```

#### 3.2 Enhanced Multiplayer Sync

**Extend `multiplayer_sync.gd`:**

```gdscript
class PlayerSyncData3D extends PlayerSyncData:
    var position_3d: Vector3
    var rotation_3d: Vector3
    var animation_state: String
    var equipment_models: Dictionary

    func update_3d_transform(node: Node3D):
        # Smooth interpolation for 3D movement
        var target_pos = Vector3(position.x, position.z, position.y)
        node.position = node.position.lerp(target_pos, interpolation_factor)
        node.rotation_degrees.y = lerp_angle(node.rotation_degrees.y, rotation_3d.y, interpolation_factor)
```

#### 3.3 Component Rendering System

**Equipment Rendering:**

```gdscript
class EquipmentRenderer3D:
    func update_equipment(player_node: Node3D, equipment_data: Dictionary):
        # Dynamically swap weapon/armor models based on ECS Equipment component
        var weapon_slot = player_node.get_node("WeaponSlot")
        var armor_body = player_node.get_node("ArmorBody")

        # Load and attach equipment models
        if equipment_data.weapon != 0:
            weapon_slot.set_model(load_weapon_model(equipment_data.weapon))
```

### Phase 4: Camera and Control System (2-3 days)

#### 4.1 3D Camera Controller

```gdscript
class_name CameraController3D
extends Node3D

@export var follow_target: Node3D
@export var camera_distance: float = 10.0
@export var camera_height: float = 8.0
@export var rotation_speed: float = 2.0
@export var zoom_speed: float = 0.1

var camera: Camera3D
var pivot: Node3D

func _ready():
    setup_camera_rig()

func setup_camera_rig():
    # Create camera pivot and positioning
    pivot = Node3D.new()
    add_child(pivot)

    camera = Camera3D.new()
    pivot.add_child(camera)
    camera.position = Vector3(0, camera_height, camera_distance)
    camera.look_at(Vector3.ZERO, Vector3.UP)

func _process(delta):
    if follow_target:
        # Follow player smoothly
        global_position = global_position.lerp(follow_target.global_position, 5.0 * delta)

        # Handle camera rotation input
        handle_camera_input(delta)

func handle_camera_input(delta):
    # Mouse/touch camera rotation
    if Input.is_action_pressed("camera_rotate"):
        var mouse_delta = Input.get_last_mouse_velocity() * 0.001
        pivot.rotation_degrees.y -= mouse_delta.x * rotation_speed
        pivot.rotation_degrees.x = clamp(pivot.rotation_degrees.x - mouse_delta.y * rotation_speed, -45, 45)
```

#### 4.2 UI Overlay Integration

```gdscript
# UI system that works with 3D world:
class_name UIOverlay3D
extends CanvasLayer

@onready var health_bar = $HealthBar
@onready var minimap = $Minimap
@onready var inventory_panel = $InventoryPanel

func update_player_ui(player_data: Dictionary):
    # Update health bar from ECS Health component
    health_bar.value = float(player_data.health.current) / float(player_data.health.max)

    # Update skill displays from ECS Skills component
    update_skill_displays(player_data.skills)
```

### Phase 5: Performance Optimization (2-3 days)

#### 5.1 Web Performance

**Rendering Optimizations:**

- LOD (Level of Detail) system for models
- Occlusion culling for hidden objects
- Texture streaming for large environments
- Shader optimization for mobile/web

**Network Optimizations:**

- 3D state compression
- Interpolation improvements for 3D movement
- Reduced update frequency for distant players

#### 5.2 Memory Management

```gdscript
class ResourceManager3D:
    var model_cache: Dictionary = {}
    var texture_cache: Dictionary = {}

    func get_model(model_id: String) -> PackedScene:
        if not model_cache.has(model_id):
            model_cache[model_id] = load("res://assets/models/" + model_id + ".glb")
        return model_cache[model_id]

    func cleanup_unused_resources():
        # Periodically clean up unused 3D resources
        pass
```

### Phase 6: Advanced 3D Features (3-4 days)

#### 6.1 Lighting and Atmosphere

```gdscript
# Dynamic lighting system:
class LightingManager3D:
    func setup_dungeon_lighting():
        # Ambient lighting for general visibility
        var env = Environment.new()
        env.ambient_light_color = Color(0.2, 0.2, 0.3)
        env.ambient_light_energy = 0.3

        # Point lights for torches, magic effects
        add_dynamic_lights()

    func add_spell_effect_light(position: Vector3, color: Color):
        # Dynamic lighting for magic spells
        var light = OmniLight3D.new()
        light.light_color = color
        light.position = position
        add_child(light)
```

#### 6.2 Animation System

**Character Animations:**

- Idle, walk, run, attack, death animations
- Equipment-specific attack animations
- Smooth blending between animation states

**Combat Effects:**

- Particle systems for spell effects
- Screen shake for impacts
- Animation curves for smooth combat feedback

## File Structure

```
client/godot/
├── scenes/
│   ├── main.tscn                    # Updated main scene
│   ├── main_menu.tscn              # Keep existing
│   ├── game_scene_2d.tscn          # Rename existing
│   ├── game_scene_3d.tscn          # New 3D game scene
│   ├── player_3d.tscn              # 3D player prefab
│   ├── enemy_3d.tscn               # 3D enemy prefab
│   └── ui_overlay_3d.tscn          # 3D UI overlay
├── scripts/
│   ├── main.gd                     # Keep existing
│   ├── game_scene_3d.gd            # New 3D game controller
│   ├── camera_controller_3d.gd     # 3D camera system
│   ├── player_controller_3d.gd     # 3D player controller
│   ├── enemy_controller_3d.gd      # 3D enemy controller
│   ├── multiplayer_sync_3d.gd      # Enhanced multiplayer sync
│   ├── equipment_renderer_3d.gd    # Equipment system
│   ├── lighting_manager_3d.gd      # Lighting system
│   └── ui_overlay_3d.gd            # UI controller
├── assets/
│   ├── models/                     # 3D models (.glb files)
│   │   ├── characters/
│   │   ├── equipment/
│   │   ├── enemies/
│   │   └── environment/
│   ├── materials/                  # PBR materials
│   ├── textures/                   # Texture atlases
│   └── animations/                 # Animation files
└── addons/
    └── better_3d_tools/           # Custom 3D tooling if needed
```

## Integration Points

### Server-Side Changes Required

1. **Enhanced Transform Broadcasting:**

```typescript
// In GameRoom.ts, broadcast 3D transform data:
onPlayerMove(sessionId: string, data: { x: number, y: number, z: number, rotation: number }) {
    const player = this.players.get(sessionId);
    if (player) {
        // Update ECS Transform component
        Transform.x[player.entity] = data.x;
        Transform.y[player.entity] = data.y;
        Transform.z[player.entity] = data.z;
        Transform.rotation[player.entity] = data.rotation;

        // Broadcast to all clients
        this.broadcast("player_moved_3d", {
            sessionId,
            position: { x: data.x, y: data.y, z: data.z },
            rotation: data.rotation
        });
    }
}
```

2. **3D-Aware Combat System:**

```typescript
// Update combat calculations for 3D positioning
class CombatSystem3D extends AutoCombatSystem {
  calculateDistance3D(entity1: number, entity2: number): number {
    const dx = Transform.x[entity1] - Transform.x[entity2];
    const dy = Transform.y[entity1] - Transform.y[entity2];
    const dz = Transform.z[entity1] - Transform.z[entity2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
```

### Client-Side Integration

1. **WebSocket Message Handling:**

```gdscript
# In multiplayer_sync_3d.gd:
func handle_player_moved_3d(data: Dictionary):
    var player_id = data.sessionId
    var player_data = players.get(player_id, null)

    if player_data:
        player_data.position_3d = Vector3(data.position.x, data.position.z, data.position.y)
        player_data.rotation_3d.y = data.rotation

        # Update 3D node
        var player_node = get_player_node_3d(player_id)
        if player_node:
            update_player_transform_3d(player_node, player_data)
```

## Testing Strategy

### Unit Tests

- 3D transform synchronization
- Equipment rendering system
- Camera controller logic
- Performance benchmarks

### Integration Tests

```gdscript
# Test 3D multiplayer sync
extends GutTest

func test_3d_player_movement_sync():
    var sync_manager = MultiplayerSync3D.new()
    var test_data = {
        "sessionId": "test_player",
        "position": {"x": 10, "y": 5, "z": 15},
        "rotation": 45
    }

    sync_manager.handle_player_moved_3d(test_data)

    var player_data = sync_manager.players.get("test_player")
    assert_eq(player_data.position_3d, Vector3(10, 15, 5))
    assert_eq(player_data.rotation_3d.y, 45)
```

### Performance Tests

- Frame rate under multiplayer load
- Memory usage with multiple 3D models
- Network bandwidth optimization
- Web build loading times

## Success Metrics

1. **Performance Targets:**

   - 60 FPS on desktop web browsers
   - 30+ FPS on mobile browsers
   - <5MB initial web build size
   - <100ms multiplayer sync latency

2. **Feature Completeness:**

   - ✅ Real-time 3D player movement sync
   - ✅ 3D equipment rendering system
   - ✅ Combat animations and effects
   - ✅ 3D camera controls
   - ✅ UI overlay integration

3. **Quality Assurance:**
   - Full test coverage for 3D systems
   - Cross-browser compatibility
   - Discord Activities integration
   - OSRS-authentic visual style

## Timeline Summary

| Phase     | Duration       | Key Deliverables                  |
| --------- | -------------- | --------------------------------- |
| Phase 1   | 1-2 days       | 3D project setup, basic scenes    |
| Phase 2   | 2-3 days       | 3D models, textures, materials    |
| Phase 3   | 3-4 days       | ECS integration, multiplayer sync |
| Phase 4   | 2-3 days       | Camera system, UI overlays        |
| Phase 5   | 2-3 days       | Performance optimization          |
| Phase 6   | 3-4 days       | Advanced features, polish         |
| **Total** | **13-19 days** | **Complete 3D RuneRogue**         |

## Next Steps

1. **Immediate (Today):**

   - Convert Godot project to 3D configuration
   - Create basic 3D scene structure
   - Set up development workflow

2. **This Week:**

   - Implement core 3D rendering pipeline
   - Create basic character models
   - Establish ECS-to-3D data flow

3. **Next Week:**
   - Complete multiplayer 3D synchronization
   - Implement camera and UI systems
   - Performance optimization and testing

This plan builds on your excellent multiplayer foundation and transforms RuneRogue into a full 3D experience while maintaining all the OSRS authenticity and real-time multiplayer features you've already achieved.
