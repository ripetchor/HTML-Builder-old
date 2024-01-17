import { createWriteStream } from 'node:fs';
import path from 'node:path';

const { dirname } = import.meta;
const { stdout, stdin, stderr, exit } = process;

const writeFile = ({ fileName, readStream = stdin }) => {
  const pathToFile = path.resolve(dirname, fileName);

  const writeStream = createWriteStream(pathToFile);

  stdout.write('Hello!\n');

  readStream.on('data', (data) => {
    const input = data.toString().trim();

    if (input === 'exit' || input === 'EXIT') {
      exit();
    }

    writeStream.write(data);
  });

  readStream.on('error', (error) => {
    stderr.write(error);
  });

  process.on('SIGINT', () => exit());

  process.on('exit', () => stdout.write('Goodbye!\n'));
};

writeFile({ fileName: 'user-input.txt' });
