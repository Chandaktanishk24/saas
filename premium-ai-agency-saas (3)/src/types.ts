export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: "automation" | "website" | "ui" | "apps" | "editing" | "branding";
  image: string;
  description: string;
  challenge: string;
  outcome: string;
  tech: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  role: string;
  feedback: string;
  image: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceINR: number;
  isCustom: boolean;
  features: string[];
  ctaText: string;
  popular: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface CMSData {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  services: ServiceItem[];
  portfolio: PortfolioProject[];
  testimonials: TestimonialItem[];
  pricing: PricingPlan[];
  faqs: FAQItem[];
}

export interface BillingDetails {
  name: string;
  email: string;
  company: string;
  phone: string;
  budget: string;
  description?: string;
}

export interface PaymentInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  planName: string;
  paymentMethod: 'Stripe' | 'Razorpay';
  gstNumber: string;
  billingDetails: BillingDetails;
  originalAmount: number;
  discount: number;
  netAmount: number;
  gstAmount: number;
  totalAmount: number;
  message: string;
}
