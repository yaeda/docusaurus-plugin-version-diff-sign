import path from 'node:path';
import {PLUGIN_NAME} from './constants.js';
import {
  generateDiffMetadata,
  writeMetadataFile,
} from './core/metadata.js';
import {normalizeOptions, toPublicOptions} from './options.js';
import type {GeneratedMetadata, PluginGlobalData, PluginUserOptions} from './types.js';

interface PluginContext {
  siteDir: string;
}

interface ContentLoadedActions {
  setGlobalData(data: PluginGlobalData): void;
}

interface ContentLoadedArgs {
  content: GeneratedMetadata;
  actions: ContentLoadedActions;
}

function formatDurationMs(durationMs: number): string {
  return `${durationMs.toFixed(durationMs >= 100 ? 0 : 1)}ms`;
}

function logInfo(message: string): void {
  console.info(`[INFO] [${PLUGIN_NAME}] ${message}`);
}

const packageDir = __dirname;
const themePath = path.join(packageDir, 'theme');
const clientStylesPath = path.join(packageDir, 'client', 'styles.css');
const defaultMetadataFilePath = (siteDir: string) =>
  path.resolve(siteDir, '.docusaurus', 'version-diff-metadata.json');
const defaultRendererPath = path.join(
  themePath,
  'VersionDiffSign',
  'index.js',
);

export default function versionDiffPlugin(
  context: PluginContext,
  userOptions: PluginUserOptions = {},
) {
  const options = normalizeOptions(context.siteDir, userOptions);
  const metadataFilePath = defaultMetadataFilePath(context.siteDir);

  return {
    name: PLUGIN_NAME,
    async loadContent() {
      const startedAt = performance.now();
      const metadata = await generateDiffMetadata(options);

      await writeMetadataFile(metadataFilePath, metadata);
      const durationMs = performance.now() - startedAt;
      const docCount = Object.keys(metadata.docs).length;

      logInfo(
        `Prepared metadata in ${formatDurationMs(durationMs)} (${docCount} docs, current=${metadata.currentVersionName}, previous=${metadata.previousVersionName ?? 'none'})`,
      );
      return metadata;
    },
    async contentLoaded({content, actions}: ContentLoadedArgs) {
      actions.setGlobalData({
        metadata: content,
        options: toPublicOptions(options),
      });
    },
    getThemePath() {
      return themePath;
    },
    getClientModules() {
      return [clientStylesPath];
    },
    getPathsToWatch() {
      return [
        `${options.paths.versionedDocsDir}/**/*.{md,mdx}`,
        options.paths.versionsFile,
      ];
    },
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@version-diff-sign-renderer-heading':
              options.sign.heading.componentPath ?? defaultRendererPath,
            '@version-diff-sign-renderer-sidebar':
              options.sign.sidebar.componentPath ?? defaultRendererPath,
            '@version-diff-sign-renderer-toc':
              options.sign.toc.componentPath ?? defaultRendererPath,
          },
        },
      };
    },
  };
}
