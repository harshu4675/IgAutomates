import { useMemo } from "react";
import { motion } from "framer-motion";

export default function AreaChart({
  data,
  dataKey,
  color = "#052659",
  height = 200,
}) {
  const { path, areaPath, points, max, min } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", areaPath: "", points: [], max: 0, min: 0 };
    }

    const values = data.map((d) => d[dataKey] || 0);
    const max = Math.max(...values, 1);
    const min = 0;
    const width = 600;
    const chartHeight = height - 40;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = chartHeight - ((d[dataKey] || 0) / max) * chartHeight + 20;
      return { x, y, value: d[dataKey] || 0, date: d.date };
    });

    const path = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    const areaPath = `${path} L ${points[points.length - 1].x} ${height - 20} L 0 ${height - 20} Z`;

    return { path, areaPath, points, max, min };
  }, [data, dataKey, height]);

  if (!data || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center">
        <p className="text-sm text-text-muted font-jakarta">No data yet</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 600 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient
            id={`gradient-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={areaPath}
          fill={`url(#gradient-${dataKey})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="white"
            stroke={color}
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.02 }}
            className="opacity-0 hover:opacity-100 transition-opacity"
          >
            <title>{`${point.date}: ${point.value}`}</title>
          </motion.circle>
        ))}
      </svg>

      <div className="absolute top-0 left-0 text-[10px] text-text-muted font-jakarta">
        {max}
      </div>
      <div className="absolute bottom-4 left-0 text-[10px] text-text-muted font-jakarta">
        0
      </div>
    </div>
  );
}
