import { describe, expect, it } from 'vitest';

import { createWindowOptions } from './window-options';

describe('createWindowOptions', () => {
  it('enforces the renderer security boundary', () => {
    const options = createWindowOptions('C:/build/preload/index.js', false);

    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      preload: 'C:/build/preload/index.js',
      sandbox: true,
      webSecurity: true,
    });
  });
});
