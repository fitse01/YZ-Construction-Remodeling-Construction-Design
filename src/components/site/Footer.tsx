import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.19_0.006_180)] text-[oklch(0.96_0.003_90)] mt-24">
      <div className="container-x py-16 md:py-20 grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-display font-bold">
              YZ
            </span>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg">YZ Construction, LLC</div>
              <div className="text-xs tracking-[0.22em] font-mono uppercase text-white/50">
                Building Better Spaces
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/60 max-w-sm leading-relaxed">
            Family-owned remodeling and construction serving the DMV — Maryland,
            DC, and Northern Virginia. Licensed, insured, and warrantied.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 grid place-items-center rounded-full border border-white/15 hover:border-primary hover:text-primary transition"
                aria-label="Social link"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono tracking-[0.22em] uppercase text-white/50 mb-4">
            Explore
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Home", "/"],
              ["About", "/about"],
              ["Services", "/services"],
              ["Projects", "/projects"],
              ["Testimonials", "/testimonials"],
              ["Contact", "/contact"],
            ].map(([l, to]) => (
              <li key={to}>
                <Link to={to} className="text-white/75 hover:text-primary transition">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono tracking-[0.22em] uppercase text-white/50 mb-4">
            Services
          </h4>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li>Kitchen Remodeling</li>
            <li>Bathroom Remodeling</li>
            <li>Whole-Home Renovation</li>
            <li>Restaurant Renovation</li>
            <li>Commercial Build-Out</li>
            <li>Painting & Flooring</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono tracking-[0.22em] uppercase text-white/50 mb-4">
            Contact
          </h4>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 text-primary flex-none" />
              Silver Spring, MD
              <br />Serving DMV area
            </li>
            <li>
              <a href="tel:+15551234567" className="flex items-center gap-2.5 hover:text-primary">
                <Phone className="w-4 h-4 text-primary" /> (555) 123-4567
              </a>
            </li>
            <li>
              <a href="mailto:info@yzconstruction.com" className="flex items-center gap-2.5 hover:text-primary">
                <Mail className="w-4 h-4 text-primary" /> info@yzconstruction.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs text-white/45">
          <p>© {new Date().getFullYear()} YZ Construction, LLC. All rights reserved.</p>
          <p>MHIC Licensed · Fully Insured · MD · DC · VA</p>
        </div>
      </div>
    </footer>
  );
}
