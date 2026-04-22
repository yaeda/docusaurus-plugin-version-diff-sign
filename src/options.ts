import path from 'node:path';
import {
  DEFAULT_HEADING_LEVELS,
  DOCUSAURUS_VERSIONED_DOCS_DIR,
  DOCUSAURUS_VERSION_DIR_PREFIX,
  DOCUSAURUS_VERSIONS_FILE,
} from './constants.js';
import type {
  NormalizedPluginOptions,
  PluginUserOptions,
  PublicPluginOptions,
  SignType,
  SignTargetOptions,
  VersionDiffTarget,
} from './types.js';

function uniqueHeadingLevels(levels: number[]): number[] {
  return [...new Set(levels)].sort((left, right) => left - right);
}

function isHeadingLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6;
}

function normalizeSignTarget(
  siteDir: string,
  targetName: VersionDiffTarget,
  target?: Partial<SignTargetOptions>,
): SignTargetOptions {
  return {
    type:
      target?.type ??
      (targetName === 'heading'
        ? 'pill'
        : 'dot'),
    color: target?.color,
    componentPath: target?.componentPath
      ? path.resolve(siteDir, target.componentPath)
      : undefined,
  };
}

export function normalizeOptions(
  siteDir: string,
  options: PluginUserOptions = {},
): NormalizedPluginOptions {
  const headingLevels = uniqueHeadingLevels(
    (options.headingLevels ?? [...DEFAULT_HEADING_LEVELS]).filter(isHeadingLevel),
  );

  return {
    targets: {
      sidebar: options.targets?.sidebar ?? true,
      toc: options.targets?.toc ?? true,
      headings: options.targets?.headings ?? true,
    },
    headingLevels,
    ignoreWhitespace: options.ignoreWhitespace ?? true,
    sign: {
      heading: normalizeSignTarget(siteDir, 'heading', options.sign?.heading),
      sidebar: normalizeSignTarget(siteDir, 'sidebar', options.sign?.sidebar),
      toc: normalizeSignTarget(siteDir, 'toc', options.sign?.toc),
    },
    paths: {
      routeBasePath: options.paths?.routeBasePath ?? 'docs',
      versionedDocsDir: path.resolve(siteDir, DOCUSAURUS_VERSIONED_DOCS_DIR),
      versionsFile: path.resolve(siteDir, DOCUSAURUS_VERSIONS_FILE),
      versionDirPrefix: DOCUSAURUS_VERSION_DIR_PREFIX,
      cacheFile: path.resolve(
        siteDir,
        options.paths?.cacheFile ??
          path.join('.docusaurus', 'docusaurus-plugin-version-diff-sign.cache.json'),
      ),
    },
  };
}

export function toPublicOptions(
  options: NormalizedPluginOptions,
): PublicPluginOptions {
  return {
    targets: options.targets,
    headingLevels: options.headingLevels,
    sign: options.sign,
  };
}
