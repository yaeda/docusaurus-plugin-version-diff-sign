# Specification for `docusaurus-plugin-version-diff-sign`

## Overview

`docusaurus-plugin-version-diff-sign` adds version diff signs to Docusaurus docs content by comparing the current docs version against the immediately previous docs version. It computes diff metadata at build time and uses that metadata at runtime to decorate:

- page headings
- sidebar doc links
- table of contents entries

With the default renderer:

- page headings render text pills
- sidebar entries render dots
- TOC entries render dots

These defaults can be changed per target with `sign.<target>.type`.

## Supported Targets

The plugin can render signs in three target areas:

- `headings`
- `sidebar`
- `toc`

Each target can be enabled or disabled independently through plugin options.

## Diff Model

The plugin compares:

- the current versioned docs set
- the immediately previous versioned docs set

It does not compare arbitrary version pairs.

The comparison unit is the document plus its tracked headings. A document is matched across versions by `unversionedId`. A heading is matched across versions by heading `id`.

## State Definitions

The plugin uses three logical states:

- `none`: no visible diff for the target item
- `updated`: the item existed previously and its relevant content changed
- `new`: the item did not exist in the previous version

These states may be produced automatically or overridden through frontmatter.

## Page, Title, and Heading Rules

The plugin exposes three related concepts:

- `pageState`
- `titleState`
- per-heading `heading state`

### `pageState`

`pageState` represents the aggregate diff state for the page as a whole.

Current behavior:

- If the page does not exist in the previous version, `pageState` is `new`.
- Otherwise, if the title or any visible tracked heading has a visible diff state, `pageState` is `updated`.
- Otherwise, `pageState` is `none`.

Important implication:

- A newly added nested heading does not make an existing page `new`.
- It makes the page `updated`.

### `titleState`

`titleState` controls the page title sign.

Current behavior:

- If the page has an actual level-1 heading section, `titleState` is based on that level-1 section’s direct content.
- Otherwise, `titleState` is based on the page title area content.
- Child heading changes do not propagate into `titleState`.

### Heading state

Each tracked heading receives its own state.

Current behavior:

- If the heading does not exist in the previous version, it is `new`.
- If the heading exists and its own direct content changed, it is `updated`.
- Otherwise, it is `none`.

Tracked headings are controlled by `headingLevels`.

## Section Comparison Rules

The plugin uses the following comparison rules.

### Section boundaries

A heading section is bounded by:

- the heading itself
- up to, but not including, the next heading

This means a parent heading does not absorb the content of its child headings.

### Parent and child behavior

Child changes do not automatically propagate upward.

Examples:

- If only `### A-1` changes, `## A` remains `none`.
- If only intro text under `## A` changes, `## A` becomes `updated`.
- If only intro text under the page title changes, `titleState` becomes `updated`.

### Whitespace handling

By default, whitespace-only and newline-only differences are ignored.

This behavior is controlled by `ignoreWhitespace`, which defaults to `true`.

### Frontmatter-only changes

Frontmatter-only changes do not count as content updates.

The plugin compares parsed content, not frontmatter metadata, when deriving automatic content diff states.

## Frontmatter Override Contract

The plugin supports frontmatter overrides through `versionDiff`.

Example:

```yaml
---
versionDiff:
  page: updated
  headings:
    write-operations: none
    request-connection-interval-change: updated
---
```

### Supported fields

- `versionDiff.page`
- `versionDiff.headings`

### Supported values

- `auto`
- `none`
- `new`
- `updated`

### Override behavior

- `versionDiff.page` overrides both `pageState` and `titleState`.
- `versionDiff.headings` overrides the specified heading’s automatic state by heading `id`.
- If an override is missing or set to `auto`, the automatic state is used.

## Rendering Contract

The default renderer behaves as follows.

### Page headings

- Render text pills
- Default labels:
  - `NEW`
  - `UPDATED`

### Sidebar

- Render dots
- `new` and `updated` use the same default dot appearance
- Distinct state classes are still attached so custom CSS can style them differently

### TOC

- Render dots
- Uses the same default dot style as the sidebar

### Styling hooks

The renderer attaches class names for:

- base class
- target class
- state class

This allows custom styling by state and target without replacing the underlying diff logic.

## Configuration Surface

The current v1 plugin options are:

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

### Defaults

- `targets.sidebar`: `true`
- `targets.toc`: `true`
- `targets.headings`: `true`
- `headingLevels`: `[1, 2, 3]`
- `ignoreWhitespace`: `true`
- `sign.heading.type`: `'pill'`
- `sign.sidebar.type`: `'dot'`
- `sign.toc.type`: `'dot'`

## Examples

### Heading-only update

```md
# Page Title
Intro text

## A
Stable text

### A-1
Changed text
```

Expected behavior:

- `A-1`: `updated`
- `A`: `none`
- page: `updated`

### Parent and child non-propagation

```md
# Page Title
Intro text

## A
A intro

### A-1
A-1 text
```

If only `A-1 text` changes:

- `A-1`: `updated`
- `A`: `none`
- title: `none`

### Page intro change affecting title

```md
# Page Title
Changed introduction text

## A
Stable text
```

Expected behavior:

- `titleState`: `updated`
- `A`: `none`
- page: `updated`

### Frontmatter override

```yaml
---
versionDiff:
  page: none
  headings:
    a-1: updated
---
```

Expected behavior:

- page title sign is suppressed
- page aggregate state becomes `none`
- heading `a-1` is forced to `updated`

## Non-goals

The following are explicitly out of scope for the current implementation:

- comparing arbitrary version pairs
- inline text diff visualization
- hover-based change localization
- diffing sidebar structure itself as a first-class feature
- exposing internal metadata files as a guaranteed public import contract
