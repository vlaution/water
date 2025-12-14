from backend.services.metrics.aggregator import aggregate_metrics
from backend.utils.cache import cache
import json

def verify_metrics():
    print("Triggering aggregation...")
    aggregate_metrics()
    
    print("\nChecking System Summary...")
    sys_summary = cache.get_sync("metrics:system_summary")
    if sys_summary:
        print(f"Full System Summary: {sys_summary}")
        print(f"✅ Active Users: {sys_summary.get('active_users')}")
        print(f"✅ Avg Actions/User: {sys_summary.get('avg_actions_per_user')}")
    else:
        print("❌ System Summary not found in cache. Aggregation might have failed or no data found.")

    print("\nChecking Valuation Summary...")
    val_summary = cache.get_sync("metrics:valuation_summary")
    if val_summary:
        print(f"Full Valuation Summary: {val_summary}")
        print(f"✅ Method Popularity: {val_summary.get('method_popularity')}")
    else:
        print("❌ Valuation Summary not found in cache. Aggregation might have failed or no data found.")

if __name__ == "__main__":
    verify_metrics()
