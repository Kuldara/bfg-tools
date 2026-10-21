# Pistokoe 19 — monimenetelmätarkastus (11.9.2026)

**Miksi.** Pistokoe 18 kävi kirjan läpi kohta kohdalta ja löysi 14 puutetta.
Se ei kuitenkaan mitannut kolmea asiaa:

1. kuinka paljon poiminta itse jätti huomaamatta;
2. onko jo tehdyissä tulkinnoissa virheitä;
3. toimiiko sovellus sääntöjen rajakohdissa ja yhdistelmissä.

Tämä koe ajaa kolmetoista eri menetelmää (ja kaksi kesken keksittyä lisää,
M14 ja M15). Osa on koneellisia ja kattaa kaiken, osa on raskaita ja
ajetaan otoksena kiinteällä siemenellä.

**Sääntö jokaiselle löydökselle: tulkintavarmistus ennen korjausta.** Löydöksestä
kirjataan:

- kirjan lause kokonaan rajauksineen;
- ympäröivä teksti ja lauseen viittaukset (yleissivu, profiili, jatkosivu);
- riippumaton lähde, kun sellainen on (BSData);
- vaihtoehtoiset lukutavat ja mitä kukin muuttaisi.

Korjaus tehdään vasta, kun lukutapa on perusteltu. Jos kirja on
aidosti monitulkintainen, asia kirjataan päätökseksi eikä sitä korjata
hiljaa.

## Menetelmät

| M | Menetelmä | Tyyppi | Laajuus | Tila | Löydökset |
|---|---|---|---|---|---|
| M1 | Listojen normatiiviset tekstilauseet, joilla ei ole tarkistusta | koneellinen + tuomio | kaikki listat | valmis | 756 lausetta, A 382 (264 erillistä), P18 kattoi 249; 15 käsin → **J38** |
| M2 | Profiilien kiellot ("cannot", "may not", "only") tarjontaa vasten | koneellinen + tuomio | kaikki rungot | valmis | 47 runkoa, 66 kieltolausetta → **J36**; T1 |
| M3 | Tulkintakirjanpito: aiemmat tulkinnat, vaihtoehdot ja riippumaton lähde | käsin | tämän kokeen tulkinnat + vanhat | osittain | T1–T12 alla; vanhojen J-päätösten läpikäynti kesken |
| M4 | Kaksoispoiminta: toinen agentti poimii samat sivut itsenäisesti, ja poiminnan recall mitataan | agentti, otos | 30 satunnaissivua | valmis | 275 kohtaa, recall 98,2 %; 5 ohitusta, ei löydöstä (T6) |
| M5 | Rajatestit: jokainen pisteraja kynnyksellä, kynnyksen alla ja yllä ("over", "or more", "or part", "FULL") | koneellinen | kaikki pistesäännöt | valmis | 0 sanamuotoristiriitaa; 8 pyöristystulkintaa ratkesivat kirjan esimerkeillä (T13); tarkistuksessa löytyi **J47** |
| M6 | Parittainen kombinatoriikka: kaikki optio- ja päivitysparit samalla rungolla | koneellinen, otos | 40 satunnaisrunkoa | valmis | 109 paria, 0 epäadditiivista, 26 poissulkua kirjan mukaisia |
| M7 | Saman aluksen hinnat listojen välillä | koneellinen + tuomio | kaikki | valmis | kaikki erot kirjan selittämiä |
| M8 | Pelkällä kortilla pelaaminen: agentti vastaa sääntökysymyksiin kortin perusteella, vastauksia verrataan kirjaan | agentti, otos | 40 korttia × 8 kysymystä | valmis | 18 väitettä → **J37, J39, J40, J43, J44, J45**; 7 hylätty |
| M9 | BSData-ristiintarkistus optioille ja päivityksille (riippumaton lähde) | koneellinen + tuomio | kaikki | valmis | erot versioeroja; 5 hintaa tarkistettu kirjasta, kaikki oikein |
| M10 | Sääntölakimies: agentti yrittää rakentaa laittoman laivaston, jonka sovellus hyväksyy | agentti, otos | 8 listaa, 80 sääntöä | valmis | 21 väitettä → **J42**; loput tulkintoja (T1, T4, T5, T10) |
| M11 | Metamorfiset testit: järjestys, tallennus/lataus, laivueen jako ja päivityksen otto/poisto | koneellinen | kaikki listat | valmis | 192 tapausta; 15 jakoeroa kirjan mukaisia; koetin → **J41** |
| M12 | Korttitekstin kattavuus: jokainen profiilin sääntölause näkyy kortilla | koneellinen | kaikki kortit | valmis | LÄPI |
| M13 | Pysyvät vartijat: menetelmien tulokset testeiksi (matriisit, rajat) | lopuksi | kaikki kortit | osittain | `print_check.js` kohta 10: crippled-rivin ja aluksen säännön ristiriita, saattajan crit-trigger, voimassa oleva Nova Cannon crippled-rivillä, Chaos +1 boarding. Punaisena commitissa `1685c78`: 10 / 10 / – / 126 löydöstä. Nova-vartija ei voi olla punainen oletuskokoonpanolla, joten J39:ää kattaa golden. Kaikki 18 goldenia ja testiä jäävät pysyviksi. |
| M14 | Kirjan jokainen "crippled"-lause aluksen sivulla vs kortin crippled-rivi | koneellinen + tuomio | 44 runkoa | valmis | Rok ja Nicassar Caravan (**J37**), Rig |
| M15 | Saattajakorttien kriittisen osuman rivit | koneellinen | 45 saattajaa | valmis | 6 korttia → **J43** |
| M16 | Saman rungon kortit eri listoilla: sääntörivit, crippled-rivi, kriittinen taulukko, turretit | koneellinen + tuomio | 112 runkoa monella listalla | valmis | 31 eroa, kaikki listakohtaisia (Mechanicuksen +1 turret, Space Marine rapid strike vesselit s.106, Crusaden Thunderhawk Annihilator, Tyranidien Vanguard/Hive, Demiurgin Mercenary/Determination s.483, Chaos-rivi vain Chaos-listoilla, merirosvo- ja Exploration-rungot ilman optioita) — ei löydöksiä |

