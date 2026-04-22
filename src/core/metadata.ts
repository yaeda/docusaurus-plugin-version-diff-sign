import {ParseCache} from './cache.js';
import {buildDiffMetadata} from './diff.js';
import {
  listMarkdownFiles,
  pathExists,
  writeJsonFile,
} from './fs.js';
import {parseDocSnapshot} from './markdown.js';
import {getRelevantVersions} from './versions.js';
import type {
  DocSnapshot,
  GeneratedMetadata,
  NormalizedPluginOptions,
  VersionInfo,
} from '../types.js';

async function loadVersionSnapshots(
  version: VersionInfo | undefined,
  options: NormalizedPluginOptions,
  cache: ParseCache,
): Promise<DocSnapshot[]> {
  if (!version || !(await pathExists(version.docsDir))) {
    return [];
  }

  const files = await listMarkdownFiles(version.docsDir);
  const snapshots = [];

  for (const filePath of files) {
    const cached = await cache.get(filePath);

    if (cached) {
      snapshots.push(cached);
      continue;
    }

    const snapshot = await parseDocSnapshot(
      filePath,
      version,
    );
    await cache.set(filePath, snapshot);
    snapshots.push(snapshot);
  }

  return snapshots;
}

export async function generateDiffMetadata(
  options: NormalizedPluginOptions,
): Promise<GeneratedMetadata> {
  const {current, previous} = await getRelevantVersions(options);
  const cache = await ParseCache.load(options.paths.cacheFile);
  const [currentDocs, previousDocs] = await Promise.all([
    loadVersionSnapshots(current, options, cache),
    loadVersionSnapshots(previous, options, cache),
  ]);

  await cache.save();

  return buildDiffMetadata({
    currentVersion: current,
    previousVersion: previous,
    currentDocs,
    previousDocs,
    options,
  });
}

export async function writeMetadataFile(
  filePath: string,
  metadata: GeneratedMetadata,
): Promise<void> {
  await writeJsonFile(filePath, metadata);
}
