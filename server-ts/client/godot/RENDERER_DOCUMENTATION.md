# RuneRogue Client Renderer Documentation

## Overview

The RuneRogue client renderer is built using Godot Engine 4.3+ and provides a complete 2D rendering system for the browser-based roguelike game. The renderer includes:

- **Tile-based world rendering** with procedural generation
- **Dynamic lighting system** with fog of war
- **Particle effects** for visual feedback
- **Responsive UI/HUD** with health bars, chat, and action bars
- **Scene management** for smooth transitions
- **Web-optimized rendering** using GL Compatibility mode

## Architecture

### Core Components

1. **Main Scene Controller** (`scripts/main.gd`)

   - Manages scene transitions
   - Handles global input
   - Controls camera and viewport scaling
   - Manages the render pipeline

2. **Game Renderer** (`scripts/game_renderer.gd`)

   - Procedural world generation
   - Tile rendering system
   - Fog of war implementation
   - Visual effects management
   - Click-to-move interaction

3. **HUD System** (`scripts/hud.gd`)
   - Health and stats display
   - Chat system
   - Action bar with hotkeys
   - Floating damage numbers
   - Experience notifications

### Scene Structure

```
Main (Node2D)
├── Camera2D (global camera)
├── SceneContainer (holds active scene)
│   └── [MainMenu/GameScene]
└── CanvasLayer
    └── HUD (persistent UI overlay)
```

## Features

### 1. Procedural World Generation

The renderer generates a 100x100 tile world using noise-based terrain generation:

- **Terrain Types**: Water, Stone, Grass, Floor
- **Structures**: Randomly placed rooms with walls and doors
- **Spawn System**: Player spawns in a safe room

### 2. Rendering System

- **Tile Size**: 32x32 pixels
- **Viewport**: 1024x768 base resolution
- **Scaling**: Automatic zoom adjustment for different screen sizes
- **Pixel Perfect**: Enabled for crisp 2D graphics

### 3. Fog of War

- **Vision Radius**: 15 tiles
- **Persistent Exploration**: Discovered areas remain partially visible
- **Dynamic Updates**: Real-time visibility calculation as player moves

### 4. Visual Effects

- **Particle System**: CPU-based particles for damage and magic effects
- **Screen Effects**: Damage flash, low health pulse
- **Animations**: Menu transitions, button feedback

### 5. Input Handling

- **Movement**: Arrow keys or WASD
- **Action Bar**: Number keys 1-9
- **Menu**: ESC key for pause/menu
- **Debug**: F3 for debug overlay (in debug builds)

## Getting Started

### Prerequisites

1. Install Godot Engine 4.3+
2. Clone the repository
3. Install Git LFS for asset management

### Running the Project

1. **In Godot Editor**:

   ```bash
   # Open Godot
   # Import the project from server-ts/client/godot/
   # Press F5 to run
   ```

2. **Command Line Build**:

   ```bash
   cd server-ts/client/godot
   ./build.sh
   ```

3. **Test Web Build**:
   ```bash
   python3 -m http.server 8000 --directory builds/web
   # Open http://localhost:8000 in browser
   ```

## Development Guide

### Adding New Tile Types

1. Add enum value in `game_renderer.gd`:

   ```gdscript
   enum TileType {
       # ... existing types
       NEW_TILE
   }
   ```

2. Add color in `tile_colors` dictionary:

   ```gdscript
   tile_colors[TileType.NEW_TILE] = Color(r, g, b)
   ```

3. Update generation logic in `_generate_terrain()`

### Creating Visual Effects

Use the particle effect system:

```gdscript
game_renderer.create_particle_effect(position, "effect_type")
```

### Adding UI Elements

1. Edit `scenes/hud.tscn` in Godot editor
2. Update `scripts/hud.gd` with new functionality
3. Connect signals for interaction

## Performance Optimization

- **Culling**: Only visible tiles are rendered
- **Batch Rendering**: Uses Godot's built-in batching
- **Texture Atlas**: Minimize draw calls (when textures are added)
- **GL Compatibility**: Better web performance than Vulkan

## Web Deployment

The renderer is optimized for web deployment:

1. **Canvas Resize Policy**: Adaptive scaling
2. **Focus on Start**: Automatic canvas focus
3. **Progressive Loading**: Assets load on demand
4. **Mobile Support**: Touch input ready (to be implemented)

## Future Enhancements

- [ ] Sprite-based tile rendering (replace color rectangles)
- [ ] Advanced lighting with shadows
- [ ] Weather effects (rain, fog, etc.)
- [ ] Minimap implementation
- [ ] Mobile touch controls
- [ ] Multiplayer support
- [ ] Save/Load system

## Troubleshooting

### Common Issues

1. **Black Screen**: Check if main scene is set in project settings
2. **Performance Issues**: Reduce `visible_radius` in game_renderer
3. **Build Errors**: Ensure Godot 4.3+ and export templates installed
4. **Web Audio**: Some browsers block audio until user interaction

### Debug Commands

- **F3**: Toggle debug overlay (FPS, viewport info)
- **Page Up**: Regenerate world (debug builds)
- **Page Down**: Toggle lighting system

## API Reference

### Main Scene Signals

- `change_scene(scene_path: String)` - Transition to new scene

### Game Renderer Signals

- `tile_clicked(position: Vector2i)` - Emitted when tile is clicked

### HUD Methods

- `update_health(current: int, max: int)` - Update health display
- `add_chat_message(message: String, color: Color)` - Add chat message
- `show_damage_number(damage: int, position: Vector2)` - Show floating damage

## Contributing

When contributing to the renderer:

1. Follow Godot style guide for GDScript
2. Test on multiple resolutions
3. Ensure web build works
4. Document new features
5. Optimize for performance

## License

See main project LICENSE file.
