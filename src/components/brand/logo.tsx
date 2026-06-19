"use client";

import { useId } from "react";

/**
 * uscan brend logotipi (inline SVG).
 *
 * - "u" + skaner-qavs ramkasi `currentColor` dan foydalanadi — yorug' fonda matn rangi
 *   (to'q ko'k), to'q fonda esa oq bo'ladi (ota element `text-white` bersa).
 * - "scan" yozuvi va skan chizig'i — yorqin ko'k brend rangida.
 * - Balandlikni `className` (masalan `h-7 w-auto`) orqali boshqaring.
 */
export function Logo({ className }: { className?: string }) {
  // Bir sahifada bir nechta logo bo'lganda gradient/filter ID'lari to'qnashmasin.
  const uid = useId().replace(/:/g, "");
  const gradId = `uscan-line-${uid}`;
  const glowId = `uscan-glow-${uid}`;

  const SCAN = "#2F80ED"; // urg'u (yorqin ko'k)
  const LIGHT = "#7DB4F5"; // och ko'k

  return (
    <svg
      viewBox="0 0 200 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="uscan"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={LIGHT} stopOpacity="0" />
          <stop offset="0.18" stopColor={LIGHT} />
          <stop offset="0.5" stopColor={SCAN} />
          <stop offset="0.82" stopColor={LIGHT} />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-10%" y="-300%" width="120%" height="700%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* u — currentColor (yorug'da to'q ko'k, to'qda oq) */}
      <text
        x="0"
        y="48"
        fontSize="54"
        fontWeight="800"
        fill="currentColor"
        style={{ fontFamily: "inherit", letterSpacing: "-0.02em" }}
      >
        u
      </text>

      {/* Skaner-qavs ramka — currentColor */}
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M70 13 H60 A6 6 0 0 0 54 19 V28" />
        <path d="M180 13 H190 A6 6 0 0 1 196 19 V28" />
        <path d="M54 45 V53 A6 6 0 0 0 60 59 H70" />
        <path d="M196 45 V53 A6 6 0 0 1 190 59 H180" />
      </g>

      {/* scan — yorqin ko'k, ramka markazida */}
      <text
        x="125"
        y="48"
        fontSize="44"
        fontWeight="800"
        fill={SCAN}
        textAnchor="middle"
        style={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}
      >
        scan
      </text>

      {/* Skan chizig'i — yozuv ustidan o'tadi (yorug' halo + ingichka chiziq) */}
      <line
        x1="58"
        y1="36"
        x2="192"
        y2="36"
        stroke={`url(#${gradId})`}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.45"
        filter={`url(#${glowId})`}
      />
      <line
        x1="58"
        y1="36"
        x2="192"
        y2="36"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
