// This component is obsolete and has been replaced by CombinedChart.tsx. It can be deleted.
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PerformanceChartProps {
  data: { date: string; equity: number }[];
  positive: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, positive }) => {
  const color = positive ? '#38A169' : '#E53E3E';
  const gradientId = positive ? 'colorPositive' : 'colorNegative';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10, right: 30, left: 20, bottom: 0,
        }}
      >
        <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis 
            dataKey="date" 
            stroke="#A0AEC0" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
            stroke="#A0AEC0" 
            tick={{ fontSize: 12 }} 
            domain={['dataMin', 'dataMax']} 
            tickFormatter={(tick) => `$${Number(tick).toLocaleString()}`}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: '#1A202C',
                borderColor: '#4A5568',
                color: '#E2E8F0',
            }}
            labelStyle={{ color: '#A0AEC0' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
        />
        <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
