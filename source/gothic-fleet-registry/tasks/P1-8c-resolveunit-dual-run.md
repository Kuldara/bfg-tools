# P1-8c · `resolveUnit(intent, unitContext, catalog)` v1 + dual-run

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen (1 pv) · **Vaikutusluokka:** arkkitehtuuri

**Toteutunut:** `DOMAIN.resolveUnit(intent, ctx, catalog)` rakentaa `Selection`in
kerran ja palauttaa `kind`, `entry`, `source`, `members`, `stats`, `weapons[]`
(`state: active|offered`), `damage` (+ `critical`-taulukko kopiona, `trigger`,
`repair`), `rules`, `hull`, `options[]` (`blockedBy`, `dependsOn`, `qty`),
`upgrades[]` (`id`, `cost`, `state`, `owner`, `required`, `key`), `issues: []`.
Dual-run: v0-runko ja v1 verrattiin semanttisella projektiolla
(`deepStrictEqual`) kaikilla 60 golden-tapauksella → 0 eroa; sen jälkeen v0
poistettiin ja templaten `resolveUnit(u)` on adapteri. Uudet kentät saivat
kirjaodotukset (`expect.options`, `expect.upgrades`) kuuteen tapaukseen; ne
ajetaan sekä sovelluksen läpi (`test_golden.js`) että ilman HTML:ää
(`test_domain.js`, 949 väitettä).

Osa sateenvarjoa [P1-8](P1-8-resolveunit-v1.md). Sulkee katselmoinnin
löydökset "tavulleen sama on väärä totuuslähde", "ResolvedUnit vuotaa
viitteitä" ja "ratkaisimen ja fleet-validaattorin vastuu".

## Allekirjoitus

```js
// domain.js
resolveUnit(intent, unitContext, catalog) -> ResolvedUnit
//   intent      CanonicalUnitIntent (docs/DOMAIN_CONTRACT.md)
//   unitContext { list, entry, sectionIndex, entryIndex, fleetChoices }
//               — ei koko units-taulukkoa; jos jokin tarvitsee koko
//               laivastoa, se kuuluu resolveFleet()iin (kohta 8)
//   catalog     { ships, lists }
```

`ResolvedUnit` saa `kind: "ship"`, `options[]`, `upgrades[]`, `issues[]`
(tässä paketissa vielä tyhjä) ja aseriveille eksplisiittisen tilan
`state: "active" | "offered" | "hidden"` esityskentän `box` rinnalle.
**Tulos ei jaa yhtään taulukkoa tai oliota syötteiden kanssa.**

## Dual-run

v0 `resolveUnit(u)` muuttuu adapteriksi:
`resolveUnit(u) = resolveUnitV1(fromLegacyUnit(u), ctxOf(u), CATALOG)`.
Ennen vaihtoa `test_domain.js` ajaa molemmat rinnakkain:

1. **yhteiset semanttiset kentät** (`points`, `maxPoints`, `stats.*`,
   `weapons[].{a,state,count,grp}`, `damage.*`, `rules[].text`, `hull`)
   normalisoidaan yhdeksi skeemaksi ja verrataan `deepStrictEqual`illa —
   ei JSON-tekstinä, avainten järjestys ei ole sopimus
2. **kaikilla** `referenssi/golden_cases.json`-tapauksilla; lukumäärä luetaan
   tiedostosta
3. **uudet kentät** (`options`, `upgrades`, `state`, `kind`) saavat omat
   odotuksensa golden-tapauksiin (`expect.options`, `expect.upgrades`), luettuna
   kirjasta tai käyttöliittymäsopimuksesta — ei v0:sta
4. pariteetti **ei korvaa** golden-odotuksia; golden-ajuri lukee edelleen
   kirjan odotukset

Vasta kun dual-run on vihreä, v0:n sisus vaihdetaan adapteriksi ja
dual-run-testi jää regressioksi (v0-kuori = adapteri, joten se ei enää
vertaa kahta toteutusta vaan adapterin ja suoran kutsun yhtäpitävyyttä).

## Valmis kun

- `test_domain.js`: `resolveUnit` v1 ajetaan deepFreeze-syötteillä; tulosta
  yritetään muuttaa (`R.weapons[0].a[0] = "x"`); katalogi ja intent eivät
  muutu; `R.weapons[i].a !== catalog.ships[ref].aw[j]` kaikilla riveillä
- pariteetti vihreä kaikilla golden-tapauksilla
- `test_golden.js` kutsuu `resolveUnit(intent, ctx, catalog)`ia suoraan
  `domain.js`:stä (ei enää `S`-tynkää ratkaisimen osalta; pinnat vielä
  DOM-tynkää — se poistuu P1-8d:ssä)
- `python acceptance.py` vihreä; 462 + 62 kortista 0 muuttui
- `docs/DOMAIN_CONTRACT.md` vastaa toteutunutta `ResolvedUnit`ia

## Älä tee tässä

- Älä siirrä pintoja vielä (P1-8d). Kortti saa yhä kutsua kuoria.
- Älä toteuta `issues`-logiikkaa (P1-8e); kenttä on, se on tyhjä.
