# AGENTS.md — työohjeet tähän projektiin

Lue tämä kokonaan ennen ensimmäistä muutosta. Se on lyhyt, ja se säästää
sinulta puoli tuntia arkkitehtuurin uudelleenselvittämistä.

**Gothic Fleet Registry** on yhden HTML-tiedoston selainsovellus, jolla
rakennetaan Battlefleet Gothic: Remastered -laivastoja ja tulostetaan
alus- ja komentajakortit. Kaikki data on poimittu sääntökirjan PDF:stä.

Kommentit ja dokumentit ovat suomeksi, käyttöliittymä ja korttien teksti
englanniksi. Jatka samalla tavalla.

---

## 1. Auktoriteetti

Ainoa sääntöjen auktoriteetti on PDF:

```
F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf
F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Rulebook-v1-10.pdf
```

Fleets Book WiP **v0.36** (28.8.2025) ja Rulebook **v1.10** (7.5.2024).

**Kolmas auktoriteetti (käyttäjän päätös 20.10.2026):** High Admiraltyn
Collected FAQ 2026. Ristiriidassa FAQ voittaa. Lukittu vienti on
`referenssi/faq2026_20261020.txt` (check_quotes.py lukee sen neljäntenä
lähteenä), ja tarkistusraportti on
`F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\warp_rift\FAQ2026_tarkistus.md`.
Viittaa FAQ:iin kohdan nimellä (esim. *Power ram*) ja kirjan sivulla, jota se muuttaa.

- Jokaisella sääntömuutoksella on oltava **sivunumero**. Ei sivua, ei muutosta.
- Älä päättele sääntöä sovelluksen omasta datasta. Se on juuri se, mitä
  ollaan tarkistamassa.
- Jos kirja on ristiriitainen, kirjaa ristiriita äläkä valitse hiljaa.
  (Esimerkki: s. 62:n gunnery-esimerkki sanoo 7D6 ja taulukko näytti sanovan
  9D6 — ristiriita kirjattiin, ja 5.10.2026 selvisi, ettei kirjassa ole
  ristiriitaa: taulukko oli luettu yhden sarakkeen verran liian vasemmalta.
  Vasen sarake on Defences, FP 10 lähestyvää capital shipiä vastaan = 7.
  Kirjaaminen teki virheen löydettäväksi. Tämä sovellus ei laske gunnery-
  noppia; taulukko esiintyy vain sääntöteksteissä.)

## 2. Mikä on lähde ja mikä generoitu

**Muokattavia lähdetiedostoja:**

| tiedosto | mitä |
|---|---|
| `extract.py` | poimii alusprofiilit PDF:stä → `profiles_raw.json` |
| `lists.py` | poimii laivastolistat PDF:stä → `lists_raw.json` |
| `build_data.py` | yhdistää, korjaa käsin, generoi säännöt → `bfg_data.json` |
| `upgrades.py`, `swaps.py` | päivitykset ja aseiden vaihdot |
| `domain.js` | puhdas domain-moduuli (intent, adapteri; P1-8b→ laskimet) — `build.py` upottaa `__DOMAIN__`-kohtaan, Node-testit `require`vat suoraan |
| `app_template.html` | sovelluksen runko: HTML + CSS + käyttöliittymä-JS (`__DOMAIN__`- ja `__DATA__`-merkit) |
| `build.py` | upottaa datan malliin → valmis HTML |
| `play/play_template.html`, `play/play_rules.js`, `play/build_play.py` | pelin aikainen kännykkäkortti: oma sivu, jonka builderin Play-nappi avaa; säännöt `play_rules.js`:ssä sivunumeroin, testi `play/test_play.js`; päätökset `play/LUEMINUT.md` |
| `referenssi/*.json` | **käsin kirjasta luettu totuus** |
| `test_*.js`, `check_*.py`, `audit*.py`, `qa_structure.js`, `stress.js` | tarkistimet |

**Generoituja — älä koskaan muokkaa käsin:**

```
profiles_raw.json      lists_raw.json      bfg_data.json
Gothic Fleet Registry.html                 julkaisu/site/
play/Gothic Fleet Play.html
SAANTOAUDIT.md         docs/DEVELOPMENT_STATUS.md
```

Jos tuotanto-HTML:ää pitää muuttaa, muuta `app_template.html` ja aja
`python build.py`. Käsin tehty korjaus valmiiseen HTML:ään katoaa
seuraavassa buildissa ilman varoitusta.

