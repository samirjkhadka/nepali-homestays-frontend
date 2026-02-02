import { SVGProps } from 'react';

export function Temple(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 2L2 7v13h20V7L12 2z" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
    </svg>
  );
}
