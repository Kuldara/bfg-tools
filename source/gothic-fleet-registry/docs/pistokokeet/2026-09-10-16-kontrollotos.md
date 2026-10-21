# Pistokoe 2026-09-10 / 16 — J17: kontrollisatunnaisotos, 90 riviä 524:stä

Käyttäjän 1.0-portin kolmas kohta: yksi uusi satunnaisotos rivipeiton
(J15), ehdollisten optioiden auditoinnin (J16) ja CRLF-korjauksen (J18)
jälkeen. Tavoite oli P1 = 0. Menetelmä on sama laaja tarkastus kuin
pistokokeissa 10–13: kirja ensin, kortti vasta sitten, vertailu käsin.
Kortit generoitiin buildista `01001aa`.

## Otanta

- **Populaatio:** 524 listariviä (462 yksikköä + 62 komentajaa, 32 listaa).
- **Otos:** 90 riviä, siemenet `2026101701`–`2026101797` (`python
  sample_rows.py 2026101701`; 97 siementä kokeiltu, 7 osui jo arvottuun
  riviin). Siemenet ovat uusia, eli otos on riippumaton aiemmista.
- **Vertailu:** profiilisivu, listan kaikki sivut (myös jatkosivut s.37,
  41, 49, 101, 125, 145, 177/179, 233–249, 317, 367, 372, 455–457, 487),
  jokaisen tarjotun päivityksen lähdelause, yleissivut (s.22–23, 118–121,
  175, 224–229, 302–307, 358–360, 450–451, 483–484) sekä päivitysketjut.
- **Luokat:** P1 = pelaaminen muuttuu tai laiton valinta tarjolla; P2 =
  puute tai harhauttava tarjous, joka ei muuta lopputulosta; P3 = tulkinta,
  esitys.

## Tulos ennen korjauksia

| luokka | rivejä | osuus | 95 %:n väli (Wilson, FPC) | arvio populaatiosta (524) |
|---|---|---|---|---|
| P1 | 0/90 | 0,0 % | 0,0–3,9 % | 0–20 riviä |
| P2 | 0/90 | 0,0 % | 0,0–3,9 % | 0–20 riviä |
| P3 | 4/90 | 4,4 % | 2,1–10,5 % | 11–55 riviä |
| LÄPI | 86/90 | 95,6 % | 89,5–97,9 % | 469–513 riviä |

**P1 = 0/90 (95 %:n yläraja 3,9 %, eli populaatiossa enintään 20 riviä).
Myös P2 = 0/90.** Portin tavoite täyttyi. Perushinnat ja profiilit
täsmäsivät 90/90, kuten kaikissa aiemmissa otoksissa, ja komentajien Ld ja
re-rollit 8/8.

| | pistokoe 13 | pistokoe 16 (J17) |
|---|---|---|
| P1 | 0/90 | **0/90** |
| P1 tai P2 | 2/90 | **0/90** |
| LÄPI | 88/90 | **86/90** |
| perushinta väärin | 0/90 | 0/90 |
| profiili väärin | 0/90 | 0/90 |

### Jakauma laivastoperheittäin

| perhe | rivejä | P3 |
|---|---|---|
| Chaos | 25 | 0 |
| Imperial Navy | 18 | 2 |
| Tau | 12 | 0 |
| Rogue Traders | 11 | 0 |
| Orks | 6 | 0 |
| Adeptus Mechanicus | 5 | 2 |
| Eldar Corsairs | 3 | 0 |
| Grey Knights | 3 | 0 |
| Demiurg | 2 | 0 |
| Space Marines | 2 | 0 |
| Dark Eldar | 1 | 0 |
| Eldar | 1 | 0 |
| The Emperor's Inquisition | 1 | 0 |

## Löydökset

Ei P1- eikä P2-löydöksiä. P3-huomioita (esitys tai tulkinta) oli neljällä
rivillä:

