import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import VersionDiffSign from '@version-diff-sign-renderer-sidebar';
import {
  getSignTargetOptions,
  resolveSidebarItemDoc,
  toVisibleState,
  useVersionDiffPluginData,
} from '../../../runtime/pluginData.js';

interface SidebarItem {
  href?: string;
  label: string;
  className?: string;
  autoAddBaseUrl?: boolean;
}

interface SidebarLinkProps extends Record<string, unknown> {
  item: SidebarItem;
  onItemClick?: (item: SidebarItem) => void;
  activePath: string;
  level: number;
  index?: number;
}

interface DocusaurusContextValue {
  siteConfig: {
    baseUrl: string;
  };
  i18n: {
    locales: string[];
  };
}

function LinkLabel({label}: {label: string}) {
  return (
    <span title={label} className="version-diff-sign__sidebar-link-label">
      {label}
    </span>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: SidebarLinkProps) {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const pluginData = useVersionDiffPluginData();
  const sidebarSignOptions = getSignTargetOptions(pluginData.options, 'sidebar');
  const {siteConfig, i18n} = useDocusaurusContext() as DocusaurusContextValue;
  const doc =
    pluginData.options.targets.sidebar && isInternalLink
      ? resolveSidebarItemDoc(pluginData, item, {
          baseUrl: siteConfig.baseUrl,
          locales: i18n.locales,
        })
      : null;
  const pageState = toVisibleState(doc?.pageState);

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx('menu__link', {
          'menu__link--active': isActive,
        })}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <LinkLabel label={label} />
            {pageState ? (
              <VersionDiffSign
                state={pageState}
                target="sidebar"
                type={sidebarSignOptions.type}
                color={sidebarSignOptions.color}
                docId={doc?.unversionedId}
                className="version-diff-sign__inline"
          />
        ) : null}
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
