/*
 * Game client for Euro Truck Simulator 2
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 * 
 * Copyright (c) 2021 Markus Plutka
 */

import { scs } from "../lib/scsSharedMemory.js";
import AbstractClient from '../lib/abstractClient.mjs';

const leftModes = ["SPEED", "RPM", "FUEL", "WATERTEMP", "OILTEMP", "OILPRESS", "AIRPRESS", "BRAKETEMP"];
const rightModes = ["DISTANCE", "TIME", "SPEED LIMIT", "CRUISE CONT", "AVG CONSUM", "RANGE"];

class EuroTruckSimulator2 extends AbstractClient {
    data = {};
    data = {};
    refreshInterval = null;

    constructor(tmBtLed) {
      if (!tmBtLed) {
          throw "No TM BT Led lib found.";
      }

      super(tmBtLed);    

      this.setCallbacks({
          onLeftPreviousMode: this.leftPreviousMode,
          onLeftNextMode: this.leftNextMode,
          onRightPreviousMode: this.rightPreviousMode,
          onRightNextMode: this.rightNextMode
      });
      this.setModes(leftModes, rightModes);

      scs.initMaps();
    }

    startClient = () =>  {
        this.refreshInterval = setInterval(() => {
            this.updateValues();
        }, 1000 / 30); // 30 Hz
    }

    stopClient = () => {
        if (this.refreshInterval) {
          console.log("Stopping interval")
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        scs.cleanup();
    }

    updateValues = () => {

        const data = scs.getData();
        
        if (data && Object.keys(data).length) {
          this.data = data;
        }

        this.rightModes = rightModes;

        let rpmPercent = this.data.engine_rpm / this.data.max_engine_rpm * 100;
        if (rpmPercent < 50) {
          rpmPercent = 0;
        } else {
          rpmPercent = (rpmPercent - 50) / 50 * 100;
        }

        this.tmBtLed.setRevLights(rpmPercent >= 98 ? 100 : rpmPercent);

        if (this.data.gearDashboard < 10 && this.data.gearDashboard >= 0) {
          this.tmBtLed.setGear(this.data.gearDashboard);          
          this.tmBtLed.setGearDotFlashing(0);
          this.tmBtLed.setGearDot(false);
        } else if (this.data.gearDashboard >= 10) {
          this.tmBtLed.setGear(this.data.gearDashboard == 10 ? null : this.data.gearDashboard % 10); // null == 0
          this.tmBtLed.setGearDotFlashing(0);
          this.tmBtLed.setGearDot(true);
        } else if (this.data.gearDashboard < 0) {
          this.tmBtLed.setGearDotFlashing(1);
          this.tmBtLed.setGear(Math.abs(this.data.gearDashboard));
        }

        if (this.data.blinkerLeftOn) {
          this.tmBtLed.setLeftYellow(true);
        } else {
          this.tmBtLed.setLeftYellow(false);
        }

        if (this.data.blinkerRightOn) {
          this.tmBtLed.setRightYellow(true);
        } else {
          this.tmBtLed.setRightYellow(false);
        }

        // RevLights & PitLimiter
       /* if (this.data.pit_limiter === 1) {
          this.tmBtLed.setRevLightsFlashing(1);
        } else {
          this.tmBtLed.setRevLightsFlashing(0);
        }
        
        if (this.tmBtLed.revLightsFlashing !== 1) {
          let rpmPercent = this.data.engine_rpm / this.data.max_engine_rpm * 100;
          if (rpmPercent < 50) {
            rpmPercent = 0;
          } else {
            rpmPercent = (rpmPercent - 50) / 50 * 100;
          }

          this.tmBtLed.setRevLights(rpmPercent >= 98 ? 100 : rpmPercent);
        }
*/
        /*if (physics.isEngineRunning === 1) {
          this.tmBtLed.setGearDot(true);
        } else {
          this.tmBtLed.setGearDot(false);
        }*/

        // Flags
        /*
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
*/
        switch (this.currentLeftMode) {
          default:
          case 0:
            this.tmBtLed.setSpeed(this.data.speed * 3.6, false);
            break;          
          case 1:
            this.tmBtLed.setRpm(this.data.engine_rpm, false);
            break;
          case 2:
            this.tmBtLed.setFloat(this.data.fuel, false);
            break;
          case 3:
            this.tmBtLed.setTemperature(this.data.waterTemperature, false);
            break;  
          case 4:
            this.tmBtLed.setTemperature(this.data.oilTemperature, false);
            break;                   
          case 5:
            this.tmBtLed.setFloat(this.data.oilPressure, false);
            break;
          case 6:
            this.tmBtLed.setFloat(this.data.airPressure, false);
            break;
          case 7:
            this.tmBtLed.setTemperature(this.data.brakeTemperature, false);
            break;            
        }

        switch (this.currentRightMode) {        
          default:
          case 0:
            this.tmBtLed.setFloat(this.data.routeDistance / 1000, true);
            break;      
          case 1:
            this.tmBtLed.setTime(this.data.routeTime / 60 * 1000, true); // in ms
            break;
          case 2:
            this.tmBtLed.setSpeed(this.data.speedLimit >= 0 ? this.data.speedLimit * 3.6 : 0, true);
            break; 
          case 3:
            this.tmBtLed.setSpeed(this.data.cruiseControlSpeed, true);
            break;   
          case 4:
            this.tmBtLed.setFloat(this.data.fuelAvgConsumption, true);
            break;
          case 5:
            this.tmBtLed.setFloat(this.data.fuelRange / 1000, true);
            break;          
        }
    };
}

export default EuroTruckSimulator2;
