"""
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
"""

import autogen
from economy_models.osrs_parser import fetch_wiki_data

# Load LLM configuration from the JSON file
config_list = autogen.config_list_from_json("OAI_CONFIG_LIST.json", filter_dict={"model": ["gpt-4-turbo"]})

llm_config = {
    "config_list": config_list,
    "cache_seed": 42,  # Use caching for reproducible results
    "timeout": 120,
}

# 1. Create the Data Specialist Agent
osrs_data_agent = autogen.AssistantAgent(
    name="OSRS_Data_Agent",
    llm_config=llm_config,
    system_message="""You are a data retrieval specialist for Old School RuneScape.
Your only job is to use the `fetch_wiki_data` tool to find information. Do not guess or provide old information.
You must find the data for the user's request and reply with ONLY the direct output from the tool.
If you cannot find the data, say so. Do not add any extra conversation.
When you have the data, reply with it and then TERMINATE."""
)

# 2. Create the User Proxy Agent (tool executor and chat initiator)
user_proxy = autogen.UserProxyAgent(
    name="User_Proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    is_termination_msg=lambda x: x.get("content", "").rstrip().endswith("TERMINATE"),
    code_execution_config={"work_dir": "coding", "use_docker": False}, # Ensure use_docker is False if not intended
    llm_config=llm_config,
    system_message="""You are the user's proxy.
Your job is to:
1. Initiate conversations with the GroupChatManager.
2. Execute tool calls (`fetch_wiki_data`) when requested by other agents.
3. Relay results back to the requesting agent.
Do not add any extra conversation beyond executing tools or initiating chats."""
)

# 3. Register the tool with the proxy agent
user_proxy.register_function(
    function_map={
        "fetch_wiki_data": fetch_wiki_data
    }
)

# 4. Create the Game Design Agent
game_design_agent = autogen.AssistantAgent(
    name="Game_Design_Agent",
    llm_config=llm_config,
    system_message="""You are a creative game designer for Old School RuneScape.
Your goal is to design game mechanics, zones, items, and NPCs.
You must base your designs on data retrieved by the OSRS_Data_Agent.
To get data, clearly state what you need and ask the OSRS_Data_Agent to fetch it. For example: "OSRS_Data_Agent, please find data for X."
Once you have the necessary data, present your design ideas clearly and explain how the data supports them.
When your design task is complete, reply with your final design and then TERMINATE."""
)

# 5. Establish the Group Chat
groupchat = autogen.GroupChat(
    agents=[user_proxy, osrs_data_agent, game_design_agent],
    messages=[],
    max_round=20,
    speaker_selection_method="auto",
)

# 6. Create the Group Chat Manager
manager_llm_config = llm_config.copy()

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config=manager_llm_config,
    is_termination_msg=lambda x: x.get("content", "").rstrip().endswith("TERMINATE") or x.get("content", "") == "", # Terminate on empty message too
    system_message="""You are the manager of a group chat. Your role is to coordinate the conversation between the Game_Design_Agent and the OSRS_Data_Agent.
Ensure the Game_Design_Agent requests data from the OSRS_Data_Agent, and that the OSRS_Data_Agent provides it.
The User_Proxy will execute tools.
The conversation should continue until the Game_Design_Agent provides a final design and says TERMINATE."""
)
