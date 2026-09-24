import { memo, useMemo } from 'react';

import AlternateEmailIcon from '@mui/icons-material/AlternateEmailOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ModelIcon } from '@/components/Icons';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import AutoRoutingSettings from './components/AutoRoutingSettings';
import ChatMentions from './components/ChatMentions';
import VoiceFeatures from './components/VoiceFeatures';
import { TRIGGER_FIELDS } from './constants/chatConfiguration.constants';

// Fixed toggle cards, not schema-driven: "Make Auto available on this platform" and
// "Enable Auto by default for projects"
const AUTO_ROUTING_SETTINGS_COUNT = 2;
// Fixed toggle cards, not schema-driven: "Voice Features Enabled" and "Temporarily Disable Voice Features"
const VOICE_FEATURES_SETTINGS_COUNT = 2;

const ChatConfigurationSection = memo(props => {
  const { voiceDraft, mentionsDraft, guardrailsDraft, guardrailsFields, initialBlock } = props;

  const styles = chatConfigurationSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  const midturnFields = useMemo(
    () => guardrailsFields.filter(f => f.path?.startsWith('midturn_injection_guardrail.')),
    [guardrailsFields],
  );
  const nextInputFields = useMemo(
    () => guardrailsFields.filter(f => f.path?.startsWith('next_input_suggestion_guardrail.')),
    [guardrailsFields],
  );

  const blocks = useMemo(
    () => [
      {
        id: 'auto_routing',
        title: 'Auto Model Selection',
        icon: ModelIcon,
        count: AUTO_ROUTING_SETTINGS_COUNT,
        content: <AutoRoutingSettings />,
      },
      {
        id: 'voice_features',
        title: 'Voice Features',
        icon: RecordVoiceOverOutlinedIcon,
        count: VOICE_FEATURES_SETTINGS_COUNT,
        content: (
          <VoiceFeatures
            values={voiceDraft.values}
            onChange={voiceDraft.onChange}
          />
        ),
      },
      {
        id: 'chat_mentions',
        title: 'Chat Mentions',
        icon: AlternateEmailIcon,
        count: TRIGGER_FIELDS.length,
        content: (
          <ChatMentions
            values={mentionsDraft.values}
            onChange={mentionsDraft.onChange}
          />
        ),
      },
      {
        id: 'midturn_injection',
        title: 'Mid-turn Input',
        icon: ForumOutlinedIcon,
        count: midturnFields.length,
        content: (
          <GuardrailsSection
            fields={midturnFields}
            values={guardrailsDraft.values}
            onChange={guardrailsDraft.onChange}
          />
        ),
      },
      {
        id: 'next_input_suggestion',
        title: 'Next-input Suggestions',
        icon: LightbulbOutlinedIcon,
        count: nextInputFields.length,
        content: (
          <GuardrailsSection
            fields={nextInputFields}
            values={guardrailsDraft.values}
            onChange={guardrailsDraft.onChange}
          />
        ),
      },
    ],
    [voiceDraft, mentionsDraft, guardrailsDraft, midturnFields, nextInputFields],
  );

  return (
    <Box sx={styles.root}>
      {blocks.map(block => (
        <CollapsibleSection
          key={block.id}
          icon={block.icon}
          title={block.title}
          count={block.count}
          expanded={!!expanded[block.id]}
          sectionId={block.id}
          onToggle={toggle}
          keepMounted
        >
          {block.content}
        </CollapsibleSection>
      ))}
    </Box>
  );
});

ChatConfigurationSection.displayName = 'ChatConfigurationSection';

/** @type {MuiSx} */
const chatConfigurationSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default ChatConfigurationSection;
