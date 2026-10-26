# Domain-sopimus: mikä on ratkaistu alus

Tämä on kirjoitettu ennen toteutusta. Se määrittelee kohteen, jotta
jokainen refaktorointi kulkee samaan suuntaan eikä jokainen agentti keksi
omaansa.

## Ongelma, jonka tämä ratkaisee

Sama alus ratkaistaan tällä hetkellä useassa paikassa, ja paikat ovat eri
mieltä. Golden-ajuri osoittaa sen mitattuna:

```
warsphere-add-2hp-x3   hinta OK   profiili OK   pinnat EI
     PINNAT   hits: ratkaisin=16 laivastonakyma=10
```

Kortti tulostaa 16 osumapistettä, laivastonäkymä näyttää 10. Molemmat
lukevat samaa dataa, mutta eri tavalla: `renderFleet()` piirtää
`sh.hp`-perusarvon, kun kortti käyttää `effHits(u, sh)`. Sama koskee
kilpiä. Tornit tulevat jo efektiivisestä — mikä kertoo, että ero syntyi
epähuomiossa eikä päätöksellä.

Niin kauan kuin profiilikäsityksiä on viisi, jokainen uusi vaikutus on
viisi toteutusta. Se on kerroin, joka tekee 42 mallintamattomasta optiosta
210 muutosta.

## Sopimus

```js
resolveUnit(unit, fleet) -> ResolvedUnit
```

Yksi funktio, joka palauttaa kaiken, mitä aluksesta tarvitsee tietää.
**Jokainen pinta lukee tämän tuloksen. Yksikään pinta ei laske uudelleen.**

```js
ResolvedUnit = {
  ref:      "494",             // profiilisivu
  name:     "",                // pelaajan antama nimi
  hulls:    1,                 // runkoja (saattueessa > 1)

  points:   205,               // lopullinen hinta, valinnat mukaan luettuina
  maxPoints: 245,              // jos kaikki tarjotut valinnat otettaisiin

  stats: {
    type:    "Defence",
    hits:    16,               // efektiivinen, ei sh.hp
    speed:   "15 cm",
    turns:   "45°",
    shields: "3",              // teksti: myös "Holofields", "Shadowfield"
    armour:  "5+",
    turrets: "4",
    turretLabel: "TURRETS",    // tyranideilla "SPORES"
    quadrant: false,           // arvot ovat neljänneskohtaisia (s.501)
  },

  weapons: [                   // rivit; box: null = aina, "on" = valittu,
                               // "open" = tarjolla tyhjänä ruutuna
    { a: [name, range, strength, arc], i, box, alt, grp, extra,
      count: 1 }               // count > 1: sama ase ostettu useaan kertaan
                               // (Hive Ship -sivusetit, Torture-Impalerit);
                               // strength on silloin SUMMA ("3 / 3
                               // squadrons", "12") tai "Special ×2", kun
                               // teksti ei ole summattavissa (P1-6)
  ],

  damage: {
    crippledAt: 8,             // ceil(hits/2), Rulebook s.65
    crippled:   true,          // onko kaistaa lainkaan
    note:       "CRIPPLED: ...", // hulk ja quadrant poikkeavat
    critTable:  "CRITICAL DAMAGE (2D6)",  // taulukon nimi; kortti lukee tämän
                               // eikä päättele faktiosta. Arvot: yleinen,
                               // Tyranid, Necron, Eldar, Dark Eldar,
                               // "ORK HULK CRITICAL HITS (D6)" (P1-5)
  },

  hull: null | {                // pohjarungon valinta (Venerable battle barge,
    chosen:  "61",              // Fleets s.102): valittu profiilisivu ja
    choices: ["52", …, "103"],  // tarjolla olevat; hinta = rungon listahinta
  },                            // + 35, Seditio Opprimere omalla hinnallaan
  options:  [ { text, cost, state, qty, group, blockedBy } ],
  upgrades: [ { label, cost, state, owner } ],
  rules:    [ { text, source } ],   // aluksen omat erikoissäännöt
  warnings: [ "..." ],              // kelvottomat yhdistelmät
}
```

## Säännöt

1. **Yksi lähde.** Kortti, laivastonäkymä, rosteri, Copy list, muokattava
   vienti ja tallennus lukevat kaikki `resolveUnit()`-tulosta. Jos pinta
   tarvitsee jotain, mitä sopimuksessa ei ole, sopimusta laajennetaan —
   pinta ei laske itse.

2. **Esitystapa saa erota, arvo ei.** Kortti saa lyhentää `Shadowfield`
   muotoon `SHADOW`, koska ruutu on kapea. Se on esitystapa. Se ei saa
   näyttää eri lukua.

