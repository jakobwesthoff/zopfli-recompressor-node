import { ProcessList } from '../ProcessList';
import { Recompressor } from '../Recompressor';
import meow from 'meow';
import os from 'os';
import { ProgressLog } from '../ProgressLog';

const cleanedArgv = process.argv.slice();
cleanedArgv.splice(2, 1);

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
    argv: cleanedArgv,
  },
);

if (cli.input.length !== 3) {
  cli.showHelp();
  process.exit(1);
}

(async () => {
  const processList = new ProcessList();
  const progressLog = new ProgressLog(cli.flags.log);
  const recompressor = new Recompressor(processList, progressLog, cli.input[2], { ...cli.flags });

  await recompressor.run();
})();
