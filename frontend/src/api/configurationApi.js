import { adminApi } from "./adminApi";
import { V2_BASE } from "@/utils/env";

export const configurationApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    configSchemas: build.query({
      query: () => ({
        url: `${V2_BASE}/admin/plugin_config_schemas/administration`,
      }),
      providesTags: ["Configuration"],
    }),

    configValues: build.query({
      query: ({ sectionId }) => ({
        url: `${V2_BASE}/admin/plugin_config_values/administration/${sectionId}`,
      }),
      providesTags: (result, error, { sectionId }) => [
        { type: "Configuration", id: sectionId },
      ],
    }),

    configValuesSave: build.mutation({
      query: ({ sectionId, values }) => ({
        url: `${V2_BASE}/admin/plugin_config_values/administration/${sectionId}`,
        method: "PUT",
        body: { values },
      }),
      invalidatesTags: (result, error, { sectionId }) => [
        { type: "Configuration", id: sectionId },
      ],
    }),

    configSuggestions: build.query({
      query: ({ source, toolkit }) => ({
        url: `${V2_BASE}/admin/plugin_config_suggestions/administration/${source}${toolkit ? `?toolkit=${encodeURIComponent(toolkit)}` : ""}`,
      }),
      providesTags: (result, error, { source, toolkit }) => [
        { type: "Configuration", id: `suggestions-${source}-${toolkit || ""}` },
      ],
    }),

    configRestart: build.mutation({
      query: ({ pylonId, plugins }) => ({
        url: `${V2_BASE}/admin/plugin_config_restart/administration/${pylonId}`,
        method: "POST",
        body: plugins?.length ? { plugins } : {},
      }),
    }),

    runtimeRemote: build.query({
      query: () => ({
        url: `${V2_BASE}/admin/runtime_remote/administration`,
      }),
      providesTags: ["Configuration"],
    }),

    runtimeRemoteConfig: build.query({
      query: ({ pluginId, raw = false }) => ({
        url: `${V2_BASE}/admin/runtime_remote_config/administration/${pluginId}${raw ? "?raw=true" : ""}`,
      }),
    }),

    runtimeRemoteConfigSave: build.mutation({
      query: ({ pluginId, data }) => ({
        url: `${V2_BASE}/admin/runtime_remote_config/administration/${pluginId}`,
        method: "POST",
        body: { data },
      }),
    }),

    runtimePluginCheck: build.mutation({
      query: ({ pluginName }) => ({
        url: `${V2_BASE}/admin/runtime_plugin/administration/${pluginName}`,
      }),
    }),

    runtimePluginUpdate: build.mutation({
      query: ({ pluginName, pylonIds }) => ({
        url: `${V2_BASE}/admin/runtime_plugin/administration/${pluginName}`,
        method: "PUT",
        body: { pylon_ids: pylonIds },
      }),
    }),

    runtimePylonLogs: build.mutation({
      query: ({ pylonId }) => ({
        url: `${V2_BASE}/admin/runtime_pylons/administration`,
        method: "POST",
        body: { pylon_id: pylonId },
      }),
    }),

    maintenance: build.query({
      query: () => ({
        url: `${V2_BASE}/admin/maintenance/administration`,
      }),
      providesTags: ["Maintenance"],
    }),

    maintenanceSave: build.mutation({
      query: (body) => ({
        url: `${V2_BASE}/admin/maintenance/administration`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Maintenance"],
    }),
  }),
});

export const {
  useConfigSchemasQuery,
  useConfigValuesQuery,
  useLazyConfigValuesQuery,
  useConfigValuesSaveMutation,
  useConfigSuggestionsQuery,
  useConfigRestartMutation,
  useRuntimeRemoteQuery,
  useLazyRuntimeRemoteConfigQuery,
  useRuntimeRemoteConfigSaveMutation,
  useRuntimePluginCheckMutation,
  useRuntimePluginUpdateMutation,
  useRuntimePylonLogsMutation,
  useMaintenanceQuery,
  useMaintenanceSaveMutation,
} = configurationApi;
