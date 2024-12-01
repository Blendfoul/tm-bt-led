// noble.d.ts

import { EventEmitter } from 'events';
import { Peripheral } from './peripheral';
import { Service } from './service';
import { Characteristic } from './characteristic';
import { Descriptor } from './descriptor';
import NobleBindings from './bindings';

declare class Noble extends EventEmitter {
  initialized: boolean;
  address: string;
  _state: string;
  _bindings: NobleBindings;
  _peripherals: { [key: string]: Peripheral };
  _services: { [key: string]: { [key: string]: Service } };
  _characteristics: { [key: string]: { [key: string]: { [key: string]: Characteristic[] } } };
  _descriptors: {
    [key: string]: { [key: string]: { [key: string]: { [key: string]: Descriptor } } };
  };
  _discoveredPeripheralUUids: string[];
  _allowDuplicates: boolean;

  constructor(bindings: NobleBindings);

  onStateChange(state: string): void;
  onAddressChange(address: string): void;
  startScanning(
    serviceUuids?: string[],
    allowDuplicates?: boolean,
    callback?: (error: Error | null, filterDuplicates?: boolean) => void,
  ): void;
  startScanningAsync(serviceUUIDs?: string[], allowDuplicates?: boolean): Promise<void>;
  onScanStart(filterDuplicates: boolean): void;
  stopScanning(callback?: () => void): void;
  stopScanningAsync(): Promise<void>;
  onScanStop(): void;
  reset(): void;
  onDiscover(
    uuid: string,
    address: string,
    addressType: string,
    connectable: boolean,
    advertisement: any,
    rssi: number,
  ): void;
  connect(peripheralUuid: string): void;
  onConnect(peripheralUuid: string, error: Error | null): void;
  disconnect(peripheralUuid: string): void;
  onDisconnect(peripheralUuid: string): void;
  updateRssi(peripheralUuid: string): void;
  onRssiUpdate(peripheralUuid: string, rssi: number): void;
  addServices(peripheralUuid: string, services: any[]): Service[];
  addService(peripheralUuid: string, service: any): Service;
  onServicesDiscovered(peripheralUuid: string, services: any[]): void;
  discoverServices(peripheralUuid: string, uuids?: string[]): void;
  onServicesDiscover(peripheralUuid: string, serviceUuids: string[]): void;
  discoverIncludedServices(
    peripheralUuid: string,
    serviceUuid: string,
    serviceUuids?: string[],
  ): void;
  onIncludedServicesDiscover(
    peripheralUuid: string,
    serviceUuid: string,
    includedServiceUuids: string[],
  ): void;
  addCharacteristics(
    peripheralUuid: string,
    serviceUuid: string,
    characteristics: any[],
  ): Characteristic[];
  onCharacteristicsDiscovered(
    peripheralUuid: string,
    serviceUuid: string,
    characteristics: any[],
  ): void;
  discoverCharacteristics(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuids?: string[],
  ): void;
  onCharacteristicsDiscover(
    peripheralUuid: string,
    serviceUuid: string,
    characteristics: any[],
  ): void;
  read(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    valueHandle: number,
  ): void;
  onRead(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    data: Buffer,
    isNotification: boolean,
    valueHandle: number,
  ): void;
  write(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    data: Buffer,
    withoutResponse: boolean,
    valueHandle: number,
  ): void;
  onWrite(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    valueHandle: number,
  ): void;
  broadcast(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    broadcast: boolean,
  ): void;
  onBroadcast(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    state: boolean,
  ): void;
  notify(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    notify: boolean,
    valueHandle: number,
  ): void;
  onNotify(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    state: boolean,
    valueHandle: number,
  ): void;
  discoverDescriptors(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    valueHandle: number,
  ): void;
  onDescriptorsDiscover(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    descriptors: string[],
    valueHandle: number,
  ): void;
  readValue(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    descriptorUuid: string,
    valueHandle: number,
  ): void;
  onValueRead(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    descriptorUuid: string,
    data: Buffer,
    valueHandle: number,
  ): void;
  writeValue(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    descriptorUuid: string,
    data: Buffer,
    valueHandle: number,
  ): void;
  onValueWrite(
    peripheralUuid: string,
    serviceUuid: string,
    characteristicUuid: string,
    descriptorUuid: string,
    valueHandle: number,
  ): void;
  readHandle(peripheralUuid: string, handle: number): void;
  onHandleRead(peripheralUuid: string, handle: number, data: Buffer): void;
  writeHandle(peripheralUuid: string, handle: number, data: Buffer, withoutResponse: boolean): void;
  onHandleWrite(peripheralUuid: string, handle: number): void;
  onHandleNotify(peripheralUuid: string, handle: number, data: Buffer): void;
  onMtu(peripheralUuid: string, mtu: number): void;
  connUpdateLe(
    peripheralUuid: string,
    minInterval: number,
    maxInterval: number,
    latency: number,
    supervisionTimeout: number,
  ): void;
  onConnectionParameterUpdateRequest(
    minInterval: number,
    maxInterval: number,
    latency: number,
    supervisionTimeout: number,
  ): void;
  onConnectionUpdateCompleted(
    status: number,
    handle: number,
    interval: number,
    latency: number,
    supervisionTimeout: number,
  ): void;
}

export { Noble };
