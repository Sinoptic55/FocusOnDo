"""
Rate limiter for authentication endpoints.
"""
import asyncio
import time
from typing import Dict, List


class RateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()

    async def is_allowed(self, key: str) -> bool:
        async with self._lock:
            now = time.time()
            window_start = now - self.window_seconds
            # clean old attempts
            if key in self.attempts:
                self.attempts[key] = [ts for ts in self.attempts[key] if ts > window_start]
            else:
                self.attempts[key] = []

            if len(self.attempts[key]) < self.max_attempts:
                return True
            else:
                return False

    async def record_failed_attempt(self, key: str):
        async with self._lock:
            now = time.time()
            if key not in self.attempts:
                self.attempts[key] = []
            self.attempts[key].append(now)

    async def clear_attempts(self, key: str):
        async with self._lock:
            if key in self.attempts:
                del self.attempts[key]


# Singleton instance for login endpoint (5 attempts per 15 minutes)
login_rate_limiter = RateLimiter(max_attempts=5, window_seconds=15 * 60)