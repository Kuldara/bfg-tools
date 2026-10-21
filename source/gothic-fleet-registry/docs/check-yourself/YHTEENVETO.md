# Check yourself -lauseiden luokittelu: tulos

> Tämä on toteutusta edeltänyt analyysi. Suunnitelma on toteutettu
> 20.10.2026 (BACKLOG J212–J221); tila ja ylläpito ovat `LUEMINUT.md`:ssä.

Tehty 19.–20.10.2026 käyttäjän pyynnöstä. Jokainen builderin "Check yourself"
-lause on luettu käsin ja sen sivu tarkistettu kirjan tekstistä. Koodiin
nojaavat väitteet on varmistettu ajamalla sovelluksen omaa moottoria.
**Sovellukseen ei ole tehty muutoksia.** Tämä on päätösaineisto: mitä
poistetaan, mitä siirretään ja mitä toteutetaan ominaisuutena.

Kaikki lauseet perusteluineen ovat liitteessä [`LIITE_luokat.md`](LIITE_luokat.md),
ja koneluettava versio on `luokitus_kaikki.json`. Luokat on selitetty
[`LUEMINUT.md`](LUEMINUT.md):ssä.

## Lyhyesti

- 32 listalla on **2 497 "Check yourself" -esiintymää** eli **1 170 erilaista
  lausetta**. Sivu löytyi sanatarkasti 1 126 lauseelle. Loput 44 olivat
  taulukoita tai katkenneita lauseita, ja ne tarkistettiin käsin.
- Vain **15 lausetta (35 esiintymää) on aitoja "tarkista itse" -sääntöjä.**
  Ne koskevat laivueita pöydällä, maalausta, vastustajan etuja ja pelaajien
  sopimuksia.
- **192 lausetta (377 esiintymää) valvotaan jo**, mutta ne näkyvät silti
  "Check yourself" -ryhmässä. Käyttöliittymä tunnistaa valvotun lauseen vain,
  jos se on täsmälleen saman osion säännön `src`-kenttä (`app_template.html:2684`).
- **72 lausetta (100 esiintymää) kelpaa ominaisuudeksi** ja 17 (23) voisi
  laskea rosteriin.
- Loput on siirrettävä muualle: pelin aikaiset säännöt 344 (767), kampanja
  235 (642), rivien kuvaukset 121 (231) ja kerronta 89 (156).
- **Varmistusajo löysi kolme virhettä**, joissa sovellus joko sallii
  kielletyn tai hylkää laillisen, sekä 16 aukkoa. Kahdeksan lauseen luokka
  korjattiin ajon perusteella.

## Luokat ja toimenpiteet

| luokka | uniikit | esiintymät | mitä tehdään |
|---|---|---|---|
| PELI | 344 | 767 | "In play" -ryhmä tai kortti; ei laillisuutta |
| KAMPANJA | 235 | 642 | taitettu "Campaign & scenario" -ryhmä (ROADMAP rajaa kampanjat pois) |
| VALVOTTU | 192 | 377 | "Checked by the builder" -ryhmään |
| KUVAUS | 121 | 231 | 192 esiintymää rivin selitteeksi, 39 pois (sama teksti on jo rivillä tai profiilissa) |
| TAUSTA | 89 | 156 | pois |
| RAKENNE | 62 | 133 | "Guaranteed by the builder" (tai Checked-ryhmään) |
| OMINAISUUS | 72 | 100 | ominaisuusjono alla |
| TARKISTA | 15 | 35 | jää "Check yourself" -ryhmään |
| ROSKA | 23 | 33 | poiminnan korjaus |
| LASKETTAVA | 17 | 23 | rosterin yhteenveto ja Play-sivu |

Vaikutus listoittain: Da Ork Clanz 183 → 2 aitoa, Explorator 118 → 2, Chaos-
jumalalistat noin 101 → 1, Iyanden 93 → 0. Kun ominaisuusehdokkaat jätetään
näkyviin siihen asti, kunnes ne on toteutettu, Clanzille jää 13 ja
Explorator-listalle 10. Taulukko kaikista listoista on tämän tiedoston
lopussa.

## Löydetyt virheet

