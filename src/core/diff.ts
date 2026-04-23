import { METADATA_SCHEMA_VERSION } from '../constants.js';
import type {
  DiffOverrideState,
  DiffState,
  DocHeadingMetadata,
  DocSnapshot,
  GeneratedMetadata,
  PluginPathOptions,
  VersionInfo,
  VisibleDiffState,
} from '../types.js';
import { joinUrlSegments } from './url.js';

type DiffBuildOptions = {
  headingLevels: number[];
  ignoreWhitespace: boolean;
  paths: Pick<PluginPathOptions, 'routeBasePath'>;
};

function isHeadingLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

function normalizeHeadingLevels(levels: number[]): number[] {
  return [...new Set(levels)].sort((left, right) => left - right);
}

function getDocHeadingLevels(
  current: DocSnapshot,
  defaultHeadingLevels: number[],
): number[] {
  const configuredHeadingLevels =
    current.frontMatter.versionDiff?.headingLevels;

  if (!Array.isArray(configuredHeadingLevels)) {
    return defaultHeadingLevels;
  }

  const frontMatterHeadingLevels =
    configuredHeadingLevels.filter(isHeadingLevel);
  return normalizeHeadingLevels(frontMatterHeadingLevels);
}

function toVisibleState(
  value: DiffState | DiffOverrideState | undefined,
): VisibleDiffState | null {
  return value === 'new' || value === 'updated' ? value : null;
}

function applyOverride(
  autoState: DiffState,
  override: DiffOverrideState | undefined,
): DiffState {
  if (!override || override === 'auto') {
    return autoState;
  }

  return override;
}

function normalizeComparableContent(
  content: string | undefined,
  options: Pick<DiffBuildOptions, 'ignoreWhitespace'>,
): string {
  const value = typeof content === 'string' ? content : '';

  if (options.ignoreWhitespace) {
    return value.replace(/\s+/gu, '');
  }

  return value.trim();
}

function isSameContent(
  currentContent: string | undefined,
  previousContent: string | undefined,
  options: Pick<DiffBuildOptions, 'ignoreWhitespace'>,
): boolean {
  return (
    normalizeComparableContent(currentContent, options) ===
    normalizeComparableContent(previousContent, options)
  );
}

function derivePageState(
  titleState: DiffState,
  headingStates: DocHeadingMetadata[],
  previous: DocSnapshot | undefined,
): DiffState {
  if (!previous) {
    return 'new';
  }

  if (toVisibleState(titleState)) {
    return 'updated';
  }

  const hasVisibleHeadingState = headingStates.some((heading) =>
    toVisibleState(heading.state),
  );

  return hasVisibleHeadingState ? 'updated' : 'none';
}

function deriveTitleState(
  current: DocSnapshot,
  previous: DocSnapshot | undefined,
  options: Pick<DiffBuildOptions, 'ignoreWhitespace'>,
): DiffState {
  const currentTitleSection = current.sections.find(
    (section) => section.level === 1,
  );

  if (currentTitleSection) {
    const previousTitleSection = previous?.sections.find(
      (section) => section.level === 1 && section.id === currentTitleSection.id,
    );

    if (!previousTitleSection) {
      return 'new';
    }

    return isSameContent(
      currentTitleSection.content,
      previousTitleSection.content,
      options,
    )
      ? 'none'
      : 'updated';
  }

  if (!previous) {
    return 'new';
  }

  return isSameContent(current.titleContent, previous.titleContent, options)
    ? 'none'
    : 'updated';
}

function buildPermalink(
  docPath: string,
  version: VersionInfo,
  routeBasePath: string,
): string {
  const versionPath = version.permalinkVersionSegment
    ? joinUrlSegments(routeBasePath, version.permalinkVersionSegment)
    : joinUrlSegments(routeBasePath);

  return joinUrlSegments(versionPath, docPath);
}

function compareDoc(
  current: DocSnapshot,
  previous: DocSnapshot | undefined,
  currentVersion: VersionInfo,
  previousVersionName: string | undefined,
  routeBasePath: string,
  options: DiffBuildOptions,
) {
  const previousHeadings = new Map(
    (previous?.sections ?? []).map((section) => [section.id, section]),
  );
  const headingLevels = getDocHeadingLevels(current, options.headingLevels);

  const trackedHeadings = current.sections.filter((section) =>
    headingLevels.includes(section.level),
  );

  const headings: Record<string, DocHeadingMetadata> = Object.fromEntries(
    trackedHeadings.map((section) => {
      const previousSection = previousHeadings.get(section.id);
      const autoState = previousSection
        ? isSameContent(section.content, previousSection.content, options)
          ? 'none'
          : 'updated'
        : 'new';
      const overridden = applyOverride(
        autoState,
        current.frontMatter.versionDiff?.headings?.[section.id],
      );

      return [
        section.id,
        {
          id: section.id,
          title: section.title,
          level: section.level,
          state: overridden,
        },
      ];
    }),
  );

  const titleAutoState = deriveTitleState(current, previous, options);
  const pageAutoState = derivePageState(
    titleAutoState,
    Object.values(headings),
    previous,
  );
  const pageState = applyOverride(
    pageAutoState,
    current.frontMatter.versionDiff?.page,
  );
  const titleState = applyOverride(
    titleAutoState,
    current.frontMatter.versionDiff?.page,
  );

  return {
    key: `${current.versionName}:${current.unversionedId}`,
    versionName: current.versionName,
    previousVersionName,
    unversionedId: current.unversionedId,
    sourcePath: current.sourcePath,
    permalink: buildPermalink(current.docPath, currentVersion, routeBasePath),
    headingLevels,
    pageState,
    titleState,
    title: current.title,
    headings,
  };
}

export function buildDiffMetadata({
  currentVersion,
  previousVersion,
  currentDocs,
  previousDocs,
  options,
  generatedAt = new Date().toISOString(),
}: {
  currentVersion: VersionInfo;
  previousVersion?: VersionInfo;
  currentDocs: DocSnapshot[];
  previousDocs: DocSnapshot[];
  options: DiffBuildOptions;
  generatedAt?: string;
}): GeneratedMetadata {
  const docs: GeneratedMetadata['docs'] = {};
  const docsByPermalink: GeneratedMetadata['docsByPermalink'] = {};
  const previousById = new Map(
    previousDocs.map((doc) => [doc.unversionedId, doc]),
  );

  currentDocs.forEach((doc) => {
    const entry = compareDoc(
      doc,
      previousById.get(doc.unversionedId),
      currentVersion,
      previousVersion?.name,
      options.paths.routeBasePath,
      options,
    );
    docs[entry.key] = entry;
    docsByPermalink[entry.permalink] = entry.key;
  });

  return {
    schemaVersion: METADATA_SCHEMA_VERSION,
    generatedAt,
    currentVersionName: currentVersion.name,
    previousVersionName: previousVersion?.name,
    docs,
    docsByPermalink,
  };
}
