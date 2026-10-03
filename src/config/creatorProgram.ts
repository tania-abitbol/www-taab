export type CreatorCountryCode = "us";

export interface CreatorApp {
  name: string;
  logo: string;
  description: string;
  iosLink: string;
}

export interface CreatorFaqItem {
  question: string;
  answer: string;
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
    secondary: string;
    cta: string;
  };
  positioning: {
    title: string;
    copy: string;
    points: { title: string; description: string }[];
    note: string;
  };
  steps: { title: string; description: string }[];
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
    list: CreatorApp[];
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
    eyebrow: "ETHA CREATOR NETWORK",
    titleLead: "Become an",
    titleHighlight: "Etha Creator",
    copy: "Create authentic TikToks around our apps. Keep your style. Keep your audience. Get rewarded when your content performs.",
    secondary: "We're building a small network of talented creators in the US.",
    cta: "Apply to become a creator",
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
  steps: [
    {
      title: "Apply",
      description:
        "Tell us about your TikTok, your audience and the type of content you create.",
    },
    {
      title: "Get selected",
      description:
        "We select a small group of creators who are a strong fit for our apps.",
    },
    {
      title: "Create",
      description:
        "Create authentic content that fits naturally into your usual style.",
    },
    {
      title: "Get rewarded",
      description: "When your content performs, you can earn more.",
    },
  ],
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
        title: "Creative freedom",
        description: "Your content should still feel like you.",
      },
      {
        title: "Content ideas",
        description:
          "Get access to concepts, hooks and examples that can inspire your videos.",
      },
      {
        title: "Performance rewards",
        description:
          "Creators can earn based on the performance of their content.",
      },
      {
        title: "Early access",
        description: "Get early access to new Etha apps and opportunities.",
      },
    ],
  },
  apps: {
    title: "You'll be creating around apps people actually use.",
    copy: "Etha builds consumer apps around social interaction, entertainment and everyday experiences: games for couples, party games for friends, and new ideas we're shipping next.",
    emphasis:
      "You're not making random branded content. You're helping us grow products.",
    list: [
      {
        name: "Bae: Couple Game",
        logo: "bae",
        description:
          "A quiz game for couples to rediscover each other, strengthen their bond and break out of the daily routine.",
        iosLink: "https://apps.apple.com/us/app/id1574150149",
      },
      {
        name: "Truth or Truth",
        logo: "vérité",
        description:
          "A party game that turns your phone into the ultimate accessory for nights out with friends.",
        iosLink: "https://apps.apple.com/us/app/id6480046704",
      },
    ],
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
      copy: "Thanks for applying to the Etha Creator Network. We'll review your application and get back to you if there's a fit.",
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
          "Compensation depends on the creator program and content performance. Details are provided to selected creators.",
      },
      {
        question: "Can I work with other brands?",
        answer:
          "Yes. Etha's creator program is designed to fit alongside your existing content and partnerships.",
      },
    ],
  },
  finalCta: {
    title: "Ready to create with Etha?",
    copy: "We're looking for our first group of US creators.",
    cta: "Apply now",
  },
};

export const creatorPrograms: Record<CreatorCountryCode, CreatorProgramContent> =
  { us };

export const DEFAULT_CREATOR_COUNTRY: CreatorCountryCode = "us";
