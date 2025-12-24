import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';
import { CHART_COLORS } from '../config';

export default function HistoryChart({ data }) {
    if (!data || data.length === 0) return null;

    // 格式化数据以适配图表，并进行降采样
    const chartData = useMemo(() => {
        // 先翻转，按照时间从旧到新
        const reversedData = [...data].reverse();

        // 如果数据量太大，进行降采样，限制在约 200 个点
        const targetPoints = 200;
        let processedData = reversedData;

        if (reversedData.length > targetPoints) {
            const step = Math.ceil(reversedData.length / targetPoints);
            processedData = reversedData.filter((_, index) => index % step === 0);
        }

        return processedData.map(item => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            }),
        }));
    }, [data]);

    return (
        <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.responseTime} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.responseTime} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}ms`}
                    />
                    <Area
                        type="monotone"
                        dataKey="responseTime"
                        stroke={CHART_COLORS.responseTime}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPv)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
