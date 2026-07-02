import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function MultiLineChart({ data, series, height = 280 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const { lines, max, xLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { lines: [], max: 0, xLabels: [] };
    }

    let max = 1;
    series.forEach((s) => {
      data.forEach((d) => {
        if ((d[s.key] || 0) > max) max = d[s.key];
      });
    });

    const width = 700;
    const chartHeight = height - 60;
    const paddingLeft = 30;
    const chartWidth = width - paddingLeft - 10;

    const lines = series.map((s) => {
      const points = data.map((d, i) => {
        const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
        const y = chartHeight - ((d[s.key] || 0) / max) * chartHeight + 20;
        return { x, y, value: d[s.key] || 0 };
      });

      const path = points
        .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(" ");

      return { ...s, points, path };
    });

    const step = Math.max(1, Math.floor(data.length / 7));
    const xLabels = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d, i) => {
        const originalIndex = data.findIndex((item) => item.date === d.date);
        const x =
          paddingLeft + (originalIndex / (data.length - 1 || 1)) * chartWidth;
        const date = new Date(d.date);
        return {
          x,
          label: `${date.getDate()}/${date.getMonth() + 1}`,
        };
      });

    return { lines, max, xLabels };
  }, [data, series, height]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-text-muted font-jakarta">
          No data available yet. Start receiving comments to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 700 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = (height - 60) * (1 - ratio) + 20;
          const value = Math.round(max * ratio);
          return (
            <g key={ratio}>
              <line
                x1="30"
                y1={y}
                x2="690"
                y2={y}
                stroke="rgba(84, 131, 179, 0.1)"
                strokeDasharray="2 4"
              />
              <text
                x="25"
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-text-muted"
                fontFamily="Plus Jakarta Sans"
              >
                {value}
              </text>
            </g>
          );
        })}

        {lines.map((line) => (
          <g key={line.key}>
            <motion.path
              d={line.path}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />

            {line.points.map((point, i) => (
              <motion.circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 5 : 3}
                fill="white"
                stroke={line.color}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.02 }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </g>
        ))}

        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 5}
            textAnchor="middle"
            className="text-[9px] fill-text-muted"
            fontFamily="Plus Jakarta Sans"
          >
            {label.label}
          </text>
        ))}

        {hoveredIndex !== null && data[hoveredIndex] && (
          <g>
            <line
              x1={lines[0]?.points[hoveredIndex]?.x || 0}
              y1="20"
              x2={lines[0]?.points[hoveredIndex]?.x || 0}
              y2={height - 40}
              stroke="rgba(5, 38, 89, 0.2)"
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11px] text-text-muted font-jakarta">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
