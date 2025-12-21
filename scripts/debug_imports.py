import sys
import os

root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_path)
print(f"Added to path: {root_path}")

try:
    import backend
    print(f"Imported backend: {backend}")
    
    import backend.calculations
    print(f"Imported backend.calculations: {backend.calculations}")
    
    import backend.calculations.models
    print(f"Imported backend.calculations.models: {backend.calculations.models}")
    
    print("Attributes in models:")
    print(dir(backend.calculations.models))
    
    print("LBOInput" in dir(backend.calculations.models))
    
    from backend.calculations.models import LBOInput
    print("Successfully imported LBOInput")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
