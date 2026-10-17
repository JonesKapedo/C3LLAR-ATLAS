import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  tonight: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  cellar: (
    <>
      <path d="M10 3h4v3.2l1.4 2.3a3 3 0 0 1 .6 1.8V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8.7a3 3 0 0 1 .6-1.8L12 6.2V3Z" />
      <path d="M9.5 13h5" />
    </>
  ),
  windows: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5v-15Z" />
      <path d="M9 8h6" />
    </>
  ),
  valuation: <path d="M3 20h18M7 20v-6M12 20V8M17 20v-9" />,
  market: (
    <>
      <path d="M4 9.5L6 4h12l2 5.5" />
      <path d="M4 9.5a2.5 2.5 0 0 0 4 1.8 2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4-1.8" />
      <path d="M5.5 12.5V20h13v-7.5" />
    </>
  ),
  security: <path d="M12 3l7 3v5.5c0 4.4-2.9 8.1-7 9.5-4.1-1.4-7-5.1-7-9.5V6l7-3Z" />,
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.3A10.4 10.4 0 0 1 12 5c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.4 7.4A17 17 0 0 0 2 11s3.6 6 10 6a10.6 10.6 0 0 0 4-.8" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M4 20h16" />,
  edit: (
    <>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.6" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  chev: <path d="M9 6l6 6-6 6" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  alert: (
    <>
      <path d="M12 3.5l8.5 16.5h-17L12 3.5Z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
  arrow: <path d="M5 12h13M12 6l6 6-6 6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 4h4v4" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3l7 3v5.5c0 4.4-2.9 8.1-7 9.5-4.1-1.4-7-5.1-7-9.5V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
}

export function Icon({
  name,
  size = 17,
}: {
  name: keyof typeof PATHS | string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="icon"
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