## Löydökset

| Tunnus | Prio | Menetelmä | Kirja | Mitä | Tulkintavarmistus | Korjaus |
|---|---|---|---|---|---|---|
| J36 | P1 | M2 | s.175, 176, 196 | Stryxis Caravan Vessel sai Xenotech-refitit Rogue Traders- ja Exploration-listoilla. | s.175 myy taulukon "each Rogue Trader vessel"; s.176 "can only be used by Rogue Trader cruisers and escorts, not by other reserves or allied vessels in the fleet"; Stryxis on liittolainen (s.196 "cannot ally with any fleet that contains Eldar vessels"). Exploration-listan Lunar, Carnage ym. ovat listan omia kapitaalialuksia, ei reservejä, joten ne pitävät refitit. | `9ad8cef` |
| J37 | P1 | M8, M14 | s.197, 393, 492, 493, 495 | Crippled-rivi sanoi "Speed -5 cm" Stryxikselle, Rokille, Warspherelle ja Nicassar Caravanille; Rigillä (0 cm) sama. | Jokaisen oma lause: "Due to their low speed and considerable momentum, … which are crippled or moving though Blast markers do not reduce their speed"; Caravan "is not slowed down by blast markers, celestial phenomena or being crippled". Muu puolitus pätee: s.393 "Roks which lose half their damage are crippled just like other vessels". | `9ad8cef` |
| J38 | P1 | M1 | s.370, 372 | Clanzin Warlord-määrä vain ylärajana: yksi Warlord 1 500 pisteessä kelpasi. | s.372 "one Warlord for every 500 points, or part, that the fleet is worth - no more, no less"; s.370 "there must be at least one Warlord for every 500 points in the fleet or portion thereof". Waaagh! ja Cyclops sanovat "a max of one Warlord per 500 points" — niille ei alarajaa. | `9ad8cef` |
| J39 | P2 | M8 | RB s.65, s.71 | Optiolla otettu Nova Cannon ei näkynyt crippled-rivillä. | RB s.65 "Crippled ships also reduce their move by 5 cm and will not be able to fire their nova cannon." Koskee aseen olemassaoloa, ei sen lähdettä. Sääntöteksti luetteli ampumiskiellot ilman crippled-tilaa. | `9ad8cef`, `c68f581` |
| J40 | P2 | M8 | s.222, 284 | Chaosin +1 boarding puuttui kaikilta Chaos-korteilta (Orkkien ja Dark Eldarin vastaavat ovat). | s.222 "Chaos has a +1 boarding modifier. The Chaos Space Marine upgrade replaces this, providing them with a total +2". Rajaus: Activated Blackstone Fortress s.284 "It has no crew". Listan perusteella, ei profiilin: Chaos-laivaston renegaattirungot kuuluvat mukaan. | `9ad8cef` |
| J41 | P2 | M11-koetin | s.404, 486 | Necron- ja Demiurg-laivaston re-rollit: One ja Two eri aluksille = kolme lisäheittoa. | s.404 "purchased by the fleet as a whole" ja "The fleet gets one re-roll and can purchase extra re-rolls at the cost shown"; hinnasto myy yhden tai kaksi. | `9ad8cef` |
| J42 | P2 | M10 | Fleets s.13, s.43, s.455, Vanguard | Ainoa saattaja ja eri luokista koottu laivue hylättiin, koska tarkistus mittasi jokaisen rivin erikseen. | s.13 "The escorts in a squadron do not have to all be of the same class" ja "A single escort may be taken … no other restrictions due to the fleet list, such as a minimum of six escorts in a squadron, these restrictions cannot be ignored". Poikkeus vain listoille, joiden lause viittaa s.13:een; omat kokonsa asettavat (Pirates 3-6, Tau Defenderit, RT, Necron, Tyranid) eivät saa sitä. Sekoitusrajat kirjasta: Armageddon s.43, Tau s.455 (Messengerit kyllä, Orcat ei), Vanguard "You may combine the two types". | `9ad8cef` |
| J43 | P2 | M8, M15 | RB s.66 | Eldarin ja Dark Eldarin saattajakorteilla oli "Every Hit causes critical damage on 4+/6". | RB s.66 "Escort ships which suffer a critical hit for any reason … are automatically destroyed." | `9ad8cef` |
| J44 | P2 | M8 | s.175 | RT:n satunnainen crew skill (+10 % pisteistä) ei ole ostettavissa. | Lause on selvä; taulukko on Rulebook s.159. Käyttäjä 11.9.: korjattava ennen 1.0:aa (sisältö ja pisteet, ei P2-kosmetiikkaa). | **valmis** 11.9. — rivit risteilijälle ja saattajalaivueelle, hinta domainin `pct`-kentästä (ei app_template-muutosta; hinnan kohdalla "see text"). 2 goldenia. Pohja ja pyöristys: T27. |
| J45 | P2 | M8 | s.179 | Silurian ja Havocin ehto "If both players agree before the game" puuttui listalta ja kortilta kaikilla kolmella RT-listalla. | Lause on osion ainoa sääntö; poiminta jätti osion tekstin tyhjäksi. | `51f7eae` |
| J47 | P2 | M5 → M3 | s.367 | Waaagh!: kaksi Ork hulkia yhdellä Warlordilla kelpasi. | Sama kappale, jonka pyöristystä tarkistettiin: "Each Ork hulk must be assigned an Ork Warlord to command it." Laskusääntö (Warlordeja ≥ hulkeja) ei vaadi komentajan ja aluksen sidontaa, jota ei mallinneta (J8). Clanz-lista on eri: "An Ork fleet with at least three Warlords may include one Space Hulk" on jo tarkistus. | `436c6c8` |
| J46 | P3 | M8, M10 | s.13, 489 | (a) "‘bastion’ Commerce Vessel" -otsikko; (b) Pirates-listan kuljetusten yksintoiminta (s.13 "such as transports"). | (b) kirjasta ei selviä, mitkä Pirates-listan saattajista ovat "transports". (c) Kierros 3: Nicassar Rigin, Dhow'n ja Caravanin korttiotsikko on profiilin nimi ("Rig"); rodun nimi näkyy alarivillä. Nimeä ei muuteta, koska `isCaravan` tunnistaa profiilin nimellä. | (a) korjattu kierroksella 3 (`title()` tunnistaa avaavan lainausmerkin); (b) ja (c) **auki** |

