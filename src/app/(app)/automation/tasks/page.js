'use client';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import AutomationService from '@/services/AutomationService';
import { Skel, Badge } from '@/components/ui';
import { fmtDate, fmtDateTime } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

/**
 * NOTE: Backend supports "interval", "daily", and "manual" for schedule_mode.
 * "cron" is NOT supported — do not add it to the edit modal.
 */
const SCHEDULE_MAP = {
  interval: { label: 'Interval', color: '#2563eb', bg: '#dbeafe' },
  daily: { label: 'Daily', color: '#0891b2', bg: '#cffafe' },
  manual: { label: 'Manual', color: '#6b7280', bg: '#f3f4f6' },
};

const ENABLED_MAP = {
  true: { label: 'Enabled', color: '#16a34a', bg: '#dcfce7' },
  false: { label: 'Disabled', color: '#dc2626', bg: '#fee2e2' },
};

const STATUS_MAP = {
  success: { label: 'Success', color: '#16a34a', bg: '#dcfce7' },
  failed: { label: 'Failed', color: '#dc2626', bg: '#fee2e2' },
  pending: { label: 'Pending', color: '#ca8a04', bg: '#fef9c3' },
  running: { label: 'Running', color: '#2563eb', bg: '#dbeafe' },
};

/* ─── Schedule value renderer ─── */
function ScheduleValue({ mode, interval, runAt }) {
  if (mode === 'interval') return <span className="text-sm text-gray-700">{interval ?? '—'} min</span>;
  if (mode === 'daily') return <span className="text-sm text-gray-700">{runAt ?? '—'}</span>;
  return <span className="text-sm text-gray-400">—</span>;
}

/* ─── Memoised table row ─── */
const TaskRow = memo(function TaskRow({ task, onToggle, onRun, onEdit }) {
  const supportsRunNow = task.meta?.supports_run_now ?? true;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}
          >
            {(task.name || 'T').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{task.name}</p>
            {task.description && (
              <p className="text-xs text-gray-400 truncate max-w-[220px]" title={task.description}>
                {task.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td><Badge map={ENABLED_MAP} value={String(task.enabled)} /></td>
      <td><Badge map={SCHEDULE_MAP} value={task.schedule_mode} /></td>
      <td>
        <ScheduleValue
          mode={task.schedule_mode}
          interval={task.interval_minutes}
          runAt={task.run_at_time}
        />
      </td>
      <td className="text-xs text-gray-500">{fmtDateTime(task.last_run_at)}</td>
      <td className="text-xs text-gray-500">{fmtDateTime(task.next_run_at)}</td>
      <td>
        <Badge map={STATUS_MAP} value={task.last_status || 'pending'} />
        {task.last_message && (
          <p className="text-[11px] text-gray-400 mt-1 max-w-[180px] truncate" title={task.last_message}>
            {task.last_message}
          </p>
        )}
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-2">
          {supportsRunNow && (
            <button
              onClick={() => onRun(task)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              title="Run Now"
            >
              Run
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onToggle(task)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${task.enabled
              ? 'text-red-700 bg-red-50 hover:bg-red-100'
              : 'text-green-700 bg-green-50 hover:bg-green-100'
              }`}
          >
            {task.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ─── Main page ─── */
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

  /* Memoised list so rows only re-render when tasks actually change */
  const taskList = useMemo(() => tasks, [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Automation Tasks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage scheduled background tasks and automation settings</p>
      </div>

      <div className="data-table-wrap">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Value</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Last Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td><Skel w="w-40" h="h-3.5" /></td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-12" h="h-5" /></td>
                  <td><Skel w="w-16" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-5" /></td>
                  <td className="text-right"><Skel w="w-24" h="h-7" /></td>
                </tr>
              ))}
              {!loading && taskList.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-gray-400 text-sm">
                    No automation tasks found
                  </td>
                </tr>
              )}
              {!loading && taskList.map((t) => (
                <TaskRow
                  key={t.uuid}
                  task={t}
                  onToggle={handleToggle}
                  onRun={handleRunNow}
                  onEdit={setEditing}
                />
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

/* ─── Edit Modal ─── */
function EditModal({ task, onClose, onSave }) {
  const [data, setData] = useState(() => {
    const schedule = task.schedule_mode || 'interval';
    return {
      enabled: task.enabled ?? true,
      schedule_mode: schedule,
      interval_minutes: task.interval_minutes || 15,
      run_at_time: task.run_at_time || '09:00',
      timezone: task.timezone || 'Africa/Nairobi',
    };
  });

  const mode = data.schedule_mode;

  const handleSaveClick = useCallback(() => {
    const payload = {
      enabled: data.enabled,
      schedule_mode: mode,
      timezone: data.timezone,
    };
    if (mode === 'interval') {
      payload.interval_minutes = data.interval_minutes;
      payload.run_at_time = null;
    }
    if (mode === 'daily') {
      payload.run_at_time = data.run_at_time;
      payload.interval_minutes = null;
    }
    if (mode === 'manual') {
      payload.interval_minutes = null;
      payload.run_at_time = null;
    }
    onSave(task.uuid, payload);
  }, [data, mode, task.uuid, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Task</h3>
            <p className="text-xs text-gray-400 mt-0.5">{task.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Enabled */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
            <input
              type="checkbox"
              id="enabled"
              checked={data.enabled}
              onChange={(e) => setData((p) => ({ ...p, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Task is {data.enabled ? 'enabled' : 'disabled'}
            </label>
          </div>

          {/* Schedule Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'interval', label: 'Interval' },
                { value: 'daily', label: 'Daily' },
                { value: 'manual', label: 'Manual' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData((p) => ({ ...p, schedule_mode: opt.value }))}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${mode === opt.value
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          {mode === 'interval' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Interval (minutes)</label>
              <input
                type="number"
                min={1}
                value={data.interval_minutes}
                onChange={(e) => setData((p) => ({ ...p, interval_minutes: parseInt(e.target.value, 10) || 1 }))}
                className="input w-full text-sm py-2"
              />
              <p className="text-[11px] text-gray-400 mt-1">Runs every N minutes. Minimum 1 minute.</p>
            </div>
          )}

          {/* Daily time */}
          {mode === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Run At Time</label>
              <input
                type="time"
                value={data.run_at_time}
                onChange={(e) => setData((p) => ({ ...p, run_at_time: e.target.value }))}
                className="input w-full text-sm py-2"
              />
              <p className="text-[11px] text-gray-400 mt-1">Daily run time in 24-hour format.</p>
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <input
              type="text"
              value={data.timezone}
              onChange={(e) => setData((p) => ({ ...p, timezone: e.target.value }))}
              className="input w-full text-sm py-2"
            />
            <p className="text-[11px] text-gray-400 mt-1">Example: Africa/Nairobi</p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSaveClick}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
