#!/usr/bin/env python3
import os
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_PATH = os.path.join(PROJECT_ROOT, 'docs', 'ARCHITECTURE.md')
MEMORIES_PATH = os.path.join(PROJECT_ROOT, 'docs', 'MEMORIES.md')

EXCLUDE_DIRS = {'.git', 'node_modules', 'archive', '__pycache__', '.venv', '.pytest_cache', 'dist', 'coverage', 'htmlcov'}


def scan_tree(root):
    tree = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune excluded dirs
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        rel_path = os.path.relpath(dirpath, PROJECT_ROOT)
        tree.append((rel_path, sorted(filenames)))
    return tree


def format_tree(tree):
    lines = []
    for rel_path, files in tree:
        prefix = '' if rel_path == '.' else rel_path + '/'
        for f in files:
            lines.append(f'- {prefix}{f}')
    return '\n'.join(lines)


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

def update_docs(tree):
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    # Visual file tree (depth 2)
    file_tree_md = '## Visual File Tree (Top Level, Depth 2)\n' + '```\n' + get_file_tree(PROJECT_ROOT, max_depth=2) + '\n```\n\n'
    arch_header = f"# RuneRogue Automated Architecture Map\n\n_Last updated: {now}_\n\n" + file_tree_md + "## Directory/File List\n\n" + format_tree(tree)
    with open(DOCS_PATH, 'w', encoding='utf-8') as f:
        f.write(arch_header)

    mem_header = f"## [Automated] Architecture Scan {now}\nUpdated directory/file list. See ARCHITECTURE.md for details.\n"
    with open(MEMORIES_PATH, 'a', encoding='utf-8') as f:
        f.write(mem_header + '\n')


import shutil
import difflib
import subprocess
from typing import Optional

def diff_and_notify(target_path: str, label: str, prev_suffix: str = ".prev") -> Optional[int]:
    """Diffs the previous and current versions of the file. Notifies Discord if changes are detected. Returns number of diff lines or None."""
    prev_path = target_path + prev_suffix
    if os.path.exists(target_path):
        shutil.copyfile(target_path, prev_path)
    else:
        return None
    # After update, diff
    with open(prev_path, 'r', encoding='utf-8') as f1, open(target_path, 'r', encoding='utf-8') as f2:
        old = f1.readlines()
        new = f2.readlines()
    diff = list(difflib.unified_diff(old, new, fromfile=f'{label}.prev', tofile=label))
    if diff:
        summary = f"{label} updated at {datetime.now().strftime('%Y-%m-%d %H:%M')}: {len(diff)} lines changed."
        print(summary)
        try:
            subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'notify-discord.py'), summary], check=True)
        except Exception as e:
            print(f"Failed to notify Discord: {e}")
        return len(diff)
    return 0

def main():
    # ARCHITECTURE.md
    tree = scan_tree(PROJECT_ROOT)
    update_docs(tree)
    print(f"[auto-architecture-map] Updated ARCHITECTURE.md and MEMORIES.md at {datetime.now()}")
    diff_and_notify(DOCS_PATH, "ARCHITECTURE.md")
    # MEMORIES.md
    MEMORIES_PATH = os.path.join(PROJECT_ROOT, 'docs', 'MEMORIES.md')
    diff_and_notify(MEMORIES_PATH, "MEMORIES.md")
    # ROADMAP.md
    ROADMAP_PATH = os.path.join(PROJECT_ROOT, 'docs', 'ROADMAP.md')
    diff_and_notify(ROADMAP_PATH, "ROADMAP.md")

if __name__ == '__main__':
    main()
