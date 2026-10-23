import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "@/components/shell/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";
import { CardView } from "@/components/card/card-view";
import { SendFlow } from "@/components/send/send-flow";
import { MemoryRouter, useRouterCtx } from "./shims/router";
import "./styles.css";

function Routes() {
  const { loc } = useRouterCtx();
  const page = loc.path === "/card" ? <CardView /> : loc.path === "/send" ? <SendFlow /> : <Dashboard />;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.path + loc.search}
        className="h-full"
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {page}
      </motion.div>
    </AnimatePresence>
  );
}

createRoot(document.getElementById("root")!).render(
  <MemoryRouter>
    <AppShell>
      <Routes />
    </AppShell>
  </MemoryRouter>,
);
