import { describe, expect, it } from 'vitest';

import {
  getRowActions,
  secretFields,
  typeProperties,
} from '@/pages/GovernancePage/components/CredentialsTab/helpers/credentials.helpers';
import { parseValidUntil } from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';

import { makeReference, makeTypes } from './credentialsTest.helpers';

describe('secretFields', () => {
  it('names the password fields of a type, nested objects joined with a dot', () => {
    const properties = typeProperties(makeTypes(), 'github');

    expect(secretFields(properties)).toEqual([
      { path: 'access_token', label: 'Access token' },
      { path: 'app.private_key', label: 'app.private_key' },
    ]);
  });

  it('writes a map of passwords as <name>.* and an array of passwords the same way', () => {
    expect(
      secretFields({
        headers: { type: 'object', additionalProperties: { type: 'string', format: 'password' } },
        tokens: { type: 'array', items: { type: 'string', format: 'password' } },
        plain: { type: 'object', additionalProperties: { type: 'string' } },
      }).map(field => field.path),
    ).toEqual(['headers.*', 'tokens.*']);
  });

  it('stops at the same depth as the backend', () => {
    const deep = { password: { format: 'password' } };
    const nest = (inner, levels) =>
      levels === 0 ? inner : { next: { type: 'object', properties: nest(inner, levels - 1) } };

    expect(secretFields(nest(deep, 4)).map(field => field.path)).toEqual(['next.next.next.next.password']);
    expect(secretFields(nest(deep, 5))).toEqual([]);
  });

  it('finds nothing for an unknown type or a schema without properties', () => {
    expect(secretFields(typeProperties(makeTypes(), 'nope'))).toEqual([]);
    expect(secretFields(undefined)).toEqual([]);
    expect(typeProperties(undefined, 'github')).toBeUndefined();
  });
});

describe('getRowActions', () => {
  it('labels a second import "Import again"', () => {
    const actions = getRowActions(makeReference({ state: 'validated', approved_by: null }), {
      canManage: true,
      canProbe: false,
      canApprove: false,
    });

    expect(actions.map(item => item.label)).toEqual(['Import again', 'Retire']);
  });
});

describe('parseValidUntil', () => {
  const NOW = Date.parse('2026-10-21T10:00:00Z');

  it('treats an empty field as no end date', () => {
    expect(parseValidUntil('', NOW)).toEqual({ value: undefined });
  });

  it('refuses the past, a date beyond 365 days and text that is no date', () => {
    expect(parseValidUntil('2026-10-20T10:00', NOW).problem).toMatch(/future/);
    expect(parseValidUntil('2028-01-01T10:00', NOW).problem).toMatch(/365 days/);
    expect(parseValidUntil('not a date', NOW).problem).toMatch(/valid date/);
  });

  it('gives an ISO time in UTC with an explicit offset', () => {
    expect(parseValidUntil('2026-11-21T10:00', NOW).value).toMatch(/^2026-11-2\dT\d\d:\d\d:00\+00:00$/);
  });
});
