/**
 * TypeScript models for Pomodoro TMS
 */

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  parent_task_id: number | null;
  title: string;
  description: string | null;
  planned_date: string | null;
  deadline: string | null;
  status_id: number | null;
  list_id: number | null;
  project_id: number | null;
  client_id: number | null;
  pomodoro_estimate: number | null;
  first_action: string | null;
  external_link: string | null;
  is_completed: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  total_time: number;
  subtasks?: Task[];
}

export interface TimeSegment {
  id: number;
  task_id: number;
  user_id: number;
  start_time: string;
  duration_seconds: number;
  actual_time_seconds: number;
  billed_time_seconds: number;
  energy_level: number | null;
  task_progressed: boolean | null;
  stuck: boolean | null;
}

export interface TaskList {
  id: number;
  user_id: number;
  name: string;
  color: string;
  order: number;
}

export interface TaskStatus {
  id: number;
  user_id: number;
  name: string;
  color: string;
  board_visible: boolean;
  order: number;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  color: string;
  archived: boolean;
}

export interface Client {
  id: number;
  user_id: number;
  name: string;
}

export interface PomodoroInterval {
  id: number;
  user_id: number;
  order: number;
  type: 'work' | 'short_break' | 'long_break';
  duration_minutes: number;
}

export interface RecurringTask {
  id: number;
  task_id: number;
  frequency_type: 'daily' | 'weekly' | 'monthly';
  frequency_data: Record<string, any>;
  last_created_date: string | null;
  end_date: string | null;
  end_count: number | null;
}

export interface AppSettings {
  id: number;
  user_id: number;
  settings_json: AppSettingsData;
}

export interface AppSettingsData {
  theme: 'auto' | 'light' | 'dark';
  sounds: {
    work_end: boolean;
    break_end: boolean;
  };
  hotkey: string;
  morning_ritual_enabled: boolean;
  review_day: number;
  stuck_threshold: number;
  language: 'ru' | 'en';
}

export interface TimerState {
  active: boolean;
  current_interval: PomodoroInterval | null;
  current_task_id: number | null;
  current_task_title: string | null;
  start_time: string | null;
  remaining_seconds: number;
}

export interface AnalyticsData {
  projects: ProjectTimeData[];
  clients: ClientTimeData[];
  productivity_peaks: ProductivityPeak[];
  estimation_accuracy: EstimationAccuracy[];
  work_speed: WorkSpeed[];
  stuck_patterns: StuckPattern[];
  dashboard: DashboardStats;
}

export interface ProjectTimeData {
  project_id: number;
  project_name: string;
  project_color: string;
  actual_time_seconds: number;
  billed_time_seconds: number;
}

export interface ClientTimeData {
  client_id: number;
  client_name: string;
  actual_time_seconds: number;
  billed_time_seconds: number;
  projects: ProjectTimeData[];
}

export interface ProductivityPeak {
  hour: number;
  total_time_seconds: number;
  task_count: number;
}

export interface EstimationAccuracy {
  task_id: number;
  task_title: string;
  estimated_pomodoros: number;
  actual_time_seconds: number;
  accuracy_percent: number;
}

export interface WorkSpeed {
  week_start: string;
  week_end: string;
  tasks_completed: number;
  total_time_seconds: number;
}

export interface StuckPattern {
  task_id: number;
  task_title: string;
  stuck_count: number;
  total_time_seconds: number;
}

export interface DashboardStats {
  today: {
    tasks_completed: number;
    total_time_seconds: number;
  };
  week: {
    tasks_completed: number;
    total_time_seconds: number;
  };
  total: {
    tasks_completed: number;
    total_time_seconds: number;
  };
}

// Request/Response types
export interface TaskCreate {
  title: string;
  description?: string;
  planned_date?: string;
  deadline?: string;
  status_id?: number;
  list_id?: number;
  project_id?: number;
  client_id?: number;
  pomodoro_estimate?: number;
  first_action?: string;
  external_link?: string;
  parent_task_id?: number;
  is_completed?: boolean;
  is_paid?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  planned_date?: string;
  deadline?: string;
  status_id?: number;
  list_id?: number;
  project_id?: number;
  client_id?: number;
  pomodoro_estimate?: number;
  first_action?: string;
  external_link?: string;
  is_completed?: boolean;
  is_paid?: boolean;
}

export interface TaskQuickCreate {
  title: string;
  list_id?: number;
}

export interface RecurringTaskCreate {
  frequency_type: 'daily' | 'weekly' | 'monthly';
  frequency_data: Record<string, any>;
  end_date?: string;
  end_count?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
