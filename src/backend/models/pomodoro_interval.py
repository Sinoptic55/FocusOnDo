"""
PomodoroInterval model for configuring timer intervals.
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from db.database import Base


class PomodoroInterval(Base):
    """
    PomodoroInterval model representing timer interval configuration.
    Defines the sequence of work/break intervals for the Pomodoro timer.
    """
    __tablename__ = "pomodoro_intervals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order = Column("order", Integer, nullable=False)  # Order in the sequence (1, 2, 3, ...)
    type = Column(String(20), nullable=False)  # 'work' or 'break'
    duration_minutes = Column(Integer, nullable=False)  # Duration in minutes

    def __repr__(self) -> str:
        return f"<PomodoroInterval(id={self.id}, type='{self.type}', duration={self.duration_minutes}min)>"
