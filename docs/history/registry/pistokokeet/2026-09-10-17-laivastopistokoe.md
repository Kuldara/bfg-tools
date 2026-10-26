# Pistokoe 17 — laivastotason ja siirtymien manuaalinen sarja (10.9.2026)

Käyttäjän pyyntö: "tee vielä iso sarja erilaisia manuaalisia pistokokeita mitä
ikinä keksitkään". Aiemmat pistokokeet (8–16) olivat riviotoksia: yksi
listarivi kerrallaan. Tämä sarja katsoo sitä, mitä riviotos ei näe:
kokonaisia laivastoja, laivueiden kokoa, valintojen järjestystä,
vauriorajoja, nimettyjä hahmoja ja saman rungon hintaa eri listoilla.

## Menetelmä

- Odotukset luettiin ensin kirjasta: Fleets WIP v0.36 (teksti
  `tmp/pdfs/fleets.txt`, sivut sivunumerorivien mukaan) ja Rulebook v1.10.
- Sovellus vain tulosti. Kaksi kertakäyttöistä koetinta (eivät repossa):
  `fleetprobe.js` rakentaa laivaston ja tulostaa jokaisen `resolveFleet`-
  tarkistuksen, `transprobe.js` ajaa `transition`-askelia ja tulostaa hinnan,
  maksimin, hitit, crippled-rajan, ilmoitukset ja `validateIntent`-ongelmat.
- Vertailu kirjaan tehtiin käsin. Jokainen korjaus: testi ensin punaisena
  vanhalla datalla, sitten korjaus, `python acceptance.py`, commit.

Kulmat:

| kulma | mitä | tapauksia |
|---|---|---|
| S1 | laivaston kokoonpano: komentajat, pakolliset, pisterajat, suhdeluvut | ~70 laivastoa |
| S2 | laivueiden koko ja rungoittain hinnoitellut päivitykset | 21 |
| S3 | optio- ja päivityssiirtymät (riippuvuus, ryhmä, poissulku, ketjut) | 11 |
| S4 | vauriopisteet ja crippled-raja muutosten jälkeen, kortin laatikot | 10 |
| S5 | nimetyt hahmot ja 0-1-rajat | 17 |
| S6 | saman rungon hinta eri listoilla kirjan hintariveihin | 14 runkoa |

## Löydökset

| # | kulma | löydös | prio | korjaus |
|---|---|---|---|---|
| V1 | S1 | s.234 "You may include Abaddon the Despoiler as the Warmaster in any Chaos Fleet worth more than 1,000 points." Abaddonin johtama laivasto sai virheen "Chaos Warmaster missing", yli 1 000 pisteen rajaa ei tarkistettu, ja Abaddon + Warmaster kelpasi. | **P1** | `57a814d` |
| V2 | S1 | s.237/241/245/249 "A fleet 1,000 points or more may include the X as one of its battleships" (Scion of Prospero, Terminus Est, Slaverer, Wage of Sin): lause oli pelkkää tekstiä, 999 pisteen laivasto kelpasi. | P2 | `57a814d` |
| V3 | S2 | s.455 "Defenders are fielded in squadrons of 2–6 ships." Sääntö oli sidottu SQUADRONS-osioon, jossa ei ole aluksia: 1 tai 7 Defenderiä kelpasi (Merchant ja Commerce Protection). Referenssi merkitsi sen `enforced`. | P2 | `23b898c` |
| V4 | S2 | s.174 "A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship": saattajien määrää RT-alusta kohden ei valvottu. | P2 | `23b898c` |
| V5 | S5 | s.316/317/318 "Your fleet may be led by an Eldar Hero, in place of its normal fleet commander." ja s.319 "Yriel may be taken instead of the Hero Fleet Commander as listed in the Corsair and Craftworld Eldar fleet lists." Heron tai Yrielin johtama yli 750 pisteen laivasto sai virheen "Pirate Prince missing" / "Autarch missing"; Hero ×2, Hero + Prince, Autarch + Hero, Hero + Yriel ja Yriel ×2 kelpasivat. | **P1** | tämä commit |
| V6 | S3, S4 | Domain-rajapinnan johdonmukaisuus: `transition` ja `validateIntent` eivät valvo kaikkea, mitä käyttöliittymän pinnat (`optionsOf`, `upgradesFor`) valvovat. (a) Warspheren "10HP or greater" (`hpmin`) on vain `optionsOf`:n `blockedBy`:ssä; `transition` antaa ottaa +1 shieldin 8 HP:n pallolle ja hinta veloittuu. (b) Päivitys ↔ päivitys -poissulku (`noup`, Daemonship vs. CSM-miehistö s.235) ei noudata "myöhempi valinta voittaa": molemmat putoavat. (c) Siivous tehdään yhdellä valintakuvalla, joten pudotetun päivityksen riippuvat (miehistön Mark) jäävät otetuiksi. (d) Liittämätön rivi (`at`, "Daemonship: Battleship" risteilijälle) hyväksytään ja täyttää Markin ehdon ilmaiseksi. Käyttöliittymä ei pääse näihin tiloihin: se piilottaa estetyt valinnat. | P3 | BACKLOG J19 |

Korjausten rakenne:

- **V1, V5** samalla mallilla: pakollisen komentajan `mandatory_at` saa pickin,
  joka kattaa korvaavan komentajan osion, ja sama kirjan lause antaa rajan
  "enintään yksi komentaja". `RULE_PICKS`, referenssi `enforced`.
