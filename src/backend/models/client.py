"""
Client model for managing clients.
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from db.database import Base


class Client(Base):
    """
    Client model representing clients (e.g., Company ABC, John Doe).
    """
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, name='{self.name}')>"
