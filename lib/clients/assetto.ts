/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Game client for Assetto Corsa series
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 *
 * Copyright (c) 2021 Markus Plutka
 */

import { TmBTLed } from '../tmBTLed';

// @ts-expect-error - No type definitions available
import AssettoCorsaSharedMemory from '../../AssettoCorsaSharedMemory/build/Release/AssettoCorsaSharedMemory.node';
import path from 'path';
import AbstractClient from '../abstractClient';

const loadableConfigName = 'assetto.config.jsonc';

type Config = {
  leftModes: string[];
  rightModesAcc: string[];
  rightModesAssetto: string[];
  blueRevLightsIndicateShift: boolean;
  flashingRevLightsIndicateShit: boolean;
};

const defaultConfig: Config = {
  leftModes: ['SPEED', 'RPM', 'FUEL', 'TYRETEMP', 'BRAKETEMP'],
  rightModesAcc: [
    'LAPTIME',
    'DELTA',
    'LAST LAP',
    'BEST LAP',
    'PRED LAP',
    'POSITION',
    'LAP',
    'LAPS LEFT',
  ],
  rightModesAssetto: ['LAPTIME', 'LAST LAP', 'BEST LAP', 'POSITION', 'LAP', 'LAPS LEFT'],
  blueRevLightsIndicateShift: false,
  flashingRevLightsIndicateShit: true,
};

class ACC extends AbstractClient {
  maxRpm: number;
  isACC: boolean;
  refreshInterval: NodeJS.Timeout | null;
  config: Config;
  modeMapping: {
    SPEED: (onRight: boolean) => void;
    RPM: (onRight: boolean) => void;
    FUEL: (onRight: boolean) => void;
    TYRETEMP: (onRight: boolean) => void;
    BRAKETEMP: (onRight: boolean) => void;
    LAPTIME: (onRight: boolean) => void;
    DELTA: (onRight: boolean) => void;
    'LAST LAP': (onRight: boolean) => void;
    'BEST LAP': (onRight: boolean) => void;
    'PRED LAP': (onRight: boolean) => void;
    POSITION: (onRight: boolean) => void;
    LAP: (onRight: boolean) => void;
    'LAPS LEFT': (onRight: boolean) => void;
  };
  physics: any;
  statics: any;
  graphics: any;

  constructor(tmBtLed: TmBTLed) {
    if (!tmBtLed) {
      throw new Error('No TM BT Led lib found.');
    }

    super(tmBtLed);

    this.maxRpm = 0;
    this.isACC = true;
    this.refreshInterval = null;

    this.config = this.loadConfig();
    this.modeMapping = this.createModeMapping();

    this.tmBtLed.setCallbacks({
      onLeftPreviousMode: this.leftPreviousMode,
      onLeftNextMode: this.leftNextMode,
      onRightPreviousMode: this.rightPreviousMode,
      onRightNextMode: this.rightNextMode,
    });

    this.setModes(this.config.leftModes, this.config.rightModesAcc);

    AssettoCorsaSharedMemory.initMaps();
  }

