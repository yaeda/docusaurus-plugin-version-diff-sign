import {copyFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const libDir = path.join(rootDir, 'lib');

await mkdir(libDir, {recursive: true});
await mkdir(path.join(libDir, 'client'), {recursive: true});
await copyFile(
  path.join(rootDir, 'src', 'client', 'styles.css'),
  path.join(libDir, 'client', 'styles.css'),
);
