import { describe, expect, it } from 'vitest';

import * as prompting from './index.js';

describe('prompting exports', () => {
  it('does not expose obsolete task-list acceptance templates', () => {
    expect('acceptancePlanSchema' in prompting).toBe(true);
    expect('testIntentSchema' in prompting).toBe(false);
    expect('testIntentTemplateSchema' in prompting).toBe(false);
  });
});
