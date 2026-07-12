import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, PlayCircle, MapPin, Calendar } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import commercial from "@/assets/commercial.jpg";
import exterior from "@/assets/exterior.jpg";
import interior from "@/assets/interior.jpg";
import before from "@/assets/before.jpg";
import after from "@/assets/after.jpg";
import carpentry from "@/assets/carpentery.jpeg"; // Import your carpentry/furniture image

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects & Portfolio  YZ Construction, DMV" },
      {
        name: "description",
        content:
          "Browse our recent kitchen, bath, whole-home, restaurant and commercial construction projects across Maryland, DC and Northern Virginia.",
      },
      { property: "og:title", content: "Projects  YZ Construction" },
      {
        property: "og:description",
        content: "Portfolio of residential & commercial builds across the DMV.",
      },
      { property: "og:url", content: "/projects" },
      { property: "og:image", content: kitchen },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: Projects,
});

const categories = [
  "All",
  "Residential",
  "Kitchen",
  "Bathroom",
  "Restaurant",
  "Commercial",
  "Exterior",
  "Furniture & Carpentry",
] as const;

const projects = [
  {
    title: "Waterfall Island Kitchen",
    loc: "Bethesda, MD",
    cat: "Kitchen",
    year: "2025",
    img: kitchen,
  },
  { title: "Moody Spa Bath", loc: "Washington, DC", cat: "Bathroom", year: "2025", img: bathroom },
  {
    title: "Brick & Brass Bistro",
    loc: "Arlington, VA",
    cat: "Restaurant",
    year: "2024",
    img: restaurant,
  },
  {
    title: "Open-Plan Office Fit-Out",
    loc: "Silver Spring, MD",
    cat: "Commercial",
    year: "2024",
    img: commercial,
  },
  {
    title: "Craftsman Revival",
    loc: "Kensington, MD",
    cat: "Exterior",
    year: "2024",
    img: exterior,
  },
  {
    title: "Minimal Living Redesign",
    loc: "Rockville, MD",
    cat: "Residential",
    year: "2025",
    img: interior,
  },
  {
    title: "Executive Bath Retreat",
    loc: "McLean, VA",
    cat: "Bathroom",
    year: "2024",
    img: bathroom,
  },
  {
    title: "Chef's Kitchen Rebuild",
    loc: "Chevy Chase, MD",
    cat: "Kitchen",
    year: "2023",
    img: kitchen,
  },
  {
    title: "Custom Furniture & Cabinetry",
    loc: "Georgetown, DC",
    cat: "Furniture & Carpentry",
    year: "2024",
    img: carpentry,
  },
];

function Projects() {
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (cat === "All" ||
            p.cat === cat ||
            (cat === "Residential" && ["Kitchen", "Bathroom", "Exterior"].includes(p.cat))) &&
          (q === "" || (p.title + p.loc).toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, q],
  );

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Portfolio & Gallery"
        title="Real projects. Real photography. Real proof."
        description="Every project below was designed, permitted, and built by the YZ Construction team. Browse by category, or search by neighborhood."
      />

      {/* FILTERS */}
      <section className="border-b border-border sticky top-16 md:top-20 z-30 bg-background/85 backdrop-blur">
        <div className="container-x py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  cat === c ? "bg-foreground text-background" : "bg-secondary hover:bg-secondary/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects…"
              className="pl-10 pr-4 py-2.5 rounded-full bg-secondary border border-transparent focus:border-primary focus:outline-none text-sm w-full md:w-64"
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="section">
        <div className="container-x">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.title}
                className="card-lift group overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase text-primary">
                    <span>{p.cat}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-display font-semibold">{p.title}</h3>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {p.loc}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {p.year}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No projects match that search.
            </p>
          )}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Before & after</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Same footprint. Different life.
            </h2>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-center">
            <BeforeAfter before={before} after={after} alt="Bethesda kitchen renovation" />
            <div>
              <div className="text-xs font-mono tracking-[0.22em] uppercase text-primary">
                Case Study
              </div>
              <h3 className="mt-3 text-2xl font-display font-semibold">
                Bethesda Kitchen · 8 weeks
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Original 1970s oak kitchen, closed off from the dining room. Removed a load-bearing
                wall, added a steel beam, redesigned the layout around a 10-ft island, and
                refinished the original white-oak floors.
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                {[
                  ["Scope", "Full remodel"],
                  ["Timeline", "8 weeks"],
                  ["Budget", "$$$"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-1 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO GALLERY */}
      <section className="section">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Video walk-throughs</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">See a project come together.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[kitchen, bathroom, restaurant].map((img, i) => (
              <button key={i} className="group relative aspect-video rounded-2xl overflow-hidden">
                <img
                  src={img}
                  alt="Video thumbnail"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 grid place-items-center">
                  <PlayCircle className="w-14 h-14 text-white drop-shadow-lg" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="rounded-3xl bg-foreground text-background p-10 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your project could be next.
            </h2>
            <p className="mt-4 text-background/70 max-w-xl mx-auto">
              Free consultation. Fixed-price bid. Fully licensed and insured.
            </p>
            <Link to="/contact" className="btn-primary mt-8">
              Start Your Project
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
