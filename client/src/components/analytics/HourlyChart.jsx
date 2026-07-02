import { motion } from "framer-motion";

export default function HourlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-text-muted font-jakarta">No hourly data</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {data.map((item, i) => (
          <div
            key={item.hour}
            className="flex-1 flex flex-col items-center group relative"
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.count / max) * 100}%` }}
              transition={{
                delay: i * 0.02,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full min-h-[2px] bg-gradient-to-t from-primary-dark to-primary-mid rounded-t-sm cursor-pointer hover:opacity-80 transition-opacity"
            />

            {item.count > 0 && (
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-darkest text-white text-[10px] font-jakarta px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
                {item.hour}:00 - {item.count} DMs
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-1">
        {[0, 6, 12, 18, 23].map((hour) => (
          <span key={hour} className="text-[9px] text-text-muted font-jakarta">
            {hour}:00
          </span>
        ))}
      </div>
    </div>
  );
}
