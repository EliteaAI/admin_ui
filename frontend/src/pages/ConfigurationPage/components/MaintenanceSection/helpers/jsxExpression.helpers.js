// Minimal reader for the compiled JSX of the splash template (`de.jsxs(Ro,{component:"li",children:[…]})`).
// Handles both minified and pretty-printed builds: whitespace and comments between tokens are ignored.

const PUNCTUATION = '{}[](),:.!=;';

// Index just past the closing quote, or -1 when the string is unterminated
const skipString = (source, start) => {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length && source[index] !== quote) {
    index += source[index] === '\\' ? 2 : 1;
  }
  return index < source.length ? index + 1 : -1;
};

const readString = (source, start) => {
  const end = skipString(source, start);
  if (end === -1) throw new Error('Unterminated string');
  const quote = source[start];
  const raw = source.slice(start + 1, end - 1);
  const escaped = quote === '"' ? raw : raw.replace(/\\'/g, "'").replace(/"/g, '\\"');
  return { value: JSON.parse(`"${escaped}"`), end };
};

const tokenize = source => {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
    } else if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      if (end === -1) throw new Error('Unterminated comment');
      index = end + 2;
    } else if (char === '"' || char === "'" || char === '`') {
      const { value, end } = readString(source, index);
      tokens.push({ type: 'string', value });
      index = end;
    } else if (/[\w$]/.test(char)) {
      const match = source.slice(index).match(/^[\w$]+/);
      tokens.push({ type: 'word', value: match[0] });
      index += match[0].length;
    } else if (PUNCTUATION.includes(char)) {
      tokens.push({ type: 'punct', value: char });
      index += 1;
    } else {
      throw new Error(`Unexpected character "${char}"`);
    }
  }
  return tokens;
};

const createParser = tokens => {
  let position = 0;

  const peek = () => tokens[position];
  const isPunct = value => peek()?.type === 'punct' && peek().value === value;
  const expect = value => {
    if (!isPunct(value)) throw new Error(`Expected "${value}"`);
    position += 1;
  };

  const parseList = (close, parseItem) => {
    const items = [];
    while (!isPunct(close)) {
      items.push(parseItem());
      if (!isPunct(close)) expect(',');
    }
    expect(close);
    return items;
  };

  const parseObject = () => {
    const entries = parseList('}', () => {
      const key = tokens[position];
      if (!key || key.type === 'punct') throw new Error('Expected object key');
      position += 1;
      expect(':');
      return [String(key.value), parseValue()];
    });
    return { type: 'object', props: Object.fromEntries(entries) };
  };

  const parseReference = () => {
    const path = [tokens[position].value];
    position += 1;
    while (isPunct('.')) {
      position += 1;
      path.push(tokens[position].value);
      position += 1;
    }
    if (!isPunct('(')) return { type: 'ref', name: path.join('.') };
    position += 1;
    const args = parseList(')', parseValue);
    const callee = path[path.length - 1];
    if ((callee === 'jsx' || callee === 'jsxs') && args.length >= 2) {
      return { type: 'element', component: args[0], props: args[1].props || {} };
    }
    return { type: 'call' };
  };

  // value := string | array | object | !value | reference | call
  const parseValue = () => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === 'string') {
      position += 1;
      return { type: 'string', value: token.value };
    }
    if (isPunct('[')) {
      position += 1;
      return { type: 'array', items: parseList(']', parseValue) };
    }
    if (isPunct('{')) {
      position += 1;
      return parseObject();
    }
    if (isPunct('!')) {
      position += 1;
      parseValue();
      return { type: 'other' };
    }
    if (token.type === 'word') return parseReference();
    throw new Error(`Unexpected token "${token.value}"`);
  };

  return { parseValue, isDone: () => position >= tokens.length };
};

/** Parses the content of a `children:[…]` array into a list of JSX values. */
export const parseJsxValues = source => {
  const parser = createParser(tokenize(`[${source}]`));
  const result = parser.parseValue();
  if (!parser.isDone()) throw new Error('Unexpected trailing tokens');
  return result.items;
};

/**
 * Index of the bracket closing the one at `openIndex`, skipping string contents. Strings are skipped, not
 * decoded, so JS-only escapes (`\xA0`) or multiline template literals in the build cannot make it throw.
 */
export const findClosingBracket = (source, openIndex) => {
  const pairs = { '[': ']', '{': '}', '(': ')' };
  const stack = [];
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === '"' || char === "'" || char === '`') {
      index = skipString(source, index);
      if (index === -1) return -1;
      continue;
    }
    if (pairs[char]) {
      stack.push(pairs[char]);
    } else if (char === ']' || char === '}' || char === ')') {
      if (stack.pop() !== char) return -1;
      if (!stack.length) return index;
    }
    index += 1;
  }
  return -1;
};
