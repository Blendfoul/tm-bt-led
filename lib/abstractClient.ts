/*
 * Basic client functions
 *
 * Created Date: Wednesday, January 13th 2021, 11:20:51 pm
 * Author: Markus Plutka
 *
 * Copyright (c) 2021 Markus Plutka
 */

import { TmBTLed } from './tmBTLed';
import { Callbacks } from './types';

export default class AbstractClient {
  currentLeftMode = 0;
  currentRightMode = 0;

  client: any;
  callbacks?: Callbacks;
  tmBtLed: TmBTLed;
  leftModes: string[] = [];
  rightModes: string[] = [];

  constructor(tmBtLed: TmBTLed) {
    this.tmBtLed = tmBtLed;
  }

  setCallbacks = (callbacks: Callbacks) => {
    this.tmBtLed.setCallbacks(callbacks);
  };

  startClient() {
    // NO op
  }

  stopClient() {
    // NO op
  }

  showGameTitle = (title: string) => {
    this.tmBtLed.setLeftDisplay(title.substr(0, 4).toUpperCase());
    this.tmBtLed.setRightDisplay(title.substr(4, 4).toUpperCase());
  };

  setModes = (leftModes: string[], rightModes: string[]) => {
    this.leftModes = leftModes;
    this.rightModes = rightModes;
  };

  leftPreviousMode = () => {
    if (this.leftModes.length === 0) {
      console.error('No left modes');
      return;
    }
    if (this.currentLeftMode === 0) {
      this.currentLeftMode = this.leftModes.length - 1;
    } else {
      this.currentLeftMode--;
    }
    this.tmBtLed.showTemporaryLeft(this.leftModes[this.currentLeftMode]);
    return this.currentLeftMode;
  };

  leftNextMode = () => {
    if (this.leftModes.length === 0) {
      console.error('No left modes');
      return;
    }
    if (this.currentLeftMode === this.leftModes.length - 1) {
      this.currentLeftMode = 0;
    } else {
      this.currentLeftMode++;
    }
    this.tmBtLed.showTemporaryLeft(this.leftModes[this.currentLeftMode]);
    return this.currentLeftMode;
  };

  rightPreviousMode = () => {
    if (this.rightModes.length === 0) {
      console.error('No left modes');
      return;
    }
    if (this.currentRightMode === 0) {
      this.currentRightMode = this.rightModes.length - 1;
    } else {
      this.currentRightMode--;
    }
    this.tmBtLed.showTemporaryRight(this.rightModes[this.currentRightMode]);
    return this.currentRightMode;
  };

  rightNextMode = () => {
    if (this.rightModes.length === 0) {
      console.error('No left modes');
      return;
    }
    if (this.currentRightMode === this.rightModes.length - 1) {
      this.currentRightMode = 0;
    } else {
      this.currentRightMode++;
    }
    this.tmBtLed.showTemporaryRight(this.rightModes[this.currentRightMode]);
    return this.currentRightMode;
  };
}
