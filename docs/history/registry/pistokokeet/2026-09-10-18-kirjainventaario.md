# Pistokoe 18 — kirjainventaario (10.9.2026)

**Miksi.** J21 (orbital mines, Bug Hunt -löydös 1) ei näkynyt yhdessäkään
aiemmassa 17 pistokokeessa. Syy on se, että ne kaikki lähtivät sovelluksen
riveistä: rivi oli olemassa ja hinta oikein, mutta vaikutus, poissulku ja
osa tukikelpoisuudesta puuttuivat. Tämä koe lähtee kirjasta. Kaikki kirjan
myytävät, sallivat, kieltävät, muuttavat ja korttiin sääntöjä tuovat lauseet
poimitaan, ja jokaiselle haetaan vastine sovelluksesta. Menetelmä on kuvattu
kohdassa `docs/PISTOKOE.md` §Kirjainventaario.

**Otanta:** koko kirja, ei otosta. Poiminnan tekevät sonnet-agentit, ja
lainaukset tarkistetaan skriptillä. Kartoituksen, lausekkeiden, matriisin ja
parien tuomiot ovat käsin tehtyjä.

## Lohkot

Sarakkeet: poiminnan koko (kohtaa, sanatarkat lainaukset), kartoituksen luokat (MALLI / TEKSTI / EI, koneellinen), löydökset ja tuomio. Lausekkeet, matriisi ja parit ajettiin koettimilla niille kohdille, joita kartoitus ei kattanut (ks. muistiinpanot).

| Lohko | Sisältö | Sivut | Poiminta | Kartoitus M/T/E | Löydökset | Tuomio |
|---|---|---|---|---|---|---|
| G | Yleissivut (listat, pisteet, muodostelma, reservit, liittolaiset, refitit, torpedot, torpedo bombers, orbital mines) | 6–23 | käsin | – | J21, J22, J23 | käsitelty |
| IN | Imperial Navy | 24–85 | 131 (129) | 67/46/18 | J27 | käsitelty |
| SMI | Space Marines, Adeptus Mechanicus, Inquisition, Grey Knights | 86–151 | 180 (171) | 101/60/19 | J28 | käsitelty |
| RT | Rogue Traders (skenaariot s.198–211 pois) | 152–197 | 110 (110) | 25/49/36 | J23, J30, J31, J34 | käsitelty |
| CH | Chaos | 212–289 | 192 (182) | 70/81/41 | J24, J25, J26, J29 | käsitelty |
| ELD | Eldar ja Dark Eldar | 290–353 | 213 (208) | 68/43/102 | – | käsitelty |
| OR | Orks | 354–393 | 210 (201) | 140/34/36 | J32, J33, J34 | käsitelty |
| NTY | Necrons ja Tyranids | 394–437 | 190 (179) | 112/56/22 | – | käsitelty |
| TDP | Tau, Demiurg, Nicassar, Kroot, planetaariset puolustukset, lisäalukset | 438–524 | 341 (332) | 155/86/100 | J34 | käsitelty (PD skenaario-ostoina N/A) |
| RB | Rulebook v1.10: korttiin vaikuttavat ydinsäännöt | 36–99 | 237 (230) | – (tuomio käsin) | – | käsitelty |

## Löydökset

