import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, HardHat, Heart, Award, Leaf, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Counter } from "@/components/site/Counter";

interface Media {
  url: string;
}

interface AboutContent {
  ownerName: string;
  ownerPosition: string;
  ownerDescription: string;
  ownerImage?: Media | null;
  companyStory?: string | null;
  mission?: string | null;
  vision?: string | null;
  values?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  description?: string | null;
  image?: Media | null;
}

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About YZ Construction  DMV Family-Owned Contractor" },
      {
        name: "description",
        content:
          "Meet Yohannes Zewde and the YZ Construction team  a family-owned design-build shop serving Maryland, DC and Virginia with over a decade of remodeling expertise.",
      },
      { property: "og:title", content: "About YZ Construction" },
      { property: "og:description", content: "Family-owned design-build serving the DMV." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hoveredMember, setHoveredMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, teamRes] = await Promise.all([
          fetch("/api/about/content"),
          fetch("/api/about/team"),
        ]);

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setAboutContent(contentData);
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMembers(teamData.members || []);
        }
      } catch (err) {
        console.error("Failed to load about page details:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="About YZ Construction"
        title="A family shop. A craftsman's mindset. A designer's eye."
        description={
          aboutContent?.companyStory ||
          "Founded by Yohannes Zewde in Silver Spring, MD, YZ Construction has spent over a decade turning tired spaces into homes and businesses people love to walk into."
        }
      />

      {/* STORY + OWNER */}
      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-2 items-center">
          <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-secondary/30">
            {aboutContent?.ownerImage?.url ? (
              <img
                src={aboutContent.ownerImage.url}
                alt={aboutContent?.ownerName || "Yohannes Zewde"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-neutral-900 via-neutral-700 to-neutral-500" />
            )}
            <div className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur rounded-2xl p-5 border border-border/40 shadow-xl">
              <div className="text-xs font-mono tracking-[0.22em] uppercase text-primary font-semibold">
                {aboutContent?.ownerPosition || "Founder & Owner"}
              </div>
              <div className="mt-1 text-xl font-display font-semibold">
                {aboutContent?.ownerName || "YZ Construction"}
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {aboutContent?.ownerDescription ||
                  "Owner information is managed in the admin About CMS."}
              </p>
            </div>
          </div>
          <div>
            <span className="eyebrow">Our story</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">
              From a two-man crew to the DMV's boutique design-build.
            </h2>
            <div className="mt-6 space-y-5 text-lg text-muted-foreground leading-relaxed">
              {aboutContent?.companyStory ? (
                <p className="whitespace-pre-line leading-relaxed">{aboutContent.companyStory}</p>
              ) : (
                <>
                  <p>
                    Yohannes started YZ Construction with a pickup truck, a set of tools, and a
                    stubborn belief that renovations don't have to be a nightmare. Twelve years
                    later, the trucks are newer and the projects are bigger but the standard is the
                    same.
                  </p>
                  <p>
                    We stay intentionally small. Every project gets a dedicated project manager,
                    in-house crews, and a founder who still walks every job site personally.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Mission",
              d:
                aboutContent?.mission ||
                "Deliver residential and commercial construction that respects the client's time, money, and vision.",
            },
            {
              t: "Vision",
              d:
                aboutContent?.vision ||
                "Be the DMV's most trusted boutique builder  the shop people call when it has to be done right.",
            },
            {
              t: "Values",
              d:
                aboutContent?.values ||
                "Craft. Communication. Cleanliness. Character. If it's not on the wall, it's on the truck.",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl bg-card border border-border p-8 hover:border-primary/30 transition duration-300"
            >
              <div className="text-xs font-mono tracking-[0.22em] uppercase text-primary font-semibold">
                {c.t}
              </div>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground">
                {c.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="section">
        <div className="container-x">
          <div className="grid gap-10 md:grid-cols-4 text-center md:text-left">
            {[
              [12, "+", "Years in business"],
              [320, "+", "Projects delivered"],
              [45, "+", "In-house crew members"],
              [95, "%", "Client satisfaction"],
            ].map(([n, s, l]) => (
              <div key={l as string}>
                <div className="text-5xl md:text-6xl font-bold">
                  <Counter value={n as number} suffix={s as string} />
                </div>
                <div className="mt-3 text-xs font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Meet the crew</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              The people who show up on your job site.
            </h2>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-center">
            {/* Interactive Image Crossfade Display */}
            <div className="relative aspect-16/10 rounded-3xl overflow-hidden bg-secondary shadow-lg">
              {teamMembers.some((member) => member.image?.url) ? (
                teamMembers.map((member) =>
                  member.image?.url ? (
                    <img
                      key={member.id}
                      src={member.image.url}
                      alt={member.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        hoveredMember?.id === member.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ) : null,
                )
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-700 to-neutral-500" />
              )}
            </div>
            {/* Team Members List */}
            <div className="grid gap-5">
              {teamMembers.length > 0
                ? teamMembers.map((member) => (
                    <div
                      key={member.id}
                      onMouseEnter={() => setHoveredMember(member)}
                      onMouseLeave={() => setHoveredMember(null)}
                      className="flex flex-col border-b border-border/80 pb-4 group cursor-pointer hover:border-primary/40 transition duration-300"
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="text-lg font-display font-semibold group-hover:text-primary transition duration-300">
                          {member.name}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {member.position}
                        </div>
                      </div>
                      {member.description && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                          {member.description}
                        </p>
                      )}
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="section">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Credentials</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Licensed, insured, and certified.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                t: "MHIC Licensed",
                d: "Maryland Home Improvement Commission #123456.",
              },
              {
                icon: HardHat,
                t: "OSHA 30 Certified",
                d: "Every foreman completes OSHA 30 safety training.",
              },
              { icon: Award, t: "EPA Lead-Safe", d: "Certified for pre-1978 renovations." },
              {
                icon: Leaf,
                t: "Green Building",
                d: "Energy-efficient materials and low-VOC finishes.",
              },
              { icon: Users, t: "Fully Insured", d: "$2M general liability, full workers' comp." },
              {
                icon: Heart,
                t: "Community Partner",
                d: "Volunteers with Habitat for Humanity DMV.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center flex-none">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-muted-foreground mt-1">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x text-center">
          <span className="eyebrow justify-center">Materials we trust</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            We build with brands that back their work.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-5 text-xl font-display font-semibold text-muted-foreground/80">
            {[
              "KOHLER",
              "Sherwin-Williams",
              "Andersen",
              "Cambria",
              "Kraftmaid",
              "Trex",
              "Benjamin Moore",
              "Delta",
            ].map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="rounded-3xl bg-foreground text-background p-10 md:p-16 grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Come see what we can build together.
              </h2>
              <p className="mt-4 text-background/70">
                Free consultation. Honest numbers. No pressure.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link to="/contact" className="btn-primary">
                Free Estimate
              </Link>
              <Link to="/projects" className="btn-ghost-light">
                See Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
