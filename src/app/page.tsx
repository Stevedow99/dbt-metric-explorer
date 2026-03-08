"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DbtMark, DbtWordmark } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  {
    title: "Semantic Layer Explorer",
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
    title: "dbt Asset Explorer",
    description:
      "Browse any model or source in your dbt project and visualize its full lineage — both upstream dependencies and downstream consumers including metrics, dashboards, and exposures.",
    href: "/asset-explorer",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    borderColor: "#6366F130",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    bullets: [
      "Full upstream & downstream lineage",
      "Column-level lineage for any model",
      "Models, sources, metrics & exposures",
    ],
  },
  {
    title: "Semantic Layer Query Lab",
    description:
      "Build queries against the dbt Semantic Layer — select metrics and dimensions, explore dynamic column-level lineage, and preview sample results in real time.",
    href: "/query-lab",
    color: "#8B5CF6",
    bgColor: "#FAF5FF",
    borderColor: "#8B5CF630",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    bullets: [
      "Dynamic column lineage by selection",
      "10-row sample output from Semantic Layer",
      "Real-time query preview",
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
  const [connInfo, setConnInfo] = useState<{
    accountId?: string;
    projectId?: string;
    environmentId?: string;
    configured?: boolean;
  } | null>(null);
  const [testState, setTestState] = useState<{
    loading: boolean;
    result: { success: boolean; message?: string; error?: string } | null;
  }>({ loading: false, result: null });

  useEffect(() => {
    fetch("/api/connection")
      .then((r) => r.json())
      .then(setConnInfo)
      .catch(() => {});
  }, []);

  const handleTest = useCallback(async () => {
    setTestState({ loading: true, result: null });
    try {
      const res = await fetch("/api/connection?test=true");
      const data = await res.json();
      setTestState({ loading: false, result: data.test });
    } catch {
      setTestState({ loading: false, result: { success: false, error: "Request failed" } });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DbtMark size={28} className="rounded-lg" />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">dbt Platform Asset Explorer</h1>
              <p className="text-[10px] text-muted">Powered by the dbt Platform APIs</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-5xl w-full py-16">
          <div className="text-center mb-14">
            {/* Connection info bar */}
            <div className="inline-flex flex-col items-center gap-2.5 mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dbt-orange/8 border border-dbt-orange/15">
                <div className="w-1.5 h-1.5 rounded-full bg-dbt-orange animate-pulse" />
                <span className="text-[11px] font-medium text-dbt-orange">Connected to dbt Platform</span>
                {connInfo?.configured && (
                  <>
                    <span className="text-dbt-orange/30">|</span>
                    <span className="text-[10px] text-dbt-orange/70 font-mono">
                      Account {connInfo.accountId} &middot; Project {connInfo.projectId} &middot; Env {connInfo.environmentId}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleTest}
                  disabled={testState.loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all duration-200 bg-surface border-border text-muted hover:text-foreground hover:border-dbt-orange/30 hover:bg-dbt-orange/5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {testState.loading ? (
                    <div className="w-3 h-3 border-[1.5px] border-dbt-orange border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {testState.loading ? "Testing..." : "Test API Connection"}
                </button>

                {testState.result && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                      testState.result.success
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {testState.result.success ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {testState.result.success
                      ? testState.result.message
                      : testState.result.error}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Explore Your dbt Platform
            </h2>
            <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
              Visualize lineage for metrics, models, and sources — trace data flows from
              warehouse tables to dashboards, all powered by the dbt Platform APIs.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
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
                    <li key={bullet} className="flex items-start gap-2 text-[11px] text-muted">
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
          <p className="text-[10px] text-muted">Platform Asset Explorer &middot; dbt Platform</p>
        </div>
      </footer>
    </div>
  );
}
