import React from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceDot
} from 'recharts';
import { PositionSide, TradeMarker } from '../types';

interface ChartDataPoint {
  timestamp: number;
  close?: number;
  equity?: number;
}

interface CombinedChartProps {
  data: ChartDataPoint[];
  markers: TradeMarker[];
  isPositive: boolean;
}

const TradeMarkerDot: React.FC<any> = (props) => {
  const { cx, cy, payload, ...rest } = props;
  const marker = rest.marker as TradeMarker;

  if (!marker || !cx || !cy) return null;

  const isEntry = marker.type === 'entry';
  const isLong = marker.side === PositionSide.LONG;
  const color = isEntry ? (isLong ? '#38A169' : '#E53E3E') : '#3182CE';
  const symbol = isEntry ? (isLong ? '▲' : '▼') : '■';

  const yOffset = isEntry ? (isLong ? -10 : 20) : 0;

  return (
    <g>
      <text x={cx} y={cy + yOffset} fill={color} fontSize="18" textAnchor="middle">{symbol}</text>
    </g>
  );
};


const CombinedChart: React.FC<CombinedChartProps> = ({ data, markers, isPositive }) => {
  const priceColor = '#3182CE'; // Blue
  const equityColor = isPositive ? '#38A169' : '#E53E3E'; // Green or Red

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={priceColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={priceColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis
          dataKey="timestamp"
          stroke="#A0AEC0"
          tick={{ fontSize: 12 }}
          tickFormatter={(tick) => new Date(tick).toLocaleTimeString()}
          type="number"
          domain={['dataMin', 'dataMax']}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke={priceColor}
          tick={{ fontSize: 12 }}
          tickFormatter={(tick) => `$${Number(tick).toLocaleString()}`}
          domain={['auto', 'auto']}
          width={80}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={equityColor}
          tick={{ fontSize: 12 }}
          tickFormatter={(tick) => `$${Number(tick).toLocaleString()}`}
          domain={['auto', 'auto']}
          width={80}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
          labelFormatter={(label) => new Date(label).toLocaleString()}
          formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, name]}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="close"
          stroke={priceColor}
          fill="url(#priceGradient)"
          name="Price"
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="equity"
          stroke={equityColor}
          strokeWidth={2}
          name="Equity"
          dot={false}
        />
        {markers.map((marker, index) => (
          <ReferenceDot
            key={`marker-${index}`}
            yAxisId="left"
            x={marker.timestamp}
            y={marker.price}
            ifOverflow="extendDomain"
            shape={<TradeMarkerDot marker={marker} />}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CombinedChart;
