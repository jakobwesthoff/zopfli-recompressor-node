import * as fs from 'fs';
import { Dirent } from 'fs';
import { flatten } from 'lodash';
import { pathToFileURL } from 'url';
import { Minimatch } from 'minimatch';

export enum ScanMode {
  FLAT,
  RECURSIVE,
}

/**
 * Due to the VFS nexe creates, we will not be able to use existing glob
 * modules like node-glob or fast-glob, as those will only read the VFS if, the
 * scanned directory is the same as the one with the executable in it:
 *
 * https://github.com/nexe/nexe/issues/711
 *
 * Fortunately there is a hack to read the "real" directory structure using a
 * fileURL: https://github.com/nexe/nexe/issues/571#issuecomment-470682485
 *
 * Thats what we are doing here. Even though this ment to implement the
 * directory scanner (globber) our selfs
 */
export class DirectoryScanner {
  public async scan(path: string, mode: ScanMode = ScanMode.RECURSIVE): Promise<string[]> {
    if (mode === ScanMode.FLAT) {
      return this.readdir(path, false) as Promise<string[]>;
    } else {
      const filesAndDirectories = (await this.readdir(path, true)) as Dirent[];
      const files = filesAndDirectories
        .filter((entry: Dirent) => entry.isFile())
        .map((entry) => `${path}/${entry.name}`);
      const directories = filesAndDirectories
        .filter((entry: Dirent) => entry.isDirectory())
        .map((entry) => `${path}/${entry.name}`);

      const directoryResults = flatten(
        await Promise.all(directories.map((directory) => this.scan(directory, ScanMode.RECURSIVE))),
      );

      return [...directoryResults, ...files];
    }
  }

  public async glob(path: string, pattern: string, mode: ScanMode = ScanMode.RECURSIVE): Promise<string[]> {
    const minimatchPattern = `${this.escapeGlobPatterns(path)}/${pattern}`;
    console.log(minimatchPattern);
    const matcher = new Minimatch(minimatchPattern, { nocase: true, matchBase: false });
    return (await this.scan(path, mode)).filter((candidate: string) => matcher.match(candidate));
  }

  public escapeGlobPatterns(input: string): string {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/\?/g, '\\?')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\)/g, '\\)')
      .replace(/\(/g, '\\(')
      .replace(/\!/g, '\\!');
  }

  private readdir(path: string, withFileTypes: boolean): Promise<string[] | Dirent[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(
        pathToFileURL(path),
        { encoding: 'utf8', withFileTypes: (withFileTypes === true ? true : undefined) as any },
        (error: NodeJS.ErrnoException | null, files: string[] | Dirent[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(files);
          }
        },
      );
    });
  }
}