| rivi | huomio | kirja | ratkaisu |
|---|---|---|---|
| 5 | Mechanicus-listan Lunar: oma Nova-optio ja listan rivi "Nova Cannon instead of prow torpedoes" olivat sama osto kahta reittiä. Ne sulkivat toisensa pois, joten kaksoishintaa ei syntynyt. | s.71 "Can replace its prow torpedoes with a nova cannon at an additional cost of +20 pts"; s.121 "... even if this option is not normally provided for a given cruiser class (such as the Gothic)" | kirjattu, ei korjattu. 8.9.:n päätöksen mukaan reitit sulkevat toisensa ja veloittavat kerran (`test_upgrades.js`, sama kuin pistokoe 10:n K2). Kokeiltu `cov` kaatoi 6 testiä ja peruttiin |
| 39 | Omnissiah's Victory saa pakollisen Mechanicus-turretin (5 turretia) | s.119 "All Mechanicus capital ships add +1 to a given vessel's original turret value"; s.126 "cannot take any refits (from the Mechanicus Gifts table or from elsewhere) except the one described in the options below" | tulkinta, kirjattu: s.119 koskee kaikkia Mechanicus-pääaluksia. Vain s.121 kutsuu turretia "refitiksi", ja silloinkin saattajien yhteydessä |
| 62, 66 | Bastion-listan Vengeance ja Mars ovat listanäkymässä otsikon "Battleships" alla | s.37: väliotsikko "Battlecruisers & Grand Cruisers" | kirjattu (esitys): suhdesäännöt valitsevat tyypit oikein (`allow_pick`/`per_pick`, referenssi `01_imperial_navy_bastion_fleets.json`), joten fleet-validointi on kirjan mukainen |

