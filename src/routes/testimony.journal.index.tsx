import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/testimony/journal/")({
  component: () => <Navigate to="/testimonials/journal" replace />,
});