export default function Loading() {
  return (
    <div className="site-container py-16" aria-hidden>
      <div className="h-8 w-2/3 max-w-md rounded bg-[color:var(--bm-primary)]/10" />
      <div className="mt-4 h-4 w-full max-w-2xl rounded bg-[color:var(--bm-border)]" />
      <div className="mt-2 h-4 w-5/6 max-w-xl rounded bg-[color:var(--bm-border)]" />
    </div>
  );
}
