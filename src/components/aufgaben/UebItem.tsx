/** Zeile einer Übungsaufgabe (button.ueb-item der Live-App) – in der Aufgabenliste und auf der Themenseite. fisi: Aufgabe und Punkte aus dem FISI-Speicher. */
import { UE, uebChip } from "@/lib/aufgaben";
import { fisiUE } from "@/lib/fisi-pruefung";
import { tcolOf } from "@/lib/lernen";
import { useFisi } from "@/store/fisi-lernen";
import { useProgress } from "@/store/progress";

export function UebItem({ id, onOpen, fisi }: { id: string; onOpen: (id: string) => void; fisi?: boolean }) {
  const u = (fisi ? fisiUE : UE)[id], r = useProgress((s) => s.S.ueb[id]), rf = useFisi((s) => s.F.ueb[id]), rec = fisi ? rf : r;
  if (!u) return null;
  return (
    <button type="button" className={`ueb-item t-${tcolOf(u.teil)}`} onClick={() => onOpen(id)}>
      <span className="id">{u.id}</span>
      <span><span className="t">{u.titel}</span><br /><span className="sub">{u.teil} · {u.max} P · ca. {u.min} Min.</span></span>
      <span className="r">{rec ? <span className={`chip ${uebChip(rec.p, u.max)}`}><span className="d" />{rec.p}/{u.max}</span> : <span className="chip">offen</span>}</span>
    </button>
  );
}
