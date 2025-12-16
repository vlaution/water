import sys
print("Importing models...")
try:
    from backend.calculations.models import MIPConfig, MIPTrancheInput
    print("Models imported successfully.")
except Exception as e:
    print(f"Error importing models: {e}")
    sys.exit(1)

print("Importing lbo...")
try:
    from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator
    print("LBO imported successfully.")
except Exception as e:
    print(f"Error importing lbo: {e}")
    sys.exit(1)
