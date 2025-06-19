#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Install ESLint and related dependencies for the RuneRogue project
 * This script is cross-platform and works on Windows, macOS, and Linux
 */

console.log("🔧 Installing ESLint dependencies...\n");

// In ESM, __dirname is not available directly. We can derive it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Check if we're in the project root
const packageJsonPath = path.join(projectRoot, "package.json");
if (!fs.existsSync(packageJsonPath)) {
  console.error(
    `❌ Error: package.json not found in ${projectRoot}. Please run this script from the project root.`
  );
  process.exit(1);
}

// Read current package.json to check existing dependencies
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const currentDevDeps = packageJson.devDependencies || {};

// Dependencies to install
const dependencies = [
  "eslint@^9.15.0",
  "@eslint/js@^9.15.0",
  "typescript-eslint@^8.16.0",
  "eslint-config-prettier@^9.1.0",
  "globals@^15.12.0",
  "@types/node@^22.10.0",
];

// Check which dependencies are missing or outdated
const toInstall = dependencies.filter((dep) => {
  const lastAtIndex = dep.lastIndexOf("@");
  const name = dep.substring(0, lastAtIndex);
  const requestedVersion = dep.substring(lastAtIndex + 1);

  const installedVersion = currentDevDeps[name];

  if (!installedVersion) {
    console.log(`  - Will install missing: ${name}`);
    return true; // Not installed
  }

  // Simple check: if version specifiers don't match, reinstall.
  if (installedVersion !== requestedVersion) {
    console.log(
      `  - Will update outdated: ${name} (found ${installedVersion}, want ${requestedVersion})`
    );
    return true; // Different version specified
  }

  return false;
});

if (toInstall.length > 0) {
  console.log("\n  The following dependencies will be installed/updated:");
  toInstall.forEach((dep) => console.log(`    - ${dep}`));
  console.log("");

  const command = `pnpm add -D -w ${toInstall.join(" ")}`;

  try {
    console.log(`🚀 Running: ${command}\n`);
    execSync(command, { stdio: "inherit", cwd: projectRoot });
    console.log("\n✅ ESLint dependencies installed successfully!");
  } catch (error) {
    console.error("\n❌ Failed to install ESLint dependencies.");
    console.error(error);
    process.exit(1);
  }
} else {
  console.log("✅ All ESLint dependencies are already up to date.");
}

// Check if eslint.config.js exists
const eslintConfigPath = path.join(projectRoot, "eslint.config.js");
if (!fs.existsSync(eslintConfigPath)) {
  console.log("\n⚠️  No eslint.config.js found. You may need to create one.");
  console.log(
    "   See the project documentation for the recommended configuration."
  );
}
