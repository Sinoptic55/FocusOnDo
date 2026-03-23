/**
 * API service class for communicating with backend
 */

import type {
  User,
  Task,
  TaskCreate,
  TaskUpdate,
  TaskQuickCreate,
  TaskList,
  TaskStatus,
  Project,
  Client,
  PomodoroInterval,
  RecurringTask,
  RecurringTaskCreate,
  TimeSegment,
  AppSettings,
  AppSettingsData,
  RegisterRequest,
  LoginRequest,
  TimerState,
  AnalyticsData
} from './models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ErrorInterceptor = (error: any) => Promise<void> | void;

export class ApiService {
  private static instance: ApiService;
  private errorInterceptors: ErrorInterceptor[] = [];

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const error = {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          message: errorData.detail || errorData.message || 'Request failed'
        };

        // Execute error interceptors
        for (const interceptor of this.errorInterceptors) {
          await interceptor(error);
        }

        throw new Error(error.message);
      }

      // If response is empty (e.g. 204 No Content), return empty object
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const networkError = {
          status: 0,
          message: 'Network error: Please check your connection'
        };
        for (const interceptor of this.errorInterceptors) {
          await interceptor(networkError);
        }
      }
      throw error;
    }
  }

  // Auth
  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<void> {
    await this.request<void>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Tasks
  async getTasks(filters?: {
    list_id?: number;
    status_id?: number;
    project_id?: number;
    client_id?: number;
    planned_date?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.list_id) params.append('list_id', filters.list_id.toString());
    if (filters?.status_id) params.append('status_id', filters.status_id.toString());
    if (filters?.project_id) params.append('project_id', filters.project_id.toString());
    if (filters?.client_id) params.append('client_id', filters.client_id.toString());
    if (filters?.planned_date) params.append('planned_date', filters.planned_date);
    
    return this.request<Task[]>(`/api/tasks?${params.toString()}`);
  }

  async getTask(id: number): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`);
  }

  async createTask(data: TaskCreate): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: TaskUpdate): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number): Promise<void> {
    await this.request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async quickCreateTask(data: TaskQuickCreate): Promise<Task> {
    return this.request<Task>('/api/tasks/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Lists
  async getLists(): Promise<TaskList[]> {
    return this.request<TaskList[]>('/api/lists');
  }

  async createList(data: Partial<TaskList>): Promise<TaskList> {
    return this.request<TaskList>('/api/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateList(id: number, data: Partial<TaskList>): Promise<TaskList> {
    return this.request<TaskList>(`/api/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteList(id: number): Promise<void> {
    await this.request<void>(`/api/lists/${id}`, {
      method: 'DELETE',
    });
  }

  // Statuses
  async getStatuses(): Promise<TaskStatus[]> {
    return this.request<TaskStatus[]>('/api/statuses');
  }

  async createStatus(data: Partial<TaskStatus>): Promise<TaskStatus> {
    return this.request<TaskStatus>('/api/statuses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStatus(id: number, data: Partial<TaskStatus>): Promise<TaskStatus> {
    return this.request<TaskStatus>(`/api/statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStatus(id: number): Promise<void> {
    await this.request<void>(`/api/statuses/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects');
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/api/clients');
  }

  async createClient(data: Partial<Client>): Promise<Client> {
    return this.request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: number): Promise<void> {
    await this.request<void>(`/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Intervals
  async getIntervals(): Promise<PomodoroInterval[]> {
    return this.request<PomodoroInterval[]>('/api/intervals');
  }

  async createInterval(data: Partial<PomodoroInterval>): Promise<PomodoroInterval> {
    return this.request<PomodoroInterval>('/api/intervals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInterval(id: number, data: Partial<PomodoroInterval>): Promise<PomodoroInterval> {
    return this.request<PomodoroInterval>(`/api/intervals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInterval(id: number): Promise<void> {
    await this.request<void>(`/api/intervals/${id}`, {
      method: 'DELETE',
    });
  }

  // Timer
  async getTimerState(): Promise<TimerState> {
    return this.request<TimerState>('/api/timer/state');
  }

  async startTimer(taskId: number | null): Promise<void> {
    await this.request<void>('/api/timer/start', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    });
  }

  async pauseTimer(): Promise<void> {
    await this.request<void>('/api/timer/pause', {
      method: 'POST',
    });
  }

  async skipInterval(): Promise<void> {
    await this.request<void>('/api/timer/skip', {
      method: 'POST',
    });
  }

  // Time Segments
  async getTimeSegments(taskId: number): Promise<TimeSegment[]> {
    return this.request<TimeSegment[]>(`/api/time-segments?task_id=${taskId}`);
  }

  async createTimeSegment(data: Partial<TimeSegment>): Promise<TimeSegment> {
    return this.request<TimeSegment>('/api/time-segments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimeSegment(id: number, data: Partial<TimeSegment>): Promise<TimeSegment> {
    return this.request<TimeSegment>(`/api/time-segments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeSegment(id: number): Promise<void> {
    await this.request<void>(`/api/time-segments/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    return this.request<AppSettings>('/api/settings');
  }

  async updateSettings(data: AppSettingsData): Promise<AppSettings> {
    return this.request<AppSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings_json: data }),
    });
  }

  // Smart Tools
  async getNextTask(): Promise<Task> {
    return this.request<Task>('/api/smart/next-task');
  }

  async getMorningRitualData(): Promise<any> {
    return this.request<any>('/api/smart/morning-ritual');
  }

  async getWeeklyReviewData(): Promise<any> {
    return this.request<any>('/api/smart/weekly-review');
  }

  // Analytics
  async getAnalyticsDashboard(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/api/analytics/dashboard');
  }
}

export const api = ApiService.getInstance();
