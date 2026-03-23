"""
TimeSegment model for tracking work time on tasks.
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from db.database import Base


class TimeSegment(Base):
    """
    TimeSegment model representing time segments tracked on tasks.
    Stores both actual time and billed time (adjustable for invoicing).
    """
    __tablename__ = "time_segments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_seconds = Column(Integer, nullable=False)  # Planned duration
    actual_time_seconds = Column(Integer, nullable=False)  # Actual time worked
    billed_time_seconds = Column(Integer, nullable=False)  # Time to bill (adjustable)
    energy_level = Column(Integer, nullable=True)  # 1-5 scale after work interval
    task_progressed = Column(Boolean, nullable=False, default=False)
    stuck = Column(Boolean, nullable=False, default=False)  # User felt stuck during this segment

    # Relationships
    task = relationship("Task", backref="time_segments")

    # Indexes
    __table_args__ = (
        Index("ix_time_segments_task", "task_id"),
        Index("ix_time_segments_user_start_time", "user_id", "start_time"),
    )

    def __repr__(self) -> str:
        return f"<TimeSegment(id={self.id}, task_id={self.task_id}, duration={self.duration_seconds}s)>"
