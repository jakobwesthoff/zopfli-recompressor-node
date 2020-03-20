import ora, { Ora } from 'ora';
import logUpdate from 'log-update';
import logSymbols from 'log-symbols';
import chalk from 'chalk';

enum ProcessState {
  RUNNING,
  FINISHED,
  SKIPPED,
}

interface Process {
  id: string;
  text: string;
  state: ProcessState;
}

export class ProcessList {
  private static DELAY: number = 50;

  private spinner: Ora;

  private runningTimeout: number | undefined = undefined;

  private processes: Process[] = [];

  constructor() {
    this.spinner = ora();
  }

  public add(id: string, text: string): void {
    this.processes.push({ id, text, state: ProcessState.RUNNING });
  }

  public finish(id: string): void {
    const matches = this.processes.filter((candidate) => candidate.id === id);
    for (const match of matches) {
      match.state = ProcessState.FINISHED;
    }
  }

  public skip(id: string): void {
    const matches = this.processes.filter((candidate) => candidate.id === id);
    for (const match of matches) {
      match.state = ProcessState.SKIPPED;
    }
  }

  public update(id: string, text: string): void {
    const matches = this.processes.filter((candidate) => candidate.id === id);
    for (const match of matches) {
      match.text = text;
    }
  }

  public start(): void {
    this.runningTimeout = setInterval(() => this.render(), ProcessList.DELAY) as any;
  }

  public stop(): void {
    if (this.runningTimeout) {
      this.render();
      clearTimeout(this.runningTimeout);
      this.runningTimeout = undefined;
    }
  }

  private render(): void {
    const frame = this.spinner.frame();
    const finishedProcesses = this.isolateFinishedInRow();

    if (finishedProcesses.length > 0) {
      this.renderProcesses(finishedProcesses, frame);
      logUpdate.done();
    }

    this.renderProcesses(this.processes, frame);
  }

  private renderProcesses(processes: Process[], spinner: string): void {
    logUpdate(
      processes
        .map((process: Process) => {
          let symbol: string;
          if (process.state === ProcessState.FINISHED) {
            symbol = chalk.green(logSymbols.success) + ' ';
          } else if (process.state === ProcessState.SKIPPED) {
            symbol = chalk.yellow(logSymbols.success);
          } else {
            symbol = chalk.blue(spinner);
          }
          return `${symbol}${process.text}`;
        })
        .join('\n'),
    );
  }

  private isolateFinishedInRow(): Process[] {
    let splitPoint = 0;

    for (let i = 0; i < this.processes.length; i++) {
      if (this.processes[i].state !== ProcessState.RUNNING) {
        splitPoint = i + 1;
      } else {
        break;
      }
    }

    const finished = this.processes.slice(0, splitPoint);
    this.processes = this.processes.slice(splitPoint);

    return finished;
  }
}
