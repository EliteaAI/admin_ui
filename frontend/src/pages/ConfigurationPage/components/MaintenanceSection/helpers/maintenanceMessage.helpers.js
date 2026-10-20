import DOMPurify from 'dompurify';
import { marked } from 'marked';

import {
  findClosingBracket,
  parseJsxValues,
} from '@/pages/ConfigurationPage/components/MaintenanceSection/helpers/jsxExpression.helpers';

const DEFAULT_MAINTENANCE_MESSAGE = `While we get things ready behind the scenes, why not explore some helpful NEW resources?

- Discover our [Tips & Features](https://elitea.ai/docs/home/onboarding-tips/) to get the most out of Elitea
- Browse our guides in [Documentation.](https://elitea.ai/docs/)`;

// The message lives in the children of the MaintenaceTips component of the EliteaUI splash build:
// `de.jsxs(My, { sx: r.tipsContainer, children: [ … ] })`. Works for minified and formatted builds.
const TIPS_CHILDREN_RE =
  /([\w$]+)\s*\.\s*jsxs?\s*\(\s*[\w$]+\s*,\s*\{\s*sx\s*:\s*[\w$]+\s*\.\s*tipsContainer\s*,\s*children\s*:\s*\[/;

// A previously saved message: the Markdown source is kept base64-encoded in the start comment so it can be
// read back exactly. Base64 never contains "*/", so it cannot terminate the comment.
const MARKER_START = '/*ELITEA_MAINT_MSG_START:';
const MARKER_END = '/*ELITEA_MAINT_MSG_END*/';
const MARKER_RE = /\/\*ELITEA_MAINT_MSG_START:([A-Za-z0-9+/=]*)\*\//;

// Mirrors the original tips styles (text, list and link) for the rendered Markdown
const MESSAGE_SX =
  '({palette:p})=>({wordBreak:"break-word","& p":{margin:0},"& p + p":{marginTop:"0.5rem"},' +
  '"& ul, & ol":{margin:0,paddingLeft:"1.25rem"},"& ul":{listStyleType:"disc"},' +
  '"& a":{color:p.text.link,textDecoration:"underline",cursor:"pointer"},' +
  '"& a:visited":{color:p.icon?.fill?.magicAssistant}})';

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'code'],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  RETURN_DOM_FRAGMENT: true,
};

const encodeBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeBase64 = encoded => {
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(encoded), char => char.charCodeAt(0)));
  } catch {
    return '';
  }
};

// JS string literal that is safe inside an inline <script>: no "</script>" and no "*/" marker clash
const toScriptStringLiteral = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\//g, '\\/');

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Markdown → sanitized HTML injected into the splash template.
 * Only basic formatting and http(s)/mailto links survive; links always open in a new tab.
 */
const renderMaintenanceMarkdown = markdown => {
  const rawHtml = marked.parse(markdown || '', { gfm: true, breaks: true, async: false });
  const fragment = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);
  fragment.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
};

/** Value of a `NAME = "…"` constant in the template (link targets are hoisted into such constants). */
const resolveConstant = (source, name) => {
  const match = source.match(
    new RegExp(`(?:^|[^\\w$.])${escapeRegExp(name)}\\s*=\\s*(["'])((?:\\\\.|(?!\\1).)*)\\1`),
  );
  return match ? match[2] : '';
};

/** Compiled JSX children → Markdown: text, links, lists and paragraphs. */
const jsxToMarkdown = (nodes, source) => {
  const inline = node => {
    if (node.type === 'string') return node.value;
    if (node.type === 'array') return node.items.map(inline).join('');
    if (node.type !== 'element') return '';
    const text = inline(node.props.children || { type: 'array', items: [] });
    if (node.props.href) {
      const href = node.props.href;
      const url =
        href.type === 'string' ? href.value : href.type === 'ref' ? resolveConstant(source, href.name) : '';
      return url ? `[${text}](${url})` : text;
    }
    return text;
  };

  const block = node => {
    const component = node.type === 'element' && node.props.component?.value;
    if (component === 'ul' || component === 'ol') {
      const children = node.props.children;
      const items = children?.type === 'array' ? children.items : children ? [children] : [];
      return items
        .map((item, index) => `${component === 'ol' ? `${index + 1}.` : '-'} ${inline(item).trim()}`)
        .join('\n');
    }
    return inline(node).trim();
  };

  return nodes.map(block).filter(Boolean).join('\n\n');
};

/** Locates the tips `children:[…]` array: { start, end } of its content, plus identifiers to reuse. */
const findTipsChildren = source => {
  const match = TIPS_CHILDREN_RE.exec(source);
  if (!match) return null;
  const open = match.index + match[0].length - 1;
  const close = findClosingBracket(source, open);
  if (close === -1) return null;
  const content = source.slice(open + 1, close);
  const typography = content.match(
    /[\w$]+\s*\.\s*jsxs?\s*\(\s*([\w$]+)\s*,\s*\{\s*component\s*:\s*["']div["']/,
  );
  return { start: open + 1, end: close, content, jsxIdent: match[1], componentIdent: typography?.[1] };
};

/**
 * Reads the configurable message from a splash template.
 * `supported` is false when the template has no recognizable message panel.
 */
export const parseMaintenanceTemplate = template => {
  const source = template || '';
  const tips = findTipsChildren(source);
  if (!tips || !tips.componentIdent) return { supported: false, markdown: '' };

  const marker = tips.content.match(MARKER_RE);
  if (marker) return { supported: true, markdown: decodeBase64(marker[1]) };

  try {
    return { supported: true, markdown: jsxToMarkdown(parseJsxValues(tips.content), source) };
  } catch (err) {
    console.error('Failed to read the maintenance message from the splash template', err);
    return { supported: true, markdown: DEFAULT_MAINTENANCE_MESSAGE };
  }
};

/**
 * Returns the template with the message panel content replaced by the rendered Markdown, or null when
 * the panel is not found. Everything else in the template (logo, animation, title, layout) is untouched.
 */
export const applyMaintenanceMessage = (template, markdown) => {
  const source = template || '';
  const tips = findTipsChildren(source);
  if (!tips || !tips.componentIdent) return null;

  const message = markdown?.trim() ? markdown : DEFAULT_MAINTENANCE_MESSAGE;
  const html = toScriptStringLiteral(renderMaintenanceMarkdown(message));
  const region =
    `${MARKER_START}${encodeBase64(message)}*/` +
    `${tips.jsxIdent}.jsx(${tips.componentIdent},{component:"div",variant:"bodyMedium",color:"text.secondary",` +
    `sx:${MESSAGE_SX},dangerouslySetInnerHTML:{__html:${html}}})` +
    MARKER_END;

  return source.slice(0, tips.start) + region + source.slice(tips.end);
};
