#!/bin/bash

# Build script for RuneRogue Godot client

echo "Building RuneRogue client..."

# Create build directory if it doesn't exist
mkdir -p builds/web

# Check if Godot is available
if ! command -v godot &> /dev/null; then
    echo "Error: Godot is not installed or not in PATH"
    echo "Please install Godot 4.3+ and ensure it's in your PATH"
    exit 1
fi

# Import project if needed
echo "Importing project..."
godot --headless --import

# Export for web
echo "Exporting for web..."
godot --headless --export-release "Web" builds/web/index.html

# Check if build was successful
if [ -f "builds/web/index.html" ]; then
    echo "Build successful! Output in builds/web/"
    echo "To test locally, run: python3 -m http.server 8000 --directory builds/web"
else
    echo "Build failed!"
    exit 1
fi