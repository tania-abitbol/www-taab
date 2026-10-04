import type { StudioApp } from "./apps";
import type { CreatorLocale } from "./creatorFormCopy";

export type CreatorCountryCode = "us" | "fr";

export interface CreatorFaqItem {
  question: string;
  answer: string;
}

export interface CreatorEarnings {
  /** ISO 4217 code used to format amounts, e.g. "USD". */
  currency: string;
  /** Real payout per 1,000 views for this program. */
  ratePer1000Views: number;
  /** Optional flat amount paid per accepted video. */
  basePerVideo?: number;
  viewPresets: number[];
  maxVideosPerMonth: number;
}

/** Page chrome that is not part of a section's main copy. */
export interface CreatorUiCopy {
  homeLabel: string;
  skipToApplication: string;
  headerCta: string;
  /** Link to the same page for another country program. */
  switcher: { label: string; ariaLabel: string; href: string };
  /** Screen-reader prefix for step cards; `{n}` is the step number. */
  stepLabel: string;
  appsEyebrow: string;
  applyEyebrow: string;
  applyChecklist: string[];
  phoneMock: {
    screen: string;
    following: string;
    forYou: string;
    handle: string;
    caption: string;
    views: string;
    payoutTitle: string;
    payoutSubtitle: string;
    chip: string;
  };
  /** `{app}` is replaced with the app name. */
  appStoreBadgeAlt: string;
  appStoreBadgeSrc: string;
  estimator: {
    viewsLabel: string;
    videosLabel: string;
    resultLabel: string;
    breakdown: string;
    disclaimer: string;
  };
}

export interface CreatorProgramContent {
  country: CreatorCountryCode;
  locale: CreatorLocale;
  /** Route of this program's landing page. */
  path: string;
  meta: { title: string; description: string };
  ui: CreatorUiCopy;
  /** Localized app names and copy; falls back to the default app copy. */
  appsCopy?: Partial<Record<StudioApp["id"], Pick<StudioApp, "name" | "tagline" | "description">>>;
  /** ISO 3166-1 alpha-2 code preselected in the application form. */
  countryIsoCode: string;
  hero: {
    eyebrow: string;
    titleLead: string;
    titleHighlight: string;
    copy: string;
    proofPoints: string[];
    secondary: string;
    cta: string;
    ctaNote: string;
  };
  deal: {
    eyebrow: string;
    title: string;
    copy: string;
    steps: { title: string; description: string }[];
    ratesNote: string;
  };
  /**
   * Leave undefined until the payout model is final: the earnings estimator
   * only renders when real rates are configured.
   */
  earnings?: CreatorEarnings;
  positioning: {
    title: string;
    copy: string;
    points: { title: string; description: string }[];
    note: string;
  };
  lookingFor: {
    title: string;
    copy: string;
    criteria: string[];
    note: string;
  };
  benefits: {
    title: string;
    items: { title: string; description: string }[];
  };
  apps: {
    title: string;
    copy: string;
    emphasis: string;
  };
  application: {
    title: string;
    copy: string;
    cta: string;
    recruitingNote: string;
    outsideCountryNote: string;
    success: { title: string; copy: string };
  };
  faq: {
    title: string;
    items: CreatorFaqItem[];
  };
  finalCta: {
    title: string;
    copy: string;
    cta: string;
  };
}