- **V2** `allowed_at` 1 000 neljälle nimetylle taistelulaivalle.
- **V3** `squadron`-sääntö tuntee nyt pickin (`domain.js`): luokka nimeltä,
  ei osion otsikko.
- **V4** `RULE_PICKS` sai avaimet `list_is` (tarkka listan nimi, koska
  "Rogue Traders" on kahden muun listan nimen alku) ja `match_src` + `add`
  (toinen sääntö samasta lauseesta). Raja: enintään kuusi saattajaa
  RT-alusta kohden; rahtialukset eivät kuulu siihen ("these squadrons can
  only contain cargo ships"), Havoc lasketaan saattajaksi ja Siluria
  alukseksi (Nate Montes: "as a cruiser and an escort respectively").
- Regressiotestit `test_validator.js`:ään (33 uutta tarkistusta). Samalla
  `findEntry` suosii tarkkaa nimeä: "Wage of Sin" osui ensin miehistöriviin
  "Wage of Sin: Chosen Terminators".

## Tulkinnat ja tiedossa olevat (ei muutosta)

- **Black Crusaden Daemonship-Mark of Tzeentch +30.** s.227 "…with the same
  effects and cost in points as described on pg. 232" (s.232: +30). Listan
  oma lause s.235 "with the same effects and points cost" jättää sivun pois,
  ja saman listan Lordien ja miehistön Mark maksaa +25 (s.234). J12:ssa
  todettu kirjan mukaiseksi (s.227); jätetään.
- **Pirates s.179** "At least one squadron of 3–6 escort vessels must be
  included for each cruiser": koko 3–6 valvotaan, risteilijäkohtainen
  vähimmäismäärä ei (referenssissä kirjattu).
- **Rogue Traders Exploration s.177** "may accompany each Rogue Trader
  cruiser": se, mitkä listan aluksista ovat "Rogue Trader cruisereita"
  (s.180 "Any cruiser hull allowed in the Rogue Trader fleet…"), on
  tulkinnanvaraista, joten rajaa ei lisätty.
- **Sekalaivueet** ("in any mix desired") eivät ole yksikkömallissa;
  RT-raja on siksi saattajien kokonaismäärä, ei laivueiden määrä.
- **Grey Knights -listan sivuviitteet** "Rapid strike vessel (Sword) (pg. 104)
  (pg. 80)" ja "(Cobra) … (pg. 82)" ovat kirjan painovirhe (s.80 on Falchion,
  s.82 Sword); data seuraa nimiä.
- **Kroot Warsphere** voi ottaa +2HP- ja −2HP-option yhtä aikaa; kirja ei
  kiellä, hinnat kumoavat toisensa.
- S1:n aiemmin todetut: Exploration-listan raskaan kuljetuksen osuus lasketaan
  pisteistä, Pirates-listan kapteenivaatimus pisterajasta.

## Läpäisyt kirjaa vasten

- **S2:** laivuekoot Necron (s.404), Imperial (2–6), Hive Fleet (1–12),
  Vanguard (6–12), Rogue Traders (2–6); Mechanicus-saattajien +1 turret
  "+5 points" per alus (3 × 35 + 15 = 120), Orkkien Dakka Dakka "for +5
  points per escort" (4 × 40 + 20 = 180, 6 × 40 + 30 = 270).
- **S3:** Chaos Battle Barge CSM → Chosen (s.255: 410 → 445 → 455, CSM pois
  avaa Chosenin), Dragonshipin keel → Vampire raiders -ketju, Torture
  "one of the following" (Impaler I + II yksi valinta, launch bays avaa
  molemmat), Black Crusaden miehistön Mark yksi kerrallaan ja miehistön
  poisto pudottaa Markin, Mechanicus-Lunar Power Ram ↔ Nova molemmissa
  järjestyksissä ja laillinen maksimi 235.
- **S4:** Lunar 8 → crippled 4 (Rulebookin oma esimerkki), Daemonship + Mark
  of Nurgle 9 → 5, Warsphere +2HP × 3 = 16 ja −2HP × 2 = 6, Hive ship
  Reinforced Carapace × 2 = 12, risteilijä ei saa Carapace × 4 (s.427 "no
  more than three for cruisers"). Kortti laskee crippled-laatikon samasta
  `ceil(hits/2)`:sta kuin resolveri.
- **S5:** "0-1 Planet Killer", "0–1 Chaos Space Hulk", Abaddon × 2, Rath × 2 ja
  Rath + Solar Admiral ("0-1 Admiral", s.48–49) kaatuvat.
- **S6:** Mechanicus s.125 (Emperor 400, Retribution 380, Oberon 370,
  Dictator 255, Tyrant 220, Gothic 215, Lunar 215, Endeavour 125, Endurance
  125, Defiant 130), Rapid strike vesselit (45/40/35, Falchion 40),
  Exploration-Lunar 195 ja RT-Dauntless 125 vastaavat kirjan hintarivejä.

## Tulos

Kaksi P1:tä ja kolme P2:ta korjattu kolmessa commitissa, P3-kokonaisuus
työjonoon (J19). Kaikki P1/P2-löydökset olivat samaa lajia: kirjan lause,
joka nimeää luokan tai korvaavan komentajan, kun moottori odotti osion
otsikkoa. Tämä on sama juurisyy kuin Tau-listojen 7.9.2026 korjaus
(referenssin huomio) — riviotos ei näe sitä, koska yksittäinen rivi on
kunnossa; vika näkyy vasta kokonaisessa laivastossa.
