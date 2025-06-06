// Auto-assign issues labeled 'copilot-agent' to Copilot when available
// Place in scripts/auto_assign_copilot.js
// Requires @octokit/rest (installed by workflow)

const { Octokit } = require("@octokit/rest");

const token = process.env.GITHUB_TOKEN;
const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;
const placeholderAssignee = process.env.PLACEHOLDER_ASSIGNEE;
const copilotAssignee = process.env.COPILOT_ASSIGNEE;
const label = process.env.LABEL;

const octokit = new Octokit({ auth: token });

async function main() {
  // 1. Check if Copilot is an assignable user
  let copilotAssignable = false;
  try {
    const { data: collaborators } = await octokit.rest.repos.listCollaborators({ owner, repo });
    copilotAssignable = collaborators.some(user => user.login.toLowerCase() === copilotAssignee.toLowerCase());
  } catch (e) {
    console.error('Failed to list collaborators:', e.message);
    process.exit(1);
  }
  if (!copilotAssignable) {
    console.log(`Copilot ('${copilotAssignee}') is not assignable in this repo. Exiting.`);
    return;
  }

  // 2. Find all open issues with the label and assigned to placeholder
  let issues = [];
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      labels: label,
      assignee: placeholderAssignee,
      per_page: 100
    });
    issues = data;
  } catch (e) {
    console.error('Failed to list issues:', e.message);
    process.exit(1);
  }
  if (issues.length === 0) {
    console.log('No issues found to reassign.');
    return;
  }

  // 3. Reassign each issue to Copilot
  for (const issue of issues) {
    try {
      await octokit.rest.issues.addAssignees({
        owner,
        repo,
        issue_number: issue.number,
        assignees: [copilotAssignee]
      });
      await octokit.rest.issues.removeAssignees({
        owner,
        repo,
        issue_number: issue.number,
        assignees: [placeholderAssignee]
      });
      console.log(`Reassigned issue #${issue.number} to Copilot.`);
    } catch (e) {
      console.error(`Failed to reassign issue #${issue.number}:`, e.message);
    }
  }
}

main();
