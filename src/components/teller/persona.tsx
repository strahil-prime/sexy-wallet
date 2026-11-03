"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { personaById, type Persona } from "@/lib/personas";

/** Key used by earlier builds to remember the teller; cleared so every visit starts with Bella. */
const LEGACY_STORAGE_KEY = "sexy-wallet:persona";

const PersonaContext = createContext<{ persona: Persona; choose: (id: string) => void }>({
  persona: personaById(null),
  choose: () => {},
});

/** The active teller. Every visit starts with the default (Bella); a pick lasts until the page is reloaded. */
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
  }, []);

  const choose = useCallback((next: string) => setId(next), []);

  return <PersonaContext.Provider value={{ persona: personaById(id), choose }}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  return useContext(PersonaContext);
}
