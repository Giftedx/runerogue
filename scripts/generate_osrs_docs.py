#!/usr/bin/env python
"""
OSRS Agent Documentation Generator

This script demonstrates how to use the custom MCP tools for documentation generation
directly from the command line. It generates documentation for the OSRS agent system
using Python's built-in inspection capabilities.
"""

import os
import sys
import argparse
import inspect
import importlib.util
import json
import builtins
from pathlib import Path
from unittest.mock import MagicMock

# Set up the project root
PROJECT_ROOT = Path(__file__).parent.parent.absolute()

# Add project root to Python path to allow importing project modules
sys.path.insert(0, str(PROJECT_ROOT))

# Store the original import function
original_import = builtins.__import__

# Define mock modules to handle missing dependencies
MOCK_MODULES = {
    'autogen': MagicMock(),
    'economy_models': MagicMock(),
    'economy_models.osrs_parser': MagicMock(),
}

# Configure mock modules
MOCK_MODULES['autogen'].config_list_from_json = MagicMock(return_value=[{'model': 'gpt-4-turbo'}])
MOCK_MODULES['autogen'].AssistantAgent = MagicMock()
MOCK_MODULES['autogen'].UserProxyAgent = MagicMock()
MOCK_MODULES['autogen'].GroupChat = MagicMock()
MOCK_MODULES['autogen'].GroupChatManager = MagicMock()

# Mock the fetch_wiki_data function
MOCK_MODULES['economy_models.osrs_parser'].fetch_wiki_data = MagicMock(return_value={'status': 'success', 'data': {}})

# Make the mock modules accessible via their parent modules
MOCK_MODULES['economy_models'].osrs_parser = MOCK_MODULES['economy_models.osrs_parser']

# Create a custom import function to handle missing modules
def custom_import(name, *args, **kwargs):
    if name in MOCK_MODULES:
        return MOCK_MODULES[name]
    return original_import(name, *args, **kwargs)

# Replace the built-in import function with our custom one
builtins.__import__ = custom_import


def import_module_from_path(module_path):
    """
    Import a module from a file path.
    
    Args:
        module_path (str): Path to the module file
        
    Returns:
        module: The imported module
    """
    module_path = Path(module_path)
    module_name = module_path.stem
    
    # Make sure the module path is absolute
    if not module_path.is_absolute():
        module_path = PROJECT_ROOT / module_path
    
    # Import the module
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None:
        raise ImportError(f"Could not import module from {module_path}")
    
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    if spec.loader is None:
        raise ImportError(f"Could not load module from {module_path}")
    spec.loader.exec_module(module)
    
    return module


def generate_markdown_documentation(module, output_file):
    """
    Generate markdown documentation for a module.
    
    Args:
        module: The module to document
        output_file (Path): Path to the output file
    """
    with open(output_file, 'w') as f:
        # Write module header
        module_name = module.__name__
        module_doc = inspect.getdoc(module) or "No module docstring available."
        
        f.write(f"# {module_name}\n\n")
        f.write(f"{module_doc}\n\n")
        
        # Get all module members
        members = inspect.getmembers(module)
        
        # Document classes
        classes = [m for m in members if inspect.isclass(m[1]) and m[1].__module__ == module.__name__]
        if classes:
            f.write("## Classes\n\n")
            
            for name, cls in classes:
                f.write(f"### {name}\n\n")
                
                # Class docstring
                cls_doc = inspect.getdoc(cls) or "No class docstring available."
                f.write(f"{cls_doc}\n\n")
                
                # Class methods
                methods = inspect.getmembers(cls, predicate=inspect.isfunction)
                if methods:
                    f.write("#### Methods\n\n")
                    
                    for method_name, method in methods:
                        if method_name.startswith('_') and method_name != '__init__':
                            continue  # Skip private methods except __init__
                            
                        f.write(f"##### `{method_name}`\n\n")
                        
                        # Method signature
                        sig = inspect.signature(method)
                        f.write(f"```python\ndef {method_name}{sig}\n```\n\n")
                        
                        # Method docstring
                        method_doc = inspect.getdoc(method) or "No method docstring available."
                        f.write(f"{method_doc}\n\n")
        
        # Document functions
        functions = [m for m in members if inspect.isfunction(m[1]) and m[1].__module__ == module.__name__]
        if functions:
            f.write("## Functions\n\n")
            
            for name, func in functions:
                if name.startswith('_'):
                    continue  # Skip private functions
                    
                f.write(f"### `{name}`\n\n")
                
                # Function signature
                sig = inspect.signature(func)
                f.write(f"```python\ndef {name}{sig}\n```\n\n")
                
                # Function docstring
                func_doc = inspect.getdoc(func) or "No function docstring available."
                f.write(f"{func_doc}\n\n")
        
        # Document variables
        variables = [m for m in members if not inspect.ismodule(m[1]) and not inspect.isclass(m[1]) 
                     and not inspect.isfunction(m[1]) and not inspect.isbuiltin(m[1])
                     and not m[0].startswith('_')]
        if variables:
            f.write("## Variables\n\n")
            
            for name, var in variables:
                f.write(f"### `{name}`\n\n")
                f.write(f"Type: `{type(var).__name__}`\n\n")
                
                # Try to get a reasonable representation of the variable
                try:
                    if isinstance(var, (int, float, str, bool, list, dict, tuple)):
                        f.write(f"Value: `{var}`\n\n")
                except:
                    pass


