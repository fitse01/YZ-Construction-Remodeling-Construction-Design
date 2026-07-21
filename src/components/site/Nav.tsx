import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import logo from "../../assets/logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/contact", label: "Contact" },
  { to: "/login", label: "Login", adminOnly: true },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-100 transition-all duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container-x flex h-16 md:h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
            YZ
          </span> */}
          <img
            src={logo}
            alt="YZ Construction Logo"
            className="grid place-items-center w:20 sm:w-40  h-16"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.filter(l => !l.adminOnly).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-2 text-sm font-medium text-foreground/75 hover:text-foreground rounded-full transition-colors"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="px-3.5 py-2 text-sm font-medium text-foreground/75 hover:text-foreground rounded-full transition-colors"
          >
            Login
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:+12407818778"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Phone className="w-4 h-4" /> (240) 781-8778
          </a>
          <Link to="/contact" className="btn-primary">
            Free Estimate
          </Link>
        </div>

        <button
          className="lg:hidden relative z-101 p-2 -mr-2 text-foreground touch-manipulation"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden relative z-100 border-t border-border bg-background animate-fade-in">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="py-3 text-base font-medium text-foreground/80 border-b border-border/60"
                onClick={() => setOpen(false)}
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/contact" className="btn-primary mt-4" onClick={() => setOpen(false)}>
              Get Free Estimate
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
