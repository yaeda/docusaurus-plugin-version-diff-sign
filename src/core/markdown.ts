import path from 'node:path';
import {readFile} from 'node:fs/promises';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import {normalizePathname} from './url.js';
import type {
  DocSectionSnapshot,
  DocSnapshot,
  VersionDiffFrontMatter,
} from '../types.js';

interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
}

interface RootNode {
  children: MdastNode[];
}

interface HeadingNode extends MdastNode {
  type: 'heading';
  depth: number;
}

function stripMarkdownFormatting(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function renderNodeText(node: MdastNode): string {
  if (!('type' in node)) {
    return '';
  }

  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => renderNodeText(child)).join('');
  }

  return '';
}

function serializeNodes(nodes: MdastNode[]): string {
  return nodes.map((node) => renderNodeText(node)).join('\n');
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/gu, '/');
}

function getBaseId(relativePath: string, frontMatter: VersionDiffFrontMatter): string {
  if (typeof frontMatter.id === 'string' && frontMatter.id.length > 0) {
    return frontMatter.id;
  }

  return path.posix.basename(relativePath, path.posix.extname(relativePath));
}

function buildUnversionedId(
  relativePath: string,
  frontMatter: VersionDiffFrontMatter,
): string {
  const normalizedRelativePath = toPosixPath(relativePath);
  const sourceDirName = path.posix.dirname(normalizedRelativePath);
  const baseId = getBaseId(normalizedRelativePath, frontMatter);

  return sourceDirName === '.' ? baseId : `${sourceDirName}/${baseId}`;
}

function buildDefaultSlug(
  relativePath: string,
  frontMatter: VersionDiffFrontMatter,
): string {
  const normalizedRelativePath = toPosixPath(relativePath);
  const sourceDirName = path.posix.dirname(normalizedRelativePath);
  const baseId = getBaseId(normalizedRelativePath, frontMatter);

  const lastSegment =
    path.posix.basename(normalizedRelativePath, path.posix.extname(normalizedRelativePath)) ===
      'index' && typeof frontMatter.id !== 'string'
      ? ''
      : baseId;

  return normalizePathname(
    [sourceDirName === '.' ? '' : sourceDirName, lastSegment]
      .filter(Boolean)
      .join('/'),
  );
}

function buildDocPath(
  relativePath: string,
  frontMatter: VersionDiffFrontMatter,
): string {
  const configuredSlug =
    typeof frontMatter.slug === 'string' && frontMatter.slug.length > 0
      ? frontMatter.slug
      : undefined;

  return configuredSlug?.startsWith('/')
    ? configuredSlug
    : configuredSlug
      ? normalizePathname(
          [
            path.posix.dirname(toPosixPath(relativePath)) === '.'
              ? ''
              : path.posix.dirname(toPosixPath(relativePath)),
            configuredSlug,
          ]
            .filter(Boolean)
            .join('/'),
        )
      : buildDefaultSlug(relativePath, frontMatter);
}

function collectSections(root: RootNode): DocSectionSnapshot[] {
  const slugger = new GithubSlugger();
  const sections: DocSectionSnapshot[] = [];
  const children = root.children;

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];

    if (node.type !== 'heading') {
      continue;
    }

    const heading = node as HeadingNode;
    const title = stripMarkdownFormatting(renderNodeText(heading));
    const id = slugger.slug(title);
    const sectionNodes = [];

    for (
      let nextIndex = index + 1;
      nextIndex < children.length;
      nextIndex += 1
    ) {
      const nextNode = children[nextIndex];

      if (nextNode.type === 'heading') {
        break;
      }

      sectionNodes.push(nextNode);
    }

    sections.push({
      id,
      title,
      level: heading.depth,
      content: serializeNodes(sectionNodes).trim(),
    });
  }

  return sections;
}

function collectLeadingNodes(root: RootNode): MdastNode[] {
  const leadingNodes: MdastNode[] = [];

  for (const node of root.children) {
    if (node.type === 'heading') {
      break;
    }

    leadingNodes.push(node);
  }

  return leadingNodes;
}

export async function parseDocSnapshot(
  filePath: string,
  version: {name: string; docsDir: string},
): Promise<DocSnapshot> {
  const rawContent = await readFile(filePath, 'utf8');
  const parsed = matter(rawContent);
  const frontMatter = (parsed.data ?? {}) as VersionDiffFrontMatter;
  const relativePath = path.relative(version.docsDir, filePath);
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .parse(parsed.content) as RootNode;
  const sections = collectSections(tree);
  const unversionedId = buildUnversionedId(relativePath, frontMatter);
  const fallbackTitle = sections.find((section) => section.level === 1)?.title;

  return {
    sourcePath: filePath,
    versionName: version.name,
    relativePath: toPosixPath(relativePath),
    unversionedId,
    title:
      typeof frontMatter.title === 'string' && frontMatter.title.length > 0
        ? frontMatter.title
        : fallbackTitle ?? unversionedId,
    frontMatter,
    pageContent: parsed.content.trim(),
    titleContent: serializeNodes(collectLeadingNodes(tree)).trim(),
    docPath: buildDocPath(relativePath, frontMatter),
    sections,
  };
}
