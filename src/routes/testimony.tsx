import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/testimony")({
  component: () => <Navigate to="/testimonials" replace />,
});
