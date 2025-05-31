"""
Test configuration module functionality.
"""

import os
import tempfile
from unittest.mock import patch

import yaml

from config import Config, config


class TestConfig:
    """Test Config class functionality."""

    def test_config_initialization(self):
        """Test config initialization."""
        test_config = Config()
        assert isinstance(test_config._config, dict)

    def test_config_get_default(self):
        """Test config.get() with default values."""
        test_config = Config()
        assert test_config.get("nonexistent_key", "default") == "default"
        assert test_config.get("nonexistent_key") is None

    def test_config_set_and_get(self):
        """Test config.set() and get() functionality."""
        test_config = Config()
        test_config.set("test_key", "test_value")
        assert test_config.get("test_key") == "test_value"

    @patch.dict(os.environ, {}, clear=True)
    def test_config_yaml_loading(self):
        """Test YAML config file loading."""
        test_data = {"debug": True, "timeout": 60, "nested": {"key": "value"}}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
            yaml.dump(test_data, f)
            temp_file = f.name

        try:
            test_config = Config(temp_file)
            assert test_config.get("debug") is False  # ENV override defaults to False
            assert test_config.get("timeout") == 30  # ENV override defaults to 30
            assert test_config.get("nested") == {"key": "value"}  # YAML only
        finally:
            os.unlink(temp_file)

    @patch.dict(
        os.environ,
        {"DEBUG": "true", "DRY_RUN": "false", "LOG_LEVEL": "DEBUG", "TIMEOUT": "45"},
    )
    def test_environment_variables(self):
        """Test environment variable override."""
        test_config = Config()
        assert test_config.get("debug") is True
        assert test_config.get("dry_run") is False
        assert test_config.get("log_level") == "DEBUG"
        assert test_config.get("timeout") == 45

    def test_config_all(self):
        """Test config.all() returns copy of config."""
        test_config = Config()
        test_config.set("test", "value")
        all_config = test_config.all()

        assert isinstance(all_config, dict)
        assert all_config["test"] == "value"

        # Ensure it's a copy
        all_config["test"] = "modified"
        assert test_config.get("test") == "value"

    def test_invalid_yaml_file(self):
        """Test handling of invalid YAML file."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
            f.write("invalid: yaml: content: [")
            temp_file = f.name

        try:
            # Should not raise exception
            test_config = Config(temp_file)
            assert isinstance(test_config._config, dict)
        finally:
            os.unlink(temp_file)

    def test_nonexistent_yaml_file(self):
        """Test handling of nonexistent YAML file."""
        # Should not raise exception
        test_config = Config("/nonexistent/file.yml")
        assert isinstance(test_config._config, dict)


class TestGlobalConfig:
    """Test global config instance."""

    def test_global_config_exists(self):
        """Test that global config instance exists."""
        assert config is not None
        assert hasattr(config, "get")
        assert hasattr(config, "set")

    def test_global_config_functionality(self):
        """Test global config basic functionality."""
        # Should not raise exception
        value = config.get("some_key", "default")
        assert value == "default"
