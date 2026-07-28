import { adminApi } from "./adminApi";

const SURVEY_MODE = "administration";

export const surveysApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    surveysList: build.query({
      query: () => ({ url: `social/surveys/${SURVEY_MODE}` }),
      transformResponse: (response) => response.result ?? [],
      providesTags: ["Surveys"],
    }),

    surveyGet: build.query({
      query: (surveyId) => ({
        url: `social/survey/${SURVEY_MODE}/${surveyId}`,
      }),
      transformResponse: (response) => response.result ?? null,
      providesTags: (result, error, surveyId) => [
        { type: "Surveys", id: surveyId },
      ],
    }),

    surveyCreate: build.mutation({
      query: (body) => ({
        url: `social/surveys/${SURVEY_MODE}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),

    surveyUpdate: build.mutation({
      query: ({ surveyId, ...body }) => ({
        url: `social/survey/${SURVEY_MODE}/${surveyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),

    surveyDelete: build.mutation({
      query: (surveyId) => ({
        url: `social/survey/${SURVEY_MODE}/${surveyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Surveys"],
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
      transformResponse: (response) =>
        response.result ?? { total: 0, rows: [] },
    }),
  }),
});

export const {
  useSurveysListQuery,
  useSurveyGetQuery,
  useSurveyCreateMutation,
  useSurveyUpdateMutation,
  useSurveyDeleteMutation,
  useLazySurveyAnswersQuery,
} = surveysApi;
