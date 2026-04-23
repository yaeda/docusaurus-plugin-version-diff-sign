# docusaurus-plugin-version-diff-sign

`docusaurus-plugin-version-diff-sign` adds version diff signs to Docusaurus docs content by comparing the current docs version against the immediately previous docs version.

It computes diff metadata at build time and uses that metadata at runtime to decorate:

- page headings
- sidebar doc links
- table of contents entries

## Quick Start

Minimal setup:

```ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  plugins: ['docusaurus-plugin-version-diff-sign'],
};

export default config;
```

With the default renderer:

- page headings render text pills
- sidebar items render dots
- TOC entries render dots

Example with options:
This disables TOC signs and changes the built-in sign colors for headings and sidebar items.

```ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  plugins: [
    [
      'docusaurus-plugin-version-diff-sign',
      {
        targets: {
          toc: false,
        },
        sign: {
          heading: {
            color: '#0f766e',
          },
          sidebar: {
            color: '#f59e0b',
          },
        },
      },
    ],
  ],
};

export default config;
```

## Options

The plugin options are:

```ts
{
  targets?: {
    sidebar?: boolean;
    toc?: boolean;
    headings?: boolean;
  };
  headingLevels?: number[];
  ignoreWhitespace?: boolean;
  sign?: {
    heading?: {
      type?: 'dot' | 'pill';
      color?: string;
      componentPath?: string;
    };
    sidebar?: {
      type?: 'dot' | 'pill';
      color?: string;
      componentPath?: string;
    };
    toc?: {
      type?: 'dot' | 'pill';
      color?: string;
      componentPath?: string;
    };
  };
  paths?: {
    routeBasePath?: string;
    cacheFile?: string;
  };
}
```

Options:

- `targets`: turns rendering on or off for headings, sidebar items, and TOC items independently. Defaults to `headings: true`, `sidebar: true`, and `toc: true`.
- `headingLevels`: controls which heading levels are tracked for both heading pills and TOC dots. Defaults to `[1, 2, 3]`.
- `ignoreWhitespace`: ignores whitespace-only content changes when `true`. Defaults to `true`.
- `sign`: configures per-target sign customization. Use `type` to choose the built-in shape, `color` to tweak it, or `componentPath` to replace it completely. Defaults are `heading.type: 'pill'`, `sidebar.type: 'dot'`, and `toc.type: 'dot'`.
- `paths`: advanced overrides for route base path and cache location. Defaults to `routeBasePath: 'docs'` and `cacheFile: '.docusaurus/docusaurus-plugin-version-diff-sign.cache.json'`.

## Customization

Choose the lightest customization that fits your use case:

- Use `sign.<target>.color` when you only want to change the built-in sign color.
- Use CSS overrides when you want to keep the built-in sign but adjust its size, spacing, typography, or shape.
- Use `sign.<target>.componentPath` when you want to replace the built-in sign completely.

### 1. Color only

If you only want to adjust the built-in sign color, configure `sign.<target>.color`:

```ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  plugins: [
    [
      'docusaurus-plugin-version-diff-sign',
      {
        targets: {
          toc: false,
        },
        sign: {
          heading: {
            color: '#0f766e',
          },
          sidebar: {
            color: '#f59e0b',
          },
        },
      },
    ],
  ],
};

export default config;
```

This keeps the built-in pill and dot renderers, but changes their colors for the configured targets.

You can also switch the built-in sign shape per target:

```ts
sign: {
  toc: {
    type: 'pill',
  },
}
```

### 2. Fine-tune the built-in sign with CSS

The default renderer attaches stable target and state classes so you can restyle signs without changing the diff logic.

```css
.version-diff-sign.in-heading.is-new {
  background: #0f766e;
  color: white;
}

.version-diff-sign.in-sidebar.is-updated,
.version-diff-sign.in-toc.is-updated {
  background: #f59e0b;
}
```

### 3. Replace the sign completely

To replace the built-in sign renderer for a specific target, point `sign.<target>.componentPath` at a component in your site:

```ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  plugins: [
    [
      'docusaurus-plugin-version-diff-sign',
      {
        sign: {
          heading: {
            color: '#0f766e',
            componentPath: './src/components/HeadingVersionDiffBadge.tsx',
          },
        },
      },
    ],
  ],
};

export default config;
```

Example custom renderer:

```tsx
import type { VersionDiffRendererProps } from 'docusaurus-plugin-version-diff-sign';

export default function VersionDiffBadge({
  state,
  target,
  type,
  color,
  className,
}: VersionDiffRendererProps) {
  return (
    <span
      className={[
        className,
        'my-sign',
        `my-sign--${target}`,
        `my-sign--${type}`,
        `my-sign--${state}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        color,
        fontSize: type === 'pill' ? '0.75rem' : '0.625rem',
        fontWeight: 700,
        marginInlineStart: '0.5rem',
      }}
    >
      {state === 'new' ? 'NEW' : 'UPDATED'}
    </span>
  );
}
```

The renderer receives:

- `state`: `'new' | 'updated'`
- `target`: `'heading' | 'sidebar' | 'toc'`
- `type`: `'pill' | 'dot'`
- `color`: the configured target color when provided
- `docId`: current document `unversionedId` when available
- `headingId`: current heading `id` for heading and TOC targets when available
- `headingLevel`: heading level for heading and TOC targets when available
- `className`: the plugin-provided class name for the rendered element

### Frontmatter overrides

You can override automatic diff states in a document frontmatter block:

```yaml
---
versionDiff:
  headingLevels: [2]
  page: updated
  headings:
    request-connection-interval-change: none
    write-operations: updated
---
```

`versionDiff.headingLevels` accepts an array of heading levels from `1` to `6` and overrides the plugin-level setting for that page.

`versionDiff.page` and each `versionDiff.headings.<headingId>` support these values:

- `auto`
- `none`
- `new`
- `updated`

`versionDiff.page` overrides both the page state and the title state. `versionDiff.headings` overrides individual heading states by heading `id`.

## More Details

See [docs/SPEC.md](./docs/SPEC.md) for the behavior contract and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for implementation details.

## Known Limitations

- Cache behavior is not finalized yet and may change in a future update.
- Only the current docs version and the immediately previous version are compared.
- Arbitrary version-pair comparison is not supported.
- Sidebar structure diffing is not supported as a first-class feature.
