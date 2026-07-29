import path from 'node:path';

const DEVELOPMENT_DATA_DIRECTORY = 'jarvis-cognition-development';

export function resolveUserDataPath(options: {
  readonly isPackaged: boolean;
  readonly overridePath: string | undefined;
  readonly temporaryDirectory: string;
}): string | undefined {
  if (options.overridePath) {
    return path.resolve(options.overridePath);
  }

  if (options.isPackaged) {
    return undefined;
  }

  return path.join(options.temporaryDirectory, DEVELOPMENT_DATA_DIRECTORY);
}
