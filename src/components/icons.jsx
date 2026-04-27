const ICON_PATHS = {
  sales: [
    <path key="a" d="M6 3.5h8.5L18 7v13.5H6z" />,
    <path key="b" d="M14 3.5V7h4" />,
    <path key="c" d="M9 10h6M9 13h6M9 16h4" />,
  ],
  clock: [
    <circle key="a" cx="12" cy="12" r="8.5" />,
    <path key="b" d="M12 7.5V12l3 2" />,
  ],
  chart: [
    <path key="a" d="M4.5 19.5h15" />,
    <path key="b" d="M7 16v-5M12 16V6M17 16V9" />,
  ],
  target: [
    <circle key="a" cx="12" cy="12" r="8.5" />,
    <circle key="b" cx="12" cy="12" r="4.5" />,
    <circle key="c" cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />,
  ],
  users: [
    <path key="a" d="M8.7 11.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />,
    <path key="b" d="M3.8 19.2c.7-3.4 2.6-5.1 4.9-5.1s4.2 1.7 4.9 5.1" />,
    <path key="c" d="M15.7 10.9a2.6 2.6 0 1 0 0-5.2" />,
    <path key="d" d="M15.5 14.2c2.1.2 3.7 1.9 4.2 4.7" />,
  ],
  userPlus: [
    <path key="a" d="M9.5 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />,
    <path key="b" d="M4 19.4c.8-3.6 2.9-5.4 5.5-5.4 1.8 0 3.4.9 4.5 2.6" />,
    <path key="c" d="M18 13.5v6M15 16.5h6" />,
  ],
  phone: [
    <rect key="a" x="7.5" y="2.8" width="9" height="18.4" rx="2.2" />,
    <path key="b" d="M10.5 5.8h3M11.2 18.2h1.6" />,
  ],
  wifi: [
    <path key="a" d="M4.5 9.4a11.8 11.8 0 0 1 15 0" />,
    <path key="b" d="M7.5 12.3a7.3 7.3 0 0 1 9 0" />,
    <path key="c" d="M10.3 15.2a2.8 2.8 0 0 1 3.4 0" />,
    <circle key="d" cx="12" cy="18.1" r=".8" fill="currentColor" stroke="none" />,
  ],
  tv: [
    <rect key="a" x="4" y="6" width="16" height="10.5" rx="2" />,
    <path key="b" d="M9 20h6M12 16.5V20" />,
  ],
  device: [
    <rect key="a" x="6" y="4" width="12" height="16" rx="2.4" />,
    <path key="b" d="M9 7h6M9 10h6M9 13h3" />,
  ],
  headset: [
    <path key="a" d="M5 13v-1a7 7 0 0 1 14 0v1" />,
    <rect key="b" x="3.8" y="12.5" width="3.8" height="5.3" rx="1.4" />,
    <rect key="c" x="16.4" y="12.5" width="3.8" height="5.3" rx="1.4" />,
    <path key="d" d="M16.5 19.3c-1 .9-2.5 1.4-4.5 1.4" />,
  ],
  shield: [
    <path key="a" d="M12 3.4 18.5 6v5.2c0 4.1-2.6 7.3-6.5 9.4-3.9-2.1-6.5-5.3-6.5-9.4V6z" />,
    <path key="b" d="m8.8 12.1 2.1 2.1 4.4-4.6" />,
  ],
  package: [
    <path key="a" d="m12 3.5 7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" />,
    <path key="b" d="M4.8 7.9 12 12l7.2-4.1M12 12v8.3" />,
  ],
  signal: [
    <path key="a" d="M4.5 18.5h15" />,
    <path key="b" d="M7 16.2v-2.5M11 16.2v-5M15 16.2v-8M19 16.2V5.8" />,
  ],
  check: [
    <path key="a" d="m5 12.5 4.2 4.2L19 7" />,
  ],
  hourglass: [
    <path key="a" d="M7 3.5h10M7 20.5h10M8 3.5c0 4.3 2.4 5.3 4 7 1.6-1.7 4-2.7 4-7M8 20.5c0-4.3 2.4-5.3 4-7 1.6 1.7 4 2.7 4 7" />,
  ],
  tools: [
    <path key="a" d="m14.2 5.2 4.6 4.6" />,
    <path key="b" d="M16.8 3.6 20.4 7l-9.9 9.9-3.7.7.7-3.7z" />,
    <path key="c" d="m5.3 18.7 4.5-4.5" />,
  ],
  trash: [
    <path key="a" d="M5 7h14" />,
    <path key="b" d="M9 7V4.8h6V7" />,
    <path key="c" d="M7.2 7.5 8 20h8l.8-12.5" />,
    <path key="d" d="M10.5 11v5M13.5 11v5" />,
  ],
  eye: [
    <path key="a" d="M3.5 12s3-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3 5.5-8.5 5.5S3.5 12 3.5 12Z" />,
    <circle key="b" cx="12" cy="12" r="2.4" />,
  ],
  edit: [
    <path key="a" d="M5 19h4.2L18.7 9.5a2.3 2.3 0 0 0-3.2-3.2L6 15.8z" />,
    <path key="b" d="m14.2 7.6 2.2 2.2" />,
  ],
};

export function AppIcon({ name = "package", size = 18, color = "currentColor", strokeWidth = 1.9, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {ICON_PATHS[name] || ICON_PATHS.package}
    </svg>
  );
}

export function IconBadge({ name, size = 30, iconSize = 16, color = "#DA291C", subtle = false, style }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        color: "#FFFFFF",
        background: subtle ? `${color}1F` : `linear-gradient(135deg, ${color}, #7A0F0F)`,
        border: `1px solid ${color}66`,
        boxShadow: subtle ? "none" : `0 8px 16px ${color}33`,
        ...style,
      }}
    >
      <AppIcon name={name} size={iconSize} />
    </span>
  );
}
