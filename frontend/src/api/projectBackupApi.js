import { adminApi } from "./adminApi";
import { V2_BASE, VITE_DEV_TOKEN } from "@/utils/env";

const FILENAME_RE = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

const parseFilename = (header, fallback) => {
  const match = header ? FILENAME_RE.exec(header) : null;
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

// The backup endpoint streams SQL, so it is fetched directly instead of through
// RTK Query (which would try to parse and cache the whole dump).
export const downloadProjectBackup = async ({
  projectId,
  mode = "safe",
  excludeTables = "",
}) => {
  const params = new URLSearchParams({ mode });
  if (excludeTables.trim()) {
    params.set("exclude_tables", excludeTables.trim());
  }

  const headers = {};
  if (VITE_DEV_TOKEN) {
    headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;
  }

  const response = await fetch(
    `${V2_BASE}/admin/project_backup/administration/${projectId}?${params.toString()}`,
    { credentials: "include", headers },
  );

  if (!response.ok) {
    let message = `Backup failed with status ${response.status}.`;
    try {
      const payload = await response.json();
      message = payload?.error ?? payload?.message ?? message;
    } catch {
      // error body is not JSON
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = parseFilename(
    response.headers.get("Content-Disposition"),
    `elitea-backup-${projectId}-${mode}.sql`,
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, size: blob.size };
};

export const projectBackupApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    projectRestore: build.mutation({
      query: ({
        projectId,
        file,
        mode = "safe",
        tables = "",
        includeParents = false,
        truncate = false,
        dryRun = true,
        allowProjectMismatch = false,
      }) => {
        const body = new FormData();
        body.append("file", file);
        body.append("mode", mode);
        if (tables.trim()) {
          body.append("tables", tables.trim());
        }
        body.append("include_parents", includeParents ? "true" : "false");
        body.append("truncate", truncate ? "true" : "false");
        body.append("dry_run", dryRun ? "true" : "false");
        body.append(
          "allow_project_mismatch",
          allowProjectMismatch ? "true" : "false",
        );
        return {
          url: `${V2_BASE}/admin/project_restore/administration/${projectId}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Projects"],
    }),
  }),
});

export const { useProjectRestoreMutation } = projectBackupApi;
