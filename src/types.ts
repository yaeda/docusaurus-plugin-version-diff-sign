import type { ReactNode } from 'react';

export type VisibleDiffState = 'new' | 'updated';
export type DiffState = 'none' | VisibleDiffState;
export type DiffOverrideState = DiffState | 'auto';
export type VersionDiffTarget = 'sidebar' | 'toc' | 'heading';
export type SignType = 'dot' | 'pill';

export interface SignTargetOptions {
  type: SignType;
  color?: string;
  componentPath?: string;
}

export interface SignOptions {
  heading: SignTargetOptions;
  sidebar: SignTargetOptions;
  toc: SignTargetOptions;
}

export interface PluginPathOptions {
  routeBasePath: string;
  cacheFile: string;
}

export interface InternalPathsOptions extends PluginPathOptions {
  versionedDocsDir: string;
  versionsFile: string;
  versionDirPrefix: string;
}

export interface NormalizedPluginOptions {
  targets: {
    sidebar: boolean;
    toc: boolean;
    headings: boolean;
  };
  headingLevels: number[];
  ignoreWhitespace: boolean;
  sign: SignOptions;
  paths: InternalPathsOptions;
}

export interface PublicPluginOptions {
  targets: NormalizedPluginOptions['targets'];
  headingLevels: number[];
  sign: SignOptions;
}

export interface PluginUserOptions {
  targets?: Partial<NormalizedPluginOptions['targets']>;
  headingLevels?: number[];
  ignoreWhitespace?: boolean;
  sign?: {
    heading?: Partial<Omit<SignTargetOptions, 'type'>> & { type?: SignType };
    sidebar?: Partial<Omit<SignTargetOptions, 'type'>> & { type?: SignType };
    toc?: Partial<Omit<SignTargetOptions, 'type'>> & { type?: SignType };
  };
  paths?: Partial<PluginPathOptions>;
}

export interface VersionDiffFrontMatter {
  versionDiff?: {
    page?: DiffOverrideState;
    headings?: Record<string, DiffOverrideState>;
  };
  id?: string;
  slug?: string;
  title?: string;
  hide_title?: boolean;
  [key: string]: unknown;
}

export interface VersionInfo {
  name: string;
  docsDir: string;
  permalinkVersionSegment: string;
}

export interface DocSectionSnapshot {
  id: string;
  title: string;
  level: number;
  content: string;
}

export interface DocSnapshot {
  sourcePath: string;
  versionName: string;
  relativePath: string;
  unversionedId: string;
  title: string;
  frontMatter: VersionDiffFrontMatter;
  pageContent: string;
  titleContent: string;
  docPath: string;
  sections: DocSectionSnapshot[];
}

export interface DocHeadingMetadata {
  id: string;
  title: string;
  level: number;
  state: DiffState;
}

export interface DocEntryMetadata {
  key: string;
  versionName: string;
  previousVersionName?: string;
  unversionedId: string;
  sourcePath: string;
  permalink: string;
  pageState: DiffState;
  titleState: DiffState;
  title: string;
  headings: Record<string, DocHeadingMetadata>;
}

export interface GeneratedMetadata {
  schemaVersion: number;
  generatedAt: string;
  currentVersionName: string;
  previousVersionName?: string;
  docs: Record<string, DocEntryMetadata>;
  docsByPermalink: Record<string, string>;
}

export interface PluginGlobalData {
  metadata: GeneratedMetadata;
  options: PublicPluginOptions;
}

export interface VersionDiffRendererProps {
  state: VisibleDiffState;
  target: VersionDiffTarget;
  type: SignType;
  color?: string;
  docId?: string;
  headingId?: string;
  headingLevel?: number;
  className?: string;
}

export interface VersionDiffDocProviderProps {
  doc: DocEntryMetadata | null;
  children: ReactNode;
}

export interface ParsedCacheEntry {
  sourceHash: string;
  snapshot: DocSnapshot;
}

export interface ParsedCacheFile {
  schemaVersion: number;
  logicVersion: number;
  files?: Record<string, ParsedCacheEntry>;
}
