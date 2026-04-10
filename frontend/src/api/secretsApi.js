import { adminApi } from './adminApi';

export const secretsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    secretList: build.query({
      query: () => ({
        url: '/secrets/secrets/administration/0',
      }),
      providesTags: ['Secrets'],
    }),

    secretReveal: build.query({
      query: ({ name }) => ({
        url: `/secrets/secret/administration/0/${encodeURIComponent(name)}`,
      }),
    }),

    secretCreate: build.mutation({
      query: ({ name, value }) => ({
        url: `/secrets/secret/administration/0/${encodeURIComponent(name)}`,
        method: 'POST',
        body: { secret: value },
      }),
      invalidatesTags: ['Secrets'],
    }),

    secretUpdate: build.mutation({
      query: ({ name, value }) => ({
        url: `/secrets/secret/administration/0/${encodeURIComponent(name)}`,
        method: 'PUT',
        body: { secret: { old_name: name, value } },
      }),
      invalidatesTags: ['Secrets'],
    }),

    secretDelete: build.mutation({
      query: ({ name }) => ({
        url: `/secrets/secret/administration/0/${encodeURIComponent(name)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Secrets'],
    }),
  }),
});

export const {
  useSecretListQuery,
  useLazySecretRevealQuery,
  useSecretCreateMutation,
  useSecretUpdateMutation,
  useSecretDeleteMutation,
} = secretsApi;