3. **Ratkaisin on puhdas.** Ei DOM:ia, ei `localStorage`ia, ei
   sivuvaikutuksia. Sen voi ajaa testistä ilman selainta — `test_golden.js`
   tekee juuri niin.

4. **Ratkaisin ei tunne sivunumeroita sääntöinä.** Se soveltaa dataan
   kirjattuja vaikutuksia (`mod`, `swp`, `sw`, `aws`, `qty`). Kirjan
   tulkinta tehdään kerran, `referenssi/`-tiedostoihin — ei koodiin.

## Tila: v0 on tehty (8.9.2026), v1 on seuraava

`resolveUnit(u)` v0 on `app_template.html`:ssä `effTurrets()`:n perässä.
Se on julkisivu nykyisille laskimille: laivastonäkymä, rosteri ja kortti
lukevat sitä. Todistus: 462 kortista 0 muuttui; golden-ajurin
`PINNAT`-sarake on vihreä kaikilla 23 tapauksella.

Kaksi sopimuksen tarkennusta, jotka v0 toi:

- **Yksikkö ilman listariviä ratkeaa.** Puolustus, joka ostetaan listan
  ulkopuolelta (Waystation s.481), on sopimuksen mukainen tila: statsit
  ja aseet ovat, `points` ja `maxPoints` ovat `null`.
- **`stats.turretLabel`** kantaa sarakkeen nimen (`TURRETS` / `SPORES`).
  Pinta ei päättele sitä faktiosta itse.

**v1 — puhdas ratkaisin — on seuraava askel, ei valinnainen.** v0 nojaa
globaaliin `S`-tilaan (`shipOf`, `entOf`, `upState`, `L()`). Tavoite on
`resolveUnit(intent, fleet, catalog)`, jonka voi ajaa ilman `S`:ää:

```js
resolveUnit(
  { ref, name, hulls, options: {…}, quantities: {…}, upgrades: {…} },  // intent
  { list, units, limit },                                              // fleet
  { ships, lists }                                                     // catalog
)
```

Järjestys on kirjattu `docs/BACKLOG.md`:hen: riippumaton katselmointi v0:n
rajapinnasta → sen jälkeen vaikutukset perheittäin (`P1-2`, `P1-3`) →
v1 kun vaikutusperheet ovat paikallaan ja rajapinta on vakiintunut.
Muuten v0 jää pysyväksi "ratkaisimeksi", joka on vain toinen nimi
globaalille tilalle.

## Miksi ei kirjoiteta kokonaan uusiksi

Nykyinen pohja on säilyttämisen arvoinen: 32 laivastolistaa, 171
alusprofiilia, 462 korttia, kymmenen tarkistinta ja noin 289 riviä käsin
kirjasta luettuja korjauksia. Ne ovat projektin arvokkain osa eivätkä ne
synny uudelleenkirjoituksessa vaan katoavat siinä.

`resolveUnit()` rakennetaan **nykyisten funktioiden ympärille**
(`unitPts`, `effHits`, `effShieldsText`, `effTurrets`, `armModel`,
`crippledLine`), ei niiden tilalle. Kun kaikki pinnat lukevat sitä, sisus
voidaan siistiä ilman että yksikään pinta huomaa.

## v1 — tarkennukset ulkoisen katselmoinnin jälkeen (9.9.2026)

Ulkoinen katselmointi (`docs/REVIEW-resolveUnit-v1-Codex.md`) hyväksyi v0:n
ja koventi v1:n sopimuksen. Toteutus on jaettu paketteihin
`tasks/P1-8a…e`. Nämä korvaavat yllä olevan v1-luonnoksen allekirjoituksen.

### Syöte on canonical intent, ei tallenne

```js
CanonicalUnitIntent = {
  schemaVersion: 2,
  entry: { list, section, label } | null,   // NIMET, ei indeksejä; null = listan ulkopuolinen puolustus
  ref:   "279",                              // profiilisivu (string)
  hull:  "61" | null,                        // pohjarunko (Venerable), muuten null
  hulls: 1,                                  // runkoja (saattue > 1)
  name: "", note: "", adjust: 0, custom: null,
  members: [],                               // saattueen jäsenten nimet (kortti lukee tämän, ei u._mem)
  options:  { [optionId]: { state: "take"|"opt"|"off", qty: 1 } },
  upgrades: { [upgradeId]: "take"|"off" },
}
```

