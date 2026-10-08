import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="Cartoleria Bambù - Home">
      <Image
        src="/logo-bambu.png"
        alt="Cartoleria Bambù"
        width={295}
        height={160}
        priority={priority}
        sizes="96px"
        className="h-10 w-auto sm:h-12"
      />
    </Link>
  );
}
