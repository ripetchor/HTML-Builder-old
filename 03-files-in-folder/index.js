import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const { dirname } = import.meta;
const { stdout, stderr } = process;

const readDirectory = async ({ dirName }) => {
  try {
    const pathToDir = path.resolve(dirname, dirName);

    const dirents = await readdir(pathToDir, { withFileTypes: true });

    for await (const dirent of dirents) {
      if (dirent.isFile()) {
        const pathToFile = path.resolve(pathToDir, dirent.name);

        const { ext, name } = path.parse(pathToFile);

        const { size } = await stat(pathToFile);

        stdout.write(`${name} - ${ext.slice(1)} - ${size}\n`);
      }
    }
  } catch (error) {
    stderr.write(`${error}\n`);
  }
};

readDirectory({ dirName: 'secret-folder' });
