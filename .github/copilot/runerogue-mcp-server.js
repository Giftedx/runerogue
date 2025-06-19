/**
 * RuneRogue MCP Server
 *
 * Custom MCP server for RuneRogue-specific tools to enhance GitHub Copilot Agent capabilities.
 * This server implements custom tools for testing, linting, and documentation generation.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Base directory for the project
const PROJECT_ROOT = path.resolve(__dirname, "../..");

/**
 * Run tests for the RuneRogue project
 */
function runTests(params) {
  const { testPath, markers, verbose } = params;

  let command = "python -m pytest";

  if (testPath) {
    command += ` ${testPath}`;
  }

  if (markers) {
    command += ` -m "${markers}"`;
  }

  if (verbose) {
    command += " -v";
  }

  command += " --color=yes";

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });

    return {
      success: true,
      command,
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      command,
      error: error.message,
    };
  }
}

/**
 * Run linting on the codebase or specified files
 */
function lintCode(params) {
  const { filePath, fix } = params;

  let command = "flake8";

  if (filePath) {
    command += ` ${filePath}`;
  }

  if (fix) {
    // First run autopep8 to fix issues
    try {
      const fixCommand = `autopep8 --in-place --aggressive ${filePath || "."}`;
      execSync(fixCommand, {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error) {
      // Continue even if autopep8 fails
      console.error("Error running autopep8:", error.message);
    }
  }

  try {
    const output = execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });

    return {
      success: true,
      output: output || "No linting issues found.",
      command,
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      command,
      error: error.message,
    };
  }
}

/**
 * Generate or update documentation for specified modules
 */
function generateDocs(params) {
  const { modulePath, outputFormat = "markdown" } = params;

  if (!modulePath) {
    return {
      success: false,
      error: "Module path is required",
    };
  }

  const format = outputFormat.toLowerCase() === "rst" ? "rst" : "markdown";
  const outputDir = path.join(PROJECT_ROOT, "docs", "generated");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const moduleName = path.basename(modulePath, ".py");
  const outputFile = path.join(
    outputDir,
    `${moduleName}.${format === "rst" ? "rst" : "md"}`
  );

  let command = `python -m pydoc-markdown -I ${modulePath} -O ${outputFile} --renderer ${format}`;

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });

    return {
      success: true,
      output: `Documentation generated at ${outputFile}`,
      command,
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      command,
      error: error.message,
    };
  }
}

/**
 * Create a GitHub issue with specified title, body, labels, and assignees
 */
function createIssue(params) {
  const {
    title,
    body,
    labels = "copilot",
    assignees = "github-copilot[bot]",
  } = params;

  if (!title || !body) {
    return {
      success: false,
      error: "Title and body are required",
    };
  }

  try {
    const scriptPath = path.join(
      PROJECT_ROOT,
      "scripts",
      "create_agent_issue.py"
    );

    // Escape special characters in the parameters
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedBody = body.replace(/"/g, '\\"');
    const escapedLabels = labels.replace(/"/g, '\\"');
    const escapedAssignees = assignees.replace(/"/g, '\\"');

    const command = `python "${scriptPath}" --title "${escapedTitle}" --body "${escapedBody}" --labels "${escapedLabels}" --assignees "${escapedAssignees}" --workflow`;

    const output = execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: "pipe",
      env: {
        ...process.env,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    });

    return {
      success: true,
      output,
      command,
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.message,
    };
  }
}

// MCP Server implementation
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, arguments: args } = JSON.parse(body);
        let result;

        switch (name) {
          case "runerogue_run_tests":
            result = runTests(args);
            break;
          case "runerogue_lint_code":
            result = lintCode(args);
            break;
          case "runerogue_generate_docs":
            result = generateDocs(args);
            break;
          case "runerogue_create_issue":
            result = createIssue(args);
            break;
          default:
            result = {
              success: false,
              error: `Unknown tool: ${name}`,
            };
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: error.message,
          })
        );
      }
    });
  } else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      })
    );
  }
});

// Start the server on a random available port
server.listen(0, () => {
  const address = server.address();
  console.log(`RuneRogue MCP Server listening on port ${address.port}`);

  // MCP protocol requires writing port to stdout
  process.stdout.write(`PORT=${address.port}\n`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  server.close(() => {
    console.log("RuneRogue MCP Server shutting down");
    process.exit(0);
  });
});
