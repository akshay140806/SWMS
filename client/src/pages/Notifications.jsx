import { useEffect, useState } from 'react';
import api from '../lib/api';
import en from '../content/en';
import { dt } from '../lib/format';
import { Empty, PageHeader, Skeleton } from '../components/ui';
import { getSocket } from '../lib/socket';

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState(null);

  async function load() {
    const { data } = await api.get(`/notifications?tab=${tab}`);
    setItems(data.items);
  }
  useEffect(() => {
    load();
    const s = getSocket();
    s.on('notification', load);
    return () => s.off('notification', load);
  }, [tab]);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={en.notif.title}
        action={
          <div className="flex gap-2">
            <button onClick={() => api.post('/notifications/read-all').then(load)} className="text-xs font-bold border rounded-xl px-3 py-2">{en.notif.markAll}</button>
            <button onClick={() => api.delete('/notifications').then(load)} className="text-xs font-bold border rounded-xl px-3 py-2 text-red-600">{en.notif.clear}</button>
          </div>
        }
      />
      <div className="flex gap-1 border-b mb-4">
        {en.notif.tabs.map((t) => {
          const key = t.toLowerCase();
          return (
            <button key={t} onClick={() => setTab(key)} data-testid={`notif-tab-${key}`}
              className={`text-sm font-semibold px-4 py-2 border-b-2 -mb-px ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>{t}</button>
          );
        })}
      </div>
      {!items ? <Skeleton rows={5} /> : items.length === 0 ? (
        <Empty title={en.notif.empty} text="" />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id} data-testid="notification-item"
              className={`bg-white dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm flex gap-3 ${n.read ? 'opacity-70' : 'border-l-4 border-l-blue-600'}`}>
              <div className="flex-1">
                <p>{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{dt(n.createdAt)} · {n.kind}</p>
              </div>
              {!n.read && <button onClick={() => api.post(`/notifications/${n._id}/read`).then(load)} className="text-xs text-blue-600 font-semibold self-start">✓</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