def generate_rst_documentation(module, output_file):
    """
    Generate reStructuredText documentation for a module.
    
    Args:
        module: The module to document
        output_file (Path): Path to the output file
    """
    with open(output_file, 'w') as f:
        # Write module header
        module_name = module.__name__
        module_doc = inspect.getdoc(module) or "No module docstring available."
        
        f.write(f"{module_name}\n{'=' * len(module_name)}\n\n")
        f.write(f"{module_doc}\n\n")
        
        # Get all module members
        members = inspect.getmembers(module)
        
        # Document classes
        classes = [m for m in members if inspect.isclass(m[1]) and m[1].__module__ == module.__name__]
        if classes:
            f.write("Classes\n-------\n\n")
            
            for name, cls in classes:
                f.write(f"{name}\n{'~' * len(name)}\n\n")
                
                # Class docstring
                cls_doc = inspect.getdoc(cls) or "No class docstring available."
                f.write(f"{cls_doc}\n\n")
                
                # Class methods
                methods = inspect.getmembers(cls, predicate=inspect.isfunction)
                if methods:
                    f.write("Methods\n^^^^^^^\n\n")
                    
                    for method_name, method in methods:
                        if method_name.startswith('_') and method_name != '__init__':
                            continue  # Skip private methods except __init__
                            
                        f.write(f"**{method_name}**\n\n")
                        
                        # Method signature
                        sig = inspect.signature(method)
                        f.write(f".. code-block:: python\n\n   def {method_name}{sig}\n\n")
                        
                        # Method docstring
                        method_doc = inspect.getdoc(method) or "No method docstring available."
                        f.write(f"{method_doc}\n\n")
        
        # Document functions
        functions = [m for m in members if inspect.isfunction(m[1]) and m[1].__module__ == module.__name__]
        if functions:
            f.write("Functions\n---------\n\n")
            
            for name, func in functions:
                if name.startswith('_'):
                    continue  # Skip private functions
                    
                f.write(f"**{name}**\n\n")
                
                # Function signature
                sig = inspect.signature(func)
                f.write(f".. code-block:: python\n\n   def {name}{sig}\n\n")
                
                # Function docstring
                func_doc = inspect.getdoc(func) or "No function docstring available."
                f.write(f"{func_doc}\n\n")
        
        # Document variables
        variables = [m for m in members if not inspect.ismodule(m[1]) and not inspect.isclass(m[1]) 
                     and not inspect.isfunction(m[1]) and not inspect.isbuiltin(m[1])
                     and not m[0].startswith('_')]
        if variables:
            f.write("Variables\n---------\n\n")
            
            for name, var in variables:
                f.write(f"**{name}**\n\n")
                f.write(f"Type: ``{type(var).__name__}``\n\n")
                
                # Try to get a reasonable representation of the variable
                try:
                    if isinstance(var, (int, float, str, bool, list, dict, tuple)):
                        f.write(f"Value: ``{var}``\n\n")
                except:
                    pass


def generate_documentation(module_path, output_format="markdown"):
    """
    Generate documentation for the specified module.
    
    Args:
        module_path (str): Path to the module to document
        output_format (str): Output format (markdown or rst)
    
    Returns:
        dict: Result of the documentation generation
    """
    print(f"Generating {output_format} documentation for {module_path}...")
    
    # Create output directory if it doesn't exist
    output_dir = PROJECT_ROOT / "docs" / "generated"
    output_dir.mkdir(exist_ok=True, parents=True)
    
    # Determine module name and output file
    module_name = Path(module_path).stem
    output_file = output_dir / f"{module_name}.{'md' if output_format == 'markdown' else 'rst'}"
    
    try:
        # Import the module
        module = import_module_from_path(module_path)
        
        # Generate documentation based on format
        if output_format == "markdown":
            generate_markdown_documentation(module, output_file)
        else:  # rst
            generate_rst_documentation(module, output_file)
        
        success = True
        output = f"Documentation generated successfully at {output_file}"
        print(output)
        
    except Exception as e:
        success = False
        output = f"Error generating documentation: {str(e)}"
        print(output, file=sys.stderr)
    
    return {
        "success": success,
        "output": output,
        "module": module_path,
        "format": output_format,
        "output_file": str(output_file) if success else None
    }


def main():
    """Main function to parse arguments and generate documentation."""
    parser = argparse.ArgumentParser(description="Generate documentation for OSRS agent system")
    parser.add_argument(
        "--module", 
        default="agents/osrs_agent_system.py",
        help="Path to the module to document (default: agents/osrs_agent_system.py)"
    )
    parser.add_argument(
        "--format", 
        choices=["markdown", "rst"],
        default="markdown",
        help="Output format (default: markdown)"
    )
    
    args = parser.parse_args()
    
    # Generate documentation
    result = generate_documentation(args.module, args.format)
    
    # Output result as JSON for potential automation
    if result["success"]:
        print(f"\nDocumentation generation complete!")
        print(f"Output file: {result['output_file']}")
    else:
        print(f"\nDocumentation generation failed!", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
