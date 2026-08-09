import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, User, ArrowRight, BookOpen, Search } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/site/Layout";

interface JournalMedia {
  url: string;
}

interface ApiJournal {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  readingTime?: string | null;
  publishDate?: string | null;
  featuredImage?: JournalMedia | null;
}

export const Route = createFileRoute("/testimonials/journal/")({
  head: () => ({
    meta: [
      { title: "Journal, Guides & Tips - YZ Construction" },
      {
        name: "description",
        content:
          "Read our latest home renovation tips, remodeling guides, and case studies to plan your next kitchen, bath or whole-home project in Maryland, DC, or Virginia.",
      },
      { property: "og:title", content: "Journal & Remodeling Guides - YZ Construction" },
      {
        property: "og:description",
        content: "Expert construction advice, cost guides, and design tips.",
      },
      { property: "og:url", content: "/testimonials/journal" },
    ],
    links: [{ rel: "canonical", href: "/testimonials/journal" }],
  }),
  component: JournalPage,
});

function JournalPage() {
  const [articles, setArticles] = useState<ApiJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/journals?status=PUBLISHED&limit=100");
        if (res.ok) {
          const data = await res.json();
          setArticles(data.journals || []);
        }
      } catch (err) {
        console.error("Failed to load journal articles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return ["All", ...Array.from(cats)];
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory =
        selectedCategory === "All" || art.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        `${art.title} ${art.shortDesc} ${art.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [articles, search, selectedCategory]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Journal & Guides"
        title="Expert advice for your next remodel."
        description="Browse our collection of cost planning guides, design tips, and construction case studies to get inspired for your own project."
      />

      {/* Filter and Search Bar */}
      <section className="border-b border-border sticky top-16 md:top-20 z-30 bg-background/85 backdrop-blur">
        <div className="container-x py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-foreground text-background"
                    : "bg-secondary hover:bg-secondary/70"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles..."
              className="pl-10 pr-4 py-2.5 rounded-full bg-secondary border border-transparent focus:border-primary focus:outline-none text-sm w-full md:w-64"
            />
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="section">
        <div className="container-x">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading journal...</div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((art) => (
                <article
                  key={art.id}
                  className="card-lift group bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full"
                >
                  <Link
                    to="/testimonials/journal/$slug"
                    params={{ slug: art.slug }}
                    className="aspect-16/10 overflow-hidden block"
                  >
                    {art.featuredImage ? (
                      <img
                        src={art.featuredImage.url}
                        alt={art.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xs">No Cover Image</span>
                      </div>
                    )}
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="font-mono tracking-wider uppercase text-primary font-semibold">
                          {art.category}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {art.readingTime || "5 min read"}
                        </span>
                      </div>
                      <Link
                        to="/testimonials/journal/$slug"
                        params={{ slug: art.slug }}
                        className="block group-hover:text-primary transition-colors"
                      >
                        <h3 className="text-xl font-display font-semibold leading-snug">
                          {art.title}
                        </h3>
                      </Link>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {art.shortDesc}
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> {art.author}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {art.publishDate
                            ? new Date(art.publishDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : new Date().toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                        </span>
                      </div>
                      <Link
                        to="/testimonials/journal/$slug"
                        params={{ slug: art.slug }}
                        className="text-primary hover:text-primary-hover flex items-center gap-1 text-xs font-semibold"
                      >
                        Read More{" "}
                        <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No journal articles found matching that search.
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
