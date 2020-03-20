import { ProcessList } from './ProcessList';
import glob from 'glob-promise';
import async from 'async';
import execa from 'execa';
import path from 'path';

export class Recompressor {
  constructor(private processList: ProcessList, private path: string, private extension: string) {}

  public async run(): Promise<void> {
    this.processList.start();

    this.processList.add('file-list', 'Gathering files to process...');
    const files = (await glob(`**/*.${this.extension}`, { cwd: this.path })).map((file) => `${this.path}/${file}`);
    this.processList.update('file-list', `Found ${files.length} archives to recompress.`);
    this.processList.finish('file-list');

    await async.eachOfLimit(files, 5, async (file: string, index: number) => {
      this.processList.add(file, `Processing ${index + 1}/${files.length}: ${path.basename(file)}`);
      await execa('advzip', ['--recompress', '-4', '--iter=1', file]);
      this.processList.finish(file);
    });

    this.processList.stop();
  }
}
