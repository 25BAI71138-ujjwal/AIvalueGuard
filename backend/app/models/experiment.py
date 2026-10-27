import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from backend.app.database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    dataset_name = Column(String(128), default="Support & Code Benchmark")
    baseline_model = Column(String(64), default="gpt-4o")
    optimized_policy = Column(String(64), default="balanced_cost_quality")
    total_test_cases = Column(Integer, default=0)
    completed_test_cases = Column(Integer, default=0)
    
    # Financial metrics
    baseline_total_cost = Column(Float, default=0.0)
    optimized_total_cost = Column(Float, default=0.0)
    savings_percentage = Column(Float, default=0.0)
    
    # Latency & Quality
    baseline_avg_latency_ms = Column(Float, default=0.0)
    optimized_avg_latency_ms = Column(Float, default=0.0)
    baseline_quality_pass_rate = Column(Float, default=0.0)
    optimized_quality_pass_rate = Column(Float, default=0.0)
    cache_hit_rate = Column(Float, default=0.0)
    
    status = Column(String(32), default="completed") # running, completed, cancelled, failed
    results_summary_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