const us: CreatorProgramContent = {
  country: "us",
  locale: "en",
  path: "/creators",
  meta: {
    title: "Become a TAAB Creator | TAAB",
    description:
      "Join TAAB's creator network. Create authentic TikToks around our apps and get rewarded when your content performs.",
  },
  ui: {
    homeLabel: "TAAB home",
    skipToApplication: "Skip to application",
    headerCta: "Apply",
    switcher: { label: "FR", ariaLabel: "Version française", href: "/createurs" },
    stepLabel: "Step {n}: ",
    appsEyebrow: "TAAB apps",
    applyEyebrow: "Apply",
    applyChecklist: ["Takes about 2 minutes", "No follower minimum", "Paid on performance"],
    phoneMock: {
      screen: "/images/vérité/app/question.jpg",
      following: "Following",
      forYou: "For You",
      handle: "@you",
      caption: "POV: you brought the party game and now everyone's confessing 😳 #truthortruth",
      views: "Views",
      payoutTitle: "Payout sent",
      payoutSubtitle: "for your last video",
      chip: "Paid on performance",
    },
    appStoreBadgeAlt: "Download {app} on the App Store",
    appStoreBadgeSrc: "/images/apple-store-logo.svg",
    estimator: {
      viewsLabel: "Average views per video",
      videosLabel: "Videos per month",
      resultLabel: "Estimated monthly earnings",
      breakdown: "{videos} videos × {views} views",
      disclaimer:
        "Estimate based on our current creator rate of {rate} per 1,000 views. Actual earnings depend on how your videos perform and are not guaranteed.",
    },
  },
  countryIsoCode: "US",
  hero: {
    eyebrow: "TAAB Creator Network · US",
    titleLead: "Post TikToks.",
    titleHighlight: "Get paid.",
    copy: "Make TikToks about our apps, in your own style, on your own account. The better your videos perform, the more you earn.",
    proofPoints: ["No follower minimum", "Paid on performance", "No scripts"],
    secondary: "We're selecting our first 20 creators in the US.",
    cta: "Apply now",
    ctaNote: "Takes about 2 minutes",
  },
  deal: {
    eyebrow: "How you get paid",
    title: "Here's the deal.",
    copy: "No brand-deal negotiation, no follower threshold. You post, your videos perform, you get paid.",
    steps: [
      {
        title: "Get accepted",
        description:
          "Apply in 2 minutes. We pick a small group of creators who are a great fit for our apps.",
      },
      {
        title: "Post in your style",
        description:
          "Make TikToks featuring our apps the way you already make videos. We send ideas and hooks that work.",
      },
      {
        title: "Get paid on performance",
        description: "Every video is paid based on how it performs. More views, more money.",
      },
    ],
    ratesNote: "Your exact rate and payout details are shared as soon as you're accepted.",
  },
  positioning: {
    title: "You don't need 100K followers.",
    copy: "We're not looking for traditional influencers. We're looking for people who know how to make TikToks people actually want to watch.",
    points: [
      {
        title: "Your own style",
        description: "Make videos the way you already make them.",
      },
      {
        title: "Your own audience",
        description: "Your followers keep getting the content they follow you for.",
      },
      {
        title: "Your own creative freedom",
        description: "You decide how the app fits into your video.",
      },
    ],
    note: "Your account stays yours. No scripts to read, no turning your feed into an ad account.",
  },
  lookingFor: {
    title: "We're looking for creators, not influencers.",
    copy: "Follower count isn't the main thing we care about. Content quality, personality and the ability to make people stop scrolling matter more.",
    criteria: [
      "TikTok creators based in the US",
      "Strong sense of storytelling",
      "Authentic personality",
      "Comfortable creating short-form video",
      "Consistent enough to create occasionally",
      "Able to naturally integrate an app into content",
      "Any follower count",
    ],
    note: "You don't need to post every day. We care more about great content than volume.",
  },
  benefits: {
    title: "You create. We handle the rest.",
    items: [
      {
        title: "Paid on performance",
        description: "You earn from how your videos perform, not from your follower count.",
      },
      {
        title: "Ideas that work",
        description: "Get hooks, concepts and examples built to make people stop scrolling.",
      },
      {
        title: "Your style, your account",
        description: "No scripts and no ad-account vibe. Your content still feels like you.",
      },
      {
        title: "Early access",
        description: "Be first on new TAAB apps and new paid opportunities.",
      },
    ],
  },
  apps: {
    title: "You'll be creating around apps people actually use.",
    copy: "TAAB builds consumer apps around social interaction, entertainment and everyday experiences: games for couples, party games for friends, and new ideas we're shipping next.",
    emphasis:
      "You're not making random branded content. You're helping us grow products.",
  },
  application: {
    title: "Think you'd be a good fit?",
    copy: "Tell us a little about yourself and your TikTok. We'll review your application and get back to you if there's a fit.",
    cta: "Apply now",
    recruitingNote: "We're currently recruiting creators based in the US.",
    outsideCountryNote:
      "We're starting with US creators. You can still apply and we'll reach out when we open in your country.",
    success: {
      title: "You're in.",
      copy: "Thanks for applying to the TAAB Creator Network. We'll review your application and get back to you if there's a fit.",
    },
  },
  faq: {
    title: "Questions",
    items: [
      {
        question: "Do I need a large following?",
        answer:
          "No. We care more about content quality and your ability to make engaging videos than follower count.",
      },
      {
        question: "Do I have to post every day?",
        answer:
          "No. We're looking for authentic creators, not content machines.",
      },
      {
        question: "Do I have to show my face?",
        answer:
          "Not necessarily. It depends on your content style and the opportunities available.",
      },
      {
        question: "How does payment work?",
        answer:
          "You're paid based on how your videos perform: the more views they get, the more you earn. Your exact rate and payout details are shared as soon as you're accepted.",
      },
      {
        question: "Can I work with other brands?",
        answer:
          "Yes. TAAB's creator program is designed to fit alongside your existing content and partnerships.",
      },
    ],
  },
  finalCta: {
    title: "Your next TikTok could pay.",
    copy: "We're selecting our first 20 creators in the US.",
    cta: "Apply now",
  },
};

