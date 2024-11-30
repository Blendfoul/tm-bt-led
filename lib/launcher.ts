/*
 * Game client for F1 20xx
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 *
 * Copyright (c) 2021 Markus Plutka
 */

// @ts-expect-error - no types available
import { getProcesses, ProcessInfo } from 'node-processlist';
import { TmBTLed, Setup } from './tmBTLed';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AbstractClient from './abstractClient';

type Args = {
  game?: string;
  test?: boolean;
  setup?: boolean;
  message?: string;
  messagelights?: boolean;
};

const argv = yargs(hideBin(process.argv)).argv as Args;

const supportedGames = [
  {
    name: 'dump_udp',
    bin: [],
    title: ['DMPS', '   0'],
  },
  {
    name: '_template',
    bin: [],
    title: ['TEMP', 'LATE'],
  },
  {
    name: 'assetto',
    bin: ['acc.exe', 'assettocorsa.exe'],
    title: ['ASSETTO', 'CORSA'],
  },
  {
    name: 'f1',
    bin: [
      'f1_2019.exe',
      'f1_2019_dx12.exe',
      'f1_2020.exe',
      'f1_2020_dx12.exe',
      'f1_2021_dx12.exe',
      'f1_2022_dx12.exe',
      'f1_23.exe',
      'f1_24.exe',
    ],
    title: [' F1 ', '20XX'],
  },
  {
    name: 'dirt',
    bin: ['dirt3_game.exe', 'drt4.exe', 'drt.exe', 'dirtrally2.exe', 'gridlegends.exe'],
    title: ['DIRT', 'RALLY'],
  },
  {
    name: 'forza',
    bin: ['forzamotorsport7.exe', 'forzahorizon4.exe', 'forzahorizon5.exe'],
    title: [' FOR', 'ZA  '],
  },
  {
    name: 'projectcars2',
    bin: ['ams2avx.exe', 'ams2.exe', 'pcars3.exe', 'pcars3avx.exe', 'pcars2.exe', 'pcars2avx.exe'],
    title: ['PROJECT', 'CARS 2'],
  },
  {
    name: 'iracing',
    bin: ['iRacingUI.exe', 'iRacingSim64DX11.exe'],
    title: ['IRAC', 'ING'],
  },
  {
    name: 'rF2',
    bin: ['rFactor2.exe'],
    title: ['RFAC', 'TOR2'],
  },
  {
    name: 'raceroom',
    bin: ['RRRE.exe', 'RRRE64.exe'],
    title: ['RACE', 'ROOM'],
  },
  {
    name: 'ets2',
    bin: ['eurotrucks2.exe'],
    title: ['EURO', 'TS 2'],
  },
];

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

const gameExecutableMap = new Map();
supportedGames.forEach((game) => {
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
        this.tmBtLed.setRevLights(100);
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

class Test {
  revReversed: boolean;
  revPercent: number;
  tmBtLed: TmBTLed;
  constructor() {
    this.revReversed = false;
    this.revPercent = 0;
    this.tmBtLed = new TmBTLed(this.start);
  }

  start = () => {
    this.tmBtLed.setPerformanceMode();
    setInterval(() => {
      this.tmBtLed.setRpm(Math.floor(Math.random() * 14001), false);
      this.tmBtLed.setTime(Math.floor(Math.random() * 5001), true);
      this.tmBtLed.setGear(Math.floor(Math.random() * 10));
      if (this.revReversed) {
        this.revPercent -= 3;
        if (this.revPercent < 0) {
          this.revPercent = 0;
          this.revReversed = !this.revReversed;
        }
      } else {
        this.revPercent += 3;
        if (this.revPercent > 100) {
          this.revPercent = 100;
          this.revReversed = !this.revReversed;
        }
      }
      this.tmBtLed.setRevLightsWithoutBlue(this.revPercent);
      this.tmBtLed.setAllFlashing(true);
      this.tmBtLed.setRevLightsBlueFlashing(true);
    }, 1000 / 60);
  };
}

let main = null;

console.log(argv);

if (argv.test) {
  main = new Test();
} else if (argv.setup) {
  main = new Setup();
} else {
  main = new Launcher();
}
