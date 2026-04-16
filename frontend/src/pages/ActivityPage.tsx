import { useActivity } from '../hooks/useActivity';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import type { ActivityLog } from '../types';

const ACTION_LABELS: Record<ActivityLog['action'], { label: string; variant: 'success' | 'info' | 'danger' | 'warning' | 'default' }> = {
  upload: { label: 'Upload', variant: 'success' },
  download: { label: 'Download', variant: 'info' },
  delete: { label: 'Delete', variant: 'danger' },
  restore: { label: 'Restore', variant: 'warning' },
  share: { label: 'Share', variant: 'info' },
  rename: { label: 'Rename', variant: 'default' },
};

export function ActivityPage() {
  const { data, isLoading } = useActivity();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Activity</h1>
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-2">
          {(data?.results || []).map((log) => {
            const { label, variant } = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' };
            return (
              <div key={log.id} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
                <Badge variant={variant}>{label}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{log.filename || 'Unknown file'}</p>
                  <p className="text-xs text-gray-500">{log.user_email || 'Anonymous'}</p>
                </div>
                <time className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </time>
              </div>
            );
          })}
          {data?.results.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">No activity yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
