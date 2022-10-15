export type SwitchPanelIconRightProps = {
  className?: string;
};

export function SwitchPanelIconRight({ className }: SwitchPanelIconRightProps) {
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
        d="M12 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H12V2Z"
        fill="#3B82F6"
      />
    </svg>
  );
}
