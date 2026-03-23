"""
Script to apply database migrations manually.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:Vfgf4rfw$$@localhost:5432/pomodoro_tms")


async def apply_migration():
    """
    Apply the initial migration manually.
    """
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # Create users table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);"))

        # Create task_lists table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS task_lists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(7) NOT NULL,
                "order" INTEGER NOT NULL DEFAULT 0
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_task_lists_user_id ON task_lists (user_id);"))

        # Create task_statuses table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS task_statuses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                board_visible BOOLEAN NOT NULL DEFAULT TRUE,
                "order" INTEGER NOT NULL DEFAULT 0
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_task_statuses_user_id ON task_statuses (user_id);"))

        # Create projects table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(7) NOT NULL,
                archived BOOLEAN NOT NULL DEFAULT FALSE
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_projects_user_id ON projects (user_id);"))

        # Create clients table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_clients_user_id ON clients (user_id);"))

        # Create tasks table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                planned_date TIMESTAMP WITH TIME ZONE,
                deadline TIMESTAMP WITH TIME ZONE,
                status_id INTEGER REFERENCES task_statuses(id) ON DELETE SET NULL,
                list_id INTEGER REFERENCES task_lists(id) ON DELETE SET NULL,
                project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
                client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
                pomodoro_estimate INTEGER,
                first_action VARCHAR(500),
                external_link VARCHAR(500),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks (user_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_parent_task_id ON tasks (parent_task_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_planned_date ON tasks (planned_date);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_status_id ON tasks (status_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_list_id ON tasks (list_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_user_planned_date ON tasks (user_id, planned_date);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_user_status ON tasks (user_id, status_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_user_list ON tasks (user_id, list_id);"))

        # Create time_segments table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS time_segments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                duration_seconds INTEGER NOT NULL,
                actual_time_seconds INTEGER NOT NULL,
                billed_time_seconds INTEGER NOT NULL,
                energy_level INTEGER,
                task_progressed BOOLEAN NOT NULL DEFAULT FALSE,
                stuck BOOLEAN NOT NULL DEFAULT FALSE
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_time_segments_task_id ON time_segments (task_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_time_segments_user_id ON time_segments (user_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_time_segments_start_time ON time_segments (start_time);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_time_segments_task ON time_segments (task_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_time_segments_user_start_time ON time_segments (user_id, start_time);"))

        # Create pomodoro_intervals table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pomodoro_intervals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "order" INTEGER NOT NULL,
                type VARCHAR(20) NOT NULL,
                duration_minutes INTEGER NOT NULL
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pomodoro_intervals_user_id ON pomodoro_intervals (user_id);"))

        # Create recurring_tasks table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS recurring_tasks (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
                frequency_type VARCHAR(20) NOT NULL,
                frequency_data_json JSONB NOT NULL,
                last_created_date TIMESTAMP WITH TIME ZONE,
                end_date TIMESTAMP WITH TIME ZONE,
                end_count INTEGER
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_recurring_tasks_task_id ON recurring_tasks (task_id);"))

        # Create app_settings table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                settings_json JSONB NOT NULL DEFAULT '{}'
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_app_settings_user_id ON app_settings (user_id);"))

    await engine.dispose()
    print("Migration applied successfully!")


if __name__ == "__main__":
    asyncio.run(apply_migration())
