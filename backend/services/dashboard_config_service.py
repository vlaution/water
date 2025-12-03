from sqlalchemy.orm import Session
from backend.database.models import UserDashboardConfig
from backend.api.dashboard_models import DashboardConfig
import json

class DashboardConfigService:
    def __init__(self, db: Session):
        self.db = db

    def get_config(self, user_id: int) -> DashboardConfig:
        record = self.db.query(UserDashboardConfig).filter(UserDashboardConfig.user_id == user_id).first()
        if record:
            try:
                data = json.loads(record.config_json)
                return DashboardConfig(**data)
            except:
                pass
        
        # Default Config
        return DashboardConfig(
            layout={
                "visible_components": [
                    "enterprise_value", 
                    "confidence_gauge", 
                    "strategic_alerts",
                    "method_breakdown"
                ],
                "order": [
                    "enterprise_value", 
                    "confidence_gauge", 
                    "strategic_alerts",
                    "method_breakdown"
                ]
            },
            theme="light"
        )

    def save_config(self, user_id: int, config: DashboardConfig):
        record = self.db.query(UserDashboardConfig).filter(UserDashboardConfig.user_id == user_id).first()
        config_json = json.dumps(config.dict())
        
        if record:
            record.config_json = config_json
        else:
            record = UserDashboardConfig(user_id=user_id, config_json=config_json)
            self.db.add(record)
        
        self.db.commit()
        self.db.refresh(record)
        return config
