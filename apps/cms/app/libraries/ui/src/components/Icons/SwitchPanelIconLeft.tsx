export type SwitchPanelIconLeftProps = {
  className?: string;
};

export function SwitchPanelIconLeft({ className }: SwitchPanelIconLeftProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <path
        d="M16 1H4C2.34315 1 1 2.34315 1 4V16C1 17.6569 2.34315 19 4 19H16C17.6569 19 19 17.6569 19 16V4C19 2.34315 17.6569 1 16 1Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 18L4 18C2.89543 18 2 17.1046 2 16L2 4C2 2.89543 2.89543 2 4 2L8 2L8 18Z"
        fill="#3B82F6"
      />
    </svg>
  );
}
