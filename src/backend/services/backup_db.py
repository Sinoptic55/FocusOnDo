#!/usr/bin/env python3
"""
Automated PostgreSQL backup script for Pomodoro TMS.
Uses pg_dump to create compressed backups.
"""
import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration
DB_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/pomodoro_tms")
# Parse DB_URL to get components (stripping +asyncpg for pg_dump)
clean_url = DB_URL.replace("+asyncpg", "")

BACKUP_DIR = os.getenv("BACKUP_DIR", "./backups")
MAX_BACKUPS = int(os.getenv("MAX_BACKUPS", "30"))

def create_backup():
    """Create a new backup."""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"pomodoro_tms_{timestamp}.sql.gz"
    filepath = os.path.join(BACKUP_DIR, filename)

    print(f"Starting backup: {filename}...")

    # For Docker-based deployments, we might need to run this inside the container or against the port
    # Here we assume pg_dump is available in the environment
    try:
        # Construct pg_dump command using the URL
        # We use shell=True because of pipe to gzip
        cmd = f"pg_dump {clean_url} | gzip > {filepath}"
        
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True)
        
        print(f"Backup completed successfully: {filepath}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e.stderr.decode()}")
        return False

def prune_backups():
    """Remove old backups."""
    backups = sorted([
        os.path.join(BACKUP_DIR, f) 
        for f in os.listdir(BACKUP_DIR) 
        if f.startswith("pomodoro_tms_") and f.endswith(".sql.gz")
    ])

    if len(backups) > MAX_BACKUPS:
        to_delete = backups[:-MAX_BACKUPS]
        for f in to_delete:
            os.remove(f)
            print(f"Pruned old backup: {f}")

if __name__ == "__main__":
    if create_backup():
        prune_backups()
