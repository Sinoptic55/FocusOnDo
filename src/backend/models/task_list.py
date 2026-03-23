"""
TaskList model for organizing tasks into lists.
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from db.database import Base


class TaskList(Base):
    """
    TaskList model representing task lists (e.g., Work, Personal, Inbox).
    """
    __tablename__ = "task_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False)  # Hex color code, e.g., "#FF5733"
    order = Column("order", Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<TaskList(id={self.id}, name='{self.name}', color='{self.color}')>"
