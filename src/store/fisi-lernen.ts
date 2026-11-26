/**
 * FISI-Aufgaben und -Prüfungen: Punkte, Ergebnisse und Fehlerursachen, lokal unter tap2coach-fisi.
 * Bewusst getrennt vom Lernstand (S.ueb/S.runs, Format v7 der Live-App): So vermischen sich FISI- und FIAE-Ergebnisse
 * nicht, und die Live-App sieht keine unbekannten Prüfungsteile. Antworten auf FISI-Fragen zählen weiter im Lernstand.
 */
import { create } from "zustand";
import { KEYS } from "@/config";
import { parsePts, saveUebRec, setUebCauseRec, type Cause } from "@/lib/aufgaben";
import { asState, blankFisi, fisiUE, fromState, type FisiData } from "@/lib/fisi-pruefung";
import { arr, cleanErr, cleanRun, cleanUeb, isObj, mapObj, type ErrEntry, type Run } from "@/lib/state";

/** Gespeicherten Stand prüfen: unbrauchbare Teile verwerfen, Typen erzwingen */
export function cleanFisi(raw: unknown): FisiData {
  if (!isObj(raw)) return blankFisi();
  return {
    ueb: mapObj(raw.ueb, cleanUeb),
    runs: arr(raw.runs).map(cleanRun).filter(Boolean) as Run[],
    errlog: arr(raw.errlog).map(cleanErr).filter(Boolean) as ErrEntry[],
  };
}
const load = (): FisiData => { try { const t = localStorage.getItem(KEYS.fisi); return t ? cleanFisi(JSON.parse(t)) : blankFisi(); } catch { return blankFisi(); } };

type Store = {
  F: FisiData;
  /** Stand ersetzen und speichern */
  set: (F: FisiData) => void;
  saveUeb: (id: string, raw: string) => void;
  setUebCause: (id: string, c: Cause) => void;
  deleteRun: (ts: number) => void;
  reset: () => void;
};

export const useFisi = create<Store>((set, get) => {
  const save = (F: FisiData) => { try { localStorage.setItem(KEYS.fisi, JSON.stringify(F)); } catch { /* privater Modus */ } set({ F }); };
  return {
    F: typeof window === "undefined" ? blankFisi() : load(),
    set: save,
    saveUeb: (id, raw) => {
      const u = fisiUE[id], p = u ? parsePts(raw, u.max) : null;
      if (u && p != null) save(fromState(saveUebRec(asState(get().F), id, p)));
    },
    setUebCause: (id, c) => {
      const r = setUebCauseRec(asState(get().F), id, c, undefined, fisiUE);
      if (r) save(fromState(r.S));
    },
    deleteRun: (ts) => save({ ...get().F, runs: get().F.runs.filter((x) => x.ts !== ts) }),
    reset: () => { try { localStorage.removeItem(KEYS.fisi); } catch { /* privat */ } set({ F: blankFisi() }); },
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEYS.fisi) { try { useFisi.setState({ F: e.newValue ? cleanFisi(JSON.parse(e.newValue)) : blankFisi() }); } catch { /* fremder Inhalt: ignorieren */ } }
  });
}
