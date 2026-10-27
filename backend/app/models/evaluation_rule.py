import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from backend.app.database import Base

class EvaluationRule(Base):
    __tablename__ = "evaluation_rules"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(String(256), nullable=True)
    rule_type = Column(String(32), nullable=False) # json_schema, required_fields, regex_match, min_length, max_length, no_refusal
    parameters_json = Column(Text, default="{}") # e.g. {"fields": ["status", "summary"]}
    severity = Column(String(32), default="retry_then_escalate") # fail, warning, retry_then_escalate
    is_active = Column(Boolean, default=True)
    pass_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
