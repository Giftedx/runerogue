# osrs_agent_system

OSRS Agent System for RuneRogue.

This module implements an agent-based system for Old School RuneScape (OSRS) data retrieval and game design.
It uses the AutoGen framework to create a multi-agent system that can retrieve data from the OSRS Wiki
and use it to design game mechanics, zones, items, and NPCs for the RuneRogue game.

The system consists of three main agents:

1. OSRS Data Agent: Retrieves data from the OSRS Wiki
2. Game Design Agent: Creates game designs based on the retrieved data
3. User Proxy Agent: Executes tool calls and initiates conversations

Example usage:
from agents.osrs_agent_system import manager, user_proxy

    # Start a conversation with a design task
    user_proxy.initiate_chat(manager, message="Design a new boss based on the Abyssal Sire")

## Variables

### `autogen`

Type: `MagicMock`

### `config_list`

Type: `list`

Value: `[{'model': 'gpt-4-turbo'}]`

### `fetch_wiki_data`

Type: `MagicMock`

### `game_design_agent`

Type: `MagicMock`

### `groupchat`

Type: `MagicMock`

### `llm_config`

Type: `dict`

Value: `{'config_list': [{'model': 'gpt-4-turbo'}], 'cache_seed': 42, 'timeout': 120}`

### `manager`

Type: `MagicMock`

### `manager_llm_config`

Type: `dict`

Value: `{'config_list': [{'model': 'gpt-4-turbo'}], 'cache_seed': 42, 'timeout': 120}`

### `osrs_data_agent`

Type: `MagicMock`

### `user_proxy`

Type: `MagicMock`