### Hylätyt väitteet (tarkistettu kirjasta)

| Väite | Lähde | Miksi hylätty |
|---|---|---|
| Black Crusaden Daemonshipin Mark of Tzeentch 30 → 25 | M8a | s.227: "Any Daemon ship may have a single Mark of Chaos with the same effects and cost in points as described on pg. 232"; s.232 (Incursion) +30. s.234:n 25 on Black Crusaden omien laivojen hinta. |
| Incursion-listalta puuttuu Daemonship | M8d | T2. |
| Hive shipin Mega-Spore Mines 80/bay | M8c | Kortti näyttää "+10 x" launch bayta kohden (s.427 "+10 pts/launch bay"); 80 on kahdeksan bayn summa. |
| Pirates Xenos Vessel Turns 180° | M8c | Kortti ja data 90° (s.184). |
| Pirates-listalta puuttuu "Xenos Freebooters" | M8c | Sääntöä ei löydy kirjasta (s.150–172 haettu). |
| Nightshade: "roll on the Eldar table" | M8a | Hyväksytty (J43). |
| Tzeentchin Warmaster alle 750 p | M10a | T4. |
| Chosen Terminators tavalliselle risteilijälle | M10a | Käyttöliittymä ei tarjoa sitä; ehto suodattaa tarjonnan, joten laivastoa ei voi rakentaa. |
| Kapitaalilaivueen koko (2–4, 2–3) ja Rokit (enintään 4) | M10a/b | T10. |
| Bakkan Endurance 0–12-rajan ulkopuolelle | M10a | T5 (avoin kysymys käyttäjälle). |
| Omnissiah's Victory ei saa +1 turret -refitiä | M10a, M2 | T1. |
| Zukov's Klaw ei saa Gubbinseja | M2 | s.381: "which does not affect the number of Gubbins a Warlord can upgrade this vessel with for the appropriate points if used as a Warlord's personal ship". |
| Jovianilta kielletty Power Ram | M2 | s.63: "Its prow Nova Cannon was never replaced" — sillä ei ole Nova Cannonia, joten "unless it has a Nova Cannon" ei rajaa. |
| Scion of Prospero / Terminus Est: CSM-miehistö | M2 | Hintaan sisältyy Mark (s.258, 262), ei miehistöä; miehistöä ei kielletä. |
| Armageddonin Hunter* ja RSV Cobra*: kortin tähdellä ei ole alaviitettä | M8r3c | Kortin otsikko on profiilin nimi ilman listan tähteä; kortin `*` on oma "starred rule" -merkki. Alaviite s.41 "* Space Marine vessels may not be squadroned with non-Space Marine vessels" on listan RESERVES-tekstissä ja laivuetarkistuksessa (J42 `split_fl`); "**"-raja (kaksi Endurance/Defiant per 500 p) on `per_points`-sääntö. |
| Rogue Tradersin Armed Cargo Vessel sai Xenotechin ilman kolmea RT-saattajaa | M10r3c | s.175:n rajaus koskee "Auxiliary vessels" -aluksia, jotka s.191:n mukaan otetaan isäntälaivaston listalta ("up to half the escorts in the Rogue Trader fleet may be vessels picked from the fleet list the Rogue Trader is accompanying"). Armed Cargo Vessel on RT:n oma alus (s.192), eikä sovellus tarjoa apualuksia. |
| Tau Commerce Protectionin kaksi Warspherea pienessä laivastossa suurella pisterajalla | M10r3d | s.457 "or up to two Warspheres in games larger than that" puhuu pelin koosta, joten `tiers` käyttää oikein pisterajaa. |
| Orcat ja Wardenit yli gravitic hook -kapasiteetin | M10r3d | Jo v1.1-jonossa (ks. seuraava rivi). |
| War Hostin yksittäinen Nicassar Dhow muiden saattajien rinnalla | M10r3b | Dhow-laivue muodostuu emäaluksen mukaan, ei s.13:n 2–6:n mukaan: s.455/457 "The Dhows from each parent ship fight as a squadron with the same Leadership as the parent ... However, the normal squadron limit of six still applies". Emäaluksen ja Dhow'n sidontaa ei mallinneta (s.450 "gravitic hooks have no effect in game terms"). Määräraja "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet" (s.454–457, War Host s.487) on jo v1.1-jonossa ("gravitic hook -kapasiteetti profiileista", BACKLOG, osio "Kohta 8 tehty"). |
| Tyranid-bio-enhancementit ilman "both players agree" -ehtoa | M8r3c | Listan BIO-ENHANCEMENTS-teksti sanoo jo "In one-off games both players must agree" (s.426 "These refits can only be used in one-off games if both players agree"). Ehto ratkaistaan laivastoa koottaessa, joten listateksti riittää (vrt. J45, jossa teksti puuttui kokonaan). |

## M3 — tulkintakirjanpito

