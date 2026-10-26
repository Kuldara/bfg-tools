# P1-8b · Puhtaat option/päivitys/hinta/ase-apurit

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen (1–2 pv) · **Vaikutusluokka:** arkkitehtuuri

**Toteutunut:** askeleet 1–5 (`163ab21`): 22 laskinta `domain.js`:ään puhtaina
`Selection`-funktioina, template kuoriksi `selOf(u)`:n kautta; askel 6: vauriomalli
(`crippledLine`, `criticalModel`, kriittiset taulukot, `repairLine`), aseluokat ja
koko erikoissääntömalli (`SPECIAL_WEAPON_RULES`, `SPECIAL_HULL_RULES`,
`specialModel`…`optStars`) siirretty; `L()`-riippuvuus korvattu `list`-parametrilla.
`app_template.html` 3 349 → 2 543 riviä, `domain.js` 1 277 riviä. Golden-odotukset
arvioidaan `test_domain.js`:ssä suoraan puhtailla laskimilla (918 väitettä).
Löydös: Tyranidien samannimiset päivitysrivit (Pyro-acid battery 5/10/15)
ratkaistaan kiinnityksestä (`findUpgradeEntry`).

Osa sateenvarjoa [P1-8](P1-8-resolveunit-v1.md). Katselmoinnin löydös:
"P1-8 aliarvioi globaalin riippuvuusgraafin" — `resolveUnit` vetää mukanaan
`L`, `unitPts`, `unitMaxPts`, `upgradePts`, `upgradesFor`, `condOK`,
`armModel`, `statMod`, `statSet`, `isEscort`, `coveredByShipOption`,
`bayStrength` ja apureita. Ne siirretään yksi kerrallaan, vihreänä.

## Malli: puhdas ydin, ohut `S`-kuori

Jokaisesta apurista tehdään `domain.js`:ään puhdas versio, joka saa kaiken
parametreina:

```js
// domain.js
function optionState(intent, sh)          // -> { [optionId]: "take"|"opt"|"off" }
function upgradeState(intent, ctx)        // ctx = { list, entry, sectionIndex, entryIndex }
function pointsOf(intent, ctx, catalog)   // unitPts
function maxPointsOf(intent, ctx, catalog)
function weaponRows(intent, ctx, catalog) // armModel; palauttaa KOPIOT, ei sh.aw-alkioita
function statOf(intent, ctx, catalog, key)
```

`app_template.html`:n nykyiset `unitPts(u)`, `armModel(u, sh)` jne. jäävät
kuoriksi: `unitPts = u => pointsOf(fromLegacyUnit(u, CATALOG), ctxOf(u), CATALOG)`.
Pinnat eivät huomaa mitään. v0 `resolveUnit(u)` kutsuu kuoria kuten ennen.

## Järjestys (jokainen askel oma commit, acceptance vihreä)

1. `isEscort`, `bayStrength`, `prowArmour`, `coveredByShipOption` — ei tilaa
2. `optionState` + `condOK` + `upgradeState` + `upgradesFor` — tila intentistä
3. `pointsOf` / `maxPointsOf` / `upgradePts` / `hullPts`
4. `statMod` / `statSet` / `effHits` / `effShieldsText` / `effTurrets`
5. `weaponRows` (armModel) — **kopioi rivit** (`a: a.slice()`), jotta
   `resolveUnit(u).weapons[0].a === SHIPS[ref].aw[0]` on `false`
6. `crippledLine`, `criticalModel`, `specialLines` — saavat `sh`:n ja
   intentin, eivät lue `L()`:ää

## Valmis kun

- `test_domain.js`: jokainen siirretty apuri ajetaan deepFreeze-syötteillä
  kaikilla golden-tapauksilla ja tulos on `deepStrictEqual` kuoren tulokseen
  (pariteetti kuoreen, ei kirjaan — kirja on golden-tapauksissa)
- aliasointitesti: ratkaistun rivin muuttaminen ei muuta katalogia
- `python acceptance.py` vihreä; 462 + 62 kortista 0 muuttui
- `app_template.html`:ssä ei ole enää laskentaa, vain kuoret ja renderöinti
  (`grep -c "function " domain.js` kasvaa, template pienenee)

## Älä tee tässä

- Älä muuta yhdenkään apurin tulosta. Jos pariteettitesti punertaa, kuori
  tai puhdas versio on väärin — kirjaa golden-tapaus ennen kuin päätät kumpi.
- Älä lisää `resolveUnit` v1:tä vielä — se on P1-8c.