  loadConfig() {
    try {
      const configPath = path.resolve(`${__dirname}/../games/${loadableConfigName}`);
      console.log('Loading custom config from:', configPath);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const customConfig = require(configPath);
      if (customConfig.leftModes && customConfig.rightModesAcc && customConfig.rightModesAssetto) {
        console.log('Loaded custom config');
        return customConfig;
      } else {
        console.warn('Custom config is missing required fields. Using default config.');
        return defaultConfig;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn('No custom config found. Using default config.');
      return defaultConfig;
    }
  }

  createModeMapping() {
    return {
      SPEED: this.showSpeed,
      RPM: this.showRpm,
      FUEL: this.showFuel,
      TYRETEMP: this.showTyreTemp,
      BRAKETEMP: this.showBrakeTemp,
      LAPTIME: this.showCurrentLap,
      DELTA: this.showDelta,
      'LAST LAP': this.showLastLap,
      'BEST LAP': this.showBestLap,
      'PRED LAP': this.showPredLap,
      POSITION: this.showPosition,
      LAP: this.showLapNumber,
      'LAPS LEFT': this.showLapsLeft,
    };
  }

  startClient() {
    if (this.refreshInterval) {
      console.warn('Client is already running.');
      return;
    }
    this.refreshInterval = setInterval(this.updateValues.bind(this), 1000 / 60); // 60 Hz
  }

  stopClient() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Stopped client refresh interval.');
    }
    AssettoCorsaSharedMemory.cleanup();
  }

  updateValues() {
    try {
      this.physics = AssettoCorsaSharedMemory.getPhysics();
      this.statics = AssettoCorsaSharedMemory.getStatics();
      this.isACC = !(this.statics.smVersion < 1.8);

      if (this.isACC) {
        this.graphics = AssettoCorsaSharedMemory.getGraphicsACC();
        this.rightModes = this.config.rightModesAcc;
      } else {
        this.graphics = AssettoCorsaSharedMemory.getGraphicsAssetto();
        this.rightModes = this.config.rightModesAssetto;
      }

      this.tmBtLed.setGear(this.physics.gear - 1);

      this.handleRevLights();
      this.handleEngineStatus();
      this.handleFlags();
      this.handleAssists();

      // Update displays based on current modes
      this.updateDisplay(this.currentLeftMode, this.leftModes, false);
      this.updateDisplay(this.currentRightMode, this.rightModes, true);
    } catch (error) {
      console.error('Error updating values:', error);
    }
  }

  handleRevLights() {
    this.tmBtLed.setRevLightsFlashing(
      this.physics.pitLimiterOn === 1 || this.graphics.isInPitLane || this.graphics.isInPit,
    );

    if (!this.tmBtLed.revLightsFlashing) {
      let rpmPercent = (this.physics.rpms / this.statics.maxRpm) * 100;

      switch (true) {
        case this.config.blueRevLightsIndicateShift:
          this.tmBtLed.setRevLightsWithoutBlue(rpmPercent);

          if (rpmPercent >= 99) {
            this.tmBtLed.setRevLightsBlueFlashing(true);
          } else {
            this.tmBtLed.setRevLightsBlueFlashing(false);
          }
          break;
        case this.config.flashingRevLightsIndicateShit:
          if (rpmPercent <= 90) {
            this.tmBtLed.setRevLights(rpmPercent);
            if (this.tmBtLed.revLightsBlueFlashing) this.tmBtLed.setRevLightsBlueFlashing(false);
            return;
          }

          this.tmBtLed.setRevLightsWithoutBlue(rpmPercent);
          this.tmBtLed.setRevLightsBlueFlashing(true, 50);
          break;
        default:
          rpmPercent = rpmPercent < 50 ? 0 : ((rpmPercent - 50) / 50) * 100;
          this.tmBtLed.setRevLights(rpmPercent >= 98 ? 100 : rpmPercent);
          break;
      }
    }
  }

  handleEngineStatus() {
    if (this.physics.isEngineRunning === 1) {
      this.tmBtLed.setGearDot(true);
    } else {
      this.tmBtLed.setGearDot(false);
    }
  }

  handleFlags() {
    switch (this.graphics.flag) {
      case 1:
        this.tmBtLed.setFlashingBlue(true);
        break;
      case 2:
        this.tmBtLed.setFlashingYellow(true);
        break;
      case 6:
      case 8:
        this.tmBtLed.setFlashingRed(true);
        break;
      default:
        this.tmBtLed.setFlashingBlue(false);
        this.tmBtLed.setFlashingYellow(false);
        this.tmBtLed.setFlashingRed(false);
        break;
    }
  }

  handleAssists() {
    const absActive = this.physics.abs > 0.1;
    const tcActive = this.physics.tc > 0.1;

    this.tmBtLed.setBlue(absActive);
    this.tmBtLed.setRed(tcActive);
    this.tmBtLed.setYellow(absActive || tcActive);
  }

  updateDisplay(currentModeIndex: number, modesArray: string[], isRightDisplay: boolean) {
    if (currentModeIndex < modesArray.length) {
      const modeKey = modesArray[currentModeIndex];
      const dataProcessor = this.modeMapping[modeKey as keyof typeof this.modeMapping];
      if (typeof dataProcessor === 'function') {
        dataProcessor.call(this, isRightDisplay);
      }
    }
  }

  // Mode Display Functions
  showSpeed(onRight: boolean) {
    this.tmBtLed.setSpeed(this.physics.speedKmh, onRight);
  }

  showRpm(onRight: boolean) {
    this.tmBtLed.setRpm(this.physics.rpms, onRight);
  }

  showFuel(onRight: boolean) {
    this.tmBtLed.setWeight(this.physics.fuel, onRight);
  }

  showTyreTemp(onRight: boolean) {
    this.tmBtLed.setTemperature(this.physics.tyreCoreTemperature, onRight);
  }

  showBrakeTemp(onRight: boolean) {
    this.tmBtLed.setTemperature(this.physics.brakeTemp, onRight);
  }

  showCurrentLap(onRight: boolean) {
    this.tmBtLed.setTime(this.graphics.iCurrentTime, onRight);
  }

  showDelta(onRight: boolean) {
    this.tmBtLed.setDiffTime(this.graphics.iDeltaLapTime, onRight);
  }

  showLastLap(onRight: boolean) {
    this.tmBtLed.setTime(this.graphics.iLastTime, onRight);
  }

  showBestLap(onRight: boolean) {
    this.tmBtLed.setTime(this.graphics.iBestTime, onRight);
  }

  showPredLap(onRight: boolean) {
    this.tmBtLed.setTime(this.graphics.iEstimatedLapTime, onRight);
  }

  showPosition(onRight: boolean) {
    this.tmBtLed.setInt(this.graphics.position, onRight);
  }

  showLapNumber(onRight: boolean) {
    this.tmBtLed.setInt(this.graphics.completedLaps + 1, onRight);
  }

  showLapsLeft(onRight: boolean) {
    const lapsLeft =
      this.graphics.numberOfLaps < 1000
        ? this.graphics.numberOfLaps - this.graphics.completedLaps
        : 0;
    this.tmBtLed.setInt(lapsLeft.toString(), onRight);
  }
}

module.exports = ACC;
