import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';

export function useActivity(page = 1) {
  return useQuery({
    queryKey: ['activity', page],
    queryFn: () => activityApi.list(page),
  });
}
