import { Peripheral as DefaultPeripheral } from '@abandonware/noble';

declare module 'node-processlist' {
  export function getProcesses(): Promise<Process[]>;
  interface ProcessInfo {
    name: string;
    pid: number;
    sessionName: string;
    sessionNumber: number;
    memUsage: number;
    status: string;
    username: string;
    cpuTime: number;
    windowTitle: string;
    modules: string[];
    services: string[];
    packageName: string;
  }
}

declare module '@abandonware/noble' {
  interface Peripheral extends DefaultPeripheral {
    connUpdateLe(minInterval: number, maxInterval: number, latency: number, timeout: number): void;
  }
}

export declare namespace AssettoCorsaSharedMemoryTypes {
  export function getPhysics(): Physics;
  export function getGraphics(): Graphics;
  export function getGraphicsACC(): Graphics;

  export function initMaps(): void;
  export function getStatics(): Statistics;
}
