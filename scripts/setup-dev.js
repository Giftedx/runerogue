#!/usr/bin/env node

/**
 * Automated development environment setup script for RuneRogue
 * Handles prerequisites checking, certificate generation, and initial configuration
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

/**
 * Log with color
 */
function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  const nodeVersion = process.version.match(/^v(\d+)/)[1];
  if (parseInt(nodeVersion) < 18) {
    log("❌ Node.js 18+ required. Current version: " + process.version, "red");
    process.exit(1);
  }
  log("✅ Node.js version: " + process.version, "green");
}

/**
 * Check and install pnpm if needed
 */
function checkPnpm() {
  if (!commandExists("pnpm")) {
    log("❌ pnpm not found. Installing...", "yellow");
    try {
      execSync("npm install -g pnpm", { stdio: "inherit" });
      log("✅ pnpm installed successfully", "green");
    } catch (error) {
      log(
        "❌ Failed to install pnpm. Please install manually: npm install -g pnpm",
        "red"
      );
      process.exit(1);
    }
  } else {
    const version = execSync("pnpm --version", { encoding: "utf8" }).trim();
    log("✅ pnpm version: " + version, "green");
  }
}

/**
 * Check mkcert installation
 */
function checkMkcert() {
  if (!commandExists("mkcert")) {
    log("❌ mkcert not found. Please install mkcert first:", "red");
    log("  Windows: choco install mkcert", "yellow");
    log("  macOS: brew install mkcert", "yellow");
    log("  Linux: https://github.com/FiloSottile/mkcert/releases", "yellow");
    process.exit(1);
  }
  log("✅ mkcert is installed", "green");
}

/**
 * Install dependencies
 */
function installDependencies() {
  log("\n📦 Installing dependencies...", "blue");
  try {
    execSync("pnpm install", { stdio: "inherit" });
    log("✅ Dependencies installed successfully", "green");
  } catch (error) {
    log("❌ Failed to install dependencies", "red");
    process.exit(1);
  }
}

/**
 * Generate HTTPS certificates
 */
function generateCertificates() {
  const clientPath = path.join(__dirname, "..", "packages", "phaser-client");
  const serverPath = path.join(__dirname, "..", "packages", "server");

  // Ensure directories exist
  if (!fs.existsSync(clientPath)) {
    log("❌ Client package directory not found", "red");
    process.exit(1);
  }

  if (!fs.existsSync(serverPath)) {
    fs.mkdirSync(serverPath, { recursive: true });
  }

  const clientKeyPath = path.join(clientPath, "key.pem");
  const clientCertPath = path.join(clientPath, "cert.pem");

  if (!fs.existsSync(clientKeyPath) || !fs.existsSync(clientCertPath)) {
    log("\n🔐 Generating HTTPS certificates...", "blue");

    try {
      // Install mkcert root certificate
      execSync("mkcert -install", { stdio: "inherit" });

      // Generate certificates
      execSync(
        "mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1",
        {
          cwd: clientPath,
          stdio: "inherit",
        }
      );

      // Copy to server
      fs.copyFileSync(clientKeyPath, path.join(serverPath, "key.pem"));
      fs.copyFileSync(clientCertPath, path.join(serverPath, "cert.pem"));

      log("✅ HTTPS certificates generated successfully", "green");
    } catch (error) {
      log("❌ Failed to generate certificates: " + error.message, "red");
      process.exit(1);
    }
  } else {
    log("✅ HTTPS certificates already exist", "green");

    // Ensure server has certificates
    if (!fs.existsSync(path.join(serverPath, "key.pem"))) {
      fs.copyFileSync(clientKeyPath, path.join(serverPath, "key.pem"));
      fs.copyFileSync(clientCertPath, path.join(serverPath, "cert.pem"));
    }
  }
}

/**
 * Create environment files
 */
