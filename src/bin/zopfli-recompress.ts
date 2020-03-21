import { ProcessList } from '../ProcessList';
import { Recompressor } from '../Recompressor';
import meow from 'meow';
import os from 'os';
import { ProgressLog } from '../ProgressLog';
import * as fse from 'fs-extra';
import * as path from 'path';
import which from 'which';
import { exists, isExecutable } from '../FileAccess';
import { DirectoryScanner } from '../DirectoryScanner';

const cli = meow(
  `
  Usage: zopfli-recompress [options] <path>

  Options:
        --extension EXT     Extension to scan for (Default: zip)
        --threads COUNT     Number of files to process simultanously (Default: number of processor cores)
        --iterations COUNT  Iteration count to use with advzip (Default: 1)
        --advzip            Name and/or path to advzip executable (Default: advzip)
        --log FILEPATH      Path to a file used to track progress. Restarting with an already existing file
                            will resume operations were they were left of.

  Other options:
    -h, --help         Show usage information

  Examples:
    $ zopfli-recompress --extension adz --threads 4 /path/to/some/compressed/adf/images
    $ zopfli-recompress --threads 8 --log /path/to/resume.log /path/to/zip/files 
`,
  {
    flags: {
      extension: {
        type: 'string',
        default: 'zip',
      },
      threads: {
        type: 'number',
        default: os.cpus().length,
      },
      iterations: {
        type: 'number',
        default: 1,
      },
      advzip: {
        type: 'string',
        default: 'advzip',
      },
      log: {
        type: 'string',
      },
    },
    autoHelp: true,
    autoVersion: true,
    pkg: JSON.parse(fse.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')),
  },
);

if (cli.input.length !== 1) {
  cli.showHelp();
  process.exit(1);
}

(async () => {
  const processList = new ProcessList();
  const progressLog = new ProgressLog(cli.flags.log);
  const scanner = new DirectoryScanner();

  let advzip: string;
  if (cli.flags.advzip.match(/\/|\\/) === null) {
    const name = cli.flags.advzip;
    // Locate the advzip executable
    try {
      advzip = await which(name, { path: process.cwd() });
    } catch (e) {
      try {
        advzip = await which(name, { path: __dirname });
      } catch (e) {
        try {
          advzip = await which(name, { path: path.dirname(process.execPath) });
        } catch (e) {
          try {
            advzip = await which(name);
          } catch (e) {
            processList.logError(`Could not locate '${name}' executable on your system.`);
            process.exit(42);
          }
        }
      }
    }
  } else {
    advzip = cli.flags.advzip;
    if (!(await exists(advzip))) {
      processList.logError(`The specified advzip executable '${advzip}' could not be found.`);
      process.exit(42);
    } else if (!(await isExecutable(advzip))) {
      processList.logError(`The specified advzip executable '${advzip}' does exist, but is not executable.`);
      process.exit(42);
    }
  }

  const recompressor = new Recompressor(processList, progressLog, scanner, cli.input[0], { ...cli.flags, advzip });
  await recompressor.run();
})();
