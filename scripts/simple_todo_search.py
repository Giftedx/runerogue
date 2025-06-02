#!/usr/bin/env python3
"""
Simple TODO search script that doesn't require GitHub API
"""
import os
import re

def search_todos():
    """Search for TODO comments in Python files"""
    todos = []
    
    # Walk through the repository
    for root, dirs, files in os.walk('.'):
        # Skip hidden directories and __pycache__
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if 'TODO' in line:
                                todos.append({
                                    'file': file_path,
                                    'line': line_num,
                                    'content': line.strip()
                                })
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return todos

def format_results(todos):
    """Format TODO results"""
    if not todos:
        return "No TODO comments found in Python files."
    
    actual_todos = []
    all_todos = []
    
    for todo in todos:
        file_path = todo['file'].replace('./', '')
        line_content = todo['content']
        formatted = f"- `{file_path}:{todo['line']}`: {line_content}"
        
        all_todos.append(formatted)
        if line_content.strip().startswith('# TODO:'):
            actual_todos.append(formatted)
    
    result = "## Found TODOs:\n\n"
    
    if actual_todos:
        result += "**Actual TODO Comments (requiring action):**\n"
        result += "\n".join(actual_todos) + "\n\n"
    
    result += "**All TODO References:**\n"
    result += "\n".join(all_todos) + "\n\n"
    
    summary = f"Found {len(actual_todos)} actual TODO comments and {len(all_todos)} total TODO references."
    result += f"**Summary:** {summary}"
    
    return result

if __name__ == "__main__":
    print("Searching for TODO comments...")
    todos = search_todos()
    result = format_results(todos)
    print(result)
