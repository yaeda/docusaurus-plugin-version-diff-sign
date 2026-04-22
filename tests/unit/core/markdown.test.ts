import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseDocSnapshot } from '../../../src/core/markdown.js';

const fixtureRoot = path.resolve(
  __dirname,
  '../../fixtures/versioned-site/versioned_docs/version-2.0.0',
);

describe('parseDocSnapshot', () => {
  it('derives route-independent ids, titles, and local section content', async () => {
    const filePath = path.join(fixtureRoot, 'guide', 'start.mdx');
    const snapshot = await parseDocSnapshot(filePath, {
      name: '2.0.0',
      docsDir: fixtureRoot,
    });

    expect(snapshot.unversionedId).toBe('guide/start');
    expect(snapshot.docPath).toBe('/guide/start');
    expect(snapshot.title).toBe('Getting Started');
    expect(snapshot.sections).toEqual([
      {
        id: 'page-title',
        title: 'Page Title',
        level: 1,
        content: 'Intro text',
      },
      {
        id: 'a',
        title: 'A',
        level: 2,
        content: 'Stable text',
      },
      {
        id: 'a-1',
        title: 'A-1',
        level: 3,
        content: 'Changed text',
      },
      {
        id: 'fresh-section',
        title: 'Fresh Section',
        level: 2,
        content: 'Brand new content',
      },
    ]);
  });

  it('uses the leading content as title content when the page has no h1', async () => {
    const filePath = path.join(fixtureRoot, 'guide', 'override.mdx');
    const snapshot = await parseDocSnapshot(filePath, {
      name: '2.0.0',
      docsDir: fixtureRoot,
    });

    expect(snapshot.titleContent).toBe('Request intro');
    expect(snapshot.sections).toEqual([
      {
        id: 'request-connection-interval-change',
        title: 'Request Connection Interval Change',
        level: 2,
        content: 'Same text',
      },
    ]);
  });
});
