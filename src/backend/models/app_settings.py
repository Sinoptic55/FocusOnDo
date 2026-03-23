"""
AppSettings model for storing user application settings.
"""
from sqlalchemy import Column, Integer, ForeignKey, JSON
from db.database import Base


class AppSettings(Base):
    """
    AppSettings model representing user application settings.
    Stores theme, sounds, hotkeys, and other preferences as JSON.
    """
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    settings_json = Column(JSON, nullable=False, default={})

    def __repr__(self) -> str:
        return f"<AppSettings(id={self.id}, user_id={self.user_id})>"
