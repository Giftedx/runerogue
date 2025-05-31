"""
Test Flask application functionality.
"""
import json
from unittest.mock import Mock, patch
import os
import shutil
import uuid # For unique temp file names

import pytest

# Import app and its globals to reset them for tests
from app import app as flask_app # Rename to avoid confusion with the module
import app as app_module # Import the module to access its globals
from health import HealthStatus # Import the actual Enum for better mocking


@pytest.fixture
def client():
    """Create test client and reset improvement log state from app_module."""
    flask_app.config["TESTING"] = True
    # Reset improvement log state before each test using this client
    app_module.improvement_log.clear()
    app_module.next_suggestion_id = 1
    with flask_app.test_client() as client:
        yield client


class TestFlaskApp:
    """Test Flask application endpoints."""

    def test_home_endpoint(self, client):
        """Test home endpoint."""
        response = client.get("/")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["message"] == "RuneRogue API"
        assert data["version"] == "1.0.0"
        assert "config" in data
        assert "self_building" in data
        assert data["self_building"]["milestone"] == "M1"

    def test_config_endpoint(self, client):
        """Test config endpoint."""
        response = client.get("/config")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert isinstance(data, dict)

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_detailed_health_endpoint(self, client):
        """Test detailed health endpoint with performance metrics."""
        response = client.get("/health/detailed")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "status" in data
        assert "health_score" in data
        assert "performance" in data
        assert "self_building" in data
        assert data["self_building"]["milestone"] == "M1"
        assert "health_monitoring" in data["self_building"]

    def test_health_trends_endpoint(self, client):
        """Test health trends endpoint."""
        response = client.get("/health/trends")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "trends" in data
        assert "milestone" in data
        assert data["milestone"] == "M1"

    def test_health_score_endpoint(self, client):
        """Test current health score endpoint."""
        response = client.get("/health/score")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "overall_score" in data
        assert "status" in data
        assert "components" in data
        assert "alerts" in data
        assert data["milestone"] == "M1"

    def test_monitoring_alerts_endpoint(self, client):
        """Test monitoring alerts endpoint."""
        response = client.get("/monitoring/alerts")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "alerts" in data
        assert "total_count" in data
        assert "critical_count" in data
        assert "warning_count" in data
        assert data["milestone"] == "M1"

    def test_metrics_endpoint(self, client):
        """Test Prometheus metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.content_type

    def test_performance_baseline_get(self, client):
        """Test getting performance baseline."""
        response = client.get("/performance/baseline")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "status" in data

    def test_performance_baseline_post(self, client):
        """Test establishing performance baseline."""
        response = client.post("/performance/baseline")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data["status"] == "baseline_established"
        assert "baseline" in data

    def test_improvement_suggestions(self, client):
        """Test improvement suggestions endpoint."""
        response = client.get("/improvements/suggestions")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "suggestions" in data
        assert "milestone" in data
        assert data["milestone"] == "M1"
        assert "health_score" in data
        assert "health_status" in data

    def test_improvement_history(self, client):
        """Test improvement history endpoint basic structure."""
        # Globals are reset by the client fixture now
        response = client.get("/improvements/history")
        assert response.status_code == 200
        
        data = json.loads(response.data)
        # After recent changes, the key is "improvements_log"
        assert "improvements_log" in data
        assert data["total_count"] == 0
        assert "status_counts" in data

    def test_scrape_endpoint_missing_url(self, client):
        """Test scrape endpoint with missing URL."""
        response = client.post(
            "/scrape", data=json.dumps({}), content_type="application/json"
        )
        assert response.status_code == 400

        data = json.loads(response.data)
        assert "error" in data
        assert "URL is required" in data["error"]

    @patch("app.WebScraper")
    def test_scrape_endpoint_success(self, mock_scraper_class, client):
        """Test successful scrape endpoint."""
        mock_scraper = Mock()
        mock_scraper.fetch.return_value = "<html><body>Test content</body></html>"
        mock_scraper_class.return_value = mock_scraper

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["success"] is True
        assert data["url"] == "http://example.com"
        assert "content_length" in data

    @patch("app.WebScraper")
    def test_scrape_endpoint_failure(self, mock_scraper_class, client):
        """Test scrape endpoint failure."""
        mock_scraper = Mock()
        mock_scraper.fetch.return_value = None
        mock_scraper_class.return_value = mock_scraper

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 500

        data = json.loads(response.data)
        assert data["success"] is False
        assert "error" in data


    # --- Tests for Improvement Suggestion Logging and History ---

    def _reset_improvement_globals(self):
        """Helper to reset global suggestion state in app.py for test isolation."""
        app_module.improvement_log.clear()
        app_module.next_suggestion_id = 1

    @patch('app.metrics')
    @patch('app.health_scorer')
    def test_generic_suggestion_logging_and_history(self, mock_health_scorer, mock_metrics, client):
        """Test logging of generic suggestions and their persistence in history."""
        self._reset_improvement_globals()

        # --- First call: Trigger "Establish Performance Baseline" suggestion ---
        mock_metrics.baseline = None # Condition to trigger "Establish Performance Baseline"

        # Mock health scorer to return a default healthy state otherwise
        mock_health_instance = Mock()
        mock_health_instance.score = 90
        mock_health_instance.trend = "stable"
        mock_health_instance.components = {}
        # Ensure status.value is JSON serializable
        mock_health_instance.status = HealthStatus.EXCELLENT # Use the actual Enum
        mock_health_scorer.calculate_overall_health.return_value = mock_health_instance
        # Prevent "Enable System Resource Monitoring" suggestion and regression suggestions
        mock_metrics.gauges = {'system_cpu_usage_percent': 50}
        mock_metrics.check_performance_regression.return_value = {"status": "performance_ok", "regressions": []}

        # Mock find_code_tags to return empty for this test, as it focuses on generic suggestions
        with patch('app.find_code_tags', return_value=[]) as mock_find_tags:
            # --- First call section ---
            response = client.get("/improvements/suggestions")
            assert response.status_code == 200
            data = json.loads(response.data)
            mock_find_tags.assert_called_once() # Ensure it was called for the first call

            baseline_suggestion = next((s for s in data['suggestions'] if s['title'] == "Establish Performance Baseline"), None)
            assert baseline_suggestion is not None
            assert baseline_suggestion['status'] == 'pending'
            suggestion_id_1 = baseline_suggestion['id']

            # Check history
            response_history = client.get("/improvements/history")
            assert response_history.status_code == 200
            data_history = json.loads(response_history.data)
            assert data_history['total_count'] == 1
            assert len(data_history['improvements_log']) == 1
            assert data_history['improvements_log'][0]['id'] == suggestion_id_1
            assert data_history['improvements_log'][0]['title'] == "Establish Performance Baseline"
            assert data_history['improvements_log'][0]['status'] == 'pending'

            # --- Second call: "Resolve" baseline, trigger "Low Health Score" ---
            mock_metrics.baseline = Mock() # Baseline now exists
            mock_metrics.baseline.response_time_p95 = 0.1
            # mock_metrics.check_performance_regression.return_value is already set from before
            # mock_metrics.gauges is also already set

            mock_health_instance.score = 60 # Low health score
            mock_health_scorer.calculate_overall_health.return_value = mock_health_instance

            # find_code_tags is still mocked as [] due to the 'with' block scope
            response = client.get("/improvements/suggestions")
            assert response.status_code == 200
            data = json.loads(response.data)
            assert mock_find_tags.call_count == 2 # Verify it's called again

            # Baseline suggestion should NOT be in current suggestions
            assert not any(s['title'] == "Establish Performance Baseline" for s in data['suggestions'])

            low_health_suggestion = next((s for s in data['suggestions'] if s['title'] == "Improve System Health Score"), None)
            assert low_health_suggestion is not None
            assert low_health_suggestion['status'] == 'pending'
            suggestion_id_2 = low_health_suggestion['id']
            assert suggestion_id_1 != suggestion_id_2 # Ensure new suggestion gets new ID

            # Check history again
            response_history = client.get("/improvements/history")
            data_history = json.loads(response_history.data)
            assert data_history['total_count'] == 2
        assert len(data_history['improvements_log']) == 2

        # Verify original baseline suggestion is still in history
        assert any(s['id'] == suggestion_id_1 and s['title'] == "Establish Performance Baseline" for s in data_history['improvements_log'])
        # Verify new low health suggestion is in history
        assert any(s['id'] == suggestion_id_2 and s['title'] == "Improve System Health Score" for s in data_history['improvements_log'])

    def test_code_quality_suggestions_logging_and_history(self, client):
        """Test logging of code quality (TODO/FIXME) suggestions."""
        self._reset_improvement_globals()

        # Create a temporary directory for test files
        temp_project_dir = f"temp_test_project_{uuid.uuid4().hex}"
        os.makedirs(os.path.join(temp_project_dir, "subdir"), exist_ok=True)
        os.makedirs(os.path.join(temp_project_dir, "tests"), exist_ok=True) # Excluded dir
        os.makedirs(os.path.join(temp_project_dir, ".venv", "lib"), exist_ok=True) # Excluded dir

        # File that should be scanned
        test_file_path = os.path.join(temp_project_dir, "subdir", "test_code.py")
        with open(test_file_path, "w") as f:
            f.write("# TODO: Implement this important feature\n")
            f.write("class MyClass:\n")
            f.write("    pass # FIXME: Fix this logic urgently\n")

        # File in an excluded directory (tests)
        excluded_file_path_tests = os.path.join(temp_project_dir, "tests", "ignore.py")
        with open(excluded_file_path_tests, "w") as f:
            f.write("# TODO: This should be ignored by the scanner\n")

        # File in an excluded directory (.venv)
        excluded_file_path_venv = os.path.join(temp_project_dir, ".venv", "lib", "some_dep.py")
        with open(excluded_file_path_venv, "w") as f:
            f.write("# FIXME: This is a library fixme, should be ignored\n")

        try:
            # Mock health/metrics to avoid other suggestions clouding this test
            with patch('app.health_scorer') as mock_health_scorer, \
                 patch('app.metrics') as mock_metrics:

                mock_metrics.baseline = Mock() # Assume baseline exists
                mock_metrics.check_performance_regression.return_value = {"status": "performance_ok", "regressions": []}
                mock_health_instance = Mock()
                mock_health_instance.score = 95
                mock_health_instance.trend = "stable"
                mock_health_instance.components = {}
                # Ensure status.value is JSON serializable
                mock_health_instance.status = HealthStatus.EXCELLENT # Use the actual Enum
                mock_health_scorer.calculate_overall_health.return_value = mock_health_instance
                # Prevent "Enable System Resource Monitoring" suggestion
                mock_metrics.gauges = {'system_cpu_usage_percent': 50}

                # Override the CWD for find_code_tags by patching os.getcwd if find_code_tags uses relative path '.'
                # However, find_code_tags in app.py is called with '.', which means it scans from project root.
                # For testing, we want it to scan our temp_project_dir as if it were the project root.
                # The easiest way is to patch find_code_tags itself to return controlled output,
                # OR, ensure find_code_tags is robust enough for an absolute path if we pass it.
                # The current implementation of find_code_tags in app.py uses '.',
                # so we patch 'app.find_code_tags' to control its output based on our temp files.

                # Let's actually use the real find_code_tags but make it scan our temp dir
                # by temporarily changing CWD or patching `find_code_tags` call in `app.py`
                # Patching `app.find_code_tags` is cleaner.

                # Expected results from our temp files
                expected_tags_found = [
                    {
                        'file_path': os.path.normpath(test_file_path), 'line_number': 1, 'tag': 'TODO',
                        'comment': 'Implement this important feature',
                        'full_comment_line': '# TODO: Implement this important feature'
                    },
                    {
                        'file_path': os.path.normpath(test_file_path), 'line_number': 3, 'tag': 'FIXME',
                        'comment': 'Fix this logic urgently',
                        'full_comment_line': '# FIXME: Fix this logic urgently'
                    }
                ]

                with patch('app.find_code_tags', return_value=expected_tags_found) as mock_find_tags:
                    response = client.get("/improvements/suggestions")
                    assert response.status_code == 200
                    data = json.loads(response.data)
                    mock_find_tags.assert_called_once_with('.', ['TODO', 'FIXME']) # Verify it's called as expected

                assert len(data['suggestions']) == 2, f"Expected 2 code quality suggestions, got {len(data['suggestions'])}"

                sugg1 = data['suggestions'][0]
                sugg2 = data['suggestions'][1]

                assert sugg1['type'] == 'code_quality'
                assert sugg1['priority'] == 'low'
                assert sugg1['status'] == 'pending'
                assert "Address TODO" in sugg1['title']
                assert os.path.normpath(test_file_path) in sugg1['title'] # Check file path in title
                assert sugg1['description'] == '# TODO: Implement this important feature'
                assert sugg1['details']['comment_text'] == 'Implement this important feature'

                assert sugg2['type'] == 'code_quality'
                assert sugg2['status'] == 'pending'
                assert "Address FIXME" in sugg2['title']
                assert os.path.normpath(test_file_path) in sugg2['title'] # Check file path in title
                assert sugg2['description'] == '# FIXME: Fix this logic urgently'
                assert sugg2['details']['comment_text'] == 'Fix this logic urgently'

                sugg1_id = sugg1['id']
                sugg2_id = sugg2['id']

                # Check history
                response_history = client.get("/improvements/history")
                data_history = json.loads(response_history.data)
                assert data_history['total_count'] == 2
                assert len(data_history['improvements_log']) == 2

                history_sugg1 = next(s for s in data_history['improvements_log'] if s['id'] == sugg1_id)
                history_sugg2 = next(s for s in data_history['improvements_log'] if s['id'] == sugg2_id)

                assert history_sugg1['title'] == sugg1['title']
                assert history_sugg2['title'] == sugg2['title']
                assert history_sugg1['status'] == 'pending'
                assert history_sugg2['status'] == 'pending'

        finally:
            # Clean up temporary directory
            if os.path.exists(temp_project_dir):
                shutil.rmtree(temp_project_dir)

    def test_no_duplicate_code_quality_suggestions_on_refresh(self, client):
        """Test that refreshing suggestions doesn't create duplicate code quality logs."""
        self._reset_improvement_globals()
        temp_project_dir = f"temp_test_project_{uuid.uuid4().hex}"
        os.makedirs(os.path.join(temp_project_dir, "subdir"), exist_ok=True)
        test_file_path = os.path.join(temp_project_dir, "subdir", "test_code_dup.py")
        with open(test_file_path, "w") as f:
            f.write("# TODO: A task that persists\n")

        try:
            with patch('app.health_scorer') as mock_health_scorer, \
                 patch('app.metrics') as mock_metrics:
                mock_metrics.baseline = Mock()
                mock_metrics.check_performance_regression.return_value = {"status": "performance_ok", "regressions": []}
                mock_health_instance = Mock()
                mock_health_instance.score = 95; mock_health_instance.trend = "stable"; mock_health_instance.components = {}
                # Ensure status.value is JSON serializable
                mock_health_instance.status = HealthStatus.EXCELLENT # Use the actual Enum
                mock_health_scorer.calculate_overall_health.return_value = mock_health_instance
                # Prevent "Enable System Resource Monitoring" suggestion
                mock_metrics.gauges = {'system_cpu_usage_percent': 50}

                # Expected tag, using real find_code_tags by patching where it's called from app
                # We need to make sure find_code_tags scans our temp_project_dir correctly
                # For this, we'll patch 'app.find_code_tags' to simulate it running on our temp dir
                expected_tag = [{
                    'file_path': os.path.normpath(test_file_path), 'line_number': 1, 'tag': 'TODO',
                    'comment': 'A task that persists',
                    'full_comment_line': '# TODO: A task that persists'
                }]

                with patch('app.find_code_tags', return_value=expected_tag):
                    # First call
                    response1 = client.get("/improvements/suggestions")
                    assert response1.status_code == 200
                    data1 = json.loads(response1.data)
                    assert len(data1['suggestions']) == 1
                    sugg1_id = data1['suggestions'][0]['id']

                    # Second call (simulating refresh, code tag still exists)
                    response2 = client.get("/improvements/suggestions")
                    assert response2.status_code == 200
                    data2 = json.loads(response2.data)
                    assert len(data2['suggestions']) == 1
                    assert data2['suggestions'][0]['id'] == sugg1_id # Should be the same suggestion

                # Check history
                response_history = client.get("/improvements/history")
                data_history = json.loads(response_history.data)
                assert data_history['total_count'] == 1 # Still only one logged item
                assert data_history['improvements_log'][0]['id'] == sugg1_id
        finally:
            if os.path.exists(temp_project_dir):
                shutil.rmtree(temp_project_dir)

    @patch("app.WebScraper")
    def test_scrape_endpoint_exception(self, mock_scraper_class, client):
        """Test scrape endpoint with exception."""
        mock_scraper_class.side_effect = Exception("Test exception")

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 500

        data = json.loads(response.data)
        assert data["success"] is False
        assert "error" in data
