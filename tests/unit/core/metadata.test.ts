import os from 'node:os';
import path from 'node:path';
import {cp, mkdtemp, rm} from 'node:fs/promises';

import {afterEach, describe, expect, it} from 'vitest';

import {generateDiffMetadata} from '../../../src/core/metadata.js';
import {normalizeOptions} from '../../../src/options.js';

const fixtureRoot = path.resolve(
  __dirname,
  '../../fixtures/versioned-site',
);

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map(async (dirPath) => {
      await rm(dirPath, {recursive: true, force: true});
    }),
  );
  tempDirs.length = 0;
});

describe('generateDiffMetadata', () => {
  it('builds runtime metadata from fixture docs and doc lookups', async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), 'version-diff-sign-'));
    tempDirs.push(siteDir);

    await cp(path.join(fixtureRoot, 'versioned_docs'), path.join(siteDir, 'versioned_docs'), {
      recursive: true,
    });
    await cp(path.join(fixtureRoot, 'versions.json'), path.join(siteDir, 'versions.json'));

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
    expect(
      metadata.docsByPermalink['/docs/guide/override'],
    ).toBe('2.0.0:guide/override');
  });
});
