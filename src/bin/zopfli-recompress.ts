import { ProcessList } from '../ProcessList';
import { Recompressor } from '../Recompressor';

(async () => {
  console.log(process.argv);
  const processList = new ProcessList();
  const recompressor = new Recompressor(processList, process.argv[3], process.argv[4]);

  await recompressor.run();
})();
