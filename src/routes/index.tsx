import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Users,
  Hammer,
  Brush,
  Ruler,
  Home as HomeIcon,
  UtensilsCrossed,
  Building2,
  Star,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Counter } from "@/components/site/Counter";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import hero from "@/assets/hero.jpg";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import commercial from "@/assets/commercial.jpg";
import exterior from "@/assets/exterior.jpg";
import interior from "@/assets/interior.jpg";
import before from "@/assets/before.jpg";
import after from "@/assets/after.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YZ Construction  Remodeling & Construction in Silver Spring, MD" },
      {
        name: "description",
        content:
          "Boutique remodeling and construction serving MD, DC & VA. Kitchens, bathrooms, whole-home renovations, restaurants and commercial builds licensed and insured.",
      },
      { property: "og:title", content: "YZ Construction  Building Better Spaces" },
      {
        property: "og:description",
        content: "Kitchen, bath, whole-home, restaurant and commercial renovation in the DMV.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const services = [
  {
    icon: HomeIcon,
    title: "Home Renovation",
    desc: "Full-scope remodels that reshape the way you live.",
    img: interior,
  },
  {
    icon: Hammer,
    title: "Kitchen Remodeling",
    desc: "Custom cabinetry, stone, lighting  the heart of the home.",
    img: kitchen,
  },
  {
    icon: Brush,
    title: "Bathroom Remodeling",
    desc: "Spa-quality baths built for daily rituals.",
    img: bathroom,
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant Renovation",
    desc: "Fast-track build-outs that open on schedule.",
    img: restaurant,
  },
  {
    icon: Building2,
    title: "Commercial Build-Out",
    desc: "Offices, retail, and mixed-use  turnkey delivery.",
    img: commercial,
  },
  {
    icon: Ruler,
    title: "Interior Design",
    desc: "Design-build under one roof, one point of contact.",
    img: exterior,
  },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <img
          src={hero}
          alt="Modern kitchen renovation by YZ Construction"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        <div className="container-x relative pb-16 md:pb-24 pt-32 grid gap-10 md:grid-cols-[1.4fr_1fr] items-end">
          <div className="text-white">
            <span className="eyebrow" style={{ color: "oklch(0.78 0.16 145)" }}>
              Silver Spring, MD · Serving the DMV
            </span>
            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] tracking-tight max-w-3xl">
              Building better <span className="text-primary-glow">spaces</span> for the way you live
              and work.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed">
              A boutique design-build studio delivering premium residential and commercial
              construction across Maryland, DC, and Virginia with the craft, care, and communication
              a big project deserves.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">
                Get a Free Estimate <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/projects" className="btn-ghost-light">
                View Our Projects
              </Link>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-3 text-white/85">
            {[
              ["Licensed", "MHIC"],
              ["Insured", "Fully"],
              ["Warranty", "1-Year"],
              ["Response", "< 24h"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-5"
              >
                <div className="text-[10px] tracking-[0.22em] font-mono uppercase text-white/60">
                  {label}
                </div>
                <div className="mt-2 text-2xl font-display font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS / OVERVIEW */}
      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.3fr] items-start">
          <div>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">
              A family-owned shop with a designer's eye and a builder's discipline.
            </h2>
          </div>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Founded by Yohannes Zewde in Silver Spring, YZ Construction has spent over a decade
              renovating homes, restaurants, and commercial spaces across the DMV. We're small
              enough to care about every detail and structured enough to deliver on time and on
              budget.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border">
              {[
                { n: 12, s: "+", l: "Years building" },
                { n: 320, s: "+", l: "Projects delivered" },
                { n: 95, s: "%", l: "Client satisfaction" },
                { n: 24, s: "h", l: "Response time" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-4xl md:text-5xl font-bold text-foreground">
                    <Counter value={s.n} suffix={s.s} />
                  </div>
                  <div className="mt-2 text-xs font-mono tracking-[0.18em] uppercase text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Why YZ Construction</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              The details other contractors skip.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                t: "Licensed & Insured",
                d: "MHIC licensed, fully insured, and bonded on every job.",
              },
              {
                icon: Award,
                t: "1-Year Warranty",
                d: "Workmanship warranty on every project, no fine print.",
              },
              {
                icon: Users,
                t: "In-House Crews",
                d: "Our tradespeople  not subs you'll never meet again.",
              },
              {
                icon: Clock,
                t: "On-Time Delivery",
                d: "Weekly schedule updates and a real project manager.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="card-lift bg-card border border-border rounded-2xl p-7">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="eyebrow">What we build</span>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Design-build services under one roof.
              </h2>
            </div>
            <Link to="/services" className="btn-outline">
              All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ icon: Icon, title, desc, img }) => (
              <Link
                key={title}
                to="/services"
                className="card-lift group relative overflow-hidden rounded-2xl bg-card border border-border"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-[0.2em] uppercase">Service</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary transition">
                    Learn more <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
            <div>
              <span className="eyebrow">Featured work</span>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Recent projects across the DMV.
              </h2>
            </div>
            <Link to="/projects" className="btn-outline">
              Full Portfolio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-6">
            <FeatureCard
              className="md:col-span-4 aspect-[16/10]"
              img={kitchen}
              tag="Kitchen · Bethesda, MD"
              title="Open-plan chef's kitchen with waterfall island"
            />
            <FeatureCard
              className="md:col-span-2 aspect-[4/5]"
              img={bathroom}
              tag="Bathroom · DC"
              title="Moody spa-bath retreat"
            />
            <FeatureCard
              className="md:col-span-2 aspect-[4/5]"
              img={restaurant}
              tag="Restaurant · Arlington, VA"
              title="Brick-and-brass bistro fit-out"
            />
            <FeatureCard
              className="md:col-span-4 aspect-[16/10]"
              img={exterior}
              tag="Whole-home · Silver Spring, MD"
              title="Craftsman revival, top to bottom"
            />
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] items-center">
          <div>
            <span className="eyebrow">Before & after</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              The transformation is real. Drag to see it.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              We work with what's there original bones, load paths, natural light and reshape it
              into something you'll actually love using.
            </p>
            <Link to="/projects" className="btn-outline mt-8">
              More Before / After <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <BeforeAfter before={before} after={after} alt="Kitchen renovation" />
        </div>
      </section>

      {/* PROCESS */}
      <section className="section bg-foreground text-background">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow" style={{ color: "oklch(0.78 0.16 145)" }}>
              Our process
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Four steps. No surprises.
            </h2>
          </div>

          <ol className="mt-14 grid gap-8 md:grid-cols-4 relative">
            {[
              ["01", "Consultation", "On-site walkthrough, scope, and honest budget conversation."],
              [
                "02",
                "Design & Estimate",
                "Detailed plans, material selections, and a fixed-price bid.",
              ],
              ["03", "Build", "In-house crews, weekly updates, and a clean job site."],
              [
                "04",
                "Walk-through",
                "Punch-list, final inspection, and 2-year workmanship warranty.",
              ],
            ].map(([n, t, d]) => (
              <li key={n} className="relative">
                <div className="font-num text-primary-glow text-sm tracking-[0.25em]">{n}</div>
                <h3 className="mt-4 text-2xl font-display font-semibold">{t}</h3>
                <p className="mt-3 text-sm text-background/60 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="eyebrow">Word of mouth</span>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Trusted by homeowners and business owners.
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-medium">4.9 avg · 120+ reviews</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                q: "Yohannesand his crew transformed our 1960s kitchen into something out of a magazine. Every deadline hit. Every dollar accounted for.",
                a: "Sarah & Michael K.",
                l: "Bethesda, MD",
              },
              {
                q: "We opened our restaurant a week ahead of schedule. That never happens. The finish work is impeccable.",
                a: "Andres L.",
                l: "Restaurant owner · Arlington, VA",
              },
              {
                q: "Best contractor experience we've ever had. Clean site, on time, and the primary bath is genuinely a room I want to be in.",
                a: "Priya S.",
                l: "Silver Spring, MD",
              },
            ].map((t) => (
              <figure
                key={t.a}
                className="card-lift bg-card border border-border rounded-2xl p-7 flex flex-col"
              >
                <div className="flex text-primary mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg leading-relaxed flex-1">"{t.q}"</blockquote>
                <figcaption className="mt-6 pt-6 border-t border-border">
                  <div className="font-semibold">{t.a}</div>
                  <div className="text-sm text-muted-foreground">{t.l}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE AREAS + FAQ preview */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <span className="eyebrow">
              <MapPin className="w-3 h-3" /> Service areas
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Proudly serving the DMV.</h2>
            <p className="mt-4 text-muted-foreground">
              Based in Silver Spring, we work throughout Montgomery County, Prince George's County,
              DC, Arlington and Fairfax.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Silver Spring",
                "Bethesda",
                "Rockville",
                "Chevy Chase",
                "Kensington",
                "Takoma Park",
                "Washington DC",
                "Arlington",
                "Alexandria",
                "McLean",
                "Fairfax",
              ].map((c) => (
                <span
                  key={c}
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">Common questions</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Quick answers.</h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {[
                [
                  "How long does a kitchen remodel take?",
                  "Most kitchens run 6–10 weeks from demo to final walk-through, depending on scope and material lead times.",
                ],
                [
                  "Are you licensed and insured?",
                  "Yes  MHIC licensed in Maryland, fully insured, and bonded on every project.",
                ],
                [
                  "Do you handle design too?",
                  "We're a design-build shop. You get one team from first sketch to final punch-list.",
                ],
                [
                  "What's your service area?",
                  "The DMV: Maryland, Washington DC, and Northern Virginia.",
                ],
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
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-10 md:p-16">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1.6fr_1fr] items-center">
              <div>
                <span className="eyebrow" style={{ color: "oklch(0.78 0.16 145)" }}>
                  Ready when you are
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">
                  Let's talk about your project.
                </h2>
                <p className="mt-4 text-background/70 max-w-xl">
                  Free on-site consultation. No obligation, no pressure just honest numbers and a
                  realistic timeline.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link to="/contact" className="btn-primary">
                  Free Estimate
                </Link>
                <a href="tel:+12407818778" className="btn-ghost-light">
                  (240) 781-8778
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function FeatureCard({
  img,
  tag,
  title,
  className = "",
}: {
  img: string;
  tag: string;
  title: string;
  className?: string;
}) {
  return (
    <Link
      to="/projects"
      className={`card-lift group relative overflow-hidden rounded-2xl ${className}`}
    >
      <img
        src={img}
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-7 text-white">
        <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-white/70">
          {tag}
        </span>
        <h3 className="mt-2 text-xl md:text-2xl font-display font-semibold max-w-md">{title}</h3>
      </div>
    </Link>
  );
}