const fr: CreatorProgramContent = {
  country: "fr",
  locale: "fr",
  path: "/createurs",
  meta: {
    title: "Deviens TAAB Creator | TAAB",
    description:
      "Rejoins le réseau de créateurs TAAB. Crée des TikToks autour de nos apps et sois rémunéré selon les performances de tes vidéos.",
  },
  ui: {
    homeLabel: "Accueil TAAB",
    skipToApplication: "Aller à la candidature",
    headerCta: "Postuler",
    switcher: { label: "US", ariaLabel: "English (US) version", href: "/creators" },
    stepLabel: "Étape {n} : ",
    appsEyebrow: "Les apps TAAB",
    applyEyebrow: "Candidature",
    applyChecklist: ["Environ 2 minutes", "Aucun minimum d'abonnés", "Payé à la performance"],
    phoneMock: {
      screen: "/images/vérité/app/question.jpg",
      following: "Abonnements",
      forYou: "Pour toi",
      handle: "@toi",
      caption: "POV : t'as ramené le jeu de soirée et maintenant tout le monde avoue tout 😳 #veriteouverite",
      views: "Vues",
      payoutTitle: "Paiement envoyé",
      payoutSubtitle: "pour ta dernière vidéo",
      chip: "Payé à la performance",
    },
    appStoreBadgeAlt: "Télécharger {app} dans l'App Store",
    appStoreBadgeSrc: "/images/apple-store-logo-fr.svg",
    estimator: {
      viewsLabel: "Vues moyennes par vidéo",
      videosLabel: "Vidéos par mois",
      resultLabel: "Gains mensuels estimés",
      breakdown: "{videos} vidéos × {views} vues",
      disclaimer:
        "Estimation basée sur notre tarif créateur actuel de {rate} pour 1 000 vues. Les gains réels dépendent des performances de tes vidéos et ne sont pas garantis.",
    },
  },
  appsCopy: {
    bae: {
      name: "Bae : Jeu de couple",
      tagline: "Le jeu de couple qui casse la routine.",
      description:
        "Plus de 500 questions et défis pour se redécouvrir, rire ensemble et transformer n'importe quelle soirée en date.",
    },
    truth: {
      name: "Vérité ou Vérité",
      tagline: "Le jeu de soirée entre amis.",
      description:
        "Choisis ton ambiance, fais tourner le téléphone et place aux confessions. Pas de compte : un seul téléphone, tout le monde joue.",
    },
  },
  countryIsoCode: "FR",
  hero: {
    eyebrow: "TAAB Creator Network · France",
    titleLead: "Poste des TikToks.",
    titleHighlight: "Fais-toi payer.",
    copy: "Crée des TikToks autour de nos apps, avec ton style, sur ton compte. Plus tes vidéos performent, plus tu gagnes.",
    proofPoints: ["Aucun minimum d'abonnés", "Payé à la performance", "Pas de script"],
    secondary: "On sélectionne nos 20 premiers créateurs en France.",
    cta: "Je postule",
    ctaNote: "Ça prend environ 2 minutes",
  },
  deal: {
    eyebrow: "Comment tu es payé",
    title: "Le deal.",
    copy: "Pas de négociation de placement, pas de seuil d'abonnés. Tu postes, tes vidéos performent, tu es payé.",
    steps: [
      {
        title: "Postule",
        description:
          "Ça prend 2 minutes. On sélectionne un petit groupe de créateurs qui collent parfaitement à nos apps.",
      },
      {
        title: "Poste à ta façon",
        description:
          "Crée des TikToks avec nos apps comme tu fais déjà tes vidéos. On t'envoie des idées et des hooks qui marchent.",
      },
      {
        title: "Gagne selon tes perfs",
        description: "Chaque vidéo est rémunérée selon ses performances. Plus de vues, plus d'argent.",
      },
    ],
    ratesNote: "Ton tarif exact et les modalités de paiement te sont communiqués dès ton acceptation.",
  },
  positioning: {
    title: "Pas besoin de 100K abonnés.",
    copy: "On ne cherche pas des influenceurs classiques. On cherche des gens qui savent faire des TikToks qu'on a vraiment envie de regarder.",
    points: [
      { title: "Ton style", description: "Fais tes vidéos comme tu les fais déjà." },
      {
        title: "Ta communauté",
        description: "Tes abonnés continuent de voir le contenu pour lequel ils te suivent.",
      },
      {
        title: "Ta liberté créative",
        description: "C'est toi qui décides comment l'app s'intègre dans ta vidéo.",
      },
    ],
    note: "Ton compte reste le tien. Pas de script à lire, et ton feed ne devient pas un compte pub.",
  },
  lookingFor: {
    title: "On cherche des créateurs, pas des influenceurs.",
    copy: "Le nombre d'abonnés n'est pas ce qui compte le plus. La qualité du contenu, la personnalité et la capacité à faire arrêter le scroll comptent bien plus.",
    criteria: [
      "Créateurs TikTok basés en France",
      "Un vrai sens du storytelling",
      "Une personnalité authentique",
      "À l'aise avec la vidéo courte",
      "Assez régulier pour créer de temps en temps",
      "Capable d'intégrer une app naturellement",
      "Peu importe ton nombre d'abonnés",
    ],
    note: "Pas besoin de poster tous les jours. On préfère un super contenu au volume.",
  },
  benefits: {
    title: "Tu crées. On s'occupe du reste.",
    items: [
      {
        title: "Payé à la performance",
        description: "Tu gagnes selon les performances de tes vidéos, pas selon ton nombre d'abonnés.",
      },
      {
        title: "Des idées qui marchent",
        description: "Accède à des hooks, concepts et exemples pensés pour faire arrêter le scroll.",
      },
      {
        title: "Ton style, ton compte",
        description: "Pas de script, pas d'effet compte pub. Ton contenu te ressemble toujours.",
      },
      {
        title: "Accès en avant-première",
        description: "Découvre avant tout le monde les nouvelles apps TAAB et les nouvelles opportunités rémunérées.",
      },
    ],
  },
  apps: {
    title: "Tu crées autour d'apps que les gens utilisent vraiment.",
    copy: "TAAB conçoit des apps grand public autour du lien social et du divertissement : des jeux pour les couples, des jeux de soirée entre amis, et de nouvelles idées qu'on prépare.",
    emphasis:
      "Tu ne fais pas du contenu sponsorisé au hasard. Tu nous aides à faire grandir de vrais produits.",
  },
  application: {
    title: "Tu penses avoir le profil ?",
    copy: "Parle-nous un peu de toi et de ton TikTok. On étudie ta candidature et on revient vers toi si ça matche.",
    cta: "Je postule",
    recruitingNote: "On recrute actuellement des créateurs basés en France.",
    outsideCountryNote:
      "On commence avec des créateurs en France. Tu peux quand même postuler, on reviendra vers toi quand on ouvrira dans ton pays.",
    success: {
      title: "C'est envoyé.",
      copy: "Merci d'avoir postulé au TAAB Creator Network. On étudie ta candidature et on revient vers toi si ça matche.",
    },
  },
  faq: {
    title: "Tes questions",
    items: [
      {
        question: "J'ai besoin de beaucoup d'abonnés ?",
        answer:
          "Non. On s'intéresse plus à la qualité de ton contenu et à ta capacité à faire des vidéos engageantes qu'à ton nombre d'abonnés.",
      },
      {
        question: "Je dois poster tous les jours ?",
        answer: "Non. On cherche des créateurs authentiques, pas des machines à contenu.",
      },
      {
        question: "Je dois montrer mon visage ?",
        answer: "Pas forcément. Ça dépend de ton style de contenu et des opportunités disponibles.",
      },
      {
        question: "Comment je suis payé ?",
        answer:
          "Tu es payé selon les performances de tes vidéos : plus elles font de vues, plus tu gagnes. Ton tarif exact et les modalités de paiement te sont communiqués dès ton acceptation.",
      },
      {
        question: "Je peux travailler avec d'autres marques ?",
        answer:
          "Oui. Le programme créateurs de TAAB est pensé pour s'intégrer à côté de ton contenu et de tes partenariats existants.",
      },
    ],
  },
  finalCta: {
    title: "Ton prochain TikTok pourrait te rapporter.",
    copy: "On sélectionne nos 20 premiers créateurs en France.",
    cta: "Je postule",
  },
};

export const creatorPrograms: Record<CreatorCountryCode, CreatorProgramContent> =
  { us, fr };

export const DEFAULT_CREATOR_COUNTRY: CreatorCountryCode = "us";