**`share version/` — älä lisää sinne mitään käsin.** `build.py` pakkaa sinne
jokaisen buildin lopuksi `Gothic Fleet Registry.zip`:n (käyttäjä 12.10.2026:
paketti pidetään automaattisesti ajan tasalla): tasan yksi tiedosto, sama
HTML ilman Play-nappia (`julkaisu/make_share_zip.py`). Kansioon ei kuulu
mitään muuta.

## 3. Työnkulku

```
1. Etsi auktoriteettinen sivu PDF:stä.
2. Lisää tai päivitä riippumaton golden-tapaus (referenssi/golden_cases.json).
3. Osoita että tapaus on PUNAINEN:  node test_golden.js
4. Tee pienin mahdollinen korjaus oikeaan kerrokseen (ks. §4).
5. Aja koko hyväksyntä:  python acceptance.py
6. Rakenna generoidut vain build.py:n kautta.
```

Vaihetta 3 ei saa ohittaa. Testi, joka ei ole koskaan ollut punainen, ei
todista mitään.

**Pistokoe joka kierroksella** (`docs/PISTOKOE.md`): ennen kohdan
päättämistä valitaan 2–3 korttia — yksi siemenellä arvottu, loput
päätellyistä heikoista kohdista — luetaan kirjasta kaikki mitä kortilla pitää
olla, generoidaan kortti sovelluksen omalla polulla ja verrataan käsin:
puuttuuko, onko ylimääräistä, onko ristiriitaa. Löydös on golden-tapaus
(`card_contains` / `card_lacks`) ennen korjausta. Vihreä testisarja ei
todista kortin sääntösemantiikkaa (9.9.2026: 68/68 vihreää, 13 löydöstä
kahdessa pistokokeessa).

## 4. Mihin kerrokseen korjaus kuuluu

| oire | korjaa täältä |
|---|---|
| arvo väärin PDF:stä luettuna | `extract.py` / `lists.py` |
| yksittäinen kirjan poikkeus | `build_data.py`:n kuratoidut taulut |
| optio ei muuta profiilia | `build_data.py` → `OPT_EFFECTS` |
| listasääntö ei valvo | `build_data.py` → `RULE_PICKS` + `referenssi/NN_*.json` |
| listan päivitysrivi tarjotaan alukselle, jolle kirjan lause ei sitä anna | `upgrades.py` → EXTRA-rivin `cond` tai kirjan oman rivin `ROW_CONDS` (avaimet `cap/esc/ty/nm/nmno/prow/has/no/noopt/offopt/up/noup/fl/flno`, `domain.js condOK`; `noopt` = aluksella on tällainen optio, `offopt` = sellainen optio on otettu) |
| aluksen oma optio ja listan rivi ovat sama osto | `build_data.py` → `OPT_EFFECTS` avain `cov` (`domain.js optionCoversRow`); per-bay/per-hull-rivi katetaan nimellä |
| kortti tai käyttöliittymä | `app_template.html` |

**Korjaa juurisyy, älä yksittäistapausta.** 8.9.2026 kolme alusta sai
`range="– Capacity:"`. Yksittäiskorjaus olisi siistinyt kolme riviä;
juurisyykorjaus (`extract.py` päättelee sarakkeen solun keskikohdasta eikä
sanan vasemmasta reunasta) korjasi kuusi riviä ja esti koko luokan.

## 5. Kiellot

- **Älä johda testiä toteutuksesta.** Odotus luetaan kirjasta. Testi, joka
  lukee saman datan jota se testaa, vahvistaa vain että koodi tekee sen
  minkä se tekee. Näin `test_validator.js:256` lukitsi väärän oletuksen
  Venerable battle bargesta vuosikausiksi vihreänä.
- **Älä lisää uusia ominaisuuksia vakautusvaiheessa.** Katso
  `docs/BACKLOG.md`. Jäädytys on voimassa kunnes prioriteetti 3 on maalissa.
- **Älä säilytä yhtä tehtävää useassa vaikutusluokassa.** Yksi tehtävä =
  yksi vaikutusperhe. Sekalaiset löydöskorjaukset ovat katselmoimattomia.
- **Älä pura yhden HTML-tiedoston jakelumallia.** Se on tuotteen vahvuus:
  toimii offline, ei asennusta, yksi tiedosto. Modulaarinen lähde on ok,
  jos build tuottaa yhä yhden tiedoston.
- **Älä vaienna punaista testiä.** Jos tarkistin on väärässä, korjaa
  tarkistin ja perustele kirjan sivulla — älä poista väitettä.
- **Älä koske `share version/`-kansioon käsin.** Sen ainoa tiedosto syntyy
  `build.py`:stä (§2).

