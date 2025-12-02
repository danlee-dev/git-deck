# Custom SVG Charts

Custom-built SVG line charts for MyPage analytics, replacing Nivo charts.

## Why Custom Charts

- **Minimal Design**: No excessive grid lines, cleaner appearance
- **Smaller Bundle**: No external charting library dependency
- **Full Control**: Exact styling and behavior customization
- **Hover Tooltips**: Show values on hover without complex configuration
- **Consistent Styling**: Matches overall app design language

## Components

### LineChart

Single-line chart for Views.

```typescript
interface LineChartProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

interface DataPoint {
  date: string;
  value: number;
  label: string;
}
```

### MultiLineChart

Multi-line chart for Engagement (Likes + Comments).

```typescript
interface MultiLineChartProps {
  datasets: {
    data: DataPoint[];
    color: string;
    label: string;
  }[];
  height?: number;
}
```

## Implementation Details

### SVG Path Generation

Smooth curves using Bezier curves:

```typescript
const { points, pathD, areaD } = useMemo(() => {
  const max = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 8, bottom: 20, left: 0, right: 0 };
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate point positions
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: padding.top + chartHeight - (d.value / max) * chartHeight,
    ...d,
  }));

  // Create smooth curve path using cubic bezier
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;  // Control point at midpoint
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area path for gradient fill
  const area = `${path} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`;

  return { points: pts, pathD: path, areaD: area };
}, [data, height]);
```

### Gradient Fill

SVG linear gradient for area under curve:

```tsx
<defs>
  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
    <stop offset="100%" stopColor={color} stopOpacity="0" />
  </linearGradient>
</defs>

<path d={areaD} fill={`url(#${gradientId})`} />
```

### Hover Interaction

Invisible rectangles for hover detection:

```tsx
{points.map((point, i) => (
  <rect
    key={i}
    x={point.x - 100 / data.length / 2}
    y="0"
    width={100 / data.length}
    height={height}
    fill="transparent"
    onMouseEnter={() => setHoveredIndex(i)}
  />
))}

{hoveredIndex !== null && (
  <>
    {/* Point indicator */}
    <circle
      cx={point.x}
      cy={point.y}
      r="2"
      fill="white"
      stroke={color}
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
    />
    {/* Vertical guide line */}
    <line
      x1={point.x}
      y1={point.y}
      x2={point.x}
      y2={height - 20}
      stroke={color}
      strokeWidth="0.5"
      strokeDasharray="2 2"
      opacity="0.5"
    />
  </>
)}
```

### Tooltip

Positioned tooltip showing value:

```tsx
{hoveredIndex !== null && points[hoveredIndex] && (
  <div
    className="absolute top-0 pointer-events-none"
    style={{
      left: `${points[hoveredIndex].x}%`,
      transform: 'translateX(-50%)',
    }}
  >
    <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg">
      {points[hoveredIndex].value}
    </div>
  </div>
)}
```

## SVG Techniques Used

### ViewBox

Using percentage-based viewBox for responsive scaling:

```tsx
<svg
  viewBox={`0 0 100 ${height}`}
  className="w-full"
  preserveAspectRatio="none"
>
```

### Non-Scaling Stroke

Keeps stroke width consistent regardless of SVG scaling:

```tsx
<path
  strokeWidth="1.5"
  vectorEffect="non-scaling-stroke"
/>
```

### X-Axis Labels

Simple HTML labels for dates:

```tsx
<div className="flex justify-between text-[10px] text-gray-400 mt-1">
  <span>{data[0]?.label}</span>
  <span>{data[Math.floor(data.length / 2)]?.label}</span>
  <span>{data[data.length - 1]?.label}</span>
</div>
```

## Usage

```tsx
// frontend/src/app/(dashboard)/mypage/page.tsx
import StatsCharts from '@/components/charts/StatsCharts';

<StatsCharts
  statsHistory={statsHistory}
  isLoading={isLoadingStats}
  fallbackViews={profile.stats.total_views}
  fallbackLikes={profile.stats.total_likes_received}
/>
```

## Chart Container Structure

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {/* Views Chart */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border px-3 py-2.5">
    <div className="flex items-center justify-between h-5 mb-1">
      <span className="text-xs text-gray-500">Views</span>
      <span className="text-sm font-semibold">{total}</span>
    </div>
    <LineChart data={viewsData} color="#3b82f6" height={72} />
  </div>

  {/* Engagement Chart */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border px-3 py-2.5">
    <div className="flex items-center justify-between h-5 mb-1">
      <span className="text-xs text-gray-500">Engagement</span>
      <div className="flex items-center gap-3">
        <span><dot color="rose"/> {likes}</span>
        <span><dot color="emerald"/> {comments}</span>
      </div>
    </div>
    <MultiLineChart datasets={[...]} height={72} />
  </div>
</div>
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Height: 72px | Compact while still readable |
| Padding: px-3 py-2.5 | Minimal whitespace |
| Header: h-5 fixed height | Consistent alignment between charts |
| X-axis: 3 labels only | Clean, not cluttered |
| No Y-axis labels | Minimal design, hover shows values |
| No grid lines | Cleaner appearance |
| Gradient opacity: 0.2 -> 0 | Subtle area fill |

## Migration from Nivo

Previously used `@nivo/line`:

```bash
# Can be removed if no longer needed elsewhere
npm uninstall @nivo/core @nivo/line
```

Changes:
- Removed `dynamic` import with `ssr: false`
- Direct import works (no SSR issues with custom SVG)
- Smaller bundle size
- More control over styling

## File Location

```
frontend/src/components/charts/StatsCharts.tsx
```
