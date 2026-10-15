import type { SVGAttributes } from 'react';

/**
 * Froova mark: a snowflake inside a frosted squircle.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <defs>
                <linearGradient
                    id="froova-bg"
                    x1="6"
                    y1="4"
                    x2="58"
                    y2="62"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#7DD3FC" />
                    <stop offset="0.55" stopColor="#6366F1" />
                    <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient
                    id="froova-shine"
                    x1="32"
                    y1="0"
                    x2="32"
                    y2="34"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#fff" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="18" fill="url(#froova-bg)" />
            <rect width="64" height="34" rx="18" fill="url(#froova-shine)" />
            <g
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M32 14v36" />
                <path d="M16.4 23l31.2 18" />
                <path d="M16.4 41l31.2-18" />
                <path d="M26.5 16.5L32 21l5.5-4.5" />
                <path d="M26.5 47.5L32 43l5.5 4.5" />
                <path d="M15.5 30.5l7-1.2-2.4-6.6" />
                <path d="M48.5 33.5l-7 1.2 2.4 6.6" />
                <path d="M20.1 41.3l2.4-6.6-7-1.2" />
                <path d="M43.9 22.7l-2.4 6.6 7 1.2" />
            </g>
        </svg>
    );
}
