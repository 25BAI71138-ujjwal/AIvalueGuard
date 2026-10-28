import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime
from backend.app.database import Base, utc_now

class BudgetConfig(Base):
    __tablename__ = "budget_configs"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(String(64), default="ws_default", index=True)
    daily_budget_usd = Column(Float, default=5.0)
    weekly_budget_usd = Column(Float, default=25.0)
    monthly_budget_usd = Column(Float, default=100.0)
    warning_threshold_pct = Column(Float, default=80.0)
    alert_email = Column(String(128), nullable=True)
    is_alerts_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
