import { readFile } from 'node:fs/promises';

import {
  PARSE_CACHE_LOGIC_VERSION,
  PARSE_CACHE_SCHEMA_VERSION,
} from '../constants.js';
import type {
  DocSnapshot,
  ParsedCacheEntry,
  ParsedCacheFile,
} from '../types.js';
import { pathExists, readJsonFile, writeJsonFile } from './fs.js';
import { hashContent } from './hash.js';

export class ParseCache {
  #cacheFile: string;
  #entries: Record<string, ParsedCacheEntry>;

  constructor(cacheFile: string, entries: Record<string, ParsedCacheEntry>) {
    this.#cacheFile = cacheFile;
    this.#entries = entries;
  }

  static async load(cacheFile: string): Promise<ParseCache> {
    if (!(await pathExists(cacheFile))) {
      return new ParseCache(cacheFile, {});
    }

    const parsed = await readJsonFile<ParsedCacheFile>(cacheFile);

    if (
      parsed.schemaVersion !== PARSE_CACHE_SCHEMA_VERSION ||
      parsed.logicVersion !== PARSE_CACHE_LOGIC_VERSION
    ) {
      return new ParseCache(cacheFile, {});
    }

    return new ParseCache(cacheFile, parsed.files ?? {});
  }

  async get(filePath: string): Promise<DocSnapshot | null> {
    const cached = this.#entries[filePath];

    if (!cached) {
      return null;
    }

    const currentSourceHash = hashContent(await readFile(filePath, 'utf8'));
    return currentSourceHash === cached.sourceHash ? cached.snapshot : null;
  }

  async set(filePath: string, snapshot: DocSnapshot): Promise<void> {
    const sourceHash = hashContent(await readFile(filePath, 'utf8'));
    this.#entries[filePath] = {
      sourceHash,
      snapshot,
    };
  }

  async save(): Promise<void> {
    await writeJsonFile(this.#cacheFile, {
      schemaVersion: PARSE_CACHE_SCHEMA_VERSION,
      logicVersion: PARSE_CACHE_LOGIC_VERSION,
      files: this.#entries,
    });
  }
}