Nämä löytyivät varmistusajosta (`varmistus/probe1–8.js`, sama lataus kuin
`test_golden.js`; aja `node varmistus/probe3.js`). Kunkin korjaus alkaa punaisesta golden-tapauksesta, kuten
AGENTS.md §3 vaatii.

| id | sivu | mitä tapahtuu | kirja |
|---|---|---|---|
| S0106 | F50 | **Sallii kielletyn.** Bakkaan reserviksi lainattu alus (Gothic-listan Lunar) saa Bakkan "+1 turret" -refitin. | "Reserve vessels may not be given this upgrade" |
| S0249 | F121 | **Hylkää laillisen.** AdMech + kolme Gothicia + SM-strike cruiser → "Reserve needs an Inquisitor Lord". | SM-reservit sallitaan, jos laivastossa ei ole tavallisia IN-capital shipejä eikä xenos-aluksia |
| S0255 | F122 | **Hylkää laillisen.** AdMech + yksi capital + neljä IN-saattajaa → "Reserves (escorts) 4 / 0". | "There are no restrictions on how many reserve ... escorts" (kun xenosta ja SM-reservejä ei ole) |

Aukot, joissa pelaaja näkee väärän tuloksen:

| id | sivu | aukko |
|---|---|---|
| S0345 | F174 | Base RT: yhdellä RT-risteilijällä saa kaksi Veteran RT:tä (vain osion katto 2; suhde "each Rogue Trader cruiser" puuttuu). |
| S0380, S0384, S0386 | F177 | Exploration: kaksi liittolaista eri listoilta menee läpi, samoin SM-liittolainen yhdessä Demiurgin tai Krootin kanssa. |
| S0382 | F177 | Exploration-liittolaisen erikoishahmo hylätään ("Not a reserve type"), vaikka kirja sallii yhden. |
| S1094 | F453 | Kor'O Mesme ilman Custodiania menee läpi. |
| S0373–S0375 | F177 | Exploration-listalla ei ole apualusrivejä lainkaan (poistettu, `build_data.py:2632`). |
| S0512 | F235 | CSM-miehistön Thunderhawk-vaihto puuttuu kaikilta Chaos-listoilta. |
| S0298, S0308 | F139–140 | RT-risteilijän "attendant escorts" puuttuvat isäntälistojen ROGUE TRADERS -osiosta. |
| S0319 | F141 | Ordo Xenos -kortilla ei mainita Deathwatchia eikä sen menetystä xenos-liittolaisen kanssa. |
| S1168 | F487 | War Hostin hook-kapasiteetti on yhä "not checked by the app" -varoitus, vaikka Tau-listoille toteutettiin oikea valvonta (J95). |

## Ominaisuusjono (ehdotettu järjestys)

### 1. Check yourself -ryhmän uudelleenjako (vain data ja käyttöliittymä)

Tämä hyödyttää eniten ja on vähiten riskialtis: moottoriin ei kosketa.

- Data: build lukee luokituksen (esimerkiksi `referenssi/check_yourself.json`,
  avaimena normalisoitu lause) ja liittää jokaiseen osiolauseeseen luokan.
  Lähteeksi kelpaa tämän kansion `luokitus_kaikki.json`. `check_reference.py`
  voisi samalla tarkistaa, ettei uusi lause jää luokittelematta.
- Käyttöliittymä: osiokohtaiset ryhmät *Checked by the builder*,
  *Guaranteed by the builder*, *Check yourself*, *In play* sekä taitettu
  *Campaign & scenario*. KUVAUS-lauseet rivien selitteiksi, TAUSTA pois.
- Laskuri: `app_template.html:3338` ja `:3359` laskevat lukuun myös osion
  jo tarkistamat lauseet. Laskurin pitää laskea vain *Check yourself* -ryhmä.
- Valvottujen lauseiden yleisimmät syyt (`f`-kenttä): rivin ehto (42),
  reservimoottori (29), sanamuoto eroaa säännön src:stä (26), sääntö on eri
  osiossa (14), ryhmä (10), riviraja (9), esimerkki valvotusta säännöstä (7).

