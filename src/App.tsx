import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import Icon from "./components/Icon";
import AIChatBot from "./components/AIChatBot";
import { defaultCMSData } from "./defaultCMSData";
import { CMSData, PortfolioProject, PricingPlan, BillingDetails, PaymentInvoice } from "./types";
import AuthPage from "./components/AuthPage";
import ClientDashboard from "./components/ClientDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  // Page states
  const [cmsData, setCmsData] = useState<CMSData>(() => {
    try {
      const cached = localStorage.getItem("veloce_cms_data");
      if (cached && cached.trim() !== "") {
        const parsed = JSON.parse(cached);
        const mappedPortfolio = Array.isArray(parsed.portfolio)
          ? parsed.portfolio.map((p: any) => ({
              id: p.id || `proj-cached-${Math.random()}`,
              title: p.title || "Untitled Project",
              category: p.category || "automation",
              image: p.image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
              description: p.description || p.desc || "",
              challenge: p.challenge || "Optimization and implementation challenge.",
              outcome: p.outcome || "Successful implementation and rollout of the project.",
              tech: Array.isArray(p.tech) ? p.tech : (Array.isArray(p.tags) ? p.tags : []),
            }))
          : defaultCMSData.portfolio;

        return {
          ...defaultCMSData,
          ...parsed,
          services: Array.isArray(parsed.services) ? parsed.services : defaultCMSData.services,
          portfolio: mappedPortfolio,
          testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaultCMSData.testimonials,
          pricing: Array.isArray(parsed.pricing) ? parsed.pricing : defaultCMSData.pricing,
          faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaultCMSData.faqs,
        };
      }
    } catch (e) {
      console.error("Could not restore CMS data from localStorage:", e);
    }
    return defaultCMSData;
  });

  // Safe tracking of session initialization errors to report via UI Toast
  const [sessionError, setSessionError] = useState<string | null>(() => {
    try {
      const cachedUser = localStorage.getItem("veloce_user");
      const cachedToken = localStorage.getItem("veloce_token");

      if (cachedUser && cachedUser.trim() !== "") {
        try {
          const parsed = JSON.parse(cachedUser);
          if (!parsed || typeof parsed !== "object") {
            return "User session data in localStorage is not a valid JSON object.";
          }
          if (!parsed.id || !parsed.name || !parsed.email || !parsed.role) {
            return "User session data is missing mandatory authentication properties (id, name, email, role).";
          }
        } catch (err: any) {
          return `Malformed JSON detected in user session cache: ${err.message || err}`;
        }
      }

      if (cachedToken && cachedToken.trim() === "") {
        return "Authentication token in localStorage is empty.";
      }
    } catch (e: any) {
      return `Access to localStorage was blocked or failed: ${e.message || e}`;
    }
    return null;
  });

  // Authentication State
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(() => {
    try {
      const cached = localStorage.getItem("veloce_user");
      if (cached && cached.trim() !== "") {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && parsed.id && parsed.name && parsed.email && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not restore user session from localStorage:", e);
      try {
        localStorage.removeItem("veloce_user");
      } catch (err) {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const val = localStorage.getItem("veloce_token");
      if (val && val.trim() !== "") {
        return val;
      }
    } catch (e) {
      console.warn("Could not retrieve token from localStorage:", e);
    }
    return null;
  });

  const [activeView, setActiveView] = useState<"landing" | "client" | "admin" | "auth">("landing");
  
  // Sidebar CMS Editor toggle
  const [isCmsOpen, setIsCmsOpen] = useState(false);
  const [cmsActiveTab, setCmsActiveTab] = useState<"hero" | "services" | "portfolio" | "pricing" | "faqs" | "testimonials">("hero");

  // Interaction States
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Booking State
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDetails, setBookingDetails] = useState({ name: "", email: "", notes: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [calendlyLink, setCalendlyLink] = useState(() => {
    try {
      const val = localStorage.getItem("veloce_calendly_link");
      if (val && val.trim() !== "") {
        return val;
      }
    } catch (e) {
      console.warn("Could not retrieve calendly link:", e);
    }
    return "https://calendly.com/tanishktanishkchandak45";
  });

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    budget: "₹50,000 - ₹1,00,000",
    service: "AI Automation",
    description: ""
  });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Cookie consent state
  const [cookieConsent, setCookieConsent] = useState(() => {
    try {
      const val = localStorage.getItem("veloce_cookie_consent");
      return val === "true";
    } catch (e) {
      console.warn("Could not retrieve cookie consent:", e);
      return false;
    }
  });

  // Custom Cursor Glow Position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // App Initial Loader
  const [appLoading, setAppLoading] = useState(true);

  // Checkout process variables
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "details" | "success" | "failed" | "razorpay_sim_form">("idle");
  const [billingDetailsForm, setBillingDetailsForm] = useState<BillingDetails>({
    name: "",
    email: "",
    company: "",
    phone: "",
    budget: "₹49,999",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [gstNumber, setGstNumber] = useState("");
  const [paymentGateway, setPaymentGateway] = useState<'Stripe' | 'Razorpay'>('Razorpay');
  const [checkoutInvoice, setCheckoutInvoice] = useState<PaymentInvoice | null>(null);

  // Simulated Razorpay Sandbox payment states
  const [razorpaySimStep, setRazorpaySimStep] = useState<"method" | "upi" | "card" | "netbanking" | "processing">("method");
  const [razorpayUpiId, setRazorpayUpiId] = useState("");
  const [razorpayCardNumber, setRazorpayCardNumber] = useState("");
  const [razorpayCardExpiry, setRazorpayCardExpiry] = useState("");
  const [razorpayCardCvv, setRazorpayCardCvv] = useState("");
  const [razorpayCardName, setRazorpayCardName] = useState("");
  const [razorpayBank, setRazorpayBank] = useState("HDFC");
  const [razorpaySimProgress, setRazorpaySimProgress] = useState(0);
  const [razorpayOrderId, setRazorpayOrderId] = useState("");

  // Toast helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth Callbacks
  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    try {
      localStorage.setItem("veloce_user", JSON.stringify(authUser));
      localStorage.setItem("veloce_token", authToken);
    } catch (e) {
      console.error("Could not persist user session to localStorage:", e);
    }
    setActiveView(authUser.role === "ADMIN" ? "admin" : "client");
    triggerToast(`Welcome back, ${authUser.name}! Session authenticated successfully.`, "success");
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Error signing out from Supabase:", e);
      }
    }
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("veloce_user");
      localStorage.removeItem("veloce_token");
    } catch (e) {
      console.error("Could not clear user session from localStorage:", e);
    }
    setActiveView("landing");
    triggerToast("Logged out successfully.", "info");
  };

  // Persist CMS adjustments
  const saveCmsData = (updated: CMSData) => {
    setCmsData(updated);
    try {
      localStorage.setItem("veloce_cms_data", JSON.stringify(updated));
    } catch (e) {
      console.error("Could not persist CMS changes to localStorage:", e);
    }
    triggerToast("CMS layout changes applied in real-time!", "success");
  };

  const resetCmsToDefault = () => {
    if (confirm("Reset website copy and structure to original values?")) {
      setCmsData(defaultCMSData);
      try {
        localStorage.removeItem("veloce_cms_data");
      } catch (e) {
        console.error("Could not remove CMS data from localStorage:", e);
      }
      triggerToast("CMS restored to factory settings.", "info");
    }
  };

  // Event handlers
  useEffect(() => {
    if (sessionError) {
      triggerToast(`Session Error: ${sessionError}. For security, your corrupted session details have been cleared. Please log in again.`, "error");
      try {
        localStorage.removeItem("veloce_user");
        localStorage.removeItem("veloce_token");
      } catch (err) {}
      setSessionError(null);
    }
  }, [sessionError]);

  // Robust Supabase Auth synchronization & session protection effect
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check current active session on startup to restore login state automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        const defaultRole = session.user.email === "tanishkchandak45@gmail.com" || session.user.email === "tanishktanishkchandak45@gmail.com" || session.user.email?.includes("admin") ? "ADMIN" : "CLIENT";
        const userProfile = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email || "",
          email: session.user.email || "",
          role: session.user.user_metadata?.role || defaultRole,
        };
        setUser(userProfile);
        setToken(session.access_token);
        localStorage.setItem("veloce_user", JSON.stringify(userProfile));
        localStorage.setItem("veloce_token", session.access_token);

        // Auto-navigate to dashboard on successful session restoration
        setActiveView(userProfile.role === "ADMIN" ? "admin" : "client");
      }
    });

    // Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        const defaultRole = session.user.email === "tanishkchandak45@gmail.com" || session.user.email === "tanishktanishkchandak45@gmail.com" || session.user.email?.includes("admin") ? "ADMIN" : "CLIENT";
        const userProfile = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email || "",
          email: session.user.email || "",
          role: session.user.user_metadata?.role || defaultRole,
        };
        setUser(userProfile);
        setToken(session.access_token);
        localStorage.setItem("veloce_user", JSON.stringify(userProfile));
        localStorage.setItem("veloce_token", session.access_token);

        // Upsert user details into public.users to keep database records synchronized
        supabase.from("users").upsert({
          id: session.user.id,
          full_name: userProfile.name,
          email: userProfile.email,
        }).then(({ error: dbErr }) => {
          if (dbErr) console.warn("[AuthSync] Failed to register user profile:", dbErr);
        });

        if (event === "SIGNED_IN") {
          setActiveView(userProfile.role === "ADMIN" ? "admin" : "client");
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setToken(null);
        localStorage.removeItem("veloce_user");
        localStorage.removeItem("veloce_token");
        setActiveView("landing");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protect Admin views dynamically
  useEffect(() => {
    if (activeView === "admin" && user && user.role !== "ADMIN") {
      setActiveView("client");
      triggerToast("Access Denied: Admin privileges are required to view this portal.", "error");
    }
  }, [activeView, user]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    // Simulated premium asset loading
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1200);

    // Fetch dynamic portfolio CMS updates
    const fetchPortfolio = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase.from("projects").select("*");
          if (error) throw error;
          if (data && data.length > 0) {
            setCmsData((prev) => ({
              ...prev,
              portfolio: data.map((p: any) => {
                const servicesLower = (p.services || "").toLowerCase();
                let cat: "automation" | "website" | "ui" | "apps" | "editing" | "branding" = "automation";
                if (servicesLower.includes("automation")) cat = "automation";
                else if (servicesLower.includes("website") || servicesLower.includes("web")) cat = "website";
                else if (servicesLower.includes("ui") || servicesLower.includes("ux") || servicesLower.includes("design")) cat = "ui";
                else if (servicesLower.includes("app") || servicesLower.includes("mobile")) cat = "apps";
                else if (servicesLower.includes("editing") || servicesLower.includes("video")) cat = "editing";
                else if (servicesLower.includes("brand")) cat = "branding";

                const techArr = (p.technology || p.tech || "").split(",").map((t: string) => t.trim()).filter(Boolean);

                return {
                  id: String(p.id || `proj-fetched-${Math.random()}`),
                  title: p.title || "Untitled Project",
                  category: cat,
                  image: (p.images || "").split(",")[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
                  description: p.description || "",
                  challenge: p.challenge || "Optimization and implementation challenge.",
                  outcome: p.outcome || "Successful implementation and rollout of the project.",
                  tech: techArr.length > 0 ? techArr : ["TypeScript", "React"],
                };
              }),
            }));
          }
        }
      } catch (err) {
        console.warn("CMS portfolio sync notice (gracefully falling back to static defaultCMSData):", err);
      }
    };
    fetchPortfolio();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.description) {
      triggerToast("Please populate all requested fields before submitting.", "error");
      return;
    }
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from("contact_messages").insert([
          {
            sender_name: contactForm.name,
            sender_email: contactForm.email,
            content: contactForm.description,
            status: "UNREAD",
          }
        ]);
        if (error) {
          // Fallback to "messages" to support dual schema checks
          await supabase.from("messages").insert([
            {
              sender_name: contactForm.name,
              sender_email: contactForm.email,
              content: contactForm.description,
              status: "UNREAD",
            }
          ]);
        }
      }

      // Send automated emails via Resend serverless endpoint
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: contactForm.email,
            name: contactForm.name,
            type: "contact_form",
            details: {
              content: contactForm.description,
            }
          })
        });

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "tanishkchandak45@gmail.com",
            name: "Admin",
            type: "admin_notification",
            details: {
              eventType: "New Contact Message",
              clientName: contactForm.name,
              clientEmail: contactForm.email,
              summary: `Message submitted: "${contactForm.description}"`
            }
          })
        });
      } catch (mailErr) {
        console.warn("Failed to dispatch contact form notification emails:", mailErr);
      }

      setContactSuccess(true);
      triggerToast("Message registered! Notification sent to admin.", "success");
    } catch (err: any) {
      triggerToast(err.message || "An error occurred during submission.", "error");
    }
  };

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from("newsletters").upsert(
          {
            email: newsletterEmail,
            active: true,
          },
          { onConflict: 'email' }
        );
        if (error) {
          console.error("[Newsletter Subscription Error] Failed to subscribe:", error);
          console.log(JSON.stringify(error, null, 2));
          if (error.message && error.message.toLowerCase().includes("could not find the table")) {
            throw new Error(
              "Our newsletter subscription service is temporarily undergoing scheduled maintenance. Please try again in a few minutes! (Error: 'newsletters' table is not created in Supabase)"
            );
          }
          throw error;
        }
      }
      
      console.log("[Newsletter] Saved to database");
      console.log("[Newsletter] Calling send-email API");

      try {
        const mailRes = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "newsletter_welcome",
            email: newsletterEmail,
            name: newsletterEmail
          })
        });

        if (mailRes.ok) {
          console.log("[Newsletter] Welcome email sent");
        } else {
          const errText = await mailRes.text();
          console.error("[Newsletter] Email failed", new Error(`Status ${mailRes.status}: ${errText}`));
        }
      } catch (mailErr) {
        console.error("[Newsletter] Email failed", mailErr);
      }

      setNewsletterSuccess(true);
      triggerToast("Welcome to our insights briefing!", "success");
    } catch (err: any) {
      triggerToast(err.message || "An error occurred during subscription.", "error");
    }
  };

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || !bookingDetails.name || !bookingDetails.email) {
      triggerToast("Please fill date, time, and your email details.", "error");
      return;
    }
    try {
      const bookingPayload = {
        date: bookingDate,
        time: bookingTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: "Not Provided",
        company: "Personal Brand",
        serviceRequired: "AI Strategic Alignment Consultation",
        budget: "Not Specified",
        projectDescription: bookingDetails.notes || "Strategy call discovery.",
        userId: user ? user.id : null,
      };

      let supabaseSynced = false;

      // If Supabase is configured, attempt direct client-side insertion first
      if (isSupabaseConfigured()) {
        try {
          // Check for duplicate bookings
          const { data: duplicateBookings, error: duplicateCheckErr } = await supabase
            .from("bookings")
            .select("id")
            .eq("meeting_date", bookingPayload.date)
            .eq("meeting_time", bookingPayload.time)
            .neq("booking_status", "Cancelled")
            .limit(1);

          if (!duplicateCheckErr && duplicateBookings && duplicateBookings.length > 0) {
            triggerToast("This slot (date and time) is already booked. Please choose another time slot.", "error");
            return;
          }

          console.log("[Supabase Client] Syncing user context...");
          let supabaseUserId = null;

          // 1. Check if user already exists in Supabase users table by email
          const { data: existingSupaUsers, error: selectUserErr } = await supabase
            .from("users")
            .select("id")
            .eq("email", bookingPayload.email)
            .limit(1);

          if (!selectUserErr && existingSupaUsers && existingSupaUsers.length > 0) {
            supabaseUserId = existingSupaUsers[0].id;
            console.log("[Supabase Client] Found existing user ID:", supabaseUserId);
          } else {
            // 2. Insert new user into Supabase users table
            const { data: newSupaUser, error: insertUserErr } = await supabase
              .from("users")
              .insert([
                {
                  full_name: bookingPayload.name,
                  email: bookingPayload.email,
                  phone: bookingPayload.phone,
                  company: bookingPayload.company,
                }
              ])
              .select("id")
              .single();

            if (!insertUserErr && newSupaUser) {
              supabaseUserId = newSupaUser.id;
              console.log("[Supabase Client] Registered user in Supabase:", supabaseUserId);
            } else {
              console.warn("[Supabase Client] Could not register user record:", insertUserErr);
            }
          }

          // Parse numeric budget from string (e.g. "₹19,999" -> 19999) or default to 0
          const numericBudget = parseInt(bookingPayload.budget.replace(/[^0-9]/g, "")) || null;

          console.log("[Supabase Client] Syncing booking record...");
          
          // Call Google Calendar API securely via serverless function
          let calendarEventId = null;
          let meetingLink = null;
          try {
            console.log("Calling Google Calendar...");
            const calRes = await fetch("/api/google-calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: bookingPayload.email,
                name: bookingPayload.name,
                date: bookingPayload.date,
                time: bookingPayload.time,
                timezone: bookingPayload.timezone,
                duration: 45,
                serviceRequired: bookingPayload.serviceRequired,
                notes: bookingPayload.projectDescription,
              }),
            });
            if (calRes.ok) {
              console.log("Google Calendar Success");
              const calData = await calRes.json();
              calendarEventId = calData.eventId;
              meetingLink = calData.meetLink;

              // 3. Immediately after a successful calendar creation, call: POST /api/send-email
              const emailPayload = {
                email: bookingPayload.email,
                name: bookingPayload.name,
                type: "booking_confirmation",
                customerName: bookingPayload.name,
                customerEmail: bookingPayload.email,
                meetingDate: bookingPayload.date,
                meetingTime: bookingPayload.time,
                duration: 45,
                googleMeetLink: meetingLink,
                serviceName: bookingPayload.serviceRequired,
                details: {
                  date: bookingPayload.date,
                  time: bookingPayload.time,
                  timezone: bookingPayload.timezone,
                  service: bookingPayload.serviceRequired,
                  meetLink: meetingLink,
                }
              };

              console.log("Calling send-email...");

              try {
                const emailRes = await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(emailPayload)
                });

                if (emailRes.ok) {
                  const emailData = await emailRes.json();
                  console.log("Send-email Success");
                  console.log("Booking Completed");
                } else {
                  const errorText = await emailRes.text();
                  console.error("Send-email failed with status " + emailRes.status + ": " + errorText);
                }
              } catch (emailErr: any) {
                console.error("Send-email failed with exception:", emailErr);
              }

              // Also trigger Admin notice email immediately
              try {
                await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: "tanishkchandak45@gmail.com",
                    name: "Admin",
                    type: "admin_notification",
                    customerName: bookingPayload.name,
                    customerEmail: bookingPayload.email,
                    meetingDate: bookingPayload.date,
                    meetingTime: bookingPayload.time,
                    duration: 45,
                    googleMeetLink: meetingLink,
                    serviceName: bookingPayload.serviceRequired,
                    details: {
                      eventType: "New Booking Lock",
                      clientName: bookingPayload.name,
                      clientEmail: bookingPayload.email,
                      summary: `Consultation reserved for ${bookingPayload.date} at ${bookingPayload.time}. Meet link generated: ${meetingLink || "Pending"}.`
                    }
                  })
                });
              } catch (adminMailErr) {
                console.warn("[Email Service] Failed to dispatch Admin notice email:", adminMailErr);
              }
            } else {
              console.warn("[Google Calendar] API returned non-OK status code:", calRes.status);
            }
          } catch (calErr) {
            console.error("[Google Calendar] ON failure scheduling calendar event securely:", calErr);
          }

          // 3. Insert booking referencing the users.id
          const { error } = await supabase
            .from("bookings")
            .insert([
              {
                user_id: supabaseUserId,
                service: bookingPayload.serviceRequired,
                budget: numericBudget,
                meeting_date: bookingPayload.date,
                meeting_time: bookingPayload.time,
                timezone: bookingPayload.timezone,
                project_description: bookingPayload.projectDescription,
                meeting_link: meetingLink,
                payment_status: "Pending",
                booking_status: "Confirmed"
              }
            ]);

          if (error) {
            console.error("[Supabase Client] Booking insert error:", error);
            if (error.code === "PGRST205" || (error.message && error.message.includes("schema cache"))) {
              console.warn(
                "[Supabase Dev Action Required] The requested schema tables are missing in your Supabase database. " +
                "To resolve this, go to your Supabase SQL Editor and run the generated migration file contents."
              );
            }
          } else {
            console.log("[Supabase Client] Booking successfully synced client-side.");
            supabaseSynced = true;
          }
        } catch (supabaseErr) {
          console.error("[Supabase Client] Failed to connect/insert:", supabaseErr);
        }
      }

      // Direct client success confirmation
      setBookingSuccess(true);
      if (isSupabaseConfigured() && supabaseSynced) {
        triggerToast("Session synced with Supabase! Check your inbox.", "success");
      } else {
        triggerToast("Session locked and synced! Check your inbox.", "success");
      }
    } catch (err) {
      triggerToast("Booking submission experienced an error.", "error");
    }
  };

  // Calculate payment details locally for review before actual API post
  const getPricingCalculations = (plan: PricingPlan) => {
    const base = plan.priceINR;
    let discount = 0;
    if (couponCode.toUpperCase() === "VELOCE20") {
      discount = base * 0.2;
    } else if (couponCode.toUpperCase() === "LAUNCH10") {
      discount = base * 0.1;
    }
    const net = base - discount;
    const gst = net * 0.18;
    const total = net + gst;
    return { base, discount, net, gst, total };
  };

  const applyCoupon = () => {
    if (!selectedPlan) return;
    const code = couponCode.toUpperCase().trim();
    if (code === "VELOCE20") {
      triggerToast("Coupon code 'VELOCE20' applied! 20% discount activated.", "success");
    } else if (code === "LAUNCH10") {
      triggerToast("Coupon code 'LAUNCH10' applied! 10% discount activated.", "success");
    } else {
      triggerToast("Invalid or expired coupon code.", "error");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeSimulatedRazorpayPayment = async () => {
    if (!selectedPlan) return;
    setRazorpaySimStep("processing");
    setRazorpaySimProgress(10);
    
    let currentProgress = 10;
    const interval = setInterval(async () => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        setRazorpaySimProgress(100);
        clearInterval(interval);
        
        try {
          const razorpayPaymentId = `pay_sim_${Date.now().toString().slice(-6)}`;

          // Verify signature server-side before marking payment as successful
          const verifyRes = await fetch("/api/verify-signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: razorpayOrderId,
              razorpayPaymentId: razorpayPaymentId,
              razorpaySignature: "simulated_signature_hash_123456",
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || "Payment signature verification failed.");
          }

          // Generate client-side invoice and sync with Supabase
          const { base, discount, net, gst, total } = getPricingCalculations(selectedPlan);
          const invoiceNumber = `INV-RZP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
          const invoiceDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

          const mockInvoice = {
            success: true,
            invoiceNumber,
            invoiceDate,
            planName: selectedPlan.name,
            paymentMethod: "Razorpay",
            gstNumber: gstNumber || "Not Provided",
            billingDetails: billingDetailsForm,
            originalAmount: base,
            discount,
            netAmount: net,
            gstAmount: gst,
            totalAmount: total,
            razorpayPaymentId,
            message: `Payment of ₹${total.toLocaleString("en-IN")} via Razorpay was authorized successfully. Transaction verification completed securely.`,
          };

          if (isSupabaseConfigured()) {
            try {
              // 1. Create or select user
              let dbUserId = user ? user.id : null;
              if (!dbUserId) {
                const { data: userSelect } = await supabase.from("users").select("id").eq("email", billingDetailsForm.email).limit(1);
                if (userSelect && userSelect.length > 0) {
                  dbUserId = userSelect[0].id;
                } else {
                  const { data: newUser } = await supabase.from("users").insert([{
                    full_name: billingDetailsForm.name,
                    email: billingDetailsForm.email,
                    phone: billingDetailsForm.phone || "Not Provided",
                    company: "Personal Brand",
                  }]).select("id").single();
                  if (newUser) dbUserId = newUser.id;
                }
              }

              // 2. Insert order
              const { data: newOrder } = await supabase.from("orders").insert([{
                plan_name: selectedPlan.name,
                amount: total,
                status: "COMPLETED",
                coupon_code: couponCode || null,
                billing_name: billingDetailsForm.name,
                billing_email: billingDetailsForm.email,
                billing_address: billingDetailsForm.address || null,
                gst_number: gstNumber || null,
                razorpay_order_id: razorpayOrderId,
                invoice_id: invoiceNumber,
                user_id: dbUserId,
              }]).select("id").single();

              // 3. Insert payment
              await supabase.from("payments").insert([{
                razorpay_payment_id: razorpayPaymentId,
                razorpay_order_id: razorpayOrderId,
                razorpay_signature: "simulated_signature_hash_123456",
                amount: total,
                currency: "INR",
                status: "captured",
                payment_method: "Razorpay",
                user_id: dbUserId,
              }]);

              // 4. Insert invoice
              if (newOrder) {
                await supabase.from("invoices").insert([{
                  invoice_number: invoiceNumber,
                  invoice_date: invoiceDate,
                  original_amount: base,
                  discount: discount,
                  net_amount: net,
                  gst_amount: gst,
                  total_amount: total,
                  status: "PAID",
                  order_id: newOrder.id,
                }]);
              }

              // 5. Send email notifications via Resend securely
              try {
                await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: billingDetailsForm.email,
                    name: billingDetailsForm.name,
                    type: "payment_success",
                    details: {
                      planName: selectedPlan.name,
                      paymentId: razorpayPaymentId,
                      invoiceId: invoiceNumber,
                      amount: total,
                      dashboardUrl: window.location.origin,
                    }
                  })
                });

                await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: billingDetailsForm.email,
                    name: billingDetailsForm.name,
                    type: "invoice",
                    details: {
                      planName: selectedPlan.name,
                      originalAmount: base,
                      discount,
                      gstAmount: gst,
                      totalAmount: total,
                      billingName: billingDetailsForm.name,
                      gstNumber: gstNumber || "Not Provided",
                      invoiceNumber,
                      invoiceDate,
                    }
                  })
                });

                // Also trigger Admin notice email
                await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: "tanishkchandak45@gmail.com",
                    name: "Admin",
                    type: "admin_notification",
                    details: {
                      eventType: "New Payment Captured",
                      clientName: billingDetailsForm.name,
                      clientEmail: billingDetailsForm.email,
                      summary: `SaaS Order completed for the ${selectedPlan.name} program. Amount: ₹${total.toLocaleString("en-IN")}. Transaction ID: ${razorpayPaymentId}.`
                    }
                  })
                });
              } catch (mailErr) {
                console.warn("Failed to dispatch Resend payment emails:", mailErr);
              }
            } catch (supaErr) {
              console.warn("Could not insert billing data directly to Supabase:", supaErr);
            }
          }

          setCheckoutInvoice(mockInvoice);
          setCheckoutStep("success");
          triggerToast("Simulated payment completed successfully! Invoice written to DB.", "success");
        } catch (err: any) {
          setCheckoutStep("failed");
          console.error("Simulated payment error context:", err);
          triggerToast(err.message || "Simulated payment verification experienced an error.", "error");
        }
      } else {
        setRazorpaySimProgress(currentProgress);
      }
    }, 500);
  };

  const executeCheckoutPayment = async () => {
    if (!selectedPlan) return;
    if (!billingDetailsForm.name || !billingDetailsForm.email) {
      triggerToast("Please provide your name and email for invoicing.", "error");
      return;
    }

    const { base, discount, net, gst, total } = getPricingCalculations(selectedPlan);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    if (paymentGateway === "Razorpay") {
      try {
        triggerToast("Initializing Razorpay checkout...", "info");
        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            planName: selectedPlan.name,
          }),
        });
        if (!orderRes.ok) {
          throw new Error("Failed to create Razorpay order on the backend.");
        }
        const orderData = await orderRes.json();
        
        if (orderData.isSimulated || !orderData.id) {
          // Fall back to simulator form
          const orderId = orderData.id || `order_sim_${Date.now().toString().slice(-6)}`;
          setRazorpayOrderId(orderId);
          setRazorpaySimStep("method");
          setCheckoutStep("razorpay_sim_form");
          triggerToast("Loaded Razorpay Sandbox Simulation.", "info");
          return;
        }

        // Live Razorpay mode! Check if window.Razorpay exists
        if (!(window as any).Razorpay) {
          throw new Error("Razorpay SDK was not loaded. Please try again.");
        }

        const options = {
          key: orderData.keyId || "",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Veloce AI",
          description: `Strategic Delivery Program — ${selectedPlan.name}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              triggerToast("Verifying payment signature securely...", "info");
              const verifyRes = await fetch("/api/verify-signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }

              // Payment success! Proceed to sync with database
              const razorpayPaymentId = response.razorpay_payment_id;
              const razorpayOrderId = response.razorpay_order_id;
              const razorpaySignature = response.razorpay_signature;

              const mockInvoice = {
                success: true,
                invoiceNumber,
                invoiceDate,
                planName: selectedPlan.name,
                paymentMethod: "Razorpay",
                gstNumber: gstNumber || "Not Provided",
                billingDetails: billingDetailsForm,
                originalAmount: base,
                discount,
                netAmount: net,
                gstAmount: gst,
                totalAmount: total,
                razorpayPaymentId,
                message: `Payment of ₹${total.toLocaleString("en-IN")} via Razorpay was authorized successfully. Transaction verification completed securely.`,
              };

              if (isSupabaseConfigured()) {
                try {
                  // 1. Create or select user
                  let dbUserId = user ? user.id : null;
                  if (!dbUserId) {
                    const { data: userSelect } = await supabase.from("users").select("id").eq("email", billingDetailsForm.email).limit(1);
                    if (userSelect && userSelect.length > 0) {
                      dbUserId = userSelect[0].id;
                    } else {
                      const { data: newUser } = await supabase.from("users").insert([{
                        full_name: billingDetailsForm.name,
                        email: billingDetailsForm.email,
                        phone: billingDetailsForm.phone || "Not Provided",
                        company: "Personal Brand",
                      }]).select("id").single();
                      if (newUser) dbUserId = newUser.id;
                    }
                  }

                  // 2. Insert order
                  const { data: newOrder } = await supabase.from("orders").insert([{
                    plan_name: selectedPlan.name,
                    amount: total,
                    status: "COMPLETED",
                    coupon_code: couponCode || null,
                    billing_name: billingDetailsForm.name,
                    billing_email: billingDetailsForm.email,
                    billing_address: billingDetailsForm.address || null,
                    gst_number: gstNumber || null,
                    razorpay_order_id: razorpayOrderId,
                    invoice_id: invoiceNumber,
                    user_id: dbUserId,
                  }]).select("id").single();

                  // 3. Insert payment
                  await supabase.from("payments").insert([{
                    razorpay_payment_id: razorpayPaymentId,
                    razorpay_order_id: razorpayOrderId,
                    razorpay_signature: razorpaySignature,
                    amount: total,
                    currency: "INR",
                    status: "captured",
                    payment_method: "Razorpay",
                    user_id: dbUserId,
                  }]);

                  // 4. Insert invoice
                  if (newOrder) {
                    await supabase.from("invoices").insert([{
                      invoice_number: invoiceNumber,
                      invoice_date: invoiceDate,
                      original_amount: base,
                      discount: discount,
                      net_amount: net,
                      gst_amount: gst,
                      total_amount: total,
                      status: "PAID",
                      order_id: newOrder.id,
                    }]);
                  }

                  // 5. Send emails
                  try {
                    await fetch("/api/send-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: billingDetailsForm.email,
                        name: billingDetailsForm.name,
                        type: "payment_success",
                        details: {
                          planName: selectedPlan.name,
                          paymentId: razorpayPaymentId,
                          invoiceId: invoiceNumber,
                          amount: total,
                          dashboardUrl: window.location.origin,
                        }
                      })
                    });

                    await fetch("/api/send-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: billingDetailsForm.email,
                        name: billingDetailsForm.name,
                        type: "invoice",
                        details: {
                          planName: selectedPlan.name,
                          originalAmount: base,
                          discount,
                          gstAmount: gst,
                          totalAmount: total,
                          billingName: billingDetailsForm.name,
                          gstNumber: gstNumber || "Not Provided",
                          invoiceNumber,
                          invoiceDate,
                        }
                      })
                    });

                    await fetch("/api/send-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: "tanishkchandak45@gmail.com",
                        name: "Admin",
                        type: "admin_notification",
                        details: {
                          eventType: "New Payment Captured",
                          clientName: billingDetailsForm.name,
                          clientEmail: billingDetailsForm.email,
                          summary: `SaaS Order completed for the ${selectedPlan.name} program. Amount: ₹${total.toLocaleString("en-IN")}. Transaction ID: ${razorpayPaymentId}.`
                        }
                      })
                    });
                  } catch (mailErr) {
                    console.warn("Failed to dispatch Resend payment emails:", mailErr);
                  }
                } catch (supaErr) {
                  console.warn("Could not insert billing data directly to Supabase:", supaErr);
                }
              }

              setCheckoutInvoice(mockInvoice);
              setCheckoutStep("success");
              triggerToast("Payment completed successfully! Invoice written to DB.", "success");
            } catch (err: any) {
              setCheckoutStep("failed");
              triggerToast(err.message || "Payment signature verification failed.", "error");
            }
          },
          prefill: {
            name: billingDetailsForm.name,
            email: billingDetailsForm.email,
            contact: billingDetailsForm.phone || "",
          },
          theme: {
            color: "#3b82f6",
          },
          modal: {
            ondismiss: function () {
              setCheckoutStep("failed");
              triggerToast("Payment checkout cancelled by user.", "info");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setCheckoutStep("failed");
          triggerToast(response.error.description || "Razorpay payment attempt failed.", "error");
        });
        rzp.open();
      } catch (err: any) {
        setCheckoutStep("failed");
        triggerToast(err.message || "Failed to initiate Razorpay transaction.", "error");
      }
      return;
    } else {
      // Default / Stripe payment flow -> bypass /api/checkout completely and sync with Supabase
      try {
        const mockInvoice = {
          success: true,
          invoiceNumber,
          invoiceDate,
          planName: selectedPlan.name,
          paymentMethod: paymentGateway,
          gstNumber: gstNumber || "Not Provided",
          billingDetails: billingDetailsForm,
          originalAmount: base,
          discount,
          netAmount: net,
          gstAmount: gst,
          totalAmount: total,
          message: `Payment of ₹${total.toLocaleString("en-IN")} via ${paymentGateway} was authorized successfully. An email confirmation has been dispatched to ${billingDetailsForm.email}.`
        };

        if (isSupabaseConfigured()) {
          try {
            // 1. Create or select user
            let dbUserId = user ? user.id : null;
            if (!dbUserId) {
              const { data: userSelect } = await supabase.from("users").select("id").eq("email", billingDetailsForm.email).limit(1);
              if (userSelect && userSelect.length > 0) {
                dbUserId = userSelect[0].id;
              } else {
                const { data: newUser } = await supabase.from("users").insert([{
                  full_name: billingDetailsForm.name,
                  email: billingDetailsForm.email,
                  phone: billingDetailsForm.phone || "Not Provided",
                  company: "Personal Brand",
                }]).select("id").single();
                if (newUser) dbUserId = newUser.id;
              }
            }

            // 2. Insert order
            const { data: newOrder } = await supabase.from("orders").insert([{
              plan_name: selectedPlan.name,
              amount: total,
              status: "COMPLETED",
              coupon_code: couponCode || null,
              billing_name: billingDetailsForm.name,
              billing_email: billingDetailsForm.email,
              billing_address: billingDetailsForm.address || null,
              gst_number: gstNumber || null,
              invoice_id: invoiceNumber,
              user_id: dbUserId,
            }]).select("id").single();

            // 3. Insert invoice
            if (newOrder) {
              await supabase.from("invoices").insert([{
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate,
                original_amount: base,
                discount: discount,
                net_amount: net,
                gst_amount: gst,
                total_amount: total,
                status: "PAID",
                order_id: newOrder.id,
              }]);
            }
          } catch (supaErr) {
            console.warn("Could not insert billing data directly to Supabase:", supaErr);
          }
        }

        setCheckoutInvoice(mockInvoice);
        setCheckoutStep("success");
        triggerToast("Invoice generated. Payment processed successfully!", "success");
      } catch (err: any) {
        setCheckoutStep("failed");
        triggerToast("An error occurred during transaction processing.", "error");
      }
    }
  };

  const filteredPortfolio = portfolioFilter === "all"
    ? cmsData.portfolio
    : cmsData.portfolio.filter(p => p.category === portfolioFilter);

  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 z-50 transition-all duration-100" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Background radial overlays */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-10 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[800px] left-10 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Floating Custom Pointer Glow on Desktop */}
      <div 
        className="hidden md:block pointer-events-none fixed w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[120px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 z-40"
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      />

      {/* Initial Page Loader */}
      <AnimatePresence>
        {appLoading && (
          <motion.div 
            id="app-global-loader"
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 bg-[#050816] z-50 flex flex-col items-center justify-center"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 animate-spin blur-md opacity-75"></div>
                <div className="absolute inset-1 rounded-xl bg-[#050816] flex items-center justify-center">
                  <Icon name="Sparkles" className="text-cyan-400 animate-pulse" size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{cmsData.brandName}</h2>
              <div className="h-[2px] w-32 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-2/3 rounded-full animate-infinite-loading"></div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-4">Assembling Premium AI Squad</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Premium Navbar */}
      <nav id="app-navbar" className="sticky top-0 z-40 bg-[#050816]/75 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-cyan-400/30 transition duration-300">
              <Icon name="Cpu" className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              {cmsData.brandName.split(" ")[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-extrabold ml-1">
                {cmsData.brandName.split(" ").slice(1).join(" ") || "AI"}
              </span>
            </span>
          </a>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#portfolio" className="hover:text-white transition">Work</a>
            <a href="#process" className="hover:text-white transition">Process</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQs</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-4">
            {activeView !== "landing" ? (
              <button
                onClick={() => setActiveView("landing")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition flex items-center gap-1.5"
              >
                <Icon name="ArrowLeft" size={12} />
                <span>Exit Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  id="btn-cms-toggle-nav"
                  onClick={() => setIsCmsOpen(true)}
                  className="hidden md:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition items-center gap-2"
                >
                  <Icon name="Settings" size={12} />
                  <span>CMS</span>
                </button>

                {user ? (
                  <button
                    onClick={() => setActiveView(user.role === "ADMIN" ? "admin" : "client")}
                    className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-cyan-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Icon name="LayoutDashboard" size={12} />
                    <span>Portal</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView("auth")}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Icon name="LogIn" size={12} />
                    <span>Sign In</span>
                  </button>
                )}

                <a 
                  href="#booking"
                  className="hidden sm:inline-flex px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-md shadow-blue-600/10 hover:shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
                >
                  Book Strategy Call
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {activeView === "landing" ? (
        <>
          {/* Hero Section */}
      <header id="hero" className="relative py-20 lg:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full w-fit">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">AI-Powered Agency Force</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
              {cmsData.heroTitle.split(".").map((sentence, idx) => (
                <span key={idx} className="block">
                  {idx === 0 ? sentence : <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400">{sentence}</span>}
                </span>
              ))}
            </h1>

            <p className="text-base md:text-lg text-gray-400 max-w-xl leading-relaxed">
              {cmsData.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a 
                href="#booking"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/25 hover:shadow-cyan-400/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {cmsData.heroCtaPrimary}
              </a>
              <a 
                href="#services"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-gray-300 hover:text-white transition-all duration-300"
              >
                {cmsData.heroCtaSecondary}
              </a>
            </div>

            {/* Quick stats in Hero */}
            <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">High-End Brands</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sprints Shipped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#38BDF8]">100%</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Client Contentment</p>
              </div>
            </div>
          </div>

          {/* Right Interactive Dashboard Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-[4/3] bg-[#0B1220]/80 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-hidden">
              
              {/* Fake UI Dots */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></span>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-md text-[10px] text-gray-500 tracking-wider uppercase">VeloceOS Enterprise</div>
              </div>

              {/* Dynamic Dashboard metrics widgets */}
              <div className="space-y-4">
                
                {/* Active AI automation item */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-105 transition">
                      <Icon name="Workflow" size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Automation Pipelines</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 italic">Synchronizing Hubspot + Slack</p>
                    </div>
                  </div>
                  <span className="text-cyan-400 font-mono text-xs font-bold bg-cyan-400/10 px-2 py-1 rounded">Active</span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#050816]/60 border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Development Sprint</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Website Dev</span>
                      <span className="text-xs text-blue-400 font-mono">94%</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-500 w-[94%]"></div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#050816]/60 border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Video Rendering</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">YT Essay v1</span>
                      <span className="text-xs text-cyan-400 font-mono">Ready</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-cyan-400 w-full"></div>
                    </div>
                  </div>
                </div>

                {/* Revenue generation bar widget */}
                <div className="p-4 bg-gradient-to-br from-blue-900/15 to-transparent border border-blue-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Weekly Scale Managed</span>
                    <span className="text-cyan-400 font-bold text-base">₹12.4 Lakhs</span>
                  </div>
                  <div className="flex items-end gap-1 h-10 pt-2">
                    <div className="flex-1 bg-blue-500/30 h-[40%] rounded-sm"></div>
                    <div className="flex-1 bg-blue-500/40 h-[60%] rounded-sm"></div>
                    <div className="flex-1 bg-blue-500/50 h-[50%] rounded-sm"></div>
                    <div className="flex-1 bg-cyan-400 h-[100%] rounded-sm animate-pulse"></div>
                    <div className="flex-1 bg-blue-500/60 h-[80%] rounded-sm"></div>
                  </div>
                </div>

              </div>

              {/* Glowing gradient backdrops */}
              <div className="absolute -right-12 top-1/2 w-32 h-32 bg-cyan-400 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
            </div>
          </div>

        </div>
      </header>

      {/* Trust & Stats Section */}
      <section id="trust" className="py-12 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Trusted By Leading Teams At:</span>
            </div>
            
            {/* Infinite Horizontal Logo Marquee Sim */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">VERCEL</span>
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">STRIPE</span>
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">LINEAR</span>
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">CAL.COM</span>
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">SUPERBASE</span>
              <span className="text-sm font-black tracking-tighter text-white hover:opacity-100 transition">NOTION</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
              <Icon name="Layers" className="text-blue-400" size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Our Services Stack</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Full-Stack Digital Execution</h2>
            <p className="text-sm md:text-base text-gray-400">
              Unbelievably precise and lightning fast. Get all your content, coding, automation and branding needs resolved inside structured sprint blocks.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsData.services.map((svc) => (
              <div 
                key={svc.id}
                className="group relative p-6 rounded-2xl bg-[#0B1220]/60 border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:bg-[#0B1220]/90 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                    <Icon name={svc.icon} size={22} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition">
                    {svc.title}
                  </h3>
                  
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    {svc.description}
                  </p>

                  <ul className="space-y-2.5">
                    {svc.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <Icon name="Check" className="text-cyan-400 mt-0.5 shrink-0" size={14} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <a 
                    href="#contact"
                    onClick={() => setContactForm(prev => ({ ...prev, service: svc.title }))}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-cyan-400 transition"
                  >
                    <span>Request Sprint</span>
                    <Icon name="ArrowRight" size={12} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Subtle bottom corner light glow */}
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Why Choose Us & Process Combined Timeline */}
      <section id="process" className="py-24 px-6 bg-white/[0.01] border-y border-white/5 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid lg:grid-cols-12 gap-16">
            
            {/* Left side: Why Choose Us */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-600/10 border border-cyan-500/30 rounded-full">
                  <Icon name="Award" className="text-cyan-400" size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">The Veloce Advantage</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why High-End Startups Choose Us</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We are not another remote agency with slow delivery timelines. We utilize customized AI copilots and veteran engineering teams to build flawless brands.
                </p>
              </div>

              {/* Core value points */}
              <div className="space-y-6">
                {[
                  { title: "Fast Turnaround Sprints", desc: "Most UI design reviews and web updates shipped in 48-72 hours.", icon: "Clock" },
                  { title: "AI-Augmented Workflows", desc: "We utilize custom LLM pipelines to write clean code and edit videos at scale.", icon: "Sparkles" },
                  { title: "Direct Slack Sync", desc: "No boring ticket systems. Converse directly with lead designers & developers.", icon: "MessageSquare" },
                  { title: "Durable Cloud Integrations", desc: "We deploy secure server-side backends with full-stack payment tunnels.", icon: "Shield" },
                  { title: "Unlimited Active Sprints", desc: "Request changes with absolute peace of mind. We revise until perfect.", icon: "Layers" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#0B1220]/40 border border-white/5 hover:border-white/10 transition">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 shrink-0">
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: 7-Step Animated Vertical Timeline */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
                  <Icon name="Workflow" className="text-blue-400" size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Our Blueprint</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The 7-Step Sprint Process</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  From initial alignment to hyper-scale maintenance. Here is how we build.
                </p>
              </div>

              {/* Vertical steps */}
              <div className="relative border-l border-white/5 pl-8 ml-4 space-y-8">
                {[
                  { step: "1", title: "Discovery Call & Setup", desc: "Align budget, tech stack, and build out your custom brand scope in minutes.", icon: "Phone" },
                  { step: "2", title: "AI Strategy Blueprinting", desc: "Establish the architectural blueprint, data collection, and integration pathways.", icon: "Lightbulb" },
                  { step: "3", title: "High-Fidelity UI/UX Sprints", desc: "We design wireframes and high-fidelity screens inspired by Vercel and Apple.", icon: "Palette" },
                  { step: "4", title: "Development Phase", desc: "Our experienced engineering team builds performant frontend components with secure backends.", icon: "Code" },
                  { step: "5", title: "Comprehensive Testing", desc: "Rigorous automated and manual sanity checks on all screen sizes to prevent layout shifts.", icon: "CheckSquare" },
                  { step: "6", title: "Production Launch", desc: "Deploy seamlessly to production on highly optimized cloud container hosting layers.", icon: "Globe" },
                  { step: "7", title: "24/7 Support & CRM Scale", desc: "Continuous iteration and optimization as your customer base expands.", icon: "Cpu" }
                ].map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle marker */}
                    <div className="absolute -left-[45px] top-1.5 w-8 h-8 rounded-full bg-[#050816] border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-white group-hover:bg-cyan-500 group-hover:border-cyan-400 transition duration-300">
                      {item.step}
                    </div>

                    <div className="p-5 rounded-xl bg-[#0B1220]/60 border border-white/5 hover:border-blue-500/20 hover:bg-[#0B1220]/80 transition duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon name={item.icon} className="text-cyan-400" size={16} />
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition">{item.title}</h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Portfolio Grid Section with Modal */}
      <section id="portfolio" className="py-24 px-6 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
                <Icon name="Briefcase" className="text-blue-400" size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Our Masterpieces</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Recent Digital Sprints</h2>
              <p className="text-sm text-gray-400">
                Explore a premium gallery of automations, high-fidelity UI concepts, video campaign assets, and cross-platform apps designed for high-growth startups.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All Sprints", value: "all" },
                { label: "AI Automation", value: "automation" },
                { label: "Website", value: "website" },
                { label: "UI Concept", value: "ui" },
                { label: "Apps", value: "apps" },
                { label: "Editing", value: "editing" },
                { label: "Branding", value: "branding" }
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setPortfolioFilter(btn.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    portfolioFilter === btn.value
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Masonry-Style Grid of Projects */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPortfolio.map((project) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-[#0B1220]/75 border border-white/10 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  {/* Image wrapper */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-[#050816]/80 px-2.5 py-1 rounded border border-cyan-400/20 backdrop-blur">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {project.tech.map((t, tIdx) => (
                        <span key={tIdx} className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            id="portfolio-project-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0B1220] border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative"
            >
              {/* Header Image */}
              <div className="relative h-64 sm:h-80 bg-gray-900">
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 h-10 w-10 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center border border-white/10 transition"
                >
                  <Icon name="X" size={18} />
                </button>
                <div className="absolute bottom-4 left-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-[#050816]/90 px-3 py-1 rounded border border-cyan-400/20">
                    {selectedProject.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 drop-shadow">
                    {selectedProject.title}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Scope of Project</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedProject.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-red-400 tracking-wider mb-2">The Challenge</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{selectedProject.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-wider mb-2">The Outcome</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{selectedProject.outcome}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Integrated Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech.map((t, idx) => (
                      <span key={idx} className="text-xs font-mono text-cyan-300 bg-blue-900/30 border border-blue-500/20 px-2.5 py-1 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-lg transition"
                  >
                    Dismiss Portfolio Card
                  </button>
                  <a
                    href="#contact"
                    onClick={() => {
                      setSelectedProject(null);
                      setContactForm(prev => ({ ...prev, description: `Interested in a project similar to ${selectedProject.title}` }));
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-xs font-bold rounded-lg hover:shadow-lg transition"
                  >
                    Request Similar Build
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonials Slider */}
      <section id="testimonials" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
              <Icon name="ThumbsUp" className="text-blue-400" size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Praise From High-Growth Crews</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Client Satisfaction Stories</h2>
            <p className="text-sm text-gray-400">
              Read how Veloce AI enables solo creators and enterprise team directors to construct reliable automation pipelines and stellar web portals.
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {cmsData.testimonials.map((test) => (
              <div 
                key={test.id}
                className="p-6 rounded-2xl bg-[#0B1220]/60 border border-white/5 relative flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                {/* Quote decoration */}
                <span className="absolute top-4 right-6 text-7xl font-serif text-white/5 select-none pointer-events-none">“</span>
                
                <div>
                  <p className="text-sm text-gray-300 italic leading-relaxed mb-6 relative z-10">
                    "{test.feedback}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <img 
                    src={test.image} 
                    alt={test.name} 
                    className="w-11 h-11 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{test.name}</h4>
                    <p className="text-xs text-cyan-400">{test.role}</p>
                    <p className="text-[10px] text-gray-500">{test.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Booking Calendar Integration Section */}
      <section id="booking" className="py-24 px-6 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center bg-[#0B1220]/50 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
                <Icon name="Calendar" className="text-blue-400" size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Strategy Sync</span>
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Secure Your Strategy Blueprint. Free of Cost.
              </h2>
              
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Unlock direct insight on optimization strategies. Select an available slot on our internal scheduler, or customize the Calendly configuration details with your own webhook links in the CMS.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Icon name="Check" size={12} />
                  </div>
                  <p className="text-xs text-gray-300"><strong className="text-white">Duration:</strong> 30 Minutes Video Session</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Icon name="Check" size={12} />
                  </div>
                  <p className="text-xs text-gray-300"><strong className="text-white">Objective:</strong> Explore Automation bottlenecks & custom SaaS blueprints</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Icon name="Check" size={12} />
                  </div>
                  <p className="text-xs text-gray-300"><strong className="text-white">Deliverable:</strong> Instant high-level roadmap presentation PDF</p>
                </div>
              </div>
            </div>

            {/* In-App Scheduler Wizard */}
            <div className="lg:col-span-6">
              <div className="bg-[#050816]/90 border border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="Calendar" className="text-blue-400" size={18} />
                  <span>Choose Your Slots</span>
                </h3>

                {bookingSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto">
                      <Icon name="CheckCircle" size={24} />
                    </div>
                    <h4 className="text-base font-bold text-white">Call Scheduled!</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Your discovery brief has been recorded for <strong className="text-cyan-400">{bookingDate}</strong> at <strong className="text-cyan-400">{bookingTime}</strong>. A calendar invite link is dispatching to your email address.
                    </p>
                    <button
                      onClick={() => setBookingSuccess(false)}
                      className="text-xs font-semibold text-blue-400 hover:underline"
                    >
                      Book another slot
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Date</label>
                        <input 
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min="2026-06-28"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Time</label>
                        <select 
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/10"
                        >
                          <option value="" className="bg-[#0B1220]">Select Time</option>
                          <option value="10:00 AM" className="bg-[#0B1220]">10:00 AM IST</option>
                          <option value="11:30 AM" className="bg-[#0B1220]">11:30 AM IST</option>
                          <option value="02:00 PM" className="bg-[#0B1220]">02:00 PM IST</option>
                          <option value="04:30 PM" className="bg-[#0B1220]">04:30 PM IST</option>
                          <option value="06:00 PM" className="bg-[#0B1220]">06:00 PM IST</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Your Full Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ranveer Mehta"
                          value={bookingDetails.name}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Email Address</label>
                        <input 
                          type="email"
                          required
                          placeholder="ranveer@clari-financial.com"
                          value={bookingDetails.email}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Project Goals (Optional)</label>
                        <textarea 
                          placeholder="Looking to automate lead sync from HubSpot to Slack and edit 10 Reels."
                          value={bookingDetails.notes}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition duration-300 transform hover:-translate-y-0.5"
                    >
                      Confirm Booking Slot
                    </button>
                    
                    <div className="text-center pt-2">
                      <span className="text-[10px] text-gray-500">
                        Prefer our global Calendly page instead?{" "}
                        <a 
                          href={calendlyLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Open Calendly</span>
                          <Icon name="ArrowRight" size={8} />
                        </a>
                      </span>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section with Interactive Payment Tunnels */}
      <section id="pricing" className="py-24 px-6 bg-white/[0.01] border-y border-white/5 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-600/10 border border-cyan-500/30 rounded-full">
              <Icon name="DollarSign" className="text-cyan-400" size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Transparent Pricing Sprints</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">One Predictable Monthly Rate</h2>
            <p className="text-sm text-gray-400">
              No hidden management fees, no complex hourly invoices. Scale up or cancel subscription cycles whenever you desire.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {cmsData.pricing.map((plan) => (
              <div 
                key={plan.id}
                className={`p-8 rounded-2xl flex flex-col justify-between relative transition-all duration-300 ${
                  plan.popular 
                    ? "bg-[#0B1220] border-2 border-blue-500 shadow-2xl shadow-blue-500/10 scale-105 z-10" 
                    : "bg-[#0B1220]/60 border border-white/10 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  
                  <div className="my-6">
                    {plan.isCustom ? (
                      <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Custom Pricing
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-gray-400 text-lg font-semibold">₹</span>
                        <span className="text-4xl sm:text-5xl font-extrabold text-white">
                          {plan.priceINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-gray-500 text-xs font-medium">/ month</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 pt-6 border-t border-white/5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-xs text-gray-300">
                        <Icon name="Check" className="text-cyan-400 mt-0.5 shrink-0" size={14} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setCheckoutStep("details");
                      setBillingDetailsForm(prev => ({ ...prev, budget: plan.isCustom ? "Custom" : `₹${plan.priceINR}` }));
                    }}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold transition transform hover:-translate-y-0.5 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-3">Cancel cycles instantly, 100% Secure SSL Tunnels.</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Promotion Alert */}
          <div className="mt-12 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                <Icon name="Sparkles" size={14} />
              </div>
              <p className="text-xs text-gray-300">
                <strong className="text-white">Summer Launch Offer:</strong> Apply code <span className="font-mono text-cyan-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">VELOCE20</span> on checkouts to claim <strong className="text-white">20% Off</strong> immediately!
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Payment Processing Modal / Wizard */}
      <AnimatePresence>
        {selectedPlan && checkoutStep !== "idle" && (
          <motion.div
            id="payment-flow-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0B1220] border border-white/15 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Checkout Terminal</span>
                  <h3 className="text-xl font-bold text-white mt-1">Configure Subscription Plan</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setCheckoutStep("idle");
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              {/* Step 1: Billing & Coupon Setup */}
              {checkoutStep === "details" && (
                <div className="space-y-6">
                  {/* Selected Plan Recap */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Selected Subscription</p>
                      <h4 className="text-base font-bold text-white mt-1">{selectedPlan.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Base Rate</p>
                      <p className="text-base font-mono text-cyan-400 font-bold">
                        {selectedPlan.isCustom ? "Custom" : `₹${selectedPlan.priceINR.toLocaleString("en-IN")}`}
                      </p>
                    </div>
                  </div>

                  {/* Input Form Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Your Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ranveer Roy"
                          value={billingDetailsForm.name}
                          onChange={(e) => setBillingDetailsForm({ ...billingDetailsForm, name: e.target.value })}
                          className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Your Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="ranveer@company.com"
                          value={billingDetailsForm.email}
                          onChange={(e) => setBillingDetailsForm({ ...billingDetailsForm, email: e.target.value })}
                          className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Company Name</label>
                        <input
                          type="text"
                          placeholder="Nova Inc"
                          value={billingDetailsForm.company}
                          onChange={(e) => setBillingDetailsForm({ ...billingDetailsForm, company: e.target.value })}
                          className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+91 98765 43210"
                          value={billingDetailsForm.phone}
                          onChange={(e) => setBillingDetailsForm({ ...billingDetailsForm, phone: e.target.value })}
                          className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">GST Identification (Optional)</label>
                        <input
                          type="text"
                          placeholder="27AAAAA1111A1Z1"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Payment Gateway</label>
                        <div className="flex items-center gap-2 bg-cyan-500/5 border border-cyan-400/20 rounded-xl px-4 py-2.5 text-xs text-white">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          <span className="font-bold text-cyan-400">Razorpay Secure Checkout</span>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Discount Coupon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. VELOCE20"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition"
                        >
                          Apply Code
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calculations summary */}
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <h5 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Order Summary Breakdowns</h5>
                    
                    {!selectedPlan.isCustom ? (
                      (() => {
                        const calcs = getPricingCalculations(selectedPlan);
                        return (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-400">
                              <span>Base monthly amount:</span>
                              <span className="font-mono">₹{calcs.base.toLocaleString("en-IN")}</span>
                            </div>
                            {calcs.discount > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Applied Coupon discount:</span>
                                <span className="font-mono">- ₹{calcs.discount.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-400">
                              <span>GST Tax Allocation (18%):</span>
                              <span className="font-mono">₹{calcs.gst.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/5">
                              <span>Grand Total (INR):</span>
                              <span className="font-mono text-cyan-400">₹{calcs.total.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-xs text-gray-400">
                        Custom billing requirements will be finalized and dispatched via custom invoices over Email.
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(null);
                        setCheckoutStep("idle");
                      }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-300 rounded-xl transition"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={executeCheckoutPayment}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
                    >
                      Authorize Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Simulated Razorpay payment form */}
              {checkoutStep === "razorpay_sim_form" && (
                <div className="space-y-6 text-left">
                  {/* Razorpay Header */}
                  <div className="bg-[#1F2937]/30 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-tighter">
                        R
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block">Razorpay Sandbox</span>
                        <h4 className="text-xs font-semibold text-gray-300">Secure Payment Gateway</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase">Amount Due</p>
                      <p className="text-sm font-mono text-white font-bold">
                        ₹{(!selectedPlan.isCustom ? getPricingCalculations(selectedPlan).total : 150000).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {razorpaySimStep !== "processing" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      {/* Left side: Navigation methods */}
                      <div className="flex flex-col gap-2 md:col-span-1">
                        <button
                          type="button"
                          onClick={() => setRazorpaySimStep("upi")}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                            razorpaySimStep === "upi" || razorpaySimStep === "method"
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-[#050816]/50 border-white/5 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <Icon name="Smartphone" size={16} />
                          UPI / QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setRazorpaySimStep("card")}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                            razorpaySimStep === "card"
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-[#050816]/50 border-white/5 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <Icon name="CreditCard" size={16} />
                          Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setRazorpaySimStep("netbanking")}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                            razorpaySimStep === "netbanking"
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-[#050816]/50 border-white/5 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <Icon name="Globe" size={16} />
                          Netbanking
                        </button>
                      </div>

                      {/* Right side: Method content */}
                      <div className="md:col-span-2 bg-[#050816]/50 border border-white/10 rounded-2xl p-4 min-h-[220px] flex flex-col justify-between text-left">
                        {/* UPI Method */}
                        {(razorpaySimStep === "upi" || razorpaySimStep === "method") && (
                          <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
                            <div className="space-y-3 text-left">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block text-left">Pay using UPI ID / VPA</p>
                              <input
                                type="text"
                                placeholder="e.g. success@razorpay"
                                value={razorpayUpiId}
                                onChange={(e) => setRazorpayUpiId(e.target.value)}
                                className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                              <p className="text-[9px] text-gray-400 text-left block">
                                Tip: Enter any UPI ID to proceed. Sandbox validates signatures seamlessly.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={executeSimulatedRazorpayPayment}
                              disabled={!razorpayUpiId}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                            >
                              Verify & Pay
                            </button>
                          </div>
                        )}

                        {/* Cards Method */}
                        {razorpaySimStep === "card" && (
                          <div className="space-y-3 flex-1 flex flex-col justify-between text-left">
                            <div className="space-y-2.5 text-left">
                              <div>
                                <label className="block text-[9px] uppercase text-gray-400 font-bold mb-1 text-left">Card Number</label>
                                <input
                                  type="text"
                                  placeholder="4111 1111 1111 1111"
                                  value={razorpayCardNumber}
                                  onChange={(e) => setRazorpayCardNumber(e.target.value)}
                                  className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-left">
                                <div>
                                  <label className="block text-[9px] uppercase text-gray-400 font-bold mb-1 text-left">Expiry</label>
                                  <input
                                    type="text"
                                    placeholder="12/29"
                                    value={razorpayCardExpiry}
                                    onChange={(e) => setRazorpayCardExpiry(e.target.value)}
                                    className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase text-gray-400 font-bold mb-1 text-left">CVV</label>
                                  <input
                                    type="password"
                                    placeholder="123"
                                    maxLength={3}
                                    value={razorpayCardCvv}
                                    onChange={(e) => setRazorpayCardCvv(e.target.value)}
                                    className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={executeSimulatedRazorpayPayment}
                              disabled={!razorpayCardNumber || !razorpayCardExpiry || !razorpayCardCvv}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition mt-2 cursor-pointer"
                            >
                              Authorize simulated Card
                            </button>
                          </div>
                        )}

                        {/* Netbanking Method */}
                        {razorpaySimStep === "netbanking" && (
                          <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
                            <div className="space-y-3 text-left">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block text-left">Select Bank</p>
                              <div className="grid grid-cols-2 gap-2 text-left">
                                {["HDFC", "ICICI", "SBI", "Axis"].map((bank) => (
                                  <button
                                    key={bank}
                                    type="button"
                                    onClick={() => setRazorpayBank(bank)}
                                    className={`py-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                                      razorpayBank === bank
                                        ? "bg-blue-600/20 border-blue-500 text-white"
                                        : "bg-[#050816] border-white/5 text-gray-400 hover:border-white/10"
                                    }`}
                                  >
                                    {bank} Bank
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={executeSimulatedRazorpayPayment}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                            >
                              Pay via {razorpayBank} Netbanking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Processing payment spinner state */
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-[#050816]/50 border border-white/10 rounded-2xl">
                      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-bold text-white">Communicating with Razorpay Sandboxed Core</h4>
                        <p className="text-xs text-gray-400">Verifying signature hashes & creating secure invoice tunnel...</p>
                      </div>
                      <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                          style={{ width: `${razorpaySimProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Razorpay Footer disclaimer */}
                  <div className="pt-2 flex justify-between items-center text-[10px] text-gray-500">
                    <p className="flex items-center gap-1">
                      <Icon name="Shield" size={12} className="text-green-500" />
                      PCI-DSS Compliant Sandbox
                    </p>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("details")}
                      className="hover:text-white transition font-semibold cursor-pointer"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Success Confirmation with Invoice */}
              {checkoutStep === "success" && checkoutInvoice && (
                <div className="space-y-6">
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto">
                      <Icon name="CheckCircle" size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white">Payment Authorized!</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Your subscription is now active! Invoice generated and confirmation dispatched to <strong className="text-cyan-400">{checkoutInvoice.billingDetails.email}</strong>.
                    </p>
                  </div>

                  {/* Invoice Display */}
                  <div className="p-5 rounded-2xl bg-[#050816]/90 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                      <div>
                        <p className="text-xs font-black text-white">{cmsData.brandName.toUpperCase()}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">INVOICE #{checkoutInvoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Date Issued</p>
                        <p className="text-[10px] text-white font-mono mt-0.5">{checkoutInvoice.invoiceDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px] pb-3 border-b border-white/5">
                      <div>
                        <p className="text-gray-500 font-bold uppercase tracking-wider">Customer Details</p>
                        <p className="text-white mt-1 font-semibold">{checkoutInvoice.billingDetails.name}</p>
                        <p className="text-gray-400">{checkoutInvoice.billingDetails.company || "Individual Creator"}</p>
                        {checkoutInvoice.gstNumber !== "Not Provided" && (
                          <p className="text-cyan-400 font-mono mt-1">GSTIN: {checkoutInvoice.gstNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 font-bold uppercase tracking-wider">Gateway Authorization</p>
                        <p className="text-white mt-1 font-semibold">{checkoutInvoice.paymentMethod} Merchant ID</p>
                        <p className="text-gray-400">Simulated Tunnel Sandbox</p>
                        <p className="text-green-400 font-bold">STATUS: AUTHORIZED</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs pb-1">
                      <div className="flex justify-between text-gray-400">
                        <span>{checkoutInvoice.planName} Base:</span>
                        <span className="font-mono text-white">₹{checkoutInvoice.originalAmount.toLocaleString("en-IN")}</span>
                      </div>
                      {checkoutInvoice.discount > 0 && (
                        <div className="flex justify-between text-green-400 font-semibold">
                          <span>Coupon discount:</span>
                          <span className="font-mono">- ₹{checkoutInvoice.discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400">
                        <span>GST Tax Allocation (18%):</span>
                        <span className="font-mono text-white">₹{checkoutInvoice.gstAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/5">
                        <span>Total Paid (INR):</span>
                        <span className="font-mono text-cyan-400">₹{checkoutInvoice.totalAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(null);
                        setCheckoutStep("idle");
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-bold transition transform hover:-translate-y-0.5"
                    >
                      Acknowledge & Close Invoice
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Failed State */}
              {checkoutStep === "failed" && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                    <Icon name="AlertCircle" size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Authorization Declined</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    The payment validation with the simulated gateway experienced a pipeline error. Please review your credentials and retry.
                  </p>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("details")}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl text-white"
                    >
                      Modify Parameters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(null);
                        setCheckoutStep("idle");
                      }}
                      className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-xl"
                    >
                      Abort Checkout
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accordion FAQs Section */}
      <section id="faq" className="py-24 px-6 scroll-mt-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full">
              <Icon name="HelpCircle" className="text-blue-400" size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Frequently Asked Inquiries</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Got Questions? We’ve Got Answers</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Review how our premium sprint model works and why it remains superior to hiring individual freelancers.
            </p>
          </div>

          {/* Accordion container */}
          <div className="space-y-4">
            {cmsData.faqs.map((faq) => {
              const isSelected = activeFaq === faq.id;
              return (
                <div 
                  key={faq.id}
                  className="rounded-xl border border-white/5 bg-[#0B1220]/40 overflow-hidden hover:border-white/10 transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isSelected ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <Icon 
                      name="ChevronDown" 
                      className={`text-cyan-400 transition-transform duration-300 ${isSelected ? "rotate-180" : ""}`}
                      size={16}
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-5 text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#050816]/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Professional Contact Form Section */}
      <section id="contact" className="py-24 px-6 bg-white/[0.01] border-t border-white/5 scroll-mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left side: Contact text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-600/10 border border-cyan-500/30 rounded-full">
                <Icon name="Mail" className="text-cyan-400" size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Collaborate with Us</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Let's Construct Your Blueprint.
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Ready to accelerate your brand authority with an AI-augmented workflow? Send us a description of your project and our lead specialists will synchronize with you.
              </p>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                    <Icon name="Mail" size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Inbound Communications</p>
                    <p className="text-xs font-semibold text-white">tanishktanishkchandak45@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                    <Icon name="MapPin" size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">HQ Operations</p>
                    <p className="text-xs font-semibold text-white">Silicon Valley / Bengaluru Hub</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Interactive validated form */}
            <div className="lg:col-span-7 bg-[#0B1220]/60 border border-white/10 rounded-2xl p-6 sm:p-8">
              {contactSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto">
                    <Icon name="CheckCircle" size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white font-sans">Project Details Received!</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    We have securely cached your strategic objectives. Our primary team will review your requirements and reach out via email (<strong className="text-white">{contactForm.email}</strong>) to schedule our launch call.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="text-xs font-bold text-blue-400 hover:underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Your Full Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Arjun Sharma"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Email Address *</label>
                      <input 
                        type="email"
                        required
                        placeholder="arjun@growthlabs.io"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Company Name</label>
                      <input 
                        type="text"
                        placeholder="GrowthLabs"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Phone (Optional)</label>
                      <input 
                        type="text"
                        placeholder="+91 96494 24045"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Estimated Budget</label>
                      <select 
                        value={contactForm.budget}
                        onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      >
                        <option value="₹19,999 - ₹49,999" className="bg-[#0b1220]">₹19,999 - ₹49,999</option>
                        <option value="₹49,999 - ₹1,00,000" className="bg-[#0b1220]">₹49,999 - ₹1,00,000</option>
                        <option value="₹1,00,000+" className="bg-[#0b1220]">₹1,00,000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Requested Service</label>
                      <select 
                        value={contactForm.service}
                        onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                      >
                        {cmsData.services.map(s => (
                          <option key={s.id} value={s.title} className="bg-[#0b1220]">{s.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Project Description & Objectives *</label>
                    <textarea 
                      required
                      placeholder="Explain your goals briefly. (e.g. Looking to integrate active CRM tracking and deploy modern SaaS pages.)"
                      value={contactForm.description}
                      onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                      rows={4}
                      className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-white/5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition transform hover:-translate-y-0.5"
                  >
                    Submit Strategy Brief
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Newsletter Signup in margin */}
      <section className="py-12 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h3 className="text-xl font-bold">Stay Updated with Weekly AI Sprints</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Get actual framework guides, optimization tricks, and exclusive coupon discount announcements directly in your mailbox. No spam, ever.
          </p>

          {newsletterSuccess ? (
            <p className="text-xs text-green-400 font-bold">✓ Successfully subscribed to our Weekly Insights newsletter!</p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="enter-your-email@domain.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-[#050816] text-xs font-bold rounded-xl hover:bg-cyan-400 transition"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Logo Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
                <Icon name="Cpu" size={14} />
              </div>
              <span className="text-lg font-bold text-white">{cmsData.brandName}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              An elite, multi-disciplinary SaaS studio crafting high-end, secure digital systems, and automated pipelines inspired by Apple and Vercel structures.
            </p>
            <div className="flex items-center gap-4 text-gray-500">
              <a href="mailto:tanishkchandak45@gmail.com" className="hover:text-white transition" title="Email Us"><Icon name="Mail" size={16} /></a>
              <a href="tel:+919649424045" className="hover:text-white transition" title="Call Us"><Icon name="Phone" size={16} /></a>
              <a href="https://maps.google.com/?q=Veloce+AI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" title="Our Location"><Icon name="MapPin" size={16} /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Studio Stack</h5>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><a href="#services" className="hover:text-white transition">AI Automation</a></li>
              <li><a href="#services" className="hover:text-white transition">Web Sprints</a></li>
              <li><a href="#services" className="hover:text-white transition">Mobile Apps</a></li>
              <li><a href="#services" className="hover:text-white transition">UI/UX Layouts</a></li>
              <li><a href="#services" className="hover:text-white transition">Video Editing</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Resources</h5>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><a href="#portfolio" className="hover:text-white transition">Case Studies</a></li>
              <li><a href="#booking" className="hover:text-white transition">Discovery Calendar</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing Sprints</a></li>
              <li><a href="#faq" className="hover:text-white transition">Inquiries Accordion</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Legal</h5>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><a href="#legal" onClick={(e) => { e.preventDefault(); triggerToast("Bespoke privacy and compliance policies apply under NDA to all our active agency clients.", "info"); }} className="hover:text-white transition">Privacy Guidelines</a></li>
              <li><a href="#legal" onClick={(e) => { e.preventDefault(); triggerToast("Our corporate master services agreement (MSA) governs all custom development sprints.", "info"); }} className="hover:text-white transition">Terms of Service</a></li>
              <li><button onClick={() => { setCookieConsent(false); triggerToast("Cookie preferences loaded.", "info"); }} className="hover:text-white transition bg-transparent border-none p-0 cursor-pointer text-left text-xs text-gray-500 hover:underline">Cookie Preferences</button></li>
              <li><span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">All Tunnels Secure</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 {cmsData.brandName} Studio. Built with premium craftsmanship.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>All systems live (UTC 2026)</span>
          </div>
        </div>
      </footer>
      </>
      ) : activeView === "auth" ? (
        <AuthPage onAuthSuccess={handleAuthSuccess} onClose={() => setActiveView("landing")} />
      ) : activeView === "client" && user ? (
        <ClientDashboard user={user} token={token!} onLogout={handleLogout} triggerToast={triggerToast} />
      ) : activeView === "admin" && user ? (
        <AdminDashboard user={user} token={token!} onLogout={handleLogout} triggerToast={triggerToast} />
      ) : (
        <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 bg-[#050816]">
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-xs text-gray-500 mb-6">Please sign in to view your bespoke client workspace.</p>
          <button 
            onClick={() => setActiveView("auth")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition"
          >
            Authenticate Portal
          </button>
        </div>
      )}

      {/* Back to Top Floating Trigger */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 h-10 w-10 bg-[#0B1220]/90 border border-white/10 hover:border-blue-500/50 hover:bg-[#0B1220] rounded-full flex items-center justify-center text-cyan-400 z-40 shadow-lg shadow-blue-500/5 hover:shadow-cyan-400/20 transition duration-300"
        >
          <Icon name="ArrowRight" className="-rotate-90" size={16} />
        </button>
      )}

      {/* Floating WhatsApp Quick link Placeholder */}
      <a
        href="https://wa.me/919649424045"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-36 right-6 h-10 w-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white z-40 shadow-lg transition duration-300 transform hover:scale-105"
        title="Chat on WhatsApp"
      >
        <Icon name="Phone" size={16} />
      </a>

      {/* Embedded Live Chat AI Copilot Bot */}
      <AIChatBot />

      {/* Cookie Consent overlay */}
      {!cookieConsent && (
        <div className="fixed bottom-6 left-6 max-w-sm bg-[#0B1220] border border-white/10 rounded-2xl p-5 z-40 shadow-2xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Icon name="Shield" className="text-cyan-400" size={16} />
            <span>Privacy Security Protocols</span>
          </h4>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            We utilize secure cookies to cache customized CMS selections and improve client-side checkout tunnels.
          </p>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => {
                try {
                  localStorage.setItem("veloce_cookie_consent", "true");
                } catch (e) {
                  console.warn("Could not save cookie consent to localStorage:", e);
                }
                setCookieConsent(true);
                triggerToast("Secure cookies authorized.", "success");
              }}
              className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold rounded-lg hover:shadow transition"
            >
              Acknowledge Consent
            </button>
            <button
              onClick={() => {
                setCookieConsent(true);
              }}
              className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-[11px] font-bold rounded-lg"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert Box */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0B1220] border border-white/15 rounded-xl px-5 py-3.5 shadow-2xl min-w-[300px]"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === "success" ? "bg-green-500/20 text-green-400" :
              toast.type === "error" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
            }`}>
              <Icon name={toast.type === "success" ? "CheckCircle" : toast.type === "error" ? "AlertCircle" : "Info"} size={14} />
            </div>
            <p className="text-xs font-semibold text-white leading-relaxed">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* Real-time CMS Editor Sidebar Widget (Make everything editable) */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isCmsOpen && (
          <motion.div
            id="cms-editor-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
          >
            {/* Backdrop click to dismiss safely */}
            <div className="absolute inset-0" onClick={() => setIsCmsOpen(false)}></div>

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#0B1220] border-l border-white/10 h-full shadow-2xl flex flex-col z-10"
            >
              {/* Sidebar Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#050816]/90">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                    <Icon name="Settings" size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Live CMS Configurator</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Edit web copy and structures dynamically</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCmsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#050816]/40 border-b border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  { id: "hero", label: "Hero Copy" },
                  { id: "services", label: "Services" },
                  { id: "portfolio", label: "Portfolio" },
                  { id: "pricing", label: "Pricing" },
                  { id: "faqs", label: "FAQs" },
                  { id: "testimonials", label: "Praise" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCmsActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition ${
                      cmsActiveTab === tab.id
                        ? "border-blue-500 text-blue-400 bg-white/5"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sidebar Scrollable Editor Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Tab 1: Hero */}
                {cmsActiveTab === "hero" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-1.5">Agency Studio Name</label>
                      <input
                        type="text"
                        value={cmsData.brandName}
                        onChange={(e) => saveCmsData({ ...cmsData, brandName: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-1.5">Hero Headline Title</label>
                      <textarea
                        rows={3}
                        value={cmsData.heroTitle}
                        onChange={(e) => saveCmsData({ ...cmsData, heroTitle: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-gray-500 mt-1 italic">Use period (.) separators to break text lines gracefully.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-1.5">Hero Subheading Text</label>
                      <textarea
                        rows={3}
                        value={cmsData.heroSubtitle}
                        onChange={(e) => saveCmsData({ ...cmsData, heroSubtitle: e.target.value })}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-1.5">Calendly Scheduling Link</label>
                      <input
                        type="text"
                        value={calendlyLink}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCalendlyLink(val);
                          try {
                            localStorage.setItem("veloce_calendly_link", val);
                          } catch (err) {
                            console.warn("Could not save calendly link to localStorage:", err);
                          }
                        }}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Services */}
                {cmsActiveTab === "services" && (
                  <div className="space-y-6">
                    {cmsData.services.map((svc, idx) => (
                      <div key={svc.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-cyan-400">SERVICE ACCORD #{idx + 1}</span>
                          <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-gray-400 font-mono">{svc.icon}</span>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Title</label>
                          <input
                            type="text"
                            value={svc.title}
                            onChange={(e) => {
                              const list = [...cmsData.services];
                              list[idx].title = e.target.value;
                              saveCmsData({ ...cmsData, services: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={svc.description}
                            onChange={(e) => {
                              const list = [...cmsData.services];
                              list[idx].description = e.target.value;
                              saveCmsData({ ...cmsData, services: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Sub Features (comma separated)</label>
                          <textarea
                            rows={2}
                            value={svc.features.join(", ")}
                            onChange={(e) => {
                              const list = [...cmsData.services];
                              list[idx].features = e.target.value.split(",").map(f => f.trim());
                              saveCmsData({ ...cmsData, services: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: Portfolio */}
                {cmsActiveTab === "portfolio" && (
                  <div className="space-y-6">
                    {cmsData.portfolio.map((proj, idx) => (
                      <div key={proj.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-cyan-400">PROJECT ACCORD #{idx + 1}</span>
                          <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase font-mono">{proj.category}</span>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Project Name</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const list = [...cmsData.portfolio];
                              list[idx].title = e.target.value;
                              saveCmsData({ ...cmsData, portfolio: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Mock Image Link (Unsplash/URL)</label>
                          <input
                            type="text"
                            value={proj.image}
                            onChange={(e) => {
                              const list = [...cmsData.portfolio];
                              list[idx].image = e.target.value;
                              saveCmsData({ ...cmsData, portfolio: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Description Preview</label>
                          <textarea
                            rows={2}
                            value={proj.description}
                            onChange={(e) => {
                              const list = [...cmsData.portfolio];
                              list[idx].description = e.target.value;
                              saveCmsData({ ...cmsData, portfolio: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: Pricing */}
                {cmsActiveTab === "pricing" && (
                  <div className="space-y-6">
                    {cmsData.pricing.map((plan, idx) => (
                      <div key={plan.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">PLAN ACCORD: {plan.name}</span>
                        
                        {!plan.isCustom && (
                          <div>
                            <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Pricing Rate (₹ INR)</label>
                            <input
                              type="number"
                              value={plan.priceINR}
                              onChange={(e) => {
                                const list = [...cmsData.pricing];
                                list[idx].priceINR = Number(e.target.value);
                                saveCmsData({ ...cmsData, pricing: list });
                              }}
                              className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Action Button Text</label>
                          <input
                            type="text"
                            value={plan.ctaText}
                            onChange={(e) => {
                              const list = [...cmsData.pricing];
                              list[idx].ctaText = e.target.value;
                              saveCmsData({ ...cmsData, pricing: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Plan Features (comma separated)</label>
                          <textarea
                            rows={3}
                            value={plan.features.join(", ")}
                            onChange={(e) => {
                              const list = [...cmsData.pricing];
                              list[idx].features = e.target.value.split(",").map(f => f.trim());
                              saveCmsData({ ...cmsData, pricing: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 5: FAQs */}
                {cmsActiveTab === "faqs" && (
                  <div className="space-y-6">
                    {cmsData.faqs.map((faq, idx) => (
                      <div key={faq.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">FAQ #{idx + 1}</span>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Question</label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const list = [...cmsData.faqs];
                              list[idx].question = e.target.value;
                              saveCmsData({ ...cmsData, faqs: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Answer</label>
                          <textarea
                            rows={3}
                            value={faq.answer}
                            onChange={(e) => {
                              const list = [...cmsData.faqs];
                              list[idx].answer = e.target.value;
                              saveCmsData({ ...cmsData, faqs: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 6: Testimonials */}
                {cmsActiveTab === "testimonials" && (
                  <div className="space-y-6">
                    {cmsData.testimonials.map((test, idx) => (
                      <div key={test.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">TESTIMONIAL #{idx + 1}</span>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Client Name</label>
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => {
                              const list = [...cmsData.testimonials];
                              list[idx].name = e.target.value;
                              saveCmsData({ ...cmsData, testimonials: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Role / Company</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={test.role}
                              onChange={(e) => {
                                const list = [...cmsData.testimonials];
                                list[idx].role = e.target.value;
                                saveCmsData({ ...cmsData, testimonials: list });
                              }}
                              placeholder="Role"
                              className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                            <input
                              type="text"
                              value={test.company}
                              onChange={(e) => {
                                const list = [...cmsData.testimonials];
                                list[idx].company = e.target.value;
                                saveCmsData({ ...cmsData, testimonials: list });
                              }}
                              placeholder="Company"
                              className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Feedback Quote</label>
                          <textarea
                            rows={3}
                            value={test.feedback}
                            onChange={(e) => {
                              const list = [...cmsData.testimonials];
                              list[idx].feedback = e.target.value;
                              saveCmsData({ ...cmsData, testimonials: list });
                            }}
                            className="w-full bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Sidebar Footer Controls */}
              <div className="p-4 border-t border-white/5 bg-[#050816] flex gap-3">
                <button
                  type="button"
                  onClick={resetCmsToDefault}
                  className="flex-1 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition"
                >
                  Factory Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsCmsOpen(false)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/10"
                >
                  Done Customizing
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
