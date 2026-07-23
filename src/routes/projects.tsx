import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, PlayCircle, Search } from "lucide-react";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { PageHero, SiteLayout } from "@/components/site/Layout";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import commercial from "@/assets/commercial.jpg";
import exterior from "@/assets/exterior.jpg";
import interior from "@/assets/interior.jpg";
import before from "@/assets/before.jpg";
import after from "@/assets/after.jpg";
import carpentry from "@/assets/carpentery.jpeg";

interface ApiProject {
  id: string;
  title: string;
  location?: string | null;
  description: string;
  category: string;
  completionDate?: string | null;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  images?: Array<{ url: string; thumbnailUrl?: string | null }>;
  featuredImage?: { url: string } | null;
  createdAt: string;
}

type ProjectCard = {
  id: string;
  title: string;
  location: string;
  category: string;
  year: string;
  image: string;
  description: string;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
};

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects & Portfolio - YZ Construction, DMV" },
      {
        name: "description",
        content:
          "Browse our recent kitchen, bath, whole-home, restaurant and commercial construction projects across Maryland, DC and Northern Virginia.",
      },
      { property: "og:title", content: "Projects - YZ Construction" },
      {
        property: "og:description",
        content: "Portfolio of residential and commercial builds across the DMV.",
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

const catImageMap: Record<string, string> = {
  KITCHEN: kitchen,
  BATHROOM: bathroom,
  RESTAURANT: restaurant,
  COMMERCIAL: commercial,
  EXTERIOR: exterior,
  RESIDENTIAL: interior,
  INTERIOR: interior,
  FURNITURE_CARPENTRY: carpentry,
};

const categoryLabel = (category: string) =>
  category
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function Projects() {
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("All");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects?status=PUBLISHED");
        if (!response.ok) return;

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Failed to fetch published projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const cards = useMemo<ProjectCard[]>(() => {
    return projects.map((project) => {
      const image =
        project.featuredImage?.url ||
        project.images?.[0]?.url ||
        catImageMap[project.category] ||
        kitchen;

      return {
        id: project.id,
        title: project.title,
        location: project.location || "Silver Spring, MD",
        category: categoryLabel(project.category),
        year: project.completionDate
          ? new Date(project.completionDate).getFullYear().toString()
          : new Date(project.createdAt).getFullYear().toString(),
        image,
        description: project.description,
        videoUrl: project.videoUrl,
        videoThumbnailUrl: project.videoThumbnailUrl,
        beforeImageUrl: project.beforeImageUrl,
        afterImageUrl: project.afterImageUrl,
      };
    });
  }, [projects]);

  const filtered = useMemo(() => {
    return cards.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" ||
        project.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        `${project.title} ${project.location} ${project.description}`.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [cards, search, selectedCategory]);

  const beforeAfterProject = useMemo(
    () => cards.find((project) => project.beforeImageUrl && project.afterImageUrl) || null,
    [cards],
  );

  const videoProjects = useMemo(
    () => cards.filter((project) => project.videoUrl || project.videoThumbnailUrl).slice(0, 3),
    [cards],
  );

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Portfolio & Gallery"
        title="Real projects. Real photography. Real proof."
        description="Every project below was designed, permitted, and built by the YZ Construction team. Browse by category, or search by neighborhood."
      />

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
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2.5 rounded-full bg-secondary border border-transparent focus:border-primary focus:outline-none text-sm w-full md:w-64"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading portfolio...</div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <article
                  key={project.id}
                  className="card-lift group overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase text-primary">
                      <span>{project.category}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-display font-semibold">{project.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {project.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {project.year}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No published projects match that search.
            </div>
          )}
        </div>
      </section>

      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Before & after</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Same footprint. Different life.
            </h2>
          </div>

          {beforeAfterProject ? (
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-center">
              <BeforeAfter
                before={beforeAfterProject.beforeImageUrl || before}
                after={beforeAfterProject.afterImageUrl || after}
                alt={`${beforeAfterProject.title} renovation`}
              />
              <div>
                <div className="text-xs font-mono tracking-[0.22em] uppercase text-primary">
                  Case Study
                </div>
                <h3 className="mt-3 text-2xl font-display font-semibold">
                  {beforeAfterProject.title}
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {beforeAfterProject.description}
                </p>
                <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  {[
                    ["Scope", "Full remodel"],
                    ["Timeline", beforeAfterProject.year],
                    ["Location", beforeAfterProject.location],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Add before and after images to a published project to feature a case study here.
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Video walk-throughs</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">See a project come together.</h2>
          </div>

          {videoProjects.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {videoProjects.map((project) => {
                const poster = project.videoThumbnailUrl || project.image;

                return (
                  <a
                    key={project.id}
                    href={project.videoUrl || "#"}
                    className="group relative aspect-video rounded-2xl overflow-hidden"
                  >
                    <img
                      src={poster}
                      alt={`${project.title} video thumbnail`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 grid place-items-center">
                      <PlayCircle className="w-14 h-14 text-white drop-shadow-lg" />
                    </div>
                  </a>
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
