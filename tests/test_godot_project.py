"""
Test Godot project structure and configuration
"""

import os
import pytest
from pathlib import Path


class TestGodotProject:
    """Test Godot project setup and structure."""

    @pytest.fixture
    def godot_project_path(self):
        """Get the path to the Godot project directory."""
        return Path(__file__).parent.parent / "client" / "godot"

    def test_project_godot_exists(self, godot_project_path):
        """Test that project.godot file exists."""
        project_file = godot_project_path / "project.godot"
        assert project_file.exists(), "project.godot file should exist"

    def test_project_godot_content(self, godot_project_path):
        """Test that project.godot has correct configuration."""
        project_file = godot_project_path / "project.godot"
        content = project_file.read_text()
        
        # Check for key configuration sections
        assert "config_version=5" in content, "Should be Godot 4.x project"
        assert 'config/name="RuneRogue"' in content, "Should have correct project name"
        assert 'run/main_scene="res://scenes/main.tscn"' in content, "Should have main scene set"
        assert "GL Compatibility" in content, "Should have GL Compatibility for web"

    def test_main_scene_exists(self, godot_project_path):
        """Test that main scene file exists."""
        main_scene = godot_project_path / "scenes" / "main.tscn"
        assert main_scene.exists(), "main.tscn should exist"

    def test_required_scenes_exist(self, godot_project_path):
        """Test that all required scene files exist."""
        scenes_dir = godot_project_path / "scenes"
        required_scenes = ["main.tscn", "main_menu.tscn", "game_scene.tscn", "hud.tscn"]
        
        for scene in required_scenes:
            scene_file = scenes_dir / scene
            assert scene_file.exists(), f"{scene} should exist"

    def test_required_scripts_exist(self, godot_project_path):
        """Test that all required script files exist."""
        scripts_dir = godot_project_path / "scripts"
        required_scripts = ["main.gd", "main_menu.gd", "game_scene.gd", "hud.gd"]
        
        for script in required_scripts:
            script_file = scripts_dir / script
            assert script_file.exists(), f"{script} should exist"

    def test_export_presets_exist(self, godot_project_path):
        """Test that export presets are configured."""
        export_file = godot_project_path / "export_presets.cfg"
        assert export_file.exists(), "export_presets.cfg should exist"
        
        content = export_file.read_text()
        assert 'platform="Web"' in content, "Should have Web export preset"
        assert 'export_path="builds/web/index.html"' in content, "Should have correct export path"

    def test_asset_directories_exist(self, godot_project_path):
        """Test that asset directories are properly structured."""
        assets_dir = godot_project_path / "assets"
        required_dirs = ["icons", "sprites", "audio", "fonts"]
        
        for asset_dir in required_dirs:
            dir_path = assets_dir / asset_dir
            assert dir_path.exists(), f"assets/{asset_dir} directory should exist"

    def test_icon_exists(self, godot_project_path):
        """Test that application icon exists."""
        icon_file = godot_project_path / "assets" / "icons" / "icon.svg"
        assert icon_file.exists(), "Application icon should exist"

    def test_gitignore_excludes_builds(self):
        """Test that .gitignore properly excludes build artifacts."""
        gitignore_path = Path(__file__).parent.parent / ".gitignore"
        content = gitignore_path.read_text()
        
        assert "client/godot/builds/" in content, "Should exclude Godot build directory"
        assert "client/godot/.godot/" in content, "Should exclude .godot directory"

    def test_gitattributes_configures_lfs(self):
        """Test that .gitattributes properly configures LFS for assets."""
        gitattributes_path = Path(__file__).parent.parent / ".gitattributes"
        content = gitattributes_path.read_text()
        
        # Check for LFS configuration for various asset types
        assert "*.png filter=lfs" in content, "Should configure LFS for PNG files"
        assert "*.ogg filter=lfs" in content, "Should configure LFS for OGG files"
        assert "*.ttf filter=lfs" in content, "Should configure LFS for TTF files"