function createEnvFiles() {
  const clientPath = path.join(__dirname, "..", "packages", "phaser-client");
  const serverPath = path.join(__dirname, "..", "packages", "server");

  const clientEnvPath = path.join(clientPath, ".env");
  const serverEnvPath = path.join(serverPath, ".env");

  let created = false;

  if (!fs.existsSync(clientEnvPath)) {
    log("\n📝 Creating client .env file...", "blue");
    const clientEnv = `# Discord Activity Configuration
VITE_DISCORD_CLIENT_ID=your_discord_app_id

# Server URLs
VITE_GAME_SERVER_URL=wss://localhost:2567
VITE_API_URL=https://localhost:2567

# HTTPS Configuration
VITE_HTTPS_KEY=./key.pem
VITE_HTTPS_CERT=./cert.pem

# Development Settings
VITE_DEV_MODE=true
`;
    fs.writeFileSync(clientEnvPath, clientEnv);
    created = true;
  }

  if (!fs.existsSync(serverEnvPath)) {
    log("📝 Creating server .env file...", "blue");
    const jwtSecret = crypto.randomBytes(32).toString("hex");
    const serverEnv = `# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback

# Server Configuration
PORT=2567
NODE_ENV=development

# Security
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${crypto.randomBytes(32).toString("hex")}

# HTTPS Configuration
HTTPS_KEY=./key.pem
HTTPS_CERT=./cert.pem

# Database (future)
# DATABASE_URL=postgresql://user:password@localhost:5432/runerogue

# Redis (future)
# REDIS_URL=redis://localhost:6379
`;
    fs.writeFileSync(serverEnvPath, serverEnv);
    created = true;
  }

  if (created) {
    log("✅ Environment files created", "green");
  } else {
    log("✅ Environment files already exist", "green");
  }
}

/**
 * Verify TypeScript configuration
 */
function verifyTypeScript() {
  log("\n🔧 Verifying TypeScript configuration...", "blue");

  try {
    // Clean and rebuild TypeScript projects
    execSync("pnpm -r exec tsc --build --clean", { stdio: "ignore" });
    execSync("pnpm type-check", { stdio: "inherit" });
    log("✅ TypeScript configuration is valid", "green");
  } catch (error) {
    log(
      "⚠️  TypeScript configuration has errors (this is normal for initial setup)",
      "yellow"
    );
  }
}

/**
 * Display next steps
 */
function displayNextSteps() {
  log("\n✅ Development environment setup complete!", "green");
  log("\n📋 Next steps:", "blue");
  log(
    "1. Create a Discord application at https://discord.com/developers/applications",
    "yellow"
  );
  log("2. Update .env files with your Discord app credentials", "yellow");
  log('3. Run "pnpm dev" to start development servers', "yellow");
  log("4. Visit https://localhost:3000 to test the application", "yellow");

  log("\n🔗 Useful commands:", "blue");
  log("  pnpm dev          - Start all development servers", "yellow");
  log("  pnpm test         - Run tests", "yellow");
  log("  pnpm build        - Build all packages", "yellow");
  log("  pnpm type-check   - Check TypeScript types", "yellow");

  log("\n📚 Documentation:", "blue");
  log(
    "  Development Workflow: .github/instructions/development-workflow.instructions.md",
    "yellow"
  );
  log(
    "  Architecture Guide: .github/instructions/architecture.instructions.md",
    "yellow"
  );
  log(
    "  Core Standards: .github/instructions/core-standards.instructions.md",
    "yellow"
  );
}

/**
 * Main setup function
 */
async function main() {
  log("🚀 RuneRogue Development Environment Setup", "blue");
  log("==========================================\n", "blue");

  // Run all checks
  checkNodeVersion();
  checkPnpm();
  checkMkcert();
  installDependencies();
  generateCertificates();
  createEnvFiles();
  verifyTypeScript();
  displayNextSteps();
}

// Run setup
main().catch((error) => {
  log("\n❌ Setup failed: " + error.message, "red");
  process.exit(1);
});
