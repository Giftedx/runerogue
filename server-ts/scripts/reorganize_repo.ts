import * as fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

// Ensure target workspaces
const folders = ['server-ts', 'tools-python', 'archives'];
folders.forEach(dir => {
  const d = path.join(root, dir);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Mapping of source to destination relative to repo root
const moves: Array<{ oldPath: string; newPath: string }> = [
  // TypeScript core
  { oldPath: 'package.json', newPath: 'server-ts/package.json' },
  { oldPath: 'package-lock.json', newPath: 'server-ts/package-lock.json' },
  { oldPath: 'tsconfig.json', newPath: 'server-ts/tsconfig.json' },
  { oldPath: 'jest.config.js', newPath: 'server-ts/jest.config.js' },
  { oldPath: 'jest.setup.ts', newPath: 'server-ts/jest.setup.ts' },
  { oldPath: '.eslintrc.json', newPath: 'server-ts/.eslintrc.json' },
  { oldPath: '.prettierrc', newPath: 'server-ts/.prettierrc' },
  { oldPath: 'scripts', newPath: 'server-ts/scripts' },
  { oldPath: 'project_rules_template', newPath: 'server-ts/project_rules_template' },
  { oldPath: 'src', newPath: 'server-ts/src' },
  { oldPath: 'static', newPath: 'server-ts/static' },
  { oldPath: 'Dockerfile', newPath: 'server-ts/Dockerfile' },
  { oldPath: 'docker-compose.yml', newPath: 'server-ts/docker-compose.yml' },
  { oldPath: 'render.yaml', newPath: 'server-ts/render.yaml' },
  { oldPath: 'netlify.toml', newPath: 'server-ts/netlify.toml' },
  { oldPath: 'windsurf_deployment.yaml', newPath: 'server-ts/windsurf_deployment.yaml' },
  { oldPath: 'Procfile', newPath: 'server-ts/Procfile' },
  { oldPath: '.env.example', newPath: 'server-ts/.env.example' },
  { oldPath: '.env.development', newPath: 'server-ts/.env.development' },
  { oldPath: '.env.production', newPath: 'server-ts/.env.production' },
  { oldPath: '.env.staging', newPath: 'server-ts/.env.staging' },
  { oldPath: '.env.test', newPath: 'server-ts/.env.test' },
  // Python tools
  { oldPath: 'app.py', newPath: 'tools-python/app.py' },
  { oldPath: 'main.py', newPath: 'tools-python/main.py' },
  { oldPath: 'metrics.py', newPath: 'tools-python/metrics.py' },
  { oldPath: 'monitoring.py', newPath: 'tools-python/monitoring.py' },
  { oldPath: 'social.py', newPath: 'tools-python/social.py' },
  { oldPath: 'realtime.py', newPath: 'tools-python/realtime.py' },
  { oldPath: 'scraper.py', newPath: 'tools-python/scraper.py' },
  { oldPath: 'code_analyzer.py', newPath: 'tools-python/code_analyzer.py' },
  { oldPath: 'check_db.py', newPath: 'tools-python/check_db.py' },
  { oldPath: 'run_mcp_server.py', newPath: 'tools-python/run_mcp_server.py' },
  { oldPath: 'requirements.txt', newPath: 'tools-python/requirements.txt' },
  { oldPath: 'setup.py', newPath: 'tools-python/setup.py' },
  { oldPath: 'secure_tavily_setup.sh', newPath: 'tools-python/secure_tavily_setup.sh' },
  { oldPath: 'setup_advanced_research.sh', newPath: 'tools-python/setup_advanced_research.sh' },
  { oldPath: 'setup_tavily_api_key.sh', newPath: 'tools-python/setup_tavily_api_key.sh' },
  { oldPath: 'validate-m4.sh', newPath: 'tools-python/validate-m4.sh' },
  { oldPath: 'validate_tavily_mcp.sh', newPath: 'tools-python/validate_tavily_mcp.sh' },
  // Prototypes & archives
  { oldPath: 'runescape-discord-game', newPath: 'archives/runescape-discord-game' },
  { oldPath: 'runescape-rogue-prime', newPath: 'archives/runescape-rogue-prime' },
  { oldPath: 'economy', newPath: 'archives/economy' },
  { oldPath: 'economy_api', newPath: 'archives/economy_api' },
  { oldPath: 'economy_models', newPath: 'archives/economy_models' },
  { oldPath: 'docs', newPath: 'server-ts/docs' },
  { oldPath: 'infra', newPath: 'archives/infra' },
  { oldPath: 'instance', newPath: 'archives/instance' },
  { oldPath: 'services', newPath: 'archives/services' },
  { oldPath: 'tests', newPath: 'archives/tests' },
  { oldPath: 'archive', newPath: 'archives/archive' },
  { oldPath: 'agents', newPath: 'archives/agents' },
  // Remaining root-level items
  { oldPath: 'client', newPath: 'server-ts/client' },
  { oldPath: 'dist', newPath: 'server-ts/dist' },
  { oldPath: 'logs', newPath: 'tools-python/logs' },
  { oldPath: 'ts_jest.log', newPath: 'server-ts/logs/ts_jest.log' },
  { oldPath: 'pyrightconfig.json', newPath: 'server-ts/pyrightconfig.json' },
  { oldPath: 'runerogue.db', newPath: 'server-ts/data/runerogue.db' },
  { oldPath: 'test-script.js', newPath: 'server-ts/scripts/test-script.js' },
  { oldPath: '.dockerignore', newPath: 'server-ts/.dockerignore' },
  { oldPath: 'config', newPath: 'tools-python/config' },
  { oldPath: 'config.py', newPath: 'tools-python/config/config.py' },
  { oldPath: 'coverage', newPath: 'tools-python/coverage' },
  { oldPath: 'htmlcov', newPath: 'tools-python/coverage/htmlcov' },
  { oldPath: '.coverage', newPath: 'tools-python/coverage/.coverage' },
  { oldPath: 'pytest.ini', newPath: 'tools-python/pytest.ini' },
  { oldPath: '.pytest_cache', newPath: 'tools-python/.pytest_cache' },
  { oldPath: '__pycache__', newPath: 'tools-python/__pycache__' },
  { oldPath: 'health.py', newPath: 'tools-python/health.py' },
  { oldPath: 'models.py', newPath: 'tools-python/models.py' },
  { oldPath: 'debug_osrs_page.html', newPath: 'tools-python/debug_osrs_page.html' },
  { oldPath: '.venv', newPath: 'tools-python/.venv' },
  { oldPath: 'issue_body.txt', newPath: 'server-ts/docs/issue_body.txt' },
  { oldPath: 'jest.simple.config.js', newPath: 'server-ts/jest.simple.config.js' },
  { oldPath: 'jest_results.json', newPath: 'server-ts/jest_results.json' },
  { oldPath: 'test-results.json', newPath: 'server-ts/test-results.json' },
  { oldPath: 'test_copilot_issue.md', newPath: 'server-ts/docs/test_copilot_issue.md' },
  { oldPath: 'test_local_npx_tavily.sh', newPath: 'tools-python/test_local_npx_tavily.sh' },
  { oldPath: 'test_mcp_registration.py', newPath: 'tools-python/tests/test_mcp_registration.py' },
  { oldPath: 'test_osrs_parser.py', newPath: 'tools-python/tests/test_osrs_parser.py' },
  { oldPath: 'test_tavily_integration.md', newPath: 'server-ts/docs/test_tavily_integration.md' },
  { oldPath: 'test_todo_functionality.py', newPath: 'tools-python/tests/test_todo_functionality.py' },
  { oldPath: 'test_tool_execution.py', newPath: 'tools-python/tests/test_tool_execution.py' },
  { oldPath: 'test_tools_endpoint.py', newPath: 'tools-python/tests/test_tools_endpoint.py' },
  { oldPath: 'runescape-rogue-prime.html', newPath: 'archives/runescape-rogue-prime.html' },
  { oldPath: 'tmp_project', newPath: 'archives/tmp_project' },
  { oldPath: 'tavily_env_template.sh', newPath: 'tools-python/tavily_env_template.sh' }
];

// Auto-move root markdown docs except README.md and CONTRIBUTING.md
const mdExcludes = new Set(['README.md', 'CONTRIBUTING.md']);
fs.readdirSync(root).forEach(file => {
  if (file.endsWith('.md') && !mdExcludes.has(file)) {
    moves.push({ oldPath: file, newPath: `server-ts/docs/${file}` });
  }
});

console.log('Starting repository reorganization...');
for (const { oldPath, newPath } of moves) {
  const src = path.join(root, oldPath);
  const dest = path.join(root, newPath);
  if (fs.existsSync(src)) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    console.log(`Moving ${oldPath} → ${newPath}`);
    fs.renameSync(src, dest);
  }
}

// Relocate Python and shell scripts from server-ts/scripts to tools-python/scripts
console.log('Moving Python scripts from server-ts/scripts to tools-python/scripts');
const tsScriptsDir = path.join(root, 'server-ts', 'scripts');
const pyScriptsDest = path.join(root, 'tools-python', 'scripts');
if (!fs.existsSync(pyScriptsDest)) fs.mkdirSync(pyScriptsDest, { recursive: true });
for (const file of fs.readdirSync(tsScriptsDir)) {
  if (file.endsWith('.py') || file.endsWith('.sh')) {
    const src = path.join(tsScriptsDir, file);
    const dest = path.join(pyScriptsDest, file);
    console.log(`Moving script ${file} → tools-python/scripts/${file}`);
    fs.renameSync(src, dest);
  }
}

console.log('Reorganization complete. Please update workspace settings and CI configs accordingly.');

// Cleanup leftover root files and directories
const cleanupList = ['node_modules', 'coverage', 'htmlcov', '.pytest_cache', '.venv', 'dist', 'client', 'tmp_project'];
for (const name of cleanupList) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) {
    console.log(`Removing leftover ${name}`);
    fs.rmSync(p, { recursive: true, force: true });
  }
}
