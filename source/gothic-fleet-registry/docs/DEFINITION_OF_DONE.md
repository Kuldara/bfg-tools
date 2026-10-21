# Definition of Done — GFR v1

> **GFR v1 on valmis, kun käyttäjä voi rakentaa, tallentaa, avata ja
> tulostaa minkä tahansa tuetun laivaston niin, että pisteet, profiilit,
> aseet ja laivastonrakennussäännöt vastaavat lähdeteosta kaikissa
> käyttöliittymän näkymissä ja tulosteissa.**

"Valmis" ei tarkoita, että auditointiskripti löysi kaikki tunnetut
tapaukset. Se tarkoittaa, ettei sovelluksen **sovitun rajauksen sisällä**
ole enää tuntemattomia tai luokittelemattomia sääntöjä. Vasta sen jälkeen
ohjelmaan voi luottaa.

**Jokaisen vaiheen jälkeen sovellus on edelleen käyttökelpoinen ja
julkaisukelpoinen.** Vakautus ei saa jättää sovellusta puolitiehen: jos
välivaihe rikkoisi jonkin pinnan, se ei ole välivaihe vaan väärä jako.

---

## Mittarit, jotka `python acceptance.py` raportoi

Tuomio `LAPI` edellyttää, että jokainen mitattava rivi on nolla ja jokainen
"ei mitattu" on muuttunut mitatuksi.

| mittari | mistä | v1-ehto |
|---|---|---|
| `golden_failures` | `test_golden.js` — tapaus, jonka pitäisi mennä läpi, ei mene | 0 |
| `golden_gaps` | `test_golden.js` — tiedetyt aukot | 0 |
| `surface_disagreements` | `test_golden.js` — pinnat eri mieltä samasta aluksesta | 0 |
| `save_roundtrip_failures` | `test_golden.js` — save → load ei palauta samaa | 0 |
| `effect_queue_open` | `audit_effects.py` — optio lupaa muutosta, mallia ei | 0 |
| `invalid_acks` | `audit_effects.py` — kuittaus ilman sivua tai `verified` | 0 |
| `upgrade_effect_open` | `audit_upgrades.py` — alukselle tarjottu listapäivitys ilman kirjan mukaista vaikutusta tai sääntötekstiä (`referenssi/paivitykset.json`) | 0 |
| `unclassified_rules` | `referenssi/NN_*.json` — `gap` + `not_shown` (lopputilat `enforced` / `manual` / `out_of_scope`) | 0 — **saavutettu 9.9.2026** |
| `open_tasks_p1` | `tasks/P1-*.md`, `Tila: avoin` tai `odottaa` | 0 |
| `artifact_mismatches` | juuri-HTML vs `julkaisu/site/index.html` (skripti + data) | 0 |
| `build_reproducible` | `bfg_data.json` tavulleen sama buildin jälkeen | kyllä |
| `print_overflows` | `layout_check.js` — kortti, jonka sisältö ei mahdu laatikkoonsa sovituksen jälkeen | 0 — **mitattu 9.9.2026** |
| `unreadable_print_cases` | `layout_check.js` — kortti, jonka jokin ensisijainen tekstilohko painuu alle 4,2 pt (§5) | 0 — **mitattu 9.9.2026** |

Mittari, jota ei voi vielä mitata, raportoidaan sanoilla **ei mitattu** —
ei nollana. Nolla, joka ei ole mitattu, on valhe.

---

## 1. Sääntöjen kattavuus

- Jokainen sovelluksen sisältämä alus, optio ja komentaja on käsitelty.
- Jokainen relevantti sääntö on **täsmälleen yhtä** näistä:
  - `enforced` — moottori valvoo, rikkominen näkyy
  - `manual` — näytetään pelaajalle selvästi (`Check yourself`)
  - `out_of_scope` — perustellusti rajattu ulos, perustelu kirjattu
- `gap` ja `not_shown` eivät ole sallittuja lopputiloja. Ne ovat työjonoa.
- Jokaisella mallinnetulla säännöllä ja vaikutuksella on lähdesivu ja
  varmennuksen tila (`docs/RULES_TRUTH.md`).
- Venerable-, Ork Hulk- ja Hive Ship -erikoistapaukset on ratkaistu omina
  käsitteinään, ei peitetty yleismallilla.

## 2. Yksi laskennallinen totuus

```
UnitIntent + laivastokonteksti + säännöt
                    ↓
              resolveUnit()
                    ↓
              ResolvedUnit
                    ↓
laivastonäkymä · kortti · rosteri · Copy list · tallennus · tuloste
```

Sama alus näyttää kaikkialla samat pisteet, osumat, kilvet, nopeuden,
käännöksen, panssarin, tornit, aseet kantamineen, tulivoimineen ja
kaarineen, valitut optiot määrineen ja erikoissäännöt.

