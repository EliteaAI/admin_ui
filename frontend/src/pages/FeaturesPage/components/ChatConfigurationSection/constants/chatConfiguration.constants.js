export const TRIGGER_FIELDS = [
  {
    key: 'chat_mentions_slash_trigger',
    title: 'Toolkit/Tool Trigger',
    hint: 'Character that opens the toolkit/tool mention dropdown in chat and agent instructions.',
    defaultValue: '/',
  },
  {
    key: 'chat_mentions_skill_trigger',
    title: 'Skill Trigger',
    hint: 'Character that opens the skill mention dropdown in chat and agent instructions.',
    defaultValue: '~',
  },
  {
    key: 'chat_mentions_participant_trigger',
    title: 'Participant Trigger',
    hint: 'Character that opens the participant (agents/pipelines) dropdown in chat.',
    defaultValue: '#',
  },
  {
    key: 'chat_mentions_private_participant_trigger',
    title: 'Private Participant Trigger',
    hint: 'Character that opens the participant dropdown excluding public agents.',
    defaultValue: '&',
  },
  {
    key: 'chat_mentions_user_trigger',
    title: 'User Mention Trigger',
    hint: 'Character that opens the user mention dropdown in chat.',
    defaultValue: '@',
  },
];
