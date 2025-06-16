# /external-repos Directory

**Status: External Tooling & Submodules**

This directory contains clones of external repositories, typically included as Git submodules. These repositories provide tooling and services for the AI development agent via the Model Context Protocol (MCP).

## Purpose

The servers and tools within these repositories are configured in the project's MCP configuration files (e.g., `/.cursor/mcp.json`). They grant the AI agent a wide range of capabilities, from searching the web (`@mcptools/mcp-tavily`) to interacting with GitHub (`@modelcontextprotocol/server-github`).

## Structure

-   **`/mcp-repos`**: Contains various MCP server implementations that the AI agent can launch and communicate with.
-   **`/tools-python`**: Contains Python-based tools and libraries.

## Management

-   These repositories are managed as Git submodules. To initialize them for the first time, run `git submodule init` followed by `git submodule update`.
-   To update all submodules to the latest version tracked by this repository, run `git submodule update --remote`.

**Note**: Do not modify the contents of these directories directly, as they are separate projects. If a change is needed in one of the tools, it should be made in the tool's own repository and the submodule reference should be updated accordingly. 