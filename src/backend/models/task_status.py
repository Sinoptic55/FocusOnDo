"""
TaskStatus model for managing task statuses.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from db.database import Base


class TaskStatus(Base):
    """
    TaskStatus model representing task statuses (e.g., To Do, In Progress, Done).
    """
    __tablename__ = "task_statuses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    board_visible = Column(Boolean, nullable=False, default=True)  # Whether status appears on board view
    order = Column("order", Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<TaskStatus(id={self.id}, name='{self.name}', board_visible={self.board_visible})>"