| T | Asia | Kirjan lause | Vaihtoehdot | Valinta ja peruste |
|---|---|---|---|---|
| T1 | Omnissiah's Victory ja Mechanicuksen +1 turret | s.119 "All Mechanicus capital ships add +1 to a given vessel's original turret value … These improvements are already included in the point cost"; s.126 "cannot take any refits (from the Mechanicus Gifts table or from elsewhere) except the one described in the options below" | (a) +1 on luokan ominaisuus → 5 turretia; (b) +1 on refit → 4 | (a), oletuksena otettu ja poistettavissa. BSData: 5. s.121 kutsuu sitä refitiksi vain saattajille ("do not get this refit automatically"). |
| T2 | Incursion-listan Daemonshipit | s.227 "Any number of capital ships can be upgraded to Daemon ships" (yleissivut 226–231) | (a) kaikki Chaos-listat; (b) vain listat, joilla on DAEMON SHIPS -osio | (b). Incursion-listan sivuilla (s.232–233) ei ole osiota, Black Crusadella ja jumalalistoilla on; pistokoe 5 päätti samoin. |
| T3 | Black Crusaden Daemonship-Markit | s.227 viittaa sivuun 232 | 30 (s.232) vai 25 (s.234) | 30, eksplisiittinen viittaus. |
| T4 | Tzeentchin Warmaster | s.236 "A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more." | (a) pakollinen 750:stä; (b) sallittu vain 750:stä | (a). "must be taken" on velvoite; alaraja vaatisi "may only". |
| T5 | Bakkan Endurance | s.49 otsikon "0-12 Cruisers" alla: "There is no restriction for the number of Endurance light cruisers taken in a Bakka fleet." | (a) poistaa muiden listojen Endeavour-suhderajan, 12 pätee; (b) Endurancet eivät laske 12:een | (a) (referenssi 03, "manual"). **Käyttäjän päätös 11.9.: (a) — Endurance kuluttaa 0–12 cruiser -paikan, muuta määrärajaa ei ole (varmuus keskitaso).** Kirjaimellinen luenta tukee (b):tä; sijainti ja muiden listojen harvinaisuusrajan korvaaminen (a):ta. |
| T6 | Rig ja Citadel listoilla | s.493/490 FLEET LISTS -viitteet vs listasivut s.454–457, 486 | aluksen sivun viite vai listasivu | Listasivu (hinta ja rajat ovat siellä). Citadel on kaikilla neljällä; Rig vain Commerce Protection -listan sivulla. |
| T7 | Orbital mines grand cruisereille | s.23 "Only cruisers may be refitted to carry orbital mines; battleships are considered too rare and valuable" | GC mukana vai ei | Mukana (J21-päätös: s.14 laskee GC:t cruisereiksi, s.23 sulkee vain battleshipit). |
| T8 | Yksittäinen saattaja | s.13 | kaikki listat vai s.13:een viittaavat | Viittaavat (J42). |
| T9 | Clanzin klaanihinta laivueelle | s.369 "every capital ship in the skwadron must separately take and pay … clan upgrades for tiddla skwadrons count for the whole skwadron (regardless of how large it is!)" | – | Sovellus toimii näin; M11:n jakoerot ovat tätä. |
| T10 | Kapitaalilaivueet ja Rok-laivueet | s.13 "Cruisers … squadrons of two to four ships", s.367 "up to three other Roks (total squadron size of four)" | – | Ei mallinneta: käyttöliittymä antaa lukumäärän vain saattajille, joten kapitaalilaivue on aina erilliset yksiköt (vrt. J8). |
| T11 | Chaos +1 boarding | s.222, s.284 | profiilin vai listan mukaan | Listan (J40). |
| T12 | Nopeuden menetys nollanopeudella | RB s.65 | – | Nollanopeudesta ei vähennetä (J37). |
| T13 | M5:n kahdeksan "per N points" -sääntöä ilman sanaa "or part"/"FULL" | Waaagh! s.367 "So if the fleet is worth up to 1,500 points, it may include one Space hulk. If it is worth 1,500-3,000 points, two"; Waaagh!/Cyclops s.366 "if the fleet is worth up to 500 points, it may have one Warlord. If it is worth 500–1,000 points two Warlords"; Grey Knights "(e.g. one from 0-500 points, two from 501-1000 points, etc.)" | ylös vai alas | Ylös, kirjan omat esimerkit. Inkvisition Grey Knights -rivi seuraa samaa luokkaa. Taun Messengerille ei ole esimerkkiä, joten ylös noudattaa samaa kirjan käytäntöä. Commerce Protectionin Rogue Trader -rivi ("for every 750 points of Tau ships") on alas, koska pohja on Tau-alusten pisteet eikä pelin koko. |

| T14 | Daemonship-osuuksien laskupohja (J24) | s.241 "Up to a third of the capital ships (not the Terminus Est or flagship) in a Plaguefleet may be upgraded to Daemonships"; s.245 "Up to a quarter of the capital ships (not battleships or the flagship)"; s.249 "Up to half of the capital ships (not the Wage of Sin or the flagship)" | (a) sulkeet kertovat, mitä ei saa muuttaa, pohja on kaikki kapitaalialukset; (b) sulkeet rajaavat pohjan | (a) (J24, testit: Nurgle 3 alusta → 1, Khorne 4 → 1, Slaanesh 4 → 2). (b) antaisi 0, 0 ja 1. Riippumatonta lähdettä ei ole (BSDatassa ei Daemonshipeja). **Käyttäjän päätös 11.9.: (a) (varmuus korkea).** "Up to" pyöristää alas molemmissa. |
| T15 | Goffs ja Ork hulk (J33) | s.390 "Hulks cannot take any upgrade that improves Boarding Value, Turning or Speed"; Goffs "+1 bonus to the dice roll during boarding actions" | noppabonus ei ole Boarding Value / on | On: sama sivu rajaa Warlordin samanvaikutteiset päivitykset, ja lauseen tarkoitus on estää hulkin boarding-etu. |
| T16 | Activated Blackstone Fortress ja Stryxis listoilla (J29, J31) | s.284 "for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken"; s.197 "up to four ships in a Rogue Trader or pirate fleet may be Stryxis Caravan Vessels" | – | Kaikki kuusi Chaos-listaa ja kolme RT-listaa (Exploration on RT-laivasto); ei monitulkintaa. |
| T17 | Merirosvojen kevytristeilijät (J30) | s.178 "A Pirate Cruiser may consist of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos fleet lists worth 185 points or less" | kevytristeilijä on / ei ole "cruiser" | On. BSDatan Pirates-katalogi sisältää Endeavourin, Endurancen, Defiantin ja Dauntlessin. Raja 185 p Remastered-hinnoin rajaa Dominatorin (190) ja Devastationin (190) pois. |

