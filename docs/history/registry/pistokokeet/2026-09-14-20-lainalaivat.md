# Pistokoe 20 — lainalaivat (1.1) ja neljä uutta koneellista menetelmää

Päiväys: 14.–15.9.2026
Tarkastustapa: lähde ensin, sovellus vasta sen jälkeen (`docs/PISTOKOE.md`)
Kohde: versio 1.1 "Lainalaivat", commit `6d48667` ja sen jälkeiset korjaukset
Muutokset sovellukseen: kyllä — jokainen löydös golden-tapauksena ennen korjausta

## Tuomio

Lainalaivan **hinta, profiili, omat päivitykset ja kortin merkintä** olivat
otoksessa oikein joka kerralla: 12 siemenestä yksikään ei löytänyt väärää
hintaa tai väärää profiilia. Vikatiheä alue oli **listojen välinen
sääntösemantiikka**: kuka saa lainata mitä, ja mitä lainattu alus saa ostaa
isäntälistalta. Kahdeksan juurisyytä löytyi ja korjattiin; jokainen oli
punainen golden ennen korjausta.

Vakavin oli **renegade-osioiden luokittelu**: Chaos-listojen RENEGADE
IMPERIAL VESSELS oli lajia `own`, vaikka se on nimetty pääsy toisen rodun
aluksiin. Siksi Tzeentchin renegade-Endeavour kelpasi Nurglelle reserviksi
vastoin s.222:ta (*"do not count as reserves"*), ja sama toistui kolmella
siemenellä. Toiseksi vakavin oli oma 1.1.1-vikani: laillisuuspaneeli rakensi
laivaston ilman isäntälistaa, joten lainalaivan isäntäpäivityksiä ei laskettu
budjettiriveihin lainkaan.

Lisäksi kierros toi **neljä uutta koneellista menetelmää** (M16–M19), joista
yksi löysi heti luokan, jota kukaan ei ollut mitannut: pelaajalle näytettiin
*Check yourself* -otsikon alla 16 sovelluksen omaa lausetta kuin kirjan
sääntöinä.

## Rajaus ja menetelmä

Otos: siemenet 2026091411–13, 21–23, 31–33 ja 41–43 (12 riviä). Kahden lukijan
siemenet 2026091401–03 ja 51–53 jäivät ajamatta istuntorajan takia; ne
kuuluvat seuraavaan kierrokseen samoilla siemenillä.

Isäntälista arvottiin deterministisesti: rivin listan jälkeen seuraava
samanrotuinen lista `bfg_data.json`:n järjestyksessä, ilman `res_ban`-listoja.
Jokaisesta rivistä luettiin ensin profiilisivu, lähdelistan sivu, isäntälistan
sivu ja s.14–16, ja vasta sitten ajettiin
`node spot_check.js --seed N --from "<isäntä>" --role reserve`.

Lukijat vain ehdottivat. Vahvistajat kaatuivat istuntorajaan kahdesti, joten
**jokainen väite luettiin kirjasta käsin ja toistettiin deterministisesti**
Node-ajolla ennen tuomiota. Kaikki 12 lainattua kirjan lausetta olivat
kirjassa sanatarkasti (`check_quotes.py`:n `Book.has`).

## Otos

