# P1-8e · Komentajat, `issues`, `transition` — ja adapterin poisto

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen (1–2 pv) · **Vaikutusluokka:** data + arkkitehtuuri

**Toteutunut (osa 1, `637ad86`):** komentajien leadership ja re-rollit rakenteisesti
build-vaiheessa (`ld {kind, value, max}`, `rr`), `referenssi/komentajat.json`
seitsemälle riville joille kirja ei anna Ld-arvoa (sivu + verified; build hylkää
kuittaamattoman), re-roll-rivien lukumäärä (`rr`) datassa; `resolveUnit` palauttaa
`kind: "commander"` (leadership, `rerolls {included, purchased, total}`, säännöt);
komentajakortti, laivastorivi, rosteri ja Copy list ratkaisimesta; legacy-polut pois.
Kuusi komentajan golden-tapausta kirjasta.

**Toteutunut (osa 2):** `validateIntent` → `Issue[]` (`option.exclusive`,
`option.dependency`, `option.swap_conflict`, `option.unknown_id`, `upgrade.ineligible`,
`upgrade.covered`, `upgrade.exclusive`, `upgrade.unknown_id`, `hull.unknown`,
`ship.unknown`, `entry.unknown`), `resolveUnit` kantaa `issues` myös kelvottomalle
intentille ja laskee sen sellaisenaan; `transition(intent, action)` → `{intent, notices}`
korvaa setterien hiljaisen korjauksen (sama sääntö, näkyvä ilmoitus laivastonäkymän
otsikkorivillä); `load()` ei enää siivoa ristiriitaa vaan issue näkyy yksikön alla ja
laillisuustarkistus näyttää "Unit issues" punaisena. Golden `invalid-lite-kroozer-both-prow`
todistaa kelvottoman tilan raportoinnin; jokainen muu golden-tapaus todistaa ettei
kirjasta luettu kokoonpano tuota yhtään virhettä.

**Päätös adapterista:** legacy-adapteri (`fromLegacyUnit`/`toLegacyUnit`) **jää**
sovelluksen tilarajaksi. Se on nyt ainoa luku- (`resolveUnit`) ja kirjoituspolku
(`transition`); yksikään laskin tai pinta ei lue `S.units`-oliota suoraan. `S.units`in
muuttaminen intent-muotoiseksi vaatisi tallennusformaatin v3:n, validaattorin
(`checks`, kohta 8 = `resolveFleet`) ja kahdeksan testiajurin uudelleenkirjoituksen
ilman käyttäjälle näkyvää hyötyä; se tehdään kohdassa 9 (julkaisumigraatio)
yhdessä `os`/`oq`-dual-writen poiston kanssa. Katselmoinnin ehto "adapteri
poistetaan vasta dual-runin ja pintojen migraation jälkeen" on järjestysehto, ja
molemmat edellytykset ovat täyttyneet; poisto on nyt kohdan 9 työtä.

Osa sateenvarjoa [P1-8](P1-8-resolveunit-v1.md). Sulkee katselmoinnin
löydökset "komentajan luvattu tulos ei ole mallinnettavissa nykyisestä
datasta" ja "`warnings` ja automaattinen normalisointi ovat määrittelemätön
tila". Viimeinen paketti: sen jälkeen legacy-adapteri ja v0-kuoret
poistetaan.

## 1. Komentajat strukturoidaan build-vaiheessa

62 komentajariviä kantavat leadershipin vain otsikkotekstissä
(`"Fleet-Admiral (Ld 8)"`, `"Warlord (Ld +1)"`). Kiinteä arvo ja modifier ovat
eri käsitteitä, eikä niitä parsita ajossa. `build_data.py` (tai
`lists.py`) antaa jokaiselle `k: "cmd"`-riville:

```js
leadership: { kind: "fixed", value: 8 }        // "Ld 8"
leadership: { kind: "modifier", value: 1 }     // "Ld +1"
leadership: null                               // ei Ld-mainintaa: kirjataan referenssiin miksi
```

