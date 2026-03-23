"""
RecurringTask model for managing recurring tasks.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String
from sqlalchemy.orm import relationship
from db.database import Base


class RecurringTask(Base):
    """
    RecurringTask model representing recurring task configuration.
    Defines how and when a task should be recreated after completion.
    """
    __tablename__ = "recurring_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    frequency_type = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    frequency_data_json = Column(JSON, nullable=False)  # Additional frequency config (e.g., day of week, day of month)
    last_created_date = Column(DateTime(timezone=True), nullable=True)  # Last date a task was created
    end_date = Column(DateTime(timezone=True), nullable=True)  # Optional end date for recurrence
    end_count = Column(Integer, nullable=True)  # Optional max number of occurrences

    # Relationships
    task = relationship("Task", backref="recurring_config")

    def __repr__(self) -> str:
        return f"<RecurringTask(id={self.id}, task_id={self.task_id}, frequency='{self.frequency_type}')>"
