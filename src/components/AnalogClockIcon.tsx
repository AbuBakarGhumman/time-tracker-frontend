import React, { useEffect, useState } from "react";

type AnalogClockIconProps = {
  size?: number;                 // px
  className?: string;            // tailwind classes
  showSecondHand?: boolean;
};

/**
 * AnalogClockIcon
 * A lightweight SVG analog clock that updates once per second.
 * - Uses local time by default
 * - No external libs
 */
const AnalogClockIcon: React.FC<AnalogClockIconProps> = ({
  size = 22,
  className = "",
  showSecondHand = true,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  // Smooth-ish movement (minute hand moves with seconds, hour hand moves with minutes)
  const secondAngle = seconds * 6; // 360/60
  const minuteAngle = (minutes + seconds / 60) * 6;
  const hourAngle = (hours + minutes / 60) * 30; // 360/12

  const center = 50;
  const radius = 46;

  const handStyle: React.CSSProperties = {
    transformOrigin: `${center}px ${center}px`,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="4"
      />

      {/* Ticks */}
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = center + Math.cos(a) * 38;
        const y1 = center + Math.sin(a) * 38;
        const x2 = center + Math.cos(a) * 44;
        const y2 = center + Math.sin(a) * 44;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={28}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ ...handStyle, transform: `rotate(${hourAngle}deg)` }}
      />

      {/* Minute hand */}
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={18}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="4"
        strokeLinecap="round"
        style={{ ...handStyle, transform: `rotate(${minuteAngle}deg)` }}
      />

      {/* Second hand */}
      {showSecondHand && (
        <line
          x1={center}
          y1={center + 6}
          x2={center}
          y2={14}
          stroke="rgba(34,197,94,0.95)" // green-ish second hand
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ ...handStyle, transform: `rotate(${secondAngle}deg)` }}
        />
      )}

      {/* Center dot */}
      <circle cx={center} cy={center} r="4" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
};

export default AnalogClockIcon;
