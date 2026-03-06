"use client";

import Link from "next/link";
import { DbtMark, DbtWordmark } from "@/components/Icons";

const FEATURES = [
  {
    title: "Metric Explorer",
    description:
      "Navigate your dbt metrics through interactive lineage graphs — from upstream source tables and models, through semantic models, all the way down to the dashboards they power.",
    href: "/explorer",
    color: "#FF694B",
    bgColor: "#FFF7F5",
    borderColor: "#FF694B30",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    bullets: [
      "Object & column-level lineage",
      "Source → model → metric → dashboard flow",
      "Toggle between dbt names and table names",
    ],
  },
  {
    title: "How It Works",
    description:
      "Understand the API architecture, required tokens and IDs, GraphQL queries, and the data flow that powers this application.",
    href: "/how-it-works",
    color: "#10B981",
    bgColor: "#F0FDF4",
    borderColor: "#10B98130",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    bullets: [
      "Discovery & Semantic Layer API details",
      "Required env vars and service tokens",
      "Full GraphQL query reference",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <DbtMark size={28} className="rounded-lg" />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">dbt Metric Explorer</h1>
            <p className="text-[10px] text-muted">Powered by the dbt Semantic Layer</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-5xl w-full py-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dbt-orange/8 border border-dbt-orange/15 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-dbt-orange animate-pulse" />
              <span className="text-[11px] font-medium text-dbt-orange">Connected to dbt Cloud</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Explore Your Semantic Layer
            </h2>
            <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
              Visualize metric lineage, build queries interactively, and understand the full data
              flow from source tables to dashboards — all powered by the dbt Cloud APIs.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-2xl border bg-surface p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: feature.borderColor }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: feature.bgColor, color: feature.color }}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-foreground/90">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Bullets */}
                <ul className="space-y-1.5 mb-5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-[11px] text-slate-500">
                      <svg
                        className="w-3 h-3 mt-0.5 flex-shrink-0"
                        style={{ color: feature.color }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>

                {/* Open link */}
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: feature.color }}
                >
                  Open
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DbtWordmark width={40} height={16} className="opacity-30" />
          </div>
          <p className="text-[10px] text-muted">Metric Explorer &middot; Semantic Layer</p>
        </div>
      </footer>
    </div>
  );
}
