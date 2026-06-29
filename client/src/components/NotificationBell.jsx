import { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useApi, apiPost, apiDelete } from '../hooks/useApi.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, refetch } = useApi('/api/notifications', { interval: 30000 });
  const { data: countData, refetch: refetchCount } = useApi('/api/notifications/unread-count', { interval: 30000 });

  const unreadCount = countData?.count || 0;

  const markRead = async (id) => {
    await apiPost(`/api/notifications/${id}/read`);
    refetch();
    refetchCount();
  };

  const markAllRead = async () => {
    await apiPost('/api/notifications/read-all');
    refetch();
    refetchCount();
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    await apiDelete(`/api/notifications/${id}`);
    refetch();
    refetchCount();
  };

  const generateReport = async () => {
    await apiPost('/api/notifications/generate-report');
    refetch();
    refetchCount();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="font-semibold text-sm">알림</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateReport}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-800"
                >
                  리포트 생성
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800"
                  >
                    <Check size={12} /> 모두 읽음
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications?.length ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  알림이 없습니다
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                      !n.is_read ? 'bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-wrap line-clamp-4">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <button
                      onClick={(e) => remove(n.id, e)}
                      className="text-gray-600 hover:text-gray-300 flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
