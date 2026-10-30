"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { personaById, type Persona } from "@/lib/personas";

const STORAGE_KEY = "sexy-wallet:persona";

const PersonaContext = createContext<{ persona: Persona; choose: (id: string) => void }>({
  persona: personaById(null),
  choose: () => {},
});

/** The active teller, remembered per browser. */
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setId(localStorage.getItem(STORAGE_KEY));
    } catch {}
  }, []);

  const choose = useCallback((next: string) => {
    setId(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return <PersonaContext.Provider value={{ persona: personaById(id), choose }}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  return useContext(PersonaContext);
}
