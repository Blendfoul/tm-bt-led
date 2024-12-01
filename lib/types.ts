type Callbacks = {
  onLeftPreviousMode: () => void;
  onLeftNextMode: () => void;
  onRightPreviousMode: () => void;
  onRightNextMode: () => void;
};

type Args = {
  interval?: number;
  metric?: boolean;
  imperial?: boolean;
};

type Metadata = {
  services: Service[];
  characteristics: Record<string, characteristic[]>;
  uuid: string;
  address: string;
  name: string;
};

type Service = {
  startHandle: number;
  endHandle: number;
  uuid: string;
};

type characteristic = {
  startHandle: number;
  properties: number;
  valueHandle: number;
  uuid: string;
  propsDecoded: string[];
  rawProps: number;
  endHandle: number;
};

type Data = {
  rpm: number;
  speed: number;
  gear: number;
  max_rpm: number;
  current_lap_time: number;
  position: string;
};

type Game = {
  name: string;
  bin: string[];
  title: string[];
};

export type { Callbacks, Args, Metadata, Data, Game };
