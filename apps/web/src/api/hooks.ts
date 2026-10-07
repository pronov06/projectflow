import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DashboardStats,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from '@pms/shared';
import { del, get, post, put } from '../lib/api';

export interface ProjectFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface TaskFilters extends ProjectFilters {
  projectId?: string;
  priority?: string;
}

/** Drops empty values so they are not sent as `?status=`. */
function clean<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ) as Partial<T>;
}

export const keys = {
  dashboard: ['dashboard'] as const,
  projects: (f: ProjectFilters = {}) => ['projects', clean(f)] as const,
  project: (id: string) => ['project', id] as const,
  tasks: (f: TaskFilters = {}) => ['tasks', clean(f)] as const,
};

export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: async () => (await get<DashboardStats>('/dashboard')).data });

export const useProjects = (filters: ProjectFilters) =>
  useQuery({
    queryKey: keys.projects(filters),
    queryFn: () => get<Project[]>('/projects', clean(filters)),
    placeholderData: keepPreviousData,
  });

export const useProject = (id: string) =>
  useQuery({ queryKey: keys.project(id), queryFn: async () => (await get<Project>(`/projects/${id}`)).data });

export const useTasks = (filters: TaskFilters, enabled = true) =>
  useQuery({
    queryKey: keys.tasks(filters),
    queryFn: () => get<Task[]>('/tasks', clean(filters)),
    placeholderData: keepPreviousData,
    enabled,
  });

/** Projects for <select> menus (first 100, by name). */
export const useProjectOptions = () =>
  useQuery({
    queryKey: keys.projects({ limit: 100, sortBy: 'name', order: 'asc' }),
    queryFn: () => get<Project[]>('/projects', { limit: 100, sortBy: 'name', order: 'asc' }),
  });

/** Anything that changes projects or tasks can change every list and the dashboard. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['projects'] }),
      qc.invalidateQueries({ queryKey: ['project'] }),
      qc.invalidateQueries({ queryKey: ['tasks'] }),
      qc.invalidateQueries({ queryKey: keys.dashboard }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: ProjectCreateInput) => post<Project>('/projects', input),
    onSuccess: invalidate,
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectUpdateInput }) =>
      put<Project>(`/projects/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => del(`/projects/${id}`), onSuccess: invalidate });
}

export function useCreateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: TaskCreateInput) => post<Task>('/tasks', input),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdateInput }) => put<Task>(`/tasks/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => del(`/tasks/${id}`), onSuccess: invalidate });
}
