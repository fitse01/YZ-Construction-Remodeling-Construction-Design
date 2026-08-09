import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Calendar, Clock, Tag, User } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/site/Layout";

interface JournalMedia {
  url: string;
}

interface JournalArticle {
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
  seoTitle?: string | null;
  seoDescription?: string | null;
  featuredImage?: JournalMedia | null;
}

const sanitizeHtml = (html: string) => {
  if (typeof window === "undefined") return html;

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  document.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  document.body.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.toLowerCase();

      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return document.body.innerHTML;
};

export const Route = createFileRoute("/testimonials/journal/$slug")({
  component: JournalDetailPage,
});

function JournalDetailPage() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<JournalArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/journals/slug/${slug}`);
        if (!response.ok) {
          throw new Error("Journal article not found");
        }

        const data = await response.json();
        setArticle(data);
      } catch (fetchError) {
        console.error("Failed to load journal article:", fetchError);
        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to load journal article",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const contentHtml = useMemo(() => {
    if (!article?.content) return "";
    return sanitizeHtml(article.content);
  }, [article?.content]);

  const looksLikeHtml = useMemo(() => {
    if (!article?.content) return false;
    return /<([a-z][\w:-]*)(\s|>)/i.test(article.content);
  }, [article?.content]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Journal"
        title={article?.title || "Loading article..."}
        description={
          article?.shortDesc ||
          "Guides, case studies & renovation tips from the YZ Construction team."
        }
      />

      <section className="section pt-0">
        <div className="container-x">
          <div className="mb-8">
            <Link
              to="/testimonials/journal/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Journal
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              Loading article...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-lg font-semibold">{error}</p>
              <Link to="/testimonials/journal/" className="btn-primary mt-6 inline-flex">
                Browse Journal
              </Link>
            </div>
          ) : article ? (
            <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card overflow-hidden">
              {article.featuredImage?.url ? (
                <div className="aspect-video overflow-hidden bg-secondary">
                  <img
                    src={article.featuredImage.url}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-secondary grid place-items-center text-muted-foreground">
                  <BookOpen className="w-10 h-10" />
                </div>
              )}

              <div className="p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <span>{article.category}</span>
                  <span className="text-muted-foreground/60">|</span>
                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> {article.readingTime || "5 min read"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted-foreground">
                    <User className="w-3.5 h-3.5" /> {article.author}
                  </span>
                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {article.publishDate
                      ? new Date(article.publishDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Draft article"}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-balance">
                  {article.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-2">
                  {article.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-8 max-w-none text-foreground/80 leading-8">
                  {looksLikeHtml ? (
                    <div
                      className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-hover prose-img:rounded-2xl"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                  ) : (
                    article.content
                      .split(/\n{2,}/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className="mb-5">
                          {paragraph}
                        </p>
                      ))
                  )}
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </SiteLayout>
  );
}
