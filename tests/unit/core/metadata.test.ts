import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateDiffMetadata } from '../../../src/core/metadata.js';
import { normalizeOptions } from '../../../src/options.js';

const fixtureRoot = path.resolve(__dirname, '../../fixtures/versioned-site');

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map(async (dirPath) => {
      await rm(dirPath, { recursive: true, force: true });
    }),
  );
  tempDirs.length = 0;
});

describe('generateDiffMetadata', () => {
  it('builds runtime metadata from fixture docs and doc lookups', async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), 'version-diff-sign-'));
    tempDirs.push(siteDir);

    await cp(
      path.join(fixtureRoot, 'versioned_docs'),
      path.join(siteDir, 'versioned_docs'),
      {
        recursive: true,
      },
    );
    await cp(
      path.join(fixtureRoot, 'versions.json'),
      path.join(siteDir, 'versions.json'),
    );

    const options = normalizeOptions(siteDir, {});

    const metadata = await generateDiffMetadata(options);
    const startEntry = metadata.docs['2.0.0:guide/start'];
    const overrideEntry = metadata.docs['2.0.0:guide/override'];

    expect(metadata.currentVersionName).toBe('2.0.0');
    expect(metadata.previousVersionName).toBe('1.0.0');
    expect(startEntry.permalink).toBe('/docs/guide/start');
    expect(startEntry.pageState).toBe('updated');
    expect(startEntry.headings['a-1'].state).toBe('updated');
    expect(startEntry.headings['fresh-section'].state).toBe('new');
    expect(overrideEntry.pageState).toBe('none');
    expect(metadata.docsByPermalink['/docs/guide/override']).toBe(
      '2.0.0:guide/override',
    );
  });

  it('uses localized docs when building heading metadata for translated locales', async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), 'version-diff-sign-'));
    tempDirs.push(siteDir);

    await cp(
      path.join(fixtureRoot, 'versioned_docs'),
      path.join(siteDir, 'versioned_docs'),
      {
        recursive: true,
      },
    );
    await cp(
      path.join(fixtureRoot, 'versions.json'),
      path.join(siteDir, 'versions.json'),
    );

    const localizedDocsDir = path.join(
      siteDir,
      'i18n',
      'ja',
      'docusaurus-plugin-content-docs',
    );
    const localizedCurrentDir = path.join(
      localizedDocsDir,
      'version-2.0.0',
      'guide',
    );
    const localizedPreviousDir = path.join(
      localizedDocsDir,
      'version-1.0.0',
      'guide',
    );

    await mkdir(localizedCurrentDir, { recursive: true });
    await mkdir(localizedPreviousDir, { recursive: true });
    await writeFile(
      path.join(localizedPreviousDir, 'start.mdx'),
      [
        '# Localized Start',
        '',
        'Localized intro.',
        '',
        '## Localized Stable',
        '',
        'Stable localized body.',
        '',
        '### Localized Changed',
        '',
        'Old localized body.',
      ].join('\n'),
    );
    await writeFile(
      path.join(localizedCurrentDir, 'start.mdx'),
      [
        '# Localized Start',
        '',
        'Localized intro.',
        '',
        '## Localized Stable',
        '',
        'Stable localized body.',
        '',
        '### Localized Changed',
        '',
        'Changed localized body.',
      ].join('\n'),
    );

    const baseOptions = normalizeOptions(siteDir, {});
    const metadata = await generateDiffMetadata({
      ...baseOptions,
      paths: {
        ...baseOptions.paths,
        localizedVersionedDocsDir: localizedDocsDir,
      },
    });
    const startEntry = metadata.docs['2.0.0:guide/start'];

    expect(startEntry.permalink).toBe('/docs/guide/start');
    expect(startEntry.title).toBe('Localized Start');
    expect(startEntry.headings['localized-changed'].state).toBe('updated');
    expect(startEntry.headings['a-1']).toBeUndefined();
  });
});
