import sys
import os
import traceback

# Add project root to path
sys.path.insert(0, os.getcwd())

try:
    print("Importing backend.main...")
    import backend.main
    print("Import successful!")
except Exception:
    traceback.print_exc()
