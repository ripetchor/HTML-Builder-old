import { createReadStream, createWriteStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const { dirname } = import.meta;
const { stderr } = process;

const mergeStyles = async ({
  srcDir = 'styles',
  destDir = 'project-dist',
  bundleFileName = 'bundle.css',
} = {}) => {
  try {
    const pathToSrcDir = path.resolve(dirname, srcDir);
    const pathToDestDir = path.resolve(dirname, destDir);
    const pathToBundleFile = path.resolve(pathToDestDir, bundleFileName);

    const writeStream = createWriteStream(pathToBundleFile);

    const dirents = await readdir(pathToSrcDir, { withFileTypes: true });

    const cssFiles = dirents.filter(
      (dirent) => dirent.isFile() && dirent.name.endsWith('.css'),
    );

    for await (const file of cssFiles) {
      const pathToFile = path.resolve(pathToSrcDir, file.name);
      const readStream = createReadStream(pathToFile);
      readStream.pipe(writeStream);
    }
  } catch (error) {
    stderr.write(`${error}\n`);
  }
};

mergeStyles();
