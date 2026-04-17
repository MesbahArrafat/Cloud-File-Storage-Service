import api from './axios';
import type { ActivityLog, PaginatedResponse } from '../types';

export const activityApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<ActivityLog>>('/activity/', { params: { page } }).then((r) => r.data),
};
