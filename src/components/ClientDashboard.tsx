import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface ClientDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  token: string;
  onLogout: () => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function ClientDashboard({ user, token, onLogout, triggerToast }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<"calls" | "billing" | "projects" | "support">("calls");
  
  // Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States for Raising Support Ticket
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Technical");
  const [ticketPriority, setTicketPriority] = useState("MEDIUM");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Fetch all user specific details
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        // Fetch Bookings
        try {
          const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!error && data) {
            setBookings(data.map(b => ({
              id: b.id,
              date: b.meeting_date,
              time: b.meeting_time,
              timezone: b.timezone,
              serviceRequired: b.service,
              status: b.booking_status,
              projectDescription: b.project_description,
              meetLink: b.meeting_link,
            })));
          }
        } catch (e) {
          console.warn("Could not fetch bookings from Supabase:", e);
        }

        // Fetch Orders/Billing
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!error && data) {
            setOrders(data.map(o => ({
              id: o.id,
              planName: o.plan_name,
              amount: o.amount,
              status: o.status,
              invoiceId: o.invoice_id,
              createdAt: o.created_at,
            })));
          }
        } catch (e) {
          console.warn("Could not fetch orders from Supabase:", e);
        }

        // Fetch Support Tickets
        try {
          const { data, error } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!error && data) {
            setTickets(data);
          }
        } catch (e) {
          console.warn("Could not fetch support tickets from Supabase:", e);
        }
      }
    } catch (err) {
      console.error("Dashboard details retrieval failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this strategic session? This deletes the calendar event.")) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from("bookings")
          .update({ booking_status: "Cancelled" })
          .eq("id", bookingId);
        if (error) throw error;
      }
      triggerToast("Session cancelled successfully. Notification email dispatched.", "info");
      fetchDashboardData();
    } catch (err) {
      triggerToast("An error occurred during cancellation.", "error");
    }
  };

  // Handle Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketDesc) {
      triggerToast("Please populate all required fields.", "error");
      return;
    }
    setSubmittingTicket(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from("support_tickets")
          .insert([
            {
              title: ticketTitle,
              description: ticketDesc,
              category: ticketCategory,
              priority: ticketPriority,
              status: "OPEN",
              user_id: user.id,
            }
          ]);
        if (error) throw error;
      }
      triggerToast("Support ticket registered successfully.", "success");
      setTicketTitle("");
      setTicketDesc("");
      fetchDashboardData();
    } catch (err) {
      triggerToast("An error occurred during submission.", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col">
      {/* Upper Dashboard Header */}
      <header className="bg-[#0B1220]/80 border-b border-white/5 px-8 py-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icon name="User" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Client Portal: {user.name}</h1>
              <p className="text-xs text-gray-500">{user.email} &bull; Subscription Active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white font-semibold rounded-xl transition flex items-center gap-2"
            >
              <Icon name="RefreshCw" size={12} className={loading ? "animate-spin text-cyan-400" : ""} />
              <span>Reload Details</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 hover:text-red-300 font-bold rounded-xl transition flex items-center gap-2"
            >
              <Icon name="LogOut" size={12} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <div className="max-w-7xl mx-auto w-full px-8 py-10 flex-1 grid md:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="md:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("calls")}
            className={`w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border transition-all ${
              activeTab === "calls"
                ? "bg-blue-600/10 border-blue-500/30 text-cyan-400"
                : "bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Icon name="Calendar" size={14} />
            <span>Consultation Calls</span>
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border transition-all ${
              activeTab === "billing"
                ? "bg-blue-600/10 border-blue-500/30 text-cyan-400"
                : "bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Icon name="CreditCard" size={14} />
            <span>Invoices & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border transition-all ${
              activeTab === "projects"
                ? "bg-blue-600/10 border-blue-500/30 text-cyan-400"
                : "bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Icon name="Activity" size={14} />
            <span>Active Sprint Progress</span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border transition-all ${
              activeTab === "support"
                ? "bg-blue-600/10 border-blue-500/30 text-cyan-400"
                : "bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Icon name="LifeBuoy" size={14} />
            <span>Support Desk</span>
          </button>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="md:col-span-9 bg-[#0B1220]/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm min-h-[450px]">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col gap-3 py-20">
              <span className="w-10 h-10 border-3 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs text-gray-500 uppercase tracking-widest">Querying Cloud Records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: CONSULTATION CALLS */}
              {activeTab === "calls" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Upcoming Strategic Alignments</h2>
                    <p className="text-xs text-gray-500 mt-1">Bookings synchronized in real-time with Google Calendar and automated video endpoints.</p>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="p-8 border border-white/5 bg-[#050816]/50 rounded-xl text-center">
                      <Icon name="CalendarOff" className="text-gray-600 mx-auto mb-3" size={32} />
                      <p className="text-sm font-semibold text-gray-400">No calls scheduled</p>
                      <p className="text-xs text-gray-600 mt-1">Use our landing page calendar widget to secure your session slot!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="p-5 bg-[#050816]/60 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded ${
                                booking.status === "CONFIRMED" ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {booking.status}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">ID: {booking.id.slice(-6)}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{booking.serviceRequired} Alignment</h3>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Icon name="Clock" size={12} className="text-blue-400" />
                              <span>{booking.date} at {booking.time} ({booking.timezone})</span>
                            </p>
                            {booking.meetLink && booking.status !== "CANCELLED" && (
                              <a
                                href={booking.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold underline pt-1"
                              >
                                <Icon name="Video" size={12} />
                                <span>Join Google Meet Room</span>
                              </a>
                            )}
                          </div>

                          {booking.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl border border-red-500/20 transition self-start sm:self-center"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BILLING & INVOICES */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Invoicing & Subscriptions</h2>
                    <p className="text-xs text-gray-500 mt-1">Official receipts, GSTIN compliance logs, and order history.</p>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 border border-white/5 bg-[#050816]/50 rounded-xl text-center">
                      <Icon name="CreditCard" className="text-gray-600 mx-auto mb-3" size={32} />
                      <p className="text-sm font-semibold text-gray-400">No transactions recorded</p>
                      <p className="text-xs text-gray-600 mt-1">Select an agency subscription plan to initialize sprints.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-6 bg-[#050816]/60 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded">
                                {order.planName} Plan
                              </span>
                              <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded">
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-gray-500">Transaction Date</p>
                                <p className="text-white font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">GSTIN Entered</p>
                                <p className="text-white font-mono mt-0.5">{order.gstNumber || "Not Specified"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start md:items-end justify-between gap-3 md:text-right">
                            <div>
                              <p className="text-xs text-gray-500">Total Amount</p>
                              <p className="text-lg font-extrabold text-cyan-400 font-mono mt-0.5">₹{order.amount.toLocaleString("en-IN")}</p>
                            </div>
                            {order.invoice && (
                              <button
                                onClick={() => triggerToast(`Invoice ${order.invoice.invoiceNumber} downloaded as compliant PDF (simulated).`, "success")}
                                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                              >
                                <Icon name="Download" size={12} />
                                <span>Download PDF Receipt</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SPRINT PROGRESS */}
              {activeTab === "projects" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Active Agile Sprint Pipeline</h2>
                    <p className="text-xs text-gray-500 mt-1">Live task breakdowns, wireframe approvals, and deployment status.</p>
                  </div>

                  <div className="p-6 bg-[#050816]/60 border border-white/10 rounded-xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">Active Sprint: Core AI SaaS Portal</h3>
                        <p className="text-xs text-gray-500 mt-1">Allocated Squad Lead: Tanishk Chandak (Senior Dev)</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-blue-600/10 text-cyan-400 border border-blue-500/20 px-3 py-1 rounded-full">
                        Sprint 1 of 4 Active
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Sprint Roadmap Cleared</span>
                        <span className="text-cyan-400 font-bold font-mono">45% Complete</span>
                      </div>
                      <div className="h-2 w-full bg-[#0B1220] border border-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[45%] rounded-full animate-pulse" />
                      </div>
                    </div>

                    {/* Milestones list */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Milestone Checklist</h4>
                      
                      <div className="grid gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Icon name="Check" size={10} />
                          </div>
                          <span className="text-gray-300">Brand Identity & Style Board Alignment (Linear-inspired typography, glowing overlays)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Icon name="Check" size={10} />
                          </div>
                          <span className="text-gray-300">Prisma + SQLite/PostgreSQL Database Architecture Deployment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-blue-600/10 text-blue-500 border border-blue-500/10 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          </div>
                          <span className="text-white font-medium">JWT Secure Client + Administrator Control Panel Panels Integration (Current Phase)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-white/5 text-gray-600 border border-white/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                          </div>
                          <span className="text-gray-500">Comprehensive End-to-End Veloce AI Assistant Testing & Cloud Run Release</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUPPORT DESK */}
              {activeTab === "support" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Dedicated Support Desk</h2>
                    <p className="text-xs text-gray-500 mt-1">Open Technical queries, system issues, or request revision adjustments directly to our team.</p>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-8">
                    
                    {/* Raise Ticket Form */}
                    <form onSubmit={handleSubmitTicket} className="lg:col-span-5 space-y-4 bg-[#050816]/50 p-5 rounded-xl border border-white/5 self-start">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">File A Request</h3>
                      
                      <div>
                        <label htmlFor="ticket-title-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Brief Title</label>
                        <input
                          id="ticket-title-input"
                          type="text"
                          required
                          value={ticketTitle}
                          onChange={(e) => setTicketTitle(e.target.value)}
                          placeholder="e.g. Domain mapping issue"
                          className="w-full px-3 py-2.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="ticket-category-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                          <select
                            id="ticket-category-select"
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white focus:border-blue-500 outline-none transition"
                          >
                            <option value="Technical">Technical</option>
                            <option value="Design Revision">Revision</option>
                            <option value="Billing">Billing</option>
                            <option value="Strategy">Strategy</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="ticket-priority-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
                          <select
                            id="ticket-priority-select"
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white focus:border-blue-500 outline-none transition"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="ticket-desc-textarea" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description Context</label>
                        <textarea
                          id="ticket-desc-textarea"
                          rows={4}
                          required
                          value={ticketDesc}
                          onChange={(e) => setTicketDesc(e.target.value)}
                          placeholder="Describe the exact requirements or details."
                          className="w-full px-3 py-2.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {submittingTicket ? (
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Register Support Query</span>
                            <Icon name="Send" size={10} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Tickets List */}
                    <div className="lg:col-span-7 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Active Support Tickets</h3>
                      
                      {tickets.length === 0 ? (
                        <div className="p-8 border border-white/5 bg-[#050816]/30 rounded-xl text-center">
                          <Icon name="Inbox" className="text-gray-600 mx-auto mb-2" size={24} />
                          <p className="text-xs font-semibold text-gray-400">No tickets raised yet</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">Your dashboard is fully optimized!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 bg-[#050816]/60 border border-white/5 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{ticket.title}</span>
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                  ticket.status === "OPEN" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-normal">{ticket.description}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 pt-1">
                                <span>Priority: {ticket.priority}</span>
                                <span>&bull;</span>
                                <span>Category: {ticket.category}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
