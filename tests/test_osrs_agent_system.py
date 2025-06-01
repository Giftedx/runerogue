"""Tests for the OSRS Agent System module.

This module contains unit tests for the OSRS Agent System functionality,
including agent creation, tool registration, and group chat coordination.
"""

import pytest
from unittest.mock import patch, MagicMock, call

from agents.osrs_agent_system import (
    create_osrs_agent_system,
    register_osrs_tools,
    create_osrs_agent,
    setup_osrs_group_chat
)


class TestOSRSAgentSystem:
    """Test suite for the OSRS Agent System module."""

    @patch('agents.osrs_agent_system.create_osrs_agent')
    @patch('agents.osrs_agent_system.setup_osrs_group_chat')
    @patch('agents.osrs_agent_system.register_osrs_tools')
    def test_create_osrs_agent_system(self, mock_register_tools, mock_setup_chat, mock_create_agent):
        """Test creating the complete OSRS agent system."""
        # Setup mocks
        mock_create_agent.side_effect = [
            MagicMock(name='wiki_agent'),
            MagicMock(name='economy_agent'),
            MagicMock(name='combat_agent'),
            MagicMock(name='quest_agent'),
            MagicMock(name='manager_agent')
        ]
        mock_setup_chat.return_value = MagicMock(name='group_chat')
        
        # Call the function
        result = create_osrs_agent_system()
        
        # Assertions
        assert mock_create_agent.call_count == 5
        assert mock_register_tools.call_count == 1
        assert mock_setup_chat.call_count == 1
        
        # Verify the result structure
        assert 'wiki_agent' in result
        assert 'economy_agent' in result
        assert 'combat_agent' in result
        assert 'quest_agent' in result
        assert 'manager_agent' in result
        assert 'group_chat' in result
        
    @patch('agents.osrs_agent_system.Tool')
    def test_register_osrs_tools(self, mock_tool):
        """Test registering OSRS tools."""
        # Setup
        mock_tool_registry = MagicMock()
        
        # Call the function
        register_osrs_tools(mock_tool_registry)
        
        # Assertions
        # Verify that Tool was instantiated for each tool we expect
        expected_tools = [
            'search_osrs_wiki',
            'get_item_price',
            'calculate_combat_level',
            'get_quest_requirements'
        ]
        
        assert mock_tool.call_count >= len(expected_tools)
        mock_tool_registry.register_tool.assert_called()
        
    @patch('agents.osrs_agent_system.Agent')
    def test_create_osrs_agent(self, mock_agent):
        """Test creating an OSRS agent."""
        # Setup
        mock_agent_instance = MagicMock()
        mock_agent.return_value = mock_agent_instance
        agent_name = "test_agent"
        agent_role = "Test role description"
        agent_tools = ["tool1", "tool2"]
        
        # Call the function
        result = create_osrs_agent(agent_name, agent_role, agent_tools)
        
        # Assertions
        mock_agent.assert_called_once()
        assert result == mock_agent_instance
        
        # Verify the agent was created with the correct parameters
        args, kwargs = mock_agent.call_args
        assert agent_name in kwargs.values()
        assert agent_role in kwargs.values()
        
        # Verify tools were assigned
        for tool in agent_tools:
            mock_agent_instance.register_tool.assert_any_call(tool)
        
    @patch('agents.osrs_agent_system.GroupChat')
    def test_setup_osrs_group_chat(self, mock_group_chat):
        """Test setting up the OSRS group chat."""
        # Setup
        mock_agents = {
            'wiki_agent': MagicMock(),
            'economy_agent': MagicMock(),
            'combat_agent': MagicMock(),
            'quest_agent': MagicMock(),
            'manager_agent': MagicMock()
        }
        mock_group_chat_instance = MagicMock()
        mock_group_chat.return_value = mock_group_chat_instance
        
        # Call the function
        result = setup_osrs_group_chat(mock_agents)
        
        # Assertions
        mock_group_chat.assert_called_once()
        assert result == mock_group_chat_instance
        
        # Verify all agents were added to the group chat
        for agent in mock_agents.values():
            mock_group_chat_instance.add_agent.assert_any_call(agent)
