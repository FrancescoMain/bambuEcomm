import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Pumpkin } from "./halloween/art";

export function Logo({ className, priority, halloween }: { className?: string; priority?: boolean; halloween?: boolean }) {
  return (
    <Link href="/" className={cn("relative inline-flex shrink-0 items-center", className)} aria-label="Cartoleria Bambù - Home">
      <Image
        src="/logo-bambu.png"
        alt="Cartoleria Bambù"
        width={295}
        height={160}
        priority={priority}
        sizes="96px"
        className="h-10 w-auto sm:h-12"
      />
      {halloween && <Pumpkin className="absolute -bottom-1 -right-3 h-6 w-6 -rotate-12 sm:h-7 sm:w-7" />}
    </Link>
  );
}
