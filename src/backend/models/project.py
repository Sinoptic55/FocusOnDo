"""
Project model for organizing tasks by project.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from db.database import Base


class Project(Base):
    """
    Project model representing projects (e.g., Website Redesign, Mobile App).
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False)  # Hex color code, e.g., "#3498DB"
    archived = Column(Boolean, nullable=False, default=False)

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name='{self.name}', archived={self.archived})>"
