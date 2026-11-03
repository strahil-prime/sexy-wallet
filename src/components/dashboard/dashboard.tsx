"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { LayoutGrid, Sparkles } from "lucide-react";

import { ProfileAvatar, SearchField, TellerMenu } from "@/components/shell/top-actions";
import { useTeller } from "@/components/teller/machine";
import { usePersona } from "@/components/teller/persona";
import { SoundToggle, useTellerSound } from "@/components/teller/sound";
import { TellerStage } from "@/components/teller/teller-stage";
import { AskBar, QuestionChips, TellerBubble } from "@/components/teller/conversation";
import type { Persona } from "@/lib/personas";
import { cn } from "@/lib/utils";
import { ActivityList } from "./activity-list";
import { Balance } from "./balance";
import { CardPreview } from "./card-preview";
import { Overview } from "./overview";
import { QuickActions } from "./quick-actions";

type View = "assistant" | "dashboard";

/**
 * Home: the left side switches between the Assistant (the teller) and the Dashboard (the wallet
 * at a glance); the right rail stays the same in both.
 */
export function Dashboard() {
  const { persona } = usePersona();
  const [view, setView] = useState<View>("assistant");
  const tabs = <ViewTabs view={view} onChange={setView} />;

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:flex-row">
      {view === "assistant" ? (
        // A new teller starts fresh (greeting once per visit, see useTeller).
        <Assistant key={persona.id} persona={persona} tabs={tabs} />
      ) : (
        <section className="@container relative min-w-0 flex-1 px-4 pt-4 pb-8 sm:px-8 lg:overflow-y-auto lg:px-10 lg:pt-7 lg:pb-7 xl:px-12">
          {tabs}
          <div className="mt-5 lg:mt-6">
            <Overview onAsk={() => setView("assistant")} />
          </div>
        </section>
      )}

      {/* Right rail */}
      <aside className="relative z-10 flex w-full shrink-0 flex-col gap-4 [&>*]:shrink-0 px-4 pb-6 sm:px-6 lg:w-[380px] lg:overflow-y-auto lg:py-6 lg:pr-6 lg:pl-0 xl:w-[480px] xl:gap-5">
        <div className="hidden items-center gap-4 lg:flex">
          <SearchField />
          <ProfileAvatar />
        </div>
        <QuickActions />
        <CardPreview />
        <ActivityList />
      </aside>
    </div>
  );
}

const views = [
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
] as const;

function ViewTabs({ view, onChange, className }: { view: View; onChange: (v: View) => void; className?: string }) {
  return (
    <div role="tablist" aria-label="Home view" className={cn("glass inline-flex h-10 items-center gap-0.5 rounded-full p-1", className)}>
      {views.map((v) => {
        const on = view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(v.id)}
            className={cn(
              "focus-ring relative flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors",
              on ? "text-ink-950" : "text-fog hover:text-white",
            )}
          >
            {on && (
              <motion.span
                layoutId="home-view-tab"
                className="absolute inset-0 rounded-full bg-white shadow-[0_6px_18px_-8px_rgb(255_255_255/0.6)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <v.icon className="relative size-4" strokeWidth={1.9} />
            <span className="relative">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Assistant({ persona, tabs }: { persona: Persona; tabs: React.ReactNode }) {
  const teller = useTeller(persona);
  const sound = useTellerSound();
  const answering = teller.state.status === "talking";
  const askRef = useRef<HTMLDivElement>(null);

  // On phones the answer pushes the ask bar down; once the card has swapped in, bring the bar into view.
  useEffect(() => {
    if (!answering || !window.matchMedia("(max-width: 1023px)").matches) return;
    const t = window.setTimeout(() => askRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 650);
    return () => window.clearTimeout(t);
  }, [answering]);

  return (
    <section className="@container relative isolate flex min-h-[92svh] min-w-0 flex-1 flex-col px-5 pt-[50svh] pb-6 sm:px-8 lg:min-h-0 lg:px-10 lg:pt-[calc(max(33vh,200px)-50px)] lg:pb-7 xl:px-12">
      <TellerStage
        persona={persona}
        state={teller.state}
        sound={sound}
        onClipEnded={teller.onClipEnded}
        className="-z-10 bottom-auto h-[78svh] lg:bottom-0 lg:h-auto"
      />
      <div className="absolute top-4 left-5 z-10 sm:left-8 lg:top-7 lg:left-10 xl:left-12">{tabs}</div>
      {/* Teller controls sit on the right of the video, next to the search field on desktop */}
      <div className="absolute top-4 right-5 z-10 flex items-center gap-3 sm:right-8 lg:top-7 lg:right-6 xl:right-8">
        <SoundToggle sound={sound} />
        <TellerMenu align="end" />
      </div>

      {/* 150px lower on desktop, eased off on short windows so the chips and ask bar stay on screen */}
      <Balance className={cn("mt-auto lg:mt-[clamp(0px,calc(100vh-840px),150px)]", answering && "max-lg:hidden")} />

      <div className={cn("relative mt-8 flex flex-col gap-3 lg:mt-auto lg:ml-[10%] xl:ml-[16%]", answering && "max-lg:mt-0")}>
        {/* An answer covers the quick buttons (it has its own close button) and grows upward over
              Bella a little, while the ask bar below stays visible. The greeting and "thinking" sit
              above the buttons. On phones the answer instead takes the place of the balance and
              buttons, so it starts where "Total balance" was and keeps clear of Bella's face. */}
        <div className="relative flex flex-col gap-3">
          <TellerBubble
            persona={persona}
            state={teller.state}
            onClose={teller.dismiss}
            className={cn(
              "absolute flex w-full",
              answering ? "inset-x-0 bottom-0 z-20 max-lg:static [&>*]:w-full" : "bottom-full mb-3 max-w-[460px] lg:right-0 lg:justify-end",
            )}
          />
          <QuestionChips
            persona={persona}
            state={teller.state}
            onAsk={teller.ask}
            className={cn("transition-opacity duration-300", answering && "pointer-events-none opacity-0 max-lg:hidden")}
          />
        </div>
        <div ref={askRef} className="max-lg:scroll-mb-[88px]">
          <AskBar />
        </div>
      </div>
    </section>
  );
}
