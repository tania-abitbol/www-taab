import { CONTACT_EMAIL, STUDIO_APPS } from "~/config/apps";

const linkClass =
  "rounded font-body text-base text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

const columns = [
  {
    title: "Apps",
    links: STUDIO_APPS.map((app) => ({ label: app.name, href: app.iosLink })),
  },
  {
    title: "Studio",
    links: [
      { label: "Creator network", href: "/creators" },
      { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Bae privacy policy", href: "/privacy-policy-bae" },
      { label: "Bae terms of use", href: "/terms-of-use-bae" },
      { label: "Truth or Truth privacy policy", href: "/privacy-policy-truthortruth" },
      { label: "Truth or Truth terms of use", href: "/terms-of-use-truthortruth" },
    ],
  },
];

export const Footer = () => (
  <footer className="bg-black text-white">
    <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-[1.2fr_repeat(3,1fr)] md:pt-20 lg:px-12">
      <div>
        <a href="/" className="font-title text-3xl tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          TAAB<span className="text-yellow">.</span>
        </a>
        <p className="mt-4 max-w-xs font-body text-base leading-relaxed text-white/70">
          A mobile studio building entertainment apps for couples and friends.
        </p>
      </div>
      {columns.map((column) => (
        <nav key={column.title} aria-label={column.title}>
          <p className="mb-4 font-body text-sm font-bold uppercase tracking-[0.16em] text-white/50">
            {column.title}
          </p>
          <ul className="space-y-3">
            {column.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 border-t border-white/10 px-5 py-6 font-body text-sm text-white/50 sm:flex-row sm:justify-between sm:px-8 lg:px-12">
      <p>© {new Date().getFullYear()} TAAB Studio</p>
      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
        {CONTACT_EMAIL}
      </a>
    </div>
  </footer>
);
