"use client";

import React, { useState } from "react";
import {
  Play,
  X,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Video,
  Monitor,
  Code2,
  ShieldCheck,
  CreditCard,
  FileText,
} from "lucide-react";

interface TutorialVideo {
  id: string;
  title: string;
  duration: string;
  category: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  takeaways: string[];
  chapters: { time: string; title: string }[];
  faqs: { question: string; answer: string }[];
}

const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: "architecture",
    title: "Platform Overview & System Design",
    duration: "4:15",
    category: "Architecture",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Monitor,
    description:
      "A comprehensive walkthrough of the Orifa client software architecture. Learn how automated domain WHOIS probes, email workspace license monitors, in-place visual editing, and retainer subscriptions integrate into a single unified client portal.",
    takeaways: [
      "Understand the multitenant security model protecting your company data.",
      "See how automated background crons check domain expiration and SSL health.",
      "Learn how Orifa links your live production site with GitHub repository branches.",
      "Explore the quick actions bar and communication channels with Orifa engineers.",
    ],
    chapters: [
      { time: "0:00", title: "Introduction & Multitenant Dashboard" },
      { time: "1:15", title: "Automated Domain & Email Monitoring" },
      { time: "2:30", title: "In-Place Website Content Management" },
      { time: "3:40", title: "Maintenance Retainers & SLA Guarantees" },
    ],
    faqs: [
      {
        question: "Who has access to my company's portal?",
        answer:
          "Only authorized members of your organization invited by your administrator. Each organization is cryptographically isolated under OWASP multi-tenant standards.",
      },
      {
        question: "How frequently is domain and email health checked?",
        answer:
          "Orifa's background monitoring engine checks domain WHOIS and SSL certificate expiration every 24 hours.",
      },
    ],
  },
  {
    id: "editor",
    title: "In-Place Visual Website Editing",
    duration: "3:45",
    category: "Visual Editor",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Code2,
    description:
      "Learn how to use Orifa's zero-dependency embed script to edit website copy, headlines, button labels, and hyperlinks directly on your live page with instant responsive device previews.",
    takeaways: [
      "Switch effortlessly between Desktop, Tablet (768px), and Mobile (390px) views.",
      "Click any element marked with data-cms to trigger the inline mini-toolbar.",
      "Apply formatting (Bold, Italic), edit links, and stage changes without breaking code.",
      "Batch submit revisions to the staged changes queue for review.",
    ],
    chapters: [
      { time: "0:00", title: "Opening the Visual Editor & Viewport Controls" },
      { time: "1:05", title: "Selecting & Modifying Text Elements" },
      { time: "2:10", title: "Changing Call-to-Action Links & Buttons" },
      { time: "3:00", title: "Staging Revisions & Staged Drawer Overview" },
    ],
    faqs: [
      {
        question: "Can an edit accidentally break my live website?",
        answer:
          "No. All edits are initially staged in a secure sandbox queue. Nothing goes live until reviewed or merged into your GitHub branch.",
      },
      {
        question: "Can I add the editor script to any page?",
        answer:
          "Yes! Click 'Embed Snippet' in the editor header to copy the standard HTML script tag for your web pages.",
      },
    ],
  },
  {
    id: "media",
    title: "WebP Media Optimization & Asset Library",
    duration: "2:50",
    category: "Media Library",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Sparkles,
    description:
      "Understand how Orifa's native Sharp engine automatically converts uploaded PNG and JPEG assets into ultra-lightweight WebP format to speed up your page loading times and improve SEO.",
    takeaways: [
      "Upload brand graphics, photos, and team headshots in high resolution.",
      "Automatic WebP conversion reduces bandwidth consumption by up to 75%.",
      "One-click copy the repo destination path to reference in your content.",
      "Asset staging safeguards prevent broken image links on your live website.",
    ],
    chapters: [
      { time: "0:00", title: "Navigating the Media Asset Library" },
      { time: "0:50", title: "Uploading PNGs, JPEGs, and SVGs" },
      { time: "1:40", title: "Automatic Sharp WebP Compression" },
      { time: "2:20", title: "Copying Repository Paths for Content" },
    ],
    faqs: [
      {
        question: "What image formats are supported?",
        answer:
          "We support PNG, JPEG, GIF, SVG, and WebP. Raster images are automatically converted to modern WebP with 82% quality compression.",
      },
      {
        question: "Where are the images stored?",
        answer:
          "Images are stored in Convex cloud storage and mapped directly to your website's public/images/uploads repository directory.",
      },
    ],
  },
  {
    id: "changes",
    title: "Staged Changes & GitHub PR Workflows",
    duration: "5:10",
    category: "Deployments",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: FileText,
    description:
      "Explore how website revisions move through our quality-control pipeline. See how clients on Active Retainers receive automated GitHub Pull Requests while Self-Managed clients submit changes for agency engineering review.",
    takeaways: [
      "Inspect side-by-side and inline visual diffs with red deletions and green additions.",
      "Understand Active Retainer auto-PR workflows vs Self-Managed engineering reviews.",
      "Track live GitHub branch names (orifa-update-[timestamp]) and PR numbers.",
      "Monitor status from Draft -> Pending Review -> PR Created -> Merged & Live.",
    ],
    chapters: [
      { time: "0:00", title: "The Staged Changes Dashboard" },
      { time: "1:20", title: "Reviewing Visual Diffs" },
      { time: "2:45", title: "Active Retainer vs Self-Managed Workflows" },
      { time: "4:00", title: "GitHub PR Creation & Deployment Status" },
    ],
    faqs: [
      {
        question: "How long does it take for an edit to go live?",
        answer:
          "Clients with active maintenance retainers have automated pull requests created immediately. Merges trigger your existing CI/CD pipeline (e.g. Vercel, Netlify, Cloudflare Pages).",
      },
      {
        question: "Can I discard a staged change before it gets reviewed?",
        answer: "Yes, you can delete any staged draft change at any time from your Changes dashboard.",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Domain, SSL & Email Expiration Protection",
    duration: "3:20",
    category: "Protection",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ShieldCheck,
    description:
      "Learn how automated expiration countdowns and email alerts protect your brand from catastrophic domain hijacking, expired SSL security warnings, and work email downtime.",
    takeaways: [
      "Understand how WHOIS & RDAP lookup tracks registrar renewal dates.",
      "Receive automated proactive reminders 30 days, 14 days, and 7 days prior to expiry.",
      "Monitor Google Workspace and Microsoft 365 seat licenses and renewal dates.",
      "Prevent SSL certificate expiration warnings from blocking your customers.",
    ],
    chapters: [
      { time: "0:00", title: "Domain Expiration Risks & Overview" },
      { time: "1:00", title: "Realtime WHOIS Monitoring & Urgency Badges" },
      { time: "1:55", title: "Google Workspace & M365 Seat Tracking" },
      { time: "2:40", title: "Automated Email Alerts & Renewal Steps" },
    ],
    faqs: [
      {
        question: "Does Orifa automatically renew my domain?",
        answer:
          "If your maintenance retainer includes Managed Domain Renewals, Orifa renews it on your behalf. Otherwise, you receive timely alerts to renew directly with your registrar.",
      },
      {
        question: "What happens if a domain shows 'Warning' status?",
        answer:
          "It means your domain renewal is within 30 days. You should ensure your registrar auto-renew card is up to date.",
      },
    ],
  },
  {
    id: "billing",
    title: "Retainer Invoices & Multi-Currency Paystack",
    duration: "4:00",
    category: "Billing",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    icon: CreditCard,
    description:
      "Understand how Paystack multi-currency billing works. Clients in Nigeria, Ghana, Kenya, and South Africa pay in their local currencies (NGN, GHS, KES, ZAR), while international clients pay in USD with instant invoice receipts.",
    takeaways: [
      "Automatic country and currency detection (NGN ₦, GHS GH₵, KES KSh, ZAR R, USD $).",
      "Seamless 1-click Paystack checkout accepting local cards, USSD, and international cards.",
      "Automated fallback currency conversion ensuring international payments never fail.",
      "Instant tax-compliant invoice downloads and retainer status tracking.",
    ],
    chapters: [
      { time: "0:00", title: "Retainer Billing Overview & Service Tiers" },
      { time: "1:10", title: "Automatic Country & Currency Detection" },
      { time: "2:15", title: "Making Payments via Paystack Checkout" },
      { time: "3:10", title: "Downloading Official Invoices & Receipts" },
    ],
    faqs: [
      {
        question: "Can I pay in my local African currency?",
        answer:
          "Yes! Clients from Nigeria pay in NGN, Ghana in GHS, Kenya in KES, and South Africa in ZAR. All other countries pay in USD. Paystack's secure checkout handles card and local channels smoothly.",
      },
      {
        question: "How do I download a VAT invoice receipt?",
        answer:
          "Head over to the Billing tab and click 'Download Receipt' next to any settled invoice.",
      },
    ],
  },
];

export function HelpResourcesSection({ primaryColor = "#006e2b" }: { primaryColor?: string }) {
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "takeaways" | "faqs">("video");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">
              Platform Knowledge Base &amp; Video Guides
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
              6 Video Tutorials
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Learn how your Orifa client portal is designed, how monitoring works, and get answers to questions.
          </p>
        </div>

        <a
          href="mailto:support@orifatech.com"
          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
          style={{ color: primaryColor }}
        >
          <span>Ask Agency Team</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 6 Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TUTORIAL_VIDEOS.map((video) => {
          const IconComp = video.icon;

          return (
            <div
              key={video.id}
              onClick={() => {
                setSelectedVideo(video);
                setActiveTab("video");
                setIsPlaying(false);
              }}
              className="group flex flex-col justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm bg-gray-50/40 hover:bg-white transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Top Badge & Duration */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${video.badgeColor}`}
                  >
                    {video.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{video.duration}</span>
                  </div>
                </div>

                {/* Video Title */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 transition-colors leading-snug">
                    {video.title}
                  </h3>
                </div>

                {/* Brief description */}
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
              </div>

              {/* Bottom Play Action Pill */}
              <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between text-[11px] font-semibold text-gray-700 group-hover:text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </span>
                  <span>Watch Video Guide</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Walkthrough Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedVideo.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="font-medium text-emerald-800">{selectedVideo.category}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedVideo.duration}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Responsive Video Container */}
              <div className="relative rounded-xl overflow-hidden bg-zinc-950 aspect-video flex flex-col items-center justify-center text-white shadow-inner group">
                {isPlaying ? (
                  <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-black/40 to-black/60">
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Now Playing: {selectedVideo.title}
                      </span>
                      <span className="font-mono">1:24 / {selectedVideo.duration}</span>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-sm font-bold tracking-wide">Orifa Learning Center</div>
                      <p className="text-xs text-white/70 max-w-md mx-auto">
                        High-definition interactive walkthrough active. Following chapter:{" "}
                        <span className="text-emerald-400 font-semibold">
                          {selectedVideo.chapters[1]?.title || selectedVideo.title}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
                        <div className="bg-emerald-500 h-full w-1/3 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/70">
                        <button
                          onClick={() => setIsPlaying(false)}
                          className="hover:text-white cursor-pointer"
                        >
                          Pause
                        </button>
                        <span>1080p 60fps</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 p-6">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer mx-auto"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                    <div>
                      <div className="text-sm font-bold tracking-wide">Click to Play Tutorial</div>
                      <p className="text-xs text-white/70 max-w-sm mx-auto mt-1">
                        Step-by-step visual demonstration of {selectedVideo.title.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "video"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Overview &amp; Chapters
                </button>
                <button
                  onClick={() => setActiveTab("takeaways")}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "takeaways"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Key Takeaways
                </button>
                <button
                  onClick={() => setActiveTab("faqs")}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "faqs"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Common Questions
                </button>
              </div>

              {/* Tab 1: Overview & Chapters */}
              {activeTab === "video" && (
                <div className="space-y-4 text-xs">
                  <p className="text-gray-600 leading-relaxed">{selectedVideo.description}</p>

                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Video Chapters</span>
                    </h4>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                      {selectedVideo.chapters.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 hover:bg-gray-50/80 transition-colors"
                        >
                          <span className="font-medium text-gray-800">{ch.title}</span>
                          <span className="font-mono text-gray-400 text-[11px]">{ch.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Key Takeaways */}
              {activeTab === "takeaways" && (
                <div className="space-y-2 text-xs">
                  {selectedVideo.takeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50/70 border border-gray-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{takeaway}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Common FAQs */}
              {activeTab === "faqs" && (
                <div className="space-y-3 text-xs">
                  {selectedVideo.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5"
                    >
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{faq.question}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-5">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Still have questions? Our support team is ready to assist.
              </span>
              <a
                href="mailto:support@orifatech.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Contact Orifa Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
