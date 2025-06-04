#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('manage-rules')
  .description('CLI to install and sync project rule sets and tools')
  .version('0.1.0');

program
  .command('list-rules')
  .description('List available rule sets in the template folder')
  .action(() => {
    const sourceDir = path.resolve(__dirname, '../project_rules_template/rule_sets');
    if (!fs.existsSync(sourceDir)) {
      console.error(`No template folder found at ${sourceDir}`);
      process.exit(1);
    }
    const sets = fs.readdirSync(sourceDir);
    console.log('Available rule sets:');
    sets.forEach(set => console.log(`- ${set}`));
  });

program
  .command('install <targetDir>')
  .option('-s, --set <name>', 'Rule set name', 'light-spec')
  .description('Install rule set, memory starters, and tool starters into target project')
  .action((targetDir, options) => {
    const ruleSet = options.set;
    console.log(`Installing rule set "${ruleSet}" into ${targetDir}`);
    // Copy rules
    const sourceRules = path.resolve(__dirname, '../project_rules_template/rule_sets', ruleSet);
    const destRules = path.resolve(targetDir, 'project_rules');
    if (!fs.existsSync(sourceRules)) {
      console.error(`Rule set not found: ${sourceRules}`);
      process.exit(1);
    }
    fs.rmSync(destRules, { recursive: true, force: true });
    fs.cpSync(sourceRules, destRules, { recursive: true });
    console.log(`Copied rules to ${destRules}`);
    // Copy memory starters
    const sourceMem = path.resolve(__dirname, '../project_rules_template/memory_starters');
    const destMem = path.resolve(targetDir, 'memory');
    if (fs.existsSync(sourceMem) && !fs.existsSync(destMem)) {
      fs.cpSync(sourceMem, destMem, { recursive: true });
      console.log(`Copied memory starters to ${destMem}`);
    } else {
      console.log(`Memory directory already exists, skipping`);
    }
    // Copy tool starters
    const sourceTools = path.resolve(__dirname, '../project_rules_template/tool_starters');
    const destTools = path.resolve(targetDir, 'tools');
    if (fs.existsSync(sourceTools) && !fs.existsSync(destTools)) {
      fs.cpSync(sourceTools, destTools, { recursive: true });
      console.log(`Copied tool starters to ${destTools}`);
    } else {
      console.log(`Tools directory already exists, skipping`);
    }
    // Copy example env and requirements
    ['.env.example', 'requirements.txt'].forEach(file => {
      const srcFile = path.resolve(__dirname, '../', file);
      const destFile = path.resolve(targetDir, file);
      if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied ${file} to project root`);
      }
    });
  });

program
  .command('clean-rules <targetDir>')
  .description('Remove generated project_rules folder in target project')
  .action((targetDir) => {
    const target = path.resolve(targetDir, 'project_rules');
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  });

program
  .command('sync <targetDir>')
  .description('Generate platform-specific rules from project_rules')
  .action((targetDir) => {
    console.log(`Syncing rules for ${targetDir}`);
    // Read project_rules
    const projectRulesDir = path.resolve(targetDir, 'project_rules');
    if (!fs.existsSync(projectRulesDir)) {
      console.error(`project_rules not found in ${targetDir}`);
      process.exit(1);
    }
    const rulesFiles = fs.readdirSync(projectRulesDir);

    // Generate for windsurf
    const windsurfDir = path.resolve(targetDir, '.windsurf', 'rules');
    fs.mkdirSync(windsurfDir, { recursive: true });
    // Generate for cursor
    const cursorDir = path.resolve(targetDir, '.cursor', 'rules');
    fs.mkdirSync(cursorDir, { recursive: true });
    rulesFiles.forEach(file => {
      const content = fs.readFileSync(path.join(projectRulesDir, file), 'utf8');
      const destW = path.resolve(windsurfDir, file);
      fs.writeFileSync(destW, content);
      const destC = path.resolve(cursorDir, file);
      fs.writeFileSync(destC, content);
      console.log(`Generated rule file ${file} for windsurf and cursor`);
    });

    // Generate GitHub Copilot instructions
    const githubDir = path.resolve(targetDir, '.github');
    fs.mkdirSync(githubDir, { recursive: true });
    const instrFile = path.resolve(githubDir, 'copilot-instructions.md');
    const content = `# Copilot Instructions
Use Copilot according to project rules in project_rules/ directory.`;
    fs.writeFileSync(instrFile, content);
    console.log(`Wrote Copilot instructions to ${instrFile}`);
  });

program.parse(process.argv);
