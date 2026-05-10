"use client";

import { motion } from "framer-motion";

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 96;

function toXY(angle: number, r: number) {
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

type VibeScore = { label: string; value: number };

export function RadarChart({ scores }: { scores: VibeScore[] }) {
  const n = scores.length;
  const angles = scores.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);

  const dataPoints = scores.map(({ value }, i) => toXY(angles[i], (value / 100) * RADIUS));
  const dataStr = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label="Vibe radar chart"
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const pts = angles.map((a) => { const p = toXY(a, RADIUS * level); return `${p.x},${p.y}`; }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis spokes */}
      {angles.map((angle, i) => {
        const end = toXY(angle, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        );
      })}

      {/* Filled data polygon — scales in from center */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      >
        <polygon
          points={dataStr}
          fill="rgba(200,64,26,0.18)"
          stroke="#c8401a"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#c8401a" />
        ))}
      </motion.g>

      {/* Axis labels */}
      {scores.map(({ label }, i) => {
        const pos = toXY(angles[i], RADIUS + 24);
        return (
          <text
            key={label}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9.5}
            fontFamily="DM Mono, monospace"
            fill="#7a7570"
            letterSpacing="0.08em"
          >
            {label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
