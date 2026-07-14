import { describe, expect, it } from 'vitest';

import { errorCodes } from './index.js';

describe('contracts package', () => {
  it('exports the stable Phase 0 error-code contract', () => {
    expect(errorCodes).toEqual(['INVALID_REQUEST']);
  });
});
