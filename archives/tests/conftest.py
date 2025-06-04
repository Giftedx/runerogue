"""
Test configuration and fixtures for RuneRogue.

This module provides pytest fixtures that can be used across all test files.
"""

import os
import pytest
import tempfile
from flask import Flask
from flask.testing import FlaskClient

from app import app as flask_app
from models import db as _db
from config import config


@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    # Set testing configuration
    flask_app.config["TESTING"] = True
    flask_app.config["DEBUG"] = False
    
    # Use in-memory SQLite for testing
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    
    # Disable CSRF protection for testing
    flask_app.config["WTF_CSRF_ENABLED"] = False
    
    # Return the app for testing
    with flask_app.app_context():
        yield flask_app


@pytest.fixture(scope="session")
def db(app):
    """Create and configure a database for testing."""
    _db.app = app
    _db.create_all()
    
    yield _db
    
    _db.session.close()
    _db.drop_all()


@pytest.fixture(scope="function")
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()
    
    session = db.create_scoped_session(
        options={"bind": connection, "binds": {}}
    )
    db.session = session
    
    yield session
    
    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture(scope="function")
def client(app):
    """Create a test client for the app."""
    with app.test_client() as client:
        yield client


@pytest.fixture(scope="function")
def runner(app):
    """Create a test CLI runner for the app."""
    return app.test_cli_runner()


@pytest.fixture(scope="function")
def mock_config():
    """Create a mock configuration for testing."""
    return {
        "debug": True,
        "dry_run": True,
        "log_level": "DEBUG",
        "timeout": 5,
        "self_build_enabled": False,
    }


@pytest.fixture(scope="function")
def mock_scraper_response():
    """Create a mock response for the web scraper."""
    return {
        "success": True,
        "url": "https://example.com",
        "content_length": 1000,
        "dry_run": True,
    }


@pytest.fixture(scope="function")
def mock_health_response():
    """Create a mock response for the health check."""
    return {
        "status": "healthy",
        "timestamp": 1622548800,
    }


@pytest.fixture(scope="function")
def temp_file():
    """Create a temporary file for testing."""
    fd, path = tempfile.mkstemp()
    try:
        yield path
    finally:
        os.close(fd)
        os.unlink(path)