### 2. Kolme virhettä ja aukkotaulukko

Pieniä, rajattuja korjauksia; kukin golden-tapaus ensin.

### 3. Laskettavat arvot (LASKETTAVA, 17)

- **Attack rating** (15 lausetta) rosterin yhteenvetoon ja Play-sivulle.
  Ehdolliset arvot:
  - Dominion 3 → 2, jos mukana on yksikin IN-, AdMech- tai RT-alus (S0165).
  - Crusade 3 → 1 fortress-monasteryn kanssa (S0154).
  - Inquisitor Lord: IN tai AdMech 2, SM 3, Blackshipin kanssa 2 (S0287, S0288, S0341).
  - Yriel 4 (S0633).

  Kaikilta listoilta ei ole lausetta (esimerkiksi Chaos ja Orks), joten
  taulukko on luettava kirjasta erikseen.
- **VP-arvo** (S1163): Strongholdin, Bastionin ja Citadelin arvot
  400/300/200 eroavat pistehinnasta.
- **Vastustajan etu** (S0340): Grey Knights -laivastosta voi laskea, montako
  ilmaista Markia tai Daemonshipiä Chaos-vastustaja saa. S0035 ja S0311
  jäävät muistutuksiksi.

### 4. "Embarked aboard" -merkintä (aboard, 25)

Suurin aito laillisuusperhe. Pohja on olemassa kahdessa muodossa:
L.aboard (Yriel ja Flame of Asuryan, `domain.js:4516`) ja 0 pts -rivi
"Embarks the Inquisitor" (`upgrades.py:642`). Merkintä ei muuttaisi aluksen
statseja, joten J8:n päätös (sidosta ei mallinneta) pysyisi voimassa.

| sääntö | lauseet |
|---|---|
| Master of the Fleet battle bargelle / Venerable battle bargelle | S0141, S0145, S0158 |
| AdMech-komentaja Mechanicus-alukselle; Archmagos Veneratus Ark Mechanicukselle | S0253, S0268 |
| Inquisitor: Inquisitorial cruiser → Blackship → kallein | S0286, S0324–S0326 |
| Kallein alus: Pirate Captain, Warmaster, Clanzin Warlord | S0394, S0477, S0491, S0513, S0822 |
| Lord ei Warmasterin eikä Abaddonin alukselle; Daemonship ilman komentajaa | S0473, S0495, S0507, S0515, S0526, S0530 |
| Abaddon Planet Killerille | S0504 |
| Eldar Hero tai Yriel Flame of Asuryanille / Dragonshipille | S0625, S0631 |
| Warlord Space Hulkille; Mesme Custodianille | S0829, S1094 |

Kalleimman aluksen säännöt sovellus voi laskea itse ja näyttää kortilla.
Merkintää tarvitaan vain silloin, kun pelaaja valitsee.

### 5. Reservit, liittolaiset ja reitit (26)

- AdMech-reservien omat säännöt: S0246, S0249, S0250, S0255, S0256 (kaksi
  niistä on yllä virheinä).
- Exploration: apualukset (S0373–S0375), liittolaiset (S0380–S0382) ja
  kiellot (S0384, S0386).
- Puuttuvat reitit:
  - AdMech-risteilijät Bakan battlecruiser-paikoille (S0089–S0091, S0102).
  - Toinen RT-risteilijä Exploration-listalta (S0349).
  - Void Stalker Iyandeniin (S0653).
  - Blood Axe -lainasaattajat (S0909).
  - Demiurg Bastion palkkasoturina (S1143, S1144).
- Runkovalinta kuten Venerable battle bargella: Inquisitorial cruiser
  (S0281, ks. tulkinnat) ja RT-risteilijä (S0354).
- RT-saattajat inkvisiittorin kanssa: S0298, S0308.

### 6. Laivue ryhmänä (10 + 8 nykyistä TARKISTA-lausetta)

Tämä on jo ROADMAPin 1.2-listalla. Se kattaisi seuraavat:

- Clanzin Warlord-rakenne ja klaanit (S0824, S0826, S0828, S0839, S0840,
  S0891, S0897).
- Sekalaivueet (S0362, S0409, S0410).

