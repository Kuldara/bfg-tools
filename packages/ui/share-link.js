/* ------------------------------------------------- fleets to a phone ---- */
/* The saved fleets go to a phone as text or as a link (user 19.10.2026:
   "export could also be plain copy-paste ... a button that takes everything,
   or one fleet, to a phone with a QR code"). The link carries the fleet
   itself - the document deflated and base64url'd after #fleet= - so nothing
   is uploaded anywhere; Gothic Fleet Play opens it and keeps the fleet on its
   own list. Play makes its own "to phone" link with these same functions
   (it imports this module), so the two cannot drift apart. */
export const PHONE_LINK = {
  /* where a phone opens a link made on a disk or on localhost - it reaches
     neither: the published builder (J236: a phone link opens the builder,
     not the play page) */
  builder: "https://bfgtools.kuldare.com/",
  play: "https://bfgtools.kuldare.com/play/Gothic%20Fleet%20Play.html"
};
export function b64url(bytes){
  let s = ""; for(let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
/* The link's fleet: a fleet document - one list, or the whole save with its
   kept fleets - as JSON, deflated where the browser can (#fleet=), as it is
   where it cannot (#fleetj=). */
export async function packFleet(doc){
  const bytes = new TextEncoder().encode(JSON.stringify(doc));
  if(typeof CompressionStream === "function"){
    const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return "fleet=" + b64url(new Uint8Array(await new Response(st).arrayBuffer()));
  }
  return "fleetj=" + b64url(bytes);
}
/* The link's fleet back out of its #fleet= / #fleetj= text: the play page
   opens a phone link with it, and the builder too when a link is opened
   there (the fleets go into Saved fleets). */
export function unb64url(t){
  const s = atob(String(t).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(t).length + 3) % 4));
  const b = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
export async function unpackFleet(frag){
  const m = /^(fleetj?)=([A-Za-z0-9_-]+)/.exec(frag);
  if(!m) throw new Error("no fleet in the link");
  let bytes = unb64url(m[2]);
  if(m[1] === "fleet"){
    if(typeof DecompressionStream !== "function") throw new Error("this browser cannot open a packed link - update it, or use the fleet file");
    const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(st).arrayBuffer());
  }
  return new TextDecoder().decode(bytes);
}
