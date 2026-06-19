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
  const HOT = "#DCEBFF"; // skan nurining yorug' markazi

  return (
    <svg
      viewBox="0 0 186 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="uscan"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={LIGHT} stopOpacity="0" />
          <stop offset="0.16" stopColor={LIGHT} />
          <stop offset="0.5" stopColor={HOT} />
          <stop offset="0.84" stopColor={LIGHT} />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation="2.8" />
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
        <path d="M54 12 H46 A6 6 0 0 0 40 18 V27" />
        <path d="M168 12 H176 A6 6 0 0 1 182 18 V27" />
        <path d="M40 43 V52 A6 6 0 0 0 46 58 H54" />
        <path d="M182 43 V52 A6 6 0 0 1 176 58 H168" />
      </g>

      {/* scan — yorqin ko'k, ramka markazida */}
      <text
        x="111"
        y="48"
        fontSize="44"
        fontWeight="800"
        fill={SCAN}
        textAnchor="middle"
        style={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}
      >
        scan
      </text>

      {/* Skan nuri — "scan" o'rtasidan o'tadi (yorug' halo + yorqin chiziq) */}
      <line
        x1="42"
        y1="37"
        x2="180"
        y2="37"
        stroke={`url(#${gradId})`}
        strokeWidth="13"
        strokeLinecap="round"
        opacity="0.7"
        filter={`url(#${glowId})`}
      />
      <line
        x1="42"
        y1="37"
        x2="180"
        y2="37"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
