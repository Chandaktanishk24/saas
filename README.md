# Premium AI Agency SaaS Website - Veloce AI

An elite, high-performance, dark premium SaaS website for a modern creative agency powered by AI. Fully responsive, accessibility-compliant, optimized with fluid micro-interactions, and integrated with an interactive real-time AI assistant (Gemini 3.5 Flash).

---

## 🎨 Design Philosophy (The Frosted Glass Theme)

- **Palette**: Dark Premium Slate (`#050816`) backdrop, Deep Navy (`#0B1220`) card frames, Accent Electric Blue (`#3B82F6`), and Cyan Glow (`#38BDF8`).
- **Glassmorphic Gradients**: Soft translucent layers constructed with Tailwind CSS `backdrop-blur` and thin semi-transparent `border-white/10` dividers.
- **Visual Rhythm**: High-end typography paired with sleek vector iconography (`lucide-react`) and fluid viewport scroll-reveal entrance states (`motion/react`).
- **Architectural Honesty**: Standard human literal labels with zero Tech-Larping metadata clutter or artificial telemetry logs.

---

## ⚡ Technical Architecture

- **Front-End**: React 19 + TypeScript + Vite.
- **Back-End API**: Express.js server hosted on port 3000 proxying requests to safeguard sensitive credentials.
- **Durable AI Integration**: Server-side Gemini 3.5 Flash powered by `@google/genai` (with dynamic demo mock fallback if API keys are undefined).
- **Payment Tunnels**: Robust billing checkout endpoint verifying coupon codes (`VELOCE20`, `LAUNCH10`), calculating 18% GST structures, and rendering printable dynamic PDF-like invoice receipt modules.
- **Real-Time CMS Engine**: Beautiful floating config drawer allowing users to customize services, pricing packages, FAQs, testimonials, and copy text on-the-fly without altering codebase structure.

---

## ⚙️ Setup & Installation Instructions

### Prerequisite Setup
Ensure Node.js v18+ is installed on your local system.

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Parameters**:
   Create a local `.env` file referencing `.env.example`:
   ```env
   GEMINI_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
   APP_URL="http://localhost:3000"
   ```

3. **Launch Local Development Server**:
   ```bash
   npm run dev
   ```
   *The reverse-proxy will serve the app on the designated port 3000.*

4. **Compile Production Bundle**:
   Verify everything compiles cleanly and bundle Node server components:
   ```bash
   npm run build
   ```

---

## 🔒 Security Compliance

1. **Server-Side Proxy Protection**: Sensitive API communications are strictly processed server-side (`/api/chat` and `/api/checkout`), keeping secrets concealed from browser DevTools inspect panels.
2. **Predictable Billing Logic**: Coupon codes are securely validated via standard server algorithms before generating signed invoices.
