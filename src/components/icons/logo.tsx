import type { SVGProps } from 'react';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M12.75 12C12.75 11.3096 13.3096 10.75 14 10.75H23C24.6569 10.75 26 12.0931 26 13.75V13.75C26 15.4069 24.6569 16.75 23 16.75H14C13.3096 16.75 12.75 16.1904 12.75 15.5V15.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.25 20C19.25 20.6904 18.6904 21.25 18 21.25H9C7.34315 21.25 6 19.9069 6 18.25V18.25C6 16.5931 7.34315 15.25 9 15.25H18C18.6904 15.25 19.25 15.8096 19.25 16.5V16.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
