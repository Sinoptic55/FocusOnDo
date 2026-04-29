"""
Task model for managing tasks with hierarchical structure.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Task(Base):
    """
    Task model representing tasks and subtasks (steps).
    parent_task_id is used for hierarchical structure (steps = tasks with parent_task_id).
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    planned_date = Column(DateTime(timezone=True), nullable=True, index=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status_id = Column(Integer, ForeignKey("task_statuses.id", ondelete="SET NULL"), nullable=True, index=True)
    list_id = Column(Integer, ForeignKey("task_lists.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    pomodoro_estimate = Column(Integer, nullable=True)  # Estimated number of pomodoros
    first_action = Column(String(500), nullable=True)  # First concrete action to start
    external_link = Column(String(500), nullable=True)  # Link to external task/ticket
    is_completed = Column(Boolean, default=False, nullable=False, server_default='false')
    is_paid = Column(Boolean, default=False, nullable=False, server_default='false')
    sort_order = Column(Integer, default=0, nullable=False, server_default='0')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    parent = relationship("Task", remote_side=[id], backref="subtasks")

    # Indexes
    __table_args__ = (
        Index("ix_tasks_user_planned_date", "user_id", "planned_date"),
        Index("ix_tasks_user_status", "user_id", "status_id"),
        Index("ix_tasks_user_list", "user_id", "list_id"),
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', parent_task_id={self.parent_task_id})>"
