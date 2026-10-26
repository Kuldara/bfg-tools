# P1-8d · Puhtaat projektiot: kortti, laivastonäkymä, rosteri, Copy list

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen (1–2 pv) · **Vaikutusluokka:** pinnat

**Toteutunut:** `ResolvedUnit` sai `className`, `entry.{price,openPrice,note,badRef,noopt}`,
`mechanicus`, `hull.options[{ref,name,points}]`, `weapons[].stars`, `options[].stars`,
`upgrades[].{description,note,bays}`. Puhtaat projektiot templatessa: `shipCardHTML(R)`,
`armRowsHTML(R)`, `optRowsHTML(R)`, `shipUnitHTML(R, ui, rawFields)`, `rosterRowOf(R)`,
`listLineOf(R)`, `upCostText(up)`; `cardHTML`/`renderFleet`/`printRoster`/`listText`
kutsuvat niitä ratkaisimen kautta, ja `u._mem` on poissa. Komentajat ja listaoptiot
kulkevat vielä `legacyUnitHTML`/`legacyRosterRow`/`legacyListLine`/`optRowsLegacy`-
polkua P1-8e:hen asti. Todistus: 524 kortin + Copy listin tiiviste-snapshot ennen/jälkeen
→ 0 muutosta; `test_domain.js` §10 tarkistaa staattisesti, etteivät projektiot kutsu
`L()`, `SHIPS`, `shipOf`, laskimia tai `DOMAIN`ia. Rich-fixture `rich-tyrant-gothic`
(nimi, note, ±pts, optio + Power Ram) kaikilla pinnoilla; Copy list golden-pinnaksi
(`list_contains`, pisteet ja valinnat ratkaisinta vastaan), `roster_contains`.
Löydös: Tyrantin 45 cm -vaihtorivit nimettiin monikossa (`swaps.py`); sama ase uudella
kantamalla perii nyt korvattavan rivin nimen, kuten kirjan taulukko.

Osa sateenvarjoa [P1-8](P1-8-resolveunit-v1.md). Sulkee katselmoinnin
löydökset "korttirajapinta ei mahdu sopimukseen", "golden-ajurin
pinta-aukot" ja "renderöinti muuttaa intenttiä" (`u._mem`).

## Malli

```text
ResolvedUnit ─→ makeCardViewModel(R, presentation)  ─→ cardHTML(vm)
             ─→ makeFleetRowViewModel(R, ctx)        ─→ renderFleet-rivi
             ─→ makeRosterRow(R)                     ─→ printRoster
             ─→ listLine(R)                          ─→ listText (Copy list)
```

Projektio on puhdas funktio: ei `L()`, ei `SHIPS`, ei `S`, ei DOM. Kaikki,
mitä kortti tarvitsee, tulee `ResolvedUnit`ista tai `presentation`-oliosta:

- listan ja listarivin nimi, perushinta → `R.entry {list, section, label, basePoints}`
- faktio/värit ja lähdesivu → `R.source {page, faction}`; värit ovat
  esitystapa (`presentation.factionCols`)
- optiot tiloineen, hintoineen, määrineen, ryhmineen → `R.options[]`
- listapäivitykset → `R.upgrades[]`
- käyttäjän `name`, `note`, `adjust` → `R.name`, `R.note`, `R.adjust`
- saattueen jäsenten nimet → `R.members[]` (intentistä, ei `u._mem`)
- critical-taulukon rivit, trigger- ja repair-teksti →
  `R.damage.critTable {title, rows, wide, trigger, repair}`
- tähtiviitteet → `R.stars { weapons: {rowIndex: id[]}, options: {...}, rules: [...] }`

Domain-tulos ei sisällä HTML:ää eikä CSS-päätöksiä; renderer ei kysy
katalogilta mitään.

## Järjestys (pinta kerrallaan, jokainen oma commit)

1. **Rich-unit-fixture** golden-tapauksiin: alus, jolla on oma optio
   (`take`), listapäivitys, määrä > 1, nimi, note, adjustment, useita aseita
   ja saattue — kaikki projektiot verrataan **kenttä kentältä** (aserivin
   neljä saraketta + tila + count). Ensin punaisena.
2. Copy list (`listText`) golden-pinnaksi.
3. Rosteri: `makeRosterRow`; ajuri vertaa myös optiot ja päivitykset.
4. Laivastonäkymä: `makeFleetRowViewModel`; `renderFleet` piirtää vm:n.
5. Kortti: `makeCardViewModel` + `cardHTML(vm)`; `u._mem` poistuu;
   `print_check.js` ja `make_fleet_cards.js` ajavat vm-polkua.
6. Golden-ajurin DOM-tynkä kutistuu: pinnat ajetaan projektioista, ei
   `innerHTML`-parsinnasta (paitsi lopullinen HTML-savutesti).

## Valmis kun

- `test_domain.js`: jokainen projektio deepFreeze-syötteillä; intent,
  fleet ja katalogi identtisiä ennen ja jälkeen myös `cardHTML(vm)`-polulla
- rich-fixture vihreä kaikilla neljällä pinnalla
- `cardHTML`, `renderFleet`, `printRoster`, `listText` eivät viittaa
  `L()`, `SHIPS`, `unitPts`, `armModel`, `optState`, `upState`,
  `specialLines`, `criticalModel` (grep-tarkistus `test_domain.js`:ssä)
- `python acceptance.py` vihreä; 462 + 62 kortista 0 muuttui

## Älä tee tässä

- Älä muuta korttien ulkoasua. Projektio tuottaa saman HTML:n.
- Älä lisää uusia korttivariaatioita (jäädytetty).
