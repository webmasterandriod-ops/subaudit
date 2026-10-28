import React from 'react';

interface TactileReceiptIconProps {
  size?: number;
  className?: string;
}

/**
 * Tactile Ledger Icon Concept:
 * A dark receipt ticket with a torn bottom edge and one total circled in electric mint (#10F596).
 */
export const TactileReceiptIcon: React.FC<TactileReceiptIconProps> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer tactile frame */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="#12151E"
        stroke="#1E2433"
        strokeWidth="1.25"
      />
      {/* Dark receipt body with torn bottom edge */}
      <path
        d="M10 8C10 6.89543 10.8954 6 12 6H28C29.1046 6 30 6.89543 30 8V31.5L27.5 29.5L25 31.5L22.5 29.5L20 31.5L17.5 29.5L15 31.5L12.5 29.5L10 31.5V8Z"
        fill="#1A1F2C"
        stroke="#2B3245"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Receipt ledger lines */}
      <line
        x1="13.5"
        y1="11.5"
        x2="21.5"
        y2="11.5"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24.5"
        y1="11.5"
        x2="26.5"
        y2="11.5"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.5"
        y1="15.5"
        x2="19.5"
        y2="15.5"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24.5"
        y1="15.5"
        x2="26.5"
        y2="15.5"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Perforated divider */}
      <line
        x1="12.5"
        y1="19.5"
        x2="27.5"
        y2="19.5"
        stroke="#334155"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* One total circled in electric mint (#10F596) */}
      <ellipse
        cx="21"
        cy="24.5"
        rx="6"
        ry="3.2"
        stroke="#10F596"
        strokeWidth="1.5"
        transform="rotate(-4 21 24.5)"
      />
      <line
        x1="18"
        y1="24.5"
        x2="24"
        y2="24.5"
        stroke="#10F596"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};