## 6. Ansat, jotka ovat jo kaataneet jonkun

**Heredoc syö kenoviivat.** Kirjoita regexejä sisältävät korjausskriptit
tiedostoon Write-työkalulla, älä bash-heredocilla. Heredoc muutti
`\b`-sanarajat kirjaimellisiksi backspace-merkeiksi, jolloin regex kääntyi
virheettömästi eikä osunut mihinkään.

**UTF-8.** Kirjoita aina `io.open(polku, encoding="utf-8")`. Konsolissa
käytä `PYTHONIOENCODING=utf-8`, muuten Windowsin cp1252 kaataa tulostuksen
ääkkösiin ja ajatusviivoihin.

**Kuratoidut taulut osuvat täsmälleen kerran.** `build_data.py`:ssä on noin
289 riviä käsin kirjasta luettuja korjauksia (`FIXES`, `RULE_PICKS`,
`OPT_EFFECTS`, `ENTRY_LIMITS`, `DROP_SECS`, …). Jokainen on väitetty
osumaan **tasan kerran**, joten hiljainen ajautuminen kaataa buildin. Jos
build kaatuu tähän, älä löysää väitettä — selvitä miksi osuma katosi.

**Osioindeksin siirtymä on vaarallisin vikaluokka.** Säännöt viittaavat
osioihin NUMEROLLA (`sec`, `allow_sec`, `per_sec`, pick-listojen `sec`).
Kun listaan lisätään osio, numerot siirtyvät — ja väärä mutta olemassa
oleva indeksi ei näy mistään: moottori laskee tyhjästä osiosta nollan ja
näyttää vihreää. `build_data.py`:ssä on vartija, joka muistaa osion NIMEN.

**Node 24: `global.navigator` on vain luettava.** Testit, joissa ei ole
`"use strict"`, selviävät vain koska sijoitus epäonnistuu äänettömästi.

**Sivualan periaate.** Kun kaksi laivastolistaa ovat kirjassa vierekkäin,
tarkista mitä väliin jäävillä sivuilla on. Grey Knights, Eldar Corsairs ja
Ork Clanz olivat kaikki sama vika eri muodossa.

**Aluksen säännöt jatkuvat profiilisivun jälkeen.** `extract.py` lukee
vain sivun, jolla on TYPE/HITS-otsikko. Chaos Space Hulkin säännöt ovat
sivuilla 287–288, Ork Hulkin 390–391 — profiilisivu sisältää vain statsit,
aseet ja loren. 8.9.2026 rajasin critical-taulukon vain Ork Hulkille,
koska "s.286 ei sano criticaleista mitään": luin väärän sivun, ja
tulostettu kortti paljasti sen. **Lue aina profiilisivun jälkeiset sivut
seuraavaan profiiliin asti.** Kunnes poimija osaa sen, sääntösivut
kirjataan `SPECIAL_HULL_RULES`iin käsin sivunumeroineen.

## 7. Työkalut

```powershell
python acceptance.py            # koko hyväksyntä, yksi tuomio
python acceptance.py --quick    # ilman hitaita PDF-ajoja
node test_golden.js -v          # kirjasta luetut tapaukset, kaikki pinnat
node test_domain.js -v          # domain.js ilman HTML:ää: ID:t, adapteri, migraatio, puhtaus
python audit_effects.py -v      # mallintamattomien vaikutusten jono
python check_profiles.py -v     # statsit ja aseet oikeassa sarakkeessa
python check_reference.py       # listasäännöt referenssejä vasten
node layout_check.js            # tulostuksen luettavuus: ylivuodot ja alle 4,2 pt:n teksti
python sheet_check.py -v        # korttiarkki oikeana PDF:nä: paperi, korttikoko, sivutus (ei acceptancessa)
node spot_check.js --seed N     # pistokoe: arvottu kortti + kirjan sivut rinnakkain (docs/PISTOKOE.md)
```

Hyväksynnän tuomio on kolmiportainen:

| tuomio | merkitys |
|---|---|
| `LAPI` | kaikki vihreää eikä tiedettyä työtä jäljellä |
| `VAKAUTUS KESKEN` | mikään ei ole rikki, mutta työtä on jäljellä |
| `HYLATTY` | jokin on rikki — tarkistin kaatui tai tapaus, jonka pitäisi mennä läpi, ei mene |

Älä muuta `HYLATTY`-tilaa `VAKAUTUS KESKEN` -tilaksi merkitsemällä tapaus
aukoksi. Aukko on tiedetty puute, ei tapa vaientaa regressio.

