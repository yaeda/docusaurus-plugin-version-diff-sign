declare module '@docusaurus/theme-common' {
  export const ThemeClassNames: {
    docs: {
      docMarkdown: string;
      docSidebarItemLink: string;
      docSidebarItemLinkLevel(level: number): string;
    };
  };
}

declare module '@docusaurus/plugin-content-docs/client' {
  export function useDoc(): unknown;
  export function isActiveSidebarItem(
    item: unknown,
    activePath: string,
  ): boolean;
}

declare module '@theme/Heading' {
  import type { ComponentType, HTMLAttributes, ReactNode } from 'react';

  export interface ThemeHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
    as?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    children?: ReactNode;
    id?: string;
  }

  const Heading: ComponentType<ThemeHeadingProps>;
  export default Heading;
}

declare module '@theme/MDXContent' {
  import type { ComponentType, ReactNode } from 'react';

  export interface MDXContentProps {
    children?: ReactNode;
  }

  const MDXContent: ComponentType<MDXContentProps>;
  export default MDXContent;
}

declare module '@theme/Icon/ExternalLink' {
  import type { ComponentType } from 'react';

  const IconExternalLink: ComponentType;
  export default IconExternalLink;
}

declare module '@version-diff-sign-renderer-heading' {
  import type { ComponentType } from 'react';

  import type { VersionDiffRendererProps } from './types.js';

  const VersionDiffSignRenderer: ComponentType<VersionDiffRendererProps>;
  export default VersionDiffSignRenderer;
}

declare module '@version-diff-sign-renderer-sidebar' {
  import type { ComponentType } from 'react';

  import type { VersionDiffRendererProps } from './types.js';

  const VersionDiffSignRenderer: ComponentType<VersionDiffRendererProps>;
  export default VersionDiffSignRenderer;
}

declare module '@version-diff-sign-renderer-toc' {
  import type { ComponentType } from 'react';

  import type { VersionDiffRendererProps } from './types.js';

  const VersionDiffSignRenderer: ComponentType<VersionDiffRendererProps>;
  export default VersionDiffSignRenderer;
}
