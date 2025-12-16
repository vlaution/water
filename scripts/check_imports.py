import os
import sys
import importlib
import pkgutil
import traceback

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

def check_imports(start_pkg):
    print(f"Checking imports for package: {start_pkg}")
    error_count = 0
    
    # Walk through the directory
    package_dir = os.path.join(project_root, start_pkg)
    
    for root, dirs, files in os.walk(package_dir):
        # Skip migrations directory
        if "migrations" in root.split(os.sep):
            continue
            
        for file in files:
            if file.endswith(".py") and file != "__init__.py":
                # Construct module name
                rel_path = os.path.relpath(os.path.join(root, file), project_root)
                module_name = rel_path.replace(os.sep, ".")[:-3]
                
                try:
                    importlib.import_module(module_name)
                    # print(f"✅ Imported {module_name}")
                except Exception as e:
                    print(f"❌ Failed to import {module_name}: {e}")
                    traceback.print_exc()
                    error_count += 1
                    
    return error_count

if __name__ == "__main__":
    errors = check_imports("backend")
    if errors > 0:
        print(f"\nFound {errors} errors.")
        sys.exit(1)
    else:
        print("\nAll modules imported successfully.")
        sys.exit(0)
