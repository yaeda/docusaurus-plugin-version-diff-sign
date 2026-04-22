# Architecture of `docusaurus-plugin-version-diff-sign`

## Overview

The plugin is organized as a build-time metadata generator plus a runtime theme integration layer.

High-level pipeline:

```text
source docs
  -> parse into snapshots
  -> reuse parse cache when valid
  -> compare current snapshots with previous snapshots
  -> generate metadata
  -> expose metadata through Docusaurus global data
  -> render signs in theme overrides
```

This split keeps diff logic out of the runtime rendering path. Runtime components look up generated metadata instead of re-parsing or re-diffing content in the browser.

## Main Subsystems

### Option normalization

This subsystem:

- accepts user options from the Docusaurus config
- applies defaults
- resolves relative paths
- exposes a reduced public option shape to runtime code

Responsibilities:

- keep build-only path configuration separate from runtime-facing option data
- ensure target flags, heading levels, and styling hooks always have normalized values

### Version discovery

This subsystem determines:

- the current version
- the immediately previous version
- the filesystem locations needed to read the relevant docs

Current design boundary:

- only the current and immediately previous versions are relevant

### Markdown parsing

This subsystem converts each source doc into a `snapshot`.

A snapshot contains normalized information used later for diffing, such as:

- document identity
- title
- frontmatter
- route-independent document path
- page-level comparable content
- title-level comparable content
- section records for headings

Section extraction is intentionally local:

- each heading section ends at the next heading
- child section content is not folded into parent sections

This is the key architectural choice behind non-propagating parent behavior.

### Parse cache

The parse cache stores per-file `snapshot` data keyed by source file path and source hash.

Its job is to avoid reparsing unchanged markdown files across builds.

Important properties:

- cache reuse is based on source hash
- cache invalidates globally when schema version changes
- cache invalidates globally when logic version changes
- cache contents are designed to be route-independent and render-option-independent

That last point matters because parse cache should remain reusable even if:

- `headingLevels` changes
- target rendering changes
- styling changes
- route assembly details are resolved later during metadata generation

### Diff metadata generation

This subsystem takes current and previous `snapshot` sets and produces final `metadata`.

Metadata is the runtime-ready structure used by the theme layer.

It computes:

- `pageState`
- `titleState`
- per-heading `heading state`
- permalink lookup indexes

The diff logic applies:

- heading matching by heading `id`
- document matching by `unversionedId`
- optional whitespace-insensitive comparison
- frontmatter override application

The output is persisted as a generated metadata file and also passed into Docusaurus global data.

### Runtime data access

Runtime code does not inspect source docs.

Instead, it:

- reads plugin global data
- resolves the current doc by permalink
- maps sidebar items to doc metadata
- exposes helper utilities for state visibility and class name composition

This layer acts as a boundary between generated `metadata` and renderer components.

### Theme rendering

Theme overrides are responsible only for presentation and metadata lookup.

Current rendering responsibilities:

- page title and markdown heading decoration
- sidebar doc link decoration
- TOC item decoration
- default renderer output for pills and dots

The renderer is intentionally thin:

- diff logic stays in build-time code
- state lookup stays in runtime helper code
- visual output stays in theme components and CSS

## Data Model

### Snapshot

A `snapshot` is a build-time parsed representation of one source doc.

Conceptually it contains:

- source path
- version name
- relative path
- `unversionedId`
- title
- frontmatter
- comparable page content
- comparable title content
- route-independent document path
- parsed heading sections with:
  - heading `id`
  - heading title
  - heading level
  - comparable section content

The `snapshot` is an internal structure optimized for comparison and cache reuse.

### Metadata

`metadata` is the final generated structure used by runtime rendering.

Conceptually it contains:

- schema version
- generation timestamp
- current and previous version names
- doc entries keyed by version plus `unversionedId`
- permalink-to-doc lookup map

Each doc entry contains:

- doc identity
- source path
- permalink
- `pageState`
- `titleState`
- title
- heading map with per-heading `heading state`

### Snapshot vs metadata

The distinction is intentional:

- `snapshot` is parse-oriented and cacheable
- `metadata` is render-oriented and lookup-friendly

The plugin should keep these concerns separate so parser changes and renderer changes stay loosely coupled.

## Rendering Flow

### Build-time flow

1. Normalize plugin options.
2. Discover current and previous versions.
3. Load or parse `snapshot` data for relevant docs.
4. Save parse cache.
5. Generate final `metadata`.
6. Write generated metadata to disk.
7. Inject metadata and public options into Docusaurus global data.

### Runtime flow

1. Read plugin global data.
2. Resolve the current doc entry from the current permalink.
3. Resolve sidebar items from their href values when needed.
4. Read `pageState`, `titleState`, or per-heading `heading state`.
5. Render pills or dots with target- and state-specific class names.

### Theme responsibilities

Theme components should:

- ask for metadata
- decide whether a sign is visible for the target
- render the appropriate visual marker

Theme components should not:

- parse markdown
- compute diffs
- mutate metadata

## Cache Behavior

The cache is designed around correctness first and speed second.

### Reuse rule

A cached `snapshot` is reused only if:

- the file exists in cache
- the current source hash matches the cached source hash
- the cache schema version matches
- the cache logic version matches

### Invalidation rule

The cache is dropped when the plugin changes in a way that would make older `snapshot` data unsafe.

Examples:

- changing snapshot structure
- changing section extraction semantics
- changing comparable content generation

### Independence from route and render options

The parse cache does not try to encode final rendering choices.

It intentionally avoids depending on:

- selected targets
- CSS class names
- renderer choice
- route assembly details that are easier to derive later

This keeps cache reuse broad and avoids invalidating cache for purely presentational changes.

## Current Extension Points

The current implementation supports two main extension mechanisms.

### Renderer replacement

- `sign.heading.componentPath`
- `sign.sidebar.componentPath`
- `sign.toc.componentPath`
- let consumers replace the default sign renderer per target

### Frontmatter overrides

- `versionDiff.page`
- `versionDiff.headings`

These allow explicit state overrides when automatic diff behavior is not the desired presentation.

## Known Design Boundaries

The current design deliberately stops short of several more complex features.

- It compares only the current version to the immediately previous version.
- It aggregates page state from visible title and heading states rather than from every raw content difference.
- It does not localize exact changed spans for hover highlighting or inline diff visualization.
- It treats generated metadata as an internal runtime contract, not as a stable deep-import API.

These boundaries keep the implementation compact, predictable, and maintainable for a v1 package extraction.
