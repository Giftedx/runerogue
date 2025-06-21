#!/usr/bin/env node

/**
 * Performance monitoring script for RuneRogue development
 * Tracks server metrics, memory usage, and system performance
 */

const { performance } = require("perf_hooks");
const os = require("os");
const fs = require("fs");
const path = require("path");

/**
 * Performance monitoring class with enhanced metrics tracking
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      tickTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      gcStats: [],
      eventLoopLag: [],
    };
    this.lastCpuUsage = process.cpuUsage();
    this.startTime = Date.now();
    this.gcEnabled = false;

    // Try to enable GC monitoring
    try {
      const v8 = require("v8");
      const vm = require("vm");
      v8.setFlagsFromString("--expose_gc");
      this.gc = vm.runInNewContext("gc");
      this.gcEnabled = true;
    } catch {
      // GC monitoring not available
    }
  }

  /**
   * Start monitoring
   */
  start() {
    console.log("Starting performance monitor...\n");

    // Monitor tick rate
    this.monitorTickRate();

    // Monitor memory
    this.monitorMemory();

    // Monitor CPU
    this.monitorCPU();

    // Monitor event loop
    this.monitorEventLoop();

    // Display stats every 5 seconds
    this.displayInterval = setInterval(() => {
      this.displayStats();
    }, 5000);

    // Save stats to file every minute
    this.saveInterval = setInterval(() => {
      this.saveStats();
    }, 60000);

    // Handle graceful shutdown
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  /**
   * Monitor server tick rate
   */
  monitorTickRate() {
    let lastTick = Date.now();

    this.tickInterval = setInterval(() => {
      const now = Date.now();
      const tickTime = now - lastTick;

      this.metrics.tickTimes.push({
        time: tickTime,
        timestamp: now,
      });

      // Keep only last 300 samples (5 minutes)
      if (this.metrics.tickTimes.length > 300) {
        this.metrics.tickTimes.shift();
      }

      lastTick = now;
    }, 1000);
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    this.memoryInterval = setInterval(() => {
      const mem = process.memoryUsage();

      this.metrics.memoryUsage.push({
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
        arrayBuffers: mem.arrayBuffers || 0,
        timestamp: Date.now(),
      });

      // Keep only last 300 samples
      if (this.metrics.memoryUsage.length > 300) {
        this.metrics.memoryUsage.shift();
      }

      // Check for memory leaks
      if (this.metrics.memoryUsage.length > 60) {
        const recent = this.metrics.memoryUsage.slice(-60);
        const first = recent[0].heapUsed;
        const last = recent[recent.length - 1].heapUsed;
        const growth = ((last - first) / first) * 100;

        if (growth > 50) {
          console.warn(
            `⚠️  Potential memory leak detected! Heap usage increased by ${growth.toFixed(1)}% in last minute`
          );
        }
      }
    }, 1000);
  }

  /**
   * Monitor CPU usage
   */
  monitorCPU() {
    this.cpuInterval = setInterval(() => {
      const currentCpuUsage = process.cpuUsage();
      const elapsedUs =
        currentCpuUsage.user -
        this.lastCpuUsage.user +
        currentCpuUsage.system -
        this.lastCpuUsage.system;
      const elapsedMs = 1000; // Interval is 1 second
      const cpuPercent = (elapsedUs / 1000 / elapsedMs) * 100;

      this.metrics.cpuUsage.push({
        percent: cpuPercent,
        user: currentCpuUsage.user,
        system: currentCpuUsage.system,
        timestamp: Date.now(),
      });

      // Keep only last 300 samples
      if (this.metrics.cpuUsage.length > 300) {
        this.metrics.cpuUsage.shift();
      }

      this.lastCpuUsage = currentCpuUsage;
    }, 1000);
  }

  /**
   * Monitor event loop lag
   */
  monitorEventLoop() {
    let lastCheck = Date.now();

    this.eventLoopInterval = setInterval(() => {
      const now = Date.now();
      const expectedDelay = 100; // Check every 100ms
      const actualDelay = now - lastCheck;
      const lag = actualDelay - expectedDelay;

      if (lag > 10) {
        // Only record significant lag
        this.metrics.eventLoopLag.push({
          lag: lag,
          timestamp: now,
        });

        // Keep only last 100 lag events
        if (this.metrics.eventLoopLag.length > 100) {
          this.metrics.eventLoopLag.shift();
        }
      }

      lastCheck = now;
    }, 100);
  }

  /**
   * Calculate statistics for a metric array
   */
  calculateStats(values) {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Display performance statistics
   */
  displayStats() {
    console.clear();
    console.log(
      "╔══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                  RuneRogue Performance Monitor                ║"
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝"
    );
    console.log(
      `Time: ${new Date().toLocaleTimeString()} | Uptime: ${this.formatUptime()}`
    );
    console.log("");

    // Tick rate stats
    if (this.metrics.tickTimes.length > 0) {
      const tickValues = this.metrics.tickTimes.map((t) => t.time);
      const stats = this.calculateStats(tickValues);
      console.log("📊 Tick Rate:");
      console.log(`   Average: ${(1000 / stats.avg).toFixed(1)} TPS`);
      console.log(`   Range: ${stats.min}ms - ${stats.max}ms`);
      console.log(`   P95: ${stats.p95}ms | P99: ${stats.p99}ms`);
    }

    // Memory stats
    if (this.metrics.memoryUsage.length > 0) {
      const latest =
        this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      const heapValues = this.metrics.memoryUsage.map((m) => m.heapUsed);
      const heapStats = this.calculateStats(heapValues);

      console.log("\n💾 Memory Usage:");
      console.log(`   RSS: ${this.formatBytes(latest.rss)}`);
      console.log(
        `   Heap Used: ${this.formatBytes(latest.heapUsed)} / ${this.formatBytes(latest.heapTotal)}`
      );
      console.log(`   External: ${this.formatBytes(latest.external)}`);
      console.log(
        `   Heap Avg: ${this.formatBytes(heapStats.avg)} | Max: ${this.formatBytes(heapStats.max)}`
      );
    }

    // CPU stats
    if (this.metrics.cpuUsage.length > 0) {
      const cpuValues = this.metrics.cpuUsage.map((c) => c.percent);
      const cpuStats = this.calculateStats(cpuValues);

      console.log("\n🔥 CPU Usage:");
      console.log(`   Average: ${cpuStats.avg.toFixed(1)}%`);
      console.log(`   Current: ${cpuValues[cpuValues.length - 1].toFixed(1)}%`);
      console.log(
        `   P95: ${cpuStats.p95.toFixed(1)}% | P99: ${cpuStats.p99.toFixed(1)}%`
      );
    }

    // Event loop lag
    if (this.metrics.eventLoopLag.length > 0) {
      const lagValues = this.metrics.eventLoopLag.map((e) => e.lag);
      const lagStats = this.calculateStats(lagValues);

      console.log("\n⏱️  Event Loop Lag:");
      console.log(`   Events: ${lagStats.count}`);
      console.log(`   Average: ${lagStats.avg.toFixed(1)}ms`);
      console.log(`   Max: ${lagStats.max}ms`);
    }

    // System stats
    const loadAvg = os.loadavg();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    console.log("\n🖥️  System:");
    console.log(
      `   Load Average: ${loadAvg.map((l) => l.toFixed(2)).join(", ")}`
    );
    console.log(
      `   Free Memory: ${this.formatBytes(freeMem)} / ${this.formatBytes(totalMem)} (${((freeMem / totalMem) * 100).toFixed(1)}%)`
    );
    console.log(`   CPUs: ${os.cpus().length} cores`);

    console.log(
      "\n────────────────────────────────────────────────────────────────"
    );
    console.log("Press Ctrl+C to stop monitoring");
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value > 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format uptime
   */
  formatUptime() {
    const uptime = Date.now() - this.startTime;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Save statistics to file
   */
  saveStats() {
    const timestamp = new Date().toISOString();
    const stats = {
      timestamp,
      uptime: Date.now() - this.startTime,
      tickRate: this.calculateStats(this.metrics.tickTimes.map((t) => t.time)),
      memory: this.calculateStats(
        this.metrics.memoryUsage.map((m) => m.heapUsed)
      ),
      cpu: this.calculateStats(this.metrics.cpuUsage.map((c) => c.percent)),
      eventLoopLag: this.calculateStats(
        this.metrics.eventLoopLag.map((e) => e.lag)
      ),
    };

    const logDir = path.join(__dirname, "..", "logs", "performance");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(
      logDir,
      `perf-${new Date().toISOString().split("T")[0]}.json`
    );

    try {
      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
      }
      logs.push(stats);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error("Failed to save performance logs:", error.message);
    }
  }

  /**
   * Shutdown monitor gracefully
   */
  shutdown() {
    console.log("\n\nShutting down performance monitor...");

    // Clear all intervals
    clearInterval(this.tickInterval);
    clearInterval(this.memoryInterval);
    clearInterval(this.cpuInterval);
    clearInterval(this.eventLoopInterval);
    clearInterval(this.displayInterval);
    clearInterval(this.saveInterval);

    // Save final stats
    this.saveStats();

    console.log("Performance logs saved to logs/performance/");
    process.exit(0);
  }
}

// Start monitor
const monitor = new PerformanceMonitor();
monitor.start();