`optionId` = sivu + normalisoidun optiotekstin tiiviste, annetaan datassa
(`ol[i].id`, `build_data.py`). `upgradeId` = listan nimi + osion nimi +
rivin nimi (nykyinen `upn`-avain). Indeksit elävät vain adapterissa
(`fromLegacyUnit` / `toLegacyUnit`) ja `load()`:n migraatiossa.

### Allekirjoitus

```js
resolveUnit(intent, unitContext, catalog) -> ResolvedUnit
//   unitContext = { list, entry, sectionIndex, entryIndex, fleetChoices }
//   catalog     = { ships, lists }
resolveFleet(fleetIntent, catalog) -> { units: ResolvedUnit[], issues, totals }   // kohta 8
```

`resolveUnit` ei saa koko `units`-taulukkoa: yksikkö ei tarvitse laivastoa,
laivasto tarvitsee yksiköt. Jos jokin sääntö tarvitsee molemmat, se kuuluu
`resolveFleet`iin, ja suoritusjärjestys on yksiköt → laivasto.

### Tulos

`ResolvedUnit` saa lisäksi:

```js
kind:     "ship" | "commander",
entry:    { list, section, label, basePoints } | null,
source:   { page, faction },
members:  [...],
weapons:  [ { a, i, box, alt, grp, extra, count,
              state: "active" | "offered" | "hidden" } ],   // tila on enum, ei päätelty box-kentästä
options:  [ { id, text, cost, state, qty, group, blockedBy, dependsOn } ],
upgrades: [ { id, label, cost, state, owner, source } ],
issues:   [ { code, severity: "error"|"warning", path, message, sourcePage } ],
damage:   { ..., critTable: { title, rows, wide, trigger, repair } },
stars:    { weapons, options, rules },
leadership: { kind: "fixed"|"modifier", value } | null,   // vain komentaja
rerolls:  [ { label, cost, source } ],                       // vain komentaja
```

`warnings: [string]` poistuu; `issues` korvaa sen.

### Säännöt, jotka lisättiin

5. **Ei aliasointia.** Tulos ei jaa yhtään muokattavaa taulukkoa tai oliota
   intentin, kontekstin tai katalogin kanssa. Testi jäädyttää syötteet
   (`deepFreeze`), yrittää muuttaa tulosta ja todistaa ettei katalogi muutu.
6. **Ei hiljaista korjausta.** `resolveUnit` ja `validateIntent` eivät muuta
   intenttiä. Käyttöliittymän tietoinen vaihto (poissulkeva ryhmä) tehdään
   `transition(intent, action)`-funktiolla, joka palauttaa uuden intentin ja
   `notices`. Kelvoton intent ratkeaa deterministisesti ja saa `issues`-rivin.
7. **Projektiot ovat puhtaita.** `makeCardViewModel(R)`, `makeFleetRowViewModel(R)`,
   `makeRosterRow(R)`, `listLine(R)` eivät lue `L()`:ää, `SHIPS`iä eivätkä
   `S`:ää. Renderer piirtää vm:n. Domain-tulos ei sisällä HTML:ää.
8. **Pariteetti v0:aan on regressio, ei totuus.** Yhteiset semanttiset
   kentät verrataan normalisoidun skeeman läpi kaikilla golden-tapauksilla;
   uudet kentät saavat odotuksensa kirjasta tai käyttöliittymäsopimuksesta.
9. **Domain on oma lähdemoduuli.** `domain.js` upotetaan buildissa yhdeksi
   HTML:ksi; Node-testit `require`vat sen ilman HTML:n pilkkomista.

### Issues, transition ja ilmoitukset (P1-8e)

```js
validateIntent(intent, ctx, catalog) -> Issue[]              // ei muuta syötettä
transition(intent, action, ctx, catalog) -> { intent, notices }   // UI:n tietoinen vaihto
Issue  = { code, severity: "error"|"warning", path, message, sourcePage }
Notice = { code, path, message }
action = { type: "option", id, state } | { type: "quantity", id, qty }
       | { type: "upgrade", id, state } | { type: "hull", ref }
```

Koodit: `option.exclusive`, `option.dependency`, `option.swap_conflict`,
`option.unknown_id`, `upgrade.exclusive`, `upgrade.ineligible` (warning, ei
laskuteta), `upgrade.covered` (warning), `upgrade.unknown_id`, `hull.unknown`,
`ship.unknown`, `entry.unknown`. `error` = valinnat ovat kirjan vastaisia ja
molemmat lasketaan kunnes käyttäjä korjaa; laillisuustarkistus näyttää "Unit
issues" punaisena. Ladattu tai testissä rakennettu kelvoton intent **säilyy
muuttumattomana**; vain `transition` muuttaa valintoja, ja jokainen sen
pudottama valinta raportoidaan `notices`-rivinä, jonka laivastonäkymä näyttää
("Adjusted: …").

