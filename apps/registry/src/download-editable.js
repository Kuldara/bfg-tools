import { $ } from "./boot.js";
import { L } from "./model.js";
import { buildCardSheet } from "./print.js";
import { fitCards } from "./rule-card.js";
import { esc } from "../../../packages/ui/format.js";

/* ---------------------------------------------- Download for editing ----
   The same sheet as a file, where the text can be clicked and typed over. The
   file is self-contained: the CSS and the fitting script come with it, so it
   works without a network and without this application. */

/* The editing host is a whole page, not individual texts. Only this way are
   the titles, the armament name cell and the critical damage rows selectable
   and deletable too - they are elements with children, and so would not be
   leaves. The structure can be broken, and that is intended: the sheet is a
   power user's tool, and a mistake is fixed by downloading again. */
export function markEditable(root){
  root.querySelectorAll(".page").forEach(page => {
    page.setAttribute("contenteditable", "true");
    page.setAttribute("spellcheck", "false");
  });
}

/* The downloaded file's own shell: grey background, pages centred, a toolbar.
   When printing, the shell disappears and exactly the same sheet remains as
   Print cards produces. */
export const EDITOR_CSS = [
  "body{margin:0;background:#3A3634}",
  ".sheet{display:block}",
  ".sheet .page{margin:8mm auto;box-shadow:0 2px 16px rgba(0,0,0,.5)}",
  ".edbar{position:sticky;top:0;z-index:20;background:#211F20;color:#F6F2E9;",
  "  padding:9px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;",
  "  font:500 13px/1.35 'IBM Plex Sans',Arial,sans-serif}",
  ".edbar button{font:600 12px/1 'IBM Plex Sans',Arial,sans-serif;cursor:pointer;",
  "  padding:7px 12px;border:1px solid #6B6769;border-radius:3px;",
  "  background:#2E2A29;color:#F6F2E9}",
  ".edbar button.primary{background:#D1792A;border-color:#D1792A;color:#fff}",
  ".edbar span{color:#B9B3AC;font-weight:400;font-size:12px}",
  ".page[contenteditable]:focus{outline:2px solid #D1792A;outline-offset:2px}",
  ".page[contenteditable]{cursor:text}",
  /* The tick box is not text but drawn by CSS, so it gets its own click
     switch; the cursor says the row can be clicked. */
  ".k-opt .cb,.k-arm .wb,.k-arm .rb{cursor:pointer}",
  "@media print{.edbar{display:none}.sheet .page{margin:0;box-shadow:none}",
  "  body{background:#fff}[contenteditable]{outline:none!important;",
  "  background:transparent!important}}"
].join("\n");

/* The fitting is re-run in the downloaded file after every edit. fitCards
   goes along as source rather than as a copy, so the fitting logic cannot
   drift apart. */
export function editorScript(){
  return [
    /* Its own closure: nothing is left in the global namespace, so the file
       cannot collide with the host page. */
    '(function(){',
    'var $=function(q){return document.querySelector(q)};',
    fitCards.toString(),
    /* A sheet at another card size is fitted at the card's own size, as in
       the builder (fitSheet): the scale comes off for the measuring. */
    'function refit(){',
    '  document.querySelectorAll(".k-hd h3").forEach(function(h){h.style.fontSize="";});',
    '  var sh=document.querySelector(".sheet");',
    '  if(sh)sh.classList.add("nat");',
    '  fitCards();',
    '  if(sh)sh.classList.remove("nat");',
    '}',
    /* The X of a tick is a CSS content value rather than text, so it cannot
       be deleted by typing. A click turns it on and off. */
    'document.addEventListener("click",function(e){',
    '  var b=e.target.closest?e.target.closest(".k-opt .cb,.k-arm .wb,.k-arm .rb"):null;',
    '  if(!b)return;',
    /* A circle is a group choice: one on, its siblings off. */
    '  if(b.classList.contains("rb")){',
    '    var g=b.closest("tbody");',
    '    if(g)[].forEach.call(g.querySelectorAll(".rb"),function(o){',
    '      o.classList.remove("on");});',
    '    b.classList.add("on"); return;',
    '  }',
    '  b.classList.toggle("on");',
    '});',
    'var t=null;',
    'document.addEventListener("input",function(){',
    '  clearTimeout(t); t=setTimeout(refit,220);',
    '});',
    /* Pasted text as plain text: the browser would otherwise push in its own markup. */
    'document.addEventListener("paste",function(e){',
    '  var el=e.target;',
    '  if(!el||!el.getAttribute||!el.getAttribute("contenteditable"))return;',
    '  e.preventDefault();',
    '  var txt=(e.clipboardData||window.clipboardData).getData("text");',
    '  document.execCommand("insertText",false,String(txt).replace(/\\s+/g," "));',
    '});',
    'function saveCopy(){',
    '  var doc="<!DOCTYPE html>\\n"+document.documentElement.outerHTML;',
    '  var a=document.createElement("a");',
    '  a.href=URL.createObjectURL(new Blob([doc],{type:"text/html;charset=utf-8"}));',
    '  a.download=document.title.replace(/[^\\w .-]+/g,"_")+".html";',
    '  document.body.appendChild(a); a.click(); a.remove();',
    '  setTimeout(function(){URL.revokeObjectURL(a.href);},4000);',
    '}',
    'var bar=document.querySelector(".edbar");',
    'if(bar){',
    '  bar.querySelector("[data-act=save]").onclick=saveCopy;',
    '  bar.querySelector("[data-act=print]").onclick=function(){window.print();};',
    '}',
    'refit();',
    'if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refit);',
    '})();'
  ].join("\n");
}

export function downloadEditable(){
  if(!buildCardSheet()) return;
  const css = [...document.querySelectorAll("style")]
    .map(el => el.textContent).join("\n");
  const sheet = $("#sheet").cloneNode(true);
  markEditable(sheet);
  const title = L().nm + " \u2013 fleet cards";
  const bar = '<div class="edbar">' +
    '<button class="primary" data-act="print">Print / Save as PDF</button>' +
    '<button data-act="save">Save edited copy</button>' +
    '<span>Everything on the page is editable \u2014 click and type, or ' +
    'select and delete. Click a tick box to toggle it. The layout re-fits ' +
    'itself after every edit, so nothing overflows. No undo beyond ' +
    'Ctrl+Z: if you break it, download the sheet again. This is a ' +
    'printout, not the builder \u2014 edits do not go back and points are ' +
    'not recalculated.</span>' +
    '</div>';
  const doc = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    "<title>" + esc(title) + "</title>\n" +
    "<style>\n" + css + "\n</style>\n" +
    "<style>\n" + EDITOR_CSS + "\n</style>\n" +
    "</head>\n<body>\n" + bar + "\n" + sheet.outerHTML +
    /* The tags are assembled from pieces. A literal opening tag in the source
       would break the way the tests and the layout audit pick up the
       application code: they split the file on that string and take [1]. */
    "\n<scr" + "ipt>\n" + editorScript() +
    "\n<\/scr" + "ipt>\n</body>\n</html>\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([doc], {type: "text/html;charset=utf-8"}));
  a.download = title.replace(/[^\w .-]+/g, "_") + ".html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

