/* The numbers the Registry advertises (page description, link preview, OG
   image): fleet lists, ship profiles and printable cards, counted from the data.

   A card is a list row with a ship profile. Planetary defences are one price
   list (Fleets p. 499) added as the last section of every fleet list, so the
   same rows repeat on about thirty lists; each different defence card is
   counted once - a Space station is the same card whatever the list. Rows of
   other sections count per list: the same hull on another list has another
   price and other upgrades, so it is another card.

   Until October 2026 the page description used this rule and the OG image's
   alt text a second one that counted every defence row (738 vs 1102 cards on
   the same page), and the OG image itself said 460. One rule, here, for all.

   node apps/registry/counts.js   prints the numbers as JSON */
"use strict";
const fs = require("fs"), path = require("path");

function counts(D) {
  const isDefence = sec => sec.ct === "defence";
  let cards = 0;
  const defenceCards = new Set();
  for (const L of D.lists) for (const sec of L.secs) for (const e of sec.ents) {
    const profile = e.r && D.ships[String(e.r)];
    if (!isDefence(sec)) { if (profile) cards++; continue; }
    if (profile) defenceCards.add("profile:" + e.r);
    else if (e.k === "unit" && e.rc) defenceCards.add("rule:" + e.rc);
  }
  return { lists: D.lists.length, profiles: Object.keys(D.ships).length, cards: cards + defenceCards.size };
}

module.exports = { counts };

if (require.main === module) {
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8"));
  console.log(JSON.stringify(counts(D)));
}
