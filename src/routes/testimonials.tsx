import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, PlayCircle, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import interior from "@/assets/interior.jpg";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials, Reviews & Blog  YZ Construction" },
      {
        name: "description",
        content:
          "Read verified customer reviews, watch video testimonials, and browse our latest renovation tips and case studies from projects across the DMV.",
      },
      { property: "og:title", content: "Testimonials & Blog  YZ Construction" },
      {
        property: "og:description",
        content: "Client stories, video reviews, and renovation guides.",
      },
      { property: "og:url", content: "/testimonials" },
    ],
    links: [{ rel: "canonical", href: "/testimonials" }],
  }),
  component: Testimonials,
});

const reviews = [
  {
    q: "John and his crew transformed our 1960s kitchen into something out of a magazine. Every deadline hit. Every dollar accounted for.",
    a: "Sarah & Michael K.",
    l: "Bethesda, MD",
  },
  {
    q: "We opened our restaurant a week ahead of schedule. That never happens. The finish work is impeccable.",
    a: "Andres L.",
    l: "Arlington, VA",
  },
  {
    q: "Best contractor experience we've ever had. Clean site, on time, and the primary bath is genuinely a room I want to be in.",
    a: "Priya S.",
    l: "Silver Spring, MD",
  },
  {
    q: "They took a chopped-up first floor and made it feel like one connected space. Communication was A+.",
    a: "Marcus R.",
    l: "Washington, DC",
  },
  {
    q: "Fair pricing, no hidden costs, and the crew was respectful of our home every single day.",
    a: "The Kim Family",
    l: "Rockville, MD",
  },
  {
    q: "Turned my basement into the best room in the house. Cannot recommend YZ enough.",
    a: "David P.",
    l: "Silver Spring, MD",
  },
];

const posts = [
  {
    t: "How to plan a kitchen remodel that stays on budget",
    cat: "Guide",
    img: kitchen,
    r: "6 min read",
  },
  {
    t: "Small bathroom, big impact: five DMV renovations",
    cat: "Case Study",
    img: bathroom,
    r: "5 min read",
  },
  {
    t: "Opening a restaurant in DC? Read this first.",
    cat: "Commercial",
    img: restaurant,
    r: "8 min read",
  },
  {
    t: "Whole-home renovation: living through it (and loving it)",
    cat: "Guide",
    img: interior,
    r: "7 min read",
  },
];

function Testimonials() {
  const [i, setI] = useState(0);
  const active = reviews[i];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Testimonials & blog"
        title="Real stories from clients across the DMV."
        description="120+ reviews, a stack of 5-star Google ratings, and a growing library of guides so you can plan your project with confidence."
      />

      {/* FEATURED CAROUSEL */}
      <section className="section">
        <div className="container-x">
          <div className="rounded-3xl bg-foreground text-background p-10 md:p-16 relative overflow-hidden">
            <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-primary-glow">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="w-5 h-5 fill-current" />
                ))}
                <span className="ml-2 text-sm font-medium text-background/70">4.9 / 5 average</span>
              </div>
              <blockquote className="mt-6 text-2xl md:text-4xl font-display font-semibold leading-tight max-w-4xl text-balance">
                "{active.q}"
              </blockquote>
              <div className="mt-8 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{active.a}</div>
                  <div className="text-sm text-background/60">{active.l}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setI((i - 1 + reviews.length) % reviews.length)}
                    className="w-11 h-11 grid place-items-center rounded-full border border-white/20 hover:bg-white/10 transition"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setI((i + 1) % reviews.length)}
                    className="w-11 h-11 grid place-items-center rounded-full border border-white/20 hover:bg-white/10 transition"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GRID OF REVIEWS */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure
                key={r.a}
                className="card-lift bg-card border border-border rounded-2xl p-7 flex flex-col"
              >
                <div className="flex text-primary mb-4">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <blockquote className="leading-relaxed flex-1">"{r.q}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-border">
                  <div className="font-semibold">{r.a}</div>
                  <div className="text-sm text-muted-foreground">{r.l}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO REVIEWS */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Video reviews</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Hear it from them.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[kitchen, bathroom, restaurant].map((img, k) => (
              <button key={k} className="group relative aspect-video rounded-2xl overflow-hidden">
                <img
                  src={img}
                  alt="Video testimonial"
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

      {/* BLOG */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="eyebrow">Journal</span>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Guides, case studies & renovation tips.
              </h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <article
                key={p.t}
                className="card-lift group grid sm:grid-cols-[1fr_1.4fr] gap-5 rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="aspect-[4/3] sm:aspect-auto overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.t}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 sm:pr-8 sm:py-8">
                  <div className="text-xs font-mono tracking-[0.2em] uppercase text-primary">
                    {p.cat}
                  </div>
                  <h3 className="mt-3 text-xl font-display font-semibold leading-snug">{p.t}</h3>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{p.r}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section">
        <div className="container-x">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Renovation tips, one email a month.
              </h2>
              <p className="mt-3 text-primary-foreground/80">
                Case studies, budget guides, and design ideas. No spam.
              </p>
            </div>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@email.com"
                className="flex-1 px-4 py-3 rounded-full bg-white/15 border border-white/30 placeholder:text-white/60 text-white focus:outline-none focus:bg-white/25"
              />
              <button className="px-6 py-3 rounded-full bg-white text-foreground font-semibold hover:scale-[1.02] transition">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x text-center">
          <h2 className="text-3xl font-bold">Have a story to tell?</h2>
          <p className="mt-3 text-muted-foreground">Been a client? We'd love a review.</p>
          <Link to="/contact" className="btn-outline mt-6">
            Get In Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
