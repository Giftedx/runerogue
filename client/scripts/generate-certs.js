const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔐 Generating HTTPS certificates for local development...\n");

// Check if mkcert is installed
try {
  execSync("mkcert --version", { stdio: "pipe" });
} catch (error) {
  console.error("❌ mkcert is not installed!");
  console.log("\nPlease install mkcert first:");
  console.log("- Windows (Chocolatey): choco install mkcert");
  console.log("- macOS (Homebrew): brew install mkcert");
  console.log("- Linux: https://github.com/FiloSottile/mkcert/releases\n");
  process.exit(1);
}

// Install root certificate
console.log("📋 Installing root certificate...");
execSync("mkcert -install", { stdio: "inherit" });

// Generate certificates
const clientDir = path.resolve(__dirname, "..");
process.chdir(clientDir);

console.log("\n🔑 Generating certificates for localhost...");
execSync(
  "mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1",
  { stdio: "inherit" },
);

// Verify certificates exist
if (fs.existsSync("key.pem") && fs.existsSync("cert.pem")) {
  console.log("\n✅ Certificates generated successfully!");
  console.log("- key.pem");
  console.log("- cert.pem");
  console.log("\n🚀 You can now run: npm run dev");
} else {
  console.error("\n❌ Certificate generation failed!");
  process.exit(1);
}
