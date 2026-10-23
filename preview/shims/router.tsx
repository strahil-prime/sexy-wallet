import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Loc = { path: string; search: string };
const Ctx = createContext<{ loc: Loc; navigate: (href: string, replace?: boolean) => void } | null>(null);

/** In-memory router so the single-file preview works inside the artifact frame. */
export function MemoryRouter({ children }: { children: React.ReactNode }) {
  const [loc, setLoc] = useState<Loc>({ path: "/", search: "" });
  const navigate = useCallback((href: string) => {
    const [path, search = ""] = href.split("?");
    setLoc({ path: path || "/", search });
    document.querySelector("main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(() => ({ loc, navigate }), [loc, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRouterCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("MemoryRouter missing");
  return c;
}
