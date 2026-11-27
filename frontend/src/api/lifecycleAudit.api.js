import { V2_BASE, VITE_DEV_TOKEN } from '@/helpers/env.helpers';

import { adminApi } from './admin.api';

const BASE_PATH = '/admin/lifecycle_audit/administration';

const lifecycleAuditApi = adminApi.injectEndpoints({
  endpoints: build => ({
    lifecycleAuditList: build.query({
      query: ({ limit = 50, offset = 0, sort_by, sort_order, ...filters } = {}) => ({
        url: BASE_PATH,
        params: {
          limit,
          offset,
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...Object.fromEntries(
            Object.entries(filters).filter(([key, value]) => key !== '_refresh' && value != null),
          ),
        },
      }),
      providesTags: ['LifecycleAudit'],
    }),
  }),
});

// RFC 4180 rows (quoted fields, doubled quotes, CRLF) as arrays of strings
const parseCsv = text => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

// Every matching row, streamed by the backend as CSV (UTC timestamps): fetched directly, not cached by RTK Query
export const fetchLifecycleAuditExport = async params => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  );
  const headers = {};
  if (VITE_DEV_TOKEN) {
    headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;
  }

  const response = await fetch(`${V2_BASE}${BASE_PATH}/export?${query.toString()}`, {
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `Export failed with status ${response.status}.`;
    try {
      const payload = await response.json();
      message = payload?.error ?? payload?.message ?? message;
    } catch {
      // error body is not JSON
    }
    throw new Error(message);
  }

  const [columns = [], ...rows] = parseCsv(await response.text());
  return {
    columns,
    rows: rows.map(values => Object.fromEntries(columns.map((key, i) => [key, values[i] ?? '']))),
  };
};

export const { useLifecycleAuditListQuery } = lifecycleAuditApi;
