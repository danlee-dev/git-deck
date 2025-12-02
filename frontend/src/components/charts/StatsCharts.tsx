'use client';

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { DailyStats } from '@/types/blog';

interface StatsChartsProps {
  statsHistory: {
    daily_stats: DailyStats[];
    total_views: number;
    total_likes: number;
    total_comments: number;
  } | null;
  isLoading: boolean;
  fallbackViews?: number;
  fallbackLikes?: number;
}

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

interface LineChartProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

function LineChart({ data, color, height = 80 }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, pathD, areaD, maxValue } = useMemo(() => {
    if (data.length === 0) return { points: [], pathD: '', areaD: '', maxValue: 0 };

    const max = Math.max(...data.map(d => d.value), 1);
    const width = 100;
    const padding = { top: 8, bottom: 20, left: 0, right: 0 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;

    const pts = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - (d.value / max) * chartHeight,
      ...d,
    }));

    // Create smooth curve path
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    // Area path (for gradient fill)
    const area = `${path} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`;

    return { points: pts, pathD: path, areaD: area, maxValue: max };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
        No data
      </div>
    );
  }

  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover areas and points */}
        {points.map((point, i) => (
          <g key={i}>
            {/* Invisible hover area */}
            <rect
              x={point.x - 100 / data.length / 2}
              y="0"
              width={100 / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
            />
            {/* Point dot (visible on hover) */}
            {hoveredIndex === i && (
              <>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="white"
                  stroke={color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Vertical line */}
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x}
                  y2={height - 20}
                  stroke={color}
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.5"
                />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-0.5">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {/* Hover tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${points[hoveredIndex].x}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
            {points[hoveredIndex].value}
          </div>
        </div>
      )}
    </div>
  );
}

interface MultiLineChartProps {
  datasets: { data: DataPoint[]; color: string; label: string }[];
  height?: number;
}

function MultiLineChart({ datasets, height = 80 }: MultiLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { allPoints, maxValue } = useMemo(() => {
    if (datasets.length === 0 || datasets[0].data.length === 0) {
      return { allPoints: [], maxValue: 0 };
    }

    const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
    const max = Math.max(...allValues, 1);

    const width = 100;
    const padding = { top: 8, bottom: 20, left: 0, right: 0 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;

    const allPts = datasets.map(ds => ({
      ...ds,
      points: ds.data.map((d, i) => ({
        x: padding.left + (i / (ds.data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - (d.value / max) * chartHeight,
        ...d,
      })),
    }));

    return { allPoints: allPts, maxValue: max };
  }, [datasets, height]);

  if (datasets.length === 0 || datasets[0].data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
        No data
      </div>
    );
  }

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const dataLength = datasets[0].data.length;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          {allPoints.map((ds, idx) => (
            <linearGradient key={idx} id={`gradient-multi-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ds.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={ds.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Area fills */}
        {allPoints.map((ds, idx) => {
          const pts = ds.points;
          if (pts.length === 0) return null;
          const pathD = createPath(pts);
          const areaD = `${pathD} L ${pts[pts.length - 1].x} ${height - 20} L ${pts[0].x} ${height - 20} Z`;
          return <path key={`area-${idx}`} d={areaD} fill={`url(#gradient-multi-${idx})`} />;
        })}

        {/* Lines */}
        {allPoints.map((ds, idx) => (
          <path
            key={`line-${idx}`}
            d={createPath(ds.points)}
            fill="none"
            stroke={ds.color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Hover areas */}
        {datasets[0].data.map((_, i) => (
          <rect
            key={i}
            x={(i / (dataLength - 1)) * 100 - 100 / dataLength / 2}
            y="0"
            width={100 / dataLength}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* Hover points */}
        {hoveredIndex !== null &&
          allPoints.map((ds, idx) => {
            const point = ds.points[hoveredIndex];
            if (!point) return null;
            return (
              <g key={`hover-${idx}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="white"
                  stroke={ds.color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

        {/* Vertical line on hover */}
        {hoveredIndex !== null && allPoints[0]?.points[hoveredIndex] && (
          <line
            x1={allPoints[0].points[hoveredIndex].x}
            y1="8"
            x2={allPoints[0].points[hoveredIndex].x}
            y2={height - 20}
            stroke="#6b7280"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
            opacity="0.5"
          />
        )}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-0.5">
        <span>{datasets[0].data[0]?.label}</span>
        <span>{datasets[0].data[Math.floor(dataLength / 2)]?.label}</span>
        <span>{datasets[0].data[dataLength - 1]?.label}</span>
      </div>

      {/* Hover tooltip */}
      {hoveredIndex !== null && allPoints[0]?.points[hoveredIndex] && (
        <div
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${allPoints[0].points[hoveredIndex].x}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap flex gap-2">
            {allPoints.map((ds, idx) => (
              <span key={idx} style={{ color: ds.color }}>
                {ds.points[hoveredIndex]?.value ?? 0}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatsCharts({
  statsHistory,
  isLoading,
  fallbackViews = 0,
  fallbackLikes = 0,
}: StatsChartsProps) {
  const formatLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const viewsData: DataPoint[] = useMemo(() => {
    if (!statsHistory) return [];
    return statsHistory.daily_stats.slice(-14).map(stat => ({
      date: stat.date,
      value: stat.views,
      label: formatLabel(stat.date),
    }));
  }, [statsHistory]);

  const likesData: DataPoint[] = useMemo(() => {
    if (!statsHistory) return [];
    return statsHistory.daily_stats.slice(-14).map(stat => ({
      date: stat.date,
      value: stat.likes,
      label: formatLabel(stat.date),
    }));
  }, [statsHistory]);

  const commentsData: DataPoint[] = useMemo(() => {
    if (!statsHistory) return [];
    return statsHistory.daily_stats.slice(-14).map(stat => ({
      date: stat.date,
      value: stat.comments,
      label: formatLabel(stat.date),
    }));
  }, [statsHistory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Views Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
        <div className="flex items-center justify-between h-5 mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Views</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {(statsHistory?.total_views ?? fallbackViews).toLocaleString()}
          </span>
        </div>

        {isLoading ? (
          <div className="h-[72px] flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <LineChart data={viewsData} color="#3b82f6" height={72} />
        )}
      </div>

      {/* Engagement Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
        <div className="flex items-center justify-between h-5 mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Engagement</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {statsHistory?.total_likes ?? fallbackLikes}
              </span>
            </span>
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {statsHistory?.total_comments ?? 0}
              </span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[72px] flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <MultiLineChart
            datasets={[
              { data: likesData, color: '#f43f5e', label: 'Likes' },
              { data: commentsData, color: '#10b981', label: 'Comments' },
            ]}
            height={72}
          />
        )}
      </div>
    </div>
  );
}
