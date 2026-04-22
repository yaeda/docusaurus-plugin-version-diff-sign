import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import VersionDiffSign from '@version-diff-sign-renderer-heading';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import {
  getSignTargetOptions,
  getVersionDiffClassName,
  isConfiguredHeadingLevel,
  resolveDocByPermalink,
  toVisibleState,
  useVersionDiffPluginData,
  VersionDiffDocProvider,
} from '../../../runtime/pluginData.js';

interface DocPageData {
  metadata: {
    id: string;
    permalink: string;
    title: string;
  };
  frontMatter: {
    hide_title?: boolean;
  };
  contentTitle?: string;
}

interface DocusaurusContextValue {
  siteConfig: {
    baseUrl: string;
  };
  i18n: {
    locales: string[];
  };
}

function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc() as DocPageData;
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';

  if (!shouldRender) {
    return null;
  }

  return metadata.title;
}

export default function DocItemContent({ children }: { children?: ReactNode }) {
  const { metadata } = useDoc() as DocPageData;
  const { siteConfig, i18n } = useDocusaurusContext() as DocusaurusContextValue;
  const pluginData = useVersionDiffPluginData();
  const syntheticTitle = useSyntheticTitle();
  const doc = resolveDocByPermalink(pluginData, metadata.permalink, {
    baseUrl: siteConfig.baseUrl,
    locales: i18n.locales,
  });
  const headingSignOptions = getSignTargetOptions(
    pluginData.options,
    'heading',
  );
  const titleState = toVisibleState(doc?.titleState);
  const canDecorateH1 =
    pluginData.options.targets.headings &&
    isConfiguredHeadingLevel(pluginData.options, 1);
  const headingClassName =
    canDecorateH1 && titleState
      ? getVersionDiffClassName('heading', titleState, headingSignOptions.type)
      : undefined;

  return (
    <VersionDiffDocProvider doc={doc}>
      <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
        {syntheticTitle ? (
          <header>
            <Heading as="h1" className={headingClassName}>
              <span className="version-diff-sign__content">
                {syntheticTitle}
                {titleState && canDecorateH1 ? (
                  <VersionDiffSign
                    state={titleState}
                    target="heading"
                    type={headingSignOptions.type}
                    color={headingSignOptions.color}
                    docId={doc?.unversionedId ?? metadata.id}
                    headingLevel={1}
                    className="version-diff-sign__inline"
                  />
                ) : null}
              </span>
            </Heading>
          </header>
        ) : null}
        <MDXContent>{children}</MDXContent>
      </div>
    </VersionDiffDocProvider>
  );
}
