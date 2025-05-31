import os
import re

def find_code_tags(directory, tags):
    """
    Recursively scans all .py files within the given directory for specified tags.

    Args:
        directory (str): The path to the directory to scan.
        tags (list): A list of tags to search for (e.g., ['TODO', 'FIXME']).

    Returns:
        list: A list of dictionaries, where each dictionary represents a found tag.
    """
    found_tags_list = []
    # Normalize excluded_dirs to handle potential trailing slashes and OS differences
    # Added .idea and .vscode, common IDE directories
    excluded_dirs_set = {
        os.path.normpath(d) for d in
        ['tests', '.venv', 'venv', '__pycache__', '.git', '.github', '.idea', '.vscode', 'node_modules']
    }

    if not os.path.isdir(directory):
        # print(f"Directory not found: {directory}") # Optional: log this
        return found_tags_list

    if not tags: # If tags list is empty, no need to scan
        return found_tags_list

    # Create a regex pattern to find any of the tags
    # This will match lines like "# TODO: message" or "# FIXME: message"
    # It captures the tag itself and the rest of the comment
    tag_pattern = re.compile(r"#\s*(" + "|".join(re.escape(tag) for tag in tags) + r")[:\s]*(.*)")

    for root, dirs, files in os.walk(directory, topdown=True):
        # Filter out excluded directories more robustly
        # Check if the current root itself is within an excluded path relative to the initial directory
        normalized_root_relative_to_start_dir = os.path.normpath(os.path.relpath(root, directory))
        if any(normalized_root_relative_to_start_dir.startswith(excluded) for excluded in excluded_dirs_set if excluded != '.'): # exclude != '.' for case where directory is '.'
            dirs[:] = [] # Don't descend further into this path
            continue

        # Filter subdirectories for further traversal
        dirs[:] = [
            d for d in dirs
            if not d.startswith('.') and os.path.normpath(os.path.join(normalized_root_relative_to_start_dir, d)) not in excluded_dirs_set
        ]

        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_number, line in enumerate(f, 1):
                            match = tag_pattern.search(line)
                            if match:
                                tag_found = match.group(1)
                                comment_text = match.group(2).strip()
                                full_comment_line = line.strip()

                                found_tags_list.append({
                                    'file_path': os.path.normpath(file_path), # Normalize file path
                                    'line_number': line_number,
                                    'tag': tag_found,
                                    'comment': comment_text,
                                    'full_comment_line': full_comment_line
                                })
                except Exception as e:
                    # print(f"Error reading file {file_path}: {e}") # Silently ignore for now
                    pass

    return found_tags_list

if __name__ == '__main__':
    # Example usage:
    # Create some dummy files for testing
    test_base_dir = "temp_test_dir_code_analyzer"
    if not os.path.exists(test_base_dir):
        os.makedirs(test_base_dir + "/subdir")
        os.makedirs(test_base_dir + "/.hidden_dir")
        os.makedirs(test_base_dir + "/tests")
        os.makedirs(test_base_dir + "/.venv/sub")
        os.makedirs(test_base_dir + "/.idea") # IDE specific
        os.makedirs(test_base_dir + "/node_modules/somelib") # Common web dev folder

    with open(test_base_dir + "/test1.py", "w") as f:
        f.write("# TODO: Implement this feature\n")
        f.write("class Test:\n")
        f.write("    pass # FIXME: This needs a fix\n")

    with open(test_base_dir + "/subdir/test2.py", "w") as f:
        f.write("# TODO: Another task here\n")
        f.write("def func():\n")
        f.write("    # Not a tag\n")
        f.write("    print('Hello') # FIXME test this\n")

    with open(test_base_dir + "/.hidden_dir/test_hidden.py", "w") as f:
        f.write("# TODO: This should be ignored (in .hidden_dir)\n")

    with open(test_base_dir + "/tests/test_ignore.py", "w") as f:
        f.write("# TODO: This should be ignored (in tests/)\n")

    with open(test_base_dir + "/.venv/sub/ignored_lib.py", "w") as f:
        f.write("# FIXME: Library code, should be ignored in .venv\n")

    with open(test_base_dir + "/.idea/workspace.xml", "w") as f: # Not a .py file, but in excluded dir
        f.write("<!-- # TODO: IDE specific file -->\n")

    with open(test_base_dir + "/.idea/some_script.py", "w") as f: # A .py file in excluded dir
        f.write("# TODO: IDE specific script, should be ignored\n")

    with open(test_base_dir + "/node_modules/somelib/some_code.py", "w") as f:
        f.write("# TODO: node_modules code, should be ignored\n")

    print(f"--- Running tests for find_code_tags in '{test_base_dir}' ---")
    tags_to_find = ['TODO', 'FIXME']
    results = find_code_tags(test_base_dir, tags_to_find)

    print("\nFound tags:")
    for item in results:
        print(item)

    # Expected tags only from test1.py and subdir/test2.py
    expected_tag_count = 4
    print(f"\nTotal tags found: {len(results)} (Expected: {expected_tag_count})")
    assert len(results) == expected_tag_count, f"Expected {expected_tag_count} tags, got {len(results)}"

    paths_found = {item['file_path'] for item in results}

    # Check that NO files from excluded directories are present
    excluded_paths_to_check = [
        os.path.normpath(os.path.join(test_base_dir, 'tests', 'test_ignore.py')),
        os.path.normpath(os.path.join(test_base_dir, '.venv', 'sub', 'ignored_lib.py')),
        os.path.normpath(os.path.join(test_base_dir, '.hidden_dir', 'test_hidden.py')),
        os.path.normpath(os.path.join(test_base_dir, '.idea', 'some_script.py')),
        os.path.normpath(os.path.join(test_base_dir, 'node_modules', 'somelib', 'some_code.py')),
    ]

    for excluded_path in excluded_paths_to_check:
        assert excluded_path not in paths_found, f"Tags from '{excluded_path}' were NOT ignored"

    print("Correctly excluded files from 'tests/', '.venv/', '.hidden_dir/', '.idea/', 'node_modules/' directories.")

    # Test scanning from root directory ('.') - this is tricky in test environment, mock if needed or skip if too broad
    # For now, let's assume the specific test_base_dir is sufficient for unit testing the logic
    print("Skipping test for scanning '.' to avoid pulling in unrelated project TODOs during test phase.")
    # results_from_root = find_code_tags('.', tags_to_find)
    # print(f"\nFound {len(results_from_root)} tags when scanning from '.' (actual project files). This is informational.")


    results_non_existent = find_code_tags('non_existent_dir_qwerty_123', tags_to_find)
    assert not results_non_existent, "Expected empty list for non-existent directory"
    print("Correctly returned empty list for non-existent directory.")

    results_no_tags = find_code_tags(test_base_dir, [])
    assert not results_no_tags, "Expected empty list when no tags are specified"
    print("Correctly returned empty list when no tags are specified.")

    results_other_tags = find_code_tags(test_base_dir, ['REVIEW', 'OPTIMIZE'])
    assert not results_other_tags, "Expected empty list for tags not present in files"
    print("Correctly returned empty list for tags not present in files.")

    print("--- All find_code_tags unit tests passed ---")

    import shutil
    shutil.rmtree(test_base_dir)
    print(f"Cleaned up {test_base_dir}.")
