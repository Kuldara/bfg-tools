import { v0 } from "./data.js";
import { esc } from "./helpers.js";

/* ---------------------------------------------------------------- Open the original (0.16)
   Owner 25.10.: "could the page also show each scenario's original source? ... view original or so" and after the
   recommendation "yes, do as you recommend". The link goes where the authors or the community share their work
   themselves: Remastered and Warp Rift 1–47 at specialist-arms.com as direct PDFs (#page opens the scenario's page), fan
   supplements to the community's BFG Scenario Listing Drive files (PDD and Starblade horizon's own shares). The app shares
   no excerpts: GW's old publications have no legal place of distribution (no link), Book of the Void is on horizon's
   public Google Drive (link still missing), Warp Rift 48–49 are coming to specialist-arms.com (horizon 25.10.): once they
   are there, raise ORIG's limit 47 -> 49 (warpriftNN.pdf, check for 200). Page numbers are already PDF pages (Sources). */
export const SA = "https://www.specialist-arms.com/bfg/";
export const DRIVE = id => "https://drive.google.com/file/d/" + id + "/view";
const FL_V36 = [[1, 0], [29, 1], [32, 0], [123, -1], [124, 0], [138, -10], [155, -9], [157, -10], [180, -11], [183, -12],
  [184, -10], [248, -8], [250, -6], [252, -4], [254, -2], [313, 6], [314, 2], [336, -24], [340, -2], [423, -1], [425, -2],
  [426, 0], [444, -1], [450, 0], [528, 8]];
export const flV36 = p => { let d = 0; FL_V36.forEach(r => { if(p >= r[0]) d = r[1]; }); return p + d; };
export const ORIG = [
  { rx: /^RB p\. (\d+)/, u: p => SA + "BFG-Remastered-Official-Rulebook-v1-10.pdf#page=" + p, n: "Rulebook v1.10", pdf: 1 },
  /* specialist-arms.com hosts Fleets v0.36 (checked 29.10.2026), while the citations are v0.40 pages:
     the link opens the v0.36 page with the same text ([from v0.40 page, add]; the Eldar scenario
     p.336-339 was p.312-315, Yriel p.313 was p.319). Drop the mapping when v0.40 is hosted. */
  { rx: /^FL p\. (\d+)/, u: p => SA + "BFG-Remastered-Official-Fleets_WIP.pdf#page=" + flV36(+p), n: "Fleets v0.36 (the same text)", pdf: 1 },
  { rx: /^Warp Rift (\d+), (?:printed pp?\. [\d–]+ \(PDF (\d+)|pp?\. (\d+))/, wr: 1, n: "Warp Rift", pdf: 1 },
  { rx: /^Project Distant Darkness p\. (\d+)/, u: () => DRIVE("0B-aXA8fc5AQ8aTlYYWtnNkpEazg") + "?resourcekey=0-VwmvzCfrBt72PszUTtBPOg", n: "Project Distant Darkness" },
  { rx: /^The Art of Command p\. (\d+)/, u: () => DRIVE("0B-aXA8fc5AQ8MTRlMzdjMjgtMDhiNy00YTg2LTk0ODctZTllZDgwNmZjN2Ix") + "?resourcekey=0-e1GpRD5XVXzowOpTLeo_4g", n: "The Art of Command" },
  { rx: /^Distant Sun p\. (\d+)/, u: () => DRIVE("0B-aXA8fc5AQ8ZERPdFZFdWo4bjQ") + "?resourcekey=0-ZdoCoQcMOwAgim-12MBr3g", n: "Distant Sun" },
  { rx: /^Starblade p\. (\d+)/, u: () => DRIVE("0B-aXA8fc5AQ8Y2NlZWZiNzctZjNiMS00ZDgzLTljOTAtNzhkYzc4MmM0N2U0") + "?resourcekey=0-hipeWtkU0VQb1lXq4A9ZBQ", n: "Starblade" },
  { rx: /^Book of Nemesis p\. (\d+)/, u: () => DRIVE("1d0tiRbwM1cXLEUgMWzdqn8h4OYTojL8r"), n: "Book of Nemesis" },
  { rx: /^Tournament Mission Pack p\. (\d+)/, u: () => DRIVE("122hobXZjE18hAs1ik6gp9dV8T6wFwQhg"), n: "Tournament Mission Pack" },
  { rx: /^Advanced Scenarios p\. (\d+)/, u: () => DRIVE("1aJAaIlSXu7rEP6Dtf9-eEgKR0QquOzGk"), n: "Advanced Scenarios" }
];
/* the scenario's sources as links: [{ n, p, url, pdf }]; empty if there is no place of distribution */
export function origLinks(sc) {
  const out = [];
  for (const part of String(sc.src || "").split(" · ")) {
    for (const o of ORIG) {
      const m = o.rx.exec(part.trim());
      if (!m) continue;
      if (o.wr) {
        const n = +m[1], p = +(m[2] || m[3]);
        if (n >= 1 && n <= 47) out.push({ n: "Warp Rift " + n, p, url: SA + "warprift/warprift" + String(n).padStart(2, "0") + ".pdf#page=" + p, pdf: 1 });
      } else out.push({ n: o.n, p: +m[1], url: o.u(+m[1]), pdf: !!o.pdf });
      break;
    }
  }
  return out;
}
export function origHtml(sc) {
  const ls = origLinks(sc);
  if (!ls.length) return "";
  return " · " + ls.map(x => "<a class='orig' href='" + x.url + "' target='_blank' rel='noopener'>" + (ls.length > 1 ? "Open " + esc(x.n) : "Open the original") + ", p. " + x.p + " ↗</a>").join(" · ");
}
