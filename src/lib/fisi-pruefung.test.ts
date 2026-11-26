// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { FISI, topicMapFor } from "@/content/catalog";
import { FISI_AUFGABEN, FISI_UEB } from "@/content/fisi/aufgaben";
import { UE } from "./aufgaben";
import { asState, fisiAufgaben, pickFisiMC, startFisiRun } from "./fisi-pruefung";
import { realStats, setGot, teilInfo } from "./pruefung";
import { blank } from "./state";
import { cleanFisi, useFisi } from "@/store/fisi-lernen";
import { useLearningArea } from "@/store/learning-area";
import { useProgress } from "@/store/progress";
import { usePruefung } from "@/store/pruefung";

describe("FISI-Aufgaben (Szenarien im Prüfungsstil)", () => {
  it("je Teil vier Aufgaben mit zusammen 100 Punkten, Teilaufgaben mit Musterlösung", () => {
    (["Teil 1", "Teil 2"] as const).forEach((teil) => {
      const l = FISI_AUFGABEN.filter((a) => a.teil === teil);
      expect(l, teil).toHaveLength(4);
      expect(l.reduce((n, a) => n + a.teile.reduce((m, t) => m + t.p, 0), 0), teil).toBe(100);
      l.forEach((a) => {
        expect(a.teile.reduce((m, t) => m + t.p, 0), a.id).toBe(25);
        expect(a.situation.length, a.id).toBeGreaterThan(40);
        a.teile.forEach((t, i) => { expect(t.a.length, `${a.id}${i}`).toBeGreaterThanOrEqual(2); expect(t.p, `${a.id}${i}`).toBeGreaterThanOrEqual(3); });
      });
    });
  });
  it("IDs sind eindeutig und kollidieren nicht mit FIAE-Aufgaben (gemeinsamer Timer-Schlüssel)", () => {
    const ids = FISI_AUFGABEN.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(UE[id], id).toBeUndefined());
  });
  it("Aufgaben-Ansicht: Text mit Punkten je Teilaufgabe, Punkte und Zeit stimmen", () => {
    expect(FISI_UEB).toHaveLength(8);
    FISI_UEB.forEach((u) => {
      expect(u.max).toBe(25);
      expect(u.text).toContain("a) ");
      expect(u.text).toMatch(/\(\d+ P\.\)/);
      expect(u.loesung).toContain("•");
    });
  });
  it("Rechenwerte der Musterlösungen stimmen", () => {
    const sol = (id: string) => FISI_UEB.find((u) => u.id === id)!.loesung;
    expect(sol("FK1")).toContain("37,03 TB"); // 28 TB × 1,15²
    expect(28 * 1.15 * 1.15).toBeCloseTo(37.03, 2);
    expect(sol("FK1")).toContain("90 Minuten"); // 1.350 Wh ÷ 900 W = 1,5 h
    expect(sol("FK3")).toContain("8,76 Stunden"); // 0,1 % von 8.760 h
    expect(sol("FN1")).toContain("1.022"); // /22
    expect(sol("FN4")).toContain("18,1"); // 867 × 0,5 ÷ 24
    expect((867 * 0.5) / 24).toBeCloseTo(18.06, 1);
  });
});

describe("FISI-Prüfung", () => {
  it("Real-Klausur: vier Aufgaben, 100 Punkte, mit Situation", () => {
    (["t1", "t2"] as const).forEach((t) => {
      const auf = fisiAufgaben(t);
      expect(auf).toHaveLength(4);
      auf.forEach((a) => expect(a.intro).toBeTruthy());
      const r = startFisiRun(blank(), "real", t);
      expect(r).toMatchObject({ mode: "real", teil: t, area: "fisi", total: 90 * 60000, phase: "write" });
      expect(realStats(r).total).toBe(100);
      expect(new Set(realStats(r).all.map((i) => i.id)).size).toBe(realStats(r).all.length);
    });
  });
  it("Simulation: 30 Auswahlfragen aus dem gewählten FISI-Teil", () => {
    const TP = topicMapFor("fisi"), mcIds = new Set(FISI.questions.filter((q) => q.type === "mc").map((q) => q.id));
    (["t1", "t2"] as const).forEach((t) => {
      const qs = pickFisiMC(blank(), t, 30);
      expect(qs).toHaveLength(30);
      expect(new Set(qs.map((q) => q.id)).size).toBe(30);
      qs.forEach((q) => {
        expect(mcIds.has(q.id), q.id).toBe(true);
        expect(TP[q.topic].teil).toBe(t === "t1" ? "Teil 1" : "Teil 2");
        expect(q.opts.length).toBeGreaterThanOrEqual(2);
        expect(q.right).toBeGreaterThanOrEqual(0);
      });
    });
  });
  it("Teilbezeichnung je Bereich", () => {
    expect([teilInfo({ teil: "t1" }).k, teilInfo({ area: "fisi", teil: "t1" }).k, teilInfo({ area: "fisi", teil: "t2" }).k]).toEqual(["Planen", "Konzeption & Administration", "Netzwerke"]);
  });
});

