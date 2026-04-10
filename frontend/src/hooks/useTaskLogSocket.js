import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useLazyTaskLogsQuery } from '@/api/tasksApi';

/**
 * Custom hook for streaming task logs.
 *
 * Uses a dual strategy:
 * - REST API to fetch cached logs (immediate, works for finished tasks)
 * - Socket.IO for live streaming (real-time updates for running tasks)
 * - Falls back to REST polling if Socket.IO fails to connect
 *
 * @param {string|null} taskId - The task ID to subscribe to
 * @param {boolean} enabled - Whether to connect
 * @returns {{ logs: string[], connected: boolean, clearLogs: () => void }}
 */
export function useTaskLogSocket(taskId, enabled) {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const socketConnectedRef = useRef(false);
  const [fetchLogs] = useLazyTaskLogsQuery();

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // REST polling for logs (always works, even for finished tasks)
  useEffect(() => {
    if (!enabled || !taskId) {
      return;
    }

    let cancelled = false;

    // Immediately fetch cached logs
    const doFetch = () => {
      fetchLogs(taskId)
        .unwrap()
        .then((lines) => {
          if (!cancelled) {
            setLogs(lines);
          }
        })
        .catch(() => {});
    };

    doFetch();

    // Poll every 2 seconds for updated logs
    const interval = setInterval(doFetch, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, enabled, fetchLogs]);

  // Socket.IO for real-time streaming (supplements REST polling)
  useEffect(() => {
    if (!enabled || !taskId) {
      return;
    }

    let cancelled = false;
    socketConnectedRef.current = false;

    // eslint-disable-next-line no-console
    console.log('[TaskLogs] Connecting Socket.IO for task:', taskId);

    // Connect to the default namespace at same origin
    const socket = io({
      path: '/socket.io/',
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[TaskLogs] Socket.IO connected, subscribing to task:', taskId);
      if (cancelled) return;
      socketConnectedRef.current = true;
      setConnected(true);

      socket.emit('task_logs_subscribe', {
        tasknode_task: `id:${taskId}`,
      });
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('[TaskLogs] Socket.IO disconnected');
      if (cancelled) return;
      socketConnectedRef.current = false;
      setConnected(false);
    });

    socket.on('log_data', (data) => {
      if (cancelled) return;
      // eslint-disable-next-line no-console
      console.log('[TaskLogs] Received log_data:', data?.length, 'records');
      if (Array.isArray(data)) {
        const newLines = data.map((entry) =>
          typeof entry === 'string' ? entry : entry.line || JSON.stringify(entry),
        );
        // Replace logs entirely — Socket.IO subscribe sends full cache + new entries
        setLogs((prev) => {
          // Merge: keep lines that aren't in the new batch, append new
          const existingSet = new Set(prev);
          const toAdd = newLines.filter((l) => !existingSet.has(l));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      }
    });

    socket.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[TaskLogs] Socket.IO connect_error:', err?.message);
      if (cancelled) return;
      socketConnectedRef.current = false;
      setConnected(false);
    });

    return () => {
      cancelled = true;
      // eslint-disable-next-line no-console
      console.log('[TaskLogs] Cleaning up Socket.IO for task:', taskId);

      if (socket.connected) {
        socket.emit('task_logs_unsubscribe', {
          tasknode_task: `id:${taskId}`,
        });
      }
      socket.disconnect();
      socketRef.current = null;
      socketConnectedRef.current = false;
      setConnected(false);
    };
  }, [taskId, enabled]);

  return { logs, connected, clearLogs };
}
