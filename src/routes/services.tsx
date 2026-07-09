import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import commercial from "@/assets/commercial.jpg";
import interior from "@/assets/interior.jpg";
import exterior from "@/assets/exterior.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Kitchens, Baths, Whole-Home & Commercial | YZ Construction" },
      {
        name: "description",
        content:
          "Full-service remodeling and construction in the DMV: kitchens, bathrooms, whole-home renovations, restaurant build-outs, commercial fit-outs, painting, flooring, framing and carpentry.",
      },
      { property: "og:title", content: "Services — YZ Construction" },
      { property: "og:description", content: "Design-build residential and commercial services in the DMV." },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const services = [
  {
    id: "kitchen",
    title: "Kitchen Remodeling",
    lead: "Custom cabinetry, natural stone, and lighting that actually works.",
    img: kitchen,
    bullets: ["Custom & semi-custom cabinetry", "Quartz, granite & marble tops", "Electrical, plumbing, ventilation", "Structural wall removal"],
  },
  {
    id: "bathroom",
    title: "Bathroom Remodeling",
    lead: "Spa-quality baths built for daily rituals.",
    img: bathroom,
    bullets: ["Wet-room & curbless showers", "Freestanding tub installs", "Heated floors & niches", "Waterproofing done right"],
  },
  {
    id: "home",
    title: "Whole-Home Renovation",
    lead: "Reshape how you live — one project, one team, one schedule.",
    img: interior,
    bullets: ["Additions & bump-outs", "Structural & load-bearing changes", "Kitchens + baths + finishes", "Permit and inspection handled"],
  },
  {
    id: "restaurant",
    title: "Restaurant Renovation",
    lead: "Fast-track build-outs that open on schedule.",
    img: restaurant,
    bullets: ["Hood, grease trap & MEP coordination", "ADA & health-code compliance", "Millwork & banquettes", "Night-shift work available"],
  },
  {
    id: "commercial",
    title: "Commercial Build-Out",
    lead: "Offices, retail, and mixed-use — turnkey delivery.",
    img: commercial,
    bullets: ["Tenant improvements", "Glass partitions & millwork", "MEP coordination", "After-hours install"],
  },
  {
    id: "exterior",
    title: "Exterior & Framing",
    lead: "Framing, siding, decks, and additions — the bones done right.",
    img: exterior,
    bullets: ["Rough & finish carpentry", "Framing & structural repair", "Siding, roofing coordination", "Decks & outdoor living"],
  },
];

const trades = [
  ["Interior Design", "Selections, drawings, and full FF&E."],
  ["Painting", "Interior & exterior, low-VOC finishes."],
  ["Flooring", "Hardwood, LVP, tile, refinishing."],
  ["Carpentry", "Trim, built-ins, custom millwork."],
  ["Framing", "Additions, walls, load-bearing work."],
  ["Tile & Stone", "Precision layout, waterproofed."],
];

function Services() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title="Design-build for homes and businesses across the DMV."
        description="One team from first sketch to final punch-list — with the crews, credentials, and coordination to deliver every scope, big or small."
      />

      {/* SERVICE INDEX */}
      <section className="section">
        <div className="container-x">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-center justify-between p-5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground transition"
              >
                <span className="font-display font-semibold">{s.title}</span>
                <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED SECTIONS */}
      {services.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={`section scroll-mt-24 ${i % 2 ? "bg-secondary/60 border-y border-border" : ""}`}
        >
          <div
            className={`container-x grid gap-10 lg:grid-cols-2 items-center ${
              i % 2 ? "lg:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div className="rounded-3xl overflow-hidden aspect-[4/3]">
              <img src={s.img} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div>
              <span className="eyebrow">0{i + 1} · Service</span>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">{s.title}</h2>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{s.lead}</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm">
                    <Check className="w-5 h-5 text-primary flex-none mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link to="/contact" className="btn-primary">Free Estimate</Link>
                <Link to="/projects" className="btn-outline">See Examples</Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* TRADES */}
      <section className="section">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Trades in-house</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Everything under one roof.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trades.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-border p-6">
                <div className="font-display font-semibold text-lg">{t}</div>
                <div className="text-sm text-muted-foreground mt-2">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section bg-foreground text-background">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow" style={{ color: "oklch(0.78 0.16 145)" }}>
              How it works
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">A process built to remove surprises.</h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              ["01", "Discovery Call", "Free 20-min call to understand scope and budget."],
              ["02", "On-Site Estimate", "Walk-through, measurements, fixed-price bid."],
              ["03", "Design + Build", "Drawings, selections, then execution by our crews."],
              ["04", "Warranty", "Final walk, punch-list, 2-year workmanship warranty."],
            ].map(([n, t, d]) => (
              <li key={n}>
                <div className="font-num text-primary-glow text-sm tracking-[0.25em]">{n}</div>
                <h3 className="mt-4 text-2xl font-display font-semibold">{t}</h3>
                <p className="mt-2 text-background/60 text-sm leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-x max-w-3xl">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Common questions.</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {[
              ["Do you provide a fixed price?", "Yes — after the on-site estimate, we submit a fixed-price bid so there are no surprises unless you change scope."],
              ["How long is a typical bathroom?", "Standard baths run 3–5 weeks; full primary baths 5–7 weeks."],
              ["Do you help with permits?", "Yes — we handle permits, drawings, and inspections end-to-end."],
              ["Can we live in the house during a remodel?", "For most projects, yes. We seal work zones, protect finishes, and clean daily."],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                  {q}
                  <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 grid gap-8 md:grid-cols-[1.6fr_1fr] items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Have a project in mind? Let's price it.</h2>
              <p className="mt-4 text-primary-foreground/80">Free on-site estimate. Fixed-price bid within 5 business days.</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link to="/contact" className="btn-outline !border-white !text-white hover:!bg-white/10">Free Estimate</Link>
              <a href="tel:+15551234567" className="btn-outline !border-white !text-white hover:!bg-white/10">Call Us</a>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
