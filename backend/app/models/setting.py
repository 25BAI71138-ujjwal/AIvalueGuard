import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from backend.app.database import Base, utc_now

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(256), nullable=True)
    is_secret = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
