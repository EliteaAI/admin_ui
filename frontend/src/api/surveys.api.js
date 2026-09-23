import { adminApi } from './admin.api';

const SURVEY_MODE = 'administration';

const surveysApi = adminApi.injectEndpoints({
  endpoints: build => ({
    surveyList: build.query({
      query: () => ({ url: `social/surveys/${SURVEY_MODE}` }),
      transformResponse: response => response.result ?? [],
      providesTags: ['Surveys'],
    }),

    surveyCreate: build.mutation({
      query: body => ({
        url: `social/surveys/${SURVEY_MODE}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Surveys'],
    }),

    surveyUpdate: build.mutation({
      query: ({ surveyId, ...body }) => ({
        url: `social/survey/${SURVEY_MODE}/${surveyId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Surveys'],
    }),

    surveyDelete: build.mutation({
      query: surveyId => ({
        url: `social/survey/${SURVEY_MODE}/${surveyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Surveys'],
    }),

    surveyAnswers: build.query({
      query: ({ surveyId, dateFrom, dateTo, limit = 1000, offset = 0 }) => ({
        url: `social/survey_answers/${SURVEY_MODE}/${surveyId}`,
        params: {
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          limit,
          offset,
        },
      }),
      transformResponse: response => response.result ?? { total: 0, rows: [] },
    }),
  }),
});

export const {
  useSurveyListQuery,
  useSurveyCreateMutation,
  useSurveyUpdateMutation,
  useSurveyDeleteMutation,
  useLazySurveyAnswersQuery,
} = surveysApi;
