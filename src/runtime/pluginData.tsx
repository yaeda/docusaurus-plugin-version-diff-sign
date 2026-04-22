import {createContext, useContext} from 'react';
import clsx from 'clsx';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {
  DocEntryMetadata,
  PluginGlobalData,
  PublicPluginOptions,
  SignType,
  SignTargetOptions,
  VersionDiffDocProviderProps,
  VersionDiffTarget,
  VisibleDiffState,
} from '../types.js';

const PLUGIN_DATA_KEY = 'docusaurus-plugin-version-diff-sign';

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/u, '');

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

interface RuntimeRouteContext {
  baseUrl: string;
  locales: string[];
}

interface SidebarItemRef {
  href?: string;
}

const CurrentDocDiffContext = createContext<DocEntryMetadata | null>(null);

function stripBaseUrl(pathname: string, baseUrl: string): string {
  const normalizedPath = normalizePathname(pathname);
  const normalizedBaseUrl = normalizePathname(baseUrl);

  if (
    normalizedBaseUrl !== '/' &&
    normalizedPath.startsWith(normalizedBaseUrl)
  ) {
    const stripped = normalizedPath.slice(normalizedBaseUrl.length);
    return normalizePathname(stripped);
  }

  return normalizedPath;
}

function stripLocalePrefix(pathname: string, locales: string[]): string {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);

  if (segments.length > 0 && locales.includes(segments[0])) {
    return normalizePathname(segments.slice(1).join('/'));
  }

  return normalizePathname(pathname);
}

export function VersionDiffDocProvider({
  doc,
  children,
}: VersionDiffDocProviderProps) {
  return (
    <CurrentDocDiffContext.Provider value={doc}>
      {children}
    </CurrentDocDiffContext.Provider>
  );
}

export function useCurrentDocDiff(): DocEntryMetadata | null {
  return useContext(CurrentDocDiffContext);
}

export function useVersionDiffPluginData(): PluginGlobalData {
  return usePluginData(PLUGIN_DATA_KEY) as PluginGlobalData;
}

export function resolveDocByPermalink(
  pluginData: PluginGlobalData,
  permalink: string,
  {baseUrl, locales}: RuntimeRouteContext,
): DocEntryMetadata | null {
  const withoutBaseUrl = stripBaseUrl(permalink, baseUrl);
  const normalizedPermalink = stripLocalePrefix(withoutBaseUrl, locales);
  const key = pluginData.metadata.docsByPermalink[normalizedPermalink];

  return key ? pluginData.metadata.docs[key] ?? null : null;
}

export function resolveSidebarItemDoc(
  pluginData: PluginGlobalData,
  item: SidebarItemRef,
  {baseUrl, locales}: RuntimeRouteContext,
): DocEntryMetadata | null {
  if (typeof item?.href !== 'string') {
    return null;
  }

  return resolveDocByPermalink(pluginData, item.href, {baseUrl, locales});
}

export function toVisibleState(
  state: string | null | undefined,
): VisibleDiffState | null {
  return state === 'new' || state === 'updated' ? state : null;
}

export function getVersionDiffClassName(
  target: VersionDiffTarget,
  state: VisibleDiffState,
  type: SignType,
  extraClassName?: string,
): string {
  return clsx(
    'version-diff-sign',
    target === 'heading'
      ? 'in-heading'
      : target === 'sidebar'
        ? 'in-sidebar'
        : 'in-toc',
    type === 'dot' ? 'is-dot' : 'is-pill',
    state === 'new' ? 'is-new' : 'is-updated',
    extraClassName,
  );
}

export function getSignTargetOptions(
  options: PublicPluginOptions,
  target: VersionDiffTarget,
): SignTargetOptions {
  return options.sign[target];
}

export function isConfiguredHeadingLevel(
  options: PublicPluginOptions,
  level: number,
): boolean {
  return options.headingLevels.includes(level);
}
