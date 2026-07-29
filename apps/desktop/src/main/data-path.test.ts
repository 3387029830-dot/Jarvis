import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveUserDataPath } from './data-path';

describe('resolveUserDataPath', () => {
  it('keeps development data under the operating-system temporary directory', () => {
    const temporaryDirectory = path.resolve('C:/temp');
    const result = resolveUserDataPath({
      isPackaged: false,
      overridePath: undefined,
      temporaryDirectory,
    });

    expect(result).toBe(path.join(temporaryDirectory, 'jarvis-cognition-development'));
  });

  it('leaves the normal Electron location unchanged for packaged builds', () => {
    expect(
      resolveUserDataPath({
        isPackaged: true,
        overridePath: undefined,
        temporaryDirectory: path.resolve('C:/temp'),
      }),
    ).toBeUndefined();
  });

  it('supports an explicit disposable path for integration runs', () => {
    expect(
      resolveUserDataPath({
        isPackaged: false,
        overridePath: './disposable-data',
        temporaryDirectory: path.resolve('C:/temp'),
      }),
    ).toBe(path.resolve('./disposable-data'));
  });
});
