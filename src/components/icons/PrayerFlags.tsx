import { SVGProps } from 'react';

export function PrayerFlags(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 4v16" />
      <path d="M22 4v16" />
      <rect x="5" y="4" width="4" height="6" />
      <rect x="10" y="6" width="4" height="6" />
      <rect x="15" y="4" width="4" height="6" />
    </svg>
  );
}
