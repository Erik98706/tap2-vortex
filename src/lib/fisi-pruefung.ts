/**
 * FISI-Prüfung und -Aufgaben: baut aus den Szenario-Aufgaben (content/fisi/aufgaben.ts) die Real-Klausur und die
 * Aufgabenliste und wählt die Fragen der Simulation. Punkte und Ergebnisse liegen getrennt vom Lernstand der
 * Live-App (store/fisi-lernen.ts, Schlüssel tap2coach-fisi), damit FIAE-Ergebnisse und das Format v7 unberührt bleiben.
 */
import { FISI, topicMapFor } from "@/content/catalog";
import { FISI_AUFGABEN, FISI_UEB, type FisiAufgabe } from "@/content/fisi/aufgaben";
import type { Aufgabe, McQuestion } from "@/content/schema";
import { SIM_MIN, pickFrom, type Mode, type PkRun, type RealAuf } from "./pruefung";
import { blank, type ErrEntry, type Run, type State, type UebRec } from "./state";

export const FISI_TEIL_NAME = { t1: "Teil 1", t2: "Teil 2" } as const;
export const fisiUE: Record<string, Aufgabe> = Object.fromEntries(FISI_UEB.map((u) => [u.id, u]));
const LETTERS = "abcdefgh";

/** Eigener Speicherstand der FISI-Aufgaben und -Prüfungen (Format wie die gleichnamigen Teile von State) */
export type FisiData = { ueb: Record<string, UebRec>; runs: Run[]; errlog: ErrEntry[] };
export const blankFisi = (): FisiData => ({ ueb: {}, runs: [], errlog: [] });
/** Für die gemeinsamen Rechenfunktionen (saveUebRec, finishReal …), die auf State arbeiten */
export const asState = (F: FisiData): State => ({ ...blank(), ueb: F.ueb, runs: F.runs, errlog: F.errlog });
export const fromState = (S: State): FisiData => ({ ueb: S.ueb, runs: S.runs, errlog: S.errlog });

const auf = (a: FisiAufgabe): RealAuf => ({
  cat: a.cat, title: a.titel, intro: a.situation,
  items: a.teile.map((t, i) => ({ id: `${a.id}${LETTERS[i]}`, p: t.p, q: t.q, a: t.a.map((x) => "• " + x).join("\n"), schema: false, ans: "", got: null })),
});
/** Die vier Aufgaben eines Prüfungsteils in fester Reihenfolge (zusammen 100 Punkte) */
export const fisiAufgaben = (teil: "t1" | "t2") => FISI_AUFGABEN.filter((a) => a.teil === FISI_TEIL_NAME[teil]).map(auf);

/** 30 Auswahlfragen aus den FISI-Fragen des gewählten Teils, reihum über die Themen */
export function pickFisiMC(S: State, teil: string, n: number) {
  const TP = topicMapFor("fisi"), name = FISI_TEIL_NAME[teil as "t1" | "t2"];
  const pool = FISI.questions.filter((q): q is McQuestion => q.type === "mc" && TP[q.topic]?.teil === name);
  return pickFrom(S, pool, n, true);
}
export function startFisiRun(S: State, mode: Mode, teil: string, now = Date.now()): PkRun {
  const t = teil === "t2" ? "t2" : "t1";
  if (mode === "sim") return { mode, teil: t, area: "fisi", qs: pickFisiMC(S, t, 30), i: 0, total: SIM_MIN[t] * 60000, used: 0, start: now, on: true, phase: "write" };
  return { mode: "real", teil: t, area: "fisi", auf: fisiAufgaben(t), total: 90 * 60000, used: 0, start: now, on: true, phase: "write" };
}
