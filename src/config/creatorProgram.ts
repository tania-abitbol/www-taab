export type CreatorCountryCode = "us";

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

export interface CreatorProgramContent {
  country: CreatorCountryCode;
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

export const creatorPrograms: Record<CreatorCountryCode, CreatorProgramContent> =
  { us };

export const DEFAULT_CREATOR_COUNTRY: CreatorCountryCode = "us";