| T18 | Commerce Protectionin Hero-raja (J55) | s.456 "up to one Hero class starship for every other type of capital ship in the fleet"; vrt. Merchant s.454 "for every Merchant or Explorer in the fleet" | (a) yksi per muu kapitaalialus; (b) yksi per muu aluslaji | Ensin (a), koska se ei hylkää kummallakaan luennalla laillista laivastoa. **Käyttäjän päätös 11.9.: (b) (varmuus keskikorkea)** — toteutettu `ratio.distinct`: yksi Hero jokaista muuta aluslajia kohden, saman luokan konfiguraatiot ovat yksi laji; pohja on listan omat Battleships- ja Cruisers-osiot. Eri sanamuoto Merchant-listaan verrattuna tukee (b):tä. |
| T19 | Grey Knightsin komentajamäärä (J66) | s.144 "an Inquisitor Lord must lead the fleet ... the Inquisitor Lord must be placed aboard it" | 0–1 vai useampi | 0–1: lause puhuu yhdestä johtajasta, ja Inquisition-listalla sama osio on 0–1. Otsikossa ei ole "0-1". |

Vanhat päätökset on nyt käyty läpi. Käyttäjä ratkaisi 11.9. kolme aitoa tulkintakysymystä: T5 ja T14 pysyvät nykyisen toteutuksen mukaisina, ja T18 muutettiin aluslajikohtaiseksi.

## Kierros 2 (siemen 2026091902)

Kierroksen 1 tuottavimmat menetelmät laajennetaan otoksena. M8 löysi aitoja virheitä noin 15 %:lla korteista, ja M10 kattoi vain 8 listaa 32:sta. Otanta tehtiin `sample19b.py`:llä:

- **M8r2:** 80 uutta korttia (442 tarkastamattomasta korttiparista), neljä agenttia.
- **M10r2:** loput 24 listaa, kolme agenttia.

Agenttien ohjeissa ovat kierroksen 1 virhelähteet: toisen listan hinta, sivuviittaukset, käyttöliittymän suodattama tarjonta ja faktioriveistä tehdyt väärät puutosväitteet.

**Tulokset.**

- **M8r2:** 80 korttia: 62 PASS, 18 ISSUES. Ohjeiden täsmennyksen jälkeen väärien väitteiden osuus laski noin 40 %:sta noin 25 %:iin.
- **M10r2:** 24 listaa ja noin 130 rajatestiä: 12 väitettä, joista 10 osui.
- **Korjaukset:** yhdeksän korttitekstiä ja kymmenen sääntöä, commit `eff587f` (10 goldenia ja 24 testiä punaisena ensin).

Hive shipin kortti putosi ensin alle 4,2 pt:n. Tyranideille tehtiin siksi lyhyempi boarding torpedo -rivi.

| Tunnus | Prio | Menetelmä | Kirja | Mitä | Korjaus |
|---|---|---|---|---|---|
| J48 | P2 | M8r2 (2 agenttia) | s.450–451 | Deflector ei ole kilpi | `tau_deflector` |
| J49 | P2 | M8r2 | RB s.78 | Boarding torpedojen käännös, yhteiskielto ja hulkit | rivi täydennetty, Tyranid-versio |
| J50 | P2 | M8r2 | s.371 | Klaws tarttuu kiinni | Klaws-rivit |
| J51 | P3 | M8r2 | s.359 | Laivaston laukaisukapasiteetti | Fighta-Bommas-rivi |
| J52 | P1 | M8r2, M10r2 | s.245 | Khornen hulk ja yli kaksi taistelulaivaa | sääntö ja kortti |
| J53 | P2 | M8r2 | s.305, 329 | Flamen Aspect Warrior -bonus | `flame_aspect` |
| J54 | P2 | M8r2 | s.402 | Reactive Hullin poikkeukset | `necron_hull` |
| J55 | P2 | M10r2 | s.456 | Commerce Protectionin Hero-raja | aluslajikohtainen suhde (T18, käyttäjän päätös) |
| J56 | P2 | M10r2 | s.457 | Commerce Protectionin RT-saattajat | laivueet 2–6, ≤ risteilijät + 1 |
| J57 | P2 | M10r2 | s.487 | War Hostin saattajalaivueet | laivuesäännöt |
| J58 | P2 | M8r2 | s.118 | Mechanicuksen boarding-uusinta | `mechanicus_crew` |
| J59 | P2 | M8r2 | s.303, 305 | Eldarin celestial ja boarding | Eldar-rivit |
| J60 | P1 | M8r2, M10r2 | s.175 | Xenotech-valinta ilman heittoa | `up`-ehto |
| J61 | P2 | M10r2 | s.177 | Cargo-laivueen koko | laivuesääntö |
| J62 | P2 | M10r2 | s.372 | Tiddla-skwadron 3–10 | laivuesääntö |
| J63 | P1 | M10r2 | s.318 | Bearer of the Flame on Autarch | poikkeuksen ehto |
| J64 | P1 | M10r2 | s.431 | Merkkien 10 %:n raja | `points_share.up_sec` |
| J65 | P1 | M10r2 | s.431 | Hive Fleet ilman hive shipiä | `ratio.when_pick` |
| J66 | P2 | M10r2 | s.144 | Yksi Inquisitor Lord | `section_count` (T19) |

**Hylätyt väitteet (kierros 2):**

