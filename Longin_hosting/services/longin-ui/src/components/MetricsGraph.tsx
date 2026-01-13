import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity } from 'lucide-react';

interface MetricsGraphProps {
  containerId: string;
  type: 'cpu' | 'memory';
  color?: string;
  height?: number;
}

interface MetricPoint {
  timestamp: string;
  value: number;
}

const MetricsGraph: React.FC<MetricsGraphProps> = ({ containerId, type, color = '#3b82f6', height = 200 }) => {
  const socket = useSocket();
  const [data, setData] = useState<MetricPoint[]>([]);

  useEffect(() => {
    socket.subscribeMetrics(containerId);

    const handleMetrics = (metricData: any) => {
        // metricData format: { containerId, cpu, memory, timestamp }
        if (metricData.containerId === containerId) {
            const value = type === 'cpu' ? metricData.cpu : metricData.memory; 
            
            setData((prev) => {
                const newData = [...prev, { timestamp: metricData.timestamp, value }];
                if (newData.length > 50) return newData.slice(newData.length - 50);
                return newData;
            });
        }
    };

    socket.on('container:metrics', handleMetrics);

    return () => {
      socket.unsubscribeMetrics(containerId);
      socket.off('container:metrics', handleMetrics);
    };
  }, [containerId, socket, type]);

  const formatXAxis = (tickItem: string) => {
      return new Date(tickItem).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity size={18} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{type === 'cpu' ? 'CPU Usage' : 'Memory Usage'}</h3>
          </div>
          <div className="text-xs font-mono font-bold text-gray-900">
              {data.length > 0 ? `${data[data.length - 1].value.toFixed(2)}${type === 'cpu' ? '%' : ' MB'}` : '--'}
          </div>
      </div>
      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis} 
                tick={{fontSize: 10, fill: '#9ca3af'}} 
                axisLine={false}
                tickLine={false}
                minTickGap={30}
            />
            <YAxis 
                hide={false} 
                tick={{fontSize: 10, fill: '#9ca3af'}} 
                axisLine={false}
                tickLine={false}
                width={30}
            />
            <Tooltip 
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color${type})`} 
                isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsGraph;