| siemen | lähde → isäntä | rivi | tuomio | mitä |
|---|---|---|---|---|
| 2026091411 | Tau Merchant → Commerce Protection | Nicassar Dhow | P3 | koukkukapasiteetti ei laske access-rivin lainaa; merkityksetön, koska nimetty pääsy on jo punainen |
| 2026091412 | Bakka → Explorator | Dominion class battlecruiser | **P1 korjattu** | isännän Nova Cannon toimi ja hinnoittui, mutta `validateIntent` näytti sen virheenä; lisäksi P3 kortin attribuutio, P2 T34-alilaskenta (päätös), P2 s.121 rajoitteet (laivastotaso) |
| 2026091413 | Armageddon → Bakka | Gladius Class Frigate* | **P1 korjattu** | s.41 kieltää Space Marine -alusten lainaamisen; tarjottiin ja hyväksyttiin |
| 2026091421 | Tzeentch → Nurgle | Endeavour (renegade) | **P1 korjattu** | renegade kelpasi reserviksi (s.222, s.15); CSM-miehistö tarjolla Imperial-rungolle (s.222); avoin P2: −1 Ld ei kortilla |
| 2026091422 | Bakka → Explorator | Endeavour (Bakka) | LÄPI | |
| 2026091423 | Nurgle → Khorne | Havoc (renegade) | **P1 korjattu** | sama juurisyy kuin 2026091421 |
| 2026091431 | Commerce Protection → Demiurg | Orca class gunship | P3 | T34: isännällä ei `type`-vastinetta, näkyvä rivi kertoo |
| 2026091432 | Incursion → Black Crusade | Carnage class cruiser | P2 avoin | isännän Daemonship-rivi on kohdennettu tyypin kaikkiin riveihin eikä tarjota lainalle |
| 2026091433 | Merchant → Commerce Protection | Nicassar Dhow | P3 | kuten 2026091411 |
| 2026091441 | Slaanesh → Incursion | Retaliator | **P1 korjattu** | Veil of Lust myytiin ilman mekaniikkaa (natiivi vika, s.248 toinen lause) |
| 2026091442 | Khorne → Slaanesh | Sword class frigate (renegade) | **P1 korjattu** | sama juurisyy kuin 2026091421 |
| 2026091443 | Black Crusade → Tzeentch | Desolator | **P1 korjattu ×3** | kaksi miehistöä samalle alukselle; isännän Strand of Fortune vihreä ilman Lordia (J118 + `checks()` ilman isäntää); isännän rivit ilman kuvausta; avoin P2 Mark isännän miehistön jälkeen; P3 kortin attribuutio |

Kahdestatoista rivistä 6 oli P1, 2 LÄPI, 4 P3-tasoisia tai avoimia P2-huomioita.
P1-osuus 50 % (Wilson 95 % ≈ 25–75 %) on paljon suurempi kuin pistokokeen 7
jälkeinen 13 % yksittäisillä listoilla — mikä on odotettua: lainalaiva on uusi
konfiguraatioavaruus, jota yksikään aiempi kierros ei ollut nähnyt.

## Löydökset ja korjaukset

Jokainen korjaus on golden ennen korjausta, osoitettu punaiseksi ja sitten
vihreäksi.

| # | juurisyy | kirja | korjaus | golden |
|---|---|---|---|---|
| 1 | Armageddonin tähdellä merkityt Space Marine -alukset lainattavissa | s.41 *"Likewise, Imperial Navy fleets choosing reserves from this fleet list cannot choose Space Marine vessels from it."* | `lend_ban` lähdelistan puolelle: rivi, jonka nimi päättyy yhteen tähteen, ei lähde reservinä | `armageddon-space-marine-vessels-are-not-lent`, verrokki `…-navy-vessels-are-still-lent` |
| 2 | Isännän päivitys lainalaivalla näkyi virheenä | s.14 | `validateIntent.rowOf` tuntee `ctx.host`-listan kuten `selectionOf` | `host-upgrade-on-a-reserve-is-not-an-error` |
| 3 | Renegade-osio lajia `own` → lainattavissa reservinä | s.222 *"do not count as reserves"*, s.15 | `SECTION_KIND`: `access` | `renegade-imperial-vessel-is-not-a-reserve` |
| 4 | CSM-miehistö tarjolla renegade-alukselle (myös natiivisti) | s.222 *"Chaos Space Marines … may not be taken for Imperial Navy vessels used in this manner"* | miehistöriveille `cond.flno: ^imperial navy` | `renegade-imperial-vessel-gets-no-chaos-space-marine-crew` |
| 5 | Kaksi miehistöä samalle lainalaivalle (legioonan nimi ohitti samannimisyysvaimennuksen) | s.234, s.236 | miehistöriveille `grp: crew`; `hostRowShadowed` vaimentaa myös saman ryhmän | `one-crew-per-ship-across-two-lists` |
| 6 | Isännän Strand of Fortune ilman Lordia vihreä (J118) | s.236 | `tookUp` siirtää isännän indeksin lainalaivalle; **ja** `checks()` antaa `ctx.host`-listan | `host-strand-of-fortune-needs-a-lord-on-a-reserve` |
| 7 | Isännän rivit ilman kuvausta lainalaivalla | s.236 | `upgradesOf` hakee lauseen rivin omalta listalta; rivi kantaa `list`-kentän kortille | `host-upgrade-keeps-its-description-on-a-reserve` |
| 8 | Veil of Lust ilman mekaniikkaa (natiivi) | s.248 *"Ship firing on this vessel using the gunnery table suffers a right column shift…"* | rivin `desc` = molemmat lauseet | `slaanesh-veil-of-lust-has-its-column-shift` |