| Väite | Miksi hylätty |
|---|---|
| Torpedo bombers +10 kiinteä, oikein bayta kohden | Hinta on jo bayta kohden (Chaos battle barge 410 → 490 = 8 × 10); kortti näyttää "+10 x". |
| Slamblastan ja Gorbag's Revengen ainutkertaisuus puuttuu kortilta | `mx 1` valvoo sen molemmilla Ork-listoilla (s.373). |
| Warspheren planetary assault -pisteet | Skenaariosääntö, ei laivaston rakentamista. |
| Khornen Warmaster alle 750 p | T4 (sama lause kuin Tzeentchillä). |
| Commerce Protectionin Torpedo bombers- ja Orbital mines -hinnat | Agentti ei löytänyt lähdettä eikä väittänyt virhettä. |

Kahdella kierroksella on tarkastettu 120 / 482 korttia ja 32 / 32 listaa.

## Kierros 3 (siemen 2026091903)

Kierros 2 löysi yhä noin 15 %:lla korteista aidon virheen, joten korttiotosta kasvatetaan. Listoille käytetään uutta näkökulmaa, sillä perusrajat on jo testattu kahdesti. Otanta tehtiin `sample19c.py`:llä:

- **M8r3:** 120 uutta korttia (362 tarkastamattomasta), kuusi agenttia. Ohjeissa ovat kierrosten 1–2 korjaukset ja hylkäysperusteet.
- **M10r3:** kaikki 32 listaa, neljä agenttia. Aiheina ovat reservit ja liittolaiset (osuudet, lähdelistat, päivitykset), päivitysten poissulku koko laivastossa, ehdolliset ja pisterajaan sidotut päivitykset sekä profiilin kieltämät optiot.

Ensimmäinen käynnistys katkesi tilin istuntorajaan (klo 8.40–11.10). Agentit käynnistettiin uudelleen viiden erissä ja kirjoittamaan tulosta välitallennuksin.

**Välitulokset:**

- **M10r3a** (8 listaa, 38 sääntöä): J70 (Exploration Demiurg), J71 (Clanz Gubbins), J72 ja J73 (Dominion Captain ja reservit).
- **M8r3a:** 20 / 20 PASS.
- **M8r3c:** 16 PASS; Terminus Estin Hit & Run -poikkeus (P2) ja kaksi P3-kohtaa.
- **M8r3b:** 19 PASS; Clanzin hulkilta kiellettiin Mega-Armoured Boarding Parties. Tulkintavarmistus (alla, T15 uudelleen) osoitti, että pistokokeiden 7, 12 ja 18 kiellot olivat tulkintavirheitä: J74–J76 (`fa7fa4f`).
- **M10r3b:** J77 (Grey Knights Terminators yhdelle alukselle) ja J78 (Armageddonin komentajaehdot), `fa7fa4f`.
- **M8r3c:n Terminus Est** → J80: kaikkien Mark of Nurgle -rivien teksti kertoo, että Hit & Run on yhä sallittu (Rulebook s.91).
- M8r3d–f ja M10r3c–d käynnistettiin uudelleen välitallennuksin. Tulokset:
  - **M8r3d** (20 korttia, 16 PASS): J86 Chaos-listojen boarding-torpedolause, J87 Tyranidien Hit & Run.
  - **M8r3e** (20, 19 PASS): J85 Escort Carrier -laivueen per-bay-hinta (P1).
  - **M8r3f** (20, 18 PASS): "‘bastion’"-otsikko (J46 a, korjattu) ja Nicassar Rigin otsikko "Rig" (J46 c, kirjattu).
  - **M10r3c** (16 sääntöä, 6 väitettä): J81–J84; RT-apualusväite hylätty.
  - **M10r3d** (32 skenaariota, 5 väitettä): J88, J89. Hook-kapasiteetti on v1.1:ssä, `tiers` hylätty, ja `mandatory_at`-pisteraja kysytään (T24).

Kierroksella 3 tarkastettiin 120 korttia (yhteensä 240 / 482) ja 32 listaa uudella näkökulmalla. Aitoja löydöksiä tuli 17 (J70–J72, J74–J89; J73 siirtyi v1.1:een). Agenttien väitteistä noin 30 % hylättiin kirjan perusteella.

**Tulkintavirhe ja sen korjaus (T15 uudelleen, T21).** Aiemmat kierrokset lukivat hulkkien kiellon "Hulks cannot take any upgrade that improves Boarding Value, Turning or Speed" (s.390, s.288) niin, että se koskee kaikkia boarding-etuja. Sama s.390 kuitenkin luettelee Warlordin päivitysten muutokset hulkille ja sanoo: "Mega-armoured Boarding Parties is unchanged." MABP on s.370:n mukaan "an additional +1 modifier when rolling for boarding actions" eli nopan muunnin. Boarding Value on aluksen oma arvo (Rulebook s.88–89), jota nopan muunnin ei muuta. Chaos Space Hulkin s.287 olettaa miehistön: "including the Warmaster's base leadership, having Chaos Space Marines embarked, etc." Siksi Goffs (nopan +1) ja CSM-miehistö (s.222 "a total +2 boarding modifier") kelpaavat hulkille. Nopeutta nostavat Soopa Boostas ja Evil Sunz sekä erikseen kielletyt Chaos Marks pysyvät kiellettyinä. Opetus: kun sama sivu antaa esimerkin säännön soveltamisesta, esimerkki ohjaa lukutapaa. Päättelyä "sama vaikutus kuin jo kielletyllä" ei saa käyttää, ennen kuin se kielletty on tarkistettu.

