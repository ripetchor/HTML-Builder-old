import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const { dirname } = import.meta;
const { stderr } = process;

const copyFile = async ({ srcFile, destFile }) => {
  try {
    const pathToSrcFile = path.resolve(dirname, srcFile);
    const pathToDestFile = path.resolve(dirname, destFile);

    const readStream = createReadStream(pathToSrcFile, { encoding: 'utf-8' });
    const writeStream = createWriteStream(pathToDestFile, {
      encoding: 'utf-8',
    });

    return await pipeline(readStream, writeStream);
  } catch (error) {
    stderr.write(`${error}\n`);
  }
};

const clearDirectory = async ({ dirName }) => {
  try {
    const pathToDir = path.resolve(dirname, dirName);

    const dirents = await readdir(pathToDir, { withFileTypes: true });

    const direntsPromises = dirents.map(async (dirent) => {
      const direntPath = path.resolve(pathToDir, dirent.name);

      if (dirent.isFile()) {
        return await unlink(direntPath);
      }

      if (dirent.isDirectory()) {
        return await rm(direntPath, { recursive: true });
      }
    });

    return Promise.all(direntsPromises);
  } catch (error) {
    stderr.write(`${error}\n`);

  }
};

const copyDirectory = async ({ srcDir, destDir = `${srcDir}-copy` }) => {
  try {
    const pathToSrcDir = path.resolve(dirname, srcDir);
    const pathToDestDir = path.resolve(dirname, destDir);

    await mkdir(pathToDestDir, { recursive: true });

    await clearDirectory({ dirName: pathToDestDir });

    const dirents = await readdir(pathToSrcDir, { withFileTypes: true });

    const direntsPromises = dirents.map(async (dirent) => {
      const srcDirent = path.resolve(pathToSrcDir, dirent.name);
      const destDirent = path.resolve(pathToDestDir, dirent.name);

      if (dirent.isFile()) {
        return await copyFile({ srcFile: srcDirent, destFile: destDirent });
      }

      if (dirent.isDirectory()) {
        return await copyDirectory({ srcDir: srcDirent, destDir: destDirent });
      }
    });

    return await Promise.all(direntsPromises);
  } catch (error) {
    stderr.write(`${error}\n`);
  }
};

copyDirectory({ srcDir: 'files' });