**Miksi vihreä ei löytänyt näitä.** Kolme syytä. (a) Laivastogoldenit
todistivat moottorin, ja `checks()`-kuoren puute näkyi vain sovelluksen
polulla. (b) Renegade-osion laji oli kuratoitu käsin, ja laji vaikutti vain
lainauksessa, jota mikään aiempi tapaus ei tehnyt Chaos-listojen välillä.
(c) Samannimisyysvaimennus oli oikea ajatus mutta liian kapea: kirja nimeää
saman miehistön viidellä eri nimellä.

## Avoimet

| prio | mitä | miksi auki |
|---|---|---|
| P2 | Isännän **tyyppiin kohdennettu** rivi (Daemonship: Cruiser, s.235 *"based upon the type of vessel chosen"*) ei tarjota lainalaivalle | J117 rajasi kohdennetut isäntärivit pois, koska kohteet ovat isännän koordinaatteja; tyypin kaikkiin riveihin kohdennettu rivi on kuitenkin tyyppikohtainen. Vaatii säännön "rivi, jonka kaikki kohteet ovat samaa `rt`-tyyppiä, on tyyppirivi". |
| P2 | Special torpedoes tarjolla Novan jälkeen | Natiivi vika: `condOK`:n `has` lukee profiilin rivit ennen listan vaihtoja (`noList=true`). Toistuu Explorator-listan omalla Novalla. |
| P2 | Renegade-risteilijän −1 Ld ei kortilla | s.222 lause on osiotekstissä, ei kortin säännöissä. |
| P2 | Mark of Tzeentch ei tarjota isännän miehistön jälkeen | lähdelistan Mark-rivien `up:^chaos space marine crew$` on ankkuroitu, eikä osu legioonan nimeen; isännän Mark vaimentuu samannimisenä. |
| P3 | Kortti attribuoi isännän rivit lähdelistalle | korttilohko on toisen istunnon; `R.upgrades[].list` on nyt tarjolla sitä varten. |
| P3 | Kaksi *Prow nova cannon* -riviä natiivilla Explorator-Lunarilla oman Nova-rivin jälkeen | havaittu verrokkiajossa; ei vielä luettu kirjasta. |
| — | T34-alilaskenta (Bakan Battlecruisers → Explorator) | dokumentoitu päätös, näkyvä rivi. |
| — | s.121 laivueointi- ja re-roll-rajoitteet Imperial-reserville | laivastotason sääntö, ei korttiin (sama kuin Armageddonin alaviite). |

## Uudet koneelliset menetelmät (M16–M19)

| menetelmä | työkalu | mitä kysyy | löysi |
|---|---|---|---|
| M16 sivutarkistus | `check_pages.py` | onko jokainen pelaajalle näytetty lause kirjassa | 16 toimituksellista lausetta *Check yourself* -otsikon alla, 2 parafraasia, 1 hintariviin liimautunut lähdelause |
| M17 laskutarkistus | `check_golden_math.py` | täsmääkö goldenin perustelun lasku odotukseen | 0 (67 laskua) |
| M18 tallennefuzz | `fuzz_save.js` | palauttaako rikottu tallenne väärän aluksen hiljaa | 0 / 3 000 rikkomusta 12 tavalla |
| M19 symmetria | `check_symmetry.js` | riippuuko reservibudjetti lähdelistasta | 0 / 48 vertailua |

Kaikki neljä ovat hyväksynnän vaiheita (`SIVUT`, `LASKUT`, `TALLENNEFUZZ`,
`SYMMETRIA`). M16:n löydös korjattiin uudella `sec.notes`-kanavalla:
rakentajan omat lauseet näkyvät otsikolla *Builder's notes*, eivät kirjan
sääntöinä, ja kaksi parafraasia korvattiin kirjan lauseilla (s.372, s.426).

## Hyväksymisehdot

- `python acceptance.py` — 24 vaihetta, tuomio LAPI ✔
- 358 yksikkö- ja 77 laivastogoldenia, 0 aukkoa ✔
- tulostus 1 442 korttia, 0 ylivuotoa, pienin teksti 4,24 pt ✔
- puuttuvat siemenet 2026091401–03 ja 51–53 ajetaan seuraavalla kierroksella
