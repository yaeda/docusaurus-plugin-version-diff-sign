import { describe, expect, it } from 'vitest';

import { buildDiffMetadata } from '../../../src/core/diff.js';
import type {
  DocSectionSnapshot,
  DocSnapshot,
  VersionDiffFrontMatter,
} from '../../../src/types.js';

interface CreateDocInput {
  versionName?: string;
  unversionedId: string;
  title?: string;
  titleContent?: string;
  frontMatter?: VersionDiffFrontMatter;
  sections?: DocSectionSnapshot[];
  docPath?: string;
}

interface BuildMetadataInput {
  currentDocs: DocSnapshot[];
  previousDocs: DocSnapshot[];
  headingLevels?: number[];
  ignoreWhitespace?: boolean;
  routeBasePath?: string;
}

function createDoc({
  versionName = '2.0.0',
  unversionedId,
  title = 'Doc title',
  titleContent = '',
  frontMatter = {},
  sections = [],
  docPath,
}: CreateDocInput): DocSnapshot {
  return {
    sourcePath: `/virtual/${versionName}/${unversionedId}.mdx`,
    versionName,
    relativePath: `${unversionedId}.mdx`,
    unversionedId,
    title,
    frontMatter,
    pageContent: '',
    titleContent,
    docPath: docPath ?? `/${unversionedId}`,
    sections,
  };
}

function buildMetadata({
  currentDocs,
  previousDocs,
  headingLevels = [1, 2, 3],
  ignoreWhitespace = true,
  routeBasePath = 'docs',
}: BuildMetadataInput) {
  return buildDiffMetadata({
    currentVersion: {
      name: '2.0.0',
      docsDir: '/virtual/version-2.0.0',
      permalinkVersionSegment: '',
    },
    previousVersion: {
      name: '1.0.0',
      docsDir: '/virtual/version-1.0.0',
      permalinkVersionSegment: '1.0.0',
    },
    currentDocs,
    previousDocs,
    options: {
      headingLevels,
      ignoreWhitespace,
      paths: {
        routeBasePath,
      },
    },
    generatedAt: '2026-04-20T00:00:00.000Z',
  });
}

