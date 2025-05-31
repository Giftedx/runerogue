"""
RuneRogue Configuration Module

Provides configuration management with YAML support and fallback patterns.
"""

import os
from typing import Any, Dict, Optional

import yaml


class Config:
    """Configuration manager with YAML and environment variable support."""

    def __init__(self, config_file: Optional[str] = None):
        self._config = {}
        self._load_config(config_file)

    def _load_config(self, config_file: Optional[str] = None) -> None:
        """Load configuration from YAML file and environment variables."""
        # Load from YAML file if provided
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, "r") as f:
                    self._config = yaml.safe_load(f) or {}
            except Exception as e:
                print(f"Warning: Could not load config file {config_file}: {e}")

        # Override with environment variables
        env_vars = {
            "debug": os.getenv("DEBUG", "false").lower() == "true",
            "dry_run": os.getenv("DRY_RUN", "false").lower() == "true",
            "log_level": os.getenv("LOG_LEVEL", "INFO"),
            "timeout": int(os.getenv("TIMEOUT", "30")),
        }

        for key, value in env_vars.items():
            if value is not None:
                self._config[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key with optional default."""
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set configuration value."""
        self._config[key] = value

    def all(self) -> Dict[str, Any]:
        """Get all configuration values."""
        return self._config.copy()


# Global configuration instance
config = Config(os.getenv("CONFIG_FILE", "config/config.yml"))
