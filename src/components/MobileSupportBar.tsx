import Link from "next/link";
import type { SiteContent } from "@/content";

type MobileSupportBarProps = {
  content: SiteContent;
};

export function MobileSupportBar({ content }: MobileSupportBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]/95 px-4 pt-2 backdrop-blur-sm md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href="/support"
        className="btn btn-primary w-full shadow-[var(--bm-shadow)]"
      >
        {content.shell.mobileSupportLabel}
      </Link>
    </div>
  );
}
