import path from 'node:path';

import type { InternalPathsOptions, VersionInfo } from '../types.js';
import { pathExists, readJsonFile } from './fs.js';

function toVersionDir(
  versionedDocsDir: string,
  versionDirPrefix: string,
  versionName: string,
): string {
  return path.join(versionedDocsDir, `${versionDirPrefix}${versionName}`);
}

export async function getRelevantVersions(options: {
  paths: Pick<
    InternalPathsOptions,
    | 'localizedVersionedDocsDir'
    | 'versionsFile'
    | 'versionedDocsDir'
    | 'versionDirPrefix'
  >;
}): Promise<{ current: VersionInfo; previous?: VersionInfo }> {
  if (!(await pathExists(options.paths.versionsFile))) {
    throw new Error(
      `Expected versions file at "${options.paths.versionsFile}", but it was not found.`,
    );
  }

  const versions = await readJsonFile<unknown>(options.paths.versionsFile);

  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error(
      `Expected "${options.paths.versionsFile}" to contain at least one version name.`,
    );
  }

  const currentVersionName = versions[0];
  const previousVersionName =
    typeof versions[1] === 'string' ? versions[1] : undefined;

  const current: VersionInfo = {
    name: currentVersionName,
    docsDir: toVersionDir(
      options.paths.versionedDocsDir,
      options.paths.versionDirPrefix,
      currentVersionName,
    ),
    ...(options.paths.localizedVersionedDocsDir && {
      localizedDocsDir: toVersionDir(
        options.paths.localizedVersionedDocsDir,
        options.paths.versionDirPrefix,
        currentVersionName,
      ),
    }),
    permalinkVersionSegment: '',
  };

  const previous: VersionInfo | undefined = previousVersionName
    ? {
        name: previousVersionName,
        docsDir: toVersionDir(
          options.paths.versionedDocsDir,
          options.paths.versionDirPrefix,
          previousVersionName,
        ),
        ...(options.paths.localizedVersionedDocsDir && {
          localizedDocsDir: toVersionDir(
            options.paths.localizedVersionedDocsDir,
            options.paths.versionDirPrefix,
            previousVersionName,
          ),
        }),
        permalinkVersionSegment: previousVersionName,
      }
    : undefined;

  return { current, previous };
}
