# RuneRogue MCP Server

Model Context Protocol (MCP) server for RuneRogue, enabling GitHub Copilot Agents to interact with RuneRogue's tooling and services, with a focus on OSRS (Old School RuneScape) data and game design.

## Features

- FastAPI-based MCP server implementation
- Tool registration and discovery
- JWT Authentication and rate limiting
- Health check endpoints
- Integration with OSRS agent system
- Tools for OSRS data retrieval and game design
- Example tools for demonstration

## Installation

1. Clone the repository and navigate to the project directory.
2. Create and activate a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install the required dependencies:

```bash
pip install -r agents/mcp/requirements.txt
```

4. Set up environment variables by creating a `.env` file in the project root:

```env
MCP_SECRET_KEY=your-secret-key-here
MCP_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Usage

### Starting the Server

```bash
python -m agents.mcp.main
```

### Available Endpoints

- `GET /mcp/health`: Health check endpoint
- `POST /mcp/token`: Get authentication token (form-data: username, password)
- `GET /mcp/tools`: List all registered tools (requires authentication)
- `POST /mcp/tools/{tool_name}`: Execute a tool (requires authentication)
- `GET /mcp/info`: Get server information

## Available Tools

### 1. OSRS Search Tool

Search the OSRS Wiki for information about items, NPCs, quests, etc.

**Endpoint:** `POST /mcp/tools/search_osrs_wiki`

**Parameters:**
- `query` (string, required): Search query
- `data_type` (string, optional): Type of data to search for (item, npc, quest, minigame, area, any)
- `limit` (integer, optional): Maximum number of results (default: 5, max: 20)

**Example Request:**
```bash
curl -X POST http://localhost:8001/mcp/tools/search_osrs_wiki \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Dragon scimitar", "data_type": "item"}'
```

### 2. OSRS Design Tool

Design game content based on OSRS data.

**Endpoint:** `POST /mcp/tools/design_osrs_content`

**Parameters:**
- `content_type` (string, required): Type of content to design (item, npc, quest, minigame, area)
- `theme` (string, required): Theme or name of the content
- `requirements` (object, optional): Specific requirements for the design

**Example Request:**
```bash
curl -X POST http://localhost:8001/mcp/tools/design_osrs_content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "item",
    "theme": "Dragon scimitar",
    "requirements": {
      "combat_level": 60,
      "quest_requirement": "Monkey Madness I"
    }
  }'
```

### 3. Example Tools

#### Echo Tool

```bash
curl -X POST http://localhost:8001/mcp/tools/echo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, world!"}'
```

#### Add Numbers Tool

```bash
curl -X POST http://localhost:8001/mcp/tools/add_numbers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 7}'
```

## Authentication

1. Get an access token:

```bash
curl -X POST http://localhost:8001/mcp/token \
  -d "username=admin&password=admin" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

2. Use the token in subsequent requests:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Development

### Running Tests

```bash
pytest agents/mcp/test_*.py -v
```

### Adding New Tools

1. Create a new tool class in `osrs_tools.py` or a new module
2. Register the tool in `tools.py`
3. Add tests in `test_osrs_tools.py`

## Deployment

### Docker

```bash
docker build -t runerogue-mcp -f agents/mcp/Dockerfile .
docker run -p 8001:8001 --env-file .env runerogue-mcp
```

### Environment Variables

- `MCP_SECRET_KEY`: Secret key for JWT token signing
- `MCP_ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)
- `MCP_CORS_ORIGINS`: Comma-separated list of allowed CORS origins (default: "*")

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