Lisäksi nykyiset pöytätarkistukset muuttuisivat valvottaviksi: Daemonship ei
laivueessa (S0421), Rok-laivueet (S0816), Veteran Captainin laivue (S0051) ja
Tau Orca- ja Dhow-laivueet (S1111–S1113, S1120, S1121).

### 7. Pienet

- **Pakollinen asevalinta, Tyranidit** (S1041, S1043, S1058, S1059): domain.js:n
  need1-malli (Waystation) sopii.
- **War Hostin hook_capacity** (S1168).
- **Wardenit vain omaan emoalukseen** (S1106).
- **Autarchin Dragonship-lippulaiva** (S0641).
- **Battlefleet Obscura Reserve Fleet** listavarianttina (S0058).

## Poimintaviat

Poimintavika on 23 lauseen pääasiallinen ongelma (ROSKA). Kaikkiaan
`x`-kenttä merkitsee 105 lausetta, ja niistä valtaosa on muuten käyttökelpoinen
sääntö muissa luokissa:

| vika | lauseita | esimerkki |
|---|---|---|
| otsikko liimautunut virkkeen alkuun | 49 | S0001 "SPECIAL RULES ATTACK RATING The Imperial Navy..." |
| taulukko yhdeksi lauseeksi | 34 | S0114 Ld-taulukko + attack rating; S0417 hintalista pistejonoineen |
| lause katkennut palstan tai sivun vaihtoon | 19 | S0209 ↔ S0229 (Quest for Knowledge) |
| lauseen alku poimittu osion otsikoksi | 4 | S0299 "Space Marine Chapters are fiercely", S0353, S0541, S0810 |
| väärä lista | 1 | S0348: Tau/Imperial-lause näkyy 13 Chaos-, Eldar- ja Ork-listalla |
| tupla | 2 | S0811, S1123 |

Lisäksi Incursion-listalla näkyy yleisen Chaos-luvun noin 35 Daemonship-lausetta
(S0413–S0447), vaikka listalla ei ole Daemonship-rivejä.

## Vanhentuneet referenssiperustelut

Moni `referenssi/NN_*.json`:n `manual`-rivi sanoo "ei valvota", vaikka sääntö
on nyt valvottu. Esimerkkejä:

- 29 #237: hive shipin saattajat 6–12 (S1057)
- 25 #214: tiddla 3–10 (S0886)
- 28 #231: Vanguardin sekalaivue (S1045)
- 25 #211: 'Uge ship -suhde ja Space Hulkin 1 500 pistettä
- Chaos-listojen Warmaster-capital ship -ehto ja Daemonship-osuudet

`check_reference.py` ei huomaa siirtymää manual → enforced. Sille sopisi
tarkistus: manual-rivin teksti löytyy säännön src:stä → raportoi.

## Avoimet tulkinnat (käyttäjälle)

- **S0490, F222:** Chaos-listojen renegade-IN-aluksille tarjotaan "Special
  torpedoes" -rivi, vaikka kirja kieltää "Special weapon rules" ja "Chaos
  ordnance". Ovatko erikoistorpedot näitä?
- **S0281, F138:** "it can be any Imperial cruiser-class vessel". Tarkoittaako
  tämä, että Inquisitorial cruiserin voi edustaa millä tahansa IN-risteilijän
  profiililla, vai vain mallilla?
- **S0246, F121:** AdMechin "enintään yksi reservi kolmea capital shipiä
  kohden": laivaston kokonaisraja vai yleisen tyyppikohtaisen säännön
  toisto? Lukutavat eroavat vain reunatapauksissa.
- **S0040, F499:** planeetan koon mukainen puolustusraja 4/5/6. Kirja ei
  määrittele, onko yksi puolustus laivue vai kappale.

## Rajaukset

- Luokittelu on lausekohtainen. Sama lause voi olla eri asemassa eri
  listoilla (S0348), ja se on mainittu perusteluissa.
- Koodiväitteistä 81 varmistettiin ajossa ja 3 osittain. Seitsemän nojaa vain
  koodin lukemiseen (`vk: koodi luettu` liitteessä). Varmistusajot ovat
  kertakokeita, eivät golden-tapauksia.
