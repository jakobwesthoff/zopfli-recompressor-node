import async from 'async';
import execa from 'execa';
import glob from 'glob-promise';
import path from 'path';
import { ProcessList } from './ProcessList';
import { padToLength } from './stringFormat';

export interface ProcessorOptions {
  extension: string;
  threads: number;
  iterations: number;
  advzip: string;
}

export class Recompressor {
  public static readonly DEFAULT_OPTIONS: ProcessorOptions = {
    extension: 'zip',
    threads: 4,
    iterations: 1,
    advzip: 'advzip',
  };

  private options: ProcessorOptions;

  constructor(
    private processList: ProcessList,
    private path: string,
    options: ProcessorOptions = Recompressor.DEFAULT_OPTIONS,
  ) {
    this.options = {
      ...Recompressor.DEFAULT_OPTIONS,
      ...options,
    };
  }

  public async run(): Promise<void> {
    this.processList.start();

    const files = await this.gatherFiles();
    await this.recompressFiles(files);

    this.processList.stop();
  }

  private async gatherFiles(): Promise<string[]> {
    this.processList.add('file-list', 'Gathering files to process...');
    const files = (await glob(`**/*.${this.options.extension}`, { cwd: this.path })).map(
      (file) => `${this.path}/${file}`,
    );
    this.processList.update('file-list', `Found ${files.length} archives to recompress.`);
    this.processList.finish('file-list');

    return files;
  }

  private async recompressFiles(files: string[]): Promise<void> {
    const padLength = files.length.toString().length;
    await async.eachOfLimit(files, this.options.threads, async (file: string, index: number) => {
      const percentage = Math.round(((index + 1) / files.length) * 100);
      const basefile = path.basename(file);
      const paddedIndex = padToLength((index + 1).toString(), padLength, '0');

      this.processList.add(file, `[${percentage}%] (${paddedIndex}/${files.length}) ${basefile}`);

      const { command, args } = this.buildAdvZipCommandline(file);
      await execa(command, args);

      this.processList.finish(file);
    });
  }

  private buildAdvZipCommandline(file: string): { command: string; args: string[] } {
    return {
      command: this.options.advzip,
      args: ['--recompress', '-4', `--iter=${this.options.iterations}`, file],
    };
  }
}
