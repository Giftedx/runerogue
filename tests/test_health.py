"""
Tests for health scoring system functionality (Milestone M1).
"""

import pytest
import time
from unittest.mock import patch, MagicMock
from health import HealthScorer, HealthStatus, HealthComponent, OverallHealth
from metrics import MetricsCollector


class TestHealthScorer:
    """Test HealthScorer functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.health_scorer = HealthScorer()
        self.metrics = MetricsCollector(max_history=100)
        
    def test_health_scorer_initialization(self):
        """Test health scorer initialization."""
        assert isinstance(self.health_scorer.health_history, list)
        assert len(self.health_scorer.health_history) == 0
        assert self.health_scorer.max_history == 100
        
    def test_calculate_performance_health_excellent(self):
        """Test performance health calculation with excellent metrics."""
        # Mock metrics with good performance
        with patch('health.metrics') as mock_metrics:
            mock_metrics.get_percentile.return_value = 0.1  # Fast response time
            mock_metrics.get_error_rate.return_value = 0.0  # No errors
            mock_metrics._calculate_throughput.return_value = 100.0
            mock_metrics.baseline = MagicMock()
            mock_metrics.baseline.throughput = 100.0
            mock_metrics.check_performance_regression.return_value = {"status": "performance_ok"}
            
            health = self.health_scorer.calculate_performance_health()
            
            assert isinstance(health, HealthComponent)
            assert health.name == "performance"
            assert health.score >= 90
            assert health.status == HealthStatus.EXCELLENT
            assert "excellent" in health.message.lower()
            
    def test_calculate_performance_health_poor(self):
        """Test performance health calculation with poor metrics."""
        with patch('health.metrics') as mock_metrics:
            mock_metrics.get_percentile.return_value = 3.0  # Very slow response time
            mock_metrics.get_error_rate.return_value = 15.0  # High error rate
            mock_metrics._calculate_throughput.return_value = 10.0
            mock_metrics.baseline = MagicMock()
            mock_metrics.baseline.throughput = 100.0
            mock_metrics.check_performance_regression.return_value = {
                "status": "regression_detected",
                "regressions": [{"metric": "response_time"}]
            }
            
            health = self.health_scorer.calculate_performance_health()
            
            assert health.score < 50
            assert health.status == HealthStatus.CRITICAL
            assert len(health.message) > 0
            
    def test_calculate_system_health_excellent(self):
        """Test system health calculation with excellent metrics."""
        with patch('health.metrics') as mock_metrics:
            mock_metrics.gauges = {
                "system_cpu_usage_percent": 30.0,
                "system_memory_usage_percent": 40.0,
                "system_disk_usage_percent": 50.0
            }
            
            health = self.health_scorer.calculate_system_health()
            
            assert health.name == "system"
            assert health.score >= 90
            assert health.status == HealthStatus.EXCELLENT
            
    def test_calculate_system_health_poor(self):
        """Test system health calculation with poor metrics."""
        with patch('health.metrics') as mock_metrics:
            mock_metrics.gauges = {
                "system_cpu_usage_percent": 95.0,
                "system_memory_usage_percent": 98.0,
                "system_disk_usage_percent": 97.0
            }
            
            health = self.health_scorer.calculate_system_health()
            
            assert health.score < 50
            assert health.status == HealthStatus.CRITICAL
            assert "high" in health.message.lower()
            
    def test_calculate_availability_health_excellent(self):
        """Test availability health calculation with excellent metrics."""
        with patch('health.metrics') as mock_metrics:
            mock_metrics.get_error_rate.return_value = 0.0
            mock_metrics.counters = {}  # No exceptions
            mock_metrics.baseline = MagicMock()  # Baseline exists
            
            health = self.health_scorer.calculate_availability_health()
            
            assert health.name == "availability"
            assert health.score >= 90
            assert health.status == HealthStatus.EXCELLENT
            
    def test_calculate_availability_health_poor(self):
        """Test availability health calculation with poor metrics."""
        with patch('health.metrics') as mock_metrics:
            mock_metrics.get_error_rate.return_value = 10.0  # High error rate
            mock_metrics.counters = {
                "http_request_exceptions_total{type=ValueError}": 20
            }
            mock_metrics.baseline = None  # No baseline
            
            health = self.health_scorer.calculate_availability_health()
            
            assert health.score < 60
            assert health.status in [HealthStatus.WARNING, HealthStatus.CRITICAL]
            
    def test_calculate_overall_health(self):
        """Test overall health calculation."""
        with patch('health.metrics') as mock_metrics:
            # Mock good metrics
            mock_metrics.get_percentile.return_value = 0.1
            mock_metrics.get_error_rate.return_value = 0.0
            mock_metrics._calculate_throughput.return_value = 100.0
            mock_metrics.baseline = MagicMock()
            mock_metrics.baseline.throughput = 100.0
            mock_metrics.check_performance_regression.return_value = {"status": "performance_ok"}
            mock_metrics.gauges = {
                "system_cpu_usage_percent": 30.0,
                "system_memory_usage_percent": 40.0,
                "system_disk_usage_percent": 50.0
            }
            mock_metrics.counters = {}
            
            overall_health = self.health_scorer.calculate_overall_health()
            
            assert isinstance(overall_health, OverallHealth)
            assert overall_health.score >= 80
            assert overall_health.status in [HealthStatus.EXCELLENT, HealthStatus.GOOD]
            assert "performance" in overall_health.components
            assert "system" in overall_health.components
            assert "availability" in overall_health.components
            assert isinstance(overall_health.alerts, list)
            assert overall_health.trend in ["improving", "stable", "degrading"]
            
    def test_health_trend_calculation(self):
        """Test health trend calculation."""
        # Add some health history
        for i in range(5):
            overall_health = OverallHealth(
                score=70 + i * 5,  # Improving scores
                status=HealthStatus.GOOD,
                components={},
                alerts=[],
                last_updated=time.time() - (5-i) * 60,  # Spread over time
                trend="stable"
            )
            self.health_scorer.health_history.append(overall_health)
            
        # Calculate new health with improvement
        with patch('health.metrics') as mock_metrics:
            mock_metrics.get_percentile.return_value = 0.1
            mock_metrics.get_error_rate.return_value = 0.0
            mock_metrics._calculate_throughput.return_value = 100.0
            mock_metrics.baseline = MagicMock()
            mock_metrics.baseline.throughput = 100.0
            mock_metrics.check_performance_regression.return_value = {"status": "performance_ok"}
            mock_metrics.gauges = {
                "system_cpu_usage_percent": 30.0,
                "system_memory_usage_percent": 40.0,
                "system_disk_usage_percent": 50.0
            }
            mock_metrics.counters = {}
            
            overall_health = self.health_scorer.calculate_overall_health()
            
            # Should detect improving trend
            assert overall_health.trend == "improving"
            
    def test_get_health_trends(self):
        """Test getting health trends."""
        # Add some health history
        for i in range(10):
            overall_health = OverallHealth(
                score=70 + i,
                status=HealthStatus.GOOD,
                components={},
                alerts=[],
                last_updated=time.time() - i * 3600,  # Spread over hours
                trend="stable"
            )
            self.health_scorer.health_history.append(overall_health)
            
        trends = self.health_scorer.get_health_trends(hours=12)
        
        assert trends["status"] == "available"
        assert trends["period_hours"] == 12
        assert trends["data_points"] > 0
        assert "average_score" in trends
        assert "min_score" in trends
        assert "max_score" in trends
        assert "current_score" in trends
        assert "trend" in trends
        
    def test_get_health_trends_no_data(self):
        """Test getting health trends with no data."""
        trends = self.health_scorer.get_health_trends(hours=24)
        
        assert trends["status"] == "no_data"
        assert "message" in trends


class TestHealthComponents:
    """Test health component classes."""
    
    def test_health_component_creation(self):
        """Test health component creation."""
        component = HealthComponent(
            name="test",
            score=85.0,
            status=HealthStatus.GOOD,
            message="Test component is good",
            last_updated=time.time()
        )
        
        assert component.name == "test"
        assert component.score == 85.0
        assert component.status == HealthStatus.GOOD
        assert "good" in component.message.lower()
        assert component.last_updated > 0
        assert component.threshold_warning == 70.0
        assert component.threshold_critical == 50.0
        
    def test_overall_health_creation(self):
        """Test overall health creation."""
        components = {
            "test": HealthComponent(
                name="test",
                score=85.0,
                status=HealthStatus.GOOD,
                message="Test is good",
                last_updated=time.time()
            )
        }
        
        overall_health = OverallHealth(
            score=85.0,
            status=HealthStatus.GOOD,
            components=components,
            alerts=["Test alert"],
            last_updated=time.time(),
            trend="stable"
        )
        
        assert overall_health.score == 85.0
        assert overall_health.status == HealthStatus.GOOD
        assert "test" in overall_health.components
        assert len(overall_health.alerts) == 1
        assert overall_health.trend == "stable"
        assert overall_health.last_updated > 0


class TestHealthStatus:
    """Test HealthStatus enum."""
    
    def test_health_status_values(self):
        """Test health status enum values."""
        assert HealthStatus.EXCELLENT.value == "excellent"
        assert HealthStatus.GOOD.value == "good"
        assert HealthStatus.WARNING.value == "warning"
        assert HealthStatus.CRITICAL.value == "critical"
        assert HealthStatus.UNKNOWN.value == "unknown"