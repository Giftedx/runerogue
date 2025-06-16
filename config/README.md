# /config Directory

**Status: Development Environment Configuration**

This directory contains configuration files for the development environment, primarily for the AI agent's tools and workspace setup.

## Files

-   **`cursor-mcp-complete.json`**: A comprehensive configuration file for the Model Context Protocol (MCP), defining a large number of servers and tools for the AI agent.
    -   **Status**: This appears to be a **backup or reference file**. The primary, active configuration for the agent is located at `/.cursor/mcp.json`. These two files should be reviewed and consolidated to create a single source of truth for agent tooling.

-   **`mcp-repos.code-workspace`**: A VS Code workspace file. This is used to configure the editor to properly recognize all the different projects and sub-projects within this monorepo, especially the external tool repositories in `/external-repos`.
    -   **Status**: **Current**. Developers should use this workspace file to open the project in VS Code for the best experience.

-   **`OAI_CONFIG_LIST.json`**: Configuration file for OpenAI model endpoints.
    -   **Status**: **Current**, but likely contains placeholder or template values. Should be populated with actual keys by developers locally.

## Recommendation

The MCP configuration is currently split between this directory and the `/.cursor` directory. This should be resolved to avoid confusion. For now, assume that `/.cursor/mcp.json` is the file that takes precedence for agent operation. 