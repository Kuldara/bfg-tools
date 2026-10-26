# P1-8 · `resolveUnit` v1 — puhdas ratkaisin (sateenvarjo)

**Tila:** valmis 9.9.2026 — viisi osapakettia tehty (a `a55e551`, b `163ab21`/`847889c`,
c `db3abd1`, d `475524c`, e `637ad86` + osa 2) · **Koko:** iso, tehtiin osissa ·
**Vaikutusluokka:** arkkitehtuuri

Lue ensin: `docs/DOMAIN_CONTRACT.md` (§ v1-tarkennukset),
`docs/REVIEW-resolveUnit-v0.md`, **`docs/REVIEW-resolveUnit-v1-Codex.md`**
(ulkoinen katselmointi 9.9.2026, commit `cdb7e90`).

## Miksi tämä ei ole yksi tehtävä

Ulkoinen katselmointi hyväksyi v0:n väliaikaiseksi julkisivuksi mutta hylkäsi
P1-8:n alkuperäisen muodon: yksi 2–4 päivän massapatchi olisi lukinnut
indeksipohjaisen tallenteen domain-rajapinnaksi, verrannut v1:tä v0:aan
"tavulleen" (mahdotonta, kun v1 lisää kenttiä) ja jättänyt kortin, komentajat
ja kelvottoman intentin määrittelemättä. Katselmoinnin kuusi P1-löydöstä ja
neljä P2-löydöstä on jaettu viiteen pakettiin niin, että **jokaisen paketin
jälkeen `python acceptance.py` on vihreä ja sovellus julkaisukelpoinen**.

| paketti | mitä | sulkee katselmoinnin löydökset |
|---|---|---|
| [P1-8a](P1-8a-canonical-intent.md) | pysyvät option-ID:t datassa, `CanonicalUnitIntent`, legacy-adapteri, `schemaVersion`, `domain.js`-lähdemoduuli, puhtaustestit | P1 tallennusformaatti, P2 DOM-riippumaton lähde, P2 ID-migraatio |
| [P1-8b](P1-8b-puhtaat-apurit.md) | option/päivitys/hinta/ase-apurit puhtaiksi `(intent, ctx, catalog)`-funktioiksi; v0 kutsuu niitä `S`:llä | P2 riippuvuusgraafi, P1 aliasointi (kopiot) |
| [P1-8c](P1-8c-resolveunit-dual-run.md) | `resolveUnit(intent, unitContext, catalog)` v1; v0 = adapteri; dual-run-pariteetti semanttisilla kentillä kaikilla golden-tapauksilla | P1 "tavulleen sama", P1 aliasointi, P2 resolveUnit/resolveFleet-jako |
| [P1-8d](P1-8d-projektiot.md) | puhtaat projektiot: kortti, laivastonäkymä, rosteri, Copy list; rich-unit-fixture; `u._mem` pois | P1 korttirajapinta, P2 golden-pinta-aukot, P2 renderöinti muuttaa intenttiä |
| [P1-8e](P1-8e-komentajat-issues.md) | komentajan strukturoitu leadership build-vaiheessa; `validateIntent` → `Issue[]`; `transition`; hiljainen korjaus pois; adapterin poisto | P1 komentajat, P1 warnings/normalisointi |

Järjestys on pakollinen: a → b → c → d → e. Paketti ei ala ennen kuin edellinen
on commitattu ja hyväksytty.

## Katselmoinnin hyväksymisportti (kopioitu, jotta se ei jää raporttiin)

P1-8 on valmis vasta kun kaikki nämä ovat testeissä, eivät vain dokumentissa:

- canonical intent käyttää pysyviä ID:itä; legacy-save käsitellään adapterissa
- domain-lähde testataan ilman HTML:ää, DOM:ia, `localStorage`ia tai `S`:ää
- ratkaisin ei muuta eikä aliasoi mitään syötettä (deepFreeze-testi:
  intent, fleet ja katalogi jäädytetään; tulosta yritetään muuttaa;
  katalogi ja intent eivät muutu)
- `kind` on eksplisiittinen kaikille tuloksille (`ship` / `commander`)
- komentajan leadership on strukturoitu build-vaiheessa, ei parsittu
  runtime-tekstistä
- `options`, `upgrades`, `issues` ovat skeemassa ja testeissä
- kelvottoman intentin semantiikka on määritelty: intent säilyy, tulos on
  deterministinen, ongelma on strukturoitu `{code, severity, path, message,
  sourcePage}`
- v0-pariteetti koskee yhteisiä semanttisia kenttiä **kaikissa** nykyisissä
  golden-tapauksissa (luku luetaan tiedostosta, ei kovakoodata); uudet kentät
  saavat riippumattomat odotukset kirjasta tai käyttöliittymäsopimuksesta
- kortti, laivastonäkymä, rosteri ja Copy list käyttävät puhtaita
  projektioita eivätkä kysy katalogilta tai `S`:ltä mitään
- aserivin kaikki neljä saraketta ja tila verrataan ainakin rich-fixtureissa
- adapteri poistetaan vasta dual-runin ja kaikkien pintojen migraation jälkeen
- täysi `python acceptance.py` pysyy vihreänä jokaisen osapaketin jälkeen

## Älä tee tässä

- Älä lisää vaikutustyyppejä — kohta 7 on maalissa; uusi tyyppi on oma tehtävä.
- Älä muuta korttien ulkoasua: 462 alus- ja 62 komentajakorttia, 0 saa
  muuttua ilman golden-tapausta joka vaatii muutoksen.
- Älä aloita kohtaa 8 (listasäännöt) ennen P1-8e:tä — se kasvattaisi
  purettavaa `S`-riippuvuutta.
- Älä kirjoita uudelleen: `domain.js` syntyy siirtämällä nykyiset funktiot,
  ei korvaamalla niitä.