- PELI-lauseiden "kortilla"-väitteistä ajettiin vain kahdeksan. Muiden osalta
  ei ole tarkistettu, näkyykö sääntö kortilla.
- Kirjan versio on Fleets WiP v0.36 (`saannot_txt/fleets.txt`, 5.10.).

## Liite: listakohtainen vaikutus (esiintymät)

| lista | nyt | aidot TARKISTA | ominaisuus- tai laskettavaehdokkaat | valvottu tai rakenne | peli | kampanja | kuvaus, tausta, roska |
|---|---|---|---|---|---|---|---|
| Orks — Da Ork Clanz | 183 | 2 | 11 | 24 | 53 | 52 | 41 |
| Adeptus Mechanicus — Explorator | 118 | 2 | 8 | 29 | 29 | 30 | 20 |
| Orks — Waaagh! | 109 | 1 | 0 | 18 | 27 | 46 | 17 |
| Chaos — Tzeentch | 103 | 1 | 6 | 20 | 43 | 16 | 17 |
| Chaos — Nurgle | 102 | 1 | 6 | 20 | 43 | 16 | 16 |
| Chaos — Black Crusade | 101 | 1 | 6 | 20 | 43 | 16 | 15 |
| Chaos — Khorne | 101 | 1 | 6 | 19 | 42 | 16 | 17 |
| Chaos — Slaanesh | 101 | 1 | 6 | 20 | 42 | 16 | 16 |
| Orks — Cyclops Cluster | 100 | 0 | 0 | 13 | 26 | 46 | 15 |
| Tyranids — Hive Fleet | 98 | 2 | 2 | 14 | 37 | 12 | 31 |
| Eldar — Iyanden Craftworld | 93 | 0 | 4 | 18 | 4 | 57 | 10 |
| Tyranids — Vanguard Fleet | 92 | 2 | 2 | 14 | 37 | 11 | 26 |
| Chaos — Incursion | 87 | 1 | 2 | 12 | 46 | 16 | 10 |
| Eldar Corsairs — Later Gothic War | 87 | 0 | 3 | 17 | 4 | 57 | 6 |
| Eldar Corsairs — Gothic Sector | 86 | 0 | 3 | 16 | 4 | 57 | 6 |
| Dark Eldar — Pirates | 81 | 0 | 0 | 6 | 30 | 40 | 5 |
| Space Marines — Dominion | 75 | 0 | 4 | 19 | 23 | 9 | 20 |
| Imperial Navy — Bakka Sector | 71 | 1 | 6 | 18 | 11 | 18 | 17 |
| Tau — Commerce Protection | 68 | 5 | 3 | 29 | 18 | 3 | 10 |
| Imperial Navy — Bastion Fleets | 65 | 2 | 2 | 16 | 16 | 17 | 12 |
| The Emperor's Inquisition | 64 | 2 | 6 | 18 | 18 | 7 | 13 |
| Tau — Merchant Fleet | 64 | 5 | 3 | 25 | 18 | 3 | 10 |
| Necrons — Harvest Fleet | 62 | 0 | 1 | 6 | 48 | 4 | 3 |
| Space Marines — Crusade | 59 | 0 | 3 | 9 | 21 | 10 | 16 |
| Imperial Navy — Armageddon Sector | 51 | 1 | 1 | 17 | 9 | 17 | 6 |
| Space Marines — Codex Astartes | 51 | 0 | 1 | 11 | 19 | 8 | 12 |
| Imperial Navy — Gothic Sector | 44 | 1 | 1 | 10 | 9 | 17 | 6 |
| Demiurg — War Host | 44 | 0 | 5 | 7 | 21 | 3 | 8 |
| Grey Knights | 37 | 0 | 5 | 10 | 12 | 6 | 4 |
| Rogue Traders — Pirates and Wolf Packs | 36 | 1 | 4 | 14 | 6 | 4 | 7 |
| Rogue Traders | 32 | 1 | 4 | 9 | 6 | 6 | 6 |
| Rogue Traders — Exploration | 32 | 1 | 9 | 12 | 2 | 6 | 2 |