| Tunnus | Prio | Lohko | Kirja | Mitä puuttui | Korjaus |
|---|---|---|---|---|---|
| J22 | P2 | G | s.19–21 | Erikoistorpedot (ostettava heitto 20/30 p) puuttuivat kokonaan: ei riviä, ei sääntöä | valmis: 52 riviä, `tsmin`/`tsmax`, korttisääntö, 3 goldenia |
| J23 | P1 | G/RT | s.174 | Veteran Rogue Trader -velvoite (2+ RT-risteilijää tai 2+ kuljetuslaivuetta) ei ollut tarkistuksena | valmis: `requires` + `if_min`/`if_units`, 4 testiä |
| J24 | P1 | CH | s.241/245/249 | Daemonship-osuuksia (1/3, 1/4, 1/2 isoista aluksista) ei valvottu | valmis: `upgrade_ratio`, 6 testiä |
| J25 | P1 | CH | s.235 | Planet Killer ei laskenut taistelulaivaksi suhteessa | valmis: `allow_pick`, 2 testiä |
| J26 | P1 | CH | s.288 | Space Hulk: poissulut, enintään kaksi muuta taistelulaivaa, toinen taistelulaiva vaatii kuusi risteilijää | valmis: 2 × `conditional_cap`, `ratio.at_least`, 6 testiä |
| J27 | P1 | IN | s.14/49/50 | Bakkan Emperor vain reservinä ilman Rathia; Jovian 1 per 3 Bakka-risteilijää ja battlecruiser-suhteeseen | valmis: `requires.unless_pick`, suhde, 6 testiä |
| J28 | P1 | SMI | s.151 | Grey Knights Strike Cruiserien bay-vaihtoja ei rajattu puoleen | valmis: `option_ratio`, 4 testiä |
| J29 | P2 | CH | s.284/288 | Activated Blackstone Fortressia ei myyty millään listalla | valmis: osio kuudelle Chaos-listalle, 1 per TÄYSI 750 p, enintään 3 |
| J30 | P1 | RT | s.178–179 | Merirosvolistalta puuttuivat risteilijät kokonaan, samoin kolme laivastosääntöä | valmis: 13 riviä (`noopt`), `per_points`, `min_ratio.units`, `compare`; 3 goldenia ja 6 testiä |
| J31 | P2 | RT | s.196–197 | Stryxis Caravan Vesseliä ei myyty millään listalla | valmis: osio kolmelle RT-listalle, enintään 4 |
| J32 | P1 | OR | s.373 | Clanz: 'Uge ship per kaksi kroozeria ja Space Hulk vasta 1 500 p:stä | valmis: `ratio` + `allowed_at`, 4 testiä |
| J33 | P1 | OR | s.369/390 | Ork Space Hulk sai Evil Sunzin (+5 cm) ja Goffsin (+1 boarding) | valmis: `nmno` + hulk, 2 goldenia |
| J34 | P1 | OR/RT/TDP | s.197/393/495 | Rok, Warsphere ja Stryxis: profiilia seuraavan sivun kriittinen sääntö, liike ja hajoaminen puuttuivat kortilta | valmis: oma kriittinen malli ja neljä sääntöä, 3 goldenia |
| J35 | P1 | SMI (pyyhkäisy) | s.110–111/505 | Fortress-Monastery: Ramilies-taulukko, Ld 10, erikoiskäskyt ja boarding puuttuivat kortilta | valmis: `sh.qd`-taulukko, sääntö, 1 golden |

## Lohkokohtaiset muistiinpanot

### G — yleissivut s.6–23 (käsin)

Poiminta ja tuomiot on tehty käsin, koska J21 syntyi tältä alueelta.

