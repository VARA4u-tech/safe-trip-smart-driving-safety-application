import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: number | string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "100%",
}) => {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Shield with gold border */}
        <path
          d="M256 460C256 460 410 420 410 260V140L256 80L102 140V260C102 420 256 460 256 460Z"
          fill="#1B2B38"
          stroke="#C5A028"
          strokeWidth="24"
          strokeLinejoin="round"
        />

        {/* Interior Clipping */}
        <clipPath id="shield_interior">
          <path d="M256 460C256 460 410 420 410 260V140L256 80L102 140V260C102 420 256 460 256 460Z" />
        </clipPath>

        <g clipPath="url(#shield_interior)">
          {/* Gold Ground / Perspective area */}
          <path
            d="M256 460L410 260V140H102V260L256 460Z"
            fill="#C5A028"
            fillOpacity="0.8"
          />

          {/* Central Navy Road Surface */}
          <path
            d="M256 460C256 360 460 300 350 140H162C52 300 256 360 256 460Z"
            fill="#1B2B38"
          />

          {/* Road Dashes */}
          <path
            d="M256 460C256 360 460 300 350 140"
            stroke="white"
            strokeWidth="8"
            strokeDasharray="12 20"
            opacity="0.6"
            strokeLinecap="round"
          />
        </g>

        {/* Floating Location Pin at the top point */}
        <g transform="translate(256, 120)">
          <path
            d="M0 45C16.5685 45 30 31.5685 30 15C30 -1.56854 16.5685 -15 0 -15C-16.5685 -15 -30 -1.56854 -30 15C-30 31.5685 -16.5685 45 0 45Z"
            fill="#C5A028"
          />
          <circle cx="0" cy="15" r="8" fill="#1B2B38" />
        </g>
      </svg>
    </div>
  );
};

export default BrandLogo;
