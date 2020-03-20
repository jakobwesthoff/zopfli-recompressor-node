import async from 'async';
import execa from 'execa';
import glob from 'glob-promise';
import path from 'path';
import { ProcessList } from './ProcessList';
import { padToLength } from './stringFormat';
import { ProgressLog } from './ProgressLog';
import nodeCleanup from 'node-cleanup';

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

  private encounteredErrors: string[] = [];

  constructor(
    private processList: ProcessList,
    private progressLog: ProgressLog,
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

    nodeCleanup((code, signal) => this.cleanup(code, signal));

    await this.progressLog.init();

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

      if (this.progressLog.hasBeenProcessed(file)) {
        this.processList.skip(file);
        return;
      }

      const { command, args } = this.buildAdvZipCommandline(file);
      try {
        const { stdout } = await execa(command, args);
        await this.progressLog.finished(file, stdout);
        this.processList.finish(file);
      } catch (error) {
        const indentedError = error.stderr
          .split(/\r\n|\r|\n/)
          .map((line: string) => `  ${line}`)
          .join('\n');
        this.encounteredErrors.push(`${file}:\n${indentedError}`);
        this.processList.error(file);
      }
    });
  }

  private buildAdvZipCommandline(file: string): { command: string; args: string[] } {
    return {
      command: this.options.advzip,
      args: ['--recompress', '-4', `--iter=${this.options.iterations}`, file],
    };
  }

  private cleanup(_code: number | null, _signal: string | null): void {
    this.processList.stop();

    this.processList.logInfo('Finishing up...');

    if (this.encounteredErrors.length > 0) {
      this.processList.logInfo('The following errors were encountered during the recompression run:');
      for (let i = 0; i < this.encounteredErrors.length; i++) {
        const error = this.encounteredErrors[i];
        this.processList.logError(error);
      }
      this.processList.logInfo('Everything else was processed sucessfully!');
    }
  }
}
