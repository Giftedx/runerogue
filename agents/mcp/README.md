# RuneRogue MCP Server

Model Context Protocol (MCP) server for RuneRogue, enabling GitHub Copilot Agents to interact with RuneRogue's tooling and services.

## Features

- FastAPI-based MCP server implementation
- Tool registration and discovery
- Authentication and rate limiting
- Health check endpoints
- Example tools for demonstration

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Starting the Server

```bash
python -m agents.mcp.main
```

### Available Endpoints

- `GET /mcp/health`: Health check endpoint
- `GET /mcp/tools`: List all registered tools
- `POST /mcp/tools/{tool_name}`: Execute a tool
- `GET /mcp/info`: Get server information

### Example API Requests

#### List Available Tools

```bash
curl http://localhost:8000/mcp/tools
```

#### Execute a Tool

```bash
curl -X POST http://localhost:8000/mcp/tools/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, world!"}'
```

## Creating Custom Tools

You can create custom tools by using the `@tool` decorator:

```python
from agents.mcp.server import tool, server

@tool(
    name="my_tool",
    description="My custom tool",
    parameters={
        "type": "object",
        "properties": {
            "param1": {"type": "string"},
            "param2": {"type": "number"}
        },
        "required": ["param1"]
    }
)
async def my_tool(param1: str, param2: int = 42) -> dict:
    """My custom tool function."""
    return {"result": f"{param1} - {param2}"}
```

Or by creating a Tool class:

```python
from agents.mcp.server import Tool, ToolResult, ToolResultStatus

class MyTool(Tool):
    def __init__(self):
        super().__init__(
            name="my_tool",
            description="My custom tool",
            parameters={
                "type": "object",
                "properties": {
                    "param1": {"type": "string"}
                },
                "required": ["param1"]
            }
        )
    
    async def execute(self, input_data: dict) -> ToolResult:
        try:
            result = f"Processed: {input_data['param1']}"
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output={"result": result}
            )
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                error=str(e)
            )

# Register the tool
server.register_tool(MyTool())
```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Style

This project uses `black` for code formatting and `flake8` for linting.

```bash
black .
flake8
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
