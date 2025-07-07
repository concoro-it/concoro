import { cn } from '@/lib/utils';
import { type LucideProps } from 'lucide-react';

export type SpinnerProps = LucideProps & {
  variant?: 'infinite';
};

export const Spinner = ({ size = 24, ...props }: SpinnerProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid"
    {...props}
    className={cn("text-primary", props.className)}
  >
    <title>Sta caricando...</title>
    <style>{`
      @keyframes infinite-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeDasharray="205.271142578125 51.317785644531256"
      d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
      strokeLinecap="round"
      style={{
        transform: 'scale(0.8) rotate(-210deg)',
        transformOrigin: '50px 50px',
        animation: 'infinite-pulse 2s ease-in-out infinite',
      }}
    >
      <animate
        attributeName="stroke-dashoffset"
        repeatCount="indefinite"
        dur="0.75s"
        keyTimes="0;1"
        values="0;256.58892822265625"
      />
    </path>
  </svg>
); 