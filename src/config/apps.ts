export interface StudioApp {
  id: "bae" | "truth";
  name: string;
  tagline: string;
  description: string;
  logo: string;
  iosLink: string;
  screenshots: string[];
  theme: "light" | "dark";
}

export const STUDIO_APPS: StudioApp[] = [
  {
    id: "bae",
    name: "Bae: Couple Game",
    tagline: "The couple game that breaks the routine.",
    description:
      "500+ questions and challenges to rediscover each other, laugh together and turn any evening into a date night.",
    logo: "/images/bae-logo.svg",
    iosLink: "https://apps.apple.com/app/id1574150149",
    screenshots: ["/images/bae/image_3.jpg", "/images/bae/image_2.jpg", "/images/bae/image_4.jpg"],
    theme: "light",
  },
  {
    id: "truth",
    name: "Truth or Truth",
    tagline: "The party game for nights out with friends.",
    description:
      "Pick your vibe, pass the phone and let the confessions begin. No account needed: one phone, everyone plays.",
    logo: "/images/vérité-logo.svg",
    iosLink: "https://apps.apple.com/app/id6480046704",
    screenshots: ["/images/vérité/image_1.jpg", "/images/vérité/image_3.jpg", "/images/vérité/image_2.jpg"],
    theme: "dark",
  },
];

export const CONTACT_EMAIL = "contact@taabapps.com";
