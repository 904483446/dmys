import { describe, expect, it } from 'vitest';

import * as prompting from './index.js';

describe('prompting public API', () => {
  it('does not expose a deterministic fallback report generator', () => {
    expect(prompting).not.toHaveProperty('createDeterministicReport');
  });
});
