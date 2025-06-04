# GitHub Actions: Auto-Assign Copilot Agent

This workflow automates the reassignment of issues to GitHub Copilot as soon as it becomes available as an assignable user.

## How It Works

- **Runs every hour** (via cron) and can be triggered manually.
- **Checks for Copilot** as an assignable collaborator.
- **Reassigns all open issues** labeled `copilot-agent` and assigned to `Giftedx` to Copilot.
- **Removes the placeholder assignee** (`Giftedx`).

## Setup

1. Place the workflow YAML in `.github/workflows/auto-assign-copilot.yml`.
2. Place the script in `scripts/auto_assign_copilot.js`.
3. No extra secrets are needed; uses GitHub's built-in `GITHUB_TOKEN`.

## Customization

- Change the `PLACEHOLDER_ASSIGNEE`, `COPILOT_ASSIGNEE`, or `LABEL` environment variables in the workflow if needed.
- You may change the schedule or add notification steps as required.

## Manual Trigger

- Go to the Actions tab in GitHub and run the workflow manually if you want to force a check.

## Extending

- For multi-agent or multi-label triage, extend the script logic.
- For notifications (e.g., Slack, email), add a step in the workflow after reassignment.

---

**This automation ensures agentic, hands-off triage for Copilot or future bots!**
