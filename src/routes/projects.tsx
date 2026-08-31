import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, PlayCircle, Search, X } from "lucide-react";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { PageHero, SiteLayout } from "@/components/site/Layout";

interface ApiProject {
  id: string;
  title: string;
  location?: string | null;
  description: string;
  category: string;
  completionDate?: string | null;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  youtubeUrl?: string | null;
  uploadedVideo?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  images?: Array<{ url: string; thumbnailUrl?: string | null }>;
  videos?: Array<{ url: string; thumbnailUrl?: string | null }>;
  media?: Array<{ url: string; thumbnailUrl?: string | null; type: string }>;
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
  youtubeUrl?: string | null;
  uploadedVideo?: string | null;
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
      { property: "og:image", content: "/og-image.jpg" },
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

const getYouTubeThumbnail = (url: string | null | undefined) => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
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
  const [activeVideo, setActiveVideo] = useState<ProjectCard | null>(null);

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
      const firstVideo = project.videos?.[0] || project.media?.find((m) => m.type === "video");
      const uploadedVideo = project.uploadedVideo || (firstVideo ? firstVideo.url : null);
      const isYt = project.youtubeUrl || (project.videoUrl && (project.videoUrl.includes("youtube.com") || project.videoUrl.includes("youtu.be")));
      const youtubeUrl = isYt ? (project.youtubeUrl || project.videoUrl) : null;
      const videoUrl = youtubeUrl || uploadedVideo || project.videoUrl || null;
      const ytThumbnail = youtubeUrl ? getYouTubeThumbnail(youtubeUrl) : null;
      const videoThumbnailUrl = project.videoThumbnailUrl || (firstVideo ? firstVideo.thumbnailUrl : null) || ytThumbnail;

      const image =
        project.featuredImage?.url ||
        project.images?.[0]?.url ||
        videoThumbnailUrl ||
        ytThumbnail ||
        "/placeholder-project.jpg";

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
        videoUrl,
        videoThumbnailUrl,
        youtubeUrl,
        uploadedVideo,
        beforeImageUrl: project.beforeImageUrl,
        afterImageUrl: project.afterImageUrl,
      };
    });
  }, [projects]);

  const imageProjects = useMemo(() => {
    return cards;
  }, [cards]);

  const videoProjects = useMemo(() => {
    return cards.filter(
      (project) => Boolean(project.youtubeUrl || project.uploadedVideo || project.videoUrl),
    );
  }, [cards]);

  const filteredImageProjects = useMemo(() => {
    return imageProjects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" ||
        project.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        `${project.title} ${project.location} ${project.description}`.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [imageProjects, search, selectedCategory]);

  const beforeAfterProject = useMemo(
    () => cards.find((project) => project.beforeImageUrl && project.afterImageUrl) || null,
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
          ) : filteredImageProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredImageProjects.map((project) => (
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
                before={beforeAfterProject.beforeImageUrl || ""}
                after={beforeAfterProject.afterImageUrl || ""}
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
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videoProjects.map((project) => {
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
                          src={
                            project.videoThumbnailUrl ||
                            getYouTubeThumbnail(project.youtubeUrl) ||
                            ""
                          }
                          alt={`${project.title} video thumbnail`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const videoId = getYouTubeVideoId(project.youtubeUrl);
                            if (videoId) {
                              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-800 to-slate-600 flex flex-col items-center justify-center text-white/90">
                          <PlayCircle className="w-12 h-12 mb-2" />
                          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
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
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {project.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {project.year}
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
                  let videoId = "";
                  if (ytUrl.includes("watch?v=")) {
                    videoId = ytUrl.split("watch?v=")[1]?.split("&")[0] || "";
                  } else if (ytUrl.includes("youtu.be/")) {
                    videoId = ytUrl.split("youtu.be/")[1]?.split("?")[0] || "";
                  } else if (ytUrl.includes("youtube.com/embed/")) {
                    return ytUrl;
                  }
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
                poster={
                  activeVideo.videoThumbnailUrl ||
                  (activeVideo.youtubeUrl
                    ? getYouTubeThumbnail(activeVideo.youtubeUrl) || undefined
                    : undefined)
                }
              />
            )}
          </div>
        </div>
      )}

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