describe('buildDiffMetadata', () => {
  it('marks only changed child headings and keeps parent headings unchanged', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/start',
        titleContent: 'Intro text',
        sections: [
          {
            id: 'page-title',
            title: 'Page Title',
            level: 1,
            content: 'Intro text',
          },
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Old text' },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/start',
        titleContent: 'Intro text',
        sections: [
          {
            id: 'page-title',
            title: 'Page Title',
            level: 1,
            content: 'Intro text',
          },
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Changed text' },
        ],
      }),
    ];

    const metadata = buildMetadata({ currentDocs, previousDocs });
    const entry = metadata.docs['2.0.0:guide/start'];

    expect(entry.titleState).toBe('none');
    expect(entry.pageState).toBe('updated');
    expect(entry.headings.a.state).toBe('none');
    expect(entry.headings['a-1'].state).toBe('updated');
    expect(metadata.docsByPermalink['/docs/guide/start']).toBe(
      '2.0.0:guide/start',
    );
  });

  it('marks a page as new only when the page itself is missing previously', () => {
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/new-page',
        sections: [
          {
            id: 'page-title',
            title: 'Page Title',
            level: 1,
            content: 'Intro text',
          },
        ],
      }),
    ];

    const metadata = buildMetadata({
      currentDocs,
      previousDocs: [],
    });
    const entry = metadata.docs['2.0.0:guide/new-page'];

    expect(entry.pageState).toBe('new');
    expect(entry.titleState).toBe('new');
    expect(entry.headingLevels).toEqual([1, 2, 3]);
  });

  it('uses title content for pages without an h1 and ignores whitespace-only changes by default', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/override',
        title: 'Override Example',
        titleContent: 'Request intro',
        sections: [
          {
            id: 'request-connection-interval-change',
            title: 'Request Connection Interval Change',
            level: 2,
            content: 'Same text',
          },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/override',
        title: 'Override Example',
        titleContent: 'Request\n\nintro',
        sections: [
          {
            id: 'request-connection-interval-change',
            title: 'Request Connection Interval Change',
            level: 2,
            content: 'Same text',
          },
        ],
      }),
    ];

    const metadata = buildMetadata({ currentDocs, previousDocs });
    const entry = metadata.docs['2.0.0:guide/override'];

    expect(entry.titleState).toBe('none');
    expect(entry.pageState).toBe('none');
  });

  it('applies page and heading overrides from frontmatter', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/override',
        title: 'Override Example',
        titleContent: 'Request intro',
        sections: [
          {
            id: 'request-connection-interval-change',
            title: 'Request Connection Interval Change',
            level: 2,
            content: 'Same text',
          },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/override',
        title: 'Override Example',
        titleContent: 'Request intro changed',
        frontMatter: {
          versionDiff: {
            page: 'none',
            headings: {
              'request-connection-interval-change': 'updated',
            },
          },
        },
        sections: [
          {
            id: 'request-connection-interval-change',
            title: 'Request Connection Interval Change',
            level: 2,
            content: 'Same text',
          },
        ],
      }),
    ];

    const metadata = buildMetadata({ currentDocs, previousDocs });
    const entry = metadata.docs['2.0.0:guide/override'];

    expect(entry.titleState).toBe('none');
    expect(entry.pageState).toBe('none');
    expect(entry.headings['request-connection-interval-change'].state).toBe(
      'updated',
    );
  });

  it('uses page frontmatter heading levels when tracking heading states', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/frontmatter-levels',
        sections: [
          {
            id: 'page-title',
            title: 'Page Title',
            level: 1,
            content: 'Intro text',
          },
          {
            id: 'stable-section',
            title: 'Stable Section',
            level: 2,
            content: 'Stable text',
          },
          {
            id: 'changed-detail',
            title: 'Changed Detail',
            level: 3,
            content: 'Old text',
          },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/frontmatter-levels',
        frontMatter: {
          versionDiff: {
            headingLevels: [2, 9, 2],
          },
        },
        sections: [
          {
            id: 'page-title',
            title: 'Page Title',
            level: 1,
            content: 'Intro text',
          },
          {
            id: 'stable-section',
            title: 'Stable Section',
            level: 2,
            content: 'Stable text',
          },
          {
            id: 'changed-detail',
            title: 'Changed Detail',
            level: 3,
            content: 'Changed text',
          },
        ],
      }),
    ];

    const metadata = buildMetadata({
      currentDocs,
      previousDocs,
    });
    const entry = metadata.docs['2.0.0:guide/frontmatter-levels'];

    expect(entry.headingLevels).toEqual([2]);
    expect(entry.headings).toEqual({
      'stable-section': {
        id: 'stable-section',
        title: 'Stable Section',
        level: 2,
        state: 'none',
      },
    });
    expect(entry.pageState).toBe('none');
  });

  it('disables heading tracking when page frontmatter heading levels is empty', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/no-heading-levels',
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Old text' },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/no-heading-levels',
        frontMatter: {
          versionDiff: {
            headingLevels: [],
          },
        },
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Changed text' },
        ],
      }),
    ];

    const metadata = buildMetadata({
      currentDocs,
      previousDocs,
    });
    const entry = metadata.docs['2.0.0:guide/no-heading-levels'];

    expect(entry.headingLevels).toEqual([]);
    expect(entry.headings).toEqual({});
    expect(entry.pageState).toBe('none');
  });

  it('disables heading tracking when page frontmatter heading levels has no valid values', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/invalid-heading-levels',
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Old text' },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/invalid-heading-levels',
        frontMatter: {
          versionDiff: {
            headingLevels: [9],
          },
        },
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Changed text' },
        ],
      }),
    ];

    const metadata = buildMetadata({
      currentDocs,
      previousDocs,
    });
    const entry = metadata.docs['2.0.0:guide/invalid-heading-levels'];

    expect(entry.headingLevels).toEqual([]);
    expect(entry.headings).toEqual({});
    expect(entry.pageState).toBe('none');
  });

  it('filters heading states by configured heading levels', () => {
    const previousDocs = [
      createDoc({
        versionName: '1.0.0',
        unversionedId: 'guide/start',
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Old text' },
        ],
      }),
    ];
    const currentDocs = [
      createDoc({
        unversionedId: 'guide/start',
        sections: [
          { id: 'a', title: 'A', level: 2, content: 'Stable text' },
          { id: 'a-1', title: 'A-1', level: 3, content: 'Changed text' },
        ],
      }),
    ];

    const metadata = buildMetadata({
      currentDocs,
      previousDocs,
      headingLevels: [2],
    });
    const entry = metadata.docs['2.0.0:guide/start'];

    expect(entry.headings).toEqual({
      a: {
        id: 'a',
        title: 'A',
        level: 2,
        state: 'none',
      },
    });
    expect(entry.pageState).toBe('none');
  });
});
