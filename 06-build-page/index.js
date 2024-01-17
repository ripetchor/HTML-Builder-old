import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const { dirname } = import.meta;

class HTMLBuilder {
  #encoding = 'utf-8';

  #rootDir = dirname;

  #distDir = 'project-dist';

  #sourceAssetsDir = 'assets';

  #distAssetsDir = 'assets';

  #sourceTemplatesDir = 'components';

  #sourceStylesDir = 'styles';

  #sourceTemplateFile = 'template.html';

  #outputHtmlFile = 'index.html';

  #cssBundleName = 'style.css';

  constructor() {
    this.setDistDir();
    this.setSourceAssetsDir();
    this.setDistAssetsDir();
    this.setSourceTemplatesDir();
    this.setSourceStylesDir();
    this.setSourceTemplateFile();
    this.setOutputHtmlFile();
    this.setCssBundleName();
  }

  setRootDir({ dirName = this.#rootDir } = {}) {
    this.#rootDir = this.#resolvePath(dirName);
    return this;
  }

  setDistDir({ dirName = this.#distDir } = {}) {
    this.#distDir = this.#resolvePath(dirName);
    return this;
  }

  setSourceAssetsDir({ dirName = this.#sourceAssetsDir } = {}) {
    this.#sourceAssetsDir = this.#resolvePath(dirName);
    return this;
  }

  setDistAssetsDir({ dirName = this.#distAssetsDir } = {}) {
    this.#distAssetsDir = this.#resolvePath(this.#distDir, dirName);
    return this;
  }

  setSourceTemplatesDir({ dirName = this.#sourceTemplatesDir } = {}) {
    this.#sourceTemplatesDir = this.#resolvePath(dirName);
    return this;
  }

  setSourceStylesDir({ dirName = this.#sourceStylesDir } = {}) {
    this.#sourceStylesDir = this.#resolvePath(dirName);
    return this;
  }

  setSourceTemplateFile({ fileName = this.#sourceTemplateFile } = {}) {
    this.#sourceTemplateFile = this.#resolvePath(fileName);
    return this;
  }

  setOutputHtmlFile({ fileName = this.#outputHtmlFile } = {}) {
    this.#outputHtmlFile = fileName;
    return this;
  }

  setCssBundleName({ cssBundleName = this.#cssBundleName } = {}) {
    this.#cssBundleName = this.#resolvePath(this.#distDir, cssBundleName);
    return this;
  }

  async build() {
    await mkdir(this.#distDir, { recursive: true });

    await this.#clearDirectory({ dirName: this.#distDir });

    this.#createOutputHTML();

    this.#mergeStyles();

    this.#copyDir({
      srcDir: this.#sourceAssetsDir,
      destDir: this.#distAssetsDir,
    });
  }

  async #createOutputHTML() {
    try {
      const templateFile = await readFile(this.#sourceTemplateFile, {
        encoding: this.#encoding,
      });

      const templatesData = await this.#getTemplatesData();

      await writeFile(
        this.#resolvePath(this.#distDir, this.#outputHtmlFile),
        templateFile.replace(
          /{{[a-z]+}}/g,
          (match) => templatesData[match] || '',
        ),
        { encoding: this.#encoding },
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  async #mergeStyles() {
    try {
      const writeStream = createWriteStream(this.#cssBundleName, {
        encoding: this.#encoding,
      });

      const dirents = await readdir(this.#sourceStylesDir, {
        withFileTypes: true,
      });

      const cssFiles = dirents.filter(
        (dirent) => dirent.isFile() && dirent.name.endsWith('.css'),
      );

      for await (const file of cssFiles) {
        const pathToFile = this.#resolvePath(this.#sourceStylesDir, file.name);
        const readStream = createReadStream(pathToFile, { encoding: 'utf-8' });
        readStream.pipe(writeStream);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async #clearDirectory({ dirName }) {
    try {
      const dirents = await readdir(dirName, { withFileTypes: true });

      const direntsPromises = dirents.map(async (dirent) => {
        const direntPath = path.resolve(dirName, dirent.name);

        if (dirent.isFile()) {
          return await unlink(direntPath);
        }

        if (dirent.isDirectory()) {
          return await rm(direntPath, { recursive: true });
        }
      });

      return await Promise.all(direntsPromises);
    } catch (error) {
      throw new Error(error);
    }
  }

  async #copyFile({ srcFile, destFile }) {
    try {
      const readStream = createReadStream(srcFile);
      const writeStream = createWriteStream(destFile);

      return await pipeline(readStream, writeStream);
    } catch (error) {
      throw new Error(error);
    }
  }

  async #copyDir({ srcDir, destDir }) {
    try {
      await mkdir(destDir, { recursive: true });

      const dirents = await readdir(srcDir, { withFileTypes: true });

      for await (const dirent of dirents) {
        const pathToSourceDirent = this.#resolvePath(srcDir, dirent.name);
        const pathToDestDirent = this.#resolvePath(destDir, dirent.name);

        if (dirent.isFile()) {
          await this.#copyFile({
            srcFile: pathToSourceDirent,
            destFile: pathToDestDirent,
          });
        }

        if (dirent.isDirectory()) {
          await this.#copyDir({
            srcDir: pathToSourceDirent,
            destDir: pathToDestDirent,
          });
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async #getTemplatesData() {
    try {
      const templatesData = {};

      const templateFiles = await readdir(this.#sourceTemplatesDir);

      const htmlFiles = templateFiles.filter((file) => file.endsWith('.html'));

      for await (const file of htmlFiles) {
        const pathToFile = this.#resolvePath(this.#sourceTemplatesDir, file);
        const { name } = path.parse(pathToFile);
        const html = await readFile(pathToFile, { encoding: this.#encoding });
        templatesData[`{{${name}}}`] = html;
      }

      return templatesData;
    } catch (error) {
      throw new Error(error);
    }
  }

  #resolvePath(...paths) {
    return path.resolve(this.#rootDir, ...paths);
  }
}

const htmlBuilder = new HTMLBuilder();

htmlBuilder.build();
