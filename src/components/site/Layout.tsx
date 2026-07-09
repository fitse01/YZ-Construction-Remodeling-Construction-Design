import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { FloatingButtons } from "./FloatingButtons";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent)]" />
      <div className="container-x pt-16 pb-16 md:pt-24 md:pb-20 max-w-4xl">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
