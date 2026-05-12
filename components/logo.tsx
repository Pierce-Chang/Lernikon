import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "lockup";

const ASSETS: Record<
  LogoVariant,
  { src: string; width: number; height: number }
> = {
  mark: {
    src: "/logos/paperplane/icon-primary.svg",
    width: 512,
    height: 512,
  },
  lockup: {
    src: "/logos/paperplane/lockup-horizontal-accent.svg",
    width: 1500,
    height: 360,
  },
};

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  /** Link target. Pass `null` to render a plain image without a wrapping link. */
  href?: string | null;
  priority?: boolean;
}

export const Logo = ({
  variant = "lockup",
  className,
  href = "/",
  priority = false,
}: LogoProps) => {
  const asset = ASSETS[variant],
    img = (
      <Image
        src={asset.src}
        alt="Lernikon"
        width={asset.width}
        height={asset.height}
        priority={priority}
        unoptimized
        className={cn("h-7 w-auto", className)}
      />
    );

  if (href === null) return img;

  return (
    <Link
      href={href}
      aria-label="Lernikon Startseite"
      className="inline-flex items-center"
    >
      {img}
    </Link>
  );
};
