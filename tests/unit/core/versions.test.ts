import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getRelevantVersions } from '../../../src/core/versions.js';

const fixtureRoot = path.resolve(__dirname, '../../fixtures/versioned-site');

describe('getRelevantVersions', () => {
  it('uses the current version and immediately previous version only', async () => {
    const versions = await getRelevantVersions({
      paths: {
        versionsFile: path.join(fixtureRoot, 'versions.json'),
        versionedDocsDir: path.join(fixtureRoot, 'versioned_docs'),
        versionDirPrefix: 'version-',
      },
    });

    expect(versions).toEqual({
      current: {
        name: '2.0.0',
        docsDir: path.join(fixtureRoot, 'versioned_docs', 'version-2.0.0'),
        permalinkVersionSegment: '',
      },
      previous: {
        name: '1.0.0',
        docsDir: path.join(fixtureRoot, 'versioned_docs', 'version-1.0.0'),
        permalinkVersionSegment: '1.0.0',
      },
    });
  });

  it('derives localized versioned docs directories when provided', async () => {
    const localizedVersionedDocsDir = path.join(
      fixtureRoot,
      'i18n',
      'ja',
      'docusaurus-plugin-content-docs',
    );
    const versions = await getRelevantVersions({
      paths: {
        versionsFile: path.join(fixtureRoot, 'versions.json'),
        versionedDocsDir: path.join(fixtureRoot, 'versioned_docs'),
        localizedVersionedDocsDir,
        versionDirPrefix: 'version-',
      },
    });

    expect(versions.current.localizedDocsDir).toBe(
      path.join(localizedVersionedDocsDir, 'version-2.0.0'),
    );
    expect(versions.previous?.localizedDocsDir).toBe(
      path.join(localizedVersionedDocsDir, 'version-1.0.0'),
    );
  });
});
