# Testing Guide for RuneRogue

This document provides comprehensive guidance for testing the RuneRogue application, including unit tests, integration tests, and end-to-end tests.

## Table of Contents

- [Testing Framework](#testing-framework)
- [Test Directory Structure](#test-directory-structure)
- [Available Fixtures](#available-fixtures)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Mocking External Services](#mocking-external-services)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Testing Framework

RuneRogue uses pytest as its primary testing framework. The configuration is defined in `pytest.ini` and includes:

- Test discovery paths
- Custom markers
- Coverage reporting
- Warning filters

## Test Directory Structure

```plaintext
tests/
├── conftest.py           # Shared fixtures and configuration
├── unit/                 # Unit tests for individual components
│   ├── test_models.py
│   ├── test_services.py
│   └── ...
├── integration/          # Tests for component interactions
│   ├── test_api.py
│   ├── test_database.py
│   └── ...
├── e2e/                  # End-to-end tests
│   └── test_workflows.py
└── test_*.py             # Module-specific tests
```

## Available Fixtures

The `conftest.py` file provides several fixtures to simplify test setup:

### Flask App Fixtures

- `app`: A Flask application instance configured for testing
- `client`: A Flask test client for making requests
- `runner`: A Flask CLI test runner

### Database Fixtures

- `db`: A database instance for testing
- `session`: A database session for transaction management
- `init_database`: Initializes the database with test data

### Mock Data Fixtures

- `mock_user`: Creates a mock user for testing
- `mock_item`: Creates a mock game item for testing
- `mock_transaction`: Creates a mock economy transaction

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions or classes in isolation:

```python
def test_calculate_combat_level():
    # Given
    stats = {"attack": 60, "strength": 70, "defence": 55, "hitpoints": 70,
             "prayer": 43, "ranged": 49, "magic": 60}

    # When
    result = calculate_combat_level(stats)

    # Then
    assert result == 71
```

### Integration Tests

Integration tests verify that components work together correctly:

```python
def test_item_purchase_updates_inventory(client, mock_user, mock_item):
    # Given
    login_user(client, mock_user)

    # When
    response = client.post('/api/economy/purchase', json={
        'item_id': mock_item.id,
        'quantity': 1
    })

    # Then
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['inventory']['items'][0]['id'] == mock_item.id
```

### API Tests

API tests verify that endpoints work as expected:

```python
def test_get_item_details(client, mock_item):
    # When
    response = client.get(f'/api/items/{mock_item.id}')

    # Then
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == mock_item.id
    assert data['name'] == mock_item.name
```

## Running Tests

### Running All Tests

```bash
pytest
```

### Running Specific Test Files

```bash
pytest tests/test_osrs_parser.py
```

### Running Tests with Specific Markers

```bash
pytest -m "api"
```

### Running Tests with Coverage

```bash
pytest --cov=src
```

## Test Coverage

The project aims to maintain high test coverage. Coverage reports can be generated with:

```bash
pytest --cov=src --cov-report=html
```

This will create an HTML report in the `htmlcov/` directory.

## Mocking External Services

For tests that involve external services (like the OSRS Wiki), use the `responses` or `pytest-mock` libraries:

```python
@responses.activate
def test_fetch_wiki_data():
    # Mock the external API response
    responses.add(
        responses.GET,
        "https://oldschool.runescape.wiki/w/Dragon_scimitar",
        body="<html>Mock content</html>",
        status=200
    )

    # Test the function that makes the request
    result = fetch_wiki_data("Dragon_scimitar")
    assert "Mock content" in result
```

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline defined in `.github/workflows/ci-cd.yml`. The workflow:

1. Sets up the test environment
2. Installs dependencies
3. Runs the tests
4. Uploads coverage reports

## Best Practices

1. **Follow the AAA pattern**: Arrange, Act, Assert
2. **Keep tests independent**: Each test should be able to run in isolation
3. **Use descriptive test names**: Names should describe what is being tested
4. **Test edge cases**: Include tests for boundary conditions and error scenarios
5. **Avoid test interdependence**: Tests should not depend on the state from other tests
6. **Use appropriate assertions**: Use specific assertions that provide clear error messages
7. **Keep tests fast**: Slow tests discourage frequent testing
8. **Use fixtures for common setup**: Avoid duplicating setup code
9. **Mock external dependencies**: Tests should not depend on external services
10. **Test both success and failure paths**: Ensure error handling works correctly

## GitHub Copilot Agents Testing

When testing code that interacts with GitHub Copilot Agents:

1. Mock the API responses from GitHub
2. Test the task creation and assignment logic
3. Verify that MCP configuration is correctly loaded
4. Test error handling for agent communication failures

Example:

```python
@patch('agents.github_api.create_issue')
def test_create_agent_task(mock_create_issue):
    # Setup
    mock_create_issue.return_value = {'id': 123, 'number': 42}

    # Execute
    result = create_agent_task("Test task", "Description", ["label1"])

    # Verify
    assert result['number'] == 42
    mock_create_issue.assert_called_once_with(
        title="Test task",
        body="Description",
        labels=["label1"]
    )
```
