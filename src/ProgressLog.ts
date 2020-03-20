import { exists, isReadable } from './FileAccess';
import * as fse from 'fs-extra';

export class ProgressLog {
  public static readonly STATUS_PREFIX = '## PROCESS LOG: ';

  private alreadyProcessed: Set<string> = new Set();

  constructor(private path: string | undefined) {}

  public async init(): Promise<void> {
    if (this.path === undefined) {
      return;
    }

    if (await exists(this.path)) {
      if (!(await isReadable(this.path))) {
        throw new Error(`The progress file ${this.path} exists, but is not readable.`);
      }
      // Read config
      const content = await fse.readFile(this.path, 'utf-8');
      const lines = content.split(/\r\n|\r|\n/);
      const statusLines = lines.filter(
        (candidate: string) => candidate.substr(0, ProgressLog.STATUS_PREFIX.length) === ProgressLog.STATUS_PREFIX,
      );

      for (const statusLine of statusLines) {
        const data = statusLine.substr(ProgressLog.STATUS_PREFIX.length);
        this.alreadyProcessed.add(data);
      }
    } else {
      // Create empty file
      await fse.ensureFile(this.path);
    }
  }

  public async finished(file: string, processOutput: string): Promise<void> {
    this.alreadyProcessed.add(file);
    await this.writeLog(file, processOutput);
  }

  public hasBeenProcessed(file: string): boolean {
    return this.alreadyProcessed.has(file);
  }

  private async writeLog(file: string, processOutput: string): Promise<void> {
    if (this.path === undefined) {
      return;
    }

    await fse.appendFile(this.path, `${ProgressLog.STATUS_PREFIX}${file}\n${processOutput}\n`);
  }
}
