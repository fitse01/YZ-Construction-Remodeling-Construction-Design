import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useEffect, useState } from "react";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import restaurant from "@/assets/restaurant.jpg";
import commercial from "@/assets/commercial.jpg";
import exterior from "@/assets/exterior.jpg";
import interior from "@/assets/interior.jpg";

interface Service {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  benefits: string[];
  coverImage?: {
    url: string;
  } | null;
}

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services  Kitchens, Baths, Whole-Home & Commercial | YZ Construction" },
      {
        name: "description",
        content:
          "Full-service remodeling and construction in the DMV: kitchens, bathrooms, whole-home renovations, restaurant build-outs, commercial fit-outs, painting, flooring, framing and carpentry.",
      },
      { property: "og:title", content: "Services  YZ Construction" },
      {
        property: "og:description",
        content: "Design-build residential and commercial services in the DMV.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const fallbackImages: Record<string, string> = {
  KITCHEN: kitchen,
  BATHROOM: bathroom,
  RESTAURANT: restaurant,
  COMMERCIAL: commercial,
  EXTERIOR: exterior,
  WHOLE_HOME: interior,
  CARPENTRY: interior,
};

const trades = [
  ["Interior Design", "Selections, drawings, and full FF&E."],
  ["Painting", "Interior & exterior, low-VOC finishes."],
  ["Flooring", "Hardwood, LVP, tile, refinishing."],
  ["Carpentry", "Trim, built-ins, custom millwork."],
  ["Framing", "Additions, walls, load-bearing work."],
  ["Tile & Stone", "Precision layout, waterproofed."],
];

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services?status=PUBLISHED");
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
        return;
      }

      setServices([]);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title="Design-build for homes and businesses across the DMV."
        description="One team from first sketch to final punch-list with the crews, credentials, and coordination to deliver every scope, big or small."
      />

      {loading ? (
        <section className="section">
          <div className="container-x py-20 text-center text-muted-foreground">
            Loading services...
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <div className="container-x">
              {services.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <a
                      key={service.id}
                      href={`#${service.id}`}
                      className="group flex items-center justify-between p-5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground transition"
                    >
                      <span className="font-display font-semibold">{service.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  No services have been published yet.
                </div>
              )}
            </div>
          </section>

          {services.map((service, index) => {
            const imageSrc =
              service.coverImage?.url || fallbackImages[service.category] || interior;
            const bullets =
              service.features && service.features.length > 0
                ? service.features
                : service.benefits || [];

            return (
              <section
                key={service.id}
                id={service.id}
                className={`section scroll-mt-24 ${index % 2 ? "bg-secondary/60 border-y border-border" : ""}`}
              >
                <div
                  className={`container-x grid gap-10 lg:grid-cols-2 items-center ${
                    index % 2 ? "lg:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div className="rounded-3xl overflow-hidden aspect-4/3">
                    <img
                      src={imageSrc}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="eyebrow">0{index + 1} · Service</span>
                    <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">
                      {service.title}
                    </h2>
                    <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                      {service.longDesc || service.shortDesc}
                    </p>
                    {bullets.length > 0 && (
                      <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                        {bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2.5 text-sm">
                            <Check className="w-5 h-5 text-primary flex-none mt-0.5" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-8 flex gap-3">
                      <Link to="/contact" className="btn-primary">
                        Free Estimate
                      </Link>
                      <Link to="/projects" className="btn-outline">
                        See Examples
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          <section className="section">
            <div className="container-x">
              <div className="max-w-2xl">
                <span className="eyebrow">Trades in-house</span>
                <h2 className="mt-4 text-4xl font-bold tracking-tight">
                  Everything under one roof.
                </h2>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trades.map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-border p-6">
                    <div className="font-display font-semibold text-lg">{title}</div>
                    <div className="text-sm text-muted-foreground mt-2">{description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section bg-foreground text-background">
            <div className="container-x">
              <div className="max-w-2xl">
                <span className="eyebrow" style={{ color: "oklch(0.78 0.16 145)" }}>
                  How it works
                </span>
                <h2 className="mt-4 text-4xl font-bold tracking-tight">
                  A process built to remove surprises.
                </h2>
              </div>
              <ol className="mt-12 grid gap-8 md:grid-cols-4">
                {[
                  ["01", "Discovery Call", "Free 20-min call to understand scope and budget."],
                  ["02", "On-Site Estimate", "Walk-through, measurements, fixed-price bid."],
                  ["03", "Design + Build", "Drawings, selections, then execution by our crews."],
                  ["04", "Warranty", "Final walk, punch-list, 2-year workmanship warranty."],
                ].map(([stepNumber, stepTitle, stepDescription]) => (
                  <li key={stepNumber}>
                    <div className="font-num text-primary-glow text-sm tracking-[0.25em]">
                      {stepNumber}
                    </div>
                    <h3 className="mt-4 text-2xl font-display font-semibold">{stepTitle}</h3>
                    <p className="mt-2 text-background/60 text-sm leading-relaxed">
                      {stepDescription}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="section">
            <div className="container-x max-w-3xl">
              <span className="eyebrow">FAQ</span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Common questions.</h2>
              <div className="mt-10 divide-y divide-border border-y border-border">
                {[
                  [
                    "Do you provide a fixed price?",
                    "Yes after the on-site estimate, we submit a fixed-price bid so there are no surprises unless you change scope.",
                  ],
                  [
                    "How long is a typical bathroom?",
                    "Standard baths run 3–5 weeks; full primary baths 5–7 weeks.",
                  ],
                  [
                    "Do you help with permits?",
                    "Yes we handle permits, drawings, and inspections end-to-end.",
                  ],
                  [
                    "Can we live in the house during a remodel?",
                    "For most projects, yes. We seal work zones, protect finishes, and clean daily.",
                  ],
                ].map(([question, answer]) => (
                  <details key={question} className="group py-5">
                    <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                      {question}
                      <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container-x">
              <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 grid gap-8 md:grid-cols-[1.6fr_1fr] items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Have a project in mind? Let's price it.
                  </h2>
                  <p className="mt-4 text-primary-foreground/80">
                    Free on-site estimate. Fixed-price bid within 5 business days.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <Link
                    to="/contact"
                    className="btn-outline border-white! text-white! hover:bg-white/10!"
                  >
                    Free Estimate
                  </Link>
                  <a
                    href="tel:+12407818778"
                    className="btn-outline border-white! text-white! hover:bg-white/10!"
                  >
                    Call Us
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </SiteLayout>
  );
}
