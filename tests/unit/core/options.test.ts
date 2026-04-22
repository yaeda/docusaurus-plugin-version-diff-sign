import { describe, expect, it } from 'vitest';

import { normalizeOptions, toPublicOptions } from '../../../src/options.js';

describe('normalizeOptions', () => {
  it('applies documented defaults and resolves paths from the site dir', () => {
    const siteDir = '/repo/site';
    const options = normalizeOptions(siteDir, {});

    expect(options.targets).toEqual({
      sidebar: true,
      toc: true,
      headings: true,
    });
    expect(options.headingLevels).toEqual([1, 2, 3]);
    expect(options.ignoreWhitespace).toBe(true);
    expect(options.sign).toEqual({
      heading: {
        type: 'pill',
        color: undefined,
        componentPath: undefined,
      },
      sidebar: {
        type: 'dot',
        color: undefined,
        componentPath: undefined,
      },
      toc: {
        type: 'dot',
        color: undefined,
        componentPath: undefined,
      },
    });
    expect(options.paths).toEqual({
      routeBasePath: 'docs',
      versionedDocsDir: '/repo/site/versioned_docs',
      versionsFile: '/repo/site/versions.json',
      versionDirPrefix: 'version-',
      cacheFile:
        '/repo/site/.docusaurus/docusaurus-plugin-version-diff-sign.cache.json',
    });
  });

  it('filters invalid heading levels and returns unique sorted values', () => {
    const options = normalizeOptions('/repo/site', {
      headingLevels: [3, 2, 9, 3, 0, 1],
    });

    expect(options.headingLevels).toEqual([1, 2, 3]);
  });
});

describe('toPublicOptions', () => {
  it('omits build-only path configuration', () => {
    const options = normalizeOptions('/repo/site', {
      sign: {
        heading: {
          type: 'dot',
          color: '#ff6600',
          componentPath: './src/custom-heading-renderer.tsx',
        },
      },
    });

    expect(toPublicOptions(options)).toEqual({
      targets: options.targets,
      headingLevels: options.headingLevels,
      sign: options.sign,
    });
  });
});