describe("FISI-Speicher getrennt vom Lernstand", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgress.getState().resetAll();
    useFisi.getState().reset();
    usePruefung.getState().close();
    useLearningArea.setState({ area: "fisi" });
  });

  it("Punkte werden begrenzt gespeichert, Ursache setzen und wieder entfernen", () => {
    useFisi.getState().saveUeb("FK1", "99");
    expect(useFisi.getState().F.ueb.FK1.p).toBe(25);
    useFisi.getState().saveUeb("FK1", "18.5");
    expect(useFisi.getState().F.ueb.FK1).toMatchObject({ p: 18.5, n: 2 });
    useFisi.getState().setUebCause("FK1", "zeit");
    expect(useFisi.getState().F.ueb.FK1.cause).toBe("zeit");
    expect(useFisi.getState().F.errlog[0]).toMatchObject({ src: "ueb", pts: 6.5, cause: "zeit" });
    useFisi.getState().setUebCause("FK1", "zeit");
    expect(useFisi.getState().F.ueb.FK1).not.toHaveProperty("cause");
    expect(useProgress.getState().S.ueb).toEqual({}); // Lernstand bleibt unberührt
    expect(JSON.parse(localStorage.getItem("tap2coach-fisi")!).ueb.FK1.p).toBe(18.5);
    useFisi.getState().saveUeb("FK1", "abc");
    expect(useFisi.getState().F.ueb.FK1.p).toBe(18.5);
    useFisi.getState().saveUeb("gibtsnicht", "5");
    expect(useFisi.getState().F.ueb).not.toHaveProperty("gibtsnicht");
  });

  it("beschädigte Daten werden entschärft", () => {
    const F = cleanFisi({ ueb: { FK1: { p: "x", at: "morgen", cause: "<b>" }, __proto__: { p: 1 } }, runs: [{ mode: "real", teil: "t1", pct: 500 }, { mode: "<x>", teil: "t1" }, 5], errlog: "nein" });
    expect(F.ueb.FK1).toMatchObject({ p: 0 });
    expect(F.ueb.FK1).not.toHaveProperty("cause");
    expect(F.runs).toHaveLength(1);
    expect(F.runs[0].pct).toBe(100);
    expect(F.errlog).toEqual([]);
    expect(cleanFisi("müll")).toEqual({ ueb: {}, runs: [], errlog: [] });
  });

  it("Simulation: Antworten zählen im Lernstand, das Ergebnis liegt nur im FISI-Speicher", () => {
    usePruefung.getState().start("sim", "t2");
    const r = usePruefung.getState().run!;
    expect(r.area).toBe("fisi");
    usePruefung.getState().patch((x) => ({ ...x, qs: x.qs!.map((q) => ({ ...q, pick: q.right })) }));
    usePruefung.getState().submit(false);
    expect(usePruefung.getState().run!.pct).toBe(100);
    expect(useProgress.getState().S.runs).toEqual([]);
    expect(useFisi.getState().F.runs).toHaveLength(1);
    expect(useFisi.getState().F.runs[0]).toMatchObject({ mode: "sim", teil: "t2", pct: 100, note: 1 });
    expect(Object.keys(useProgress.getState().S.q)).toHaveLength(30);
    expect(Object.keys(useProgress.getState().S.q).every((id) => id.startsWith("fisi:"))).toBe(true);
  });

  it("Real-Klausur: bewerten und speichern, Fehlerursache und Löschen im FISI-Speicher", () => {
    usePruefung.getState().start("real", "t1");
    usePruefung.getState().submit(false);
    expect(usePruefung.getState().run!.phase).toBe("grade");
    usePruefung.getState().patch((x) => { let r = x; r.auf!.forEach((a, ai) => a.items.forEach((it, ii) => { r = setGot(r, ai, ii, ai === 0 && ii === 0 ? it.p - 2 : it.p); })); return { ...r, auf: r.auf!.map((a, ai) => ai === 0 ? { ...a, items: a.items.map((it, ii) => ii === 0 ? { ...it, cause: "wissen" } : it) } : a) }; });
    usePruefung.getState().finish();
    const F = useFisi.getState().F;
    expect(usePruefung.getState().run!.phase).toBe("done");
    expect(F.runs).toHaveLength(1);
    expect(F.runs[0]).toMatchObject({ mode: "real", teil: "t1", pct: 98, note: 1, detail: "98/100 P" });
    expect(F.errlog).toHaveLength(1);
    expect(F.errlog[0]).toMatchObject({ src: "real", pts: 2, cause: "wissen" });
    expect(useProgress.getState().S.runs).toEqual([]);
    expect(useProgress.getState().S.errlog).toEqual([]);
    usePruefung.getState().deleteRun(F.runs[0].ts!);
    expect(useFisi.getState().F.runs).toEqual([]);
  });

  it("Zurücksetzen löscht auch den FISI-Speicher", async () => {
    useFisi.getState().saveUeb("FN2", "10");
    useProgress.getState().resetAll();
    await new Promise((r) => setTimeout(r, 20)); // der FISI-Store wird nachgeladen
    expect(useFisi.getState().F.ueb).toEqual({});
    expect(localStorage.getItem("tap2coach-fisi")).toBeNull();
  });

  it("asState überträgt nur Aufgaben, Ergebnisse und Fehlerprotokoll", () => {
    const F = { ueb: { FK1: { p: 3, at: "2026-11-01" } }, runs: [], errlog: [] };
    expect(asState(F)).toMatchObject({ v: 7, q: {}, ueb: F.ueb });
  });
});
