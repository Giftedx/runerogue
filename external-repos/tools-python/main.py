# In main.py

from agents.osrs_agent_system import user_proxy, manager

if __name__ == "__main__":
    print("--- main.py: Script started ---")
    
    # Initiate a chat with the GroupChatManager
    # The UserProxy sends the initial message to the manager,
    # who then orchestrates the conversation between the agents.
    print("--- main.py: Attempting to initiate chat... ---")
    try:
        user_proxy.initiate_chat(
            recipient=manager,
            message="Design a simple starting zone for a new player. The zone should include a common, low-level enemy and a basic weapon that can be found there. Use the OSRS_Data_Agent to get the necessary data to support your design choices.",
            clear_history=True, # Start with a fresh history for this specific task
        )
        print("--- main.py: initiate_chat completed ---")
    except Exception as e:
        print(f"--- main.py: An error occurred during initiate_chat: {e} ---")
        import traceback
        traceback.print_exc()
    
    print("--- main.py: Script finished ---")
