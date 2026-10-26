# P1-4 · Venerable battle barge: pohjarungon valinta

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen · **Vaikutusluokka:** uusi käsite (`baseHullChoice`)

## Tehty

**Data** (`build_data.py`): kolme Venerable-riviä saavat `hc=1`,
`hcp=35` ja `hulls[]` — 26 runkoa Imperial Navy- ja Chaos-listojen
Battleships / Grand Cruisers / Battlecruisers / Heavy Cruisers -osioista,
vain `IMPERIAL NAVY`- ja `CHAOS`-faktion luokkarungot (ei Space Marine
Battle Barge s.104, ei nimettyjä yksilöitä kuten Terminus Est), plus
Seditio Opprimere s.103 kirjan omana esimerkkinä. Oletusrunko pysyy
s.103, joten vanha tallenne aukeaa samana.

**Sovellus:** `hullPts()` = rungon listahinta + 35, paitsi Space Marine
-rungolla (Seditio 450 — miehistö on jo mukana). `setHull()` vaihtaa
rungon ja nollaa optiot ja päivitykset (ne viittaavat vanhan rungon
riveihin); rungon nimi tallennetaan (`hn`), ja `load()` hakee sen nimellä
jos sivunumero ei enää täsmää. Laivastonäkymä: pudotusvalikko rivin
ohjaimiin, hintoineen. Kortti: otsikko "Venerable Battle Barge", alarivi
rungon luokka. `resolveUnit().hull = {chosen, choices}`.

**Testit:** `test_validator.js`:n väärä väite ("osoittaa Seditio
Opprimereen") korvattu kymmenellä kirjan mukaisella (hc, hcp, oletus,
kelvolliset ja kelvottomat rungot). Golden 34 → 38:
`venerable-default-seditio` (450, vaihtoehdot), `-on-mars-hull` (270+35 =
305, Marsin profiili ja aseet, kortin otsikko + runko),
`-on-desolator-hull` (300+35 = 335), `-hull-then-option-reset` (Marsin
kolmas torni ei seuraa Desolatoriin). Ajuri sai `select[].hull` ja
`hull_choices_include/exclude`.

**Referenssi:** `04` rivi "single Venerable battle barge…" `manual →
enforced` merkinnällä `enforced_by: hull_choice`; `check_reference.py`
varmistaa mekanismin rakennetusta datasta. Rivit "must be worth at least
1,000 points" (05, 06) jäävät `gap`iksi — ne ovat `per_points`-perhettä,
prioriteetti 3.

Ajuri nappasi jälleen oman virheeni: kirjoitin Desolatorille "tornit 3,
aseita 6" lukematta profiilia (oikein 4 ja 4).

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/DOMAIN_CONTRACT.md`.

Tämä on projektin opettavaisin yksittäinen rivi: samalla rivillä on väärä
data, sen lukitseva testi ja puuttuva mallikäsite — yksi kustakin
vikaluokasta.

## Mitä kirja sanoo

Fleets s. 102, referenssi `04_space_marines_codex_astartes.json`:

> "The fleet can include a single Venerable battle barge (counting as one
> of the three allowed), **chosen from any available Imperial or Chaos
> battleship, grand cruiser, battlecruiser or heavy cruiser** at the listed
> cost, plus an additional **+35 points** for its Space Marine crew."

Runko on siis **pelaajan valinta**, ja hinta on rungon hinta + 35.
Listarivin hinta on kirjassa "varies".

## Mitä datassa on

Kolme listaa — Codex Astartes, Crusade, Dominion — osoittavat rivillä
"Venerable battle barge" profiiliin **s.103**, joka on nimetty
ainutlaatuinen alus *Seditio Opprimere*. Hinta on `null`.

Hinta `null` on **oikein**: kirja sanoo "varies". Profiili ei ole.

## Ja mikä tekee tästä opettavaisen

`test_validator.js:256` **väittää tämän oikeaksi**:

```js
eq(SHIPS[String(v.en.r)].nm, "SEDITIO OPPRIMERE, VENERABLE BATTLE BARGE",
   nm + ": venerable battle barge osoittaa Seditio Opprimereen");
```

Testi on vihreä, koska se lukitsee toteutuksen oletuksen, ei kirjan
sääntöä. Tämä on täsmälleen se, mitä `AGENTS.md` §5 kieltää. Korjaus
poistaa myös väitteen — mutta vasta kun oikea käyttäytyminen on toteutettu
ja golden-tapaus todistaa sen.

## Tehtävä

1. **Kirjoita golden-tapaus ensin** ja osoita se punaiseksi. Vähintään:
   - rivi tarjoaa rungon valinnan, ei kiinteää alusta
   - valittu runko + 35 antaa oikean hinnan
   - *Seditio Opprimere* on **yksi** vaihtoehto, ei ainoa
   - ainutlaatuiset alukset, jotka eivät ole battleship / grand cruiser /
     battlecruiser / heavy cruiser, eivät kelpaa

2. **Lisää käsite `baseHullChoice`** listarivin tyypiksi. Rivi ei viittaa
   yhteen profiiliin vaan **joukkoon**, ja pelaaja valitsee. Suodatin:
   Imperial- tai Chaos-faktio, tyyppi yksi neljästä.

3. **Hinta** = valitun rungon perushinta + 35.

4. **Poista väärä väite** `test_validator.js`:stä ja korvaa se väitteellä,
   joka vastaa kirjaa.

5. **Päivitä referenssi**: `04`, `05` ja `06` — status `gap` → `enforced`.

## Valmis kun

```
node test_golden.js       venerable-tapaukset OK
python check_reference.py 0 löydöstä, kolme gap-riviä vähemmän
python acceptance.py      ei uusia HYLATTY-rivejä
```

## Miksi tämä ei ole ensimmäinen tehtävä

Se vaatii uuden käsitteen listariville, ja `resolveUnit()` (P1-1) on se
paikka, jonne käsite kuuluu. Ennen sitä valinta pitäisi toteuttaa viiteen
pintaan erikseen.

## Huomio

Tämä on ainoa kohta koko datassa, jossa listarivillä ei ole hintaa —
kaikkiaan 3 riviä 462:sta. Kun tämä on tehty, jokaisella rivillä on joko
hinta tai selkeä sääntö siitä, miten hinta muodostuu.
