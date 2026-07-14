import { describe, expect, it } from 'vitest';

import { reportSchemaVersion } from './index.js';

describe('prompting package', () => {
  it('exports the initial report schema version', () => {
    expect(reportSchemaVersion).toBe('v1');
  });
});
