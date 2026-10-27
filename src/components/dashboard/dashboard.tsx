"use client";

import { SearchField, TellerMenu } from "@/components/shell/top-actions";
import { useTeller } from "@/components/teller/machine";
import { SoundToggle, useTellerSound } from "@/components/teller/sound";
import { TellerStage } from "@/components/teller/teller-stage";
import { AskBar, QuestionChips, TellerBubble } from "@/components/teller/conversation";
import { cn } from "@/lib/utils";
import { ActivityList } from "./activity-list";
import { Balance } from "./balance";
import { CardPreview } from "./card-preview";
import { QuickActions } from "./quick-actions";

export function Dashboard() {
  const teller = useTeller();
  const sound = useTellerSound();
  const answering = teller.state.status === "talking";

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:flex-row">
      {/* Stage */}
      <section className="@container relative isolate flex min-h-[92svh] min-w-0 flex-1 flex-col px-5 pt-[50svh] pb-6 sm:px-8 lg:min-h-0 lg:px-10 lg:pt-[calc(max(33vh,200px)-50px)] lg:pb-7 xl:px-12">
        <TellerStage state={teller.state} sound={sound} onClipEnded={teller.onClipEnded} className="-z-10 bottom-auto h-[78svh] lg:bottom-0 lg:h-auto" />
        <SoundToggle sound={sound} className="absolute top-4 left-5 z-10 sm:left-8 lg:top-7 lg:left-10 xl:left-12" />

        {/* 150px lower on desktop, eased off on short windows so the chips and ask bar stay on screen */}
        <Balance className="mt-auto lg:mt-[clamp(0px,calc(100vh-840px),150px)]" />

        <div className="relative mt-8 flex flex-col gap-3 lg:mt-auto lg:ml-[10%] xl:ml-[16%]">
          {/* On desktop an answer sits over the chips and ask bar (it has its own close button),
              so it only overlaps Bella a little. The greeting and "thinking" stay above them. */}
          <TellerBubble
            state={teller.state}
            onClose={teller.dismiss}
            className={cn(
              "w-full max-w-[460px] lg:absolute lg:flex",
              answering ? "lg:inset-x-0 lg:bottom-0 lg:z-20 lg:max-w-none lg:[&>*]:w-full" : "lg:right-0 lg:bottom-full lg:mb-3 lg:justify-end",
            )}
          />
          <div
            className={cn(
              "flex flex-col gap-3 transition-opacity duration-300",
              answering && "lg:pointer-events-none lg:opacity-0",
            )}
          >
            <QuestionChips state={teller.state} onAsk={teller.ask} />
            <AskBar />
          </div>
        </div>
      </section>

      {/* Right rail */}
      <aside className="relative z-10 flex w-full shrink-0 flex-col gap-4 [&>*]:shrink-0 px-4 pb-6 sm:px-6 lg:w-[380px] lg:overflow-y-auto lg:py-6 lg:pr-6 lg:pl-0 xl:w-[480px] xl:gap-5">
        <div className="hidden items-center gap-4 lg:flex">
          <SearchField />
          <TellerMenu />
        </div>
        <QuickActions />
        <CardPreview />
        <ActivityList />
      </aside>
    </div>
  );
}
