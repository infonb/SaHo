import type { KeyboardEvent } from 'react';
import type { AIMessageGraphPoint } from './types';
import type { AIMessageGraphDrilldown } from './types';

type Props = {
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  xAxis: string;
  yAxis: string;
  seriesLabel: string;
  categories: string[];
  values: number[];
  points: AIMessageGraphPoint[];
  drilldowns?: AIMessageGraphDrilldown[];
  total?: number;
  onDrilldown?: (prompt: string) => void;
};

const COLORS = ['#3b62df', '#1f6b35', '#d97706', '#7c3aed', '#ec4899', '#0f766e', '#f59e0b', '#2563eb'];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatValue = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);

const buildTooltip = (label: string, value: number, axisLabel: string, chartType: string) =>
  `${label}: ${formatValue(value)} ${axisLabel} (${chartType})`;

const escapeCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const downloadTextFile = (fileName: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const buildPolyline = (values: number[], width: number, height: number, padding: number) => {
  if (values.length === 0) {
    return { points: '', areaPath: '' };
  }

  const maxValue = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = values.length === 1 ? 0 : innerWidth / (values.length - 1);

  const dots = values.map((value, index) => {
    const x = padding + step * index;
    const y = padding + innerHeight - (clamp(value, 0, maxValue) / maxValue) * innerHeight;
    return { x, y };
  });

  const points = dots.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = [
    `M ${padding} ${height - padding}`,
    ...dots.map((point, index) => `${index === 0 ? 'L' : 'L'} ${point.x} ${point.y}`),
    `L ${padding + innerWidth} ${height - padding}`,
    'Z',
  ].join(' ');

  return { points, areaPath };
};

function buildArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'L',
    `${cx} ${cy}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

export default function GraphVisualization({
  title,
  chartType,
  xAxis,
  yAxis,
  seriesLabel,
  categories,
  values,
  points,
  drilldowns,
  total,
  onDrilldown,
}: Props) {
  const safeValues = values.length === points.length ? values : points.map((point) => point.value);
  const maxValue = Math.max(...safeValues, 1);
  const sumValue = typeof total === 'number' ? total : safeValues.reduce((acc, value) => acc + value, 0);
  const chartWidth = 420;
  const chartHeight = 190;
  const padding = 22;
  const drilldownByLabel = new Map((drilldowns ?? []).map((entry) => [entry.label.toLowerCase(), entry.prompt]));
  const resolvePrompt = (label?: string) => {
    if (!label) {
      return null;
    }
    return drilldownByLabel.get(label.toLowerCase()) ?? null;
  };
  const handleDrilldown = (label?: string) => {
    const prompt = resolvePrompt(label);
    if (prompt && onDrilldown) {
      onDrilldown(prompt);
    }
  };
  const handleKeyDown = (event: KeyboardEvent<SVGElement | SVGPathElement | SVGCircleElement | SVGGElement>, label?: string) => {
    if (!resolvePrompt(label)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDrilldown(label);
    }
  };
  const handleExportData = () => {
    if (points.length === 0) {
      return;
    }

    const rows = [
      ['Title', title],
      ['Chart Type', chartType],
      [xAxis, yAxis],
      ...points.map((point) => [point.label, point.value]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const safeFileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'graph'}.csv`;
    downloadTextFile(safeFileName, csv, 'text/csv;charset=utf-8;');
  };

  const renderChart = () => {
    if (chartType === 'pie' || chartType === 'donut') {
      const totalValue = safeValues.reduce((acc, value) => acc + value, 0) || 1;
      if (safeValues.length === 1) {
        const color = COLORS[0];
        const label = pointLabel(points[0], 0);
        return (
          <svg viewBox="0 0 180 180" className="aiGraphSvg" role="img" aria-label={title}>
            <g transform="translate(90, 90)">
              <title>{buildTooltip(label, safeValues[0], yAxis, chartType)}</title>
              <circle cx="0" cy="0" r={chartType === 'donut' ? 58 : 66} fill={color} />
              {chartType === 'donut' ? <circle cx="0" cy="0" r={34} fill="#ffffff" /> : null}
              <text x="0" y="-4" textAnchor="middle" className="aiGraphCenterValue">
                {formatValue(sumValue)}
              </text>
              <text x="0" y="14" textAnchor="middle" className="aiGraphCenterLabel">
                {seriesLabel}
              </text>
            </g>
          </svg>
        );
      }

      let startAngle = 0;
      const radius = chartType === 'donut' ? 58 : 66;
      const innerRadius = chartType === 'donut' ? 34 : 0;

      return (
        <svg viewBox="0 0 180 180" className="aiGraphSvg" role="img" aria-label={title}>
          <g transform="translate(90, 90)">
            {safeValues.map((value, index) => {
              const angle = (value / totalValue) * 360;
              const endAngle = startAngle + angle;
              const path = buildArcPath(0, 0, radius, startAngle, endAngle);
              const color = COLORS[index % COLORS.length];
              const currentStart = startAngle;
              startAngle = endAngle;

              const label = categories[index] ?? pointLabel(points[index], index);
              const prompt = resolvePrompt(label);

              return (
                <path
                  key={`${label}-${currentStart}`}
                  d={path}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className={prompt ? 'aiGraphInteractive' : undefined}
                  onClick={() => handleDrilldown(label)}
                  role={prompt ? 'button' : undefined}
                  tabIndex={prompt ? 0 : -1}
                  onKeyDown={(event) => handleKeyDown(event, label)}
                >
                  <title>{buildTooltip(label, value, yAxis, chartType)}</title>
                </path>
              );
            })}
            {chartType === 'donut' ? <circle cx="0" cy="0" r={innerRadius} fill="#ffffff" /> : null}
            <text x="0" y="-4" textAnchor="middle" className="aiGraphCenterValue">
              {formatValue(sumValue)}
            </text>
            <text x="0" y="14" textAnchor="middle" className="aiGraphCenterLabel">
              {seriesLabel}
            </text>
          </g>
        </svg>
      );
    }

    if (chartType === 'line' || chartType === 'area') {
      const { points: polylinePoints, areaPath } = buildPolyline(safeValues, chartWidth, chartHeight, padding);

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="aiGraphSvg" role="img" aria-label={title}>
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="aiGraphAxisLine" />
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} className="aiGraphAxisLine" />
          {chartType === 'area' ? <path d={areaPath} className="aiGraphArea" /> : null}
          <polyline points={polylinePoints} className="aiGraphLine" />
          {safeValues.map((value, index) => {
            const innerWidth = chartWidth - padding * 2;
            const innerHeight = chartHeight - padding * 2;
            const step = safeValues.length === 1 ? 0 : innerWidth / (safeValues.length - 1);
            const x = padding + step * index;
            const y = padding + innerHeight - (clamp(value, 0, maxValue) / maxValue) * innerHeight;
            const label = categories[index] ?? pointLabel(points[index], index);
            const prompt = resolvePrompt(label);
            return (
              <circle
                key={`${label}-${index}`}
                cx={x}
                cy={y}
                r="4.5"
                className={prompt ? 'aiGraphDot aiGraphInteractive' : 'aiGraphDot'}
                onClick={() => handleDrilldown(label)}
                role={prompt ? 'button' : undefined}
                tabIndex={prompt ? 0 : -1}
                onKeyDown={(event) => handleKeyDown(event, label)}
              >
                <title>{buildTooltip(label, value, yAxis, chartType)}</title>
              </circle>
            );
          })}
        </svg>
      );
    }

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="aiGraphSvg" role="img" aria-label={title}>
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="aiGraphAxisLine" />
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} className="aiGraphAxisLine" />
        {safeValues.map((value, index) => {
          const innerWidth = chartWidth - padding * 2;
          const innerHeight = chartHeight - padding * 2;
          const barWidth = Math.max(18, innerWidth / Math.max(safeValues.length * 1.4, 1));
          const gap = safeValues.length > 1 ? (innerWidth - barWidth * safeValues.length) / (safeValues.length - 1) : 0;
          const x = padding + index * (barWidth + gap);
          const height = (clamp(value, 0, maxValue) / maxValue) * innerHeight;
          const y = padding + innerHeight - height;
          const color = COLORS[index % COLORS.length];

          const label = categories[index] ?? pointLabel(points[index], index);
          const prompt = resolvePrompt(label);

          return (
            <g
              key={`${label}-${index}`}
              className={prompt ? 'aiGraphInteractive' : undefined}
              onClick={() => handleDrilldown(label)}
              role={prompt ? 'button' : undefined}
              tabIndex={prompt ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, label)}
            >
              <title>{buildTooltip(label, value, yAxis, chartType)}</title>
              <rect x={x} y={y} width={barWidth} height={height} rx="10" fill={color} />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="aiGraphBarValue">
                {formatValue(value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <section className="aiGraphCard" aria-label={title}>
      <div className="aiBlockTitle">{title}</div>
      <div className="aiGraphHeader">
        <div>
          <span className="aiGraphAxisLabel">{xAxis}</span>
          <strong>{yAxis}</strong>
        </div>
        <div className="aiGraphHeaderActions">
          <div className="aiGraphMeta">
            <span>{chartType.toUpperCase()}</span>
            <strong>{formatValue(sumValue)}</strong>
          </div>
          <button
            type="button"
            className="aiGraphExportButton"
            onClick={handleExportData}
            disabled={points.length === 0}
            aria-label={`Export ${title} data`}
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className={`aiGraphFrame ${chartType === 'pie' || chartType === 'donut' ? 'isCentered' : ''}`}>
        {renderChart()}
      </div>
      <div className="aiGraphLegend" role="list" aria-label={`${title} legend`}>
        {points.map((point, index) => (
          <button
            type="button"
            className={`aiGraphLegendItem ${resolvePrompt(point.label) ? 'isInteractive' : ''}`}
            role="listitem"
            key={`${point.label}-${index}`}
            onClick={() => handleDrilldown(point.label)}
            disabled={!resolvePrompt(point.label)}
            title={buildTooltip(point.label, point.value, yAxis, chartType)}
          >
            <span className="aiGraphLegendSwatch" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="aiGraphLegendLabel">{point.label}</span>
            <strong>{formatValue(point.value)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function pointLabel(point: AIMessageGraphPoint | undefined, index: number) {
  return point?.label ?? `Point ${index + 1}`;
}
