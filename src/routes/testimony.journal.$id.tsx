import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface JournalArticle {
  slug: string;
}

export const Route = createFileRoute("/testimony/journal/$id")({
  component: JournalAliasPage,
});

function JournalAliasPage() {
  const { id } = Route.useParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const resolveJournal = async () => {
      try {
        const response = await fetch(`/api/journals/${id}`);
        if (!response.ok) return;

        const data = (await response.json()) as JournalArticle;
        setSlug(data.slug);
      } catch (error) {
        console.error("Failed to resolve journal alias:", error);
      }
    };

    resolveJournal();
  }, [id]);

  if (slug) {
    return <Navigate to="/testimonials/journal/$slug" params={{ slug }} replace />;
  }

  return <div className="p-8 text-center text-muted-foreground">Loading article...</div>;
}
