import type { ReactNode } from "react";

export type IconName =
  | "shield"
  | "fingerprint"
  | "clock"
  | "award"
  | "file"
  | "chart"
  | "users"
  | "lock"
  | "sparkles"
  | "check"
  | "arrow-right"
  | "chevron-down"
  | "menu"
  | "close"
  | "search"
  | "bell"
  | "calendar"
  | "graduation"
  | "coins"
  | "scale"
  | "server"
  | "download"
  | "filter"
  | "badge-check"
  | "layers"
  | "eye"
  | "key"
  | "database"
  | "building"
  | "heart"
  | "plane"
  | "baby"
  | "trending"
  | "refresh"
  | "mail"
  | "map-pin"
  | "quote";

const PATHS: Record<IconName, ReactNode> = {
  shield: <path d="M12 3l7 3v5.5c0 4.4-2.9 8.3-7 9.5-4.1-1.2-7-5.1-7-9.5V6l7-3z" />,
  fingerprint: (
    <>
      <path d="M12 3c-3.9 0-7 3.1-7 7v3" />
      <path d="M12 7c-1.7 0-3 1.3-3 3v6.5" />
      <path d="M12 11v9" />
      <path d="M15 10.5A3 3 0 0 1 19 13v4" />
      <path d="M5 17c0 1.3.4 2.5 1.1 3.5" />
      <path d="M18.9 20.5A6.8 6.8 0 0 0 20.5 16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.8L7 21l5-2.6L17 21l-1.5-7.2" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V7M17 20v-9" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.4A5 5 0 0 1 20.5 20" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5l1.6 4.3 4.3 1.6-4.3 1.6L12 15.3l-1.6-4.3L6.1 9.4l4.3-1.6L12 3.5z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  "arrow-right": (
    <>
      <path d="M4.5 12h14" />
      <path d="M13 6.5l5.5 5.5L13 17.5" />
    </>
  ),
  "chevron-down": <path d="M6 9.5l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15L18 15.5z" />
      <path d="M10 21h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10.5h16M9 3.5v4M15 3.5v4" />
    </>
  ),
  graduation: (
    <>
      <path d="M3.5 9.5L12 5.5l8.5 4-8.5 4-8.5-4z" />
      <path d="M7 11.5v4.2c0 1.3 2.2 2.3 5 2.3s5-1 5-2.3v-4.2" />
      <path d="M20.5 9.5v5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="6.8" rx="5.5" ry="2.6" />
      <path d="M3.5 6.8v4.4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V6.8" />
      <path d="M9.5 15.8c.9.7 2.6 1.2 4.5 1.2 3 0 5.5-1.2 5.5-2.6v-4.4" />
      <ellipse cx="14.5" cy="10" rx="5.5" ry="2.6" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 8h14" />
      <path d="M5 8l-2.2 5a3.1 3.1 0 0 0 4.4 0L5 8z" />
      <path d="M19 8l-2.2 5a3.1 3.1 0 0 0 4.4 0L19 8z" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4.5" width="16" height="6" rx="2" />
      <rect x="4" y="13.5" width="16" height="6" rx="2" />
      <path d="M8 7.5h.01M8 16.5h.01" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19.5h14" />
    </>
  ),
  filter: <path d="M4 6h16l-6 7v5l-4 2v-7L4 6z" />,
  "badge-check": (
    <>
      <path d="M12 3l2.2 1.8 2.8-.2.7 2.7 2.3 1.6-1 2.7 1 2.7-2.3 1.6-.7 2.7-2.8-.2L12 21l-2.2-1.8-2.8.2-.7-2.7L4 15.1l1-2.7-1-2.7 2.3-1.6.7-2.7 2.8.2L12 3z" />
      <path d="M9.2 12.2l2 2 3.6-4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l8.5 4.3L12 12 3.5 7.8 12 3.5z" />
      <path d="M4 12.5l8 4 8-4" />
      <path d="M4 16.6l8 4 8-4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6 6.2 12 6.2 21.2 12 21.2 12 18 17.8 12 17.8 2.8 12 2.8 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H20M17 12v3M14 12v2.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
      <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>
  ),
  building: (
    <>
      <path d="M5 20.5V5.5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 5.5v15" />
      <path d="M14 10h3.5A1.5 1.5 0 0 1 19 11.5v9" />
      <path d="M3 20.5h18" />
      <path d="M8 8h3M8 12h3M8 16h3" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.7C19 15.6 12 20 12 20z" />,
  plane: <path d="M3.5 13.5l17-8-4.5 15-3.5-5.5-5.5-3z" />,
  baby: (
    <>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M10.2 7.4h.01M13.8 7.4h.01" />
      <path d="M10.4 10.2a2.4 2.4 0 0 0 3.2 0" />
      <path d="M6.5 20.5c1.2-3.2 3.1-4.5 5.5-4.5s4.3 1.3 5.5 4.5" />
    </>
  ),
  trending: (
    <>
      <path d="M4 17l5-5.5 3.5 3L20 7" />
      <path d="M15 7h5v5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  quote: (
    <>
      <path d="M9.5 6.5C6.9 7.4 5 9.8 5 12.7c0 2.6 1.5 4.3 3.6 4.3s3.4-1.5 3.4-3.5c0-1.9-1.2-3.3-3-3.4" />
      <path d="M19 6.5c-2.6.9-4.5 3.3-4.5 6.2 0 2.6 1.5 4.3 3.6 4.3s3.4-1.5 3.4-3.5c0-1.9-1.2-3.3-3-3.4" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.6,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
