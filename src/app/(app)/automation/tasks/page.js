'use client';
import { useEffect, useState, useCallback } from 'react';
import AutomationService from '@/services/AutomationService';
import { Skel, Badge } from '@/components/ui';
import { fmtDate } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

const SCHEDULE_MAP = {
  interval: { label: 'Interval', color: '#2563eb', bg: '#dbeafe' },
  cron: { label: 'Cron', color: '#7c3aed', bg: '#ede9fe' },
  manual: { label: 'Manual', color: '#6b7280', bg: '#f3f4f6' },
};

const ENABLED_MAP = {
  true: { label: 'Enabled', color: '#16a34a', bg: '#dcfce7' },
  false: { label: 'Disabled', color: '#dc2626', bg: '#fee2e2' },
};

export default function AutomationTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const { showNotification } = useUiStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AutomationService.index();
      if (res?.data) setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      showNotification(e?.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (task) => {
    try {
      await AutomationService.update(task.uuid, { enabled: !task.enabled }, { showLoader: false });
      showNotification(`Task ${task.enabled ? 'disabled' : 'enabled'} successfully.`, 'success');
      load();
    } catch (e) {
      showNotification(e?.message || 'Failed to update task', 'error');
    }
  }, [load, showNotification]);

  const handleRunNow = useCallback(async (task) => {
    try {
      await AutomationService.runNow(task.uuid, { showLoader: false });
      showNotification('Task triggered successfully.', 'success');
      load();
    } catch (e) {
      showNotification(e?.message || 'Failed to run task', 'error');
    }
  }, [load, showNotification]);

  const handleSave = useCallback(async (uuid, data) => {
    try {
      await AutomationService.update(uuid, data, { showLoader: false });
      showNotification('Task updated successfully.', 'success');
      setEditing(null);
      load();
    } catch (e) {
      showNotification(e?.message || 'Failed to update task', 'error');
    }
  }, [load, showNotification]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Automation Tasks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage scheduled background tasks and automation settings</p>
      </div>

      <div className="data-table-wrap">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Interval / Cron</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Created</th>
                <th>Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td><Skel w="w-32" h="h-3.5" /></td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-12" h="h-5" /></td>
                  <td><Skel w="w-16" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td className="text-right"><Skel w="w-24" h="h-7" /></td>
                </tr>
              ))}
              {!loading && tasks.length === 0 && (
                <tr><td colSpan={9} className="text-center py-14 text-gray-400 text-sm">No automation tasks found</td></tr>
              )}
              {!loading && tasks.map((t) => (
                <tr key={t.uuid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
                        {(t.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.uuid?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td><Badge map={ENABLED_MAP} value={String(t.enabled)} /></td>
                  <td><Badge map={SCHEDULE_MAP} value={t.schedule_mode} /></td>
                  <td className="text-sm text-gray-700">
                    {t.schedule_mode === 'interval' ? `${t.interval_minutes} min` : t.cron_expression || '—'}
                  </td>
                  <td className="text-xs text-gray-500">{fmtDate(t.last_run_at)}</td>
                  <td className="text-xs text-gray-500">{fmtDate(t.next_run_at)}</td>
                  <td className="text-xs text-gray-500">{fmtDate(t.created_at ?? t.createdAt)}</td>
                  <td className="text-xs text-gray-500">{fmtDate(t.updated_at ?? t.updatedAt)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRunNow(t)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                        title="Run Now">Run</button>
                      <button onClick={() => setEditing(t)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Edit</button>
                      <button onClick={() => handleToggle(t)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${t.enabled ? 'text-red-700 bg-red-50 hover:bg-red-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}>
                        {t.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal task={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}

function EditModal({ task, onClose, onSave }) {
  const [data, setData] = useState({
    enabled: task.enabled,
    schedule_mode: task.schedule_mode || 'interval',
    interval_minutes: task.interval_minutes || 30,
    timezone: task.timezone || 'Africa/Nairobi',
    cron_expression: task.cron_expression || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Mode</label>
            <select value={data.schedule_mode} onChange={(e) => setData((p) => ({ ...p, schedule_mode: e.target.value }))} className="input w-full text-sm py-2">
              <option value="interval">Interval</option>
              <option value="cron">Cron</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          {data.schedule_mode === 'interval' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interval (minutes)</label>
              <input type="number" min={1} value={data.interval_minutes} onChange={(e) => setData((p) => ({ ...p, interval_minutes: parseInt(e.target.value, 10) }))} className="input w-full text-sm py-2" />
            </div>
          )}
          {data.schedule_mode === 'cron' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label>
              <input type="text" value={data.cron_expression} onChange={(e) => setData((p) => ({ ...p, cron_expression: e.target.value }))} className="input w-full text-sm py-2" placeholder="0 2 * * *" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input type="text" value={data.timezone} onChange={(e) => setData((p) => ({ ...p, timezone: e.target.value }))} className="input w-full text-sm py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="enabled" checked={data.enabled} onChange={(e) => setData((p) => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-orange-600" />
            <label htmlFor="enabled" className="text-sm text-gray-700">Enabled</label>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={() => onSave(task.uuid, data)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>Save</button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
