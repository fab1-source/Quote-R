import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'banner' | 'emblem';
}

/**
 * Isolated IGC Striped Oval Emblem
 */
export const InterglassEmblem: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = '',
  width = 54,
  height = 36,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 110 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label="IGC Emblem"
    >
      <defs>
        <clipPath id="igc-emblem-clip">
          <ellipse cx="55" cy="35" rx="51" ry="32" />
        </clipPath>
      </defs>

      {/* Background fill */}
      <ellipse cx="55" cy="35" rx="51" ry="32" fill="#FFFFFF" />

      {/* Clipped horizontal maroon slats */}
      <g clipPath="url(#igc-emblem-clip)">
        <rect x="0" y="5" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="11.5" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="18" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="24.5" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="31" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="37.5" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="44" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="50.5" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="57" width="110" height="3.5" fill="#7B1818" />
        <rect x="0" y="63.5" width="110" height="3.5" fill="#7B1818" />
      </g>

      {/* White oval clearing behind letters */}
      <ellipse cx="55" cy="35" rx="30" ry="16" fill="#FFFFFF" />

      {/* Central IGC Typography */}
      <text
        x="55"
        y="42.5"
        fill="#7B1818"
        fontFamily="'Times New Roman', Times, Georgia, serif"
        fontSize="24"
        fontWeight="bold"
        fontStyle="italic"
        letterSpacing="1.2"
        textAnchor="middle"
      >
        IGC
      </text>

      {/* Crisp outer oval border */}
      <ellipse cx="55" cy="35" rx="51" ry="32" fill="none" stroke="#7B1818" strokeWidth="1.6" />
    </svg>
  );
};

/**
 * Full Interglass Company Logo Banner with IGC emblem, company title, and QUOTATION subtitle
 * Faithfully reproduced from official Interglass document assets.
 */
export const InterglassLogoBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full max-w-[760px] mx-auto select-none ${className}`}>
      <svg
        viewBox="0 0 740 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-label="INTERGLASS CO. LLC QUOTATION"
      >
        <defs>
          <clipPath id="igc-banner-emblem-clip">
            <ellipse cx="60" cy="38" rx="54" ry="33" />
          </clipPath>
        </defs>

        {/* --- 1. LEFT: IGC STRIPED EMBLEM --- */}
        <g id="igc-emblem">
          {/* Base white ellipse */}
          <ellipse cx="60" cy="38" rx="54" ry="33" fill="#FFFFFF" />

          {/* Horizontal maroon stripes */}
          <g clipPath="url(#igc-banner-emblem-clip)">
            <rect x="0" y="7" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="13.5" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="20" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="26.5" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="33" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="39.5" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="46" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="52.5" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="59" width="120" height="3.5" fill="#7B1818" />
            <rect x="0" y="65.5" width="120" height="3.5" fill="#7B1818" />
          </g>

          {/* Center white clearing for text */}
          <ellipse cx="60" cy="38" rx="32" ry="17" fill="#FFFFFF" />

          {/* IGC typography */}
          <text
            x="60"
            y="46"
            fill="#7B1818"
            fontFamily="'Times New Roman', Times, Georgia, serif"
            fontSize="26"
            fontWeight="bold"
            fontStyle="italic"
            letterSpacing="1.5"
            textAnchor="middle"
          >
            IGC
          </text>

          {/* Outer oval boundary stroke */}
          <ellipse cx="60" cy="38" rx="54" ry="33" fill="none" stroke="#7B1818" strokeWidth="1.6" />
        </g>

        {/* --- 2. RIGHT: COMPANY NAME --- */}
        <g id="company-name">
          <text
            x="138"
            y="46"
            fill="#7B1818"
            fontFamily="'Times New Roman', Times, Georgia, serif"
            fontSize="34"
            fontWeight="bold"
            fontStyle="italic"
            letterSpacing="3.5"
          >
            INTERGLASS CO. LLC
          </text>

          {/* Underline beneath INTERGLASS CO. LLC */}
          <line x1="136" y1="55" x2="725" y2="55" stroke="#7B1818" strokeWidth="1.6" />
        </g>

        {/* --- 3. SUBTITLE: QUOTATION (Centered under INTERGLASS CO. LLC) --- */}
        <g id="quotation-title">
          <text
            x="430"
            y="81"
            fill="#0B3868"
            fontFamily="'Times New Roman', Times, Georgia, serif"
            fontSize="22"
            fontWeight="bold"
            letterSpacing="2.5"
            textAnchor="middle"
          >
            QUOTATION
          </text>
          {/* Underline under QUOTATION */}
          <line x1="340" y1="86" x2="520" y2="86" stroke="#0B3868" strokeWidth="1.4" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Universal logo component for backwards compatibility
 */
export const InterglassLogo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'emblem' }) => {
  if (variant === 'banner' || size === 'full') {
    return <InterglassLogoBanner className={className} />;
  }

  const dims =
    size === 'sm'
      ? { w: 42, h: 27 }
      : size === 'lg'
      ? { w: 75, h: 48 }
      : { w: 56, h: 36 };

  return <InterglassEmblem className={className} width={dims.w} height={dims.h} />;
};

