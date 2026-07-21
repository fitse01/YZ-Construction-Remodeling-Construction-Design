import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  AlertTriangle,
  Upload,
  Check,
} from "lucide-react";
import { z } from "zod";
import { SiteLayout, PageHero } from "@/components/site/Layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Free Estimate  YZ Construction, Silver Spring MD" },
      {
        name: "description",
        content:
          "Get a free on-site estimate from YZ Construction. Serving Silver Spring, MD and the wider DMV  Maryland, Washington DC, and Northern Virginia.",
      },
      { property: "og:title", content: "Contact YZ Construction" },
      {
        property: "og:description",
        content: "Free estimates for kitchens, bathrooms, whole-home & commercial in the DMV.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(7, "Please enter a phone number").max(30),
  projectType: z.string().min(1, "Choose a project type"),
  budget: z.string().min(1, "Select a budget range"),
  timeline: z.string().min(1, "Select a timeline"),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000),
});

const projectTypes = [
  "Kitchen",
  "Bathroom",
  "Whole-Home",
  "Restaurant",
  "Commercial",
  "Addition",
  "Other",
];
const budgets = ["Under $25k", "$25k–$75k", "$75k–$150k", "$150k–$300k", "$300k+"];
const timelines = ["ASAP", "1–3 months", "3–6 months", "6+ months", "Just exploring"];

function Contact() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const res = schema.safeParse(data);
    if (!res.success) {
      const errs: Record<string, string> = {};
      for (const issue of res.error.issues) errs[String(issue.path[0])] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSent(true);
    } catch (error) {
      console.error('Failed to submit form:', error);
      alert('Failed to send message. Please try again or call us directly.');
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact & free estimate"
        title="Tell us about your project. We'll take it from there."
        description="Free on-site consultation. A real person replies within one business day  usually much sooner."
      />

      {/* CONTACT SPLIT */}
      <section className="section">
        <div className="container-x grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* FORM */}
          <div className="min-w-0 rounded-3xl bg-card border border-border p-5 sm:p-6 md:p-10">
            {sent ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 text-primary grid place-items-center">
                  <Check className="w-7 h-7" />
                </div>
                <h2 className="mt-6 text-3xl font-display font-bold">Thanks we got it.</h2>
                <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                  We'll reach out within one business day to schedule your free on-site estimate. If
                  it's urgent, call us at (240) 781-8778.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid min-w-0 gap-5">
                <h2 className="text-2xl font-display font-bold">Request a free estimate</h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Name" name="name" error={errors.name} />
                  <Field label="Email" name="email" type="email" error={errors.email} />
                  <Field label="Phone" name="phone" type="tel" error={errors.phone} />
                  <Select
                    label="Project type"
                    name="projectType"
                    options={projectTypes}
                    error={errors.projectType}
                  />
                  <Select
                    label="Budget range"
                    name="budget"
                    options={budgets}
                    error={errors.budget}
                  />
                  <Select
                    label="Timeline"
                    name="timeline"
                    options={timelines}
                    error={errors.timeline}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Project details</label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Tell us about your space, what you'd love to change, and anything else that would help us plan…"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message}</p>
                  )}
                </div>

                <label className="flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-dashed border-border p-4 transition hover:border-primary sm:flex-row sm:items-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">Upload project images</span>{" "}
                    <span className="text-muted-foreground">(optional · up to 10)</span>
                  </span>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </label>

                <button
                  type="submit"
                  className="btn-primary mt-2 w-full justify-self-start sm:w-auto"
                >
                  Send Estimate Request
                </button>
                <p className="text-xs text-muted-foreground">
                  By submitting you agree to be contacted about your project. We don't share your
                  info.
                </p>
              </form>
            )}
          </div>

          {/* SIDE INFO */}
          <div className="min-w-0 space-y-6">
            <InfoCard
              icon={Phone}
              title="Call us"
              primary="(240) 781-8778"
              secondary="Mon–Fri 8am–6pm ET · Sat 9am–1pm"
            >
              <a href="tel:+12407818778" className="btn-primary mt-4 w-full py-2.5! sm:w-auto">
                Call Now
              </a>
            </InfoCard>

            <InfoCard
              icon={Mail}
              title="Email"
              primary="yohanneszewdebayu@gmail.com"
              secondary="We reply within one business day"
            >
              <a
                href="mailto:yohanneszewdebayu@gmail.com"
                className="btn-outline mt-4 w-full py-2.5! sm:w-auto"
              >
                Send Email
              </a>
            </InfoCard>

            <InfoCard
              icon={MessageCircle}
              title="WhatsApp"
              primary="Chat with us"
              secondary="Fastest for photo/video questions"
            >
              <a
                href="https://wa.me/12407818778"
                className="btn-outline mt-4 w-full py-2.5! sm:w-auto"
              >
                Open WhatsApp
              </a>
            </InfoCard>

            <div className="rounded-2xl bg-destructive/10 border border-destructive/25 p-5">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertTriangle className="w-4 h-4" /> Emergency service
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Storm damage or urgent structural issue? Call us anytime at{" "}
                <a href="tel:+12407818778" className="font-semibold text-foreground underline">
                  (240) 781-8778
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOURS + AREAS + MAP */}
      <section className="section bg-secondary/60 border-y border-border">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-mono tracking-[0.22em] uppercase">Office</span>
            </div>
            <h3 className="mt-3 text-2xl font-display font-semibold">YZ Construction, LLC</h3>
            <p className="mt-2 text-muted-foreground">
              Silver Spring, MD 20906
              <br />
              Serving the DMV MD · DC · VA
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              <span className="text-xs font-mono tracking-[0.22em] uppercase">Hours</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span>Mon – Fri</span> <span className="font-medium">8:00 – 6:00</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span> <span className="font-medium">9:00 – 1:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span> <span className="text-muted-foreground">Closed</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-mono tracking-[0.22em] uppercase">Service Areas</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Silver Spring",
                "Bethesda",
                "Rockville",
                "Chevy Chase",
                "Kensington",
                "Washington DC",
                "Arlington",
                "Alexandria",
                "McLean",
                "Fairfax",
              ].map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full bg-card border border-border text-xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="container-x mt-14">
          <div className="rounded-3xl overflow-hidden border border-border aspect-16/7">
            <iframe
              title="YZ Construction service map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-77.35,38.85,-76.85,39.15&layer=mapnik&marker=39.0028,-77.0207"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Select({
  label,
  name,
  options,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue=""
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  primary,
  secondary,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  primary: string;
  secondary: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-mono tracking-[0.22em] uppercase text-muted-foreground">
            {title}
          </div>
          <div className="font-display font-semibold max-sm:text-[12px] md:text-lg mt-0.5">
            {primary}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{secondary}</p>
      {children}
    </div>
  );
}