Lähdeviite: `src_page`. Rivit, joilla tekstistä ei voi lukea kumpaakaan,
menevät `referenssi/komentajat.json`-tiedostoon sivun kanssa (sama sopimus
kuin `optiot.json`: sivu + `verified: true`). Re-rollit ja muut ostettavat
ominaisuudet ovat listapäivityksiä (`k: "up"`, `at`), ja ne ratkaistaan
samasta `upgrades`-valinnasta kuin pisteet — ei erillistä kenttää, joka
arvattaisiin nimestä.

`resolveUnit` palauttaa komentajalle:

```js
{ kind: "commander", entry, points, maxPoints, leadership, rerolls: [{label, cost, source}],
  rules: [...], options: [], upgrades: [...], issues: [...] }
```

Golden-tapaukset vähintään: kiinteä Ld, Ld-modifier, nimetty komentaja
(esim. sivu 35–36:n Imperial Navy; Ork Warlord), nollahintainen komentaja,
re-roll-päivitys. Odotus kirjan sivulta, ei datasta.

## 2. Kelvoton intent: kolme vastuuta

```js
transition(intent, action, ctx, catalog) -> { intent, notices }  // UI:n tietoinen vaihto
validateIntent(intent, ctx, catalog)      -> Issue[]              // ei muuta syötettä
resolveUnit(intent, ctx, catalog)         -> ResolvedUnit + issues // deterministinen myös kelvottomalle
```

- `transition` korvaa `setOptState`/`setUpState`/`setHull`in sisäisen
  hiljaisen korjauksen: saman ryhmän vanha valinta putoaa yhä, mutta
  `notices` kertoo sen ja käyttöliittymä näyttää sen (esim. "Torpedo
  launcha poistettiin: lisägunzit valittu").
- Suoraan ladattu tai testissä rakennettu kelvoton intent **säilyy
  muuttumattomana** ja saa `issues`-rivin.
- `Issue = { code, severity: "error"|"warning", path, message, sourcePage }`.
  `code` on vakio (`option.exclusive`, `option.dependency`,
  `upgrade.ineligible`, `hull.unknown`, `option.unknown_id`), `path`
  osoittaa intentin kenttään. Pelkkä merkkijono ei kelpaa: testit,
  lokalisaatio ja UI-kohdistus tarvitsevat rakenteen.
- Kelvottoman intentin pisteet: lasketaan valituista kuten ne ovat (ei
  arvata korjausta), ja `issues` sisältää `error`-rivin. Laivastonäkymä
  näyttää sen punaisena; validaattori (`checks`) ei näytä vihreää.

## 3. Adapterin poisto

Kun 1–2 ovat vihreitä ja kaikki pinnat lukevat projektioita (P1-8d):

- `fromLegacyUnit`/`toLegacyUnit` poistuvat sovelluksesta; jäljelle jää vain
  `load()`:n migraatio vanhasta tallenteesta canonical-muotoon
- v0-kuoret (`unitPts(u)`, `armModel(u, sh)` …) poistuvat; `S.units` sisältää
  `CanonicalUnitIntent`-olioita
- `docs/DOMAIN_CONTRACT.md` § "Tila" päivitetään: v1 tehty

## Valmis kun

- komentajan golden-tapaukset vihreitä kaikilla pinnoilla (laivastonäkymä,
  rosteri, Copy list, komentajakortti); 62 komentajakortista 0 muuttui
- `test_domain.js`: `validateIntent` ei muuta syötettä; kelvoton intent on
  deterministinen; `transition` palauttaa `notices`
- `setOptState`-hiljainen korjaus on poissa; `test_upgrades.js`:n invariantti
  päivitetty käyttämään `transition`ia
- `python acceptance.py` vihreä; `open_tasks_p1` 0 (P1-8 suljettu)

## Älä tee tässä

- Älä toteuta listasääntöjen uutta logiikkaa (kohta 8) — `resolveFleet`
  on oma kohtansa, tämä antaa sille vain puhtaat yksiköt.
- Älä muuta komentajakortin ulkoasua.