## 8. Mistä aloittaa

1. `docs/DEFINITION_OF_DONE.md` — mitä "valmis" tarkoittaa ja millä
   mittareilla se todetaan.
2. `docs/DEVELOPMENT_STATUS.md` — mitatut luvut (generoitu, ei käsin;
   luo se ajamalla `python acceptance.py`).
3. `docs/BACKLOG.md` — järjestys ja perustelut.
4. `tasks/P1-*.md` — rajatut tehtävät, yksi vaikutusluokka kussakin.
5. `docs/DOMAIN_CONTRACT.md` — mikä on ratkaistu alus.
6. `docs/RULES_TRUTH.md` — miten kirjasta luettu totuus kirjataan.

**Jokaisen vaiheen jälkeen sovellus on julkaisukelpoinen.** `acceptance.py`
rakentaa myös `julkaisu/site/` ja hylkää, jos se ei vastaa kehitysversiota.
Välivaihe, joka rikkoo jonkin pinnan, ei ole välivaihe vaan väärä jako.

Golden-tapaus nimeää aina laivastolistan (`list`) ja yksikkö luodaan
`addUnit()`:lla — kuten sovelluksessa, pakollisine päivityksineen. Kun
kirjoitat tapauksen, lue odotus **aluksen omalta sivulta**: ensimmäinen
Warsphere-tapaus kopioi vahingossa toisen aluksen nopeuden, ja ajuri
nappasi sen.

**Kohdat 0–12 ovat tehty (10.9.2026): v1.0 on julkaisukelpoinen**
(`docs/JULKAISU-1.0.md`). Kohta 12 oli tilastollinen korttipistokoe: ensimmäinen
90 rivin satunnaisotos löysi P1-vikoja 21 %:sta riveistä vihreiden testien
takaa (Chaos-Markit ja Daemonshipit, Tau-re-rollit, optiovaikutukset); niiden
korjausten jälkeen uusi 90 rivin otos antoi P1 0 %, P2 4 % (korjattu) —
`docs/pistokokeet/2026-09-10-4-tilasto.md` ja `…-5-tilasto-2.md`. Jäljellä
ovat käyttäjän askeleet: ZIP:n pakkaus `share version/`-kansioon, Cloudflare
Pages -julkaisu, git-tagi `v1.0`. Seuraava kehitystyö on v1.1-jono
(`docs/BACKLOG.md`); jokaisella kierroksella pistokoe (`docs/PISTOKOE.md`) ja
laajemman sääntömuutoksen jälkeen 90 rivin otos (`sample_rows.py`). Kohta 10b on tehty: kahden pistokokeen 13
löydöstä on suljettu goldenilla ja korjauksella (`docs/pistokokeet/`).
Kohta 10 on tehty: tulostuksen luettavuusraja on mitattu
(`layout_check.js`, DoD §5). Kohta 9 on tehty:
tallennusskeema 2 on lukittu (`saveDocument`, `docs/SAVE_SCHEMA.md`). P1-1…P1-8 ja kohta 8 ovat tehty (9.9.2026):
`domain.js` sisältää adapterin, laskimet, säännöt, `resolveUnit` v1:n,
`validateIntent`in, `transition`in ja `resolveFleet`in; template on
projektioita ja käyttöliittymää. Listasääntö, jota jäsennin ei tunnista,
kirjataan `build_data.py`:n `RULE_PICKS`-tauluun kirjan lauseella ja
sivulla, ja sen status `referenssi/NN_*.json`:ssa on `enforced`. Uusi laskenta kirjoitetaan `domain.js`:ään
puhtaana funktiona `(intent|selection, ctx, catalog)` ja testataan
`test_domain.js`:ssä ilman HTML:ää — ei templaten kuoriin.

Muutos valintoihin kulkee aina `DOMAIN.transition`in kautta (näkyvä ilmoitus),
kelvoton tila raportoidaan `issues`-rivinä eikä korjata hiljaa.

## 9. Yksi tehtävä kerrallaan, yksi LLM kerrallaan

`app_template.html` on 3 000 rivin monoliitti. Kaksi agenttia ei voi
muokata sitä yhtä aikaa. Rinnakkain voi sen sijaan tehdä:

- **kirjan lukemista** → `referenssi/`-rivejä (ei koske sovellukseen)
- **golden-tapausten kirjoittamista** → `referenssi/golden_cases.json`
- **katselmointia** → ei korjaa omaa löydöstään

Monoliitin muutokset integroidaan yksi kerrallaan.
