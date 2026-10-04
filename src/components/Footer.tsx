import { CONTACT_EMAIL, STUDIO_APPS } from "~/config/apps";

const linkClass =
  "rounded font-body text-base text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

const copy = {
  en: {
    tagline: "A mobile studio building entertainment apps for couples and friends.",
    apps: "Apps",
    studio: "Studio",
    creatorNetwork: "Creator network",
    creatorPath: "/creators",
    contact: "Contact",
    legal: "Legal",
    appNames: { bae: "Bae: Couple Game", truth: "Truth or Truth" },
    privacy: (app: string) => `${app} privacy policy`,
    terms: (app: string) => `${app} terms of use`,
  },
  fr: {
    tagline: "Un studio mobile qui crée des apps de divertissement pour les couples et les amis.",
    apps: "Apps",
    studio: "Studio",
    creatorNetwork: "Réseau de créateurs",
    creatorPath: "/createurs",
    contact: "Contact",
    legal: "Légal",
    appNames: { bae: "Bae", truth: "Vérité ou Vérité" },
    privacy: (app: string) => `Confidentialité ${app}`,
    terms: (app: string) => `Conditions d'utilisation ${app}`,
  },
};

export const Footer = ({ locale = "en" }: { locale?: keyof typeof copy }) => {
  const t = copy[locale];
  const columns = [
    {
      title: t.apps,
      links: STUDIO_APPS.map((app) => ({ label: t.appNames[app.id], href: app.iosLink })),
    },
    {
      title: t.studio,
      links: [
        { label: t.creatorNetwork, href: t.creatorPath },
        { label: t.contact, href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
    {
      title: t.legal,
      links: [
        { label: t.privacy("Bae"), href: "/privacy-policy-bae" },
        { label: t.terms("Bae"), href: "/terms-of-use-bae" },
        { label: t.privacy(t.appNames.truth), href: "/privacy-policy-truthortruth" },
        { label: t.terms(t.appNames.truth), href: "/terms-of-use-truthortruth" },
      ],
    },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-[1.2fr_repeat(3,1fr)] md:pt-20 lg:px-12">
        <div>
          <a href="/" className="font-title text-3xl tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            TAAB<span className="text-yellow">.</span>
          </a>
          <p className="mt-4 max-w-xs font-body text-base leading-relaxed text-white/70">{t.tagline}</p>
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
};
