import type {
  DocSnapshot,
  GeneratedMetadata,
  NormalizedPluginOptions,
  VersionInfo,
} from '../types.js';
import { ParseCache } from './cache.js';
import { buildDiffMetadata } from './diff.js';
import { listMarkdownFiles, pathExists, writeJsonFile } from './fs.js';
import { parseDocSnapshot } from './markdown.js';
import { getRelevantVersions } from './versions.js';

async function loadVersionSnapshots(
  version: VersionInfo | undefined,
  options: NormalizedPluginOptions,
  cache: ParseCache,
): Promise<DocSnapshot[]> {
  if (!version) {
    return [];
  }
  const targetVersion = version;

  async function loadSnapshotsFromDir(docsDir: string): Promise<DocSnapshot[]> {
    if (!(await pathExists(docsDir))) {
      return [];
    }

    const files = await listMarkdownFiles(docsDir);
    const snapshots = [];

    for (const filePath of files) {
      const cached = await cache.get(filePath);

      if (cached) {
        snapshots.push(cached);
        continue;
      }

      const snapshot = await parseDocSnapshot(filePath, {
        name: targetVersion.name,
        docsDir,
      });
      await cache.set(filePath, snapshot);
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  const snapshotsById = new Map<string, DocSnapshot>();

  for (const snapshot of await loadSnapshotsFromDir(targetVersion.docsDir)) {
    snapshotsById.set(snapshot.unversionedId, snapshot);
  }

  if (targetVersion.localizedDocsDir) {
    for (const snapshot of await loadSnapshotsFromDir(
      targetVersion.localizedDocsDir,
    )) {
      snapshotsById.set(snapshot.unversionedId, snapshot);
    }
  }

  return [...snapshotsById.values()];
}

export async function generateDiffMetadata(
  options: NormalizedPluginOptions,
): Promise<GeneratedMetadata> {
  const { current, previous } = await getRelevantVersions(options);
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
