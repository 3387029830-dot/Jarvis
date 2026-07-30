import { describe, expect, it } from 'vitest';

import { createPresenceViewModel, parsePresenceVariant } from './presence-data';

describe('Presence view-model variants', () => {
  it.each([
    ['empty', 0, 0, 0],
    ['single', 1, 0, 0],
    ['populated', 3, 1, 1],
  ] as const)(
    'builds the %s state without leaking view concerns',
    (variant, active, open, recent) => {
      const model = createPresenceViewModel(variant);

      expect(model.explorations).toHaveLength(active);
      expect(model.unresolvedQuestions).toHaveLength(open);
      expect(model.cognitionCandidates).toHaveLength(recent);
    },
  );

  it('falls back to populated for unknown development variants', () => {
    expect(parsePresenceVariant('unexpected')).toBe('populated');
    expect(parsePresenceVariant(null)).toBe('populated');
  });
});
