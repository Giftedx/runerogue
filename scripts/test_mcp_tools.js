#!/usr/bin/env node
/**
 * Test script for RuneRogue MCP tools
 * 
 * This script demonstrates how to use the custom MCP tools for RuneRogue directly,
 * without going through GitHub Copilot Agents. This is useful for testing and development.
 * 
 * Usage:
 *   node test_mcp_tools.js run_tests --test_path=tests/test_economy_models.py --markers=unit --verbose=true
 *   node test_mcp_tools.js run_linting --file_path=economy_models/ --auto_fix=true
 *   node test_mcp_tools.js generate_docs --module_path=agents/osrs_agent_system.py --output_format=markdown
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const toolName = args[0];

if (!toolName) {
  console.error('Error: Tool name is required');
  console.error('Usage: node test_mcp_tools.js <tool_name> [--param1=value1 --param2=value2 ...]');
  process.exit(1);
}

// Parse parameters
const params = {};
args.slice(1).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    params[key] = value;
  }
});

/**
 * Run tests using pytest
 * 
 * @param {Object} params - Test parameters
 * @param {string} params.test_path - Path to the test file or directory
 * @param {string} params.markers - Optional test markers (e.g., unit, integration)
 * @param {boolean} params.verbose - Whether to run tests in verbose mode
 * @returns {Promise<Object>} - Test results
 */
async function runTests(params) {
  const { test_path, markers, verbose } = params;
  
  if (!test_path) {
    throw new Error('test_path is required');
  }
  
  // Build the pytest command
  let command = 'pytest';
  let args = [test_path];
  
  if (markers) {
    args.push(`-m ${markers}`);
  }
  
  if (verbose === 'true') {
    args.push('-v');
  }
  
  console.log(`Running tests: ${command} ${args.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });
    
    process.on('close', (code) => {
      const result = {
        success: code === 0,
        output: stdout,
        error: stderr,
        test_path,
        markers: markers || 'none',
        verbose: verbose === 'true'
      };
      
      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });
}

/**
 * Run linting checks using flake8 and autopep8
 * 
 * @param {Object} params - Linting parameters
 * @param {string} params.file_path - Path to the file or directory to lint
 * @param {boolean} params.auto_fix - Whether to automatically fix linting issues
 * @returns {Promise<Object>} - Linting results
 */
async function runLinting(params) {
  const { file_path, auto_fix } = params;
  
  if (!file_path) {
    throw new Error('file_path is required');
  }
  
  // First run flake8 to check for issues
  console.log(`Running linting check on ${file_path}`);
  
  const lintResults = await new Promise((resolve, reject) => {
    const process = spawn('flake8', [file_path], {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });
    
    process.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr,
        has_issues: code !== 0
      });
    });
  });
  
  // If auto_fix is true and there are issues, run autopep8
  if (auto_fix === 'true' && lintResults.has_issues) {
    console.log(`Auto-fixing linting issues in ${file_path}`);
    
    const fixResults = await new Promise((resolve, reject) => {
      const process = spawn('autopep8', ['--in-place', '--aggressive', '--aggressive', file_path], {
        cwd: PROJECT_ROOT,
        shell: true,
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);
      });
      
      process.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(output);
      });
      
      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr
        });
      });
    });
    
    return {
      success: fixResults.success,
      output: `Linting issues found and fixed in ${file_path}`,
      original_issues: lintResults.output,
      file_path,
      auto_fix: true
    };
  }
  
  return {
    success: lintResults.success,
    output: lintResults.success ? `No linting issues found in ${file_path}` : `Linting issues found in ${file_path}`,
    issues: lintResults.output,
    file_path,
    auto_fix: auto_fix === 'true'
  };
}

/**
 * Generate documentation using our custom documentation generator
 * 
 * @param {Object} params - Documentation parameters
 * @param {string} params.module_path - Path to the module to document
 * @param {string} params.output_format - Output format (markdown or rst)
 * @returns {Promise<Object>} - Documentation results
 */
async function generateDocs(params) {
  const { module_path, output_format } = params;
  
  if (!module_path) {
    throw new Error('module_path is required');
  }
  
  const format = output_format || 'markdown';
  
  console.log(`Generating ${format} documentation for ${module_path}`);
  
  return new Promise((resolve, reject) => {
    const process = spawn('python', ['scripts/generate_osrs_docs.py', `--module=${module_path}`, `--format=${format}`], {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        // Extract the output file path from the stdout
        const match = stdout.match(/Output file: (.+)$/m);
        const outputFile = match ? match[1] : null;
        
        resolve({
          success: true,
          output: stdout,
          module_path,
          output_format: format,
          output_file: outputFile
        });
      } else {
        reject({
          success: false,
          error: stderr,
          module_path,
          output_format: format
        });
      }
    });
  });
}

// Main function to run the appropriate tool
async function main() {
  try {
    let result;
    
    switch (toolName) {
      case 'run_tests':
        result = await runTests(params);
        break;
      case 'run_linting':
        result = await runLinting(params);
        break;
      case 'generate_docs':
        result = await generateDocs(params);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('\nError:');
    console.error(typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    process.exit(1);
  }
}

// Run the main function
main();
