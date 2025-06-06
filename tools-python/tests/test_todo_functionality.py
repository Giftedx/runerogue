#!/usr/bin/env python3
"""
Test script to verify TODO search functionality
This simulates what the GitHub Copilot Agent should do
"""

import os
import subprocess

def test_todo_search():
    """Test the TODO search functionality"""
    print("Testing TODO search functionality...")
    
    # Test 1: Direct file search (what we know works)
    print("\n1. Direct file search:")
    todos_found = []
    
    # Check the files we know have TODOs
    test_files = [
        'economy/grand_exchange.py',
        'app.py',
        'scripts/process_agent_task.py'
    ]
    
    for file_path in test_files:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    if 'TODO' in line:
                        result = f"- `{file_path}:{line_num}`: {line.strip()}"
                        todos_found.append(result)
                        print(result)
    
    print(f"\nDirect search found {len(todos_found)} TODO references")
    
    # Test 2: Git grep (what our script uses)
    print("\n2. Testing git grep command:")
    try:
        result = subprocess.run(
            ['git', 'grep', '-n', 'TODO', '--', '*.py'],
            capture_output=True,
            text=True,
            cwd='.'
        )
        
        print(f"Git grep return code: {result.returncode}")
        if result.returncode == 0:
            git_results = result.stdout.strip().split('\n')
            print(f"Git grep found {len(git_results)} results:")
            for line in git_results[:5]:  # Show first 5
                print(f"  {line}")
            if len(git_results) > 5:
                print(f"  ... and {len(git_results) - 5} more")
        else:
            print(f"Git grep failed: {result.stderr}")
            
    except Exception as e:
        print(f"Error running git grep: {e}")
    
    # Test 3: Expected results
    print(f"\n3. Expected results for GitHub Copilot Agent:")
    print("The agent should find:")
    print("- 3 actual TODO comments in economy/grand_exchange.py")
    print("- Multiple TODO references in other files")
    print("- Should categorize them as 'actual TODOs' vs 'meta/test references'")

if __name__ == "__main__":
    test_todo_search()
