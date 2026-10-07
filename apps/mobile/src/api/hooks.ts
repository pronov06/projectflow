import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardStats, Project, Task, TaskCreateInput, TaskUpdateInput } from '@pms/shared';
import { del, get, post, put } from '../lib/api';

export interface TaskFilters {
  projectId?: string;
  search?: string;
  status?: string;
  priority?: string;
}

const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>;

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: async () => (await get<DashboardStats>('/dashboard')).data });

export const useProjects = () =>
  useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => (await get<Project[]>('/projects', { limit: 100, sortBy: 'createdAt', order: 'desc' })).data,
  });

export const useProject = (id: string) =>
  useQuery({ queryKey: ['project', id], queryFn: async () => (await get<Project>(`/projects/${id}`)).data });

export const useTasks = (filters: TaskFilters) =>
  useQuery({
    queryKey: ['tasks', clean(filters)],
    queryFn: async () => (await get<Task[]>('/tasks', { ...clean(filters), limit: 100, sortBy: 'createdAt' })).data,
  });

export const useTask = (id: string | undefined) =>
  useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await get<Task>(`/tasks/${id}`)).data,
    enabled: !!id,
  });

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useCreateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (input: TaskCreateInput) => post<Task>('/tasks', input), onSuccess: invalidate });
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
