# RuneRogue - Godot Client

This directory contains the Godot Engine 4.x client for the RuneRogue browser game.

## Setup

### Prerequisites

- Godot Engine 4.3.0 or later
- Git LFS (for asset management)

### Development Workflow

1. **Install Godot Engine 4.3+**

   - Download from [https://godotengine.org/download](https://godotengine.org/download)
   - Or use package manager: `sudo snap install godot-4`

2. **Clone and Setup**

   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue/client/godot
   ```

3. **Open in Godot**

   - Launch Godot Engine
   - Click "Import" and select the `client/godot` directory
   - Open the project

4. **Run the Project**
   - Press F5 to run the project
   - Select `scenes/main.tscn` as the main scene if prompted

## Project Structure

```
client/godot/
├── project.godot          # Main project configuration
├── export_presets.cfg     # Export settings for different platforms
├── scenes/                # Scene files (.tscn)
│   ├── main.tscn         # Main scene - entry point
│   ├── main_menu.tscn    # Main menu scene
│   ├── game_scene.tscn   # Game scene
│   └── hud.tscn          # HUD/UI overlay
├── scripts/               # GDScript files (.gd)
│   ├── main.gd           # Main scene controller
│   ├── main_menu.gd      # Main menu logic
│   ├── game_scene.gd     # Game scene logic
│   └── hud.gd            # HUD controller
├── assets/                # Game assets (managed by Git LFS)
│   ├── icons/            # Application icons
│   ├── sprites/          # Sprite images (.png, .jpg)
│   ├── audio/            # Sound files (.ogg, .wav)
│   └── fonts/            # Font files (.ttf, .otf)
└── builds/                # Export builds (excluded from git)
    └── web/              # Web/HTML5 builds
```

## Building for Web

### Manual Build

1. Open the project in Godot
2. Go to Project → Export
3. Select "Web" preset
4. Click "Export Project"
5. Choose `builds/web/index.html` as the export path

### Command Line Build

```bash
# Import project (required for first build)
godot --headless --import

# Export for web
godot --headless --export-release "Web" builds/web/index.html
```

### CI/CD Build

The project automatically builds on CI/CD pipeline:

- Builds are triggered on every commit
- Web builds are uploaded as artifacts
- Available in GitHub Actions artifacts

## Asset Management

Assets are managed using Git LFS for optimal repository performance:

- **Images**: `.png`, `.jpg`, `.jpeg`, `.webp`
- **Audio**: `.ogg`, `.wav`, `.mp3`
- **Fonts**: `.ttf`, `.otf`, `.woff`, `.woff2`

### Adding New Assets

1. Place assets in appropriate `assets/` subdirectory
2. Git LFS will automatically track supported file types
3. Commit and push as normal

## Scene Architecture

### Main Scene (`main.tscn`)

- Entry point for the application
- Manages scene transitions
- Contains scene container and persistent HUD

### Main Menu (`main_menu.tscn`)

- Start screen with navigation buttons
- Handles game start, options, quit

### Game Scene (`game_scene.tscn`)

- Main gameplay area
- Contains player spawn point and game world

### HUD (`hud.tscn`)

- Persistent UI overlay
- Shows health, score, menu access

## Input Configuration

- **ESC**: Cancel/Back/Pause menu
- **Enter/Space**: Accept/Select
- **Arrow Keys**: Navigation (UI)

## Display Settings

- **Resolution**: 1024×768 (16:9 aspect ratio support)
- **Rendering**: GL Compatibility (for better web support)
- **Pixel Perfect**: Enabled for crisp 2D graphics
- **Scaling**: Canvas items with expand aspect

## Browser Compatibility

The web build targets modern browsers with WebGL support:

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 79+

## Development Tips

1. **Performance**: Use GL Compatibility renderer for better web performance
2. **Assets**: Keep texture sizes reasonable for web loading
3. **Audio**: Use OGG format for better compression
4. **Testing**: Test web builds regularly during development

## Troubleshooting

### Common Issues

1. **Build Fails**: Ensure Godot 4.3+ and export templates are installed
2. **Assets Missing**: Run `git lfs pull` to download LFS assets
3. **Web Build Errors**: Check browser console for WebGL errors
4. **Performance Issues**: Reduce texture sizes or disable features

### Getting Help

- Check Godot documentation: [https://docs.godotengine.org](https://docs.godotengine.org)
- Review project issues on GitHub
- Join the development Discord/community channels