**Raakaa perusprofiilia ei saa käyttää käyttöliittymässä laskettuna
lopputuloksena.** Esitystapa saa erota (kortti lyhentää), arvo ei.

`resolveUnit` etenee kahdessa vaiheessa, ja molemmat ovat kirjattuja
tavoitteita — jottei v0 jää pysyväksi:

| vaihe | mitä | tila |
|---|---|---|
| **v0** | yhteinen julkisivu nykyisille laskimille; kaikki pinnat lukevat sitä | `tasks/P1-1` |
| **v1** | aidosti puhdas `resolveUnit(intent, unitContext, catalog)` ilman globaalia `S`-tilaa; canonical intent ID:illä; ei aliasointia; `issues`; puhtaat projektiot | **tehty 9.9.2026** — `tasks/P1-8a…e`; adapteri jää tilarajaksi kohtaan 9 asti (päätös `tasks/P1-8e`) |

## 3. Laivastonrakennus toimii

- Pakolliset valinnat lisätään ja validoidaan (`applyRequired`).
- Minimi-, maksimi-, suhde- ja pistemäärärajoitukset toimivat.
- Variantit, korvaavat aseet ja toistuvat asejärjestelmät toimivat.
- Virheellinen laivasto ei näytä vihreää.
- Käyttäjälle kerrotaan ymmärrettävästi, mikä sääntö rikkoutuu.

## 4. Tallennukset kestävät kehitystä

- Aluksilla, optioilla ja listoilla on pysyvät tunnisteet.
- Tallennuksessa on `schemaVersion`.
- Vanha tuettu tallennus migroidaan tai hylätään selkeällä ilmoituksella.
- Tallenna → avaa palauttaa saman laivaston ja saman ratkaistun tuloksen.
- Indeksien järjestyksen muuttuminen ei vaihda käyttäjän valintoja toisiksi.

Nykytila 9.9.2026: **tehty** — listat, osiot ja päivitykset nimellä, aluksen optiot
ID:llä, `schemaVersion: 2` lukittu, skeema 1 migroituu ilmoituksella ja uudempi
skeema hylätään varmuuskopiolla (`docs/SAVE_SCHEMA.md`, kohta 9).

## 5. Tulostus on käyttökelpoinen

- Kortit eivät ylitä rajojaan eivätkä leikkaannu.
- Tekstin koolle on todellinen luettavuuden alaraja.
- Ylipitkää sisältöä ei ratkaista kutistamalla mikroskooppiseksi.
- Pitkät optiolistat (Hive Ship) on taitettu tai tiivistetty hallitusti.
- Kortit, laivastolista ja komentajat kuuluvat tulostustestaukseen.

Nykytila 9.9.2026: **mitattu** (kohta 10).

**Raja: 4,2 pt** A4-arkilla 100 %:n tulostuksessa, ensisijaiselle tekstille.
Kortin pienin suunnittelukoko on 4,6 pt (vauriolaatikon huomautus), joten
raja tarkoittaa, ettei mikään ensisijainen teksti painu alle ~90 %:n
suunnitellusta koostaan — kortti tulostuu käytännössä suunnitellussa
koossaan. Ensisijaista tekstiä ovat säännöt (`.k-sr li`), option valintarivi
(`.k-opt .tx > b`), aserivit (`.k-arm td`), criticalin otsikot (`.k-crit b`),
vauriohuomautus (`.k-note`), laivueen ja jäsenten tekstit. Suunnitellusti
pienempiä ja mittarin ulkopuolella: option kuvaushäntä (4,45 / 4,1 pt;
7+ option kortilla sitä ei tulosteta), criticalin alarivi (3,8 pt) ja
aserivin "or"-merkintä (4 pt).

**Mittaus:** `node layout_check.js` rakentaa jokaisesta listarivistä kaksi
korttia (oletus ja kaikki valinnat + nimi, note, +pts, jäsenet) sovelluksen
omalla `cardHTML()`:lla, sovittaa ne headless-Chromessa sovelluksen omalla
`fitCards()`:lla fonttien latauduttua ja laskee lohkoittain
suunnittelukoko × fit-skaala × kortin skaala. `print_overflows` on korttien
määrä, joiden sisältö ei mahdu; `unreadable_print_cases` niiden, joilla jokin
lohko painuu rajan alle. `acceptance.py` ajaa mittauksen (TULOSTUS) ja
raportoi luvut; selaimen puuttuessa mittari on "ei mitattu".

