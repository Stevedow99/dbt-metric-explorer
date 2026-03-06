interface IconProps {
  size?: number;
  className?: string;
}

export function DbtMark({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#FF694B" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill="white"
      >
        dbt
      </text>
    </svg>
  );
}

export function DbtWordmark({ width = 40, height = 16, className }: { width?: number; height?: number; className?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="0" y="8" width="44" height="44" rx="10" fill="#FF694B" />
      <text
        x="22"
        y="38"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="white"
      >
        dbt
      </text>
      <text
        x="56"
        y="40"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fontSize="24"
        fill="currentColor"
      >
        Metric Explorer
      </text>
    </svg>
  );
}

export function SigmaLogo({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#1B1464" />
      <path
        d="M18 16H46L32 32L46 48H18L32 32L18 16Z"
        fill="#F7C948"
        stroke="#F7C948"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
