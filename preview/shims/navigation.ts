import { useMemo } from "react";
import { useRouterCtx } from "./router";

export function usePathname() {
  return useRouterCtx().loc.path;
}
export function useSearchParams() {
  const { search } = useRouterCtx().loc;
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useRouter() {
  const { navigate } = useRouterCtx();
  return { push: (h: string) => navigate(h), replace: (h: string) => navigate(h, true), back: () => navigate("/") };
}
