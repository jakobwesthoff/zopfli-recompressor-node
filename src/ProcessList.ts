import ora, { Ora } from 'ora';
import logUpdate from 'log-update';
import figures from 'figures';
import chalk from 'chalk';
import * as uuid from 'uuid';

enum ProcessState {
  RUNNING,
  FINISHED,
  SKIPPED,
  ERROR,
  INFO,
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

  public logInfo(text: string): void {
    console.log(this.renderProcess({ id: uuid.v4(), text, state: ProcessState.INFO }, ''));
  }

  public logError(text: string): void {
    console.log(this.renderProcess({ id: uuid.v4(), text, state: ProcessState.ERROR }, ''));
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

  public error(id: string): void {
    const matches = this.processes.filter((candidate) => candidate.id === id);
    for (const match of matches) {
      match.state = ProcessState.ERROR;
    }
  }

  public info(id: string): void {
    const matches = this.processes.filter((candidate) => candidate.id === id);
    for (const match of matches) {
      match.state = ProcessState.INFO;
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
    this.render();
    if (this.runningTimeout) {
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
    logUpdate(processes.map((process: Process) => this.renderProcess(process, spinner)).join('\n'));
  }

  private renderProcess(process: Process, spinner: string): string {
    let symbol: string;
    if (process.state === ProcessState.FINISHED) {
      symbol = chalk.green(figures.tick) + ' ';
    } else if (process.state === ProcessState.SKIPPED) {
      symbol = chalk.yellow(figures.play) + ' ';
    } else if (process.state === ProcessState.ERROR) {
      symbol = chalk.red(figures.cross) + ' ';
    } else if (process.state === ProcessState.INFO) {
      symbol = chalk.blue(figures.info) + ' ';
    } else {
      symbol = chalk.cyan(spinner);
    }
    return `${symbol}${process.text}`;
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
