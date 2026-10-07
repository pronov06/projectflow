import type { ProjectStatus, TaskPriority, TaskStatus, UserRole } from './enums';

/** Public user shape — never contains the password hash. */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  /** YYYY-MM-DD */
  startDate: string | null;
  /** YYYY-MM-DD */
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
  /** 0–100, share of tasks completed */
  progress: number;
}

export interface Task {
  id: string;
  projectId: string;
  project: { id: string; name: string };
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  /** YYYY-MM-DD */
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  /** Tasks whose status is PENDING */
  pendingTasks: number;
  inProgressTasks: number;
  projectsInProgress: number;
  /** Not completed and due before today (UTC) */
  overdueTasks: number;
  projectsByStatus: Record<ProjectStatus, number>;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  /** Only returned to native clients (X-Client-Platform: mobile); web gets an httpOnly cookie. */
  refreshToken?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiFieldError[];
  };
}

/** Header native clients send so the API returns the refresh token in the body instead of a cookie. */
export const CLIENT_PLATFORM_HEADER = 'x-client-platform';