- **s.11 komentaja yli 750 p:n laivastolle "unless specifically stated otherwise in the fleet list".** 25/32 listaa valvoo tätä (`mandatory_at`). Seitsemän muun tilanne: Clanz valvoo säännöllä `per_points` (1 per 500, "no more, no less"); Necrons (s.404), Tyranids (s.430) ja Demiurg (s.486) sanovat erikseen, ettei komentajaa ole; Inquisition ei ole oma laivasto (s.138); RT s.174 käsitellään alla. LÄPI.
- **s.13 laivueet.** Saattajien 2–6 valvotaan (29 `squadron`-sääntöä). Isojen alusten laivueita ei mallinneta, koska yksikkö on yksi runko. Tämä on sama rajaus kuin J8. N/A.
- **s.14–17 reservit ja liittolaiset.** Sovellus mallintaa vain ne reservi- ja liittolaisosiot, jotka lista itse nimeää. Ristiin listojen välillä valittavia reservejä ei mallinneta. P3-huomio, ei korjata.
- **s.19–21 erikoistorpedot → J22.**
- **s.22 torpedo bombers, tukikelpoisuusmatriisi kaikille rungoille.** 98 tarjousta.
  - Space Marine- ja Grey Knights -rungot eivät saa tarjousta. s.95: "the Adeptus Astartes make exclusive use of the Thunderhawk gunship", joten niillä ei ole pommittajia. LÄPI.
  - Dark Eldar Torture sekä Iyanden Dragonship ja Wraithship saavat tarjouksen, kun bay-optio on otettu (s.319, s.22). LÄPI.
  - Orkkien Hammer ja nimetyt taistelulaivat myyvät torpedo-bommat omalla optiollaan (+40, Gorbag's +80), mikä vastaa s.22:n kohtaa "listed in their description". Zukov's Klaw kantaa vain assault boatteja. LÄPI.
  - Tau Emissary Dal'yth: bayt kantavat vain Barracudoja, joten pommittajia ei ole muunnettavaksi. P3-huomio.
- **s.23 orbital mines → J21** (valmis `d7bd8a3`).
- **s.174 Veteran Rogue Trader → J23.**

### CH — Chaos s.212–289 (192 kohtaa, lainauksista 182 sanatarkkoja)

- Löydökset: J24 (Daemonship-osuudet), J25 (Planet Killer taistelulaivana), J26 (Space Hulkin rajat), J29 (Activated Blackstone Fortress).
- LÄPI:
  - Chaos Space Hulkin päivitykset: ei Markeja, miehistöä eikä nopeutta parantavia.
  - Nimettyjen battle bargejen ainutkertaisuus ja säännöt (`.sr`).
  - Grand cruiserien immuniteetti keulan kriittisille osumille.
  - Armageddon Gunin ja Hives of Nurglen säännöt (domain).
  - CSM-miehistöt ja Markit.
- J8 (ei mallinneta): Warmasterin, Lordin ja Abaddonin sidonta tiettyyn alukseen.
- N/A: Legioonien vihollisuus (s.225). Sovelluksen Chaos-listoilla ei voi valita kahta vihamielistä legioonaa samaan laivastoon.

### IN — Imperial Navy s.24–85 (131 kohtaa, 129 sanatarkkoja)

- Löydös: J27 (Bakkan reservit).
- LÄPI: 750 p:n komentajavelvoite kaikilla neljällä listalla; Emperorin ja Jovianin 0–1; profiilien erikoissäännöt; Emperorin ja Oberonin Ld +1.
- N/A:
  - Veteran Captainien laivuepakko, koska isojen alusten laivueita ei mallinneta.
  - Reservilaivastojen "Strange happenings", koska listojen väliset reservit on rajattu pois lohkossa G.

### SMI — Space Marines, Adeptus Mechanicus, Inquisition, Grey Knights s.86–151 (180 kohtaa, 171 sanatarkkoja)

- Löydös: J28 (GK Strike Cruiserien bay-vaihdot).
- LÄPI:
  - Venerable battle barge saa vain listan yleiset päivitykset, ei profiilin refittejä.
  - Rapid strike vessels, Ordo-inkvisiittorit, Thunderhawk-säännöt ja Gifts of the Omnissiah.
- N/A: Space Marine -reservit Mechanicus-laivastossa (listojen väliset reservit).

### ELD — Eldar ja Dark Eldar s.290–353 (213 kohtaa, 208 sanatarkkoja)

- Ei löydöksiä. LÄPI:
  - Eldarin ja Dark Eldarin omat kriittiset taulukot (kortilla).
  - Holofieldit ja shadowfieldit, slavetaking, boarding-muuttujat ja liikesäännöt.
  - Farseerit 0–3.
  - Dragonship, Wraithship ja Torture saavat torpedo bomberit, kun bay-optio on otettu.
- N/A:
  - Eldar Haven: planetaarinen puolustus (s.334–337).
  - Corsair- ja Craftworld-reservit Eldar Heron johdolla (listojen väliset reservit).

### RT — Rogue Traders s.152–197 (110 kohtaa, kaikki sanatarkkoja)

- Löydökset: J23 (Veteran Rogue Trader), J30 (merirosvoristeilijät ja kolme laivastosääntöä), J31 (Stryxis), J34 (Stryxisin kriittinen sääntö ja liike).
- LÄPI: Exploration-listan "puolet perusprofiilia" (`compare`), merirosvojen 10 %:n xenos-saattajat (`points_share`) ja Fra'al 0–2.
- P3:
  - Fra'al Battleshipin Ether Cannon -vaihto ("if both players agree").
  - Apualukset seurattavan laivaston listalta (listojen välinen).

### NTY — Necrons ja Tyranids s.394–437 (190 kohtaa, 179 sanatarkkoja)

- Ei löydöksiä. LÄPI:
  - Necronien kriittinen taulukko ja 4+-korjaus, Reactive Hull ja Inertialess Drive.
  - Tyranidien spore-, pyro-acid- ja kriittiset säännöt, Hive Mind -ostot ja aseiden valintasäännöt.

### OR — Orks s.354–393 (210 kohtaa, 201 sanatarkkoja)

- Löydökset: J32 (Clanz 'Uge ship ja Space Hulk), J33 (hulkin klaanipäivitykset), J34 (Rokin kriittinen sääntö ja liike).
- LÄPI:
  - Torpedo-bommat Hammerin ja nimettyjen taistelulaivojen omina optioina.
  - Dakka Dakka.
  - Snakebites vain saattajille, hulkeille ja rokeille.
  - Clanzin Warlord per 500 p.
  - Hulkin Gubbins tuplahintaan.
- J8: Warlordin alus. Waaagh!-listan hulkin Extra Powerfields +50 p näkyy kortilla tekstinä.

### TDP — Tau, Demiurg, Nicassar, Kroot, planetaariset puolustukset ja lisäalukset s.438–524 (341 kohtaa, 332 sanatarkkoja)

- Löydös: J34 (Kroot Warsphere).
- LÄPI:
  - Tau railgun-, ioni-, ohjus- ja koukkusäännöt.
  - Demiurg-säännöt: Blast Markerit ja cutting beam.
  - Orbital mine (J21) ja Fire Ship.
- P3: Emissaryn bayt kantavat vain Barracudoja.
- N/A: skenaario-ostot, joita laivastolistat eivät myy:
  - Tau Orbitals, Waystation ja Orbital City;
  - Ramilies, Minefield ja siilot;
  - Nicassar Rig;
  - planetaaristen puolustusten pisteet (s.498–499).
- Lisäalukset (Escort Carrier, Q-Ship, Armed Freighter, Heavy Transport) ovat RT-listoilla.

### RB — Rulebook v1.10 s.36–99 (237 kohtaa, 230 sanatarkkoja)

Poiminnan teki sonnet-agentti (5 tiedostoa); lainaukset tarkistettiin Rulebookia vasten (`inv_verify.py --rulebook`). Koneellinen kartoitus ei sovi tähän lohkoon, koska sovellus kirjoittaa ydinsäännöt kortille omina vakioinaan. Tuomiot on siksi tehty käsin, ja ne kohdistuvat niihin kortin osiin, jotka tulevat Rulebookista.

- Ei löydöksiä.
- LÄPI:
  - Kriittinen taulukko 2–12 (s.67) vastaa `CRIT`-vakiota rivi riviltä, mukaan lukien "This damage may not be repaired" (9 ja 10) ja lippulaivan menetetyt re-rollit.
  - Crippled-rivi (s.65) vastaa kirjaa: nopeus -5 cm, aseet, ordnance, kilvet ja turretit puoleen, ei Nova Cannonia.
  - Korjausrivi vastaa s.88:aa: "capital ships roll 1D6 per Damage point remaining in the End Phase. Each roll of a 6 enables the ship to repair one critically damaged system", ja Blast Markerit kosketuksessa puolittavat nopat.
  - Saattajan kortti: "a Critical Hit destroys the escort outright" (s.66).
  - Nova Cannonin ja boarding-torpedojen säännöt (s.63–64, s.78).
  - Torpedo bomberien muunto s.84 vastaa Fleetsin s.22:ta ja listarivin kuvausta.
- P3: Crippled-tilan boarding-vaikutus ja kertautuminen Bracen kanssa (s.65) sekä massing turrets (s.80) ovat pöytäsääntöjä eivätkä kortin tekstiä.
- Ydinsääntöjen erikoiskäskyt, gunnery-taulukko, boarding ja laivueet (s.46–99) ovat pelisääntöjä, joita kortti ei toista. N/A.

## Yhteenveto

- **Kattavuus:** 1 804 poimittua kohtaa kymmenestä lohkosta (Fleets 1 567, Rulebook 237) sekä lohko G käsin. Fleetsin lainauksista 1 512 (96,5 %) oli sanatarkkoja, 34 lähes sanatarkkoja ja 21 poikkesi; Rulebookin 237:stä 230 oli sanatarkkoja. Poikkeamat ovat taulukoista uudelleen muotoiltuja rivejä (Orkkien klaanihinnat, Tyranidien asevalikot), ja ne katsottiin käsin.
- **Löydökset:** 14 (J22–J35), joista P1 11 ja P2 3. J35 (Fortress-Monastery) löytyi lohkojen jälkeen ajetulla jatkosivupyyhkäisyllä (`cont_sweep.py`), joka kävi läpi kaikkien profiilien jatkosivut. Kaikki on korjattu ja jokainen testattu punaisena ennen korjausta: 18 goldenia ja 44 validaattoritestiä.
- **Miksi aiemmat pistokokeet eivät löytäneet näitä:** yksikään löydös ei ollut väärä arvo sovelluksessa olevalla rivillä. Ne jakautuvat viiteen luokkaan:
  1. Kirjan ostettava puuttui kokonaan: J22, J29, J30, J31.
  2. Laivastotason lause oli vain tekstinä eikä tarkistuksena: J23–J28, J32.
  3. Päivitys tarjottiin rungolle, jolta kirja sen kieltää: J33.
  4. Profiilia seuraavan sivun säännöt puuttuivat kortilta: J34.
  5. Rivi oli olemassa, mutta vaikutus puuttui: J21.

  Sovelluksen riveistä lähtevä otos näkee vain luokan 5.
- **Mallien käyttö:**
  - Poiminnan tekivät sonnet-agentit: 10 ajoa, noin 1,7 M agenttitokenia. Yksi ajo katkesi tulostokenirajaan ja ajettiin uudelleen kahtena puolikkaana.
  - Lainausten tarkistus (`inv_verify.py`), laskeutumisluokitus (`inv_map.py`), tukikelpoisuusmatriisi (`offer_matrix.js`) ja laivastokoettimet (`fleetprobe.js`) ovat skriptejä.
  - Tuomiot, testit ja korjaukset tehtiin itse.
- **Seuraavaksi:** toistuvat luokat koneellisiksi tarkistuksiksi repoon. Jatkosivupyyhkäisy on jo tehty (`cont_sweep.py`, J35). Jäljellä ovat jokaisen listan tekstilauseet, joilla ei ole tarkistusta, ja jokaisen `.sr`-lauseen "cannot take" -kiellot tarjontamatriisia vasten.
