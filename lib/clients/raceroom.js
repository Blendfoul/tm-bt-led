/*
 * Game client for Raceroom
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 *
 * Copyright (c) 2021 Markus Plutka
 */

const r3e = require('../r3e-api/build/Release/r3e.node');
const AbstractClient = require('../lib/abstractClient.js');
const path = require('path');

const loadableConfigName = 'raceroom.config.js';
const defaultConfig = {
  leftModes: ['SPEED', 'RPM', 'FUEL', 'TYRETEMP', 'TYREPRESS', 'BRAKETEMP', 'OILTEMP'],
  rightModes: ['LAPTIME', 'DELTA', 'LAST LAP', 'BEST LAP', 'POSITION', 'LAP', 'LAPS LEFT'],
};

class Raceroom extends AbstractClient {
  data = {};
  initDone = false;
  initInterval = null;
  refreshInterval = null;

  config;
  modeMapping;

  constructor(tmBtLed) {
    if (!tmBtLed) {
      throw 'No TM BT Led lib found.';
    }

    super(tmBtLed);

    this.modeMapping = {
      SPEED: this.showSpeed,
      RPM: this.showRpm,
      FUEL: this.showFuel,
      TYRETEMP: this.showTyreTemp,
      TYREPRESS: this.showTyrePress,
      BRAKETEMP: this.showBrakeTemp,
      OILTEMP: this.showOilTemp,

      LAPTIME: this.showCurrentLap,
      DELTA: this.showDelta,
      'LAST LAP': this.showLastLap,
      'BEST LAP': this.showBestLap,
      POSITION: this.showPosition,
      LAP: this.showLapNumber,
      'LAPS LEFT': this.showLapsLeft,
    };

    try {
      this.config = require(path.dirname(process.execPath) + '/' + loadableConfigName);
      if (this.config?.leftModes && this.config?.rightModes) {
        console.log('Found custom config');
      } else {
        throw 'No custom config';
      }
    } catch (e) {
      this.config = defaultConfig;
    }

    this.setCallbacks({
      onLeftPreviousMode: this.leftPreviousMode,
      onLeftNextMode: this.leftNextMode,
      onRightPreviousMode: this.rightPreviousMode,
      onRightNextMode: this.rightNextMode,
    });
    this.setModes(this.config?.leftModes, this.config?.rightModes);

    this.initInterval = setInterval(() => {
      let initRet = r3e.initMaps();
      if (initRet === 0) {
        console.log('Found mapping');
        this.initDone = true;
        clearInterval(this.initInterval);
        this.initInterval = null;
      }
    }, 3000);
  }

  startClient = () => {
    this.refreshInterval = setInterval(() => {
      if (this.initDone) {
        this.updateValues();
      }
    }, 1000 / 60); // 60 Hz
  };

  stopClient = () => {
    if (this.initInterval) {
      clearInterval(this.initInterval);
      this.initInterval = null;
    }
    if (this.refreshInterval) {
      console.log('Stopping interval');
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    r3e.cleanup();
  };

  updateValues = () => {
    const data = r3e.getData();

    if (data && Object.keys(data).length) {
      this.data = data;
    }

    this.tmBtLed.setGear(this.data.gear);

    // RevLights & PitLimiter
    if (this.data.pit_limiter === 1) {
      this.tmBtLed.setRevLightsFlashing(1);
    } else {
      this.tmBtLed.setRevLightsFlashing(0);
    }

    if (this.tmBtLed.revLightsFlashing !== 1) {
      let rpmPercent = (this.data.engine_rpm / this.data.max_engine_rpm) * 100;
      if (rpmPercent < 50) {
        rpmPercent = 0;
      } else {
        rpmPercent = ((rpmPercent - 50) / 50) * 100;
      }

      this.tmBtLed.setRevLights(rpmPercent >= 98 ? 100 : rpmPercent);
    }

    /*if (physics.isEngineRunning === 1) {
          this.tmBtLed.setGearDot(true);
        } else {
          this.tmBtLed.setGearDot(false);
        }*/

    // Flags
    if (this.data.yellowFlag > 0) {
      this.tmBtLed.setFlashingYellow(true);
    } else {
      if (this.tmBtLed.isFlashingYellow) {
        this.tmBtLed.setFlashingYellow(false);
      }
    }

    if (this.data.blueFlag > 0) {
      this.tmBtLed.setFlashingBlue(true);
    } else {
      if (this.tmBtLed.isFlashingBlue) {
        this.tmBtLed.setFlashingBlue(false);
      }
    }

    if (this.data.blackFlag > 0 || this.data.blackWhiteFlag) {
      this.tmBtLed.setFlashingRed(true);
    } else {
      if (this.tmBtLed.isFlashingRed) {
        this.tmBtLed.setFlashingRed(false);
      }
    }

    // Set left display according to left modes array and currentLeftMode array index
    if (this.currentLeftMode <= this.leftModes.length) {
      const leftDataProcessor = this.modeMapping[this.leftModes[this.currentLeftMode]];
      if (typeof leftDataProcessor === 'function') {
        leftDataProcessor(false);
      }
    }

    // Set right display according to right modes array and currentRightMode array index
    // Second boolean parameter (true) in setter displays value in right display
    if (this.currentRightMode <= this.rightModes.length) {
      const rightDataProcessor = this.modeMapping[this.rightModes[this.currentRightMode]];
      if (typeof rightDataProcessor === 'function') {
        rightDataProcessor(true);
      }
    }
  };

  showSpeed = (onRight) => {
    this.tmBtLed.setSpeed(this.data.car_speed, onRight);
  };

  showRpm = (onRight) => {
    this.tmBtLed.setRpm(this.data.engine_rpm, onRight);
  };
  showFuel = (onRight) => {
    this.tmBtLed.setFloat(this.data.fuel_left, onRight);
  };
  showTyreTemp = (onRight) => {
    this.tmBtLed.setTemperature(this.data.tireTemp, onRight);
  };

  showTyrePress = (onRight) => {
    this.tmBtLed.setTemperature(this.data.tirePress, onRight);
  };

  showBrakeTemp = (onRight) => {
    this.tmBtLed.setTemperature(this.data.brakeTemp, onRight);
  };
  showOilTemp = (onRight) => {
    this.tmBtLed.setTemperature(this.data.engine_oil_temp, onRight);
  };
  showCurrentLap = (onRight) => {
    this.tmBtLed.setTime(
      this.data.lap_time_current_self < 0 ? 0 : this.data.lap_time_current_self * 1000,
      onRight,
    );
  };
  showDelta = (onRight) => {
    this.tmBtLed.setDiffTime(this.data.time_delta_best_self * 1000 * 1000, onRight);
  };
  showLastLap = (onRight) => {
    this.tmBtLed.setTime(
      (this.data.lap_time_previous_self < 0 ? 0 : this.data.lap_time_previous_self) * 1000,
      onRight,
    );
  };
  showBestLap = (onRight) => {
    this.tmBtLed.setTime(
      (this.data.lap_time_best_self < 0 ? 0 : this.data.lap_time_best_self) * 1000,
      onRight,
    );
  };
  showPosition = (onRight) => {
    this.tmBtLed.setInt(this.data.position, onRight);
  };
  showLapNumber = (onRight) => {
    this.tmBtLed.setInt(this.data.completed_laps + 1, onRight);
  };
  showLapsLeft = (onRight) => {
    this.tmBtLed.setInt(
      this.data.number_of_laps < 0 ? 0 : this.data.number_of_laps - this.data.completed_laps,
      onRight,
    );
  };
}

module.exports = Raceroom;
