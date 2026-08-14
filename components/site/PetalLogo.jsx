import React from "react";
import { C } from "../../lib/colors.js";

export default function PetalLogo({ size = 32, spin = false }) {
  const petals = [
    { angle: 0, color: C.navy },
    { angle: 51, color: C.teal },
    { angle: 102, color: C.cyan },
    { angle: 154, color: C.navy },
    { angle: 206, color: C.mint },
    { angle: 257, color: C.teal },
    { angle: 309, color: C.cyan },
  ];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={spin ? "petal-spin" : ""}>
      {petals.map((p, i) => (
        <g key={i} transform={`rotate(${p.angle} 60 60)`}>
          <path d="M60,60 C70,34 90,28 98,42 C106,58 92,80 60,60 Z" fill={p.color} opacity="0.94" />
        </g>
      ))}
      <circle cx="60" cy="60" r="7" fill={C.pearl} />
    </svg>
  );
}
