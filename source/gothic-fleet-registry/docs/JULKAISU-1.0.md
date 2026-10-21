# Gothic Fleet Registry 1.0 — julkaisumuistio

Päiväys: 10.9.2026 · versio näkyy sivun lähderivillä ("Gothic Fleet Registry v1.0")
ja ladatun korttitiedoston alaotsikossa (`APP_VERSION`, `build.py`).

## Mitä 1.0 on

Yksi HTML-tiedosto, joka toimii selaimessa ilman asennusta ja ilman verkkoa
(fontit upotettu). Sillä kootaan Battlefleet Gothic: Remastered -laivasto
(Fleets Book WiP v0.36, Rulebook v1.10), tarkistetaan sen laillisuus ja
tulostetaan aluskortit, komentajakortit ja rosteri.

- **32 laivastolistaa, 171 alusprofiilia**, 156 aluskohtaista optiota ja
  listojen omat päivitykset (re-rollit, Markit, gubbinit, refitit, gifts…).
  Vain listan sallimat alukset ja niiden omat optiot tarjotaan, listan omalla
  hinnalla.
- **Yksi laskennallinen totuus** (`domain.js`, `resolveUnit` / `resolveFleet`):
  hinta, statsit, aseet, optioiden vaikutukset ja kortin säännöt lasketaan
  yhdessä paikassa; kortti, laivastonäkymä, rosteri ja Copy list ovat sen
  projektioita. 80 golden-tapausta kirjasta luettuina odotuksina.
- **Laillisuustarkistus** 202 listasäännölle (`enforced`), manuaalisiksi
  merkityt 9 ja rajauksen ulkopuoliset 21 näytetään rakentajassa
  perusteluineen (`referenssi/NN_*.json`, `docs/RULES_TRUTH.md`).
- **Kortit**: 144 × 135 mm, kaksi per A4, tulostus 100 %. Rivit
  tasapainotetaan sisällön mukaan; 1048 mitatusta kortista 0 ylivuotaa ja
  0 painuu alle 4,2 pt:n (`layout_check.js`, DoD §5). Kortti kertoo
  ostetun kyvyn säännön, listakohtaisen säännön yleisen sijaan ja jättää
  pois säännöt, joita alus ei voi käyttää (kohta 10b, kaksi ulkopuolista
  pistokoetta 9.9.2026).
- **Tallennus** selaimen muistiin (schema 2, `docs/SAVE_SCHEMA.md`): vanha
  tallenne migroituu ilmoituksella, uudempi hylätään varmuuskopiolla.
- **Ladattava editointitiedosto**: sama korttiarkki itsenäisenä HTML:nä,
  jossa tekstit ovat muokattavia ja sovitus ajetaan uudestaan.

## Mitä 1.0 ei ole

- Ei kampanjasääntöjä, ei taistelun aikaista sääntömoottoria, ei tilejä eikä
  pilvitallennusta.
- Listasäännöt, jotka ovat `manual` tai `out_of_scope`, jäävät pelaajan
  vastuulle — ne näytetään, ei valvota.
- Kortin sääntötekstit ovat tiivistelmiä sivuviitteineen, eivät kirjan
  korvike.
- v1.1-jono (`docs/BACKLOG.md`): toistettavat listapäivitykset (Tyranid
  carapace), gravitic hook -kapasiteetti profiileista, listojen väliset
  reservit, Warlordin sijoitus alukselle, aseluokitus ("rely solely on
  weapon batteries"), "or"-vaihtoehtorivien tiiviimpi esitys, aluskortin
  PTS-kenttä (käsin täytettävä; komentajakortti tulostaa summan), nimetyt
  tallenteet / JSON-tuonti / undo.

## Hyväksyntä

`python acceptance.py` (17 askelta) → tuomio. 10.9.2026: kaikki askeleet
LÄPI, DoD-mittarit nollassa tai "kyllä", **paitsi `share_zip_current`**, joka
on käyttäjän oma askel (alla). Kun zip on pakattu samasta buildista, tuomio
on `LAPI`.

Smoke-kierros selaimessa 10.9.2026 (`julkaisu/site/index.html`, Chrome):
lista → alukset napista → runkovalinta (Venerable → Mars) → optio →
komentajan päivitys → nimi → tallennus → sivun uudelleenavaus palautti saman
laivaston (550 pts, ei ilmoitusta) → Print cards rakensi arkin (3 korttia,
0 ylivuotoa, skaala 1.0) → Download for editing tuotti 366 kB tiedoston,
joka renderöityy itsenäisesti samalla sovituksella → Print roster (7 PASS,
0 FAIL) → Copy list.

## Miten pakataan ja julkaistaan

1. `python acceptance.py` — tuomio ei saa olla `HYLATTY`.
2. Jakelupaketti: `Gothic Fleet Registry.html` zipiin
   `share version/Gothic Fleet Registry.zip` (kansio on vain luku
   kehitysketjulle; pakkaus on käyttäjän askel). Esimerkiksi PowerShellissä
   projektikansiossa:
   `Compress-Archive -Force -Path "Gothic Fleet Registry.html" -DestinationPath "share version\Gothic Fleet Registry.zip"`
3. `python acceptance.py` uudestaan → `share_zip_current: kylla` → `LAPI`.
4. Sivusto: `julkaisu/site/` (index.html, og.png, _headers) raahataan
   Cloudflare Pagesiin (`julkaisu/make_site.py` tekee kansion buildista ja
   tarkistaa, että se eroaa jaettavasta vain og/canonical-metatiedoilla).
5. Git-tagi `v1.0` commitille, josta zip ja sivusto on tehty.

## Tunnetut rajoitteet

- Kirjan WiP-versio: data on Fleets Book WiP v0.36:sta; uusi painos vaatii
  `extract.py → lists.py → build_data.py → build.py` -ajon ja goldenien
  tarkistuksen (`AGENTS.md`).
- Vanha tallenne (schema 1) palauttaa aluksen optiot sijainnin perusteella ja
  sanoo sen kerran; seuraava tallennus kirjoittaa schema 2:n.
- Tulostus on mitattu Chromella; muiden selainten sovitus voi poiketa
  hieman (sama `fitCards()` ajetaan, fontit ovat upotetut).
