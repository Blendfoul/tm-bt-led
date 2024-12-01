import { TmBTLed } from './tmBTLed';

let tmBtLed: TmBTLed;

function startTmBtLed() {
  let revPercent = 0;
  let revReversed = false;

  tmBtLed.setPerformanceMode();
  setInterval(() => {
    /*tmBtLed.setRpm(Math.floor(Math.random() * 14001), false);
    tmBtLed.setTime(Math.floor(Math.random() * 5001), true);
    tmBtLed.setGear(Math.floor(Math.random() * 10));
    if (revReversed) {
      revPercent -= 3;
      if (revPercent < 0) {
        revPercent = 0;
        revReversed = !revReversed;
      }
    } else {
      revPercent += 3;
      if (revPercent > 100) {
        revPercent = 100;
        revReversed = !revReversed;
      }
    }*/
    //tmBtLed.setRevLightsWithoutBlue(revPercent);
    tmBtLed.setAllFlashing(true);
    //tmBtLed.setRevLightsBlueFlashing(true);
  }, 1000 / 60);
}

function testLauncher() {
  tmBtLed = new TmBTLed(startTmBtLed);
}

export { testLauncher };
