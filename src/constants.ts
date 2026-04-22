export const PLUGIN_NAME = 'docusaurus-plugin-version-diff-sign';
export const METADATA_SCHEMA_VERSION = 1;
export const PARSE_CACHE_SCHEMA_VERSION = 2;
export const PARSE_CACHE_LOGIC_VERSION = 2;

// Docusaurus currently stores versioned docs under "versioned_docs".
// Keep this in sync with @docusaurus/plugin-content-docs/src/constants.ts.
export const DOCUSAURUS_VERSIONED_DOCS_DIR = 'versioned_docs';

// Docusaurus currently reads version names from "versions.json".
// Keep this in sync with @docusaurus/plugin-content-docs/src/constants.ts.
export const DOCUSAURUS_VERSIONS_FILE = 'versions.json';

// Docusaurus currently prefixes versioned docs directories with "version-".
// Keep this in sync with @docusaurus/plugin-content-docs/src/versions/files.ts.
export const DOCUSAURUS_VERSION_DIR_PREFIX = 'version-';

export const DEFAULT_HEADING_LEVELS = [1, 2, 3] as const;
