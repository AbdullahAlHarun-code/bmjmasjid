type BkashWordmarkProps = {
  label: string;
};

/**
 * Temporary bKash wordmark — see docs/assets/bkash-branding.md.
 * Brand pink #E2136E; does not imply merchant certification or gateway integration.
 */
export function BkashWordmark({ label }: BkashWordmarkProps) {
  return (
    <span
      className="inline-flex items-center rounded-[0.35rem] px-3 py-1.5 text-lg font-bold tracking-wide text-white"
      style={{ backgroundColor: "#E2136E" }}
      aria-hidden={false}
    >
      {label}
    </span>
  );
}
