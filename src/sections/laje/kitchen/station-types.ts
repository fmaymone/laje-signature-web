import type { KitchenStation, KitchenStationType } from 'src/types/kitchen-layout';

export type StationTypeMeta = {
  type: KitchenStationType;
  label: string;
  icon: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
};

export const STATION_TYPES: StationTypeMeta[] = [
  {
    type: 'refrigerated_counter',
    label: 'Balcão refrigerado',
    icon: 'solar:fridge-bold',
    color: '#0284c7',
    defaultWidth: 280,
    defaultHeight: 120,
  },
  {
    type: 'workbench',
    label: 'Bancada de trabalho',
    icon: 'solar:widget-4-bold',
    color: '#57534e',
    defaultWidth: 220,
    defaultHeight: 140,
  },
  {
    type: 'grill',
    label: 'Churrasqueira',
    icon: 'solar:fire-bold',
    color: '#ea580c',
    defaultWidth: 260,
    defaultHeight: 160,
  },
  {
    type: 'stove',
    label: 'Fogão',
    icon: 'solar:flame-bold',
    color: '#dc2626',
    defaultWidth: 220,
    defaultHeight: 140,
  },
  {
    type: 'oven',
    label: 'Forno',
    icon: 'solar:temperature-bold',
    color: '#a16207',
    defaultWidth: 200,
    defaultHeight: 140,
  },
  {
    type: 'pass',
    label: 'Pass / expedição',
    icon: 'solar:delivery-bold',
    color: '#7c3aed',
    defaultWidth: 280,
    defaultHeight: 100,
  },
  {
    type: 'fryer',
    label: 'Fritadeira',
    icon: 'solar:cup-hot-bold',
    color: '#ca8a04',
    defaultWidth: 160,
    defaultHeight: 120,
  },
  {
    type: 'custom',
    label: 'Outro',
    icon: 'solar:widget-bold',
    color: '#44403c',
    defaultWidth: 180,
    defaultHeight: 120,
  },
];

export const STATION_TYPE_BY_ID = Object.fromEntries(
  STATION_TYPES.map((item) => [item.type, item])
) as Record<KitchenStationType, StationTypeMeta>;

export function stationTypeMeta(type: KitchenStationType): StationTypeMeta {
  return STATION_TYPE_BY_ID[type] ?? STATION_TYPE_BY_ID.custom;
}

export function newStationId() {
  return `st_${Math.random().toString(36).slice(2, 10)}`;
}

/** Planta inicial no espírito da cozinha Laje. */
export function lajeKitchenTemplate(): KitchenStation[] {
  return [
    {
      id: newStationId(),
      type: 'refrigerated_counter',
      name: 'Balcão refrigerado',
      x: 40,
      y: 60,
      width: 280,
      height: 120,
      color: STATION_TYPE_BY_ID.refrigerated_counter.color,
    },
    {
      id: newStationId(),
      type: 'workbench',
      name: 'Bancada 1',
      x: 360,
      y: 60,
      width: 220,
      height: 140,
      color: STATION_TYPE_BY_ID.workbench.color,
    },
    {
      id: newStationId(),
      type: 'workbench',
      name: 'Bancada 2',
      x: 620,
      y: 60,
      width: 220,
      height: 140,
      color: STATION_TYPE_BY_ID.workbench.color,
    },
    {
      id: newStationId(),
      type: 'grill',
      name: 'Churrasqueira',
      x: 40,
      y: 420,
      width: 280,
      height: 160,
      color: STATION_TYPE_BY_ID.grill.color,
    },
    {
      id: newStationId(),
      type: 'stove',
      name: 'Fogão',
      x: 360,
      y: 420,
      width: 220,
      height: 140,
      color: STATION_TYPE_BY_ID.stove.color,
    },
  ];
}
