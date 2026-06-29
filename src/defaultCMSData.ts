import { CMSData } from "./types";

export const defaultCMSData: CMSData = {
  brandName: "Veloce AI",
  heroTitle: "Your Entire Creative Team. Powered by AI.",
  heroSubtitle: "Stop hiring freelancers one by one. Get developers, editors, designers, automation experts, marketers and AI specialists under one roof.",
  heroCtaPrimary: "Book Free Strategy Call",
  heroCtaSecondary: "View Services",
  services: [
    {
      id: "ai-automation",
      title: "AI Automation",
      description: "Infuse modern intelligence into your operational workflow to scale your reach and automate tedious manual workflows.",
      features: [
        "CRM Integration & Syncing",
        "Automated Smart Email Flows",
        "WhatsApp Conversational AI Agents",
        "Lead Capture & Scoring Bot",
        "Custom Automated Slack Workflows",
        "Intelligent Document Summaries"
      ],
      icon: "Cpu"
    },
    {
      id: "website-dev",
      title: "Website Development",
      description: "Fast, elegant, search-optimized custom landing pages and SaaS portals styled with Vercel and Apple-level precision.",
      features: [
        "Interactive SaaS Gateways",
        "Modern Marketing Landing Pages",
        "Dynamic Creative Portfolios",
        "Fast Tailwind CSS Performance",
        "SEO Structural Best Practices",
        "CMS Data Integration"
      ],
      icon: "Globe"
    },
    {
      id: "mobile-apps",
      title: "Mobile App Development",
      description: "Bespoke, high-performance Android and iOS mobile applications built to accelerate validation and scale user adoption.",
      features: [
        "Cross-Platform Native Experience",
        "Rapid Interactive MVP Sprints",
        "Offline-Capable Architecture",
        "Secure Razorpay payment tunnels",
        "Biometric Security integrations",
        "Smart push notifications triggers"
      ],
      icon: "Smartphone"
    },
    {
      id: "ui-ux",
      title: "UI/UX Design",
      description: "Minimalist, luxury layouts featuring spacious grids, bold typography pairings, and clean micro-interactions.",
      features: [
        "High-Fidelity Wireframes",
        "Custom SaaS Dashboards layouts",
        "Interactive Design Prototypes",
        "Comprehensive User Research",
        "Clean Vector Icon Assets",
        "Tailwind Design System Tokens"
      ],
      icon: "Palette"
    },
    {
      id: "video-editing",
      title: "Video Editing",
      description: "High-retention social media videos designed to build trust, command attention, and drive conversion.",
      features: [
        "YouTube Premium Video Essays",
        "High-Impact Reels & TikTok Clips",
        "Documentary-Style Storytelling",
        "Fluid motion graphics overlays",
        "Custom Sound Design & Mastering",
        "Retargeting Ad Creatives editing"
      ],
      icon: "Video"
    },
    {
      id: "graphic-design",
      title: "Graphic Design",
      description: "Stunning creative collaterals, digital banners, and presentation layouts that elevate brand authority.",
      features: [
        "High-Click YouTube Thumbnails",
        "Unified Corporate Identity Kits",
        "Dynamic Social Feed Graphics",
        "Bespoke Vector Logo Design",
        "Premium Pitch Decks Layouts",
        "High-Resolution Print Media"
      ],
      icon: "Layers"
    },
    {
      id: "marketing",
      title: "Content Marketing",
      description: "Strategic audience growth engine focusing on search traffic, content frameworks, and high-quality inbound pipelines.",
      features: [
        "Personal Branding Engine",
        "Multi-Platform Social Calendar",
        "Scientific SEO Copywriting",
        "Segmented Email Newsletters",
        "Optimized Inbound Lead funnels",
        "Analytical Performance Auditing"
      ],
      icon: "TrendingUp"
    }
  ],
  portfolio: [
    {
      id: "proj-1",
      title: "Automated Lead Hub",
      category: "automation",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      description: "An AI-powered inbound lead qualification pipeline that parses, scores, and synchronizes leads into CRM systems automatically.",
      challenge: "The client was manually reviewing 400+ spammy lead queries every day, losing critical hours and delaying hot prospect engagement.",
      outcome: "Designed a secure autonomous pipeline that integrates a custom LLM categorizer. It decreased lead qualification lag from 18 hours to under 30 seconds and boosted conversion by 34%.",
      tech: ["Node.js", "Gemini API", "Make.com", "HubSpot", "Express"]
    },
    {
      id: "proj-2",
      title: "Nova SaaS Portal",
      category: "website",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      description: "An ultra-fast, high-converting React application featuring responsive billing widgets, animated dashboards, and full-stack integration.",
      challenge: "Nova's previous Webflow site suffered from severe layout shifts (CLS), sluggish load times on mobile, and poor signup conversion metrics.",
      outcome: "Rebuilt the entire SaaS website from scratch using custom React and Tailwind CSS. Reduced load times by 72% and increased signup ratios by 4.5x.",
      tech: ["React", "Vite", "Tailwind CSS", "Framer Motion", "Razorpay"]
    },
    {
      id: "proj-3",
      title: "Scribe UI Design",
      category: "ui",
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80",
      description: "A dark premium, glassmorphism design concept for an editing software suite, strictly inspired by Apple's styling system.",
      challenge: "The client's video tool had rich features but was too cluttered for premium video editors, leading to a high day-1 churn rate of 48%.",
      outcome: "Crafted a clean, dark-themed grid layout with contextual flyout menus, reducing cognitive load and lowering user churn to 12%.",
      tech: ["Figma", "Design Tokens", "Glassmorphic CSS", "Lucide Assets"]
    },
    {
      id: "proj-4",
      title: "Apex Fitness Mobile App",
      category: "apps",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      description: "A cross-platform iOS & Android workout planner containing interactive charts, biometric authentication, and custom plans.",
      challenge: "Users needed a lightweight, hyper-responsive mobile tool that worked flawlessly on trail runs with poor cellular connections.",
      outcome: "Delivered a native React Native app with an offline-first SQLite database that automatically syncs once connection is re-established.",
      tech: ["React Native", "Expo", "SQLite", "Node.js", "Tailwind CSS"]
    },
    {
      id: "proj-5",
      title: "Horizon Video Campaign",
      category: "editing",
      image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
      description: "A documentary-style branding campaign utilizing premium kinetic typography, color grading, and high-retention cuts.",
      challenge: "A startup required social reels that explained their complex API product in under 30 seconds, maintaining high viewer retention.",
      outcome: "Engineered high-pace kinetic subtitle cards and custom sound patterns. The campaign accumulated 1.2M+ organic views within 2 weeks of release.",
      tech: ["Adobe Premiere Pro", "After Effects", "Audition", "Color Grading"]
    },
    {
      id: "proj-6",
      title: "Clarity Brand Overhaul",
      category: "branding",
      image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80",
      description: "A comprehensive brand identity rebuild encompassing customized typography guidelines, custom icons, and premium pitch decks.",
      challenge: "Clarity's branding looked dated, making it difficult to pitch their enterprise SaaS to enterprise procurement officers.",
      outcome: "Designed a minimalist visual system based on dark premium tones, clean Swiss layouts, and geometric logos, driving 5 new enterprise signups.",
      tech: ["Illustrator", "Brand Strategy", "Typography", "Keynote layouts"]
    }
  ],
  testimonials: [
    {
      id: "test-1",
      name: "Siddharth Mehta",
      company: "AeroAI Tech",
      role: "Founder & CEO",
      feedback: "Working with Veloce AI is like hiring a world-class engineering team overnight. They designed, developed, and deployed our SaaS app with unbelievable attention to detail. Our automation flows are flawless.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      id: "test-2",
      name: "Sarah Jenkins",
      company: "Pulse Media",
      role: "Operations Director",
      feedback: "Their high-retention video team transformed our YouTube content. Engagement is up 180%, and the custom workflow automation they built for our editing pipeline saves us over 20 hours of manual coordination every single week.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      id: "test-3",
      name: "Ranveer Roy",
      company: "Clarity Financial",
      role: "Co-Founder",
      feedback: "Our website redesign had Apple-level sleekness. The dark glassmorphism styling, clean animations, and flawless responsive sizing on mobile are exactly what our brand stood for. Highly recommended!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ],
  pricing: [
    {
      id: "price-starter",
      name: "Starter Plan",
      priceINR: 19999,
      isCustom: false,
      ctaText: "Get Started Now",
      popular: false,
      features: [
        "Sleek High-Converting Web Design",
        "Responsive Apple-Style Layouts",
        "Core Brand Identity & Logos",
        "Unified Design Tokens System",
        "Basic SEO Structure Setup",
        "Priority Email & Chat Support"
      ]
    },
    {
      id: "price-growth",
      name: "Growth Plan",
      priceINR: 49999,
      isCustom: false,
      ctaText: "Unlock AI Scale",
      popular: true,
      features: [
        "Everything in Starter Package",
        "Advanced CRM & Workflow Automations",
        "High-Retention Video Editing (10 Shorts)",
        "Bespoke SaaS Front-End Implementation",
        "Interactive Interactive UI Mockups",
        "Dedicated Growth Strategist Lead",
        "Direct Slack Channel Communication"
      ]
    },
    {
      id: "price-enterprise",
      name: "Enterprise",
      priceINR: 120000,
      isCustom: true,
      ctaText: "Contact Sales Crew",
      popular: false,
      features: [
        "Unlimited Requested Services Sprint",
        "Tailored Multi-Agent AI System",
        "Cross-Platform Native Apps (Android+iOS)",
        "Deep Search Inbound Growth Campaign",
        "Instant WhatsApp API Automations",
        "Dedicated Multi-Disciplinary Squad",
        "24/7 Priority Emergency Support"
      ]
    }
  ],
  faqs: [
    {
      id: "faq-1",
      question: "How does the subscription models work?",
      answer: "Veloce AI works as an elite, flexible subscription service. Once subscribed, you gain instant access to your dedicated AI creative team. You can request unlimited designs, developments, or automations, and we complete them in swift sprints."
    },
    {
      id: "faq-2",
      question: "What is your typical turnaround time?",
      answer: "We deploy high-quality, fully responsive components and CRM automations in as little as 2 to 4 business days. Major software MVPs or fully functional SaaS portals typically conclude within 2 to 3 weeks."
    },
    {
      id: "faq-3",
      question: "Can I upgrade, downgrade, or cancel any time?",
      answer: "Yes, our packages are completely flexible. You can pause or cancel your subscription at any time with a single click. No hidden contracts, no hassle."
    },
    {
      id: "faq-4",
      question: "Do you offer refunds if we aren't satisfied?",
      answer: "We stand behind our work with pride. We provide unlimited active revisions to guarantee your results are absolutely spectacular. If we cannot deliver, we will align with you to find a solution."
    },
    {
      id: "faq-5",
      question: "How do we communicate with our dedicated squad?",
      answer: "Growth and Enterprise clients gain a private Slack channel with real-time sync. You can also log tickets directly on our dashboard or schedule ad-hoc sessions via our in-app calendar wizard."
    }
  ]
};
