import type { SensoryProfile } from 'src/types/library';

import { useMemo } from 'react';

import { Chart, useChart } from 'src/components/chart';

import { sensoryCategories, sensorySeries, SENSORY_MAX } from './sensory';

// ----------------------------------------------------------------------

type Props = {
  profile: SensoryProfile;
  height?: number;
};

export function SensoryRadar({ profile, height = 320 }: Props) {
  const categories = useMemo(() => sensoryCategories(), []);
  const values = useMemo(() => sensorySeries(profile), [profile]);

  const chartOptions = useChart({
    chart: {
      sparkline: { enabled: false },
      toolbar: { show: false },
    },
    xaxis: {
      categories,
      labels: {
        style: { fontSize: '11px' },
      },
    },
    yaxis: {
      show: false,
      min: 0,
      max: SENSORY_MAX,
      tickAmount: 5,
    },
    stroke: { width: 2 },
    fill: { opacity: 0.28 },
    markers: { size: 3 },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}/${SENSORY_MAX}`,
      },
    },
  });

  return (
    <Chart
      type="radar"
      series={[{ name: 'Perfil', data: values }]}
      options={chartOptions}
      sx={{ height }}
    />
  );
}
