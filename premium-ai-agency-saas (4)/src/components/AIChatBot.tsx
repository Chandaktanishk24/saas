import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Icon from "./Icon";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      content: "Hello! I am Veloce's AI Brand Advisor. Let's design your strategy. Ask me about our premium workflows, video editing, or custom SaaS development!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    "What are your services?",
    "Tell me about the Growth Plan",
    "How does the AI workflow work?",
    "Do you offer refunds?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate a responsive, smart client-side brand assistant to avoid external /api/chat calls
    setTimeout(() => {
      let aiResponse = "Hello! I am Veloce AI's brand advisor. I can help you choose the best services or pricing packages to scale your business. Ask me about custom web apps, professional CRM automations, or high-retention video editing!";
      const lower = textToSend.toLowerCase();

      if (lower.includes("service") || lower.includes("what do you do") || lower.includes("offer") || lower.includes("features")) {
        aiResponse = "Veloce AI is an elite, multi-disciplinary tech-studio specializing in:\n\n1. **AI Automation & Agents** (CRM syncing, lead capture, smart auto-emailers)\n2. **High-Performance Web & Apps** (custom SaaS, ultra-fast landing pages)\n3. **Modern Apple-style UI/UX Design**\n4. **High-Retention Video Editing & Social Growth**\n\nWhich department should we focus on first for your project?";
      } else if (lower.includes("pricing") || lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("starter") || lower.includes("growth") || lower.includes("enterprise")) {
        aiResponse = "We have three structured packages designed to scale your brand:\n\n- **Starter Plan (₹19,999/mo)**: Tailored for solo creators needing professional website dev and essential visual branding.\n- **Growth Plan (₹49,999/mo) [Most Popular]**: Full CRM automations, custom Web/SaaS portals, 10 high-retention video cuts, and direct priority channels.\n- **Enterprise Plan (Custom)**: Bespoke cross-platform apps, custom AI Agents, and a 24/7 dedicated squad.\n\nWhich of these options aligns best with your goals?";
      } else if (lower.includes("book") || lower.includes("schedule") || lower.includes("call") || lower.includes("meeting") || lower.includes("consult")) {
        aiResponse = "Booking a strategy session is quick and seamless! Just scroll to our scheduling widget right below the Hero section, choose a convenient date and time, and your spot will sync automatically with our system.";
      } else if (lower.includes("refund") || lower.includes("cancel")) {
        aiResponse = "We offer a 100% satisfaction guarantee. If you are not completely satisfied with our service delivery or response times during the first 14 days, we will process a hassle-free, full refund of your subscription fee.";
      } else if (lower.includes("workflow") || lower.includes("how does it work") || lower.includes("process")) {
        aiResponse = "Our workflow is fully optimized:\n\n1. **Select a Plan**: Subscribing takes less than 2 minutes.\n2. **Align on Call**: We map out your custom brand or development sprints.\n3. **Active Rollout**: We ship deliverables continuously with real-time progress updates.\n4. **Scale & Optimize**: We adjust automations or campaigns to maximize inbound flow.";
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        aiResponse = "Hello there! Welcome to Veloce AI. I am your strategic brand advisor. Let me know what you are looking to build or automate today!";
      } else {
        aiResponse = "That is a great strategic question. To give you the most tailored solution, I highly recommend scheduling a 1-on-1 Free Strategy Call using our booking calendar below so our specialists can design a custom roadmap for you!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: "ai",
          content: aiResponse,
          timestamp: new Date()
        }
      ]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          id="btn-ai-chatbot-toggle"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-cyan-400/30 focus:outline-none"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-500"></span>
          </span>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Icon name="X" size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Icon name="Sparkles" size={24} className="animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chatbox Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="window-ai-chatbot"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed right-6 bottom-24 z-50 flex h-[500px] w-full max-w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0B1220]/95 shadow-2xl backdrop-blur-xl sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#050816]/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/40 text-blue-400 border border-blue-500/30">
                  <Icon name="Sparkles" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Veloce AI Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-gray-400">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10"
                        : "bg-gray-800/80 text-gray-200 rounded-tl-none border border-gray-700/50"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`mt-1 text-[10px] ${
                        msg.sender === "user" ? "text-blue-200 text-right" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-gray-800/80 px-4 py-3 border border-gray-700/50">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Presets */}
            {messages.length < 3 && (
              <div className="px-4 py-2 bg-gray-900/30 border-t border-gray-800/40">
                <p className="text-[10px] font-medium tracking-wider text-gray-500 uppercase mb-1.5">Common Queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {presetQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="rounded-full border border-gray-800 bg-gray-900/60 px-2.5 py-1 text-xs text-gray-300 hover:border-blue-500/50 hover:bg-blue-900/10 hover:text-blue-400 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="border-t border-gray-800 bg-[#050816]/90 p-3"
            >
              <div className="relative flex items-center rounded-xl border border-gray-800 bg-gray-950/80 focus-within:border-blue-500/50 pr-2 pl-3 py-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Veloce AI..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    input.trim() && !isLoading
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  } transition`}
                >
                  <Icon name="Send" size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
