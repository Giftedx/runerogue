"""
RuneRogue Health Scoring System

Implements comprehensive health scoring for self-monitoring framework (Milestone M1).
"""

import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from metrics import metrics

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Overall health status levels."""
    EXCELLENT = "excellent"
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class HealthComponent:
    """Individual health component score."""
    name: str
    score: float  # 0-100
    status: HealthStatus
    message: str
    last_updated: float
    threshold_warning: float = 70.0
    threshold_critical: float = 50.0


@dataclass
class OverallHealth:
    """Overall system health assessment."""
    score: float  # 0-100
    status: HealthStatus
    components: Dict[str, HealthComponent]
    alerts: List[str]
    last_updated: float
    trend: str  # "improving", "stable", "degrading"


class HealthScorer:
    """Calculates comprehensive health scores for the application."""
    
    def __init__(self):
        self.health_history: List[OverallHealth] = []
        self.max_history = 100
        
    def calculate_performance_health(self) -> HealthComponent:
        """Calculate health score based on performance metrics."""
        score = 100.0
        issues = []
        
        # Check response time (weight: 40%)
        p95 = metrics.get_percentile("http_request_duration_seconds", 95)
        if p95 is not None:
            if p95 > 2.0:  # > 2 seconds is critical
                score -= 40
                issues.append(f"Very slow response time: {p95:.2f}s")
            elif p95 > 1.0:  # > 1 second is warning
                score -= 20
                issues.append(f"Slow response time: {p95:.2f}s")
            elif p95 > 0.5:  # > 0.5 seconds is minor
                score -= 10
                issues.append(f"Elevated response time: {p95:.2f}s")
        
        # Check error rate (weight: 30%)
        error_rate = metrics.get_error_rate()
        if error_rate > 10.0:  # > 10% is critical
            score -= 30
            issues.append(f"High error rate: {error_rate:.1f}%")
        elif error_rate > 5.0:  # > 5% is warning
            score -= 15
            issues.append(f"Elevated error rate: {error_rate:.1f}%")
        elif error_rate > 1.0:  # > 1% is minor
            score -= 5
            issues.append(f"Some errors: {error_rate:.1f}%")
        
        # Check throughput (weight: 20%)
        throughput = metrics._calculate_throughput(300)  # Last 5 minutes
        baseline_throughput = metrics.baseline.throughput if metrics.baseline else 0
        if baseline_throughput > 0:
            throughput_ratio = throughput / baseline_throughput
            if throughput_ratio < 0.5:  # < 50% of baseline is critical
                score -= 20
                issues.append(f"Very low throughput: {throughput:.2f} req/s")
            elif throughput_ratio < 0.7:  # < 70% of baseline is warning
                score -= 10
                issues.append(f"Low throughput: {throughput:.2f} req/s")
        
        # Check for performance regression (weight: 10%)
        regression_check = metrics.check_performance_regression()
        if regression_check["status"] == "regression_detected":
            score -= 10
            issues.append("Performance regression detected")
        
        score = max(0, score)  # Ensure score doesn't go below 0
        
        if score >= 90:
            status = HealthStatus.EXCELLENT
        elif score >= 70:
            status = HealthStatus.GOOD
        elif score >= 50:
            status = HealthStatus.WARNING
        else:
            status = HealthStatus.CRITICAL
        
        message = "Performance is excellent" if not issues else "; ".join(issues)
        
        return HealthComponent(
            name="performance",
            score=score,
            status=status,
            message=message,
            last_updated=time.time()
        )
    
    def calculate_system_health(self) -> HealthComponent:
        """Calculate health score based on system resource metrics."""
        score = 100.0
        issues = []
        
        # Check CPU usage (weight: 30%)
        cpu_key = None
        for key in metrics.gauges.keys():
            if "system_cpu_usage_percent" in key:
                cpu_key = key
                break
        
        if cpu_key:
            cpu_usage = metrics.gauges[cpu_key]
            if cpu_usage > 90:  # > 90% is critical
                score -= 30
                issues.append(f"Very high CPU usage: {cpu_usage:.1f}%")
            elif cpu_usage > 75:  # > 75% is warning
                score -= 15
                issues.append(f"High CPU usage: {cpu_usage:.1f}%")
            elif cpu_usage > 60:  # > 60% is minor
                score -= 5
                issues.append(f"Elevated CPU usage: {cpu_usage:.1f}%")
        
        # Check memory usage (weight: 30%)
        memory_key = None
        for key in metrics.gauges.keys():
            if "system_memory_usage_percent" in key:
                memory_key = key
                break
        
        if memory_key:
            memory_usage = metrics.gauges[memory_key]
            if memory_usage > 95:  # > 95% is critical
                score -= 30
                issues.append(f"Very high memory usage: {memory_usage:.1f}%")
            elif memory_usage > 85:  # > 85% is warning
                score -= 15
                issues.append(f"High memory usage: {memory_usage:.1f}%")
            elif memory_usage > 75:  # > 75% is minor
                score -= 5
                issues.append(f"Elevated memory usage: {memory_usage:.1f}%")
        
        # Check disk usage (weight: 25%)
        disk_key = None
        for key in metrics.gauges.keys():
            if "system_disk_usage_percent" in key:
                disk_key = key
                break
        
        if disk_key:
            disk_usage = metrics.gauges[disk_key]
            if disk_usage > 95:  # > 95% is critical
                score -= 25
                issues.append(f"Very high disk usage: {disk_usage:.1f}%")
            elif disk_usage > 90:  # > 90% is warning
                score -= 12
                issues.append(f"High disk usage: {disk_usage:.1f}%")
            elif disk_usage > 85:  # > 85% is minor
                score -= 5
                issues.append(f"Elevated disk usage: {disk_usage:.1f}%")
        
        # Check if we have recent system metrics (weight: 15%)
        has_recent_metrics = any(
            "system_" in key for key in metrics.gauges.keys()
        )
        if not has_recent_metrics:
            score -= 15
            issues.append("System metrics not available")
        
        score = max(0, score)
        
        if score >= 90:
            status = HealthStatus.EXCELLENT
        elif score >= 70:
            status = HealthStatus.GOOD
        elif score >= 50:
            status = HealthStatus.WARNING
        else:
            status = HealthStatus.CRITICAL
        
        message = "System resources are optimal" if not issues else "; ".join(issues)
        
        return HealthComponent(
            name="system",
            score=score,
            status=status,
            message=message,
            last_updated=time.time()
        )
    
    def calculate_availability_health(self) -> HealthComponent:
        """Calculate health score based on availability and uptime."""
        score = 100.0
        issues = []
        
        # Check recent error rate (weight: 50%)
        error_rate = metrics.get_error_rate(window_seconds=300)  # Last 5 minutes
        if error_rate > 5.0:  # > 5% errors is critical
            score -= 50
            issues.append(f"High recent error rate: {error_rate:.1f}%")
        elif error_rate > 2.0:  # > 2% is warning
            score -= 25
            issues.append(f"Elevated recent error rate: {error_rate:.1f}%")
        elif error_rate > 0.5:  # > 0.5% is minor
            score -= 10
            issues.append(f"Some recent errors: {error_rate:.1f}%")
        
        # Check for exceptions (weight: 30%)
        exception_count = 0
        for key, value in metrics.counters.items():
            if "http_request_exceptions_total" in key:
                exception_count += value
        
        if exception_count > 10:  # > 10 exceptions is critical
            score -= 30
            issues.append(f"Many exceptions: {exception_count}")
        elif exception_count > 5:  # > 5 is warning
            score -= 15
            issues.append(f"Some exceptions: {exception_count}")
        elif exception_count > 0:  # Any exceptions is minor
            score -= 5
            issues.append(f"Few exceptions: {exception_count}")
        
        # Check baseline availability (weight: 20%)
        if not metrics.baseline:
            score -= 20
            issues.append("No performance baseline established")
        
        score = max(0, score)
        
        if score >= 95:
            status = HealthStatus.EXCELLENT
        elif score >= 80:
            status = HealthStatus.GOOD
        elif score >= 60:
            status = HealthStatus.WARNING
        else:
            status = HealthStatus.CRITICAL
        
        message = "Service is fully available" if not issues else "; ".join(issues)
        
        return HealthComponent(
            name="availability",
            score=score,
            status=status,
            message=message,
            last_updated=time.time()
        )
    
    def calculate_overall_health(self) -> OverallHealth:
        """Calculate overall system health score."""
        components = {
            "performance": self.calculate_performance_health(),
            "system": self.calculate_system_health(),
            "availability": self.calculate_availability_health()
        }
        
        # Calculate weighted overall score
        weights = {
            "performance": 0.4,
            "system": 0.3,
            "availability": 0.3
        }
        
        overall_score = sum(
            components[name].score * weights[name]
            for name in components.keys()
        )
        
        # Determine overall status
        if overall_score >= 90:
            status = HealthStatus.EXCELLENT
        elif overall_score >= 75:
            status = HealthStatus.GOOD
        elif overall_score >= 60:
            status = HealthStatus.WARNING
        else:
            status = HealthStatus.CRITICAL
        
        # Collect alerts from components
        alerts = []
        for component in components.values():
            if component.status in [HealthStatus.WARNING, HealthStatus.CRITICAL]:
                alerts.append(f"{component.name.title()}: {component.message}")
        
        # Determine trend
        trend = self._calculate_trend(overall_score)
        
        health = OverallHealth(
            score=overall_score,
            status=status,
            components=components,
            alerts=alerts,
            last_updated=time.time(),
            trend=trend
        )
        
        # Store in history
        self.health_history.append(health)
        if len(self.health_history) > self.max_history:
            self.health_history = self.health_history[-self.max_history:]
        
        return health
    
    def _calculate_trend(self, current_score: float) -> str:
        """Calculate health trend based on history."""
        if len(self.health_history) < 3:
            return "stable"
        
        recent_scores = [h.score for h in self.health_history[-3:]]
        recent_scores.append(current_score)
        
        # Calculate trend over last few measurements
        if len(recent_scores) >= 3:
            trend_value = (recent_scores[-1] - recent_scores[0]) / len(recent_scores)
            if trend_value > 2:
                return "improving"
            elif trend_value < -2:
                return "degrading"
        
        return "stable"
    
    def get_health_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get health trends over specified time period."""
        cutoff_time = time.time() - (hours * 3600)
        recent_health = [
            h for h in self.health_history 
            if h.last_updated >= cutoff_time
        ]
        
        if not recent_health:
            return {"status": "no_data", "message": "No health data available"}
        
        scores = [h.score for h in recent_health]
        
        return {
            "status": "available",
            "period_hours": hours,
            "data_points": len(scores),
            "average_score": sum(scores) / len(scores),
            "min_score": min(scores),
            "max_score": max(scores),
            "current_score": scores[-1] if scores else 0,
            "trend": recent_health[-1].trend if recent_health else "unknown"
        }


# Global health scorer instance
health_scorer = HealthScorer()