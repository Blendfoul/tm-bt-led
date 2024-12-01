/*
 * Game client for F1 20xx
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 *
 * Copyright (c) 2021 Markus Plutka
 */

process.env = {
  ...process.env,
  DEBUG: 'noble*',
};

// @ts-expect-error - no types available
import { getProcesses, ProcessInfo } from 'node-processlist';
import { TmBTLed } from './tmBTLed';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AbstractClient from './abstractClient';
import { setup } from './setup';

import supportedGames from './games/supported-games.config.json';
import { Game } from './types';
import { testLauncher } from './test';

type Args = {
  game?: string;
  test?: boolean;
  setup?: boolean;
  message?: string;
  messagelights?: boolean;
};

const argv = yargs(hideBin(process.argv)).argv as Args;

const excludedTasks = [
  'svchost.exe',
  'explorer.exe',
  'chrome.exe',
  'runtimebroker.exe',
  'conhost.exe',
  'csrss.exe',
  'cmd.exe',
  'wininit.exe',
  'winlogon.exe',
  'dllhost.exe',
  'services.exe',
];

process.on('uncaughtException', (exception) => {
  console.error(exception);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const gameExecutableMap = new Map<string, Game>();
supportedGames.forEach((game: Game) => {
  game.bin.forEach((exe) => {
    gameExecutableMap.set(exe.toLowerCase(), game);
  });
});

class Launcher {
  runningGame: any;
  currentClient: AbstractClient | null;
  tmBtLed: TmBTLed;
  constructor() {
    this.runningGame = undefined;
    this.currentClient = null;

    if (argv.game) {
      this.runningGame = supportedGames.find((game) => game.name === argv.game) || null;
      this.tmBtLed = new TmBTLed(this.runStandalone);
    } else {
      this.tmBtLed = new TmBTLed(this.watchForGameChanges);
    }
  }

  runStandalone = () => {
    if (this.runningGame) {
      this.handleGameChange();
    }
  };

  watchForGameChanges = async () => {
    try {
      const tasks: ProcessInfo[] = await getProcesses();
      const taskNames = tasks
        .map((t) => t.name.toLowerCase())
        .filter((name) => !excludedTasks.includes(name));

      let runningGame = null;
      for (const taskName of taskNames) {
        if (gameExecutableMap.has(taskName)) {
          runningGame = gameExecutableMap.get(taskName);
          break;
        }
      }

      if (runningGame !== this.runningGame) {
        this.runningGame = runningGame;
        this.handleGameChange();
      }
    } catch (error) {
      console.error('Error watching for game changes:', error);
    } finally {
      setTimeout(this.watchForGameChanges, 2500);
    }
  };

  handleGameChange = () => {
    if (this.currentClient) {
      this.currentClient.stopClient();
      this.currentClient = null;
    }

    this.tmBtLed.reset();

    if (!this.runningGame) {
      console.log('No game running');
      if (argv.messagelights) {
        this.tmBtLed.setAllColors(true);
        this.tmBtLed.setRevLights(50);
      }
      if (argv.message) {
        this.tmBtLed.setPerformanceMode();
        this.tmBtLed.showTicker(argv.message);
      } else {
        this.tmBtLed.showTemporary('NO  GAME', '');
        this.tmBtLed.setPowerSaveMode();
      }
    } else {
      console.log('Detected game:', this.runningGame.name.toUpperCase());

      this.tmBtLed.showTemporary(this.runningGame.title[0], this.runningGame.title[1]);
      this.tmBtLed.setPerformanceMode();

      try {
        const Client = require(`${__dirname}/clients/${this.runningGame.name}`);
        this.currentClient = new Client(this.tmBtLed);
        this.currentClient?.startClient();
      } catch (error) {
        console.error(`Error loading client for ${this.runningGame.name}:`, error);
      }
    }
  };
}

async function main() {
  console.log('Starting...');
  console.debug(argv);

  switch (true) {
    case argv.test:
      console.log('Starting test...');
      testLauncher();
      break;
    case argv.setup:
      console.log('Starting setup...');
      await setup();
      break;
    default:
      new Launcher();
      break;
  }
}

main();
