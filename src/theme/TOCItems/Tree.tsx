import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import VersionDiffSign from '@version-diff-sign-renderer-toc';
import React from 'react';

import {
  getSignTargetOptions,
  isConfiguredHeadingLevel,
  resolveDocByPermalink,
  toVisibleState,
  useVersionDiffPluginData,
} from '../../runtime/pluginData.js';
import type { DocEntryMetadata, PluginGlobalData } from '../../types.js';

interface TocHeading {
  id: string;
  value: string;
  level: number;
  children: TocHeading[];
}

interface TocTreeProps {
  toc: TocHeading[];
  className?: string;
  linkClassName?: string;
}

interface TocTreeNodeProps extends TocTreeProps {
  isChild?: boolean;
  doc: DocEntryMetadata | null;
  pluginData: PluginGlobalData;
}

interface DocPageData {
  metadata: {
    permalink: string;
  };
}

interface DocusaurusContextValue {
  siteConfig: {
    baseUrl: string;
  };
  i18n: {
    locales: string[];
  };
}

function TOCItemTreeNodes({
  toc,
  className,
  linkClassName,
  isChild,
  doc,
  pluginData,
}: TocTreeNodeProps) {
  if (!toc.length) {
    return null;
  }

  const tocSignOptions = getSignTargetOptions(pluginData.options, 'toc');

  return (
    <ul className={isChild ? undefined : className}>
      {toc.map((heading) => {
        const headingState =
          isConfiguredHeadingLevel(pluginData.options, heading.level, doc) &&
          doc
            ? toVisibleState(doc.headings[heading.id]?.state)
            : null;

        return (
          <li key={heading.id}>
            <Link to={`#${heading.id}`} className={linkClassName ?? undefined}>
              <span
                className="version-diff-sign__toc-link"
                // Developer provided the HTML, so assume it's safe.
                dangerouslySetInnerHTML={{ __html: heading.value }}
              />
              {headingState ? (
                <VersionDiffSign
                  state={headingState}
                  target="toc"
                  type={tocSignOptions.type}
                  color={tocSignOptions.color}
                  docId={doc?.unversionedId}
                  headingId={heading.id}
                  headingLevel={heading.level}
                  className="version-diff-sign__inline"
                />
              ) : null}
            </Link>
            <TOCItemTreeNodes
              isChild
              toc={heading.children}
              className={className}
              linkClassName={linkClassName}
              doc={doc}
              pluginData={pluginData}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default React.memo(function TOCItemTree(props: TocTreeProps) {
  const { metadata } = useDoc() as DocPageData;
  const { siteConfig, i18n } = useDocusaurusContext() as DocusaurusContextValue;
  const pluginData = useVersionDiffPluginData();
  const doc = resolveDocByPermalink(pluginData, metadata.permalink, {
    baseUrl: siteConfig.baseUrl,
    locales: i18n.locales,
  });

  if (!pluginData.options.targets.toc) {
    return <TOCItemTreeNodes {...props} doc={null} pluginData={pluginData} />;
  }

  return <TOCItemTreeNodes {...props} doc={doc} pluginData={pluginData} />;
});
