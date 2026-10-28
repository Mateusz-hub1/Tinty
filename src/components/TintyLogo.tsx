import React from 'react';

interface TintyLogoProps {
    className?: string;
}

export default function TintyLogo({ className = 'h-8 w-8' }: TintyLogoProps) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Tinty"
        >
            <defs>
                <linearGradient
                    id="tintyDropGrad"
                    x1="12"
                    y1="8"
                    x2="52"
                    y2="56"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="50%" stopColor="#c026d3" />
                    <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient
                    id="tintySwirlGrad"
                    x1="18"
                    y1="24"
                    x2="46"
                    y2="52"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#7e22ce" />
                    <stop offset="60%" stopColor="#db2777" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
            </defs>

            <rect width="64" height="64" rx="16" fill="#121118" />

            <path
                d="M32 9C32 9 15 28.5 15 40.5C15 49.8888 22.6112 57.5 32 57.5C41.3888 57.5 49 49.8888 49 40.5C49 28.5 32 9 32 9Z"
                stroke="url(#tintyDropGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M23 30C20 38 24 47 33 49C39 50 44 46 44 41C41 44 35 45 30 41C25 37 24 32 23 30Z"
                fill="url(#tintySwirlGrad)"
            />

            <g transform="rotate(35 38 26)">
                <path
                    d="M35 24L41 24L39 40C38.8 41.5 37.2 41.5 37 40L35 24Z"
                    stroke="#f5d0fe"
                    strokeWidth="2.2"
                    fill="#121118"
                />
                <path d="M33 19H43L41 24H35L33 19Z" fill="#f5d0fe" />
                <path
                    d="M34 13V18M36.5 13V18M39 13V18M41.5 13V18"
                    stroke="#f5d0fe"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </g>

            <path
                d="M16 20L17.2 23.2L20.4 24.4L17.2 25.6L16 28.8L14.8 25.6L11.6 24.4L14.8 23.2L16 20Z"
                fill="#fde68a"
            />
            <path
                d="M51 28L51.8 30.2L54 31L51.8 31.8L51 34L50.2 31.8L48 31L50.2 30.2L51 28Z"
                fill="#fde68a"
            />
            <circle cx="36" cy="36" r="1.5" fill="#fde68a" />
        </svg>
    );
}