| T | Asia | Kirjan lause | Vaihtoehdot | Valinta ja peruste |
|---|---|---|---|---|
| T15 (uudelleen) | Goffs ja Mega-Armoured Boarding Parties Ork-hulkilla (J33 → J74, J75) | s.390 "Hulks cannot take any upgrade that improves Boarding Value, Turning or Speed" + "Mega-armoured Boarding Parties is unchanged" | nopan muunnin on / ei ole Boarding Value | **Ei ole.** Sama sivu sallii MABP:n hulkille, joten nopan +1 ei ole kielletty parannus. Aiempi valinta ("on") oli virhe. |
| T20 | Explorationin Demiurg-osuus (J70) | s.177 "At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet." | (a) yksi heti ja sitten yksi kolmea kohden; (b) yksi jokaista kolmea kohden (1–2 risteilijää → 0) | (a) toteutettu, koska se ei hylkää kummallakaan luennalla laillista laivastoa ("At least one" tukee sitä). Pohjana listan omat kapitaalialukset ja Siluria. **Käyttäjä 11.9.: aidosti epäselvä** → sovellus merkitsee tarkistuksen avoimeksi tulkinnaksi ja varoittaa, kun tiukka luenta ei täyty (J91). |
| T21 | Chaos Space Marine -miehistö Chaos Space Hulkilla (pistokoe 12 → J76) | s.288 "Hulks cannot take any upgrade that improves Boarding Value, Turning or Speed"; s.287 "having Chaos Space Marines embarked" | kielletty / sallittu | **Sallittu** (s.287 olettaa miehistön; +2 on nopan muunnin). Marks pysyy kiellettynä omalla lauseellaan ("It may not take any Chaos Marks"). |
| T22 | Grey Knights Battle bargen 1 000 pistettä (J83) | s.138 "including at least 1000 points of Inquisition vessels and Grey Knights strike cruisers may include a single Grey Knights battle barge" | barge lasketaan mukaan / ei lasketa | **Ei lasketa** (toteutettu): lause kuvaa laivaston, johon barge vasta lisätään. **Käyttäjä vahvisti 11.9.** |
| T23 | Rogue Traders -listan risteilijäraja (J84) | s.174 "Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof" | yksi / yksi per 750 p tai osa | **Per 750 p tai osa** (toteutettu, väljä): isäntälaivastoa ei tiedetä, ja tiukka raja hylkäisi Tau-, Demiurg- ja Imperial-isäntien laillisen toisen risteilijän. **Käyttäjä 11.9.: aidosti epäselvä** → avoin tulkinta merkitään sovelluksessa (J91). |
| T24 | `mandatory_at` ja laivaston arvo (M10r3d) | s.35 "If the fleet is worth over 750 points an Admiral must be included to lead it" | ilmoitettu pisteraja / käytetyt pisteet | Aiempi valinta oli pisteraja. **Käyttäjä 11.9.: laivaston omat pisteet** ("worth" = rakennetun laivaston arvo; muuten 700 p keskeneräinen lista 1 000 p pelissä vaatii komentajan liian aikaisin). Toteutettu `mandatory_at`:lle ja samaa sanamuotoa käyttävälle `allowed_at`:lle (J90). |
| T26 | Kiintiöt "per N points" (`per_points`), Warspheret (`tiers`) ja Tyranidien ordnance (`points_share`) | esim. s.372 "one Warlord for every 500 points, or part, that the fleet is worth", Corsairs "one battleship for every full 1,000 points it contains", s.457 "in games larger than that", s.431 "10 % of the fleet's points allowance" | pisteraja / laivaston pisteet | Nyt pisteraja. T24:n logiikalla "worth"- ja "contains"-kiintiöt olisivat laivaston pisteitä, "games larger" ja "allowance" pisterajaa. Laivaston pisteillä kiintiö kasvaa vasta laivaston kasvaessa, joten keskeneräinen lista näyttää kiellon. **Päätös 14.9.2026 (käyttäjä siirsi päätöksen): sanamuoto ratkaisee.** `per_points` ja `tiers` laivaston omista pisteistä ("is worth", "it contains", "in your fleet"), `points_share` pisterajasta ("the fleet's points allowance", s.431). |
| T27 | Rogue Traderin crew skillin hinta (J44) | s.175 "may roll one random crew skill ... for +10% point value" | pohja: runko / runko, optiot ja refitit; pyöristys: ylös / lähimpään | **Runko, optiot ja refitit ennen crew skilliä, ylöspäin** (toteutettu). "Point value" on aluksen tai laivueen arvo; Rulebook pyöristää ylöspäin (s.88, s.99). **Päätös 14.9.2026: vahvistettu nykyinen toteutus.** |
| T28 | Ketkä saavat reservejä ja mistä (1.1) | s.14 "Any fleet chosen from one of the fleet lists may also include reserves"; "must come from the same 'race'"; "Reserve fleets are those specifically described as such in their fleet lists, not merely those identified as being capable of allying with each other"; s.15 "a Gothic Sector fleet list cannot take Space Marine vessels as reserves" | kaikki listat / vain nimetyt reservilaivastot | **Päätös 14.9.: kirjan mukaan.** Isäntä mikä tahansa lista, lahjoittaja saman rodun lista, liittolaissuhde ei tee reserviä, listan oma kielto voittaa. Laajuus 94 suunnattua listaparia. |
| T29 | Inquisition rakenteena (1.1) | s.138 "The Inquisition has no fleet list on its own. Instead, there are various ways to add an Inquisitor or Inquisitorial ships to the Imperial factions." | oma lista / liite / molemmat | **Päätös 14.9.: molemmat.** Lista säilyy tallenteiden vuoksi ja saa ilmoituksen kirjan tarkoittamasta tavasta; liiteosio kahdeksalle isäntälistalle. |
| T30 | Klaani ja legioona: rivi vai ryhmän attribuutti | s.369 "A Warlord and his skwadrons may only be from one clan, but as many different clans as desired can be in a single fleet." | rivi / ryhmäattribuutti | **Päätös 14.9.: 1.1:ssä vain todistetut virheet, ryhmäattribuutti 1.2:een** yhdessä kapitaalilaivueiden (s.13) ja komentajan sijoituksen (J8) kanssa. |
| T31 | Space Hulkin Gubbins-tuplaus ja MORE GUBBINS | s.372 "Space Hulks so led can take upgrades from the list of Gubbins for double the listed cost"; s.371 "The following gubbins can be taken by any number of capital ships in the fleet" ja "(Not for escorts except the Grunt at +5 points per escort.)" | tuplaus molemmille / vain GUBBINS-listalle | **Päätös 14.9.: vain GUBBINS-listalle.** MORE GUBBINS listahintaan, ei kuluta Warlordin re-roll-budjettia, ja Klaws saa Grunt-rivin +5 per saattaja. |
| T25 | Nurglen, Khornen ja Slaaneshin ORDNANCE (J86) | s.241 päättyy "Ships with torpedo", s.245 ja 249 "can have a mixture" (sivukuvat tarkistettu) | täydennä muiden Chaos-listojen lauseella / jätä | Taitto katkaisee kappaleen kirjassa. **Käyttäjä 11.9.: täydennetään** (katkennut lause, rinnakkaiset listat ja Nurglen alkanut sanamuoto). Toteutettu listatekstiin merkinnällä ja korttisääntöön (J86). |

