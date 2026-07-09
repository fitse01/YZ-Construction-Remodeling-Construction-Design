# YZ Construction Website

A modern marketing website for YZ Construction, a Silver Spring, MD based design-build and remodeling company serving Maryland, Washington DC, and Virginia.

The site presents the company, its services, past projects, testimonials, and contact details in a polished, responsive front end. It is built to feel like a real contractor website, with a strong hero section, service cards, project showcases, and clear calls to action.

## What the project does

- Introduces the business and brand
- Highlights core services such as kitchens, bathrooms, home renovations, restaurant build-outs, and commercial work
- Shows project work, testimonials, and contact options
- Supports a responsive experience across desktop and mobile
- Uses route-based pages for each major section of the site

## Tech Stack

- TanStack Start
- TanStack Router
- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Radix UI components
- Lucide icons
- Recharts and other UI helpers where needed

## Project Structure

- `src/routes/` contains the file-based routes for each page
- `src/components/site/` contains shared site layout components such as the nav, footer, and page shell
- `src/components/ui/` contains reusable UI primitives
- `src/assets/` stores site images and brand assets
- `src/styles.css` defines the global design system and theme styles

## Main Pages

- `/` Home page with hero, overview, services, and proof points
- `/about` Company story, team, credentials, and brand partners
- `/services` Service breakdown and scope information
- `/projects` Selected project work and before/after content
- `/testimonials` Client feedback and social proof
- `/contact` Contact details and lead capture entry points

## How the Project Is Built

The app uses TanStack Start file-based routing, so each route lives in `src/routes/` as a `.tsx` file. Shared layout concerns are handled through reusable site components rather than duplicated page scaffolding.

The visual system is built from Tailwind utilities and a small set of custom classes for layout, typography, and interaction states. Images and brand assets are imported directly into the route components so the pages stay simple to read and easy to update.

## Development

Install dependencies first:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Build the project for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

Run lint checks:

```bash
bun run lint
```

Format the codebase:

```bash
bun run format
```

## Notes

- Route definitions are file-based and should stay in `src/routes/`
- `src/routes/routeTree.gen.ts` is generated and should not be edited by hand
- The site copy and visuals are intentionally business-focused and should stay consistent across pages
