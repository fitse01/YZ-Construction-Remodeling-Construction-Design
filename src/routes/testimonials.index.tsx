import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, PlayCircle, ChevronLeft, ChevronRight, ArrowRight, MapPin, X } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";

const getYouTubeVideoId = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }
    return videoId || null;
  } catch (e) {
    return null;
  }
};

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location?: string;
  rating: number;
}

export const Route = createFileRoute("/testimonials/")({
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

const defaultReviews = [
  {
    q: "Yohannes and his crew transformed our 1960s kitchen into something out of a magazine. Every deadline hit. Every dollar accounted for.",
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
];

function Testimonials() {
  const [reviewsList, setReviewsList] =
    useState<Array<{ q: string; a: string; l: string }>>(defaultReviews);
  const [idx, setIdx] = useState(0);
  const [videoProjects, setVideoProjects] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [journalArticles, setJournalArticles] = useState<any[]>([]);

  useEffect(() => {
    fetchTestimonials();
    fetchVideoProjects();
    fetchJournalArticles();
  }, []);

  const fetchVideoProjects = async () => {
    try {
      const response = await fetch("/api/projects?status=PUBLISHED");
      if (response.ok) {
        const data = await response.json();
        if (data && data.projects) {
          const videoOnly = data.projects.filter(
            (p: any) => p.youtubeUrl || p.uploadedVideo || p.videoUrl,
          );
          setVideoProjects(videoOnly);
        }
      }
    } catch (error) {
      console.error("Failed to fetch video projects:", error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/testimonials?status=PUBLISHED");
      if (res.ok) {
        const data = await res.json();
        if (data.testimonials && data.testimonials.length > 0) {
          const mapped = data.testimonials.map((t: Testimonial) => ({
            q: t.quote,
            a: t.author,
            l: t.location || "DMV",
          }));
          setReviewsList(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    }
  };

  const fetchJournalArticles = async () => {
    try {
      const response = await fetch("/api/journals?status=PUBLISHED&limit=4");
      if (response.ok) {
        const data = await response.json();
        setJournalArticles(data.journals || []);
      }
    } catch (error) {
      console.error("Failed to fetch journal articles:", error);
    }
  };

  const active = reviewsList[idx] || reviewsList[0];

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
                    onClick={() => setIdx((idx - 1 + reviewsList.length) % reviewsList.length)}
                    className="w-11 h-11 grid place-items-center rounded-full border border-white/20 hover:bg-white/10 transition"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIdx((idx + 1) % reviewsList.length)}
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
            {reviewsList.map((r, i) => (
              <figure
                key={i}
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
          {videoProjects.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videoProjects.map((project) => {
                const videoId = project.youtubeUrl ? getYouTubeVideoId(project.youtubeUrl) : null;
                const ytThumbnail = videoId
                  ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                  : null;

                return (
                  <article
                    key={project.id}
                    className="card-lift group overflow-hidden rounded-2xl border border-border bg-card flex flex-col"
                  >
                    <button
                      onClick={() => setActiveVideo(project)}
                      className="group relative aspect-video overflow-hidden text-left w-full cursor-pointer focus:outline-none rounded-t-2xl"
                    >
                      {project.videoThumbnailUrl || project.youtubeUrl ? (
                        <img
                          src={project.videoThumbnailUrl || ytThumbnail || ""}
                          alt={`${project.title} video thumbnail`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            if (videoId) {
                              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-800 to-slate-600 flex flex-col items-center justify-center text-white/90">
                          <PlayCircle className="w-12 h-12 mb-2" />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                            Video Walk-through
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 grid place-items-center group-hover:bg-black/50 transition">
                        <PlayCircle className="w-14 h-14 text-white drop-shadow-lg group-hover:scale-110 transition duration-300" />
                      </div>
                    </button>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase text-primary">
                          <span>{project.category}</span>
                        </div>
                        <h3 className="mt-3 text-xl font-display font-semibold">{project.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-primary" />{" "}
                          {project.location || "Silver Spring, MD"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Add a published project video to show walk-throughs here.
            </div>
          )}
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
            <Link
              to="/testimony/journal"
              className="text-primary hover:text-primary-hover flex items-center gap-1.5 font-semibold text-sm"
            >
              View All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {journalArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {journalArticles.map((p) => (
                <article
                  key={p.id}
                  className="card-lift group grid sm:grid-cols-[1fr_1.4fr] gap-5 rounded-2xl border border-border bg-card overflow-hidden"
                >
                  <div className="aspect-4/3 sm:aspect-auto overflow-hidden">
                    <Link
                      to="/testimony/journal/$id"
                      params={{ id: p.id }}
                      className="w-full h-full block"
                    >
                      {p.featuredImage ? (
                        <img
                          src={p.featuredImage.url}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </Link>
                  </div>
                  <div className="p-6 sm:pr-8 sm:py-8 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono tracking-[0.2em] uppercase text-primary font-semibold">
                        {p.category}
                      </div>
                      <Link
                        to="/testimony/journal/$id"
                        params={{ id: p.id }}
                        className="block hover:text-primary transition-colors"
                      >
                        <h3 className="mt-3 text-xl font-display font-semibold leading-snug line-clamp-2">
                          {p.title}
                        </h3>
                      </Link>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {p.shortDesc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground border-t border-border/60 pt-4">
                      <span className="text-[11px] font-semibold">
                        {p.readingTime || "5 min read"}
                      </span>
                      <Link
                        to="/testimony/journal/$id"
                        params={{ id: p.id }}
                        className="text-primary font-semibold hover:text-primary-hover flex items-center gap-1 text-xs"
                      >
                        Read More{" "}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No journal articles published yet. Stay tuned!
            </div>
          )}
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
            <form className="flex max-sm:flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
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
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 bg-black/90 z-999 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-black rounded-2xl max-w-4xl w-full aspect-video shadow-2xl overflow-hidden border border-neutral-800"
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-1000 bg-black/60 text-white rounded-full p-2 hover:bg-black/85 hover:scale-105 transition shadow-lg"
              aria-label="Close video player"
            >
              <X className="w-6 h-6" />
            </button>

            {activeVideo.youtubeUrl ||
            (activeVideo.videoUrl &&
              (activeVideo.videoUrl.includes("youtube.com") ||
                activeVideo.videoUrl.includes("youtu.be"))) ? (
              <iframe
                src={(() => {
                  const ytUrl = activeVideo.youtubeUrl || activeVideo.videoUrl || "";
                  const videoId = getYouTubeVideoId(ytUrl);
                  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                })()}
                title={activeVideo.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={activeVideo.uploadedVideo || activeVideo.videoUrl || ""}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={activeVideo.videoThumbnailUrl}
              />
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