Tarkistettu ja todettu oikeaksi: Ghostship tarjotaan Dragonshipille vasta,
kun köliin on valittu torpedot (s.307 "Ghostships may not be armed with
launch bays"). J16:n korjaus näkyi otoksessa: Rogue Traders -listan Armed
Cargo Vessel menettää Xenotech-rivit, kun Fast Clipper otetaan (rivi 80).

## Tulos korjausten jälkeen

`python acceptance.py`: tuomio VAKAUTUS KESKEN, golden 287. Ainoa auki oleva kohta on
`share_zip_current` (käyttäjän julkaisuaskel).

## Rivikohtainen tulos (ennen korjauksia)

| # | siemen | lista | rivi | s. | tuomio | huomio |
|---|---|---|---|---|---|---|
| 1 | 2026101701 | Chaos — Tzeentch | Acheron class heavy cruiser | 275 | **LÄPI** | 190 (s.237), profiili s.275; Daemonship HC 25, TS-miehistö, Strand |
| 2 | 2026101702 | Imperial Navy — Bakka Sector | Endurance Class Light Cruiser | 75 | **LÄPI** | 115 (s.49), profiili s.75 (3 turretia); 6+ keula ja 45°; Bakka +1 turret sallittu (s.75) |
| 3 | 2026101703 | Demiurg — War Host | Endeavour Class Light Cruiser | 181 | **LÄPI** | 110 (s.487), profiili s.181; 6+ keula; Dauntless-vaihto on listan oma rivi |
| 4 | 2026101704 | Imperial Navy — Bakka Sector | Viper class destroyer | 83 | **LÄPI** | 35/alus (s.49), profiili s.83; ei Bakka-turretia saattajille |
| 5 | 2026101705 | Adeptus Mechanicus — Explorator | Lunar class cruiser | 71 | **P3** | 215 (s.125), profiili s.71; turret +1 ja dorsal lance pakollisina (s.118–119). Oma Nova-optio ja listan s.121-rivi olivat sama osto kahta reittiä (toisensa poissulkevina, ei kaksoishintaa) |
| 6 | 2026101706 | Chaos — Khorne | Chaos battle barge | 255 | **LÄPI** | 410 (s.245), profiili s.255; ei Daemonshipia taistelulaivoille (s.245), WE-miehistö optiona, torpedo bombers 80 |
| 7 | 2026101707 | Chaos — Nurgle | Chaos battle barge | 255 | **LÄPI** | 410 (s.241); Daemonship BS 85 ja +1 Hit |
| 8 | 2026101708 | Rogue Traders — Pirates and Wolf Packs | Xenos Vessel - Pthuxutl war cruiser | 186 | **LÄPI** | 50/alus (s.179), profiili s.186; Ship Defense Grid sisältyy |
| 9 | 2026101709 | Grey Knights | Nova class Frigate | 107 | **LÄPI** | 50/alus (s.145), profiili s.107 |
| 10 | 2026101710 | Imperial Navy — Gothic Sector | Gothic class cruiser | 70 | **LÄPI** | 180 (s.35), profiili s.70; Power Ram 5 |
| 11 | 2026101711 | Chaos — Black Crusade | Hecate class heavy cruiser | 273 | **LÄPI** | 230 (s.235), profiili s.273; Daemonship HC 25, torpedo bombers 40, orbital mines 20 |
| 12 | 2026101712 | Tau — Commerce Protection | Stronghold Commerce Vessel | 488 | **LÄPI** | 350 (s.457), profiili s.488; torpedo bombers 30 (Demiurg 10/bay) |
| 13 | 2026101713 | Chaos — Incursion | Acheron class heavy cruiser | 275 | **LÄPI** | 190 (s.233), profiili s.275 |
| 14 | 2026101714 | Tau — Merchant Fleet | Orca class gunship | 466 | **LÄPI** | 25/alus (s.454), profiili s.466 |
| 15 | 2026101715 | Imperial Navy — Armageddon Sector | Solar Admiral (Ld 10) |  | **LÄPI** | 150 (s.40), Ld 10, 1 re-roll; Admiral-re-rollit 25/75/150 |
| 16 | 2026101716 | Orks — Cyclops Cluster | Grunt assault ship | 388 | **LÄPI** | 30/alus (s.365), profiili s.388; Klaws +5/alus, Dakka +5/alus |
| 17 | 2026101717 | Imperial Navy — Bakka Sector | Sword class frigate | 82 | **LÄPI** | 35/alus (s.49), profiili s.82 |
| 18 | 2026101718 | Chaos — Slaanesh | Vengeance class grand cruiser | 270 | **LÄPI** | 230 (s.249), profiili s.270; Daemonship GC 55 (Mark sisältyy) |
| 19 | 2026101719 | Adeptus Mechanicus — Explorator | Cobra Class Destroyer | 84 | **LÄPI** | 30/alus (s.125), profiili s.84; +1 turret +5/alus (s.121), detection gear |
| 20 | 2026101720 | Grey Knights | Grey Knights Strike Cruiser | 151 | **LÄPI** | 165 (s.151; listan s.145 hinta painovirhe 'vvv'); Terminators 50, Honour Guard 10, orbital mines 10 |
| 21 | 2026101721 | Chaos — Nurgle | Chaos Warmaster (Ld +2) |  | **LÄPI** | 100 + pakollinen Mark of Nurgle 35 = 135 (s.240); lisä-re-roll 25 |
| 22 | 2026101722 | Chaos — Incursion | Carnage class cruiser | 277 | **LÄPI** | 180 (s.233), profiili s.277 |
| 23 | 2026101723 | Eldar Corsairs — Later Gothic War | Nightshade class destroyer | 328 | **LÄPI** | 40/alus (s.317), profiili s.328 |
| 24 | 2026101724 | Orks — Waaagh! | Gorbag’s Revenge | 377 | **LÄPI** | 310 (s.367), profiili s.377; boarding torpedoes 5, torpedo bommas 80, Dakka 20 |
| 25 | 2026101725 | Rogue Traders — Pirates and Wolf Packs | Q-Ship | 522 | **LÄPI** | 60/alus (s.179), profiili s.522 |
| 26 | 2026101726 | Dark Eldar — Pirates | Dread Archon (+2 Ld) |  | **LÄPI** | 100 (s.351), +2 Ld; re-rollit 25/50/100 |
| 27 | 2026101727 | Imperial Navy — Bakka Sector | Dominion class battlecruiser | 62 | **LÄPI** | 260 (s.49), profiili s.62; torpedo bombers 40, orbital mines 20, +1 turret, Power Ram |
| 28 | 2026101728 | Chaos — Slaanesh | Planet Killer | 252 | **LÄPI** | 505 (s.249), profiili s.252; EC-miehistö |
| 29 | 2026101729 | Chaos — Khorne | Desolator class battleship | 267 | **LÄPI** | 300 (s.245), profiili s.267; ei Daemonshipia taistelulaivoille |
| 30 | 2026101730 | Orks — Da Ork Clanz | Onslaught attack ship | 384 | **LÄPI** | 35/alus (s.372), profiili s.384; Gubbins koko skwadronille |
| 31 | 2026101731 | Eldar Corsairs — Gothic Sector | Shadow class cruiser | 322 | **LÄPI** | 210 (s.316), profiili s.322 |
| 32 | 2026101732 | Orks — Da Ork Clanz | Grunt assault ship | 388 | **LÄPI** | 30/alus (s.372), profiili s.388; Klaws +5/alus |
| 33 | 2026101733 | Rogue Traders — Exploration | Tyrant class cruiser | 69 | **LÄPI** | 185 (s.176), profiili s.69; omat optiot pois (listahinta, s.180), Xenotech 15 |
| 34 | 2026101734 | Imperial Navy — Armageddon Sector | Hunter Class Destroyer* | 109 | **LÄPI** | 40/alus (s.41), profiili s.109; Astartes-säännöt |
| 35 | 2026101735 | Chaos — Incursion | Murder class cruiser | 279 | **LÄPI** | 170 (s.233), profiili s.279 |
| 36 | 2026101736 | Tau — Commerce Protection | Emissary class starship — Sa’cea configuration | 473 | **LÄPI** | 110 (s.456), profiili s.473; deflector +10 → 6+ keula |
| 37 | 2026101737 | Space Marines — Codex Astartes | Nova class Frigate | 107 | **LÄPI** | 50/alus (s.97), profiili s.107 |
| 38 | 2026101739 | Chaos — Incursion | Chaos Space Hulk | 286 | **LÄPI** | 650 (s.233), profiili s.286; torpedo bombers 80, ei miehistöä eikä Markia (M1) |
| 39 | 2026101740 | Adeptus Mechanicus — Explorator | Omnissiah’s Victory | 126 | **P3** | 415 (s.125), profiili s.126; launch bay -optio +10. Pakollinen Mechanicus-turret (s.119 'All Mechanicus capital ships add +1') vs s.126 'cannot take any refits (… or from elsewhere)': tulkinta, kirjattu |
| 40 | 2026101741 | Tau — Commerce Protection | Cargo Vessel | 192 | **LÄPI** | 20/alus (s.457), profiili s.192; Fast Clipper, ei Xenotechia liittolaisena (s.176) |
| 41 | 2026101742 | Imperial Navy — Gothic Sector | Dominator class cruiser | 68 | **LÄPI** | 190 (s.35), profiili s.68; -5 (45 cm, FP 6) |
| 42 | 2026101743 | Chaos — Incursion | Desolator class battleship | 267 | **LÄPI** | 300 (s.233), profiili s.267 |
| 43 | 2026101745 | Imperial Navy — Bakka Sector | Retribution class battleship | 54 | **LÄPI** | 345 (s.49), profiili s.54; +1 turret, Power Ram |
| 44 | 2026101746 | Eldar Corsairs — Later Gothic War | Aconite class frigate | 326 | **LÄPI** | 55/alus (s.317), profiili s.326 |
| 45 | 2026101747 | Chaos — Incursion | Slaughter class cruiser | 280 | **LÄPI** | 165 (s.233), profiili s.280 |
| 46 | 2026101748 | Chaos — Black Crusade | Styx class heavy cruiser | 272 | **LÄPI** | 260 (s.235), profiili s.272; Daemonship HC 25, torpedo bombers 60, orbital mines 30 |
| 47 | 2026101749 | Tau — Commerce Protection | Tau Kor’O (Ld 9) |  | **LÄPI** | 80 (s.456), Ld 9, 1 re-roll; Aun'el 25, Aun'O 75 |
| 48 | 2026101750 | Rogue Traders — Pirates and Wolf Packs | Cargo Transport | 85 | **LÄPI** | 10/alus (s.179), profiili s.85 |
| 49 | 2026101751 | Demiurg — War Host | Merchant class starship — Ke’lshan configuration | 462 | **LÄPI** | 95 (s.487), profiili s.462; +15 → 6 Hits |
| 50 | 2026101752 | Eldar — Iyanden Craftworld | Dragonship | 330 | **LÄPI** | 260 (s.318), profiili s.330; keula/köli-valinta, Vampire +10 bayn kanssa, Aspect Host 20; Ghostship vasta ilman bayta (s.307) |
| 51 | 2026101753 | Imperial Navy — Armageddon Sector | Rapid Strike Vessel (Sword)* | 82 | **LÄPI** | 40/alus (s.41), profiili s.82; Astartes crew |
| 52 | 2026101756 | Tau — Commerce Protection | Merchant class starship — Ke’lshan configuration | 462 | **LÄPI** | 95 (s.456), profiili s.462; +15 → 6 Hits |
| 53 | 2026101757 | Chaos — Black Crusade | Repulsive class grand cruiser | 269 | **LÄPI** | 230 (s.235), profiili s.269; +10 / +15, Daemonship GC 30, CSM 35 |
| 54 | 2026101758 | Imperial Navy — Gothic Sector | Sword class frigate | 82 | **LÄPI** | 35/alus (s.35), profiili s.82 |
| 55 | 2026101759 | Chaos — Nurgle | Repulsive class grand cruiser | 269 | **LÄPI** | 230 (s.241), profiili s.269; Daemonship GC 65 ja +1 Hit |
| 56 | 2026101761 | Chaos — Nurgle | Murder class cruiser | 279 | **LÄPI** | 170 (s.241), profiili s.279; Daemonship 55 |
| 57 | 2026101762 | Orks — Cyclops Cluster | Onslaught attack ship | 384 | **LÄPI** | 35/alus (s.365), profiili s.384; Dakka +5/alus |
| 58 | 2026101763 | The Emperor's Inquisition | Inquisitor Lord (Ld 9) |  | **LÄPI** | 75 (s.138), Ld 9, 1 re-roll; toinen +25 |
| 59 | 2026101764 | Tau — Commerce Protection | Citadel Commerce Vessel | 490 | **LÄPI** | 185 (s.457), profiili s.490 |
| 60 | 2026101765 | Chaos — Incursion | Inferno class cruiser | 278 | **LÄPI** | 180 (s.233), profiili s.278 |
| 61 | 2026101766 | Chaos — Tzeentch | Vengeance class grand cruiser | 270 | **LÄPI** | 230 (s.237), profiili s.270; Daemonship GC 30, TS-miehistö, Strand |
| 62 | 2026101767 | Imperial Navy — Bastion Fleets | Vengeance class grand cruiser | 58 | **P3** | 230 (s.37), profiili s.58. Listanäkymän otsikko 'Battleships', kirjassa 'Battlecruisers & Grand Cruisers'; suhdesäännöt valitsevat tyypit oikein (RULE_PICKS, referenssi 01) |
| 63 | 2026101768 | Chaos — Slaanesh | Hecate class heavy cruiser | 273 | **LÄPI** | 230 (s.249), profiili s.273; Daemonship HC 50, torpedo bombers 40, orbital mines 20 |
| 64 | 2026101769 | Tau — Commerce Protection | Xenos Vessel | 184 | **LÄPI** | 50/alus (s.457), profiili s.184; yksi ilmainen Xenotech |
| 65 | 2026101770 | Chaos — Khorne | Hades class heavy cruiser | 274 | **LÄPI** | 200 (s.245), profiili s.274; Daemonship HC 45 |
| 66 | 2026101771 | Imperial Navy — Bastion Fleets | Mars class battlecruiser | 61 | **P3** | 270 (s.37), profiili s.61; +15 ja +10, torpedo bombers 40, orbital mines 20. Sama otsikkohuomio kuin rivillä 62 |
| 67 | 2026101773 | Tau — Commerce Protection | Castellan class starship | 474 | **LÄPI** | 50/alus (s.456), profiili s.474 |
| 68 | 2026101774 | Rogue Traders — Pirates and Wolf Packs | Armed Freighter | 523 | **LÄPI** | 20/alus (s.179), profiili s.523 |
| 69 | 2026101775 | Chaos — Nurgle | Acheron class heavy cruiser | 275 | **LÄPI** | 190 (s.241), profiili s.275; Daemonship HC 60 ja +1 Hit |
| 70 | 2026101776 | Imperial Navy — Bastion Fleets | Fleet-Admiral (Ld 8) |  | **LÄPI** | 50 (s.36), Ld 8, 1 re-roll; 25/75/150 |
| 71 | 2026101777 | Rogue Traders — Exploration | Havoc Class Frigate | 81 | **LÄPI** | 35/alus (s.176 Nate Montes), profiili s.81; Xenotech +5/alus |
| 72 | 2026101778 | Adeptus Mechanicus — Explorator | Dictator class cruiser | 67 | **LÄPI** | 255 (s.125), profiili s.67; torpedo bombers 40, orbital mines 20, Nova +20 (s.121), plasma +10 |
| 73 | 2026101779 | Rogue Traders — Pirates and Wolf Packs | Iconoclast Destroyer | 190 | **LÄPI** | 30/alus (s.179), profiili s.190 |
| 74 | 2026101780 | Tau — Merchant Fleet | Warden class gunship | 475 | **LÄPI** | 30/alus (s.454), profiili s.475 |
| 75 | 2026101781 | Imperial Navy — Armageddon Sector | Master of the Fleet (Ld 10) |  | **LÄPI** | 50 (s.40), Ld 10, 1 re-roll; MotF-re-rollit 25/50/75 |
| 76 | 2026101782 | Imperial Navy — Gothic Sector | Emperor class battleship | 53 | **LÄPI** | 365 (s.35), profiili s.53; Shark +5, torpedo bombers 80 |
| 77 | 2026101783 | Grey Knights | Rapid strike vessel (Cobra) | 84 | **LÄPI** | 35/alus (s.145), profiili s.84 |
| 78 | 2026101784 | Adeptus Mechanicus — Explorator | Endurance class light cruiser | 74 | **LÄPI** | 125 (s.125), profiili s.74; turret +1, dorsal lance -vaihto ja 6+ keula (s.121), plasma +10 |
| 79 | 2026101785 | Imperial Navy — Armageddon Sector | Fleet-Admiral (Ld 8) |  | **LÄPI** | 50 (s.40), Ld 8, 1 re-roll; Admiral-re-rollit |
| 80 | 2026101786 | Rogue Traders | Armed Cargo Vessel | 192 | **LÄPI** | 20/alus (s.174), profiili s.192; Fast Clipper sulkee Xenotechin (J16) |
| 81 | 2026101787 | Chaos — Slaanesh | Devastation class cruiser | 276 | **LÄPI** | 190 (s.249), profiili s.276; Daemonship 45, torpedo bombers 40, orbital mines 20 |
| 82 | 2026101788 | Chaos — Slaanesh | Chaos battle barge | 255 | **LÄPI** | 410 (s.249), profiili s.255; Daemonship BS 75 |
| 83 | 2026101789 | Imperial Navy — Bastion Fleets | Apocalypse class battleship | 52 | **LÄPI** | 365 (s.37), profiili s.52 |
| 84 | 2026101790 | Tau — Commerce Protection | Merchant class starship — Dal’yth configuration | 462 | **LÄPI** | 95 (s.456), profiili s.462; +15 → 6 Hits |
| 85 | 2026101791 | Tau — Merchant Fleet | Stronghold Commerce Vessel | 488 | **LÄPI** | 350 (s.455), profiili s.488; torpedo bombers 30 |
| 86 | 2026101792 | Rogue Traders | Rogue Trader Cruiser | 180 | **LÄPI** | 185 (s.174), profiili s.180; Power Ram 6+, Xenotech 15 |
| 87 | 2026101793 | Space Marines — Dominion | Nova class Frigate | 107 | **LÄPI** | 50/alus (s.101), profiili s.107 |
| 88 | 2026101794 | Rogue Traders | Dauntless Class Light Cruiser | 77 | **LÄPI** | 125 (s.174), profiili s.77; Xenotech 15, ei Power Ramia (5+ keula) |
| 89 | 2026101795 | Orks — Waaagh! | Ork hulk | 389 | **LÄPI** | 600 (s.367), profiili s.389; boarding torpedoes 15, torpedo-bommas 160 |
| 90 | 2026101797 | Rogue Traders | Iconoclast Destroyer | 190 | **LÄPI** | 30/alus (s.174), profiili s.190; Xenotech +5/alus |

## Johtopäätös v1.0-valmiudesta

Käyttäjän 1.0-portin neljä ensimmäistä kohtaa ovat tehty:

1. **J15 rivipeitto 524/524 = 100 %** (`f0ceeae`, raportti 14).
2. **J16 ehdolliset optiot:** 25 luokiteltu, yksi vika korjattu (`a16a1ce`,
   raportti 15).
3. **J17 kontrolliotos:** P1 0/90 ja P2 0/90 (tämä raportti).
4. **J18 CRLF:** koko acceptance läpi myös CRLF-checkoutissa (`01001aa`).

Jäljellä on J6, joka on käyttäjän askel: ZIP samasta commitista
`share version/`-kansioon, `v1.0`-tagi ja Cloudflare Pages.
