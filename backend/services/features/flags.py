import os
from typing import Dict

class FeatureFlags:
    """
    Simple feature flag service.
    Can be extended to use DB or external service (LaunchDarkly) later.
    """
    def __init__(self):
        # Default flags
        self.flags: Dict[str, bool] = {
            "new_valuation_engine": True,
            "beta_dashboard": False,
            "maintenance_mode": False
        }
        
        # Override from env vars (FEATURE_FLAG_NAME=true)
        for key in os.environ:
            if key.startswith("FEATURE_"):
                flag_name = key.replace("FEATURE_", "").lower()
                self.flags[flag_name] = os.getenv(key, "false").lower() == "true"

    def is_enabled(self, feature_name: str) -> bool:
        return self.flags.get(feature_name, False)

    def set_flag(self, feature_name: str, enabled: bool):
        """Runtime override (in-memory only for now)"""
        self.flags[feature_name] = enabled

feature_flags = FeatureFlags()