### Komentaja (P1-8e)

```js
{ kind: "commander", className, entry, points, maxPoints,
  leadership: { kind: "fixed"|"modifier", value, max } | null,   // build-vaiheessa datasta, ei ajossa parsittu
  rerolls: { included, purchased: [{ id, label, cost, count }], total },
  rules: [{ t, ast: false }], upgrades: [...], options: [], stats: null, weapons: [], damage: null, issues }
```

Rivi ilman runkoa ja ilman komentajaa on `kind: "entry"` (listaoptio rivinä).

### Tila 9.9.2026: P1-8 tehty (a–e)

`domain.js` sisältää adapterin (`fromLegacyUnit`/`toLegacyUnit`), `Selection`-
rakenteen (`selectionOf(intent, ctx, catalog)`), kaikki laskimet (`pointsOf`,
`maxPointsOf`, `weaponRows`, `statMod`/`statSet`, `eff*`, `upgradesFor`, `condOK`,
`requiredUpgradeKeys`…) sekä vaurio- ja sääntömallin (`crippledLine`,
`criticalModel`, `repairLine`, `specialModel`, `specialLines`). Template kutsuu
niitä kuorien kautta. `DOMAIN.resolveUnit(intent, ctx, catalog)` on v1: templaten
`resolveUnit(u)` on pelkkä adapteri (legacy-yksikkö → intent → v1) ja setterit
kulkevat `transition`in kautta; kortti, laivastorivi, rosteririvi ja Copy list -rivi
ovat puhtaita projektioita `ResolvedUnit`ista kaikille lajeille (`shipCardHTML`,
`commanderCardHTML`, `unitHTML`, `rosterRowOf`, `listLineOf`). Adapteri jää
sovelluksen tilarajaksi kohtaan 9 asti (päätös `tasks/P1-8e`).

### resolveFleet (kohta 8, 9.9.2026)

```js
resolveFleet({ list: <listan nimi>, limit, units: [CanonicalUnitIntent] }, catalog)
  -> { list, limit, units: [ResolvedUnit], totals: { points, maxPoints, hulls },
       checks: [{ ok, t, v, s, warn? }],
       facts:  [{ k: "attack"|"opponent"|"vp", t, v, s, warn? }] }   // J214
```

`facts` (J214, 20.10.2026) on laskettua tietoa, ei tarkistuksia: attack rating
(`L.ar`; kaksi eri lukua antavaa ehdollista saantoa naytetaan molemmat, T53),
vastustajan ilmaiset lisat (`L.opp`) ja Demiurgien VP-arvot (`L.vp`). Data on
`build_data.py`:n J214-lohkossa. `ResolvedUnit.victory` = `{ points, name, page,
text }` tai `null`: aluksen VP-arvo, kun se ei ole sen hinta (Fleets s. 486);
pelisivun `PLAY.conceded` kayttaa sita.

Laillisuustarkistus on puhdas: jokainen luku tulee ratkaistuista yksiköistä,
jokainen sääntö katalogin listasta. Templaten `checks()` on kuori, joka rakentaa
laivastointentin `S`:stä. Sääntötyypit ja niiden parametrit ovat `domain.js`:n
`resolveFleet`-otsikossa; kirjasta luetut säännöt, joita jäsennin ei tunnista,
kirjataan `build_data.py`:n `RULE_PICKS`-tauluun (lause + sivu) ja niiden status
on `referenssi/NN_*.json`:ssa `enforced`. Yksikön `issues`-virhe on myös
laivaston tarkistusrivi ("Unit issues").

### Sijoitus, laivueet ja Clanzin komento (J215/J216, 20.10.2026)

`CanonicalUnitIntent` saa valinnaiset kentät `uid`, `aboard`, `sq` ja `cmd`
(ks. `docs/SAVE_SCHEMA.md`). `resolveFleet` palauttaa lisäksi:

```js
aboard:  [{ unit, ship, choices: [unitIndex], chosen, ok, ruled, cite }],  // placeCommanders, L.place
command: [unitIndex -> Warlordin unitIndex | -1] | null                  // clanzCommand, L.clanz
```

Säännöllinen sijoitus (`ruled`) ja laivueet tuottavat tarkistusrivit
"Aboard: …", "Squadron A", "Daemonship in a squadron: …", "Squadroned: …"
sekä Clanzissa "Warlord N: skwadrons / 'Uge ship / Space Hulk / one clan /
Gubbins". Sijoitus ei muuta aluksen profiilia (J8).
