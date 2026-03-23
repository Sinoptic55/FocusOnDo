"""Initial migration

Revision ID: initial
Revises: 
Create Date: 2026-03-22 23:50:55.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create task_lists table
    op.create_table(
        'task_lists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_lists_id'), 'task_lists', ['id'], unique=False)
    op.create_index(op.f('ix_task_lists_user_id'), 'task_lists', ['user_id'], unique=False)

    # Create task_statuses table
    op.create_table(
        'task_statuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('board_visible', sa.Boolean(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_statuses_id'), 'task_statuses', ['id'], unique=False)
    op.create_index(op.f('ix_task_statuses_user_id'), 'task_statuses', ['user_id'], unique=False)

    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('archived', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'], unique=False)

    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)
    op.create_index(op.f('ix_clients_user_id'), 'clients', ['user_id'], unique=False)

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_task_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('planned_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status_id', sa.Integer(), nullable=True),
        sa.Column('list_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('pomodoro_estimate', sa.Integer(), nullable=True),
        sa.Column('first_action', sa.String(length=500), nullable=True),
        sa.Column('external_link', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['list_id'], ['task_lists.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['status_id'], ['task_statuses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_parent_task_id'), 'tasks', ['parent_task_id'], unique=False)
    op.create_index(op.f('ix_tasks_planned_date'), 'tasks', ['planned_date'], unique=False)
    op.create_index(op.f('ix_tasks_status_id'), 'tasks', ['status_id'], unique=False)
    op.create_index(op.f('ix_tasks_list_id'), 'tasks', ['list_id'], unique=False)
    op.create_index('ix_tasks_user_planned_date', 'tasks', ['user_id', 'planned_date'], unique=False)
    op.create_index('ix_tasks_user_status', 'tasks', ['user_id', 'status_id'], unique=False)
    op.create_index('ix_tasks_user_list', 'tasks', ['user_id', 'list_id'], unique=False)

    # Create time_segments table
    op.create_table(
        'time_segments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False),
        sa.Column('actual_time_seconds', sa.Integer(), nullable=False),
        sa.Column('billed_time_seconds', sa.Integer(), nullable=False),
        sa.Column('energy_level', sa.Integer(), nullable=True),
        sa.Column('task_progressed', sa.Boolean(), nullable=False),
        sa.Column('stuck', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_time_segments_id'), 'time_segments', ['id'], unique=False)
    op.create_index(op.f('ix_time_segments_task_id'), 'time_segments', ['task_id'], unique=False)
    op.create_index(op.f('ix_time_segments_user_id'), 'time_segments', ['user_id'], unique=False)
    op.create_index(op.f('ix_time_segments_start_time'), 'time_segments', ['start_time'], unique=False)
    op.create_index('ix_time_segments_task', 'time_segments', ['task_id'], unique=False)
    op.create_index('ix_time_segments_user_start_time', 'time_segments', ['user_id', 'start_time'], unique=False)

    # Create pomodoro_intervals table
    op.create_table(
        'pomodoro_intervals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pomodoro_intervals_id'), 'pomodoro_intervals', ['id'], unique=False)
    op.create_index(op.f('ix_pomodoro_intervals_user_id'), 'pomodoro_intervals', ['user_id'], unique=False)

    # Create recurring_tasks table
    op.create_table(
        'recurring_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('frequency_type', sa.String(length=20), nullable=False),
        sa.Column('frequency_data_json', sa.JSON(), nullable=False),
        sa.Column('last_created_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_count', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recurring_tasks_id'), 'recurring_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_tasks_task_id'), 'recurring_tasks', ['task_id'], unique=True)

    # Create app_settings table
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('settings_json', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_app_settings_id'), 'app_settings', ['id'], unique=False)
    op.create_index(op.f('ix_app_settings_user_id'), 'app_settings', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_app_settings_user_id'), table_name='app_settings')
    op.drop_index(op.f('ix_app_settings_id'), table_name='app_settings')
    op.drop_table('app_settings')
    op.drop_index(op.f('ix_recurring_tasks_task_id'), table_name='recurring_tasks')
    op.drop_index(op.f('ix_recurring_tasks_id'), table_name='recurring_tasks')
    op.drop_table('recurring_tasks')
    op.drop_index(op.f('ix_pomodoro_intervals_user_id'), table_name='pomodoro_intervals')
    op.drop_index(op.f('ix_pomodoro_intervals_id'), table_name='pomodoro_intervals')
    op.drop_table('pomodoro_intervals')
    op.drop_index('ix_time_segments_user_start_time', table_name='time_segments')
    op.drop_index('ix_time_segments_task', table_name='time_segments')
    op.drop_index(op.f('ix_time_segments_start_time'), table_name='time_segments')
    op.drop_index(op.f('ix_time_segments_user_id'), table_name='time_segments')
    op.drop_index(op.f('ix_time_segments_task_id'), table_name='time_segments')
    op.drop_index(op.f('ix_time_segments_id'), table_name='time_segments')
    op.drop_table('time_segments')
    op.drop_index('ix_tasks_user_list', table_name='tasks')
    op.drop_index('ix_tasks_user_status', table_name='tasks')
    op.drop_index('ix_tasks_user_planned_date', table_name='tasks')
    op.drop_index(op.f('ix_tasks_list_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_status_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_planned_date'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_parent_task_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_index(op.f('ix_clients_user_id'), table_name='clients')
    op.drop_index(op.f('ix_clients_id'), table_name='clients')
    op.drop_table('clients')
    op.drop_index(op.f('ix_projects_user_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_id'), table_name='projects')
    op.drop_table('projects')
    op.drop_index(op.f('ix_task_statuses_user_id'), table_name='task_statuses')
    op.drop_index(op.f('ix_task_statuses_id'), table_name='task_statuses')
    op.drop_table('task_statuses')
    op.drop_index(op.f('ix_task_lists_user_id'), table_name='task_lists')
    op.drop_index(op.f('ix_task_lists_id'), table_name='task_lists')
    op.drop_table('task_lists')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