**Miten rajaan päästiin:** rivien korkeus mitataan sisällöstä (`fitCards`
tasapainottaa LOADOUT-, ARMAMENT/SPECIAL- ja critical-rivit niin, että
pienin teksti on joka rivillä samankokoinen), option valintaruutu ja
kaarirosetti eivät enää määrää rivin korkeutta, 9+ option lista on
kaksipalstainen, 7+ option kortilla option kuvaushäntä ei tulostu,
40 hitin rungon vauriolaatikko on 58 mm, sääntöpalsta saa leveyttä
asetaulukolta kun se on mitaten lyhyempi, ja pisimmät sääntötiivistelmät
(hulkit, tyranidit, orkit) sekä s.255:n ja s.374:n kertomuslauseet
lyhenivät. Sovitus tehdään vasta `document.fonts.ready`:n jälkeen — sitä
ennen tehty sovitus mittasi varafontin ja leikkasi rivin.

## 6. Julkaisuartefaktit vastaavat toisiaan

- Kehitysversio, sivustoversio ja ZIP:n HTML ovat samasta buildista.
- Generoitu data vastaa lähdedataa (toistettavuus).
- Julkaisupaketti syntyy yhdellä dokumentoidulla komennolla.
- Puhdas asennus toimii offline-tilassa ilman kehitysympäristöä.

`share version/` -kansiota ei hallita gitillä eikä siihen lisätä mitään
käsin. 12.10.2026 alkaen `build.py` pakkaa sen ZIP:n jokaisen buildin
lopuksi (`julkaisu/make_share_zip.py`: yksi HTML, ilman Play-nappia), ja
`acceptance.py` tarkistaa vastaavuuden lukemalla — `share_zip_current` on
siis "kyllä" aina, kun juuren HTML on tehty `build.py`:llä.

Nykytila 10.9.2026 (kohta 11): kehitys- ja sivustoversio samasta buildista
(`artifact_mismatches` 0), data toistettava, julkaisukomennot ja -askeleet
`docs/JULKAISU-1.0.md`:ssä. ZIP:n pakkaus on käyttäjän askel: siihen asti
`share_zip_current` on "EI" ja tuomio `VAKAUTUS KESKEN` — se ei ole vika
vaan pakkaamaton paketti.

## 7. Laatuportti ennen julkaisua

- kaikki tarkistimet vihreinä: rakenne, referenssit, golden, yksiköt,
  tallennus, kortit, satunnaisajo, profiilit, PDF-audit
- ei avoimia P0- tai P1-tehtäviä
- P2-viat korjattu tai kirjallisesti hyväksytty tunnetuiksi rajoitteiksi
- vähintään yksi manuaalinen smoke-kierros selaimessa: rakenna, tallenna,
  avaa, tulosta
- **manuaalinen korttipistokoe** jokaisella kierroksella (`docs/PISTOKOE.md`):
  lähde ensin, kortti vasta sitten; löydös on golden-tapaus (`card_contains`
  / `card_lacks`) ennen korjausta. Kahden 9.9.2026 pistokokeen löydökset
  ovat kohta 10b (tehty 10.9.).
- dokumentaatio vastaa toteutusta

Tila 10.9.2026 (kohta 11): tarkistimet vihreinä (17 askelta), P1-tehtäviä 0
avoinna, P2-viat kirjattu v1.1-jonoon (`docs/BACKLOG.md`), smoke-kierros
selaimessa tehty (`docs/JULKAISU-1.0.md`), kaksi omaa pistokoetta
(`docs/pistokokeet/`), dokumentaatio päivitetty.

## 8. Rajaus on jäädytetty

v1 ei edellytä kaikkien Battlefleet Gothic -sääntöjen digitalisointia.
Sen on oltava yksiselitteistä, mitä v1 tukee. Uusia ominaisuuksia ei
lisätä ennen kuin yllä olevat ehdot täyttyvät. Kampanjat, taistelun
aikainen sääntömoottori, hienompi käyttöliittymä ja muut lisät ovat v1.1+.

---

## Tiivistettynä

```
TUOMIO: LAPI  edellyttaa

  golden_failures          0
  golden_gaps              0
  surface_disagreements    0
  save_roundtrip_failures  0
  effect_queue_open        0
  invalid_acks             0
  unclassified_rules       0
  open_tasks_p1            0
  artifact_mismatches      0
  build_reproducible       kylla
  print_overflows          mitattu, 0
  unreadable_print_cases   mitattu, 0
  upgrade_effect_open      0   (audit_upgrades.py — päivitys ilman vaikutusta)
```

10.9.2026: jokainen rivi on nollassa tai "kyllä" paitsi `share_zip_current`,
joka muuttuu "kyllä":ksi kun käyttäjä pakkaa ZIP:n samasta buildista
(`docs/JULKAISU-1.0.md` §Miten pakataan). Sen jälkeen tuomio on `LAPI`.
