// @ts-expect-error - no types available
import NobleMain from '@abandonware/noble/lib/noble';
import NobleHciBindings from '@abandonware/noble/lib/hci-socket/bindings';
import type { Noble as NobleType } from './noble';

import template from './config/0008d3aabbcc.json';
import { Peripheral } from '@abandonware/noble';
import { writeFile } from 'fs/promises';

const Noble = new NobleMain(NobleHciBindings) as NobleType;

async function writeConfigJson(uuid: string) {
  const address = template.address
    .split(':')
    .map((c, i) => uuid[i * 2] + uuid[i * 2 + 1])
    .join(':');

  const data = {
    ...template,
    uuid,
    address,
  };

  await writeFile(`${__dirname}/config/${uuid}.json`, JSON.stringify(data), 'utf-8');

  process.exit(0);
}

async function setup() {
  Noble.stopScanning();

  Noble.on('stateChange', async (state: string) => {
    if (state === 'poweredOn') {
      console.log('Starting scan...');
      await Noble.startScanningAsync();
    }
  });

  Noble.on('discover', async (peripheral: Peripheral) => {
    console.log('Discovered', peripheral.uuid);
    if (peripheral.uuid.match(/^0008.*/)) {
      await Noble.stopScanningAsync();
      console.log('Connecting to', peripheral.advertisement.localName);
      await writeConfigJson(peripheral.uuid);
    }
  });
}

export { setup };
