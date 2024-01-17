import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const { dirname } = import.meta;
const { stdout, stderr } = process;

const readFile = async ({ fileName }) => {
  try {
    const pathToFile = path.resolve(dirname, fileName);

    const readStream = createReadStream(pathToFile, { encoding: 'utf-8' });

    await pipeline(readStream, stdout);
  } catch (error) {
    stderr.write(`${error}\n`);
  }
};

readFile({ fileName: 'text.txt' });
