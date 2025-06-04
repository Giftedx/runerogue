#!/usr/bin/env python3
import os
import sys
from datetime import datetime
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCH_PATH = os.path.join(PROJECT_ROOT, 'docs', 'ARCHITECTURE.md')
MEM_PATH = os.path.join(PROJECT_ROOT, 'docs', 'MEMORIES.md')
ROADMAP_PATH = os.path.join(PROJECT_ROOT, 'docs', 'ROADMAP.md')

# Helper to get recent git log
def get_recent_changes(n=10):
    try:
        result = subprocess.run(['git', 'log', f'-n{n}', '--pretty=format:%h %ad %s', '--date=short'], cwd=PROJECT_ROOT, capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return 'No git log available.'
    except Exception as e:
        return f'Error getting git log: {e}'

# Helper to get a visual file tree
def get_file_tree(root, max_depth=2, prefix=''):
    tree = []
    for dirpath, dirnames, filenames in os.walk(root):
        rel_path = os.path.relpath(dirpath, root)
        depth = rel_path.count(os.sep)
        if depth > max_depth:
            continue
        indent = '  ' * depth
        tree.append(f'{indent}- {os.path.basename(dirpath)}/')
        for f in sorted(filenames):
            tree.append(f'{indent}  - {f}')
    return '\n'.join(tree)

# Compose onboarding packet
now = datetime.now().strftime('%Y-%m-%d %H:%M')
print(f"# RuneRogue Onboarding Packet\n")
print(f"_Generated: {now}_\n")

print("## Visual File Tree (Top Level, Depth 2)")
print('```')
print(get_file_tree(PROJECT_ROOT, max_depth=2))
print('```\n')

print("## Recent Changes (git log)")
print('```')
print(get_recent_changes(12))
print('```\n')

print("## Architecture Overview (ARCHITECTURE.md, first 40 lines)")
with open(ARCH_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(''.join(lines[:40]) + ('...\n' if len(lines) > 40 else ''))

print("## Key Memories (MEMORIES.md, first 30 lines)")
with open(MEM_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(''.join(lines[:30]) + ('...\n' if len(lines) > 30 else ''))

print("## Roadmap Highlights (ROADMAP.md, first 30 lines)")
with open(ROADMAP_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(''.join(lines[:30]) + ('...\n' if len(lines) > 30 else ''))

print("---\nFor questions, see AI_AGENT_GUIDE.md or ask in Discord!")