## Menetelmäkohtaiset muistiinpanot

- **M1.** `m1_text.py` poimi listojen tekstistä 756 normatiivista lausetta, joilla ei ole tarkistusta. Kaksi sonnet-agenttia luokitteli ne: A = listanrakennus 382, B = pelisääntö 283, C = kertomus 37, D = kampanja 54. `m1_cover.py` vertasi A-ryhmiä pistokoe 18:n verifioituun inventaarioon: 249 / 264 katettu. Loput 15 luettiin käsin. Kampanja- ja skenaariosäännöt (SM "ships earned … for free", Explorator-lahjat, Cruiser Clash) eivät koske listaa. Tyranidien refit-rajat (3/2/1, carapace, spore cysts) ja torpedorefitit on toteutettu koettimen mukaan. Clanzin Warlord-alaraja oli löydös (J38).
- **M4.** Kaksi agenttia poimi 30 satunnaissivua itsenäisesti (275 kohtaa). Pistokoe 18 kattoi 270 (98,2 %). Ohitetut viisi: "0-12 Cruisers" (on `section_count`), kolme FLEET LISTS -viitettä (T6) ja yksi kertomuslause.
- **M8.** Neljä agenttia tarkasti 40 korttia kahdeksalla kysymyksellä: 22 läpi, 18 väitettä. Jokainen väite luettiin kirjasta ennen tuomiota.
- **M10.** Kaksi agenttia testasi 80 sääntöä rajalla ja askel yli. 59 toimi. Yksittäisen saattajan ja sekalaivueen hylkäys toistui jokaisessa kahdeksassa listassa, eli se on yksi juurisyy.
- **M11.** Kaikki 15 laivueen jakoeroa selittyivät ostoilla, jotka kirjan mukaan maksetaan laivuetta tai laivastoa kohden: Clanzin tiddla-klaanit (T9), komentajan päivitykset ja Tyranidien ordnance-merkit. Jakoa tutkiessa löytyi Necronien re-roll-yhdistelmä (J41).
- **M14.** `m14_crippled.js` luki jokaisen rungon sivun ja seuraavan sivun "crippled"-lauseet (sivut dumpattu `m14_dump.py`:llä) ja vertasi niitä korttiin. Stryxis ja Warsphere olivat jo M8:ssa; uusina löytyivät Rok ja Nicassar Caravan.
- **M15.** Saattajakorttien läpikäynti: 45 saattajasta 6 näytti kriittisen osuman rivin (Eldar ×5, Dark Eldar ×1).
- **Tulokset J36–J43:** 18 uutta goldenia tai testiä punaisena ensin (HEAD-worktreessa todennettu), acceptance VAKAUTUS KESKEN, stress 4 612 tapausta / 0 löydöstä, pienin tulostusteksti 4,24 pt.

## Yhteenveto (11.9.2026)

Pistokoe 19 ajoi 16 menetelmää kolmella kierroksella (siemenet 2026091901–03). M14–M16 keksittiin kesken kokeen. Korttiotoksessa on tarkastettu 240 / 482 korttia, ja kaikki 32 listaa on käyty läpi kolmesti eri näkökulmasta.

- **Löydökset:** BACKLOGissa on 53 riviä (J36–J89; J79 yhdistyi J78:aan). Niistä 49 on valmiina. Auki ovat J44 (RT crew skill +10 %, odottaa toisen istunnon app_template-työtä), J46 (b) ja (c) (P3) sekä J86:n Nurgle-, Khorne- ja Slaanesh-osa (T25). J73 kuuluu v1.1-jonon kohtaan "listojen väliset reservit".
- **Tulkintavirheet:** kierros 3 kumosi pistokokeiden 7, 12 ja 18 hulkkitulkinnan (T15 uudelleen, T21; J74–J76). Kirjan "Boarding Value" ei tarkoita boarding-nopan muunninta.
- **Agenttien väitteet:** kierroksella 1 noin 40 % ja kierroksella 3 noin 30 % hylättiin kirjan perusteella. Jokainen väite luettiin kirjasta ennen tuomiota.
- **Laatu:** jokainen korjaus sai goldenin tai testin, joka epäonnistui ennen korjausta. `acceptance.py` = VAKAUTUS KESKEN (ainoa auki `share_zip_current` = käyttäjän askel). Goldeneja on 346, stress-ajossa 4 612 tapausta ilman löydöksiä, ja pienin tulostusteksti on 4,24 pt.
- **Kierroksen 3 commitit:** `d86a3b1`, `fa7fa4f`, `f225810`, `82be3db`, `c52ffc4`.
- **Käyttäjän päätökset 11.9.:** T22 oikein; T24 laivaston omat pisteet (J90); T25 täydennetään (J86); T20 ja T23 ovat aidosti epäselviä, joten sovellus merkitsee ne avoimiksi tulkinnoiksi (J91); v1.1-puutteet näkyvät laivaston tarkistuksissa (J92). J44 korjataan ennen 1.0:aa. Uusi kysymys: T26 (kiintiöt ja pisteraja).
