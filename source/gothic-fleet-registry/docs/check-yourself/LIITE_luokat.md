# Liite: kaikki Check yourself -lauseet luokittain

Generoitu luokituksista (`luokitus_NN.jsonl`) skriptillä; älä muokkaa käsin. Lauseen teksti on lyhennetty 140 merkkiin; koko teksti on `luokitus_kaikki.json`:ssa.

## OMINAISUUS: Valvottavissa, ei vielä valvottu (ominaisuusehdokkaat) (72 uniikkia, 100 esiintymää)

### aboard (25)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0141 | F97 | SM/Codex Astartes | If your fleet includes any battle barges, he must be assigned to a battle barge in preference to a strike cruiser. | Codex: Master of the Fleet battle bargelle ennen strike cruiseria, jos bargeja on. Vaatii 'embarked aboard' -merkinnän (J8 rajasi sidonnan). |
| S0145 | F98 | SM/Crusade, SM/Dominion | If your fleet includes any battle barges, he must be assigned to a battle barge. | Crusade ja Dominion: MoF pakko battle bargelle, jos bargeja on. 'Embarked aboard' -merkintä. |
| S0158 | F100 | SM/Dominion | If a Venerable battle barge is included in the fleet, the Master of the Fleet must be assigned to it. | Dominion: MoF pakko Venerable battle bargelle, jos se on mukana. |
| S0253 | F121 | AdMech/Explorator | An Adeptus Mechanicus fleet commander can only be embarked on a Mechanicus ship. | AdMech-komentaja vain Mechanicus-alukselle. Merkitsevä vain, kun laivastossa on lainattuja aluksia. |
| S0268 | F124 | AdMech/Explorator | An Archmagos Veneratus must be embarked on an Ark Mechanicus if one is included in the fleet. | Archmagos Veneratus Ark Mechanicukselle (Omnissiah's Victory, s.126), jos se on mukana. |
| S0286 | F138 | The Emperor's Inquisition | They must be aboard an Inquisitorial Cruiser if one is included, otherwise they must be on an Inquisition Blackship if one is included. | Inquisitor Lord Inquisitorial Cruiserille, muuten Blackshipille. |
| S0324 | F144 | Grey Knights | If an Inquisitorial Cruiser is present the Inquisitor Lord must be placed aboard it. | Inquisitor Lord Inquisitorial Cruiserille. SRC-osuma on harhaanjohtava: section_count-säännön src sisältää lauseen, mutta sääntö valvoo vain määrää. |
| S0325 | F144 | Grey Knights | If the Inquisitorial Cruiser is not present but a Blackship is then the Inquisitor Lord must be placed aboard the Blackship. | Muuten Blackshipille. |
| S0326 | F144 | Grey Knights | Otherwise the Inquisitor must be placed on the most expensive ship. | Muuten kalleimmalle alukselle; sovellus voisi laskea kalleimman ja nimetä sen kortilla. |
| S0394 | F178 | RT/Pirates and Wolf Packs | He (or she!) must be placed aboard the most expensive vessel in the fleet (or vessels if more than one Captain is present). | Pirate Captain kalleimmalle alukselle (useampi kapteeni = useampi kallein). Sovellus voisi nimetä aluksen. |
| S0473 | F231 | 6 listaa | You may not place a Chaos Lord on the same ship as Abaddon (you don’t get to be a Chaos Lord by spending lots of time near a bloody-tempe... | Chaos Lord ei samalla aluksella kuin Abaddon. Vaatii komentajien sijoituksen. |
| S0477 | F232 | Chaos/Incursion | He must be assigned to the biggest (ie, most expensive) ship and improves its Leadership to the value shown below. | Warmaster kalleimmalle alukselle. Sovellus voisi nimetä aluksen. |
| S0491 | F234 | Chaos/Black Crusade | He must be assigned to the most expensive ship and improves its rolled Leadership by +2, to a maximum of 9. | Warmaster kalleimmalle alukselle; Ld +2 (max 9) komentajakortilla. |
| S0495 | F234 | Chaos/Black Crusade | Any capital ship, apart from that of the Warmaster, may be captained by a Chaos Lord. | Lord ei Warmasterin alukselle. |
| S0504 | F235 | 5 listaa | If Abaddon is present, he must be aboard the Planet Killer. | Abaddon Planet Killerille, jos se on mukana. Varmista, onko build_data.py:5731 vain korttiteksti. Ajo 20.10.: Abaddon + Planet Killer -laivastossa ei sijoitustarkistusta. **[aukko ajossa]** |
| S0507 | F235 | Chaos/Black Crusade | A Daemon ship may not be commanded by a Warmaster or a Chaos Lord even if it is the largest ship in the fleet. | Daemonshipillä ei Warmasteria eikä Lordia. |
| S0513 | F236 | 4 listaa | He must be assigned to the most expensive ship and improves its rolled Leadership by +2, to a maximum of 10. | Jumalan Warmaster kalleimmalle alukselle; Ld +2 (max 10). |
| S0515 | F236 | 4 listaa | Any capital ship apart from that of the Warmaster may be captained by a Chaos Lord. | Lord ei Warmasterin alukselle. |
| S0526 | F237 | 4 listaa | A Daemonship may not be commanded by a Warmaster or a Chaos Lord, even if it is the largest ship in the fleet. | Daemonshipillä ei Warmasteria eikä Lordia (Strand of Fortune -rivin noup daemonship kattaa vain yhden seurauksen). |
| S0530 | F231 | 4 listaa | You may not place a Chaos Lord on the same ship as Abaddon. | Lord ei Abaddonin alukselle (jumalalistoilla Abaddon-osiossa). |
| S0625 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | If the Flame of Asuryan is taken, the Eldar Hero must be embarked aboard it. | Eldar Hero Flame of Asuryanille. L.aboard kattaa vain Prince Yrielin (domain.js:4516); Iyandenissa ehto on requires-säännössä, Corsair-listoilla ei. |
| S0631 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | When Yriel is taken he must be placed on a Craftworld Eldar Dragonship with launch bays, but you may instead pick the Flame of Asuryan as... | Yriel Dragonshipille, jossa on launch bayt, tai Flame of Asuryanille. Flame-puoli on L.aboard-säännössä; Dragonship-vaatimus ei. **[koodi luettu]** |
| S0822 | F372 | Orks/Da Ork Clanz | He must be embarked on the most expensive ship under his own command (as opposed to the whole fleet), even if it is an escort - annotate ... | Warlord kalleimmalle omien laivueidensa alukselle ('annotate which one'). Sovelluksen alusmuistiinpano kelpaa nyt; merkintä voisi tehdä sen. |
| S0829 | F372 | Orks/Da Ork Clanz | One of your Warlords must be embarked on it, which by itself counts as all the skwadrons that Warlord can have (including a tiddla skwadr... | Warlord hulkille; hulkki = kaikki Warlordin laivueet. Clanzissa on conditional_cap (kolme Warlordia), sijoitusta ei. |
| S1094 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | KOR’O VASH’YA Y’ELDI MESME: 110 PTS Kor’O’Mesme is embarked aboard the Kor’or’vesh vessel Bor’kan Or’es El’Leath Se’arle O’Mesme (Custodi... | Kor'O Mesme on aina oman Custodianinsa kyydissä. Custodian vaatii Kor'On (build_data.py:1586), mutta Mesme ilman Custodiania ei ole kielletty. Varmista. Ajo 20.10.: Mesme ilman Custodiania menee läpi. **[aukko ajossa]** (poimintavika: heading) |

### squadron_group (10)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0362 | F175 | RT | Auxiliary vessels in a Rogue Trader escort squadron can only use these refits if they are in a squadron that includes at least three Rogu... | Apualus RT-laivueessa saa Xenotechin vain, jos laivueessa on vähintään kolme RT-saattajaa. Vaatii sekalaivueen (apualus + RT-saattajat) ryhmänä. |
| S0409 | F179 | RT/Pirates and Wolf Packs | The only exception to this is Rogue Trader Xenos Vessels, which represent minor alien races seeking to expand their influence or pursue s... | Poikkeus: RT Xenos Vessels saavat liittyä muiden laivueisiin. Sekalaivue vaatii laivueen ryhmänä. |
| S0410 | F179 | RT/Pirates and Wolf Packs | They may freely ally themselves with any other race and join with them in pirate raider squadrons. | Edellisen jatko. |
| S0824 | F372 | Orks/Da Ork Clanz | For every re-roll a Warlord has (including the first one for free), the Warlord must be in command of one tiddla skwadron of at least thr... | Jokaista Warlordin re-rollia kohden tiddla-laivue (≥3) ja yksi muu laivue. Vaatii Warlord → laivueet -ryhmittelyn. |
| S0826 | F372 | Orks/Da Ork Clanz | 1-2 Kroozers, chosen from the following list: | Big ship skwadron 1–2 kroozeria. Capital-laivueita ei mallinneta. Luettelon otsikko kaksoispisteineen. (poimintavika: split) |
| S0828 | F373 | Orks/Da Ork Clanz | There is no restriction for what kinds or how many of what type of skwadrons are in the fleet as long as no Warlord may have more than on... | Alkuosa toteutuu rakenteesta (ei osiolaskureita, build_data.py:1729); 'enintään yksi 'Uge ship per Warlord' vaatii ryhmittelyn. Laivastotason 'Uge-suhde on valvottu (ratio USING SKWADRONS). |
| S0839 | F373 | Orks/Da Ork Clanz | A Warlord must have two kroozers in order to take a “Uge ship, meaning the Warlord must have at least one extra re-roll to do so. | 'Uge ship vaatii Warlordilta kaksi kroozeria. |
| S0840 | F373 | Orks/Da Ork Clanz | A Warlord leading a Space Hulk may only lead it and no other ships, but he is not required to take any extra re-rolls to do so if it is n... | Hulkkia johtava Warlord ei johda muita aluksia. |
| S0891 | F369 | Orks/Da Ork Clanz | A Warlord and his skwadrons may only be from one clan, but as many different clans as desired can be in a single fleet. | Warlordin laivueet samaa klaania. ROADMAP 1.2: klaani ryhmätasona. |
| S0897 | F369 | Orks/Da Ork Clanz | If taken, every capital ship in the skwadron must separately take and pay for the clan upgrade, not just individual ships. | Kroozer-laivueen jokainen alus ostaa klaanin erikseen. Kroozerit ovat sovelluksessa erillisiä yksiköitä, joten pakkoa ei valvota. |

### lend_route (9)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0089 | F49 | IN/Bakka Sector | In a Bakka fleet list, cruisers from the Adeptus Mechanicus fleet list may be taken instead of and in the same manner as Imperial Navy ba... | AdMech-risteilijät Bakan battlecruiser-paikoille (lasketaan battlecruisereiksi). Koodista ei löytynyt tätä reittiä. |
| S0090 | F49 | IN/Bakka Sector | They utilize all rules for Adeptus Mechanicus vessels except as follows: they do not count as reserves, they will not disengage when crip... | Edellisen reitin säännöt: ei reservejä (ei 1:3-kiintiötä), ei disengagea crippled-tilassa, saa käyttää komentajan re-rolleja. Osa pelin aikaista (kortille). |
| S0091 | F49 | IN/Bakka Sector | However, the fleet may not be led by nor take an Archmagos when used this way. | Archmagos-kielto, kun AdMech-risteilijät otetaan battlecruisereina. |
| S0102 | F50 | IN/Bakka Sector | When used with Battlefleet Bakka, Adeptus Mechanicus capital ships may take the Fleet Defence Turrets refit instead of rolling randomly o... | Bakkaan tuotu AdMech-runkoalus saa Fleet Defence Turrets -refitin Gifts-heiton sijaan. Varmista, tarjotaanko refit lainatulle AdMech-rungolle. Ajo 20.10.: Bakkaan lainatulle AdMech-alukselle ei tarjota Fleet Defence Turret -refitiä. **[aukko ajossa]** |
| S0349 | F174 | RT | If a second Rogue Trader cruiser is taken, it may be any Rogue Trader cruiser variant listed on the Exploration Fleet List. | Toinen RT-risteilijä saa olla Exploration-listan variantti. build_data.py:5664 rajasi tämän erikseen tehtäväksi. |
| S0653 | F319 | Eldar/Iyanden Craftworld | Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at least three Corsair Eldar cruisers a... | Void Stalker Iyandeniin: vähintään 1 000 pistettä ja kolme Corsair-risteilijää. Rivi on vain Corsairs Later -listalla; ehtoa ei ole koodissa. |
| S0909 | F369 | Orks/Da Ork Clanz | A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos escorts from any fleet list at the... | Blood Axe -tiddla (vähintään 6) saa ottaa enintään kolme IN- tai Chaos-saattajaa listahintaan. Vain rivin kuvauksessa; ei lainausreittiä eikä laskentaa. |
| S1143 | F483 | Demiurg/War Host | Any fleet except Orks, Tyranids and Necrons can use Demiurg Bastion class vessels; they are purchased as cruisers but do not contribute t... | Demiurg Bastion mihin tahansa laivastoon paitsi Orks, Tyranids, Necrons; ostetaan risteilijänä, mutta ei kasvata battleship- ja GC-oikeuksia. Yleinen palkkasoturireitti; koodista ei löytynyt. Ajo 20.10.: Gothic-, Incursion- ja Corsair-listoilla ei Demiurg-rivejä. **[aukko ajossa]** |
| S1144 | F483 | Demiurg/War Host | Demiurg ships can never carry fleet commanders, use fleet commander re-rolls or be placed in squadrons with non-Demiurg vessels. | Palkkasoturi-Demiurg: ei komentajaa kyytiin, ei komentajan re-rolleja, ei sekalaivueita. Kuuluu edellisen reitin sääntöihin ja kortille. |

### reserve_special (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0246 | F121 | AdMech/Explorator | No more than one reserve vessel can be taken for every three capital ships in the fleet. | AdMechin oma yläraja: enintään yksi reservi kolmea capital shipiä kohden (koko laivasto), tiukempi kuin yleinen tyypeittäinen 1:3. Varmista, valvooko 1.1-moottori tätä. Ajo 20.10.: moottori soveltaa yleistä tyyppikohtaista 1:3:ta; AdMechin oma 'yksi kolmea capital shipiä kohden' eroaa vain reunatapauksissa (esim. 2 cruiseria + 1 battleship). **[osittain]** |
| S0249 | F121 | AdMech/Explorator | Space Marines can also be used as reserves in a Mechanicus fleet that does not include regular Imperial Navy capital ships or alien vesse... | SM-reservit AdMech-laivastoon vain, jos laivastossa ei ole tavallisia IN-capital shipejä eikä xenos-aluksia. Koodista ei löytynyt. Ajo 20.10.: AdMech + kolme Gothicia + SM-strike cruiser ilman IN-capitalia -> 'Reserve needs an Inquisitor Lord'. Sovellus hylkää kirjan s.121 sallimat SM-reservit (väärä punainen). **[VIRHE ajossa]** |
| S0250 | F121 | AdMech/Explorator | They can be taken in the ratio of one strike cruiser for every three Mechanicus capital ships, and one battle barge for every three strik... | SM-reservien suhteet: strike cruiser per 3 Mechanicus capital shipiä, battle barge per 3 strike cruiseria. SM-reservit AdMechissa kaatuvat aina inkvisiittorivaatimukseen (ks. S0249), joten suhteita ei voi edes kokeilla. **[aukko ajossa]** |
| S0255 | F122 | AdMech/Explorator | There are no restrictions on how many reserve Imperial Navy, Space Marine or Rogue Trader escorts are included in an Adeptus Mechanicus f... | Reservisaattajat ilman 1:3-rajaa, kun xenos-aluksia ja SM-reservejä ei ole samassa laivastossa. 1.1-moottori laskee saattajillekin 1:3:n; tarkista. Ajo 20.10.: AdMech + 1 capital + 4 IN-saattajaa -> 'Reserves (escorts) 4 / 0' punaisena, vaikka s.122 sanoo 'no restrictions' (väärä punainen). **[VIRHE ajossa]** |
| S0256 | F122 | AdMech/Explorator | Escorts taken in this manner must be taken from the same fleet list reserve capital ships are being drawn from. | Reservisaattajat samalta listalta kuin reservi-capital shipit. Ajo 20.10.: reservisaattajan listaa ei verrata reservi-capital shipin listaan. **[aukko ajossa]** |

### mandatory_choice (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1041 | F429 | Tyranids/Vanguard Fleet | A Vanguard drone ship must be armed with one weapon chosen from the following list: | Drone shipin on pakko valita yksi ase. Poissulku on ryhmänä, pakko ei (referenssi 28 #227); domain.js:n need1-malli (Waystation) sopisi. (poimintavika: split) |
| S1043 | F429 | Tyranids/Vanguard Fleet | A Kraken must be armed with one weapon chosen from the following list: | Krakenin pakollinen asevalinta. (poimintavika: split) |
| S1058 | F430 | Tyranids/Hive Fleet | A hive ship must be armed with weapons chosen from the following list: | Hive shipin on pakko valita aseet; tarkista, valvotaanko yhtään asepaikkaa. (poimintavika: split) |
| S1059 | F430 | Tyranids/Hive Fleet | A Tyranid cruiser must be armed with weapons chosen from the following list: | Risteilijän asevalinta. (poimintavika: split) |

### auxiliary (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0373 | F177 | RT/Exploration | Besides Xenos vessels, auxiliary vessels from only one race can be taken in a fleet. | Apualukset vain yhdeltä rodulta. Sovellus tarjoaa 'Auxiliary vessels' -rivin ilman valintaa (referenssi 11 #97); apualukset toisilta listoilta puuttuvat. Ajo 20.10.: Exploration-listalla ei ole yhtään apualusriviä (Auxiliary vessels -rivit poistettiin, build_data.py:2632). **[aukko ajossa]** |
| S0374 | F177 | RT/Exploration | Any race can be used to provide auxiliary vessels except Orks, Dark Eldar, Necrons and Tyranids. | Apualusten rotukielto (Orks, Dark Eldar, Necrons, Tyranids). |
| S0375 | F177 | RT/Exploration | Xenos vessels cannot be employed if Space Marine escorts are used as auxiliary vessels. | Ei xenos-aluksia, jos SM-saattajia on apualuksina. |

### allies (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0380 | F177 | RT/Exploration | Capital ships taken count against the cruiser limit, they can only be from one fleet and cannot be from a fleet list differing from that ... | Lainatut capital shipit laskevat risteilijärajaan, vain yhdeltä listalta ja samalta kuin apualukset. Ajo 20.10.: kaksi liittolaista eri listoilta (IN ja Chaos) menee läpi. **[aukko ajossa]** |
| S0381 | F177 | RT/Exploration | If the fleet is large enough that three reserve or allied capital ships are taken, a single (0-1) allied battleship may also accompany th... | 0-1 liittolais-battleship, kun kolme lainattua capital shipiä on otettu; ei laske risteilijärajaan. Ajo 20.10.: liittolais-battleship ilman kolmea liittolaista on punainen (Allied vessels (battleships) 1 / 0); laillista polkua kolmen liittolaisen kanssa ei ajettu. **[osittain]** |
| S0382 | F177 | RT/Exploration | Reserves and Allied vessels do not have access to the Veteran Rogue Trader re-rolls, but allied vessels may purchase up to one special ch... | Liittolainen saa ostaa yhden oman listansa erikoishahmon (1.1 kieltää erikoishahmot reservilistoilta; tämä on liittolaisten poikkeus). Re-roll-osuus on pelin aikaista. Ajo 20.10.: liittolaisen Admiral hylätään ('Not a reserve type'), vaikka s.177 sallii liittolaiselle yhden erikoishahmon. **[aukko ajossa]** |

### hull_choice (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0281 | F138 | The Emperor's Inquisition | This may include the specific ship so-called in the Inquisition rules, but it can be any Imperial cruiser-class vessel. | Inquisitorial cruiser voi olla mikä tahansa Imperial cruiser-luokan alus ('it can be any Imperial cruiser-class vessel'). Runkovalinta kuten Venerable battle bargella. |
| S0354 | F174 | RT | Any cruiser hull allowed in the Rogue Trader, Exploration or Wolf Pack fleet list may be used and counts fully as a Rogue Trader cruiser. | RT-risteilijäksi kelpaa mikä tahansa RT-, Exploration- tai Wolf Pack -listan risteilijärunko. Runkovalinta kuten VBB:llä. Ajo 20.10.: RT-risteilijällä ei ole runkovalintaa (vrt. VBB setHull). **[aukko ajossa]** |

### rt_escorts (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0298 | F139 | The Emperor's Inquisition | If taken, a Rogue Trader escort squadron may accompany it, but Xenos vessels may not be used. | RT-risteilijän mukana saa tulla RT-saattajalaivue ilman xenos-aluksia. Isäntälistojen ROGUE TRADERS -osiossa on vain risteilijärivi (build_data.py:5700); 'attendant escorts' puuttuvat. Ajo 20.10.: Gothic-listan ROGUE TRADERS -osiossa on vain Rogue Trader Cruiser. **[aukko ajossa]** |
| S0308 | F140 | The Emperor's Inquisition | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels has no additional restrictio... | Muuten ei lisärajoituksia; RT-risteilijä ja sen 'attendant escorts' saavat tulla. Saattajat puuttuvat isäntälistojen RT-osiosta (vrt. S0298). Sama kuin S0298. **[aukko ajossa]** |

### ally_ban (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0384 | F177 | RT/Exploration | Demiurg vessels may not be employed if Space Marines are taken as reserves, allies or escort squadron auxiliary vessels. | Ei Demiurgia, jos SM-aluksia on reserveinä, liittolaisina tai apualuksina. Ajo 20.10.: Exploration + SM-liittolainen + Demiurg menee läpi. **[aukko ajossa]** |
| S0386 | F177 | RT/Exploration | A Kroot Warsphere may not be employed if Space Marines are taken as reserves, allies or escort squadron auxiliary vessels. | Ei Warsphereä, jos SM-aluksia on mukana. |

### list_variant (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0058 | F39 | IN/Bastion Fleets | If you wish, you may use a Battlefleet Obscura Reserve Fleet, picked using the fleet list on pg 34. | Battlefleet Obscura Reserve Fleet = Gothic-lista (s.34), jossa Strange happenings koskee kaikkia aluksia. Sovelluksessa ei ole tätä listavarianttia; J153 rajasi Strange happeningsin reservinä otettuihin Chaos-runkoihin. |

### lend_upgrade_ban (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0106 | F50 | IN/Bakka Sector | Reserve vessels may not be given this upgrade, but any vessels from the Battlefleet Bakka fleet list used as reserves in other fleets may... | Bakan +1 turret -refit tarjotaan Bakkaan lainatulle alukselle (Gothic-listan Lunar, ajo 20.10.), vaikka s.50 sanoo 'Reserve vessels may not be given this upgrade'. Toinen puoli toimii: Bakka-alus muualla reservinä saa refitin. **[VIRHE ajossa]** |

### ratio_missing (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0345 | F174 | RT | A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet. | Base RT -listalla yksi RT-risteilijä ja kaksi Veteran RT:tä menee läpi (ajo 20.10.): osion section_count antaa katon 2, mutta 'yksi per RT-risteilijä' -suhdetta ei ole. Exploration-listalla vastaava ratio on (build_data.py:1650). **[aukko ajossa]** |

### missing_row (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0512 | F235 | Chaos/Black Crusade | A ship with a Chaos Space Marine crew may be equipped with Thunderhawk Gunships but if so it may only carry Thunderhawks and may not laun... | CSM-miehistön Thunderhawk-vaihto (s.235, 237, 242, 246) puuttuu: yhdelläkään Chaos-listalla ei ole Thunderhawk-riviä (ajo 20.10.). Aiempi koodiviite upgrades.py:391 oli eri rivi. **[aukko ajossa]** |

### flagship_exception (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0641 | F318 | Eldar/Iyanden Craftworld | If your fleet is led by an Autarch, you may include a single Dragonship as his flagship which does not count against this limitation. | Autarchin lippulaivaksi yksi Dragonship, joka ei laske Dragonship-rajaan. Osion ratio-sääntö ei tunne poikkeusta; vaatii lippulaivamerkinnän. |

### hook_parent (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1106 | F454 | Tau/Commerce Protection, Tau/Merchant Fleet | Any ship equipped with Wardens can only be equipped with Wardens and may not have other hook-transported escorts. | Wardenit vain omaan emoalukseen, ei muita hook-saattajia samaan. Vaatii saattajan ja emoaluksen sidoksen. |

### hook_capacity (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1168 | F487 | Demiurg/War Host | Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks. | War Hostin hook-kapasiteetti on yhä notice-varoituksena ('not checked by the app'), vaikka Tau-listoille J95 toteutti hook_capacityn. Sama sääntölaji voisi kattaa War Hostin. |

## LASKETTAVA: Sovellus voisi laskea ja näyttää (17 uniikkia, 23 esiintymää)

### attack_rating (15)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0001 | F32 | 4 listaa | SPECIAL RULES ATTACK RATING The Imperial Navy have a starting attack or initiative rating of 2. | Faktion vakio attack rating 2. Ei laillisuutta; näytä rosterin yhteenvedossa ja Play-sivulla. |
| S0153 | F99 | SM/Crusade | A Space Marine Crusade Fleet has an attack rating of 3. | Crusade 3. |
| S0154 | F99 | SM/Crusade | If the fleet includes a fortress- monastery, it has an attack rating of 1; even Space Marines find it difficult to launch a surprise blit... | Crusade 1, jos fortress-monastery on mukana: laskettavissa rosterista. |
| S0164 | F101 | SM/Dominion | A Space Marine Dominion Fleet has an attack rating of 3. | Dominion 3. |
| S0165 | F101 | SM/Dominion | This is reduced to 2 if the fleet has any Imperial Navy, Mechanicus or Rogue Trader vessels at all. | Dominion 2, jos mukana on IN-, Mechanicus- tai RT-aluksia. |
| S0187 | F118 | AdMech/Explorator | ATTACK RATING The Adeptus Mechanicus have a starting attack or initiative rating of 2. | AdMech 2. (poimintavika: heading) |
| S0287 | F139 | The Emperor's Inquisition | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor Lord has an attack rating of 2. | Inquisitor Lordin johtama IN tai AdMech = 2. |
| S0288 | F139 | The Emperor's Inquisition | A Space Marine fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is accompanying the fleet, in which case its ... | SM 3, Blackshipin kanssa 2. |
| S0341 | F145 | Grey Knights | A Grey Knights fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is accompanying the fleet, in which case its ... | GK 3, Blackshipin kanssa 2. |
| S0366 | F176 | RT/Exploration | When used with this fleet list, Rogue Traders have an attack (initiative) rating of 3. | Exploration 3. |
| S0390 | F178 | RT/Pirates and Wolf Packs | Pirate fleets have an attack or initiative rating of 3. | Pirates 3. |
| S0633 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | A fleet led by him has an attack rating of 4, even if it includes Craftworld vessels. | Yrielin johtama laivasto 4, myös Craftworld-alusten kanssa. |
| S0913 | F400 (osittain) | Necrons/Harvest Fleet | NECRONS SHOWCASE SPECIAL RULES ATTACK RATING Necrons have a starting attack or initiative rating of 4. | Necrons 4; kolme otsikkoa liimattuna. (poimintavika: heading) |
| S1069 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | ATTACK RATING Tau have a starting attack or initiative rating of 2. | Tau 2. (poimintavika: heading) |
| S1156 | F486 | Demiurg/War Host | The Demiurg fleet has an Attack or Initiative rating of 2. | Demiurg 2. |

### opponent_bonus (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0340 | F145 (osittain) | Grey Knights | An enemy Chaos fleet may add one Mark of Chaos; or upgrade a cruiser to a Daemonship; for no aditional cost, for each of the following in... | Vastustajan Chaos saa Markin tai Daemonshipin jokaista Ordo Malleus Inquisitor Lordia ja GK Strike Cruiseria kohden. Luettelomerkit katkesivat pois; määrä laskettavissa rosterista. (poimintavika: split) |

### victory_points (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1163 | F486 | Demiurg/War Host | Though their point cost remains unchanged, Strongholds are worth 400 points, Bastions are worth 300 points and Citadels are worth 200 poi... | Strongholdin, Bastionin ja Citadelin VP-arvo 400/300/200 eroaa hinnasta; rosteriin ja korttiin. |

## TARKISTA: Aito Check yourself (jää pelaajalle) (15 uniikkia, 35 esiintymää)

### squadron_tabletop (8)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0051 | F38 | IN/Bastion Fleets | Ships assigned a Veteran Captain must be squadroned on the tabletop (their skills are too precious to waste on lone ships). | Veteran Captainin alus on oltava laivueessa; laivueet muodostetaan pöydällä. |
| S0421 | F227 | 6 listaa | Daemonships cannot be used in squadrons. | Daemonship ei laivueessa. Capital-laivueita ei mallinneta, joten pelaaja tarkistaa; laivue ryhmänä -ominaisuus voisi valvoa. |
| S0816 | F367 | Orks/Waaagh! | Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other vessels. | Rok-laivueet enintään neljä, ei muiden kanssa. Capital-laivueita ei mallinneta; laivue ryhmänä -ominaisuus voisi valvoa. |
| S1111 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | If the parent ships are squadroned together, their Orcas may be likewise. | Orca-laivueet emoalusten mukaan pöydällä. |
| S1112 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | However, the normal squadron limit of six still applies, so you may find it necessary to have more than one Orca squadron associated with... | Laivuekatto kuusi. |
| S1113 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Orcas may be squadroned with other Orcas from vessels squadroned with their parent vessels. | Orca-laivueet. |
| S1120 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | If the parent ships are squadroned together, their Dhows may be likewise. | Dhow-laivueet. |
| S1121 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | However, the normal squadron limit of six still applies, so you may find it necessary to have more than one Dhow squadron associated with... | Laivuekatto kuusi. |

### modelling (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0243 | F121 | AdMech/Explorator | Escorts must be painted to match the Mechanicus fleet to be of the Adeptus Mechanicus; you cannot take Imperial Navy or Space Marine vess... | Maalaussääntö (Mechanicus-värit); pelaajien välinen. |
| S0893 | F369 | Orks/Da Ork Clanz | In case players have any smart ideas about showing all the colours on their Ork ships for maximum flexibility, a skwadron only counts as ... | Klaanivärien tulkinta pelaajien välillä. |
| S0910 | F369 | Orks/Da Ork Clanz | These commandeered vessels must have an Orky colour scheme and kustom-job – you can’t just borrow the ships from your Imperial or Chaos f... | Orkkiväritys lainasaattajille. |

### opponent_bonus (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0035 | F142 | 6 listaa | The enemy Chaos fleet may add one Mark of Chaos or upgrade a cruiser to a Daemonship at no cost. | Vastustajan Chaos-laivasto saa ilmaisen Markin tai Daemonshipin. Builder ei tunne vastustajaa; voisi näkyä rosterin yhteenvedossa muistutuksena. |
| S0311 | F141 | The Emperor's Inquisition | The enemy Xenos fleet adds D6×50 points of escort vessels to its fleet for free. | Vastustajan xenos-laivasto saa D6×50 pistettä saattajia ilmaiseksi. Rosterin muistutukseksi. |

### agreement (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0352 | F174 | RT, RT/Exploration, RT/Pirates and Wolf Packs | Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more commonly seen outside of the Imperial Navy... | Pelaajien sopimus ennen peliä; rivit omassa osiossaan. Aito Check yourself. |
| S1004 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | These refits can only be used in one-off games if both players agree. | Bio-enhancements yksittäispelissä vain sopimuksella. Aito Check yourself. |

## VALVOTTU: Jo valvottu, mutta näkyy Check yourself -ryhmässä (192 uniikkia, 377 esiintymää)

### row_cond (42)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0003 | F32 | 4 listaa | POWER RAM The Imperial Power Ram may be taken by any Imperial capital ship with a 6+ prow for +5 points unless it has a Nova Cannon. | Power Ram -rivin kelpoisuusehto (capital, 6+ prow, ei Nova Cannonia) on toteutettu upgrades.py:583-598; lause on samalla rivin kuvaus. **[ajo ok]** |
| S0104 | F50 | IN/Bakka Sector | Any capital ship of Battlefleet Bakka can add this upgrade. | +1 turret -rivin ehto cap=1 (upgrades.py:482). |
| S0190 | F118 | AdMech/Explorator | POWER RAM The Imperial Power Ram may be taken by any Mechanicus capital ship with a 6+ prow for +5 points unless it has a Nova Cannon. | Power Ram -rivin ehto (upgrades.py:586). (poimintavika: heading) |
| S0230 | F121 | AdMech/Explorator | All Adeptus Mechanicus cruisers (not light cruisers) with armour 6+ prows can replace their prow torpedoes with a Nova Cannon for +20 poi... | Nova Cannon instead of prow torpedoes, ehto cruiser + 6+ prow + prow torpedo, noopt ja noup Power Ram (upgrades.py:601). |
| S0231 | F121 | AdMech/Explorator | A Mechanicus Retribution battleship can make this trade for +10 points. | Retributionin rivi (upgrades.py:609). |
| S0232 | F121 | AdMech/Explorator | Adeptus Mechanicus cruisers that would normally be equipped with 30 cm Weapon Batteries can incorporate plasma-boosted batteries that inc... | Plasma-boosted batteries, ehto 30 cm patteri (upgrades.py:617). |
| S0234 | F121 | AdMech/Explorator | Adeptus Mechanicus Endeavour and Endurance light cruisers may replace their prow torpedoes with a single 30 cm range dorsal lance battery... | Dorsal lance instead of prow torpedoes (upgrades.py:629). |
| S0240 | F121 | AdMech/Explorator | Unlike their capital ships, Mechanicus escorts do not have the +1 turret as part of their point cost and do not get this refit automatica... | Pakollinen turret-refit vain capital (cond cap=1); saattajille oma maksullinen rivi (upgrades.py:622). |
| S0241 | F121 | AdMech/Explorator | They however may each purchase +1 turret for +5 points. | '+1 turret (escort squadron)' per hull, cond esc (upgrades.py:622). |
| S0276 | F125 | AdMech/Explorator | They may not use assault boats, even if their Imperial Navy counterparts may have access to this type of ordnance (such as Emperor battle... | Emperorin ja Oberonin Shark-optio suljettu AdMech-listalla (build_data.py:3626). |
| S0334 | F145 | Grey Knights | The vessel embarking the Inquisitor Lord or one Grey Knights vessel may take Grey Knight Terminators. | Terminators-rivin ehto (upgrades.py:97) – varmista raja 'one Grey Knights vessel'. **[ajo ok]** |
| S0335 | F145 | Grey Knights | Any Grey Knights capital ship in the fleet may embark an Honour Guard for +10 points. | Honour Guard GK capital shipille (ROW_CONDS). **[ajo ok]** |
| S0347 | F174 | RT, RT/Exploration, RT/Pirates and Wolf Packs | The Imperial Power Ram may be taken by any Rogue Trader capital ship with a 6+ prow for +5 points unless it has a Nova Cannon. | Power Ram (upgrades.py:490). |
| S0368 | F176 | RT/Exploration | The Xenotech Systems refits listed on [???] can only be used by Rogue Trader cruisers and escorts, not by other reserves or allied vessel... | Xenotech vain RT-risteilijöille ja -saattajille (_XENO_NOT, upgrades.py:330, J36). |
| S0418 | F227 | 6 listaa | A Daemon ship may not have a Chaos Space Marine crew. | noup chaos space marine crew (upgrades.py:1280). |
| S0422 | F227 | 6 listaa | Any Daemon ship may have a single Mark of Chaos with the same effects and cost in points as described on pg 232. | Black Crusadessa Mark-rivit ehdolla 'Daemonship otettu', grp mark (build_data.py:2637). Varmista muut viisi Chaos-listaa. Ajo 20.10.: Black Crusadessa ja neljällä jumalalistalla Daemonship-Markit ovat riveinä. Incursion-listalla ei ole Daemonship-rivejä lainkaan, joten yleisen Chaos-luvun Daemonship-lauseet (S0413–S0447) ovat sille turhia. **[ajo ok]** |
| S0502 | F234 | Chaos/Black Crusade | Remember, a ship with a Chaos Space Marine crew may have a Mark of Chaos, even if a Warmaster or Lord does not captain it, but is subject... | CSM-miehistön aluksen Mark (build_data.py:2655). Varmista Black Crusaden rivi ja s.225:n rajaus. **[ajo ok]** |
| S0503 | F234 | 5 listaa | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | Chosen Terminators: ehto battleship/GC + CSM-miehistö (upgrades.py:375). Warmasterin tai Lordin CSM-alus ilman miehistöriviä jää ehdon ulkopuolelle (sidosta ei mallinneta). |
| S0508 | F235 | Chaos/Black Crusade | Any Daemon ship may have a single Mark of Chaos with the same effects and points cost. | Black Crusaden Daemonship-Markit (build_data.py:2637). |
| S0509 | F235 | 5 listaa | These vessels may not contain a Chaos Warmaster, a Chaos Lord or have a Chaos Space Marine crew, neither can they be given Marks. | Miehistö- ja Mark-rivit vain capital shipeille (cond cap). Warmaster/Lord saattajalla = sijoitus, ei mallinneta. **[ajo ok]** |
| S0520 | F236 | Chaos/Tzeentch | A ship with a Thousand Sons Chaos Space Marine crew may have a Mark of Tzeentch. | Mark of Tzeentch -rivi ehdolla miehistö (upgrades.py:397). |
| S0525 | F237 | Chaos/Tzeentch | Except for the flagship or the Scion of Prospero (if included), any number of the capital ships in a Sorcerous Fleet may be upgraded to D... | Scion of Prospero ei saa Daemonship-riviä (upgrades.py:1284). Lippulaivan poissulku vaatisi aboard-merkinnän. **[ajo ok]** |
| S0527 | F237 | 4 listaa | A Daemonship may not have a Chaos Space Marine crew. | noup chaos space marine crew. |
| S0535 | F240 | Chaos/Nurgle | A ship with a Death Guard Chaos Space Marine crew may have a Mark of Nurgle. | Mark of Nurgle -rivi ehdolla miehistö. |
| S0536 | F240 | Chaos/Nurgle | Any capital ships with the Mark of Nurgle may also take Hives of Nurgle. | Hives of Nurgle ehdolla Mark tai Daemonship (ROW_CONDS). |
| S0540 | F241 | Chaos/Nurgle | All Daemonships in a Plaguefleet must take the Mark of Nurgle, which is already included in the cost to upgrade them to Daemonships. | Nurglen Daemonship sisältää Markin (build_data.py:6397). **[ajo ok]** |
| S0545 | F244 | Chaos/Khorne | A ship with a World Eaters Chaos Space Marine crew may have a Mark of Khorne. | Mark of Khorne -rivi ehdolla miehistö. |
| S0550 | F245 | Chaos/Khorne | All Daemonships in a Berzerker Fleet must take the Mark of Khorne, which is already included in the cost to upgrade them to Daemonships. | Khornen Daemonship sisältää Markin (build_data.py:6397). |
| S0554 | F248 | Chaos/Slaanesh | A ship with an Emperor's Children Chaos Space Marine crew may have a Mark of Slaanesh. | Mark of Slaanesh -rivi ehdolla miehistö. |
| S0555 | F248 | Chaos/Slaanesh | Any ships with the Mark of Slaanesh may take and be obscured by a Veil of Lust. | Veil of Lust ehdolla Mark tai Daemonship. |
| S0558 | F249 | Chaos/Slaanesh | All Daemonships in a Pleasurefleet must take the Mark of Slaanesh, which is already included in the cost to upgrade them to Daemonships. | Slaaneshin Daemonship sisältää Markin. |
| S0645 | F318 | Eldar/Iyanden Craftworld | Such a vessel may not also include a Farseer or Aspect Warrior crew. | Farseer ja Aspect Warrior Host noup ghostship (build_data.py:2614). |
| S0721 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Escorts cannot use boarding torpedoes. | Boarding torpedoes -rivi vain capital shipeille (upgrades.py:681). |
| S0740 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Note: Ork Space Hulks cannot take orbital mines. | Space Hulk ei saa miinoja (build_data.py:3876). |
| S0741 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Regardless of how the Orks refer to the four named Ork battleships, they are battleships nonetheless and cannot take orbital mines. | Battleshipit eivät saa miinoja (vain cruiser/GC, build_data.py:3870). |
| S0830 | F372 | Orks/Da Ork Clanz | Space Hulks so led can take upgrades from the list of Gubbins for double the listed cost. | Hulkin gubbinit tuplahintaan (upgrades.py:141). |
| S0831 | F372 | Orks/Da Ork Clanz | Upgrades that increase its boarding value or speed may not be taken. | Soopa Boostas pois hulkilta (upgrades.py:142, T15). |
| S0865 | F371 | Orks/Da Ork Clanz | More Gubbins are not available for escorts (except the Grunt where indicated) and can only be added to capital ships. | cap=1 (upgrades.py:109). |
| S0912 | F369 | Orks/Da Ork Clanz | Snakebite capital ship skwadrons can only use space hulks or roks – no other kind of capital ship skwadrons are permitted to bear the cla... | Snakebites-rivin ehto ty escort/defence (upgrades.py:223); hulkki ja Rok eivät ole capital-tyyppiä (J189). **[ajo ok]** |
| S1021 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | As Tyranid Kraken do not have spores, they cannot evolve the ability to use spores and thus cannot take this refit. | Extra Spore Cysts nmno kraken (upgrades.py:235). |
| S1102 | F454 | Tau/Commerce Protection, Tau/Merchant Fleet | If you wish, the commander’s ship may carry a member of the Ethereal caste and therefore purchase additional re-rolls at the cost shown. | Aun'el/Aun'O komentajan alla (domain.js:4413). **[ajo ok]** |
| S1161 | F486 | Demiurg/War Host | These re-rolls can only be used for Demiurg vessels and not with other starships they may take as allies in their war host. | Re-roll-rivi vain Demiurg-alukselle (ROW_CONDS upgrades.py:101). |

### reserves (29)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0059 | F39 | IN/Bastion Fleets | In addition, you may of course use the Reserves rule to pick other Imperial vessels not found in your own fleet list. | Reservit toisilta Imperial-listoilta on toteutettu 1.1:ssä (lainalaivat). |
| S0060 | F39 | IN/Bastion Fleets | However, since a reserve fleet also draws on very old or scarce vessels, you may also use your reserve choices to select any of the follo... | Bastionin Chaos-reservit toteutettu (build_data.py:4688). |
| S0061 | F39 (osittain) | IN/Bastion Fleets | • Repulsive class grand cruiser (pg 269) • Executor class grand cruiser (pg 271) • Hades class heavy cruiser (pg 274) • Murder class crui... | Bastionin Chaos-reservit ja 1:3-suhde on toteutettu (build_data.py:4688–4714). Lauseeseen on liimattu viiden rungon luettelomerkit sivuviitteineen. **[ajo ok]** |
| S0062 | F39 | IN/Bastion Fleets | Reserve vessels use all their normal rules and keep their particular ordnance types (ie Chaos ordnance is used on Chaos ships picked in a... | Varianttikielto on noopt-ehtona (build_data.py:4712). Ordnance-osuus on pelin aikaista. |
| S0071 | F41 | IN/Armageddon Sector | Like other fleets, Armageddon sector fleets can include reserves. | Reservit toteutettu 1.1:ssä. |
| S0072 | F41 | IN/Armageddon Sector | However, it is important to note that despite the inclusion of Space Marine vessels in the fleet list, this is still an Imperial Navy fle... | Rotuportti (1.1): Imperial Navy -rodun lista ottaa reservit vain saman rodun listoista. **[ajo ok]** |
| S0073 | F41 | IN/Armageddon Sector | Likewise, Imperial Navy fleets choosing reserves from this fleet list cannot choose Space Marine vessels from it. | LEND_BANS (build_data.py:5436) ja domain.js:4703. |
| S0092 | F50 | IN/Bakka Sector | Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser, battlecruiser or grand cruiser for every three Bakk... | build_data.py:1532 rakensi tästä ratio-säännön keep_text-lipulla, mutta src ei ole enää datassa; 1.1:n reservimoottori voi kattaa saman. Varmista kumpi valvoo. **[ajo ok]** |
| S0094 | F50 | IN/Bakka Sector | Ships from the Bakka fleet list can be used as reserves by any other Imperial fleet list, along with their Bakka- specific refits. | Bakka lainaa aluksia muille Imperial-listoille 1.1-mekanismilla; refitit kulkevat lahjoittajan päivityksinä. **[ajo ok]** |
| S0095 | F50 | IN/Bakka Sector | Reserve cruisers (not battlecruisers or grand cruisers) always count toward the twelve- cruiser fleet limit. | Lainatut alukset lasketaan isännän rajoihin (s.14 'fleet as a whole', 1.1). **[ajo ok]** |
| S0096 | F50 | IN/Bakka Sector | One cannot take as reserves the reserves of another fleet list. | Reservin reservi -kielto domain.js:425. |
| S0097 | F50 | IN/Bakka Sector | As such, ships such as the Jovian that are part of the reserve fleet of Battlefleet Bakka cannot be used as reserves of another fleet list. | Sama kielto, kirjan esimerkki (Jovian). |
| S0155 | F99 | SM/Crusade | A Space Marine Crusade fleet will not take ships from or provide ships to any other fleet list as reserves or allies, including Imperial ... | res_ban (build_data.py:5406). |
| S0166 | F101 | SM/Dominion | Contrary to the normal rules, a dominion fleet can take Imperial Navy vessels as normal reserves and reinforcements, including Adeptus Me... | RESERVE_GRANTS (build_data.py:5303). |
| S0244 | F121 | AdMech/Explorator | RESERVES AND ALLIES Adeptus Mechanicus vessels can be used as reserves in any Imperial Navy or Space Marine fleet list. | AdMech-lainat IN- ja SM-listoille (build_data.py:5527). (poimintavika: heading) |
| S0245 | F121 | AdMech/Explorator | Contrariwise, Imperial Navy vessels from any fleet list can be used as reserves in a Mechanicus fleet, following all normal rules for the... | Sama rotu (imperial navy), 1.1-reservit. |
| S0247 | F121 | AdMech/Explorator | For every three cruisers, one reserve cruiser-class, battlecruiser or grand cruiser may be taken. | Yleinen tyyppikohtainen 1:3 (s.14), 1.1. **[ajo ok]** |
| S0248 | F121 | AdMech/Explorator | For every three battleships, one battleship- class vessel may be taken. | Sama, battleshipit. **[ajo ok]** |
| S0296 | F139 | The Emperor's Inquisition | Any one of the Imperial Navy, Adeptus Mechanicus and Space Marine fleets led by an Inquisitor may always take ships from the other two as... | Inkvisiittorin reservilupa (build_data.py:5503). |
| S0342 | F146 | Grey Knights | A Grey Knights fleet will not take ships from or provide ships to any other fleet list as reserves or allies, including Imperial Navy, Ro... | res_ban. |
| S0618 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Only a fleet led by an Eldar Hero may take reserves from the Craftworld Eldar fleet list. | Hero-portti Craftworld-reserveille (build_data.py:5318). |
| S0621 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | An Eldar Hero must lead the fleet in order to use Craftworld Eldar vessels as reserves. | Hero-portti. |
| S0622 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Following this, one Craftworld Eldar Flame of Asuryan, Dragonship or Wraithship may be taken for every three cruisers in the fleet. | Yleinen 1:3 tyypeittäin (build_data.py:5330). **[ajo ok]** |
| S0623 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Craftworld Eldar Shadowhunters may be taken in the same ratio of no more than one for every three escort vessels in the fleet. | Saattajien 1:3 yleisellä säännöllä. **[ajo ok]** |
| S0632 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Furthermore, if the Flame of Asuryan with Yriel is added to the parent fleet it is exempt from the reserve rules (e.g. you do not have to... | res_exempt (build_data.py:4027). |
| S0640 | F318 | Eldar/Iyanden Craftworld | Only a fleet led by an Eldar Hero may take reserves from the Corsair Eldar fleet list. | Hero-portti Corsair-reserveille. |
| S0649 | F319 | Eldar/Iyanden Craftworld | An Eldar Hero must lead the fleet in order to use Corsair Eldar vessels as reserves. | Hero-portti. |
| S0650 | F319 | Eldar/Iyanden Craftworld | Following this, one Corsair Eldar cruiser or light cruiser may be taken for every three Dragonships and / or Wraithships in the fleet. | 1:3 tyypeittäin; 'Dragonships and/or Wraithships' on pohja, ei kaikki risteilijät. Varmista pohjan valinta. **[ajo ok]** |
| S0651 | F319 | Eldar/Iyanden Craftworld | Corsair Eldar escort vessels may be taken in the same ratio of no more than one for every three Shadowhunters in the fleet. | Saattajat 1:3 Shadowhuntereista. Varmista, että pohja on Shadowhunterit eikä kaikki saattajat. **[ajo ok]** |

### text_mismatch (26)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0046 | F37 | IN/Bastion Fleets | * The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant ... | compare-sääntö build_data.py:1411; tekstissä on alussa '* ', joten tarkka vertailu ei osu. |
| S0083 | F48 | IN/Bakka Sector | Bakka fleets may only field a single Emperor battleship, and this only as reserves unless Admiral Rath leads the fleet, in which case it ... | 0-1 on rivirajana ja 'vain reservinä, ellei Rath johda' requires-sääntönä s.49:n sanamuodolla (build_data.py:1527). Avoin osa: 'must be his flagship' = sijoitus (J8). |
| S0330 | F145 | Grey Knights | You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. | allowed_at samassa osiossa; src on yhdistelmä, joten tarkka vertailu ei osu. |
| S0331 | F145 | Grey Knights | Furthermore an Ordo Malleus Inquisitor Lord must lead in the fleet. | Sama yhdistelmä-src (Ordo Malleus -ehto). |
| S0365 | F197 | RT, RT/Exploration, RT/Pirates and Wolf Packs | Additionally, up to four ships in a Rogue Trader or pirate fleet may be Stryxis Caravan Vessels, rolling for leadership normally. They do... | Stryxis enintään neljä (J31, build_data.py:3136); 'ei risteilijöinä' ja 'ei re-rolleja' kortilla. **[ajo ok]** |
| S0371 | F176 | RT/Exploration | A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. | ratio samassa osiossa, yhdistelmä-src. |
| S0372 | F176 | RT/Exploration | At least one Veteran Rogue Trader must be assigned to a Rogue Trader cruiser in the fleet. | mandatory_at samassa osiossa; 'assigned to a Rogue Trader cruiser' = sijoitus. |
| S0376 | F177 | RT/Exploration | Any number of cargo ships beyond this number may be taken and organized in squadrons that only contain cargo ships. | Cargo-laivuesääntö samassa osiossa (J61). |
| S0383 | F177 | RT/Exploration | This is separate from and in addition to any reserve or allied cruisers taken, but each Demiurg vessel taken still counts against the twe... | Demiurg lasketaan 12 risteilijän rajaan ja enintään yksi Stronghold (build_data.py:4231). Varmista molemmat. **[ajo ok]** |
| S0385 | F177 | RT/Exploration | This is separate from and in addition to any reserve or allied cruisers taken, and the Kroot Warsphere does not count against the twelve-... | Kroot Warsphere ei laske 12 risteilijän rajaan (oma osio). **[koodi luettu]** |
| S0397 | F178 | RT/Pirates and Wolf Packs | A Pirate Cruiser may consist of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos fleet lists worth 185 points or less. | Merirosvoristeilijät riveinä (J30, build_data.py:3101). |
| S0398 | F178 | RT/Pirates and Wolf Packs | It may also include a single Space Marine strike cruiser! | SM Strike Cruiser mx=1 (build_data.py:3103). |
| S0399 | F178 | RT/Pirates and Wolf Packs | Special variants, refits and Nova Cannons cannot be used. | noopt kaikilla merirosvoristeilijöillä. |
| S0404 | F179 | RT/Pirates and Wolf Packs | The number of escort vessels that utilize ordnance or lance weaponry may not outnumber those that rely solely on weapon batteries. | compare samassa osiossa, yhdistelmä-src (build_data.py:3130). |
| S0405 | F179 | RT/Pirates and Wolf Packs | Xenos vessels of all types don’t count toward this total. | Sama compare. |
| S0406 | F179 | RT/Pirates and Wolf Packs | Up to 10% of a pirate fleet may be made up of alien escorts from any race except Tyranids, Necrons or vessels that require support from a... | points_share 10 % (build_data.py:1600); src päättyy ennen esimerkkiä 'such as Nicassar Dhows or Tau Orcas'. |
| S0472 | F231 | 6 listaa | ABADDON AS FLEET COMMANDER Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or ... | allowed_at 1 000 (build_data.py:5744, J162). Lause on yleisessä osiossa otsikon kanssa. **[ajo ok]** (poimintavika: heading) |
| S0617 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Your fleet may be led by an Eldar Hero, in place of its normal fleet commander. | cap Pirate Prince tai Eldar Hero (build_data.py:1180), src laajennettu Yriel-lauseella. |
| S0642 | F318 | Eldar/Iyanden Craftworld | In order to take the Flame of Asuryan, an Eldar Hero must lead the fleet and be embarked aboard it. | requires samassa osiossa (build_data.py:4519), src laajennettu Yriel-lauseella. |
| S0821 | F372 | Orks/Da Ork Clanz | A Warlord may choose for his own ship or escort skwadron one upgrade from the Gubbins list for every re-roll he has at its listed cost. | up_budget GUBBINS-osiossa (yksi per Warlordin re-roll, laivastotasolla). Sidonta Warlordin omaan alukseen ei ole mallinnettu. |
| S0827 | F372 | Orks/Da Ork Clanz | 3-10 Escorts, chosen from the following list in any mix desired: | squadron 3–10 samassa osiossa (J62). (poimintavika: split) |
| S0848 | F370 | Orks/Da Ork Clanz | A vessel or escort skwadron led by a Warlord may be given up to one of the following upgrades per Command re-roll the Warlord has. | up_budget samassa osiossa (SRC). |
| S0849 | F370 | Orks/Da Ork Clanz | Each upgrade can only be applied once. | Sama up_budget-src. |
| S1045 | F429 | Tyranids/Vanguard Fleet | You may combine the two types in a single squadron if you wish. | squadron 6–12 samassa osiossa; lyhyet rivit yhdistyvät toisiin (domain.js:4196). Referenssi 28 #231 on vanhentunut, varmista sekalaivue. **[ajo ok]** |
| S1126 | F456 | Tau/Commerce Protection | Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. | per_points samassa osiossa. |
| S1127 | F456 | Tau/Commerce Protection | Allied, Subject, Mercenary and Reserve vessels don’t count toward this total. | Sama per_points; varmista, että pohja laskee vain Tau-alukset. **[ajo ok]** |

### other_section (14)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0069 | F40 | IN/Armageddon Sector | As long as at least one Space Marine Battle barge is included you may choose a Master of the Fleet, who will always be assigned to a Batt... | requires-sääntö Fleet Commander -osiossa (build_data.py:4294), lause on Master of the Fleet Re-rolls -osiossa. 'Always assigned to a Battle barge' on sijoitus, jota ei mallinneta (J8). |
| S0070 | F40 | IN/Armageddon Sector | As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, admiral or solar admiral, who will alway... | requires-sääntö Fleet Commander -osiossa (build_data.py:4298), lause on toisessa osiossa. |
| S0093 | F50 | IN/Bakka Sector | One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet. | per_points ROGUE TRADERS -osiossa (SRC-osuma), lause on RESERVES-osiossa. |
| S0168 | F101 | SM/Dominion | When reserves are taken in this manner, the fleet can have up to twelve cruisers. | conditional_cap Cruisers-osiossa (build_data.py:5373). |
| S0301 | F140 | The Emperor's Inquisition | If desired, vessels with an embarking Inquisitor may gain special characteristics, depending upon the Ordo the Inquisitor leading the fle... | Ordon valinta on cap-sääntönä ORDO HERETICUS INQUISITOR -osiossa (SRC-osuma); lause on johdanto-osiossa. |
| S0304 | F140 | The Emperor's Inquisition | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. | requires-sääntö (Ordo vaatii Inquisitor Lordin) toisessa osiossa; hyöty aluksella = komentajakortti. |
| S0626 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Yriel may be taken instead of the Hero Fleet Commander as listed in the Corsair and Craftworld Eldar fleet lists. | Yriel Heron tilalla: komentajacap Eldar Hero -osiossa (SRC). |
| S1051 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one. | unit_upgrade_max FLEET RULES -osiossa. |
| S1057 | F430 | Tyranids/Hive Fleet | Each hive ship allows the Tyranid player to purchase 6–12 escort ships and 0–2 capital ships. | ESCORTS-osion min_ratio 6 ja ratio 12 sekä CAPITAL SHIPS ratio 2. Referenssi 29 #237 on vanhentunut. |
| S1061 | F431 | Tyranids/Hive Fleet | If desired, this may be in addition to the 6–12 escorts (of any type) that may be taken for every hive ship in the fleet. | Erilliset min_ratio-säännöt escort droneille ja kaikille saattajille. |
| S1117 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. | hook_capacity ESCORTS-osiossa. |
| S1118 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | A ship may have either Orcas or Dhows, but not both so the gravitic hook capacity of the fleet is divided between Orcas and Dhows. | Seuraus valvottu (hook_capacity); aluskohtainen 'joko tai' vaatisi emoalussidoksen. |
| S1133 | F457 | Tau/Commerce Protection | Gravitic hooks on a Custodian battleship or Emissary starship cannot count toward this total. | hook_capacity jättää Custodianin ja Emissaryn pois (build_data.py:4454). |
| S1169 | F487 | Demiurg/War Host | Tau, Nicassar and Rogue Trader escorts may not be mixed in the same squadrons. | Erilliset laivuesäännöt Tau Escorts- ja Rogue Trader Escorts -osioissa (J57); eri rivit = eri laivueet. |

### group_rule (10)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0479 | F232 | Chaos/Incursion | In addition they may be given up to four Marks of Chaos as shown below (no Mark may be taken more than once). | _MULTI_MARK purkaa Mark-ryhmän Warmasterille (upgrades.py:156); sama Mark ei kahdesti. |
| S0485 | F232 | Chaos/Incursion | A Chaos Lord may be given up to one of the following Marks of Chaos. | Lordin Mark-rivit jakavat ryhmän 'mark' (yksi Mark). **[ajo ok]** |
| S0492 | F234 | Chaos/Black Crusade | In addition they may be given a single Mark of Chaos. | Black Crusaden Warmaster: yksi Mark (ryhmä mark). **[ajo ok]** |
| S0498 | F234 | Chaos/Black Crusade | A ship commanded by a Lord may be given a single Mark of Chaos. | Lordin alukselle yksi Mark (ryhmä mark). **[ajo ok]** |
| S0801 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | A vessel carrying a Warlord doubles its boarding value and may include up to one of the upgrades shown below at the additional cost indic... | Yksi päivitys ryhmällä warlord_up; kaksinkertainen boarding-arvo komentajakortilla (J8). |
| S0856 | F370 | Orks/Da Ork Clanz | This cannot be combined with Maniac Turrets. | Extra Turrets ja Maniac Turrets eivät yhdessä (upgrades.py:180–183). **[ajo ok]** |
| S0858 | F370 (osittain) | Orks/Da Ork Clanz | This cannot be combined with Extra Turrets. | Sama poissulku toisin päin; lause liian lyhyt haettavaksi. **[ajo ok]** |
| S1006 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | With the exception of reinforced carapace and extra spore cysts, no single bio-enhancement may be granted more than once. | Muut rivit take/off; carapace ja spore cysts ×2/×3-riveinä ryhmissä bio_carapace/bio_spores (J9). |
| S1020 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | No more than two spore cysts can be gained in this manner. | Enintään kaksi: ×1/×2-rivit ryhmässä bio_spores. |
| S1024 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | No more than four additional Hits may be gained in this manner for Hive ships, and no more than three for cruisers. | ×1–×3 ryhmässä bio_carapace, ×4 vain hive shipille (cond nm). |

### commander_count (9)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0020 | F35 | IN/Bakka Sector, IN/Bastion Fleets, IN/Gothic Sector | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | Määrä 1 Admiral on todennäköisesti osion raja; 'assigned to a ship' = lippulaivan valinta pöydällä; Ld-arvo on komentajakortilla. Sama lausetyyppi toistuu jokaisella listalla. **[ajo ok]** |
| S0066 | F40 | IN/Armageddon Sector | You may include a commander in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | Komentajan määrä on osion rajana; sijoitus alukselle tehdään pöydällä; Ld on komentajakortilla. Sama lausetyyppi kuin S0020. **[ajo ok]** |
| S0140 | F97 | SM/Codex Astartes, SM/Crusade, SM/Dominion | You may include 1 Master of the Fleet. | Komentajan määrä 1 osion rajana. **[ajo ok]** |
| S0267 | F124 | AdMech/Explorator | You may include 1 Mechanicus Archmagos in your fleet, which must be assigned to a capital ship and replaces its Leadership with the value... | Määrä 1 osion rajana; 'assigned to a capital ship' = sijoitus; Ld komentajakortilla. **[ajo ok]** |
| S0615 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | You may include 1 Pirate Prince in your fleet, who must be assigned to a ship and adds +2 to its Leadership, to a maximum of 10. | 1 Pirate Prince osion rajana; +2 Ld (max 10) komentajakortilla; sijoitus pöydällä. **[ajo ok]** |
| S0638 | F318 | Eldar/Iyanden Craftworld | You may include one Eldar Autarch in your fleet, who replaces the ship’s Leadership with his own. | Autarch 0-1 komentajacapissa; Ld komentajakortilla. **[ajo ok]** |
| S0713 | F351 | Dark Eldar/Pirates | You may include 1 Dread Archon in your fleet, who must be assigned to a ship and adds + 2 to its Leadership, to a maximum of 10. | 1 Dread Archon osion rajana; +2 Ld kortilla. **[ajo ok]** |
| S0796 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | You may include 1 or more Warlord in your fleet, each of whom must be assigned to a ship or squadron. | Warlordien määrä per_points 500 -sääntönä; 'assigned to a ship or squadron' = sijoitus (J8). **[ajo ok]** |
| S0835 | F373 | Orks/Da Ork Clanz | While there must be at least one Warlord for every 500 points in the fleet or portion thereof, not all Warlords are created equal! | per_points 500 WARLORD-osiossa. Kirja sanoo 'at least one Warlord for every 500 points' (minimi); varmista, onko sääntö minimi vai maksimi. Ajo 20.10.: 'WARLORD 0 / 1 exactly' punaisena - sääntö on täsmämäärä, eli myös minimi valvotaan. **[ajo ok]** |

### row_limit (9)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0282 | F138 | The Emperor's Inquisition | As the rules state, there should be only one Inquisitorial cruiser in the fleet. | 0-1 rivirajana. |
| S0332 | F145 | Grey Knights | A Grey Knights fleet may include a single Inquisitorial Cruiser in the fleet. | 0-1. |
| S0333 | F145 | Grey Knights | A Grey Knights fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the ... | Blackship 0-1, ei lasketa rajoihin. **[ajo ok]** |
| S0521 | F236 | Chaos/Tzeentch | Up to two capital ships (including the flagship), that have the Mark of Tzeentch, can have daemonic entities and warp beasts swirl about ... | Warp Beasts mx=2 ja ehto Mark of Tzeentch (build_data.py:1906, ROW_CONDS). |
| S0538 | F240 | Chaos/Nurgle | Up to three capital ships with the Mark of Nurgle (including the flagship) may also become Arks of Pestilence. | Ark of Pestilence mx=3 (build_data.py:1909). |
| S0556 | F248 | Chaos/Slaanesh | Up to two capital ships with the Mark of Slaanesh (including the flagship) may take the Siren’s Summon. | Siren's Summon mx=2. |
| S0914 | F400 | Necrons/Harvest Fleet | Sepulchre Only utilised by the largest Necron vessel in a fleet, a ship carrying a Sepulchre automatically gains a Leadership of 10. | Sepulchre mx=1 tombshipille (ENTRY_LIMITS, referenssi 26 #222); Ld 10 kortilla. **[ajo ok]** |
| S0967 | F404 | Necrons/Harvest Fleet | A single tombship may be upgraded to carry a Sepulchre. | Sepulchre mx=1 (ENTRY_LIMITS). |
| S0968 | F404 | Necrons/Harvest Fleet | Your fleet may include up to six Scythe class harvest ships and up to three Shroud class light cruisers. | 0-6 ja 0-3 rivirajoina. |

### example (7)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0637 | F317 | Corsairs/Later Gothic War | Therefore, if you have between 0 to 999 points, you cannot field any battleships, while from 1000 to 1,999 points you can include one, an... | Esimerkki valvotusta per_points-battleship-säännöstä. |
| S0797 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | ie, if the fleet is worth up to 500 points, it may have one Warlord. | Esimerkki per_points-säännöstä. |
| S0798 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | If it is worth 500–1,000 points two Warlords may be included, etc. | Esimerkki. |
| S0812 | F367 | Orks/Waaagh! | So if the fleet is worth up to 1,500 points, it may include one Space hulk. | Esimerkki. |
| S0813 | F367 | Orks/Waaagh! | If it is worth 1,500-3,000 points, two space hulks may be included, etc. | Esimerkki. |
| S1128 | F456 | Tau/Commerce Protection | For example, a fleet that has at least 750 points of Tau vessels in it may include a single Custodian. | Esimerkki. |
| S1129 | F456 | Tau/Commerce Protection | Fleets of at least 1,500 points may include two Custodians etc. | Esimerkki. |

### mandatory_row (6)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0196 | F118 | AdMech/Explorator | Every Mechanicus cruiser (not light cruiser) is equipped with a single 60 cm range dorsal lance battery firing left/front/right. | Pakollinen 0 pts rivi req=1 (upgrades.py:573). |
| S0197 | F119 | AdMech/Explorator | All Mechanicus capital ships add +1 to a given vessel's original turret value. | Pakollinen +1 turret req=1, cap=1 (upgrades.py:568). |
| S0514 | F236 | Chaos/Tzeentch | The Warmaster must take the Mark of Tzeentch. | Mark of Tzeentch dflt-rivinä + mark_paid-sääntö (domain.js:4430). |
| S0531 | F240 | Chaos/Nurgle | The Warmaster must take the Mark of Nurgle. | Mark of Nurgle dflt-rivinä + mark_paid. |
| S0542 | F244 | Chaos/Khorne | The Warmaster must take the Mark of Khorne. | Mark of Khorne dflt + mark_paid. |
| S0551 | F248 | Chaos/Slaanesh | The Warmaster must take the Mark of Slaanesh. | Mark of Slaanesh dflt + mark_paid. |

### vbb (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0144 | F97 | SM/Codex Astartes | The fleet can include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos... | Codexin Venerable battle barge: 0-1, kuuluu kolmen bargen kattoon, runkovalinta + 35 (domain.js:1265, HULL_CHOICES). Codexissa ei ole 1 000 pisteen ehtoa kuten Crusadessa ja Dominionissa. **[ajo ok]** |
| S0174 | F102 | SM/Dominion | A Venerable battle barge benefits from all the Space Marine special rules, but since it is already heavily reconfigured to make it into a... | VBB ilman profiilin optioita (domain.js:73). |
| S0177 | F102 | SM/Dominion | For example, an Imperial Mars battlecruiser with two launch bays each side is reduced to one each side, and a Chaos Styx heavy cruiser wi... | Bayt puolitetaan ylöspäin (domain.js:73–76); lause on esimerkki. |
| S0178 | F102 | SM/Dominion | The launch bays are configured to carry Thunderhawks following the rules detailed beforehand and on [???] of Armada, and they cannot be u... | Vain Thunderhawkit (domain.js:73). |
| S0180 | F102 | SM/Dominion | Any Venerable battle barge equipped with a prow weapon (regardless of what it is) may, if desired, replace it with strength-6 torpedo tub... | venerable_prow_torpedoes-optio (domain.js:99). |

### rt174 (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0036 | F174 | 9 listaa | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | 750 pisteen listoilla sääntö on B-lauseesta (per_points), joten A-lause jää näkyviin, vaikka sisältyy saman osion sääntöön (SRC-osuma). **[ajo ok]** |
| S0037 | F174 | 22 listaa | Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. | Liimattu Cruisers-osion section_count-säännön src:hen (build_data.py:5713), mutta lause on ROGUE TRADERS -osiossa. **[ajo ok]** |
| S0297 | F139 | The Emperor's Inquisition | Imperial Navy and Adeptus Mechanicus fleets may also take a single Rogue Trader cruiser. | IN- ja AdMech-listat saavat RT-risteilijän jo s.174:n säännöllä (yksi per 750 pistettä). |
| S0348 | F174 | 14 listaa | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | RT-listalla per_points (SRC). 13 Chaos-, Eldar- ja Ork-listalla lause ei koske listaa (niille vain 'a single Rogue Trader capital ship'): poista niiltä. (poimintavika: wronglist) |

### squadron_rule (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0074 | F41 | IN/Armageddon Sector | * Space Marine vessels may not be squadroned with non-Space Marine vessels. | split_fl laivuesäännössä (build_data.py:4087, domain.js:4199). |
| S0407 | F179 | RT/Pirates and Wolf Packs | They can be organized in squadrons of two to six ships, but vessels of different races may not combine with each other into a single squa... | Laivuekoko 2–6; rotujen sekoitus ei ole mahdollista (yksi rivi = yksi laivue). Varmista kokosääntö. **[ajo ok]** |
| S0886 | F370 | Orks/Da Ork Clanz | Note: the maximum number of escorts in an Ork squadron can be up to ten. | Tiddla-laivue 3–10 on valvottu (J62); referenssi 25 #214 on vanhentunut. |
| S1108 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | They may be combined in squadrons with Messengers if you wish. | with_pick: Defenderit ja Messengerit samaan laivueeseen (build_data.py:4092). |

### inquisitor_allies (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0317 | F141 | The Emperor's Inquisition | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following additi... | Johdanto Ordo Xenos -liittolaisiin, jotka on toteutettu (build_data.py:4772, domain.js:4038). **[koodi luettu]** |
| S0318 | F141 | The Emperor's Inquisition | A fleet led by an Ordo Xenos Inquisitor may be accompanied by a single Demiurg capital ship, Corsair Eldar cruiser or Tau cruiser. | Demiurg-, Corsair- tai Tau-alus Ordo Xenos -inkvisiittorin kanssa (build_data.py:4764, domain.js:2992). **[koodi luettu]** |
| S0320 | F142 | The Emperor's Inquisition | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following additi... | Ordo Malleus ja Bastionin Chaos-rungot (J144, build_data.py:4778). |
| S0321 | F142 | The Emperor's Inquisition | These vessels are free of the “Strange Happenings” special rule as long as the Inquisitor’s ship remains in play, but the fleet may not t... | Strange happenings -vapautus kortilla (domain.js:2987) ja Grey Knights -kielto (domain.js:4039). **[koodi luettu]** |

### inquisition_attach (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0024 | F138 | 9 listaa | A single Inquisitorial cruiser led by an Inquisitor can be taken as reserves by any Imperial Navy, Space Marine or Adeptus Mechanicus fle... | Inkvisitio-liiteosio on toteutettu kahdeksalle listalle (build_data.py:4548). Avoin: RT-risteilijän reitti ('embarked on a single Rogue Trader cruiser') — tarkista onko mallinnettu. Ajo 20.10.: liiteosio toimii; RT-risteilijän reitti puuttuu (RT-listalla ei inkvisiittoririvejä). **[osittain]** |
| S0025 | F138 | 9 listaa | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or s... | 0-1 ja 'takes the place of a battlecruiser or strike cruiser' toteutettu J148:ssa; lause on eri osiossa kuin sääntö. **[ajo ok]** |
| S0026 | F138 | 9 listaa | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | Blackship 0-1 ja 'ei lasketa rajoihin' toteutettu (J148). **[ajo ok]** |

### ratio_base (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0045 | F37 | IN/Bastion Fleets | Grand Cruisers do not count as cruisers for purposes of fielding battleships. | Grand cruiserit eivät ole taistelulaivasäännön nimittäjässä (build_data.py:4896 ja reference #4). **[ajo ok]** |
| S0084 | F49 | IN/Bakka Sector | If taken as reserves, grand cruisers do not count for this purpose. | Reservinä otettu grand cruiser ei laske Bakan taistelulaivasuhteeseen. Varmista: Bakan omalla listalla ei ole GC:itä, joten koskee vain lainattuja. **[ajo ok]** |
| S0505 | F235 | 5 listaa | The Planet Killer also counts as a battleship when working out how many heavy cruisers and cruisers the fleet requires. | Planet Killer lasketaan battleshipiksi risteilijäsuhteessa (build_data.py:1493). **[ajo ok]** |

### allies (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0379 | F177 | RT/Exploration | Up to one cruiser from any fleet except Orks, Necrons and Tyranids can be taken for every three Rogue Trader cruisers in the fleet. | Yksi risteilijä mistä tahansa listasta (paitsi Orks, Necrons, Tyranids) kolmea RT-risteilijää kohden. Varmista 1.1:n ally_rule. **[ajo ok]** |
| S0396 | F178 | RT/Pirates and Wolf Packs | Pirate fleets do not ally with any race, as they are only in business for themselves and consider any ship they encounter and can easily ... | Merirosvot eivät liittoudu. Varmista, ettei Pirates-listalle tarjota liittolaisia. **[ajo ok]** |
| S1092 | F452 | Tau/Commerce Protection, Tau/Merchant Fleet | ALLIES, SUBJECTS & MERCENARIES Tau fleets may include allies, subjects and mercenaries, selected from the fleet lists as normal. | Liittolaiset 1.1-mekanismilla ja listan omilla osioilla. (poimintavika: heading) |

### domain_check (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0038 | F498 | 32 listaa | When desired, the defender in a scenario may spend up to one-third of his allocated point value on planetary defences, in addition to any... | Kolmanneksen raja on varoituksena domain.js:4544 (oma s-teksti); UI ei tiedä tätä, koska tarkistus ei ole sec.rules-rivi. |
| S0635 | F337 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The owning player may use the Webway to summon additional warships to its aid. Any number of ships may be purchased against the fleet's t... | Webway Portal 50 % (domain.js:4588). |

### aboard_row (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0289 | F139 | The Emperor's Inquisition | If an Imperial Navy or Adeptus Mechanicus ship embarking an Inquisitor is equipped with launch bays, it must replace its attack craft wit... | 0 pts rivi 'Embarks the Inquisitor: Thunderhawks, launch bays halved' (upgrades.py:642) on jo aboard-merkintä riviksi tehtynä. Malli yleistettäväksi. |
| S0634 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | He must be embarked aboard the Flame of Asuryan if it is present, in which case his cost is 125 points. | L.aboard ja rivi 'Embarked aboard the Flame of Asuryan' -25 pts (upgrades.py:562). |

### ally_matrix (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0300 | F139 | The Emperor's Inquisition | While a Space Marine Captain or Fleet Master may agree to parley at an Inquisitor’s side, they will not countenance adding insult to inju... | Liittolaismatriisi estää xenos-liittolaiset SM-laivastolta ('Never allies: space marines and corsair eldar', ajo 20.10.). Renegade-puolta ei ajettu erikseen. **[ajo ok]** |
| S0351 | F174 | RT | Xenos vessels cannot be used in fleets that include Space Marine ships. | SM-alus ei pääse RT-listalle reservinä (rotuportti) eikä liittolaisena (allowance 0), joten xenos + SM ei voi syntyä (ajo 20.10.). **[ajo ok]** |

### row_offered (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0747 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | ORK PLANETARY DEFENCES Ork Roks can be taken as planetary defences and purchased using planetary defence point allowances in scenarios th... | Rok puolustusrivinä (J172 valmis 14.10.). (poimintavika: heading) |
| S0815 | F367 | Orks/Waaagh! | Ork Roks may also be purchased with points for planetary defences, in scenarios where these are used. | Rok puolustusrivinä (J172). |

### lend_upgrade_ban (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0163 | F101 | SM/Dominion | Imperial Navy, Adeptus Mechanicus and Rogue Trader vessels are equipped with their own standard ordnance (even if they have Space Marine ... | Dominioniin lainatulle IN-alukselle ei tarjota yhtään SM-päivitystä (ajo 20.10.): rivien ehdot (battle barge, strike cruiser) rajaavat ne pois. **[ajo ok]** |

### renegades (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0490 | F222 | 6 listaa | Special weapon rules, Nova Cannon, Chaos Lords, Chaos Space Marines, Chaos ordnance or Daemonship upgrades may not be taken for Imperial ... | Renegade Imperial Vessels -osio: noopt ja kiellot (build_data.py:4999–5061). -1 Ld ja saattajien sekoitus kuuluvat kortille ja pöytään. Ajo 20.10.: renegade-riveillä noopt, ja käyttöliittymä piilottaa optiot (app_template.html:2960). Avoin tulkinta: rivi tarjoaa 'Special torpedoes', vaikka s.222 kieltää 'special weapon rules' ja 'Chaos ordnance'. **[ajo ok]** |

### conditional_cap (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0549 | F245 | Chaos/Khorne | Bezerker Fleets led by a Space Hulk may have more than two battleships, but other restrictions remain unchanged. | Khornelta puuttuu kahden battleshipin katto hulkin kanssa (build_data.py:1515), eli poikkeus on toteutettu jättämällä sääntö pois. |

### dup (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0811 | F367 | Orks/Waaagh! | You may include up to one Ork Space Hulk in your fleet per 1,500 points. | Sama sääntö sanotaan kahdesti; valvottu versio on seuraava kirjan lause (referenssi 24 #188). (poimintavika: dup) |

### repeatable_rows (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0998 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Each ship is limited as to how many weapon choices it may have on a given location, but where more than one weapon is permitted you may s... | Hive shipillä on kolme erillistä Port/starboard set 1–3 -paikkaa, joista jokaisessa sama valikoima (ajo 20.10.), joten saman aseen voi valita kolmesti. **[ajo ok]** |

### hook_capacity (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1116 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Your fleet may include Nicassar Dhows in place of some or all of its Orcas. | Dhowt ja Orcat jakavat hook-kapasiteetin (J95). |

## RAKENNE: Rakenteen takaama (62 uniikkia, 133 esiintymää)

### row_offered (23)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0044 | F500 | 11 listaa | The Ramilies is available to Imperial and Chaos Fleets, subject to the rules below. | Ramilies-rivi lisätään vain Imperial- ja Chaos-roduille (build_data.py:6049). |
| S0122 | F95 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Escort carriers may never be upgraded to carry Thunderhawks! | Saattajille ei tarjota Thunderhawk-päivitystä. Varmista, ettei mikään rivi tarjoa sitä escortille. **[ajo ok]** |
| S0189 | F118 | AdMech/Explorator | Mechanicus vessels (including battleships) do not normally utilize assault boats or boarding torpedoes. | AdMech-aluksille ei tarjota assault boateja tai boarding torpedoja. Varmista, ettei mikään rivi tarjoa (vrt. S0052-tyyppinen kielto s.125). **[ajo ok]** |
| S0238 | F121 | AdMech/Explorator | Note that these are taken from both the Imperial Navy and Space Marines fleet lists, but they must be taken for the point costs listed on... | Saattajat hinnoitellaan listan rivin hinnalla, ei profiilin. |
| S0273 | F125 | AdMech/Explorator | The Adeptus Mechanicus will only use warships from the following classes, applying all the rules described beforehand. | Listan rivit ovat juuri nämä luokat. |
| S0517 | F236 | Chaos/Tzeentch | A ship commanded by a Lord may only be given a Mark of Tzeentch. | Tzeentch-listan Lord-osiossa on vain Mark of Tzeentch. **[ajo ok]** |
| S0528 | F237 | Chaos/Tzeentch | Daemonships in a Sorcerous Fleet may only take the Mark of Tzeentch, paid for separately. | Tzeentchin Daemonship-osiossa vain Mark of Tzeentch -rivi (upgrades.py:417). |
| S0533 | F240 | Chaos/Nurgle | A ship commanded by a Lord may only be given a Mark of Nurgle. | Nurgle-listan Lordilla vain Mark of Nurgle. **[ajo ok]** |
| S0543 | F244 | Chaos/Khorne | A ship commanded by a Lord may only be given a Mark of Khorne. | Khorne-listan Lordilla vain Mark of Khorne. **[ajo ok]** |
| S0552 | F248 | Chaos/Slaanesh | A ship commanded by a Lord may only be given a Mark of Slaanesh. | Slaanesh-listan Lordilla vain Mark of Slaanesh. **[ajo ok]** |
| S0684 | F347 (osittain) | Dark Eldar/Pirates | ELDAR HAVEN An Eldar Haven (pg 334) may be used as a Dark Eldar pirate base. | Haven on Dark Eldarin puolustusosiossa asevaihdoin (domain.js:3214). (poimintavika: heading) |
| S0965 | F404 | Necrons/Harvest Fleet | A Necron fleet may purchase re-rolls, but they are purchased by the fleet as a whole, rather than being considered Fleet Commander re-rolls. | Re-rollit omassa osiossaan, ei komentajan alla (referenssi 26 #220). |
| S0991 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | As they cannot have bombers, they obviously cannot have torpedo bombers. | Ei torpedo bomber -riviä Tyranideille. **[ajo ok]** |
| S1009 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Because the equivalent of Tyranid torpedoes are always boarding torpedoes, Tyranids cannot use the torpedo refits available to other races. | Torpedo-refittejä ei tarjota. **[ajo ok]** |
| S1052 | F430 | Tyranids/Hive Fleet | The Tyranid player may opt to include the direct influence of the Hive Mind in lieu of having a fleet commander. | Osiossa on Hive Mind -vaikutukset komentajan sijaan. |
| S1087 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | TAU ORBITALS Orbitals can be used when planetary defences are allowed. | Tau-listojen puolustusosiossa vain orbitaalit (build_data.py:5984). (poimintavika: heading) |
| S1088 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | The Tau may spend their points allocation for planetary defences on orbitals. | Sama. |
| S1089 | F452 | Tau/Commerce Protection, Tau/Merchant Fleet | The Tau may not use any other form of planetary defence. | Muita puolustuksia ei tarjota (build_data.py:5880). |
| S1100 | F454 | Tau/Commerce Protection, Tau/Merchant Fleet | the commander may be either a Kor’O or Kor’el. | Osion 0-1 ja kaksi riviä; pieni alkukirjain on kirjan. |
| S1115 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Your fleet may include mercenaries chosen from the following, subject to the relevant restrictions. | Palkkasoturiosiot listalla. |
| S1123 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Orbitals can be used when planetary defences are allowed. | Sama kuin S1087, puolustusosiossa. (poimintavika: dup) |
| S1145 | F483 | Demiurg/War Host | Tau fleets (and other races whose fleet list specifically include the Demiurg) ignore these restrictions and should instead select Demiur... | Tau-listoilla Demiurg-rivit ovat listan omia. |
| S1160 | F486 | Demiurg/War Host | A Demiurg fleet may purchase re-rolls, but they are purchased by the fleet as a whole, rather than being considered Fleet Commander re-ro... | Re-rollit omassa osiossaan. |

### no_limit (18)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0085 | F49 | IN/Bakka Sector | There is no restriction for the number of Endurance light cruisers taken in a Bakka fleet. | Ei rajaa = ei valvottavaa. Varmista, ettei Bakalle ole periytynyt Endurance-rajaa. **[ajo ok]** |
| S0237 | F121 | AdMech/Explorator | ESCORTS You may have any number of Adeptus Mechanicus escorts in the fleet, chosen from the fleet list on the next page. | Ei saattajarajaa; rivit ovat listalla. (poimintavika: heading) |
| S0400 | F178 | RT/Pirates and Wolf Packs | Otherwise there are no restrictions on how many Chaos and/or Imperial cruisers are in a single pirate fleet. | Ei lisärajaa. |
| S0419 | F227 | 6 listaa | Any number of capital ships can be upgraded to Daemon ships subject to these limitations. | Ei yleistä rajaa; jumalalistojen osuudet ovat upgrade_ratio-sääntöinä. |
| S0506 | F235 | Chaos/Black Crusade | Any number of capital ships in your fleet may be upgraded to a Daemon ship at the additional points cost shown, based upon the type of ve... | Ei rajaa; rivi kiinnittyy aluksen tyyppiin. |
| S0643 | F318 | Eldar/Iyanden Craftworld | Your fleet may include any number of Wraithships. | Ei rajaa. |
| S0814 | F367 | Orks/Waaagh! | You can include any number of Ork Roks in your fleet. | Ei rajaa. |
| S0864 | F371 | Orks/Da Ork Clanz | The following gubbins can be taken by any number of capital ships in the fleet. | More Gubbins ilman budjettia. |
| S1040 | F429 | Tyranids/Vanguard Fleet | Your fleet may include any number of Vanguard drone ships. | Ei rajaa. |
| S1042 | F429 | Tyranids/Vanguard Fleet | Your fleet may include any number of Kraken. | Ei rajaa. |
| S1099 | F454 | Tau/Commerce Protection, Tau/Merchant Fleet | Your fleet may include a fleet commander to lead it if you wish. | Vapaaehtoinen komentaja (750 pisteen sääntö on erikseen). |
| S1103 | F454 | Tau/Merchant Fleet | Your fleet may include any number of battleships. | Ei rajaa. |
| S1104 | F454 | Tau/Merchant Fleet | Your fleet may include any number of Merchant class starships. | Ei rajaa. |
| S1105 | F454 | Tau/Merchant Fleet | Your fleet may include any number of Defender class starships. | Ei rajaa. |
| S1125 | F456 | Tau/Commerce Protection | Your fleet may include any number of Explorer battleships. | Ei rajaa. |
| S1130 | F456 | Tau/Commerce Protection | Your fleet may include any number of Merchant, Emissary or Protector class starships. | Ei rajaa. |
| S1131 | F456 | Tau/Commerce Protection | Your fleet may include any number of Defender and/or Castellan class starships. | Ei rajaa. |
| S1132 | F457 | Tau/Commerce Protection | Warspheres do not count against cruiser limits in a Kor’vattra Fleet. | Listalla ei ole risteilijäkattoa (referenssi 31 #261). |

### squadron_unit (10)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0242 | F121 | AdMech/Explorator | If taken, all the escorts in a squadron must take this refit, not just individual escorts in the squadron. | Laivue on yksi yksikkö ja hinta on per runko, joten koko laivue ottaa refitin. |
| S0350 | F174 | RT | Heavy transports may not be in squadrons with other transport types. | Yksi rivi = yksi laivue; heavy transportit ovat omalla rivillään. |
| S0377 | F177 | RT/Exploration | Heavy transports may also be taken but not in squadrons with other transport types. | Heavy transportit omalla rivillään = oma laivue. |
| S0624 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Corsair Eldar escorts and Shadowhunters may not be in the same squadron. | Eri rivit = eri laivueet. |
| S0652 | F319 | Eldar/Iyanden Craftworld | These may be organized in squadrons in any mix desired, but Corsair Eldar escorts and Shadowhunters may not be in the same squadron. | Eri rivit = eri laivueet. |
| S0809 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | If this option is taken, every escort in a given squadron must take the refit, not just individual escorts in a squadron. | Per runko -hinta ja laivue = yksi yksikkö. |
| S0834 | F373 | Orks/Da Ork Clanz | Each skwadron must be fielded with the number of ships chosen for it in this list; you can’t split up skwadrons or add more ships to them. | Laivue on yksi yksikkö; sitä ei voi jakaa. |
| S1109 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | They may not be combined with Orcas. | Eri rivit = eri laivueet. |
| S1114 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Orcas may not be squadroned with any other form of escort. | Orcat omalla rivillään. |
| S1122 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Dhows may not be squadroned with any other form of escort. | Dhowt omalla rivillään. |

### ship_type (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0167 | F101 | SM/Dominion | For purposes of choosing reserves, battle barges count as battleships, and strike cruisers count as cruisers for the selection of any cru... | Profiilien rt-kenttä tekee jo battle bargesta battleshipin ja strike cruiserista cruiserin (build_data.py:5308). |
| S0401 | F178 | RT/Pirates and Wolf Packs | These count as cruisers for fleet building. | Lasketaan per_points-risteilijäsääntöön. |
| S1166 | F487 | Demiurg/War Host | These do not count against the number of cruisers in the fleet. | Kroot Vessels omana osionaan, risteilijäkatto laskee vain Cruisers-osion (referenssi 32 #267). |

### list_gate (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0123 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Thunderhawk Annihilator The Thunderhawk Annihilator is a specialized gunship employed only by crusading Chapters. | Annihilator vain Crusade-listalle: kortin sääntö on porttiin sidottu (SPECIAL_WEAPON_RULES, referenssi 05 #37). Lause näkyy silti Codexissa ja Dominionissa yhteisenä tekstinä. |
| S0323 | F144 | Grey Knights | (Note: Grey Knights may not take Thunderhawk annihilators) | Annihilator-sääntö vain Crusade-kortilla. |

### defence_points (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0039 | F498 | 32 listaa | However, these additional defences come directly from the points allowed against his or her fleet list. | Puolustukset lasketaan laivaston pisterajaan (domain.js:3973). |

### row_attach (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0068 | F40 | IN/Armageddon Sector | The cost of your re-rolls depends on the commander you choose (ie you cannot choose to buy Master of the Fleet re-rolls if your fleet is ... | Admiral Re-rolls -rivit tarjotaan vain amiraalille ja MoF-rivit vain MoF:lle (ajo 20.10.). **[ajo ok]** |

### vbb (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0179 | F102 | SM/Dominion | A Venerable battle barge not equipped with launch bays cannot take Thunderhawks. | Baytön runko ei saa Thunderhawkeja; malli lisää ne vain bayhin. |

### swap_exclusive (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0233 | F121 | AdMech/Explorator | With the exception of choosing between prow torpedoes or Nova Cannon, Mechanicus vessels can take any combination, all or none of these i... | Torpedot voi vaihtaa vain kerran (swp vaatii 'has prow torpedo'); muut parannukset vapaasti. |

### list_choice (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0627 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The fleet list chosen becomes the parent fleet when it comes to using reserve ships from the other fleet. | Valittu lista on isäntä; lainaus kulkee 1.1-mekanismilla. |

### group_rule (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0896 | F369 | Orks/Da Ork Clanz | Clan upgrades are different from Gubbins and may be taken (and paid for) in addition to Gubbins by individual skwadrons. | Klaani- ja Gubbins-rivit eri ryhmissä. |

## ROSKA: Poimintavika (23 uniikkia, 33 esiintymää)

### table_merge (11)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0114 | F94 | SM/Codex Astartes, SM/Crusade, SM/Dominion | D6 ROLL LEADERSHIP 1-2 Ld 8 3-4 Ld 9 5-6 Ld 10 ATTACK RATING Space Marines have a starting attack or initiative rating of 3. | Ld-taulukko ja ATTACK RATING -kappale samassa lauseessa. Jaettava: taulukko = PELI, attack rating 3 = LASKETTAVA. |
| S0185 | F118 (osittain) | AdMech/Explorator | To determine base leadership for a given vessel, roll a D6 against the following table: D6 ROLL LEADERSHIP Ld 7 2-3 Ld 8 4-6 Ld 9 Any ves... | Ld-taulukko (rivi '1' puuttuu) ja Gifts-valinta kuutosella samassa lauseessa. Sisältö PELI. (poimintavika: table) |
| S0417 | F227 (osittain) | 6 listaa | The points cost to upgrade a capital ship to a Daemon ship is as follows: Battleship....................................................+... | Hintalista pistejonoineen ja komentajakielto yhdessä. Hinnat ovat riveinä; komentajakielto (Warmaster/Lord ei Daemonshipillä) = aboard. (poimintavika: table) |
| S0655 | F345 (osittain) | Dark Eldar/Pirates | Roll a dice for each point of the Phantom lance’s strength when firing, with the following effects: D6 ROLL EFFECT 1-3 No hits 1 hit 5-6 ... | Phantom lance -taulukko (rivi 4 puuttuu) ja ORDNANCE-otsikko. Sisältö PELI. (poimintavika: table) |
| S0715 | F351 (osittain) | Dark Eldar/Pirates | Torture class cruisers may choose one of the following for the points shown: 1–2 Impaler Assault Modules.........+20 /+40 pts Torture cla... | Hintalistan katkelma ja Mimic Engines -otsikko. Optiot ovat Torturen profiilissa toisensa poissulkevina (referenssi 22 #170). (poimintavika: table) |
| S0900 | F369 (osittain) | Orks/Da Ork Clanz | /Black The Goffs are the most aggressive of the Ork clans, born fighters amongst a race born for fighting. | Hintarivin väri '/Black' liimattu Goffien kerronnan alkuun. (poimintavika: table) |
| S0902 | F369 | Orks/Da Ork Clanz | /Red Evil Sunz are obsessed with speed, endlessly tinkering with the engines of all their vehicles and ships, trying to get as much speed... | '/Red' + Evil Sunz -kerronta. (poimintavika: table) |
| S0904 | F369 | Orks/Da Ork Clanz | /Yellow Bad Moonz are the richest of the clans, using their own fast-growing teeth as currency. | '/Yellow' + kerronta. (poimintavika: table) |
| S0906 | F369 | Orks/Da Ork Clanz | /Blue The Deathskulls are the masters of salvage. | '/Blue' + kerronta. (poimintavika: table) |
| S0911 | F369 | Orks/Da Ork Clanz | /Brown The Snakebites are a primitive clan (even by Ork standards) and use technology only reluctantly. | '/Brown' + kerronta. (poimintavika: table) |
| S1032 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | /launch bay Ships equipped with assault boat launch bays can exchange all their launch bays for spore mine launchers. | Hintarivin jäänne '/launch bay' + Mega-Spore Mines -kuvaus. (poimintavika: table) |

### sentence_split (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0171 | F102 | SM/Dominion | In addition to their fleet list, any Space Marine fleet may include a single – meaning only one! | Lause katkeaa ajatusviivaan; jatko on S0172. Sisältö (yksi VBB) on valvottu. |
| S0172 | F102 (osittain) | SM/Dominion | – Venerable battle barge, which may be any Imperial or Chaos (painted appropriately of course!) battleship, grand cruiser, battlecruiser ... | S0171:n jatko. Runkovalinta on toteutettu (domain.js:1265, HULL_CHOICES). |
| S0529 | F235 (osittain) | Chaos/Tzeentch | A ship with a Chaos Space Marine crew may be equipped with Thunderhawk Gunships but if so it may only carry | Lause katkeaa ('it may only carry'). Sama kuin S0512. (poimintavika: split) |
| S0810 | F366 | Orks/Waaagh! | and may be used instead of the Ork pirate fleet list. | Katkelma, alku osion otsikossa. Sisältö kerrontaa. (poimintavika: split) |

### section_title_fragment (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0299 | F139 | The Emperor's Inquisition | independent and will only grudgingly submit to having their leadership usurped by an Inquisitor Lord, regardless of his renown. | Osion otsikoksi on poimittu lauseen alku 'Space Marine Chapters are fiercely'; tämä on jatko. (poimintavika: split) |
| S0353 | F174 | RT | represents a Kar Durniash pattern Imperial Navy cruiser, a basic profile on which a Rogue Trader may customize as desired using the Xenot... | Osion otsikko on lauseen alku. Sisältö kerrontaa. (poimintavika: split) |
| S0541 | F242 | Chaos/Khorne, Chaos/Nurgle, Chaos/Slaanesh | equipped with Thunderhawk Gunships but if so it may only carry Thunderhawks and may not launch Swiftdeaths, Doomfires and Dreadclaws. | Osion otsikko 'Marine crew may be' on lauseen keskeltä. Sisältö: CSM-miehistön Thunderhawk-rivi (KUVAUS). (poimintavika: split) |

### sentence_merge (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0329 | F144 | Grey Knights | (Note: above two points are not to be applied to Grey Knight or Space Marine vessels as these already include this upgrade) An Inquisitor... | Huomautus ja re-roll-lause yhdessä. Sisältö: re-rollit riveinä (KUVAUS). (poimintavika: split) |
| S1060 | F431 (osittain) | Tyranids/Hive Fleet | A Vanguard drone ship must be armed with one weapon chosen from the following list: The fleet must have at least six escort drones for ev... | Vanguard-otsikko ja 'at least six escort drones' yhdessä. Jälkimmäinen on valvottu (min_ratio Escort drones per hive ship). (poimintavika: split) |
| S1062 | F431 (osittain) | Tyranids/Hive Fleet | A Tyranid escort drone must be armed with one weapon chosen from the following list: A Kraken must be armed with one weapon chosen from t... | Kaksi luettelon otsikkoa yhdessä. Sisältö: pakollinen asevalinta (mandatory_choice). (poimintavika: split) |

### subplot (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0209 | F120 (osittain) | AdMech/Explorator | In addition to any subplots that may be taken D6 ROLL QUEST FOR KNOWLEDGE Extended Duty: The Quest for Knowledge can be long and arduous,... | Lause katkeaa sivun palstanvaihtoon; jatko on S0229 ('normally as desired...'). Välissä taulukon otsikko ja rivi 1. Sisältö: Quest for Knowledge -alajuoni. (poimintavika: split) |
| S0229 | F121 | AdMech/Explorator | normally as desired, a fleet including any Adeptus Mechanicus capital ships must roll a single D6 against the following subplot table: WE... | S0209:n jatko + WEAPONS OF THE ADEPTUS MECHANICUS -otsikko ja kerronta samassa lauseessa. (poimintavika: split) |

## KUVAUS: Rivin tai päivityksen kuvaus (121 uniikkia, 231 esiintymää)

### option_price (33)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0087 | F49 | IN/Bakka Sector | They may also take torpedo bombers for +10 points per launch bay. | Torpedo bombers -rivin hinta (upgrades.py:453). |
| S0143 | F97 | SM/Codex Astartes, SM/Crusade, SM/Dominion | In addition, the Master of the Fleet’s ship may carry a Terminator boarding party: | Johdanto Terminator-riville (kaksoispiste lopussa). Varmista rivi ja sen ehto (MoF:n alus). **[ajo ok]** |
| S0152 | F99 | SM/Crusade | Any battle barge or strike cruiser in the fleet may be equipped with an Honour Guard for +10 points per ship. | Honour Guard -rivin hinta ja ehto (battle barge tai strike cruiser). Varmista rivin cond. **[ajo ok]** |
| S0162 | F100 | SM/Dominion | In addition, a ship led by a Space Marine Captain may carry Honour Guard. | SM-kapteenin alus saa Honour Guardin. Varmista, että Honour Guard -rivin ehto sallii kapteenin IN-aluksen. **[koodi luettu]** |
| S0173 | F102 | SM/Dominion | The normal cost must be paid for the ship, plus an additional +35 points for the cost of the Space Marine crew. | +35 miehistöstä lasketaan hintaan (domain.js:1266). |
| S0277 | F125 | AdMech/Explorator | Mechanicus vessels equipped with launch bays may also take torpedo bombers for +10 points per launch bay. | Torpedo bombers -rivi (upgrades.py:453). |
| S0313 | F141 | The Emperor's Inquisition | Alternatively, the refit may be selected for +5 points. | 'Choose the Xenotech refit instead of rolling' -rivi (upgrades.py:638). |
| S0327 | F144 (osittain) | Grey Knights | Ordo Malleus Inquisitor Lord (Ld 10) ............................................................+100 pts A vessel embarking an Ordo Mall... | Hintarivi pistejonoineen ja vaikutuksen alku samassa lauseessa. (poimintavika: table) |
| S0359 | F175 | RT | To represent this each Rogue Trader cruiser and escort squadron may roll one random crew skill on [???] in the Remastered Rulebook for +1... | Crew skill +10 % -rivit (J44). |
| S0360 | F175 | RT | In addition, each Rogue Trader vessel may roll randomly against the Xenotech System table below for +15 points per cruiser or +5 points p... | Xenotech-rivit (upgrades.py:500). |
| S0361 | F175 | RT | For an additional +5 points per ship, the player can select the desired technology instead of rolling randomly for it. | 'Choose the Xenotech System' -rivi (upgrades.py:512). |
| S0501 | F234 | Chaos/Black Crusade | Any capital ship can be designated as having a Chaos Space Marine crew at +35 points. | CSM-miehistö +35, cond cap ja ei Daemonship (upgrades.py:355). |
| S0516 | F236 | Chaos/Tzeentch | A Lord may be given a Mark of Tzeentch, providing a re-roll (which he can use for his own ship or squadron only) for +25 points. | Lordin Mark of Tzeentch +25 re-rollin kanssa. |
| S0519 | F236 | Chaos/Tzeentch | Any capital ship can be designated as having a Thousand Sons Chaos Space Marine crew at +35 points. | Thousand Sons -miehistö +35. |
| S0534 | F240 | Chaos/Nurgle | Any capital ship can be designated as having a Death Guard Chaos Space Marine crew at +35 points. | Death Guard -miehistö +35. |
| S0544 | F244 | Chaos/Khorne | Any capital ship can be designated as having a World Eaters Chaos Space Marine crew at +35 points. | World Eaters -miehistö +35. |
| S0553 | F248 | Chaos/Slaanesh | Any capital ship can be designated as having a Emperor's Children Chaos Space Marine crew at +35 points. | Emperor's Children -miehistö +35. |
| S0644 | F318 | Eldar/Iyanden Craftworld | Any capital ship in the fleet may be upgraded to a Ghostship. | Ghostship-rivi. |
| S0646 | F318 | Eldar/Iyanden Craftworld | Any capital ship in the fleet may be equipped with Aspect Warriors, serving as the ship’s fighting crew. | Aspect Warrior Host -rivi. |
| S0648 | F319 | Eldar/Iyanden Craftworld | Attack craft carriers may also be equipped with torpedo bombers for +15 points per launch bay, with these functioning the same way as oth... | Torpedo bombers +15 / bay. |
| S0675 | F347 | Dark Eldar/Pirates | Leech Torpedoes Dark Eldar ships armed with torpedoes may use leech torpedoes at no extra cost. | Leech torpedoes -rivi 0 pts (upgrades.py:657). (poimintavika: heading) |
| S0719 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | ORDNANCE Boarding Torpedoes Any capital ship in the Ork fleet list armed with torpedoes can use boarding torpedoes for +5 points. | Boarding torpedoes +5 Ork capital shipeille (upgrades.py:681; J189: Rok ja hulk eivät capital). (poimintavika: heading) |
| S0720 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | A Space Hulk may use boarding torpedoes for +15 points. | Space Hulk boarding torpedoes +15 (upgrades.py:685). |
| S0736 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Torpedo-bommas may be taken by any ship equipped with launch bays for +10 points per launch bay strength. | Torpedo-bommaz +10 / bay (upgrades.py:676). |
| S0739 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Ork Orbital Mines Orks may buy orbital mines like other fleets at +5 pts per (maximal) launch bay strength and minefields for the normal ... | Ork orbital mines -rivi (build_data.py:3875). (poimintavika: heading) |
| S0807 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | Ork capital ships can add +2 turrets to their ships for +20 points (this is not the same thing as saying “up to two turrets at +10 points... | Dakka Dakka +2 turrets -rivi (upgrades.py:432). |
| S0808 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | Ork escorts may add +1 turret for +5 points per escort. | Saattajien Dakka Dakka. |
| S0832 | F372 | Orks/Da Ork Clanz | They may take torpedo- bommas for +10 points per launch bay (counting maximum number of launch bays). | Torpedo-bommaz-rivi. |
| S0833 | F372 | Orks/Da Ork Clanz | Ork capital ships that use torpedoes may use boarding torpedoes for +5 points. | Boarding torpedoes -rivi. |
| S0892 | F369 | Orks/Da Ork Clanz | Any skwadron can be given a clan upgrade by paying the points cost shown, but the squadron must show clan colours. | Klaanipäivitys riveinä; värivaatimus on mallisääntö. |
| S1066 | F431 | Tyranids/Hive Fleet | This should all be fairly self-explanatory, but one thing to remember is that when buying ‘port/ starboard weapons’ the points cost indic... | Port/starboard-hinta on pari; rivin kuvaukseksi. |
| S1097 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | Improved Logic Engines: +10 pts As a revered fleet commander, his vessel takes advantage of the very best technology the Fio Caste can pr... | Improved Logic Engines +10. (poimintavika: heading) |
| S1170 | F487 | Demiurg/War Host | They do not have access to boarding torpedoes but may use torpedo bombers for +10 points per launch bay. | Torpedo bombers -rivi; boarding torpedo -riviä ei tarjota. |

### option_effect (24)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0103 | F50 | IN/Bakka Sector | Two turrets on a ship are exchanged for fleet defence turrets capable of protecting itself or any one other vessel within 15 cm each ordn... | Fleet Defence Turretsin vaikutus; rivin kuvaukseksi ja kortille. |
| S0105 | F50 | IN/Bakka Sector | It does not count against refits ships can take normally. | Ei lasketa refitiksi (kampanja); rivin kuvaukseksi. |
| S0121 | F95 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Any vessel that earns or pays for a refit to carry Thunderhawks may then ONLY carry them, and its launch bay capacity is reduced by half ... | Thunderhawk-refitin vaikutus (vain Thunderhawkit, bayt puolitetaan). Koskee rivejä kuten Inquisitorin 'Thunderhawks, launch bays halved' ja Venerable-runkoa; rivin kuvaukseksi. |
| S0546 | F244 | Chaos/Khorne | Any ships with the Mark of Khorne conducting a boarding action may roll D3 extra critical damage rolls if desired, but then it may not ta... | Berzerker Tide -päivityksen vaikutus; rivin ehto ROW_CONDS (upgrades.py:94). |
| S0738 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When taken, torpedo-bommas are an additional ordnance choice available to the carrier and do not replace fighta-bommas. | Lisävalinta, ei korvaa fighta-bommazeja; rivin kuvaukseksi. |
| S0802 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | The ship may re-roll the dice for the firepower of its gunz when it fires. | Päivityksen vaikutus. |
| S0803 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | The ship may re-roll the dice for damage control. | Päivityksen vaikutus. |
| S0804 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | The ship’s shield value is increased by +1. | Extra Power Fields. |
| S0805 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | +1 modifier on boarding. | Mega-armoured Boarding Parties. |
| S0806 | F365 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The ship may re-roll the dice for the strength of torpedo salvoes when it fires. | Looted Torpedoes. |
| S0853 | F370 | Orks/Da Ork Clanz | The ship gains +5 cm speed, and it rolls 4D6 cm when on All Ahead Full special orders. | Soopa Boostas. |
| S0854 | F370 | Orks/Da Ork Clanz | (Not for escorts) The ship’s shield value is increased by +1. | Extra Power Fields; 'Not for escorts' valvottu ROW_CONDS cap=1. |
| S0855 | F370 | Orks/Da Ork Clanz | The ship gains +2 Turrets (Escorts get +1 Turret). | Extra Turrets. |
| S0857 | F370 | Orks/Da Ork Clanz | (Not for escorts.) The ship’s turret value is replaced by D3 turrets. | Maniac Turrets; ei saattajille (ROW_CONDS). |
| S0859 | F370 | Orks/Da Ork Clanz | Any heavy gunz batteries on the ship can be replaced with a Strength-2 lance battery. | Shokk-Attack Lance -vaihto. |
| S0860 | F370 | Orks/Da Ork Clanz | Range is 15 cm for escorts, 30 cm for capital ships. | Edellisen kantama. |
| S0861 | F370 | Orks/Da Ork Clanz | (Not for escorts.) The ship may re-roll the dice when repairing critical damage. | Mad Meks. |
| S0862 | F370 | Orks/Da Ork Clanz | (Not for escorts.) This adds +1 bonus when rolling a leadership check to ram and causes 1Hp before rolling to inflict damage. | Prow Ram. |
| S0863 | F371 | Orks/Da Ork Clanz | (Not for escorts.) Hit-and-run teleport attacks can be made to 30 cm. | Tellyporta. |
| S0866 | F371 | Orks/Da Ork Clanz | (Not for escorts except the Grunt at +5 points per escort.) Klaws are unaffected by special orders of any kind but cannot be used by capi... | Klaws; Gruntin oma optio (upgrades.py:294). |
| S0874 | F371 | Orks/Da Ork Clanz | (Not for escorts.) A ship’s prow heavy gunz batteries can be replaced with this weapon, which cannot be used if the ship is crippled or b... | Snotling launcha -vaihto; ei saattajille. |
| S0883 | F371 | Orks/Da Ork Clanz | It takes boarding torpedoes for free, but it may only use assault boats. | Assault Karrier (upgrades.py:209). |
| S0884 | F371 | Orks/Da Ork Clanz | It may launch +1 assault boat marker each time it launches attack craft normally (even if crippled or braced, but not both). | Assault Karrier. |
| S1098 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | His ship can be refitted with Improved Logic Engines enabling his vessel to avoid leadership effects for being in contact with blast mark... | Rivin vaikutus (upgrades.py:667). |

### reroll_price (18)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0028 | F138 | 9 listaa | A second re-roll can be purchased for +25 points. | Toisen re-rollin hinta; rivi on olemassa (upgrades.py:539). |
| S0076 | F48 | IN/Bakka Sector | Additional re-rolls may be purchased for the listed point costs (including for Admiral Rath). | Lisä-re-rollit riveinä. |
| S0142 | F97 | SM/Codex Astartes, SM/Dominion | You may buy Fleet Commander re-rolls for your Master of the Fleet. | Re-rollit ovat komentajan riveinä. |
| S0147 | F98 | SM/Crusade | You may buy Fleet Commander re-rolls for your Master of the Fleet, that can be used by the entire fleet. | MoF-re-rollien käyttöalue; komentajakortille. |
| S0148 | F98 | SM/Crusade | As the base of operations for the entire Chapter, the fortress-monastery may purchase re-rolls, which it may use for its own command chec... | Fortress-monasteryn omat re-rollit (upgrades.py:272). |
| S0272 | F124 | AdMech/Explorator | If you wish to give a Mechanicus Archmagos any fleet commander re-rolls, you'll have to pay for them. | Re-rollit maksetaan riveinä. |
| S0393 | F178 | RT/Pirates and Wolf Packs | A Pirate Captain gets one re-roll, and may purchase up to two more re-rolls for +25 points each. | Re-rollit riveinä. |
| S0493 | F234 | 5 listaa | The Warmaster may be given an extra re-roll at a cost of +25 points. | Lisä-re-roll +25 (upgrades.py:336). |
| S0497 | F234 | Chaos/Black Crusade | A Lord may be given a re-roll (which he can use for his own ship or squadron only) at +25 points. | Lordin re-roll +25 (upgrades.py:351). |
| S0532 | F240 | Chaos/Khorne, Chaos/Nurgle, Chaos/Slaanesh | A Lord may be given a re-roll (which he can use for his own ship or squadron only) for +25 points. | Lordin re-roll +25. |
| S0616 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | You may purchase Fleet Commander re-rolls for your Pirate Prince by paying the cost listed below. | Re-rollit riveinä. |
| S0619 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | You may purchase Fleet Commander re-rolls for your Eldar Hero by paying the cost listed below. | Re-rollit riveinä. |
| S0630 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | He has one re-roll as part of his point cost, but a second or third re-roll can be purchased at +25 points each. | Sisältyvä re-roll + 25 pts lisät. |
| S0639 | F318 | Eldar/Iyanden Craftworld | The fleet commander may purchase a re-roll, at the cost listed below: | Re-roll-rivi. |
| S0714 | F351 | Dark Eldar/Pirates | You may purchase Fleet Commander re-rolls for your Dread Archon by paying the cost listed below. | Re-rollit riveinä. |
| S0800 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | They can have up to two more re-rolls for the additional cost noted below. | Re-rollit riveinä. |
| S0820 | F372 | Orks/Da Ork Clanz | A Warlord has one re-roll, and may purchase one or two more for the points cost shown below. | Re-rollit riveinä. |
| S1054 | F430 | Tyranids/Hive Fleet | Hive Mind Influence re-rolls work in the same way as normal fleet commander re-rolls. | Influence re-rollit. |

### rerolls_included (14)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0021 | F35 | IN/Bastion Fleets, IN/Gothic Sector | Admirals get one Fleet Commander re-roll included in their points cost. | Hintaan sisältyvä re-roll; sanotaan komentajakortilla ja rivillä (J160). **[ajo ok]** |
| S0027 | F138 | 9 listaa | An Inquisitor Lord gets one re-roll, which may be used for any ship in the fleet. | Komentajan sisältyvä re-roll; komentajakortille. |
| S0053 | F38 | IN/Bastion Fleets | A Veteran Captain gets one re-roll which is included in their points cost and can only be used on their own vessel or another vessel in t... | Sisältyvä re-roll ja sen käyttöalue; komentajakortille. **[koodi luettu]** |
| S0067 | F40 | IN/Armageddon Sector | Your fleet commander gets a single re-roll included in his points cost, and may buy more if you wish. | Sisältyvä re-roll; komentajakortille. |
| S0075 | F48 | IN/Bakka Sector | Admirals get one Fleet Commander re-roll included in their points cost (Lord Admiral Rath has two). | Sisältyvät re-rollit (Rath kaksi); komentajakortille. |
| S0077 | F48 | IN/Bakka Sector | Lord Admiral Rath is Ld 10 and comes with two re-rolls as part of his point cost. | Rathin Ld 10 ja kaksi re-rollia; komentajarivin kuvaus. |
| S0346 | F174 | RT, RT/Exploration | A Veteran Rogue Trader gets one re-roll, which may be used for his vessel or an accompanying Rogue Trader escort squadron. | Sisältyvä re-roll; komentajakortille. |
| S0475 | F231 | 6 listaa | Re-rolls: 1 per turn. | Re-roll per vuoro. |
| S0476 | F231 | 6 listaa | Abaddon’s fleet is allowed to re-roll a single Command check or Leadership test each turn. | Re-roll per vuoro; _AB_RR (build_data.py:5746). |
| S0478 | F232 | 6 listaa | Chaos Warmasters get one re-roll. | Sisältyvä re-roll. |
| S0494 | F234 (osittain) | Chaos/Black Crusade | Abaddon receives one re-roll per turn, in addition see his special rules on pg 74[??] | Abaddonin re-roll; kirjan oma rikkinäinen viite 'pg 74[??]' (oikea s.231). |
| S0799 | F365 | Orks/Cyclops Cluster, Orks/Waaagh! | Warlords get one re-roll. | Sisältyvä re-roll. |
| S0966 | F404 | Demiurg/War Host, Necrons/Harvest Fleet | The fleet gets one re-roll and can purchase extra re-rolls at the cost shown. | Yksi ilmainen re-roll + rivit (Necrons ja Demiurg s.486). |
| S1101 | F454 | Tau/Commerce Protection, Tau/Merchant Fleet | The commander has one re-roll included in his points cost. | Sisältyvä re-roll. |

### row_desc_dup (13)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0901 | F369 | Orks/Da Ork Clanz | All Goff ships (including tiddla skwadrons) gain a +1 bonus to the dice roll during boarding actions and a +1 Leadership bonus when attem... | Sama teksti on jo klaanirivin kuvauksena (upgrades.py:212). |
| S0903 | F369 | Orks/Da Ork Clanz | All Evil Sunz ships gain +5 cm speed. | Rivin kuvauksena ja mod sp=5 (upgrades.py:214). |
| S0908 | F369 | Orks/Da Ork Clanz | The Warlord’s ship may take one refit from the Imperial Navy refit table (rolled randomly) for +20 points. | Blood Axes -rivin kuvauksessa (upgrades.py:220). |
| S1012 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship gains +5 cm speed. | Rivin kuvauksena (upgrades.py:226). |
| S1014 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship gains +1D6 when on All Ahead Full special orders. | Adrenaline Sacs -rivin kuvaus. |
| S1016 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Any enemy vessels within 15 cm suffer -2 Ld. | Psychic Scream -rivin kuvaus. |
| S1018 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The creature reduces the distance it needs to move before turning by 5 cm. | More Discharge Vents -rivin kuvaus. |
| S1019 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship gains one spore cyst. | Extra Spore Cysts -rivin kuvaus. |
| S1023 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship gains +1 Hit. | Reinforced Carapace -rivin kuvaus. |
| S1027 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Bombers and assault boats suffer a -1 modifier (in addition to any other modifiers) when rolling their Attack roll, and all torpedoes mus... | Mucous Membrane -rivin kuvaus. |
| S1028 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio-ship has enhanced its ability to heal critical wounds, enabling capital ships to roll two extra dice in the End phase when attemp... | Accelerated Healing -rivin kuvaus. |
| S1030 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | When within 15 cm of a Vanguard drone ship, all pyro-acid batteries benefit from a left shift on the Gunnery table (before all other modi... | Drone Link -rivin kuvaus. |
| S1033 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Each launch bay can launch one mega-spore mine In the Ordnance phase Mega-spore mines follow all movement and ordnance rules mines do on ... | Mega-Spore Mines -rivin kuvaus (upgrades.py:250); kirjan oma viite '[???]'. |

### ship_option_pointer (6)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0023 | F35 | IN/Armageddon Sector, IN/Bastion Fleets, IN/Gothic Sector | Some ships may carry Shark assault boats at an additional cost. | Viittaus alusten omiin optioihin (Emperor s.53, Oberon s.56, Exorcist s.59), jotka ovat jo aluksen optioina. Osion tekstinä turha. |
| S0088 | F49 | IN/Bakka Sector | An Emperor class battleship may carry Shark assault boats at an additional cost of +5 points. | Sama osto kuin Emperorin oma optio s.53, jonka sovellus myy kerran (pistokoe 15). |
| S0235 | F121 | AdMech/Explorator | They can also upgrade their prow armour to 6+ at no cost. | Keulapanssari 6+ on jo Endeavourin ja Endurancen profiilioptio (OPT_EFFECTS s.72–76). Varmista, että AdMechin Endeavour-rivi saa profiilin option. **[ajo ok]** |
| S0236 | F121 | AdMech/Explorator | However, if this option is taken, their turning radius is reduced to 45 degrees. | Edellisen hinta: kääntösäde 45°, kuuluu profiilioptioon. |
| S0716 | F351 | Dark Eldar/Pirates | Corsair class escorts may add Mimic Engines: | Mimic Engines -luettelon otsikko ilman luetteloa. Varmista, että Mimic Engines on Corsair-saattajan optiona. **[ajo ok]** (poimintavika: split) |
| S0818 | F367 | Orks/Waaagh! | Kill kroozers and Terror ships can replace their prow batteries with torpedo tubes at no extra cost. | Sama vaihto on aluksen profiilissa (s.380, 382). |

### commander_stats (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0474 | F231 | 6 listaa | He has the following characteristics: Leadership: 10 Abaddon is an exceptional commander in all respects. | Abaddon Ld 10; komentajarivin kuvaus. (poimintavika: heading) |
| S0628 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | He is accompanied by the fiercest members of Yriel’s own pirate warband, which count as an Aspect Warrior host. | Yrielin warband = Aspect Warrior host; komentajakortille. |
| S0629 | F319 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | His vessel is equipped with Vampire raiders. | Vampire raiders Yrielin aluksella; kortille. |
| S1095 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | Leadership: 9 Re-rolls: 2 Aun’Shear, a revered member of the Ethereal Caste and a close personal friend, always accompanies Kor’O’Mesme. | Mesmen Ld 9 ja kaksi re-rollia; komentajakortilla (domain.js:3533). |
| S1096 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | Excellent Pilots His love of flight has never diminished, and he continues to fly a fighter out of his own hangar bays, true to his name ... | Excellent Pilots -otsikko + kerronta; vaikutus on kortilla. (poimintavika: heading) |

### intro (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0996 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | It may also be given some ‘fixed’ weapons (including the number of spores it can launch). | Selittää profiilin rakenteen. |
| S0997 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The rest of the entry details the various weapon options available, which can be purchased at the appropriate points cost as shown in the... | Selittää aserivit. |
| S1044 | F429 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Tyranids do not follow the normal squadron rules when forming up the fleet. | Johdanto laivuesääntöön. |
| S1053 | F430 | Tyranids/Hive Fleet | These take the form of Hive Mind Influence re-rolls and Hive Mind Imperatives. | Nimeää rivit. |
| S1065 | F431 | Tyranids/Hive Fleet | Most Tyranid vessels are permitted to choose their weapons from a number of choices by paying the additional points cost indicated. | Johdanto. |

### power_ram (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0004 | F32 | 8 listaa | This is for any Imperial fleet list and does not count as a separate refit. | Power Ram -rivin selite: saatavilla kaikille Imperial-listoille, ei lasketa refitiksi (kampanja). Rivin kuvaukseksi. |

### special_torpedoes (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0278 | F125 (osittain) | AdMech/Explorator | All Adeptus Mechanicus capital ships that utilize torpedoes use ordinary torpedoes (not boarding torpedoes) and can be equipped with refi... | Tavalliset torpedot, ei boarding-torpedoja; refitted torpedoes s.19. Varmista, onko erikoistorpedoille rivi. **[ajo ok]** |

### row_offered (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0402 | F179 | RT/Pirates and Wolf Packs | While transports of various types are typically not included in a raiding fleet once they have been plundered, they can be used if desire... | Kuljetukset maksavat kuten rivillä. |

## TAUSTA: Kerronta, johdanto, esimerkki (89 uniikkia, 156 esiintymää)

### lore (62)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0034 | F142 | 6 listaa | An Ordo Malleus Inquisitor will only be called when intense demonic activity threatens to overrun an entire Sector. | Kerronta, joka johdattaa seuraavaan lauseeseen. |
| S0047 | F38 | IN/Bastion Fleets | Vast numbers of new, inexperienced sailors frequently have to be drawn up to replace those lost in the constant fighting (many of them dr... | Cadian kerronta. |
| S0054 | F39 | IN/Bastion Fleets | Whilst it is possible to keep the vessels themselves ready in this manner, Battlefleet Obscura simply does not possess the manpower to ke... | Reservilaivastojen kerronta. |
| S0055 | F39 | IN/Bastion Fleets | Instead, whole shipyards are filled with rows of silent, inactive vessels, often representing classes of ship now outdated or scarce. | Kerronta. |
| S0056 | F39 | IN/Bastion Fleets | As such a posting to a reserve fleet is an unnerving duty, forcing a sailor to enter deep into an unfamiliar vessel which may have lain d... | Kerronta. |
| S0057 | F39 | IN/Bastion Fleets | Reserve fleets are used only reluctantly by the Imperial Navy, and only in the most desperate of circumstances, but an invasion the size ... | Kerronta. |
| S0081 | F48 | IN/Bakka Sector | Only one member of this class, the venerable Dominus Astra, saw action against Hive Fleet Behemoth while serving as Lord Admiral Rath's f... | Dominus Astran tarina. |
| S0082 | F48 | IN/Bakka Sector | The Dominus Astra was never officially seen again although rumours abound of a mysterious ghost ship that appears from the warp in time o... | Tarina. |
| S0101 | F50 | IN/Bakka Sector | Though exceedingly complex, the Mechanicus of Bakka found a way to incorporate this on starships as a long-range turret that can be used ... | Kerronta. |
| S0107 | F91 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Most Astartes strike craft appear to carry at least three Gunships, which between them is sufficient to transport a company of Space Mari... | Kerronta. |
| S0108 | F91 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Battle barges are thought to carry at least nine Thunderhawks each and fortress monasteries might be able to carry thirty or more. | Kerronta. |
| S0109 | F91 | SM/Codex Astartes, SM/Crusade, SM/Dominion | A typical offensive against a rebel or alien-held planet begins with the arrival of strike craft which engage and clear away defending sy... | Kerronta. |
| S0110 | F91 | SM/Codex Astartes, SM/Crusade, SM/Dominion | However it is hard to imagine that the Adeptus Astartes would accept a ship to ship fight on any but the most favourable terms, instead o... | Kerronta. |
| S0111 | F91 | SM/Codex Astartes, SM/Crusade, SM/Dominion | I only pray that they remain on our side. | Sitaatti. |
| S0150 | F98 | SM/Crusade | They do not rule over great swaths of the Imperium as other Chapters might, and few of them even have a homeworld of their own. | Kerronta. |
| S0151 | F98 | SM/Crusade | Instead, these crusading armies endlessly roam the galaxy, engaged in near constant warfare with the Emperor’s enemies (or in some cases,... | Kerronta. |
| S0159 | F100 | SM/Dominion | Aside from the Space Marine vessels themselves, certain important Imperial Navy vessels within a Dominion Fleet may well have Space Marin... | Johdanto SM-kapteeneihin. |
| S0170 | F102 | SM/Dominion | The Space Wolves, a traditionally minded Chapter, is more immersed in the customs of its homeworld of Fenris than most Chapters and has a... | Space Wolves -kerronta. |
| S0191 | F118 | AdMech/Explorator | However, they will not allow their holy technology and precious knowledge fall into enemy hands. | Johdanto. |
| S0194 | F118 | AdMech/Explorator | VESSELS OF THE ADEPTUS MECHANICUS As the ability to efficiently produce long-range lance weaponry by Mars was perfected in late M37, the ... | Otsikko ja kerronta. (poimintavika: heading) |
| S0254 | F122 | AdMech/Explorator | Mechanicus starships are rare and precious vessels, and they will not be expended lightly, regardless of the circumstances. | Kerronta. |
| S0261 | F122 | AdMech/Explorator | Even the most junior tech-adepts are typically far more familiar with the workings of their vessel and the capabilities of its weapon and... | Kerronta. |
| S0280 | F138 | The Emperor's Inquisition | An inquisitor may be content to use such vessels to merely accompany a fleet under the command of another authority, or they may even tra... | Kerronta. |
| S0283 | F138 | The Emperor's Inquisition | An Inquisitor Lord may called forth to lead a fleet at times of great duress, during which his or her word is law and authority is absolute. | Kerronta. |
| S0284 | F138 | The Emperor's Inquisition | However, even unquestioned loyalty may come in many shades, and such vagaries are only magnified by the authority and power one wields. | Kerronta. |
| S0285 | F138 | The Emperor's Inquisition | While there are many factions and allegiances within the Inquisition, only how an Inquisitor’s affiliation leans between the Puritans and... | Kerronta. |
| S0303 | F140 | The Emperor's Inquisition | However, these shadowy agents of the Imperium are only called upon in dire need, usually only when a threat to the Imperium has gained a ... | Kerronta. |
| S0339 | F145 | Grey Knights | A Grey Knights fleet will only be called when intense demonic activity threatens to overrun an entire Sector. | Kerronta. |
| S0387 | F178 | RT/Pirates and Wolf Packs | However, large pirate bands with a substantial fleet at their disposal may elect to actually raid larger planetary colonies. | Kerronta. |
| S0388 | F178 | RT/Pirates and Wolf Packs | A human pirate requires great charisma and leadership ability just trying to keep his or her grip on the bands of criminals, mutineers an... | Kerronta. |
| S0413 | F226 | 6 listaa | For centuries or even millennia, they disappear from the real universe only to re-emerge with a crew of Daemonkind. | Kerronta. |
| S0414 | F226 | 6 listaa | This has led to the theory that Daemon ships can only leave the Warp by following in the wake of another vessel and that at other times t... | Kerronta. |
| S0415 | F226 | 6 listaa | Typically, there has never been enough reliable evidence to confirm any hypothesis. | Kerronta. |
| S0461 | F230 | 6 listaa | What means he used to bring together the fleets of so many different Chaos Lords and Warmasters is unknown, but even his unholy gift of l... | Abaddonin kerronta. |
| S0523 | F236 | Chaos/Tzeentch | Tzeentch may offer glimpses of the future to his servants, even those serving his chosen champion. | Johdanto. |
| S0604 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Each one of these is capable of opening vast portals sizable enough for even the largest of the Eldar’s war machines. | Kerronta. |
| S0654 | F319 | Eldar/Iyanden Craftworld | Unlike an Exarch, an Autarch is one that has the ability to step away from the Path of the Warrior, seek out other disciplines and assume... | Autarch-kerronta (osion omistajaton lause, vrt. build_data.py:4045). |
| S0846 | F370 | Orks/Da Ork Clanz | A warlord in particular gathers around himself a number of other cunning and successful leaders, each one an enterprising Mekboss or Nob ... | Kerronta. |
| S0847 | F370 | Orks/Da Ork Clanz | Several warlords may band together to fight a common foe, and they will each of course bring the best of their wargear to the fight, as m... | Kerronta. |
| S0905 | F369 | Orks/Da Ork Clanz | They don’t mind being a target though, and proudly display their wealth through a combination of gaudy colours and all the best gizmos th... | Kerronta. |
| S0907 | F369 | Orks/Da Ork Clanz | After a good old scrap it will always be the Deathskullz who are whizzing about scrounging what they can from any wrecks left floating ac... | Kerronta. |
| S0962 | F403 | Necrons/Harvest Fleet | Two more enemy vessels appeared, each a flat crescent shaped disk, glowing with a strange light against the blackness of space. | Kertomus. |
| S0963 | F404 | Necrons/Harvest Fleet | Necron fleets, just like their armies, are composed of a horrifying array of unthinking machines intent only on fulfilling their C’tan ma... | Kerronta. |
| S1002 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Individual organisms adapt and refine themselves with each new encounter, while the hive ships perpetually alter the morphology of the ne... | Kerronta. |
| S1011 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship has bio-engineered solar wings that spread to absorb the smallest amount of ambient radiated energy from surrounding space. | Solar Vanes -kerronta. |
| S1013 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The primary propulsion valves and constrictor muscles at the rear of the bio-ship have grown in size and strength. | Kerronta. |
| S1015 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio-ship’s connection to the Hive Mind is so pervasive that an indelible psychic reverberation surrounds the ship, marring its visage... | Kerronta. |
| S1017 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The number of discharge vents along the beast’s length has increased dramatically. | Kerronta. |
| S1022 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The creature has grown to an inordinate size with correspondingly reinforced internal endostructures and additional ablative carapace, in... | Kerronta. |
| S1026 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio-ship is covered with a slimy coat of mucous making it difficult for relatively slower moving ordnance to attack or damage it effe... | Kerronta. |
| S1029 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The creature maintains an unbroken link with the Vanguard drone ships and hive ships of the swarm. | Kerronta. |
| S1031 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The creature has evolved the capability of effectively bringing its weapons to bear on its enemies even when following the prerogative of... | Tenacity-kerronta. |
| S1046 | F429 | Tyranids/Vanguard Fleet | Vanguard fleets contain no hive ships and instead are acting on a heightened form of instinct, moving ahead of the main fleet in order to... | Kerronta. |
| S1075 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | When linked to ship sensors though this processing power can be used to provide a direct feed to the ships turrets. | Kerronta. |
| S1077 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | A Note on Tau Weapon Configurations Tau rail gun and lance batteries are extremely sophisticated with advanced targeting systems that all... | Kerronta. |
| S1078 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Where individual turrets and batteries may be relatively weak, combining firezones in this manner make Tau railguns and ion cannons fears... | Kerronta. |
| S1093 | F453 | Tau/Commerce Protection, Tau/Merchant Fleet | Moreover, his tactical genius did not go unnoticed, and it was only a matter of time before he was selected to command a starship, first ... | Mesmen tarina. |
| S1134 | F482 | Demiurg/War Host | ALLIES, SUBJECTS & MERCENARIES As the Tau Empire expands out from its homeworld, the Tau inevitably encounter new races previously unknow... | Kerronta. (poimintavika: heading) |
| S1135 | F482 | Demiurg/War Host | Able craftsmen, for instance, may be called upon to provide manufacturing capacity, while aggressive or warlike races will be obligated t... | Kerronta. |
| S1136 | F482 | Demiurg/War Host | There are other races still who do not wish to fully submit to the Empire, but who likewise have no wish for war with the Tau and will in... | Kerronta. |
| S1137 | F482 | Demiurg/War Host | Others are simple mercenaries, lending their particular talents to the young Tau in exchange for rather more tangible reward, while other... | Kerronta. |
| S1138 | F483 | Demiurg/War Host | Others have suggested that the nomadic movement of the mysterious Demiurg demonstrates only an opportunistic desire to capitalise on the ... | Kerronta. |

### intro (12)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0176 | F102 | SM/Dominion | The only exceptions to this are the special refits that the Space Marines themselves make to their battle barges, as follows: | Johdanto seuraaviin VBB-refitteihin, jotka on toteutettu. |
| S0183 | F118 | AdMech/Explorator | LEADERSHIP While the Adeptus Mechanicus have dedicated starship crews, they are led by senior Tech Magi of their order rather than the no... | LEADERSHIP-otsikko liimattu kerrontaan. (poimintavika: heading) |
| S0184 | F118 | AdMech/Explorator | Consequently, they use a leadership table different from other fleets. | Johdanto Ld-taulukkoon. |
| S0195 | F118 | AdMech/Explorator | To avoid raising the concern of the Imperial Navy, The Adeptus Mechanicus does not utilize any battlecruisers in their own fleets, though... | Selittää, miksi listalla ei ole battlecruisereita; ei rajoita mitään. |
| S0208 | F120 | AdMech/Explorator | However, because these ships are commonly relied upon to test untried and sometimes Xenos technology for extended periods of time, Mechan... | Quest for Knowledge -johdanto. |
| S0279 | F138 | The Emperor's Inquisition | Instead, there are various ways to add an Inquisitor or Inquisitorial ships to the Imperial factions. | Johdanto. |
| S0294 | F139 | Grey Knights, The Emperor's Inquisition | Inquisitors are almost always in pursuit of some higher objective that may be obscured by the current conflict at-hand. | Johdanto alajuoniin. |
| S0403 | F179 | RT/Pirates and Wolf Packs | Note: Pirate bands do not have ready access to complex weapon systems. | Johdanto seuraavaan. |
| S0894 | F369 | Orks/Da Ork Clanz | The colours for each clan is shown after the points cost for the upgrade. | Värit hintarivien jälkeen. |
| S0895 | F369 | Orks/Da Ork Clanz | Additionally, being from a particular clan and being painted as such does not obligate the skwadron to take the benefits of being from a ... | Ei velvoita. |
| S1068 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | TAU SHOWCASE SPECIAL RULES Unless noted otherwise, Tau vessels follow all the normal rules from the Battlefleet Gothic rulebooks concerni... | Otsikot + yleislause. (poimintavika: heading) |
| S1167 | F487 | Demiurg/War Host | The Demiurg do not make use of escorts in the same manner of other fleets. | Johdanto. |

### example (8)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0175 | F102 | SM/Dominion | For example, a Mars battlecruiser taken as a Venerable battle barge may not be given a salvaged targeting matrix and can only earn such a... | Esimerkki edellisestä. |
| S0302 | F140 | The Emperor's Inquisition | For example, an Ordo Hereticus Inquisitor may lead a fleet to perform Exterminatus on a planet subsumed by a witch-cult, an Ordo Xenos In... | Esimerkkejä. |
| S0408 | F179 | RT/Pirates and Wolf Packs | In other words, a squadron of three Eldar escorts and a squadron of three Ork escorts may both be part of the same pirate fleet, but they... | Esimerkki. |
| S0737 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | This means a Terror Ship must pay +40 points and a Space Hulk must pay +160 points to use Torpedo Bommas. | Hintaesimerkki; rivi laskee hinnan itse. |
| S0836 | F373 | Orks/Da Ork Clanz | Thus, the smallest fleet a single Warlord with only the one free re-roll may command is two tiddla skwadrons, each with three escorts. | Esimerkki S0824:n rakenteesta; hyvä testitapaus, jos laivueryhmittely tehdään. |
| S0837 | F373 | Orks/Da Ork Clanz | The largest fleet a single Warlord with two extra re-rolls (for a total of three) can command is one ‘Uge ship, two skwadrons of two kroo... | Esimerkki; testitapaus. |
| S0838 | F373 | Orks/Da Ork Clanz | While the number of Warlords for a given fleet size cannot be altered, how many points each Warlord is put in charge of can be mixed and ... | Esimerkki; testitapaus. |
| S1007 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Example: A Hive ship can have four reinforced carapaces, two extra spore cysts and one other refit, resulting in no more than three diffe... | Esimerkki; unit_upgrade_max kolme erilaista on valvottu. |

### modelling (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0098 | F50 | IN/Bakka Sector | Siluria light cruisers may be represented if desired as easily as cutting off the prow lances of a Dauntless light cruiser. | Mallinrakennusvinkki. |
| S0099 | F50 | IN/Bakka Sector | Havoc frigates may be represented with Chaos Infidel raiders, painted appropriately in loyalist colours of course! | Mallinrakennusvinkki. |
| S0100 | F50 | IN/Bakka Sector | On the other hand, the unique ship classes of Battlefleet Bakka may be represented in any manner desired by the player as long as they ca... | Mallien esittäminen. |
| S0416 | F227 | 6 listaa | It does not matter what broadside weapons you replace with Daemon ship components the ship’s profile is not changed. | Mallinnus: Daemonship-osat eivät muuta profiilia. |
| S0510 | F235 | 5 listaa | You should feel free to paint and model them to be consistent with the rest of your fleet, it will not have any game effect however. | Maalausvinkki ilman pelivaikutusta. |

### heading_merge (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0112 | F94 (osittain) | SM/Codex Astartes, SM/Crusade, SM/Dominion | SPACE MARINE SHOWCASE SPECIAL RULES SPACE MARINE LEADERSHIP Space Marines are highly organised, efficient and disciplined, allowing them ... | Kolme otsikkoa liimattuna kerrontavirkkeeseen. |

### clarification (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1025 | F427 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Keep in mind that if the fleet does not desire or by restrictions cannot have another hiveship, then the fourth reinforced carapace refit... | Selventää, että neljäs carapace on vain hive shipille; toteutuu ×4-rivin ehdosta. |

## PELI: Pelin aikainen sääntö (344 uniikkia, 767 esiintymää)

### weapon_rule (44)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0742 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | These often have a random firepower which is rolled each time they are fired. | Satunnainen tulivoima. |
| S0743 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Heavy gunz roll to hit like ordinary weapons batteries but do not count gunnery modifiers for range. | Heavy gunz. |
| S0744 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Each hit scored by heavy gunz causes double damage, i.e, two hits instead of one. | Heavy gunz. |
| S0745 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The strength of a salvo from an Ork torpedo launcha is randomly generated each time it is fired by rolling the dice indicated on its char... | Torpedo launcha. |
| S0746 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Ork ships in skwadrons may not combine torpedoes into larger salvoes. | Torpedot laivueessa. |
| S0867 | F371 | Orks/Da Ork Clanz | Any time the ship moves in base contact with any one enemy ship during the movement phase, immediately roll two D6. | Klaws. |
| S0868 | F371 | Orks/Da Ork Clanz | Each roll of a 4+ inflicts one hit on the target, ignoring shields but not holofields. | Klaws. |
| S0869 | F371 | Orks/Da Ork Clanz | Each ship with Klaws may only use it once per turn, regardless of how many vessels it contacts during the Ork player’s movement phase, th... | Klaws. |
| S0870 | F371 | Orks/Da Ork Clanz | If the Klaws hit only once or not at all, the ship can continue moving after making the attack and shoot/launch ordnance later in the turn. | Klaws. |
| S0871 | F371 | Orks/Da Ork Clanz | Neither vessel can move if they are of the same class or smaller (such as cruiser to cruiser), but a larger class vessel may still move b... | Klaws. |
| S0872 | F371 | Orks/Da Ork Clanz | Both ships may shoot at half effectiveness (nova cannon and similar special weapons cannot fire). | Klaws. |
| S0873 | F371 | Orks/Da Ork Clanz | Either ship may conduct boarding actions as normal. | Klaws. |
| S0875 | F371 | Orks/Da Ork Clanz | It is only effective against ships with shields down in the same manner as teleporters. | Snotlingit. |
| S0876 | F371 | Orks/Da Ork Clanz | When used, the ship rolls to hit on a 4+, range: 30 cm. | Snotlingit. |
| S0877 | F371 | Orks/Da Ork Clanz | If a hit is rolled, D3+1 snotling hordes are teleported onto the enemy ship! | Snotlingit. |
| S0878 | F371 | Orks/Da Ork Clanz | Each hit does not cause damage. | Snotlingit. |
| S0879 | F371 | Orks/Da Ork Clanz | Instead, the next leadership check or special order made by the ship must be with an extra D6 (such as 3D6, or even more when already usi... | Snotlingit. |
| S0880 | F371 | Orks/Da Ork Clanz | Additional “hits” from this weapon only add to the number of hordes that must be eradicated before the ship can return to conducting lead... | Snotlingit. |
| S0881 | F371 | Orks/Da Ork Clanz | These can also each be repaired in the end phase normally when rolling to repair critical damage. | Snotlingit. |
| S0882 | F371 | Orks/Da Ork Clanz | When fired at escorts, the defending squadron rolls a D6. | Snotlingit. |
| S0915 | F400 | Necrons/Harvest Fleet | The Sepulchre is used to attack one enemy ship that is within 20cm range. | Sepulchre. |
| S0916 | F400 | Necrons/Harvest Fleet | When the Sepulchre is used, make a Leadership test for the enemy vessel being attacked, as a wave of palpable psychic force is generated ... | Sepulchre. |
| S0917 | F400 | Necrons/Harvest Fleet | A ship attacked by the Sepulchre should take a Leadership test. | Sepulchre. |
| S0918 | F400 | Necrons/Harvest Fleet | If it is failed, then the ship’s Leadership is permanently reduced by 1, representing the loss of morale and trust. | Sepulchre. |
| S0919 | F400 | Necrons/Harvest Fleet | Also the ship may not use any special orders until after the end of their next turn. | Sepulchre. |
| S0920 | F400 | Necrons/Harvest Fleet | Any ordnance within 20cm of the Sepulchre (except for non-boarding torpedoes) are destroyed on a 4+. | Sepulchre. |
| S0921 | F400 | Necrons/Harvest Fleet | A Necron ship may only unleash its Sepulchre when the ship is not on any special orders or crippled. | Sepulchre. |
| S0922 | F400 | Necrons/Harvest Fleet | Firstly, they don’t suffer the normal column shift to the right when attacking vessels who have holofields or shadowfields (the bolts do ... | Gauss/lightning arc. |
| S0923 | F400 | Necrons/Harvest Fleet | Star Pulse Generator The star pulse generates a pulse of energy with a radius effect of 20 cm, which does not effect other Necron ships. | Star Pulse. |
| S0924 | F400 | Necrons/Harvest Fleet | Each pulse generator gets one roll to hit against each ship or piece of ordnance in range. | Star Pulse. |
| S0925 | F400 | Necrons/Harvest Fleet | The Star Pulse Generator rolls 1D6 to hit against the nearest facing armour value separately against every ship in range. | Star Pulse. |
| S0926 | F400 | Necrons/Harvest Fleet | This is an area effect that cannot be saved against by holofields or anything similar. | Star Pulse. |
| S0927 | F400 | Necrons/Harvest Fleet | A star pulse cannot be generated while the vessel is using any special order or crippled as it requires precise control. | Star Pulse. |
| S0928 | F400 | Necrons/Harvest Fleet | The particle whip is treated like a lance except any rolls to hit of 6 ignore shields, holofields or any other mechanism that performs a ... | Particle whip. |
| S0929 | F401 | Necrons/Harvest Fleet | Each portal confers an additional hit and run attack to the Necron vessel. | Portals. |
| S0930 | F401 | Necrons/Harvest Fleet | These have a range of 10cm and, as normal, can only be made against ships whose shields are down. | Portals. |
| S0931 | F401 | Necrons/Harvest Fleet | The usual restriction that teleport attacks can only be made against ships with less remaining Hull Points is waived, with the exception ... | Portals. |
| S0932 | F401 | Necrons/Harvest Fleet | A Necron capital ship both crippled and Braced may not make Portal attacks. | Portals. |
| S1067 | F431 | Tyranids/Hive Fleet | Each port/starboard weapon uses the profile given (ie don’t ‘split’ their firepower). | Ei jaeta tulivoimaa. |
| S1148 | F484 | Demiurg/War Host | The cutting beam counts as a single lance but each Blast marker picked up by the Demiurg vessel in the Movement phase gives the beam the ... | Cutting beam. |
| S1149 | F484 | Demiurg/War Host | The cutting beam always starts with an effective strength of one before adding for blast markers, and it will never have less than this a... | Cutting beam. |
| S1150 | F484 | Demiurg/War Host | Any Demiurg vessel may extend the range of its cutting beam to 30 cm by halving its effective strength, rounding down. | Cutting beam. |
| S1151 | F484 | Demiurg/War Host | For example, a Demiurg Bastion that gathers up four blast markers in the course of its immediately previous movement may in the shooting ... | Esimerkki. |
| S1152 | F484 | Demiurg/War Host | Blast markers cannot be held from turn to turn in order to power the cutting beam, any unused ones are lost. | Cutting beam. |

### ordnance_rule (43)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0118 | F95 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Thunderhawk Gunships Thunderhawk gunships combine the abilities of assault boats and fighters, and move like any other attack craft, with... | Thunderhawkin säännöt; kortilla laukaisukuilun viitteenä. |
| S0119 | F95 (osittain) | SM/Codex Astartes, SM/Crusade, SM/Dominion | On a score of 4+, do not remove the Thunderhawk marker ( However, Thunderhawks can only remove one enemy marker in any given ordnance pha... | Thunderhawk; sulkeen sisältö on katkennut ('( However'). |
| S0120 | F95 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Using its 4+ save does not prevent it from attacking a ship if in base contact with one when stopped. | Thunderhawk. |
| S0124 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Thunderhawk Annihilators combine the abilities of bombers and fighters, and they move like any other attack craft with a speed of 20 cm. | Annihilatorin liike. |
| S0125 | F96 | 6 listaa | As they behave as both fighters and bombers, they apply a bonus to turret suppression by adding +1 attack for each marker in the wave aft... | Turret suppression; sama lause Ork-listoilla (fighta-bommerz, s.359). |
| S0126 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | When a wave of Thunderhawk Annihilators attacks a ship, you must decide beforehand if any of the markers will forgo their attack runs in ... | Turret suppression. |
| S0127 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Every one that does so cannot make any attack rolls but adds an additional +1 bonus attack to any surviving Thunderhawk Annihilators when... | Turret suppression. |
| S0128 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Thunderhawks used in this manner cannot contribute more bonus attacks than the defending ship actually has turrets or the number of survi... | Turret suppression. |
| S0129 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | NOTE: In either case, at least one Thunderhawk Annihilators has to survive against turrets for the wave to attack in this manner. | Turret suppression. |
| S0656 | F345 | Dark Eldar/Pirates | When orbital mines are used, they completely replace all other attack craft used by the launching carrier, with one orbital mine per laun... | Orbital mines Dark Eldar -carriereilla. |
| S0657 | F345 | Dark Eldar/Pirates | As Dark Eldar vessels do not actually have turrets, enemy bombers do not get any bonus against turrets from escorting fighters. | Ordnance. |
| S0658 | F345 | Dark Eldar/Pirates | Raptor fighters are resilient, meaning they get a 4+ save once per ordnance phase whenever they come in contact with enemy ordnance. | Raptor. |
| S0659 | F345 | Dark Eldar/Pirates | Razorwing bombers have highly accurate targeting sensors which allows you to re-roll the dice to determine the number of attacks they mak... | Razorwing. |
| S0682 | F347 | Dark Eldar/Pirates | Any torpedo that comes in contact with a ship and misses the target on the first attempt must re-roll the hit roll, even if the ship is a... | Eldar-torpedojen uusinta. |
| S0722 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Launch capacity Some ships in an Ork fleet may possess a variable launch capacity (as is the case with many Ork capital ships). | Vaihteleva launch capacity. (poimintavika: heading) |
| S0723 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | In the Ordnance phase of each Ork turn when Ork attack craft remain in play, an Ork fleet with variable launch bay Strength must roll to ... | Launch capacity. |
| S0724 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | This hybrid approach means that they function as fighters with a speed of 25 cm normally but can attack ships as if they were bombers. | Fighta-bommaz. |
| S0725 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | However, when attacking a ship, each squadron only rolls a D3 not a D6 for the number of attacks they inflict. | Fighta-bommaz. |
| S0726 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When a wave of fighta-bommas attacks a ship, you must decide beforehand if any of the markers will forgo their attack runs in favour of t... | Turret suppression. |
| S0727 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Every one that does so cannot make any attack rolls but adds an additional +1 bonus attack to any surviving fighta-bommas when rolling th... | Turret suppression. |
| S0728 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Fighta-bommas used in this manner cannot contribute more bonus attacks than the defending ship actually has turrets or the number of surv... | Turret suppression. |
| S0729 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | NOTE: In either case, at least one fighta-bomma has to survive against turrets for the wave to attack in this manner. | Turret suppression. |
| S0730 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Example: A Terror Ship launches a single wave of four fighta-bommas against a Devastation cruiser with three turrets and no CAP, declarin... | Esimerkki. |
| S0731 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The two remaining markers now each roll 1D3-3 (minimum zero) attacks, but because each marker also counts as a fighter, it adds +1 attack... | Esimerkki. |
| S0732 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | It then adds +2 attacks for the two markers used only to suppress turrets (even though one was removed), for a single total addition of +... | Esimerkki. |
| S0733 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Torpedo-bommas only move 20 cm and do NOT retain the ability to behave as fighters and cannot intercept other ordnance or provide a bonus... | Torpedo-bommaz. |
| S0734 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | In the beginning of any turn after the turn they are launched, each torpedo-bomma marker may be converted into a Strength-2 torpedo salvo. | Torpedo-bommaz; kortilla (domain.js:2775). |
| S0735 | F359 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Torpedo-bommas in a wave may combine their salvoes into a single salvo, or any number of markers may launch their salvoes separately. | Torpedo-bommaz. |
| S0988 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | ORDNANCE Some Tyranid ships may have launch bays or torpedo batteries. | Johdanto. (poimintavika: heading) |
| S0989 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Tyranids may only launch boarding torpedoes, fighters and assault boats, or rather their biological equivalents in the form of giant hull... | Tyranid-ordnance. |
| S0992 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Furthermore their broods are virtually autonomous and do not require maintenance or refuelling and rearming in the same way as convention... | Ordnance. |
| S0993 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | As such, they may have up to twice the number of attack craft markers in play as they have available launch bays. | Ordnance-raja 2× bayt. |
| S0994 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | However, if a bio-ship becomes crippled its generative capacities will be turned completely to self preservation and it may no longer lau... | Crippled. |
| S1063 | F431 | Tyranids/Hive Fleet | Ordnance may be formed up into waves which are treated as squadrons for the purposes of deployment. | Aallot laivueina. |
| S1080 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | They are well shielded and count as resilient attack craft in all regards with a 4+ save against enemy fighters once per Ordnance Phase. | Mantas. |
| S1081 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Whilst Mantas can carry large numbers of troops they are not used to board enemy vessels as boarding is totally contrary to the Tau’s app... | Mantat eivät hyökkää boardingiin. |
| S1083 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Tau missiles are able to alter both their speed and course throughout flight, so may move at any speed between 20 cm and 40 cm (ie must m... | Tau-ohjukset. |
| S1084 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Each ordnance phase the missiles may change course by 45 degrees at the start of their movement. | Tau-ohjukset. |
| S1085 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | However, you must roll a dice for each point of torpedo strength in the salvo at the start of each ordnance phase, after the one they wer... | Tau-ohjukset. |
| S1086 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | The salvo is reduced by 1 point for every 6 rolled. | Tau-ohjukset. |
| S1153 | F484 | Demiurg/War Host | Some Demiurg ships are equipped with launch bays which are also permitted to fire torpedoes. | Launch bayt ja torpedot. |
| S1154 | F484 | Demiurg/War Host | Such launch bays can be used to release either attack craft or torpedoes, but not both in the same turn. | Kortilla (domain.js:2859). |
| S1155 | F484 | Demiurg/War Host | Note that Demiurg torpedoes and attack craft are not always interchangeable, so Demiurg torpedo tubes cannot be used to launch attack cra... | Torpedot ja attack craft. |

### faction_rule (32)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0115 | F94 | SM/Codex Astartes, SM/Crusade, SM/Dominion | To represent this, Space Marine ships add +2 to their D6 roll when they fight in a boarding action and +1 when they make any hit and run ... | SM boarding +2 / hit and run +1; kortilla astartes_core-sääntönä. **[ajo ok]** |
| S0117 | F95 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Space Marine vessels may fire boarding torpedoes instead of ordinary torpedoes, as detailed in the Ordnance rules in Battlefleet Gothic. | Boarding torpedoes; kortilla Astartes Torpedoes. **[ajo ok]** |
| S0131 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Once per turn you may use the Honour Guard, if your fleet list includes them. | Honour Guardin käyttö. |
| S0132 | F96 | 4 listaa | All the normal rules for teleport attacks apply, except that they may be used in addition to a normal teleport attack that turn. | Honour Guard / teleport. |
| S0133 | F96 | 4 listaa | The player may roll two dice and choose which one to use as the result, including the normal +1 bonus for being Space Marines. | Honour Guard. |
| S0134 | F96 | 4 listaa | Once per turn a vessel equipped with Terminator boarding parties may use them when conducting a hit and run teleport attack. | Terminators; kortin sääntö (domain.js:2748). |
| S0135 | F96 | 4 listaa | Terminators may be used in addition to a normal teleport attack that turn. | Terminators. |
| S0181 | F102 | SM/Dominion | As with all Space Marine vessels, these tubes may also be used to launch boarding torpedoes. | VBB:n putkista boarding torpedoes; kortilla Astartes Torpedoes. |
| S0182 | F102 | SM/Dominion | These boarding torpedoes are manned by Space Marines and get a +1 to their hit and run attacks when they hit an enemy ship. | Boarding torpedoes +1 hit and run. |
| S0188 | F118 | AdMech/Explorator | Though they may conduct hit and run raids normally, the attacker may re-roll the dice if desired during boarding actions as well as Hit a... | Hyökkääjä saa uusia boarding- ja H&R-heiton; kortilla (domain.js:3065). |
| S0192 | F118 | AdMech/Explorator | Unlike other fleets, Mechanicus vessels can take a leadership check to fire upon their own vessels that have been hulked to deny them to ... | Omien hylkyjen ampuminen. |
| S0193 | F118 | AdMech/Explorator | This rule only applies to Mechanicus vessels shooting at Mechanicus drifting hulks, and not Imperial Navy, reserve or allied vessels in t... | Edellisen rajaus. |
| S0207 | F120 | AdMech/Explorator | Mechanicus vessels always add +1D6 to their rolls when attempting to repair critical damage. | Korjaus +1D6; kortilla (domain.js:2600). |
| S0322 | F144 | Grey Knights | Grey Knights count as Space Marines in all respects and as such follow all rules for Space Marines as written on pages 92-94. | GK = Space Marines; kortilla astartes_core. |
| S0336 | F145 | Grey Knights | Once per turn you may use the Honour Guard. | Honour Guardin käyttö. |
| S0885 | F370 | Orks/Da Ork Clanz | Ork escort skwadrons gain a +1 bonus to their Leadership while they contain more than five models (or ‘lotz’ as the Orks call it – Orks a... | Mob Rule. |
| S0887 | F370 | Orks/Da Ork Clanz | Any Ork escort skwadron with a Leadership of 5 or 6 gets a bonus escort ship added for free, demonstrating quantity has a quality all of ... | Young Gunz: ilmainen saattaja Ld-heiton jälkeen. |
| S0888 | F370 | Orks/Da Ork Clanz | This includes if the leadership is a result of being swapped with that of a Warboss! | Young Gunz. |
| S0889 | F370 | Orks/Da Ork Clanz | The free ship can be any Ork escort class in the fleet list costing equal to or less than that of the cheapest escort paid for in the skw... | Young Gunz. |
| S0890 | F370 | Orks/Da Ork Clanz | Young Gunz can be applied before Mob Rule: a tiddla skwadron with five escorts that rolls Ld 5 may have a sixth escort for free, increasi... | Young Gunz. |
| S0959 | F402 | Necrons/Harvest Fleet | Necron vessels may ignore the rule preventing them from firing upon or boarding friendly drifting/blazing hulks. | Hylkyjen ampuminen. |
| S1048 | F429 | Tyranids/Vanguard Fleet | Escort squadrons in a Tyranid Vanguard fleet may take a Leadership test at the start of each turn in order to override their Instinctive ... | Instinctive Behaviour. |
| S1049 | F429 | Tyranids/Vanguard Fleet | Each squadron uses their own Leadership for the test (you can’t use that of a nearby ship or squadron) and if failed, uses Instinctive Be... | Instinctive Behaviour. |
| S1050 | F429 | Tyranids/Vanguard Fleet | You may test to override Instinctive Behaviour for all your squadrons even if a squadron fails. | Instinctive Behaviour. |
| S1070 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | TELEPORT ATTACKS Tau ships may not conduct teleport hit and run attacks. | Ei teleport-hyökkäyksiä. (poimintavika: heading) |
| S1071 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | However, gravitic hooks have no effect in game terms – ships do not start a game attached to their parent ship, and can never be docked d... | Gravitic hookit pelissä. |
| S1139 | F483 | Demiurg/War Host | Blast markers have no effect on the movement of the Demiurg ship, nor do they face any other negative effects of moving through blast mar... | Demiurg ja blast markerit. |
| S1140 | F483 | Demiurg/War Host | Keep markers ‘hoovered up’ like this to one side so they can be used to fire a cutting beam from the prow in the shooting phase. | Cutting beam. |
| S1141 | F483 | Demiurg/War Host | Note that Blast markers moved over must be removed, the Demiurg player can’t choose to remove some markers and leave others in place. | Blast markerien kerääminen. |
| S1142 | F483 | Demiurg/War Host | Do not place blast markers in contact with them for celestial phenomena of any kind. | Blast markerit. |
| S1164 | F486 | Demiurg/War Host | As such, even when allied with two fleets that are fighting each other, Demiurg and Kroot ships will never fire upon each other. | Palkkasoturit eivät ammu toisiaan. |
| S1165 | F486 | Demiurg/War Host | They ignore each other for the purpose of the closest target. | Sama. |

### card_rule (29)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0239 | F121 | AdMech/Explorator | These vessels count as Mechanicus vessels and use all rules that Mechanicus vessels do, but do not have access to the Mechanicus Gifts ta... | AdMech-saattaja ei saa Gifts-heittoa eikä SM:n boarding-bonusta. Varmista, ettei SM-saattajan kortti AdMech-listalla tulosta astartes-sääntöä. **[ajo ok]** |
| S0251 | F121 | AdMech/Explorator | Mechanicus vessels cannot be placed in squadrons with Rogue Trader, regular Imperial Navy or Adeptus Astartes vessels. | Kortin sääntö mechanicus_guest (domain.js:3028); laivueeseen ei voi sekoittaa, koska yksi rivi = yksi laivue. |
| S0252 | F121 | AdMech/Explorator | Mechanicus re-rolls cannot be used on these vessels, and other fleet commander re-rolls cannot be used on Mechanicus vessels. | Re-rollien käyttö; kortilla (domain.js:3036). |
| S0290 | F139 | The Emperor's Inquisition | Ships with torpedo tubes are armed with ordinary and boarding torpedoes, and for no cost or modification can also act as Exterminatus ves... | Torpedot ja Exterminatus; kortilla (domain.js:2667). |
| S0319 | F141 | The Emperor's Inquisition | If taken, the Inquisitor’s ship loses its Deathwatch contingent along with their leadership and boarding value bonus. | Inkvisiittorin alus menettää Deathwatch-bonuksen, jos xenos-alus otetaan. Kortille; varmista, näkyykö. Ajo 20.10.: Ordo Xenos -komentajan kortilla ei mainita Deathwatchia lainkaan; menetys xenos-liittolaisen kanssa kuuluisi kortille. **[aukko ajossa]** |
| S0337 | F145 | Grey Knights | Every Grey Knights capital ship in the fleet mounts hexagrammic wards throughout its hull and ignores any Chaos marks or Daemonship effec... | Hexagrammic wards kortilla (domain.js:2894). |
| S0338 | F145 | Grey Knights | Marks of Slaanesh do not affect the leadership of this vessel, Marks of Khorne do not double boarding values against this ship, etc.. | Esimerkit. |
| S0389 | F178 | RT/Pirates and Wolf Packs | All pirate vessels suffer a -1 leadership modifier, meaning their unmodified starting leadership will be from 5 to 8. | -1 Ld kortilla (domain.js:2999). |
| S0411 | F179 | RT/Pirates and Wolf Packs | They may not use any of a Pirate Captain’s re-rolls, and will automatically attempt to disengage if the escort squadron is crippled (redu... | Xenos-saattajat eivät käytä kapteenin re-rolleja ja disengage crippled-tilassa; kortille. |
| S0412 | F179 | RT/Pirates and Wolf Packs | They are not restricted to nor benefit from the leadership values of human pirates and must use the unmodified leadership from the fleet ... | Xenosten oma Ld (domain.js:3003). |
| S0489 | F233 | 6 listaa | Ships with torpedo tubes are armed with normal and boarding torpedoes. | Torpedot; kortilla (domain.js:2667). |
| S0718 | F351 | Dark Eldar/Pirates | Ships with torpedo tubes are armed with both Eldar torpedoes and Leech torpedoes, though the Leech torpedoes must be loaded with a separa... | Eldar- ja Leech-torpedot; kortilla (domain.js:2667). |
| S0945 | F402 | Necrons/Harvest Fleet | To represent these factors all Necron ships with a reactive hull are immune to Damage, Leadership and Movement modifiers from solar flare... | Reactive hull; kortilla (domain.js:3038). |
| S0946 | F402 | Necrons/Harvest Fleet | All Necron ships are Armour 6, representing the difficulty of targeting them, and in addition receive a special save against each hit to ... | Reactive hull. |
| S0947 | F402 | Necrons/Harvest Fleet | This save replaces the Brace for Impact save for all intents and purposes and is treated in the same manner as a brace save, meaning it i... | Reactive hull. |
| S0948 | F402 | Necrons/Harvest Fleet | The following two exceptions apply: • It does not save against hit and run attacks unless the ship is actually braced. | Reactive hull. |
| S0949 | F402 | Necrons/Harvest Fleet | • Warp cannons ignore reactive hull saves unless the Necron ship is braced. | Reactive hull. |
| S0950 | F402 | Necrons/Harvest Fleet | A Necron ship on Brace for Impact orders is reduced to Armour 4+. | Reactive hull. |
| S0951 | F402 | Necrons/Harvest Fleet | The drive is fired whenever All Ahead Full orders are issued; instead of obeying the normal rules for this order the ship gains D6 × 10 c... | Inertialess drive. |
| S0964 | F404 | Necrons/Harvest Fleet | Leadership is determined normally for Necron fleets, except a ship carrying a Sepulchre (see below) automatically receives a Leadership o... | Sepulchre-aluksen Ld 10; kortille. |
| S0995 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | CRIPPLED To summarise, Tyranid ships suffer the following penalties when crippled: • Speed: -5 cm • Spore cysts: Full strength • Bio-plas... | Crippled-yhteenveto + suunnittelijan huomautus. (poimintavika: heading) |
| S1073 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | If fired at from the front the deflector augments the passive armour which counts as armour 6. | Deflector. |
| S1074 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Deflectors are NOT shields and do not count as such for the purpose of boarding, blast markers or other effects which apply to shields. | Deflector; kortilla (domain.js:3053). |
| S1076 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Any Tau vessel within 10 cm of a ship with tracking systems may re-roll misses when using turrets, and ignores the column shift when firi... | Tracking systems. |
| S1146 | F483 | Demiurg/War Host | Mercenaries Unless the fleet is entirely composed of Demiurg ships they are considered to be mercenaries and will not continue to fight i... | Palkkasoturi disengage crippled-tilassa. (poimintavika: heading) |
| S1147 | F483 | Demiurg/War Host | However, if the Demiurg ship is part of a fleet fighting against Orks it will only disengage if first reduced to only having 1 or 2 Damag... | Orkkeja vastaan poikkeus. |
| S1157 | F486 | Demiurg/War Host | Vessels allied with the Demiurg rely on the basic leadership applicable to their fleets. | Liittolaisen Ld; kortilla demiurg_ally (domain.js:3018). |
| S1158 | F486 | Demiurg/War Host | They cannot use Demiurg fleet re-rolls, but if available they may purchase special characters with any re-rolls they come with to lead th... | Sama kortilla. |
| S1162 | F486 | Demiurg/War Host | Demiurg vessels used with this fleet list do not attempt to disengage unless they have 2Hp or less remaining. | Disengage vasta 2 HP:ssa. |

### crit_table (29)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0933 | F401 | Necrons/Harvest Fleet | CRITICAL HITS TABLE 2D6 Roll Extra Damage Result +0 Power Flow Disrupted: May not fire lightning arc or particle whip in its port arc unt... | Necron-kriittitaulukko; kuuluu kortille. (poimintavika: heading) |
| S0934 | F401 | Necrons/Harvest Fleet | +0 Power Flow Disrupted: May not fire lightning arc or particle whip in its starboard arc until it has been repaired. | Kriittitaulukko. |
| S0935 | F401 | Necrons/Harvest Fleet | +0 Power Flow Disrupted: May not fire lightning arc in any arc until it has been repaired. | Kriittitaulukko. |
| S0936 | F401 | Necrons/Harvest Fleet | +0 Power Flow Disrupted: May not fire lightning arc or particle whip in any arc until it has been repaired. | Kriittitaulukko. |
| S0937 | F401 | Necrons/Harvest Fleet | +0 Drive Damaged: May not change facing until repaired. | Kriittitaulukko. |
| S0938 | F401 | Necrons/Harvest Fleet | Permanently reduce the ship’s Leadership by -1. | Kriittitaulukko. |
| S0939 | F401 | Necrons/Harvest Fleet | +0 Drive Damaged: Reduce movement by -5 cm until repaired. | Kriittitaulukko. |
| S0940 | F401 | Necrons/Harvest Fleet | +0 Inertialess Drive Damaged: May not use All Ahead Full special orders until repaired. | Kriittitaulukko. |
| S0941 | F401 | Necrons/Harvest Fleet | Permanently reduce the ship’s Leadership by -2. | Kriittitaulukko. |
| S0942 | F401 | Necrons/Harvest Fleet | +0 Command Core Damaged: Permanently reduce the ship’s Leadership by -3. | Kriittitaulukko. |
| S0943 | F401 | Necrons/Harvest Fleet | +D3 Power Surge: Permanently reduce the ship’s Leadership by -2. | Kriittitaulukko. |
| S0944 | F401 | Necrons/Harvest Fleet | +D6 Ruptured Power Core: Permanently reduce the ship’s Leadership by -2. | Kriittitaulukko. |
| S0969 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | TYRANID CRITICAL HITS TABLE 2D6 Roll Extra Damage Result +0 Spore cysts injured: The ship’s spore cysts are badly damaged by the hit. | Tyranid-kriittitaulukko; kortille. (poimintavika: heading) |
| S0970 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship’s spore cysts may not be used until they have been repaired. | Kriittitaulukko. |
| S0971 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship’s starboard armament may not be used again until it has been repaired. | Kriittitaulukko. |
| S0972 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship’s port armament may not be used until it has been repaired. | Kriittitaulukko. |
| S0973 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Its prow armament may not be used until it has been repaired. | Kriittitaulukko. |
| S0974 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The ship may not use its thorax weapons until the damage is repaired. | Kriittitaulukko. |
| S0975 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio-ship may not turn until the damage is repaired. | Kriittitaulukko. |
| S0976 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio-ship cannot have its instinctual orders overridden by the Hive Mind until the damage is repaired. | Kriittitaulukko. |
| S0977 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The bio- ship may no longer use its spore cysts. | Kriittitaulukko. |
| S0978 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | This damage cannot be repaired. | Kriittitaulukko. |
| S0979 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | +D3 Severe wound: A huge gash is torn in the ship’s hull, vital fluids freezing instantly as they spill into the void. | Kriittitaulukko. |
| S0980 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | +D6 Massive haemorrhage: The armoured hide of the ship suffers immense damage, spraying alien ichor far into the void. | Kriittitaulukko. |
| S0981 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Make a bio-plasma attack with Strength 1 against any other target within 2D6 cm. | Kriittitaulukko. |
| S0982 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Holofields do not protect against this damage. | Kriittitaulukko. |
| S0999 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | CRITICAL HITS & CATASTROPHIC DAMAGE Tyranids do not use the normal critical hit and catastrophic damage tables. | Omat kriittitaulukot. (poimintavika: heading) |
| S1000 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Instead they use the tables presented here. | Johdanto. |
| S1001 | F425 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | If a critical hit is rolled which cannot be applied, for example a ship with no prow weapons gets a Prow Armament wounded critical, apply... | Kriittisääntö. |

### daemonship (24)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0424 | F227 | 6 listaa | WARP TRANSLATION A Daemonship may be kept off table at the start of a game. | Warp translation; kortilla (domain.js:2724). (poimintavika: heading) |
| S0425 | F227 | 6 listaa | In the End phase of any Chaos turn, after the first, they may enter play from the Warp as follows: Select a friendly or enemy Capital shi... | Warp translation. |
| S0426 | F227 | 6 listaa | Position the Daemonship within 20 cm of the chosen vessel facing in any direction desired by the Chaos player controlling it. | Warp translation. |
| S0427 | F227 | 6 listaa | Next, roll 4D6 and a Scatter dice and reposition the Daemonship accordingly, keeping the ship on the same heading. | Warp translation. |
| S0428 | F227 | 6 listaa | A Daemonship cannot be forced to disengage by a scatter roll that places it off the table. | Warp translation. |
| S0429 | F227 | 6 listaa | The arriving Daemonship is unaffected by celestial phenomena and does not trigger attack by ordnance markers it may happen to land on. | Warp translation. |
| S0430 | F227 | 6 listaa | If it would appear in contact with an enemy vessel, reposition it by up to 1 cm so that it is out of contact. | Warp translation. |
| S0431 | F228 | 6 listaa | Any enemy vessel attempting a special order when within 15 cm of it is at -1 Leadership (if the ship also has a Mark of Slaanesh the pena... | Spectral. |
| S0432 | F228 | 6 listaa | It cannot move, shoot, board or conduct any action in any way, though any Marks it may have still take effect immediately. | Spectral. |
| S0433 | F228 | 6 listaa | It also may not be shot at, boarded, rammed or have any action done to it while spectral. | Spectral. |
| S0434 | F228 | 6 listaa | At the end of any subsequent Chaos End phase it may complete the translation to real space. | Spectral. |
| S0435 | F228 | 6 listaa | It does not have to and may remain a spectral, haunting presence as long as the Chaos player wishes. | Spectral. Koodiosumat ovat eri lauseita. |
| S0436 | F228 | 6 listaa | When the decision is made to translate to real space roll a D6 – on a roll of 2 or more it becomes solid. | Spectral. |
| S0437 | F228 | 6 listaa | This final translation cannot be made if the Daemonship is in contact with an enemy vessel. | Spectral. |
| S0438 | F228 | 6 listaa | However, if it materializes in an asteroid field, it may then attempt to avoid damage by making a leadership check normally. | Spectral. |
| S0439 | F228 | 6 listaa | HAUNTING A Daemonship may disengage at the end of any Chaos Movement phase without having to make any dice roll. | Haunting. (poimintavika: heading) |
| S0440 | F228 | 6 listaa | A disengaged Daemonship may re-enter play on any Chaos turn following the one in which it disengages. | Haunting. |
| S0441 | F228 (osittain) | 6 listaa | If it was damaged when it disengaged it may be repaired when it returns, roll a D6: D6 ROLL RESULT 1, 2, 3 No change 4, 5 +1 hull point +... | Haunting; korjaustaulukko yhdessä lauseessa (rivi '6' puuttuu). (poimintavika: table) |
| S0442 | F228 | 6 listaa | Add +1 for each full turn the Daemonship spent in the Warp. | Haunting. |
| S0443 | F228 | 6 listaa | In addition to repairing damage, they may repair critical hits while in the warp rolling normally, repairing critical damage on a 4+ as o... | Haunting. |
| S0444 | F228 | 6 listaa | However, Daemonships may not make repair rolls in the end phase they are first deployed when returning into play. | Haunting. |
| S0445 | F228 | 6 listaa | If Daemonships repair enough hits while “haunting” to no longer be crippled, they will still count as disengaged for purposes of victory ... | Haunting. |
| S0446 | F228 | 6 listaa | A returning Daemonship cannot come back with more hits than it could normally have. | Haunting. |
| S0447 | F228 | 6 listaa | At the end of the game a Daemonship which disengaged (even just once) will count as having disengaged for Victory points purposes, unless... | Voittopisteet. |

### mark_effect (16)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0480 | F232 | Chaos/Black Crusade, Chaos/Incursion, Chaos/Slaanesh | Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their Leadership value. | Mark of Slaanesh; kortilla (domain.js:2727). |
| S0481 | F232 | Chaos/Incursion | The Chaos Warmaster's ship doubles its value in boarding actions and adds +1 to any rolls for inflicting critical damage in a boarding ac... | Mark of Khorne Warmasterin aluksella; kortille. |
| S0482 | F232 | Chaos/Incursion | The Chaos Warmaster gains an extra re-roll. | Mark of Tzeentch: lisä-re-roll. |
| S0483 | F232 | Chaos/Incursion | The Chaos Warmaster's ship gains 1 damage point and may not be boarded. | Mark of Nurgle; +1 DP on mod-kenttänä (build_data.py:3559). |
| S0486 | F232 | Chaos/Incursion | The Chaos Lord gains a re-roll. | Mark of Tzeentch -vaikutus. |
| S0487 | F232 | Chaos/Incursion | The Chaos Lord's ship gains a damage point and may not be boarded. | Mark of Nurgle -vaikutus. |
| S0499 | F234 | Chaos/Black Crusade | This ship has an extra re-roll. | Mark of Tzeentch -vaikutus. |
| S0500 | F234 | Chaos/Black Crusade, Chaos/Nurgle | It gains 1 Damage Point and may not be boarded. | Mark of Nurgle -vaikutus. |
| S0518 | F236 | Chaos/Tzeentch | The vessel is given command of the Fates by its patron god and gains +1 re-roll. | Mark of Tzeentch -vaikutus. |
| S0522 | F236 | Chaos/Tzeentch | Once per battle, a single enemy ship within 15 cm takes D6 hits in the end phase (shields have no effect). | Warp Beasts -vaikutus. |
| S0524 | F236 | Chaos/Tzeentch | Once per battle it automatically passes a command check or leadership test – no roll required. | Strand of Fortune -vaikutus. |
| S0537 | F240 | Chaos/Nurgle | The murky haze distorts the ship’s silhouette; vessels within 15 cm do not benefit from a left column shift when firing at it. | Hives of Nurgle -vaikutus. |
| S0539 | F240 | Chaos/Nurgle | Ships hulked in this manner do not remain “on fire” and roll normally on the catastrophic damage table. | Ark of Pestilence -vaikutus. |
| S0547 | F244 | Chaos/Khorne | Carriers with this Mark may launch up to D3 more attack craft markers of any type if within less than 20 cm of their target. | Khornen carrier-sääntö. |
| S0548 | F244 | Chaos/Khorne | If they do so, they must Reload Ordnance and not launch in the next turn. | Edellisen jatko. |
| S0557 | F248 | Chaos/Slaanesh | While within 15 cm of a vessel with Siren’s Summon, enemy ships cannot take special orders or make leadership tests of any type, includin... | Siren's Summon -vaikutus. |

### commander_effect (15)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0029 | F142 | 6 listaa | The ship adds +1 to its leadership (max 10) and +2 to its roll during a boarding action. | Ordo Malleus -inkvisiittorin aluksen Ld- ja boarding-bonus; komentajakortille. **[ajo ok]** |
| S0030 | F142 | 7 listaa | Hit and Run attacks from this ship add +1 to their roll, and such attacks against this ship subtract -1 from their roll. | Hit and Run -muokkaimet; build_data.py:4781 vie sen kortille. **[ajo ok]** |
| S0031 | F142 | 6 listaa | The ship with the Ordo Malleus Inquisitor Lord aboard mounts hexagrammic wards throughout its hull and ignores any Chaos marks or Daemons... | Hexagrammic wards; komentajakortille. |
| S0032 | F142 | 6 listaa | Marks of Slaanesh do not affect the leadership of this vessel, Marks of Khorne do not double boarding values against this ship, etc. | Edellisen lauseen esimerkit; komentajakortille. |
| S0033 | F142 | 6 listaa | Rules for Chaos Space Marines still apply normally, and any other special rules and effects such as the Forces of Chaos listed on pg.158 ... | Wardsin raja; build_data.py:4786 vie kortille. |
| S0078 | F48 | IN/Bakka Sector | His crew is honoured and inspired by the great man’s presence and will fight with great courage and pride; they add +1 to their roll when... | Rathin miehistön boarding-puolustus +1; komentajakortille. |
| S0161 | F100 | SM/Dominion | Except for this bonus, Imperial Navy ships led by a Space Marine Captain do not benefit from any of the Space Marines special rules conce... | Kapteeni ei tuo muita SM-sääntöjä; kortille. |
| S0305 | F140 | The Emperor's Inquisition | The ship adds +1 to its leadership (max 10). | Ordo Hereticus +1 Ld; komentajakortille. |
| S0306 | F140 | The Emperor's Inquisition | It also adds +2 to its roll during a boarding action. | +2 boarding. |
| S0309 | F141 | The Emperor's Inquisition | It also adds +2 to its roll during a boarding action against alien vessels, during which Xenos ships subtract -1 from their roll. | Ordo Xenos boarding. |
| S0310 | F141 | The Emperor's Inquisition | Rolled saves by holofields, shadowfields or any similar rule against a boarding action or hit and run attack succeed on a 3+ instead of a... | Ordo Xenos holofield-muutos. |
| S0328 | F144 | Grey Knights | This ship adds +2 to its dice roll during a boarding action. | +2 boarding. |
| S0496 | F234 | 5 listaa | If so then add +1 to the Leadership rolled for the ship at the start of the game subject to a maximum of 9. | Lordin +1 Ld (max 9). |
| S0819 | F372 | Orks/Da Ork Clanz | A Warlord adds +2 to one boarding dice roll per game. | Warlordin boarding-bonus kerran pelissä. |
| S0825 | F372 | Orks/Da Ork Clanz | He may also swap leadership with any one ship or escort squadron under his command. | Ld:n vaihto. |

### gifts (14)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0186 | F118 | AdMech/Explorator | This option cannot be used if the vessel embarks a Mechanicus Archmagos. | Gifts-valinta ei koske Archmagosin alusta. |
| S0198 | F119 | AdMech/Explorator | Mechanicus capital ships must also roll a D6 once against the Mechanicus Gifts table. | Gifts-heitto ennen peliä. |
| S0199 | F119 | AdMech/Explorator | Re-roll any refit that is not applicable to the vessel. | Gifts. |
| S0200 | F119 (osittain) | AdMech/Explorator | D6 ROLL MECHANICUS GIFT Emergency Energy Reserves: When crippled, the ship only reduces turrets, shielding and weapons by 25% rather than... | Gifts-taulukon otsikko ja rivi 1 (rivinumero puuttuu). (poimintavika: table) |
| S0201 | F119 | AdMech/Explorator | The vessel still counts as crippled in every other respect. | Gifts. |
| S0202 | F119 | AdMech/Explorator | Advanced Engines: The ship gains +5cm speed, as well as +1D6 when on All Ahead Full special orders. | Gifts (Advanced Engines). Koodiosumat ovat eri lauseita. |
| S0203 | F119 | AdMech/Explorator | Repulsor Shielding: Ignore all negative effects of having a blast marker or gas clouds in contact with the ship's base as it applies to l... | Gifts. |
| S0204 | F119 | AdMech/Explorator | Fleet Defence Turrets: Up to two turrets on the ship are exchanged for fleet defence turrets capable of protecting itself or any one othe... | Gifts (sama vaikutus kuin Bakan refit s.50). |
| S0205 | F119 | AdMech/Explorator | Gyro-stabilized Targeting Matrix: Ship weapons are reduced to 75% instead of 50%when on All Ahead Full, Come To New Heading or Burn Retro... | Gifts. |
| S0206 | F119 | AdMech/Explorator | Nova Cannon still cannot fire. | Gifts, edellisen jatko. |
| S0269 | F124 | AdMech/Explorator | A Mechanicus Archmagos can elect up to any one desired item from the Adeptus Mechanicus refit table for their own ship as part of their p... | Archmagosin aluksen Gifts-valinta ennen peliä; komentajakortille. |
| S0270 | F124 | AdMech/Explorator | If the second refit rolled is identical to the one selected, the commander can select the second refit as well! | Gifts. |
| S0271 | F124 | AdMech/Explorator | The benefit a Mechanicus Archmagos brings with it cannot be combined with a refit selected because the ship rolled a 6 when determining b... | Gifts. |
| S0274 | F125 | AdMech/Explorator | The Omnissiah’s Victory may not take any Mechanicus Gifts refits, as its Mechanicus Gifts are already included in its point cost and spec... | Omnissiah's Victory ei heitä Gifts-taulukolta; aluksen kortille. |

### impaler (14)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0661 | F346 | Dark Eldar/Pirates | Fighters which attack the Impaler do not automatically remove it from play. | Impaler-säännöt; kortille. |
| S0662 | F346 | Dark Eldar/Pirates | Instead the Impaler rolls a D6 and remains in play on a 4+. | Impaler. |
| S0663 | F346 | Dark Eldar/Pirates | The Impaler can only use this save once per ordnance phase, but if it does so against a fighter in base contact with a ship and subsequen... | Impaler. |
| S0664 | F346 | Dark Eldar/Pirates | Turrets may fire at the Impaler, in the same way as against ordnance. | Impaler. |
| S0665 | F346 (osittain) | Dark Eldar/Pirates | Roll a D6. | Pelkkä 'Roll a D6.' – liian lyhyt haettavaksi; kuuluu Impalerin hyökkäykseen s.346. |
| S0666 | F346 | Dark Eldar/Pirates | On a score of a 1 the Impaler’s boarders are defeated and the module may not be used for the remainder of the game. | Impaler. |
| S0667 | F346 | Dark Eldar/Pirates | On a 2-6 the Impaler causes a critical hit, but instead of just looking up the rolled score on the Critical Hits table, you roll 2D6 and ... | Impaler. |
| S0668 | F346 | Dark Eldar/Pirates | Against Tyranids, you must roll 2D6 twice and take the lowest roll. | Impaler. |
| S0669 | F346 | Dark Eldar/Pirates | At the beginning of each of the Dark Eldar player’s turn he must remove any Impalers from the table (these are assumed to have been force... | Impaler. |
| S0670 | F346 | Dark Eldar/Pirates | He may of course attempt to reload ordnance during the turn in order to relaunch said Impalers (ie he reloads ordnance as quickly as poss... | Impaler. |
| S0671 | F346 | Dark Eldar/Pirates | You may not launch additional Impalers if you already have a number of Impalers in play equal to the number of Impaler armed vessels in t... | Impaler. |
| S0672 | F346 | Dark Eldar/Pirates | Impalers are not deployed from launch bays in any way, shape or form, so the overall number of launch bays in a fleet does not affect the... | Impaler. |
| S0673 | F346 | Dark Eldar/Pirates | If the Impaler is removed (either by turrets, enemy ordnance, attack craft and so on), the Dark Eldar vessel must reload ordnance as norm... | Impaler. |
| S0674 | F346 | Dark Eldar/Pirates | An Impaler can only be completely destroyed by a failed Hit & Run attack (a roll of 1 on the initial attack as described above), which wo... | Impaler. |

### victory_points (12)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0851 | F370 | Orks/Da Ork Clanz | This also means the enemy only gets additional victory points for the Gubbins if the tiddla skwadron is wiped out. | Voittopisteet. |
| S0852 | F370 | Orks/Da Ork Clanz | If a single escort survives the battle, the enemy does not get additional victory points for the Gubbins. | Voittopisteet. |
| S0898 | F369 | Orks/Da Ork Clanz | This also means the enemy only gets additional victory points for the clan upgrade if the tiddla skwadron is wiped out. | Voittopisteet. |
| S0899 | F369 | Orks/Da Ork Clanz | If a single escort survives the battle, the enemy does not get additional victory points for the clan upgrade. | Voittopisteet. |
| S0952 | F402 | Necrons/Harvest Fleet | DISENGAGING AND VICTORY POINTS Necrons will always prefer to disengage than fight to the end. | Disengage ja VP. (poimintavika: heading) |
| S0953 | F402 | Necrons/Harvest Fleet | At the end of its Movement phase any Necron ship may perform a 'fade out' disengage automatically. | Fade out; kortilla (domain.js:2918). |
| S0954 | F402 | Necrons/Harvest Fleet | At the end of a game, including normal Victory points, count up the Necron losses using the following modifiers: • Any capital ship that ... | Necron-VP. |
| S0955 | F402 | Necrons/Harvest Fleet | • Any capital ship that disengages with any damage at all or any raider that disengages counts as 25 % destroyed. | Necron-VP. |
| S0956 | F402 | Necrons/Harvest Fleet | • Any capital ship that is crippled counts as 50 % destroyed. | Necron-VP. |
| S0957 | F402 | Necrons/Harvest Fleet | • Any capital ship that is destroyed but not left as a drifting hulk counts as 200 % destroyed. | Necron-VP. |
| S0958 | F402 | Necrons/Harvest Fleet | • Any capital ship that is destroyed and left as a drifting hulk counts as 300 % destroyed. | Necron-VP. |
| S1072 | F450 | Tau/Commerce Protection, Tau/Merchant Fleet | Likewise, the number of gravitic hooks is unimportant when calculating victory points (your opponent does not get VPs for surviving escor... | Hookit ja VP. |

### ordnance_choice (10)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0022 | F35 | IN/Armageddon Sector, IN/Bastion Fleets, IN/Gothic Sector | Any ship with launch bays may choose to have them launch any mix of Fury interceptors and Starhawk bombers. | Ordnance-tyyppi valitaan pelissä. |
| S0086 | F49 | IN/Bakka Sector | Any ship with launch bays may use any mix of Fury interceptors and Starhawk bombers. | Ordnance valitaan pelissä. |
| S0275 | F125 | AdMech/Explorator | Attack carriers may use any combination of Fury interceptors and Starhawk bombers. | Ordnance pelissä. |
| S0488 | F233 | Chaos/Incursion | Ships with launch bays can have a mixture of Swiftdeath fighters, Doomfire bombers or Dreadclaw assault craft. | Ordnance pelissä. |
| S0511 | F235 | 5 listaa | Ships with launch bays can have a mixture of Swiftdeath fighters, Doomfire bombers and Dreadclaw assault craft. | Ordnance pelissä. |
| S0620 | F316 | Corsairs/Gothic Sector, Corsairs/Later Gothic War | Any ship with launch bays may choose to have them launch any mix of Darkstar fighters and Eagle bombers. | Ordnance pelissä. |
| S0647 | F319 | Eldar/Iyanden Craftworld | Any ship with launch bays may choose to have them launch any mix of Nightwing fighters and Phoenix bombers. | Ordnance pelissä. |
| S0717 | F351 | Dark Eldar/Pirates | Ships with launch bays may launch any mix of Raptor fighters, Razorwing bombers and Slavebringer assault boats. | Ordnance pelissä. |
| S0817 | F367 | Orks/Waaagh! | Ships with launch bays can have a mixture of fighta-bommerz or assault boats. | Ordnance pelissä. |
| S1107 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | Any ship with launch bays may launch any mix of Barracudas or Mantas. | Ordnance pelissä. |

### abaddon (10)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0462 | F231 | 6 listaa | If Abaddon’s vessel makes any hit-&-run teleport attacks, add +1 to the dice roll for the attack as it will be undertaken by elite Black ... | Abaddonin kortti (domain.js:3531). |
| S0463 | F231 | 6 listaa | Boarding torpedoes and assault boats from Abaddon’s ship will be manned by more mundane minions and do not receive this modifier. | Abaddonin kortti. |
| S0464 | F231 | 6 listaa | “You have failed me for the last time…” Abaddon the Despoiler does not tolerate failure, as many of his followers have discovered to thei... | Abaddon. |
| S0465 | F231 | 6 listaa | If Abaddon’s re-roll is used for a Command check or Leadership test on another ship or squadron and the test is failed a second time, he ... | Abaddon. |
| S0466 | F231 | 6 listaa | In the Chaos Shooting phase Abaddon will direct at least half the available firepower and lance strength of the ship he is commanding aga... | Abaddon. |
| S0467 | F231 | 6 listaa | The victims of his wrath (assuming they survive) will be suitably chastised and gain a +1 Leadership increase for the remainder of the game. | Abaddon. |
| S0468 | F231 | 6 listaa | The Leadership bonus will only take effect once (after that the crews are working as hard as they can!). | Abaddon. |
| S0469 | F231 | 6 listaa | If the object of Abaddon’s wrath is not in range and/or fire arc he will leave them to their fate – Abaddon’s re-rolls may no longer be u... | Abaddon. |
| S0470 | F231 | 6 listaa | This means that no further Commander re-rolls may be used on the ship or squadron unless it is carrying its own Chaos Lord with a Mark of... | Abaddon. |
| S0471 | F231 | 6 listaa | No Leadership increase is gained. | Abaddon. |

### xenotech (6)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0312 | F141 | The Emperor's Inquisition | The vessel upon which the Inquisitor Lord is embarked may roll once against the following table and apply it to the ship. | Refit-heitto taulukolta ennen peliä. |
| S0314 | F141 | RT, The Emperor's Inquisition | Long Range Sensors: The vessel adds +1 to its base leadership (max of Ld 10). | Taulukon rivi; myös RT s.175. |
| S0315 | F141 | The Emperor's Inquisition | Targeting Matrix: The vessel counts all targets as closing when using the gunnery table within 30cm and ignores all right-shift modifiers... | Taulukon rivi. |
| S0316 | F141 | RT, The Emperor's Inquisition | Advanced Drive Technology: The vessel adds +5 cm to its speed as well as +1D6 when undergoing All Ahead Full special orders. | Taulukon rivi. |
| S0363 | F175 | RT | Targeting Matrix: The vessel counts all targets as closing when using the gunnery table within 30cm and ignores right-shift modifiers for... | Taulukon rivi. |
| S0364 | F175 | RT | Gravitic Thrusters: The vessel can double the maximum rate of its normal turn. | Taulukon rivi. |

### defence_rule (6)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0636 | F337 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Beginning turn 2, after the Eldar fleet moves roll a D6. On a 5+, one capital ship or escort squadron appears along the table edge closes... | Webway-saapuminen; puolustuskortille. |
| S0748 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When used in this manner, they follow all rules for planetary defences, meaning they automatically pass all leadership checks they are re... | Rok puolustuksena; kortilla rok_defence (domain.js:2952). |
| S0749 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Ork Roks cannot move and count as stationary in all effects when purchased as defences, including all rules concerning removal of blast m... | Sama. |
| S0750 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When used in this manner, roll 2D6 after setting up each Rok. | Sama. |
| S0751 | F360 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | On a roll of 12, the Rok falls 2D6 cm toward the celestial phenomena it is orbiting near. | Sama. |
| S1124 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | Tau Orbitals follow all High Orbit and Satellite defence rules. | Orbitaalien säännöt; kortilla (domain.js:2509). |

### leech (6)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0676 | F347 | Dark Eldar/Pirates | These must be loaded with a specific Reload Ordnance roll, although a ship may start the scenario with them in the tubes by writing a not... | Leech-lataus. |
| S0677 | F347 | Dark Eldar/Pirates | Leech torpedoes cause no damage other than a single, automatic critical hit (do not roll against armour). | Leech. |
| S0678 | F347 | Dark Eldar/Pirates | Brace for Impact can be used against this normally. | Leech. |
| S0679 | F347 | Dark Eldar/Pirates | Do not roll for the effect of this critical hit, instead the leech torpedo immediately causes a -10 cm speed reduction on its target. | Leech. |
| S0680 | F347 | Dark Eldar/Pirates | Only one -10 cm speed penalty applies regardless of the number attached – the effect is not cumulative. | Leech. |
| S0681 | F347 | Dark Eldar/Pirates | However, all leech hits on a ship must be repaired before the movement penalty is removed (eg if a ship suffers 5 leech hits, it remains ... | Leech. |

### ordnance_speed (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0002 | F32 | 4 listaa | ATTACK CRAFT SPEED Fury Interceptor 30 cm Starhawk Bomber 20 cm Shark Assault Boat 30 cm Note that attack craft are always carried into b... | Taulukon otsikko ja rivit yhdeksi lauseeksi liimattuna. Nopeudet ovat korteilla laukaisukuilun kantamana (J152); loppuosa 'no separate points value' on itsestäänselvä. **[ajo ok]** |
| S0660 | F346 (osittain) | Dark Eldar/Pirates | ATTACK CRAFT SPEED Raptor Fighter 30 cm Razorwing Bomber 20 cm Slavebringer Assault Boat 30 cm Impaler Assault Module The Impaler is a sp... | Nopeustaulukko ja Impaler-otsikko yhdessä. (poimintavika: table) |
| S0990 | F424 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | For reference, the ordnance speeds are as follows: ATTACK CRAFT SPEED Fighters 20 cm Assaults Boats 15 cm Boarding Torpedoes 15 cm Tyrani... | Nopeustaulukko. (poimintavika: table) |
| S1079 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | ATTACK CRAFT SPEED Barracuda Superiority Fighter 25 cm Manta Missile Destroyer 20 cm Mantas Mantas are bombers, each marker represents a ... | Nopeustaulukko + Mantas-otsikko. (poimintavika: table) |
| S1082 | F451 | Tau/Commerce Protection, Tau/Merchant Fleet | ORDNANCE SPEED Tau Missiles 20–40 cm Tau missiles are drone-guided and are fired in salvoes, each point of torpedo strength represents ab... | Nopeustaulukko + ohjusten kuvaus. (poimintavika: table) |

### leadership_roll (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0048 | F38 | IN/Bastion Fleets | Because of this, the ships and squadrons of Battlefleet Cadia must roll two dice and pick the lowest score when determining leadership. | Cadian Ld-heitto (kaksi noppaa, pienempi). Play-sivulla ei Ld-automatiikkaa (J198), mutta kortille muistutukseksi. |
| S0113 | F94 | SM/Codex Astartes, SM/Crusade, SM/Dominion | When randomly generating the Leadership value for a Space Marine ship, use the table here. | SM:n Ld-taulukko; kortille tai Play-sivun muistutukseksi (ei automatiikkaa, J198). |
| S0160 | F100 | SM/Dominion | Space Marine Captains roll against the Space Marines leadership table instead of the normal leadership table. | Kapteenin alus heittää SM:n Ld-taulukolta. |
| S0423 | F227 | 6 listaa | Daemon ship Leadership is rolled as normal (ie, 1=6, 2,3=7, 4,5=8, 6=9). | Daemonshipin Ld-heitto. |
| S1047 | F429 | Tyranids/Vanguard Fleet | Escort squadrons in a Tyranid Vanguard fleet each have a Leadership value equal to the number of vessels remaining in the squadron (up to... | Ld = laivueen koko. |

### commander_assign (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0049 | F38 | IN/Bastion Fleets | Each Veteran Captain must be assigned to a particular ship and improves its leadership by +1. | Veteran Captain sijoitetaan vasta Ld-heiton jälkeen (S0050), joten builder ei voi sitoa. |
| S0050 | F38 | IN/Bastion Fleets | You may wait until after rolling for leadership before deciding which ships to assign your veteran captains to. | Sijoitus Ld-heiton jälkeen. |
| S0052 | F38 | IN/Bastion Fleets | Even escort squadrons can have a Veteran Captain assigned to them, in which case the entire squadron receives the leadership bonus. | Laivueen Ld-bonus. |
| S0146 | F98 | SM/Crusade | The Master of the Fleet may be assigned to a venerable battle barge or fortress monastery if one is present, but does not have to be. | Vapaaehtoinen sijoitus VBB:lle tai fortress-monasterylle; vaikuttaa re-rollien yhdistämiseen (S0149). |
| S0484 | F232 | Chaos/Incursion | Each Chaos Lord must be assigned a ship and improves its Leadership rating to the value shown. | Lord sijoitetaan alukselle pöydällä; Ld komentajakortilla. |

### catastrophic_table (5)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0983 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | TYRANID CATASTROPHIC DAMAGE TABLE 2D6 Roll Extra Blast Markers Result 2-7 +1 Drifting carcass: The limp remains of the bio-ship drift thr... | Katastrofitaulukko. (poimintavika: heading) |
| S0984 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | The wreck moves 4D6 cm forward in each of its subsequent movement phases. | Katastrofitaulukko. |
| S0985 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Place a blast marker in contact with the corpse’s base after each move. | Katastrofitaulukko. |
| S0986 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Make a pyro- acid attack against every target within 3D6 cm, with a firepower equal to the ship’s starting damage. | Katastrofitaulukko. |
| S0987 | F423 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Make a bio-plasma attack against every target within 3D6 cm, with a Strength equal to half the exploding vessel’s starting damage. | Katastrofitaulukko. |

### reroll_use (4)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0395 | F178 | RT/Pirates and Wolf Packs | Pirate Captains may use their re-rolls on any vessel or escort squadron in the fleet, but no individual Pirate Captain may use more than ... | Re-rollien käyttö. |
| S0823 | F372 | Orks/Da Ork Clanz | A Warlord’s re-rolls only count for the skwadrons under his command and not for the whole fleet. | Re-rollit vain omille laivueille. |
| S1055 | F430 | Tyranids/Hive Fleet | Hive Mind Imperatives cause a Command check or Leadership test to be passed automatically. | Imperative. |
| S1056 | F430 | Tyranids/Hive Fleet | The decision to use a Hive Mind Imperative must be taken before the dice are rolled. | Imperative. |

### strange_happenings (3)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0063 | F39 | IN/Bastion Fleets | Unreliable ships will not continue to fight if crippled. | Strange happenings; reservi-Chaos-runkojen kortilla (J153). **[ajo ok]** |
| S0064 | F39 | IN/Bastion Fleets | If a vessel in a reserve fleet also fails the command check by rolling a double, then not only does it become unreliable but it also may ... | Strange happenings. |
| S0065 | F39 | IN/Bastion Fleets | When fighting against Chaos fleets, a vessel which has already become unreliable and rolls a second double for a command check must attem... | Strange happenings; kortin teksti domain.js:2889. |

### deployment (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0042 | F498 | 30 listaa | Stationary planetary defences may be placed in base contact if desired, but they can never be stacked or have their bases overlap other s... | Pöydälle asettelu. |
| S0043 | F498 | 30 listaa | Low orbit defences may only be deployed on the low orbit table. | Pöydälle asettelu. |

### random_refit (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0079 | F48 | IN/Bakka Sector | Respect for him extends to the forge world of Bakka itself, and his flagship receives one ship refit and weapon refit (rolled randomly) a... | Lippulaiva saa yhden ship refitin ja weapon refitin arvottuna ennen peliä; komentajakortille. |
| S1010 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | If a degree of randomness is desired the following refits can be rolled against 2D6 using the restrictions listed previously. | Valinnainen satunnaisheitto. |

### squadron_tabletop (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S1110 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | The Orcas from each parent ship fight as a squadron with the same Leadership as the parent. | Orcat emoaluksen Ld:llä. |
| S1119 | F455 | Tau/Commerce Protection, Tau/Merchant Fleet | The Dhows from each parent ship fight as a squadron with the same Leadership as the parent, but may be squadroned with other Dhows from v... | Dhowt emoaluksen Ld:llä. |

### reroll_pool (1)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0149 | F98 | SM/Crusade | If the Master of the Fleet is assigned to a fortress-monastery, its re-rolls are added to those of the Master of the Fleet and may be use... | Re-rollien yhdistäminen, kun MoF on monasteryllä. Vrt. J164 (Ramiliesin re-roll). |

## KAMPANJA: Kampanja ja skenaario (235 uniikkia, 642 esiintymää)

### campaign (88)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0080 | F48 | IN/Bakka Sector | In a campaign, a ship so refitted must remain his flagship unless it is destroyed. | Kampanjasääntö. |
| S0130 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Drop pods enable Space Marine capital ships to quickly deploy Space Marines to the surface and impart +2 assault points for each capital ... | Planetary assault -kampanja. |
| S0139 | F96 | 5 listaa | Ships not able to take a particular refit rolled randomly may re-roll the result. | Kampanjan refit-heitto (myös Tau s.452). |
| S0169 | F101 | SM/Dominion | However, in the course of a campaign, a Dominion Fleet cannot take reinforcements from the Space Marines table listed on [???] of the Bat... | Kampanjan täydennykset. |
| S0257 | F122 | AdMech/Explorator | In the course of a campaign, Mechanicus vessels can only earn additional refits from the standard Imperial Navy refit table or the Space ... | Kampanjan refitit. |
| S0258 | F122 | AdMech/Explorator | They cannot continue to gain refits from the Mechanicus Gifts table. | Kampanja. |
| S0259 | F122 | AdMech/Explorator | However, those vessels so engaged will always receive priority when requiring repair or rework at shipyards throughout the Imperium. | Kampanja. |
| S0260 | F122 | AdMech/Explorator | When calculating repair points at the end of a battle, the Adeptus Mechanicus fleet will always have +1 Repair point for every 10 renown ... | Kampanjan korjauspisteet. |
| S0262 | F122 | AdMech/Explorator | Additional refits earned by renown in the course of a campaign as listed on the following table are at no cost to the vessel they are app... | Kampanja. |
| S0263 | F122 | AdMech/Explorator | Unlike normal refits, these free refits may be taken from the Mechanicus Gifts table if desired (this is the only way a ship can ever ear... | Kampanja. |
| S0264 | F122 | AdMech/Explorator | However, they can only be applied to the fleet commander's flagship, they must be rolled randomly, and no refit can be used more than onc... | Kampanja. |
| S0265 | F122 | AdMech/Explorator | Should that vessel be lost, those refits are lost as well and do not follow the fleet commander to his new flagship. | Kampanja. |
| S0266 | F122 (osittain) | AdMech/Explorator | MECHANICUS PROMOTIONS Renown Title Ld Notes 1-5 Explorator Techpriest 1 re-roll 6-10 Magos Errant 1 re-roll, 1 refit 11-20 Magos Explorat... | Promotions-taulukko yhdeksi lauseeksi. (poimintavika: table) |
| S0369 | F176 | RT/Exploration | Over the course of a campaign, Rogue Trader cruisers cannot earn additional refits from the Xenotech list and must use the refit tables l... | Kampanja. |
| S0370 | F176 | RT/Exploration | Rogue Traders that join the fleet over the course of a campaign may start by taking one refit from the Xenotech list for the appropriate ... | Kampanja. |
| S0392 | F178 | RT/Pirates and Wolf Packs | They have very limited access to formal shipyards and cannot earn refits in the course of a campaign, but they may instead earn crew skil... | Kampanja. |
| S0448 | F229 | 6 listaa | CHAOS IN CAMPAIGNS DAEMONSHIPS Daemonships do not automatically regain hits after each battle. | Kampanja. (poimintavika: heading) |
| S0449 | F229 (osittain) | 6 listaa | CHAOS PROMOTIONS Renown Title Ld Notes 1-5 Chaos Champion 1 re-roll 6-10 Exalted Chaos Champion 1 re-roll, 1 Mark of Chaos 11-20 Tyrant 1... | Promotions-taulukko ja Appeals-otsikko yhdessä. (poimintavika: table) |
| S0685 | F348 | Dark Eldar/Pirates | DARK ELDAR IN CAMPAIGNS In a campaign, a Dark Eldar fleet commander earns promotions (re-rolls) in the same manner as the Eldar as listed... | Kampanja. (poimintavika: heading) |
| S0688 | F348 (osittain) | Dark Eldar/Pirates | ELDAR PROMOTIONS (ALL TYPES OF ELDAR) Renown Title Ld Bonus Notes 1-5 Captain +0 1 re-roll 6-10 Lord +1 1 re-rolls 11-20 Shadow Lord +1 2... | Promotions-taulukko ja crew skill -lause yhdessä. (poimintavika: table) |
| S0689 | F348 | Dark Eldar/Pirates | Eldar Havens may earn ship or weapon refits but not engine refits. | Kampanjan refitit. |
| S0690 | F348 | Dark Eldar/Pirates | Ships that cannot use the refit or crew skill rolled for whatever reason may re-roll the result, such as not being equipped with weapon b... | Kampanja. |
| S0691 | F349 (osittain) | Dark Eldar/Pirates | D6 roll Engine Refit Roll again. | Taulukon otsikko ja rivi 'Roll again'. (poimintavika: table) |
| S0692 | F349 | Dark Eldar/Pirates | The ship does not suffer a hit for moving through blast markers and ignores all effects of solar flares. | Refit-taulukon rivi. |
| S0693 | F349 | Dark Eldar/Pirates | The ship gains a 6+ save on a D6 against any damage it takes without requiring a Command Check. | Refit-taulukko. |
| S0694 | F349 | Dark Eldar/Pirates | This does not count as being braced, but the ship may not use this save when on Brace For Impact Special Orders or attempt to go on Brace... | Refit-taulukko. |
| S0695 | F349 | Dark Eldar/Pirates | Add an additional +1D6 cm speed when on All Ahead Full special orders. | Refit-taulukko. |
| S0696 | F349 | Dark Eldar/Pirates | Add +5 cm to the speed. | Refit-taulukko. |
| S0697 | F349 (osittain) | Dark Eldar/Pirates | D6 roll Ship Refit Crystal Web: A sizable colony of crystal spiders have been introduced to the hull, greatly enhancing the ship's chance... | Ship Refit -taulukon otsikko ja rivi. (poimintavika: table) |
| S0698 | F349 | Dark Eldar/Pirates | If the ship has no critical damage, roll a number of D6 equal to the number of hits it has remaining, recovering 1HP if any rolls of 6 ar... | Refit-taulukko. |
| S0699 | F349 | Dark Eldar/Pirates | No more than 1HP can be regained in this manner per turn, regardless of how many rolls of 6 are made. | Refit-taulukko. |
| S0700 | F349 | Dark Eldar/Pirates | Enemy vessels do not gain +1 Leadership for this vessel going under Special Orders. | Refit-taulukko. |
| S0701 | F349 | Dark Eldar/Pirates | The vessel ignores all penalties to leadership tests, such as blast markers, Marks of Chaos, etc. | Refit-taulukko. |
| S0702 | F349 | Dark Eldar/Pirates | Before the battle begins, the vessel gains +1HP to its starting damage capacity. | Refit-taulukko. |
| S0703 | F350 (osittain) | Dark Eldar/Pirates | Roll on the following table: D6 roll Weapons Refit Talons: Both the outer hull and the ship’s airlocks are lined with psychically charged... | Weapons Refit -taulukon otsikko ja rivi. (poimintavika: table) |
| S0704 | F350 | Dark Eldar/Pirates | Distortion Charges: The vessel has been fitted with a weapon system which ejects a Warp Distortion charge into its wake (usable once per ... | Refit-taulukko. |
| S0705 | F350 | Dark Eldar/Pirates | This D-charge must be placed at the same time the player places the rest of the fleet’s ordnance on the table, in the ship’s aft firing arc. | Refit-taulukko. |
| S0706 | F350 | Dark Eldar/Pirates | When launched, it moves 10 cm toward the nearest enemy vessel every ordnance phase. | Refit-taulukko. |
| S0707 | F350 | Dark Eldar/Pirates | If it comes in contact with an enemy ship’s base, the enemy vessel may attempt to shoot it down with turrets, hitting on a roll of 6. | Refit-taulukko. |
| S0708 | F350 | Dark Eldar/Pirates | At the beginning of each subsequent Dark Eldar turn roll a D6. | Refit-taulukko. |
| S0709 | F350 | Dark Eldar/Pirates | Ships fitted with lance-type weapons may re-roll their first miss each turn. | Refit-taulukko. |
| S0710 | F350 | Dark Eldar/Pirates | When first launched, ordnance receives an extra +10 cm to its movement. | Refit-taulukko. |
| S0711 | F350 | Dark Eldar/Pirates | Blast markers do not cause a column shift when the ship’s weapon batteries fire through them. | Refit-taulukko. |
| S0712 | F350 | Dark Eldar/Pirates | Add +15 cm range to the ship’s weapon batteries and lance-type weapons. | Refit-taulukko. |
| S0752 | F361 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | D6 roll Engine Refit Improved Engines: The Mekaniaks have improved the efficiency of the ship’s engines to an astonishing degree. | Engine refit -taulukon otsikko ja rivi. (poimintavika: table) |
| S0753 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The ship rolls an extra 2D6 when on All Ahead Full special orders. | Refit-taulukko. |
| S0754 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Once per game when you use the All Ahead Full special orders, you may double the result of the dice roll to see how far you go. | Refit-taulukko. |
| S0755 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | You must travel this FULL distance. | Refit-taulukko. |
| S0756 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When rolling to disengage add +2 to the Leadership value. | Refit-taulukko. |
| S0757 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | A ship with this refit may ignore the movement penalty for Blast Markers in contact with its base, or it travels though (including gas cl... | Refit-taulukko. |
| S0758 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Due to the Ork belief red ships go faster, increase the ships speed by 5 cm. | Refit-taulukko. |
| S0759 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Note: the model must be painted red to get this benefit. | Refit-taulukko. |
| S0760 | F361 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | D6 roll Ship Refit Improved Tellyportas: Orks are the undisputed masters of Tellyporta Teknologee, and have been able to improve this shi... | Ship refit -taulukon otsikko ja rivi. (poimintavika: table) |
| S0761 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Add +1 to all hit-and-run attacks made by the Tellyporta. | Refit-taulukko. |
| S0762 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | This has had the effect of increasing the ships damage by 25%, but decreasing its speed by 5 cm. | Refit-taulukko. |
| S0763 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | More Shields: If one is good two must be better. | Refit-taulukko. |
| S0764 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Due to the extra confidence this spike gives the Krew add +1 to leadership when rolling to ram. | Refit-taulukko. |
| S0765 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | For each hit against the shields roll a D6; on a 6 the increased shielding absorbs the hit and it is ignored, place no blast marker. | Refit-taulukko. |
| S0766 | F361 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | On a 1 roll a further D6; on a 6 take a critical hit as the power meant for the shields overloads another system. | Refit-taulukko. |
| S0779 | F362 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Roll on the following table: D6 roll Weapons Refit Weirdboy Tower: During the last battle, the power of the Waagh was too much for one of... | Weapons refit -taulukon otsikko ja rivi. (poimintavika: table) |
| S0780 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The Weirdboy is the equivalent of a Strength-1 Lance, with a range of 15 cm. | Refit-taulukko. |
| S0784 | F363 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | 2D6 roll Skill Look wot I did Boss – changed yoor Kroozer! | Kampanjataulukon otsikko ja rivi. (poimintavika: table) |
| S0785 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | However, your crew doesn’t know what to do yet and loses 1 Ld for the next battle only. | Kampanja. |
| S0786 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Pillagin’: You may add up to 1 kroozer or squadron of escorts to your roster for each system you control. | Kampanja. |
| S0787 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Each unit you add forces you to reduce the grade of the system as follows: Forge becomes Mining, Civilised becomes Agri, all others becom... | Kampanja. |
| S0788 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Lootin’: For each hulk you captured last scenario you may give one of your kroozers Looted Torpedoes or Extra Power Fields. | Kampanja. |
| S0789 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Oddboyz: For each civilised system or hive world you control you may give one of your kroozers any warlord upgrade except Looted Torpedoe... | Kampanja. |
| S0790 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | You may add a warlord to your registry. | Kampanja. |
| S0791 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Take us wiv ya: A mob of boyz piles aboard one of your ships, which receives a +1 boarding modifier. | Kampanja. |
| S0792 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Your flagship gains a +2 boarding modifier for the rest of the campaign. | Kampanja. |
| S0793 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Assign them to two vessels, which receive a +1 boarding modifier for the rest of the campaign. | Kampanja. |
| S0794 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The next time you are the attacker in a battle you may nominate two systems to be attacked. | Kampanja. |
| S0795 | F363 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The battle will be 1,500 to 2,000 points. | Kampanja. |
| S0841 | F373 | Orks/Da Ork Clanz | This is essentially “you” and must be on the most expensive ship in the fleet, even if it is a Space Hulk. | Kampanjan komentaja-Warlord ('In campaigns, nominate one Warlord') kalleimmalle alukselle. |
| S0842 | F373 | Orks/Da Ork Clanz | The fleet commander still starts with one re-roll and may purchase up to one more at the start of the campaign, earning more (along with ... | Kampanja. |
| S0843 | F373 | Orks/Da Ork Clanz | This means the fleet commander personally starts with no more than one tiddla squadron of up to ten escorts and one other skwadron (or tw... | Kampanja. |
| S0844 | F373 | Orks/Da Ork Clanz | Fleet commander re-rolls can only be used by his or her own skwadrons. | Kampanjakomentajan re-rollit. |
| S0845 | F373 | Orks/Da Ork Clanz | The fleet commander cannot earn more re-rolls than would be allowed by p.153 of the Rulebook, even if a second re-roll was purchased at t... | Kampanja. |
| S0850 | F370 | Orks/Da Ork Clanz | Each Warlord that does so at least twice over the course of a campaign may have their first normally earned refit for free instead of pay... | Kampanja. |
| S0960 | F402 | Necrons/Harvest Fleet | NECRON IN CAMPAIGNS Necron repair points Due to the advanced nature of Necron technology all Necron ships must expend double the normal a... | Kampanjan korjauspisteet. (poimintavika: heading) |
| S0961 | F402 | Necrons/Harvest Fleet | Refits Necrons do not have access to any refits or crew skills in the course of a campaign, but the fleet as a whole may earn additional ... | Kampanja. (poimintavika: heading) |
| S1003 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | They may gain refits in the course of a campaign. | Kampanja. |
| S1005 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | During a campaign, no one ship can gain more than one different kind of special refit before each battle. | Kampanja. |
| S1008 | F426 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | These improvements represent the only means of evolving against increasingly capable foes, for Tyranids operate under Instinctive Behavio... | Ei crew skillejä. |
| S1064 | F431 | Tyranids/Hive Fleet | In a campaign, ordnance does not form a permanent part of the fleet and is ‘used up’ in a battle. | Kampanja. |
| S1090 | F452 | Tau/Commerce Protection, Tau/Merchant Fleet | TAU IN CAMPAIGNS In a campaign, a Tau fleet commander earns promotions (re-rolls) in the same manner as Imperials. | Kampanja. (poimintavika: heading) |
| S1091 | F452 (osittain) | Tau/Commerce Protection, Tau/Merchant Fleet | They do not have access to the special torpedo refit table listed on pg 19, though they may use Torpedo Bombers and Orbital Mines as list... | Kampanjan refitit; lause katkeaa sivuviitteeseen 'pgs.'. (poimintavika: split) |
| S1159 | F486 | Demiurg/War Host | In campaigns, Demiurg and vessels on this fleet list allied with them may gain leadership, crew skills and refits in the same manner as I... | Kampanja. |

### scenario (61)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0116 | F94 | SM/Codex Astartes, SM/Crusade, SM/Dominion | In an Exterminatus scenario, a battle barge can be used as an Exterminator, unchanged from the following data sheet (battle barges are eq... | Exterminatus-skenaario. |
| S0156 | F99 | SM/Crusade | A Space Marine Crusade fleet with a fortress- monastery will always be the defender in a scenario. | Monasteryn kanssa aina puolustaja. Voisi näkyä rosterin muistutuksena. |
| S0157 | F99 | SM/Crusade | Like the rules for a Ramilies Star Fortress, the fortress-monastery should only be used as a defence or in some scenarios substituting fo... | Skenaarion käyttöohje. |
| S0291 | F139 | The Emperor's Inquisition | Scenarios may be rolled normally in any agreed-upon fashion. | Skenaariot. |
| S0292 | F139 | Grey Knights, The Emperor's Inquisition | If a Convoy Run scenario is rolled and the defending fleet list includes an Inquisition Blackship, this vessel may be used as the objecti... | Convoy Run. |
| S0293 | F139 | Grey Knights, The Emperor's Inquisition | A single Inquisitorial Cruiser may be included as part of the escorting fleet if desired and the points are available, keeping in mind th... | Convoy Run. |
| S0307 | F140 | The Emperor's Inquisition | If a Blackship is used as an Exterminatus vessel, a Hereticus Inquisitor must lead it. | Exterminatus-skenaarion ehto. |
| S0343 | F146 | Grey Knights | Scenarios may be rolled normally in any agreed- upon fashion. | Skenaariot. |
| S0378 | F177 | RT/Exploration | Transports taken for the fleet can be used for any scenario that actually requires transports. | Kuljetukset skenaarioissa. |
| S0391 | F178 | RT/Pirates and Wolf Packs | However, if the Pirate fleet is the attacker and has a fleet of 1,500 points or greater, they may elect to play a Planetary Assault on a ... | Skenaario. |
| S0420 | F227 | 6 listaa | Daemon ships cannot carry Exterminatus weapons and do not score any points for landing troops in a planetary assault (the Daemons are bou... | Exterminatus ja planetary assault. |
| S0571 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The defender (Eldar) does not spend extra points on planetary defences – these are included in the special rules for the craftworld inste... | Craftworld-skenaario (Iyanden). |
| S0572 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Since the attackers are Tyranids, they do not gain any extra transport models (since all Tyranid ships are ‘transports’ in effect), but i... | Craftworld-skenaario. |
| S0573 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Reserves: Any number of Eldar ships (including the flagship!) may be purchased against the fleet’s total at 50% cost, but they count as r... | Craftworld-skenaarion 50 % reservit. Vastaava Haven/Webway-sääntö s.337 on toteutettu (domain.js:4588), joten skenaario voisi käyttää samaa mekanismia. |
| S0574 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Ships may not use their re-rolls if they are not yet in play. | Skenaario. |
| S0575 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Determine the battlezone normally using a D3 for a Primary Biosphere, Outer Reaches or Deep Space result. | Skenaario. |
| S0576 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The defender can choose to place ships and squadrons either on patrol or on standby in high orbit, or within the craftworld’s gravity (lo... | Skenaario. |
| S0577 | F312 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Roll a D6 for each defending ship/ squadron (except Shadowhunters) on patrol: on a 1-3 the attacker may set up the ship/squadron, on a 4-... | Skenaario. |
| S0578 | F313 (osittain) | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | DEFENDER'S DEPLOYMENT AREA ATTACKER'S DEPLOYMENT AREA 30 cm 30 cm 30 cm 30 cm 150 cm 15 cm Ships on patrol may be set up anywhere that is... | Karttakuvan tekstit liimattu lauseen alkuun. (poimintavika: table) |
| S0579 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The attacker deploys his fleet within 15cm of the short table edge furthest from the planet. | Skenaario. |
| S0580 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Shadowhunter Patrols Shadowhunters are quite simply the most nimble patrol vessels in the galaxy, and so must always be set-up on patrol,... | Skenaario. (poimintavika: heading) |
| S0581 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The Tyranid assault of Hive Fleet Kraken targetted Iyanden, which is a very large craftworld (about 25cm in diameter). | Skenaario. |
| S0582 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | However, if you are refighting this scenario with another craftworld as the target, or if you want to introduce some degree of randomness... | Skenaario. |
| S0583 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | However, they do not roll for moons, rings, etc. | Skenaario. |
| S0584 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Small craftworlds have a gravity well of 10cm, medium craftworlds of 15cm and large craftworlds of 20cm. | Skenaario. |
| S0585 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The craftworld is placed no more than 150cm from one of the short table edges. | Skenaario. |
| S0586 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Whilst craftworlds do actually travel through space, their progress is so remarkably slow that during the course of a battle they will ex... | Skenaario. |
| S0587 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Instead of planetary defenses in the normal sense, individual areas of the Craftworld are purpose-constructed to provide for its collecti... | Skenaario. |
| S0588 | F313 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Whilst other craftworlds may vary in their defenses, you can safely use the following rules as standard for all craftworlds. | Skenaario. |
| S0589 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Each time an Assault Point is scored (or ‘landed’ on the Craftworld), roll a dice. | Skenaario. |
| S0590 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | During the Eldar player’s Shooting phase, the two fortresses each unleash one 45cm pulsar lance against each escort squadron or capital s... | Skenaario. Koodiosumat ovat low orbit -sääntöjä. |
| S0591 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | These cannot be redirected or “stacked” on a single or group of targets; each enemy escort squadron or capital ship can receive no more t... | Skenaario. |
| S0592 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | During each End phase, roll one dice for each Assault Point already scored on the craftworld. | Skenaario. |
| S0593 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | If any of these score a ‘6’ one of the fortresses are damaged, and the chance of destroying enemy Assault Points, or scoring a hit on shi... | Skenaario. |
| S0594 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | No matter how many 6’s are rolled, only a single –1 reduction can apply in each End phase, meaning only a single Fortress can be affected... | Skenaario. |
| S0595 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | Skenaario. |
| S0596 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Like the fortresses, one dice must be rolled during each End Phase for each Assault Point already scored on the craftworld. | Skenaario. |
| S0597 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | If any of these score a ‘6’ the Spear of Light is damaged, and a Reload Ordnance special order must be passed each time the weapon is use... | Skenaario. |
| S0598 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Any Eldar capital ship in low orbit can dock with the Craftworld by “landing” on the surface without requiring a leadership check. | Skenaario. |
| S0599 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Unlike when coming in contact with a planet’s surface, the vessel does not count as destroyed by doing so, though it must subsequently re... | Skenaario. |
| S0600 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | It gains +4D6 to repair critical damage in the End Phase and may regain up to 1Hp damage for every roll of 6 not used to repair critical ... | Skenaario. |
| S0601 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Additionally, it counts as passing a Reload Ordnance special order for free. | Craftworld-skenaario. |
| S0602 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | However, it may not move, shoot or launch ordnance while docked, critical damage that cannot normally be repaired during a battle (such a... | Skenaario. |
| S0603 | F314 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Holofields work normally against gunnery-based weapons, and the ship benefits from an additional right column shift and may ignore blast ... | Skenaario. |
| S0605 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Beginning turn 2, after the Eldar fleet moves roll a D6. | Skenaarion webway-saapuminen. |
| S0606 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | On a 5+, D3 capital ships and/or escort squadrons of the owning player’s choice held in reserve at the start of the game now appear along... | Skenaario. |
| S0607 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Eldar ships cannot move or shoot in the same turn they appear. | Skenaario. |
| S0608 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | FIRST TURN The players roll a D6, with each player adding their fleet’s initiative (attack rating) to the roll. | Skenaario. (poimintavika: heading) |
| S0609 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Whoever got the highest may take either the first or second turn. | Skenaario. |
| S0610 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | SPECIAL RULES Attacking ships must move within 30cm of the craftworld table edge (which obviously replaces the planet edge) on the low or... | Skenaario. (poimintavika: heading) |
| S0611 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | However, should you wish to vary the attackers, the following basic rules apply: For each turn an attacking capital ship spends within 30... | Skenaario. |
| S0612 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | For each turn an attacking transport spends within 30cm of the craftworld edge, the attacker scores 2 Assault Points. | Skenaario. |
| S0613 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | A ship deploying troops or bombarding the craftworld may not do anything else that turn. | Skenaario. |
| S0614 | F315 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | VICTORY CONDITIONS Add up the Assault Points earned by the attacker and add +1 to the total for every 500 Victory Points (rounding down) ... | Skenaarion voittoehdot. (poimintavika: heading) |
| S0683 | F347 | Dark Eldar/Pirates | TRANSPORTS Dark Eldar fleets may use Imperial transports (of all types) in scenarios that call for transports where the Dark Eldar are pl... | Kuljetukset skenaarioissa. (poimintavika: heading) |
| S1034 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | SCENARIO NOTES CRUISER CLASH Tyranids can use one hive ship and three cruisers instead of the four cruisers. | Skenaariohuomautus. (poimintavika: heading) |
| S1035 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | If this option is used, refits or escorts cannot be taken, and the hive ship cannot be higher than Ld 8. | Skenaario. |
| S1036 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Tyranid hive fleets don’t add extra transport ships but instead score 1 Assault Point for each spore cyst on ships which get within 30 cm... | Skenaario. |
| S1037 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | Each Strength point of torpedoes and each assault boats marker which reaches the surface also scores one Assault Point. | Skenaario. |
| S1038 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | To balance this the Tyranid player adds +1 to the roll for divisions to arrive on the tabletop. | Skenaario. |
| S1039 | F428 | Tyranids/Hive Fleet, Tyranids/Vanguard Fleet | EXTERMINATUS Tyranids will never be the attacking forces in an exterminatus scenario – substitute Planetary Assault instead if randomly g... | Skenaario. (poimintavika: heading) |

### appeals (29)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0005 | F33 (osittain) | 4 listaa | Roll 2D6 on the following table: 2D6 roll Result One of the Chapter’s handful of battle barges is diverted to support your fleet. | Space Marine Appeals -taulukon otsikko ja rivi 2 liimattuna (rivinumero puuttuu). Kampanjasääntö. |
| S0006 | F33 | 4 listaa | You may include one Space Marine battle barge in your next game for free, as long as you have a model to represent it (if not, roll this ... | Appeals-taulukon tulos (seuraava peli). Koodiosuma build_data.py:1367 on eri lause (Codex Astartes per_points). |
| S0007 | F33 | 4 listaa | You may include two strike cruisers in your next game for free, as long as you have models to represent them (if you don’t, roll this res... | Appeals-taulukon tulos. |
| S0008 | F33 | 4 listaa | You may include one strike cruiser in your next game for free, as long as you have a model to represent it (if not, roll again). | Appeals-taulukon tulos. |
| S0009 | F33 | 4 listaa | Add +1 to Boarding Action rolls for those ships for the rest of the campaign. | Appeals-taulukon tulos. |
| S0010 | F33 | 4 listaa | Add +1 to Boarding Action rolls for that ship for the rest of the campaign. | Appeals-taulukon tulos. |
| S0011 | F33 | 4 listaa | The Chapter supplies several squads of Space Marines and Thunderhawk Gunships (which count as assault boats) for one ship of your choice ... | Appeals-taulukon tulos. |
| S0012 | F33 | 4 listaa | The ordnance will be repaired or replaced after each game so that the ship may use assault boats for the rest of the campaign. | Appeals-taulukon tulos. |
| S0013 | F33 | 4 listaa | The Chapter supplies several squads of Space Marines and boarding torpedoes for one ship of your choice (note that the ship must be capab... | Appeals-taulukon tulos. |
| S0014 | F33 | 4 listaa | The ordnance will be repaired or replaced after each game so that the ship may use boarding torpedoes for the rest of the campaign. | Appeals-taulukon tulos. |
| S0015 | F33 | 4 listaa | Add +2 to Boarding Action rolls for that ship for the rest of the campaign. | Appeals-taulukon tulos. |
| S0016 | F33 | 4 listaa | You may train one ship’s crew after each game – mark the fact they have been trained on your fleet registry. | Appeals-taulukon tulos (koulutus pelien välissä). |
| S0017 | F33 | 4 listaa | Ships which have been trained may re-roll the dice in a boarding action. | Appeals-taulukon tulos. Koodiosumat ovat eri re-roll-lauseita. |
| S0018 | F33 | 4 listaa | In your next game your opponent must reduce his points value by D6x30. | Appeals-taulukon tulos (vastustajan pisteet). |
| S0019 | F33 | 4 listaa | In the next game you play where your opponent has planetary defences, their value will be reduced by D6x30 points. | Appeals-taulukon tulos. |
| S0136 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Space Marines may roll appeals against the Space Marines table on [???] if desired. | Appeals-taulukko; kirjan oma sivuviite '[???]'. |
| S0137 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | Ships earned as a result of rolling against this table are considered to be “for free” and do not count against fleet restrictions. | Appeals. |
| S0138 | F96 | SM/Codex Astartes, SM/Crusade, SM/Dominion | For example, a 1,500-point Space Marine fleet with two battlebarges that rolls a 2D6 roll of 2 against this table may waive the point res... | Appeals, esimerkki. |
| S0450 | F229 (osittain) | 6 listaa | 2D6 roll Result You implore the Chaos gods for their unholy gifts, but the dark powers smite you for your impudence. | Appeals-taulukko. (poimintavika: table) |
| S0451 | F229 | 6 listaa | You may re-roll the dice when deciding who has the initiative in the next campaign turn. | Appeals. |
| S0452 | F229 | 6 listaa | A single enemy ship within 15 cm during your end phase is attacked. | Appeals. |
| S0453 | F229 | 6 listaa | Roll a D6: this is the number of dice you can roll to hit against the target’s Armour (shields have no effect). | Appeals. |
| S0454 | F229 | 6 listaa | You may add a Chaos Lord (with a Mark of Chaos if you wish) to your Fleet Registry. | Appeals. |
| S0455 | F229 | 6 listaa | Your flagship may add +1 to all boarding actions it is involved in. | Appeals. |
| S0456 | F229 | 6 listaa | Your flagship and any ship with a Chaos Lord aboard may add +1 to all boarding actions it is involved in for the rest of the campaign. | Appeals. |
| S0457 | F229 | 6 listaa | Any one ship in your fleet may add +2 to all boarding actions it is involved in for the rest of the campaign. | Appeals. |
| S0458 | F229 | 6 listaa | One ship in your fleet may be equipped with boarding torpedoes and/or Dreadclaw assault boats. | Appeals. |
| S0459 | F229 | 6 listaa | In your next battle, one ship in your fleet may be given a Chaos Reward for free, as if the Warmaster or a Chaos Lord was on board (this ... | Appeals. |
| S0460 | F229 | 6 listaa | In the next battle, any enemy ship within 15 cm of this vessel counts as having one Blast marker in contact with its base. | Appeals. |

### crew_skills (29)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0559 | F310 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | ELDAR CREW SKILLS Over the course of a campaign, a ship’s crew develops experience that only comes from serving together in the crucible ... | Eldarin kampanjan crew skill -taulukon johdanto. (poimintavika: heading) |
| S0560 | F310 (osittain) | 4 listaa | Roll on the following table: D6 roll Skill Expert Gunnery: The ship’s gun crews are amongst the finest in the whole sector, able to lay d... | Taulukon otsikko ja rivi 1. (poimintavika: table) |
| S0561 | F310 | 4 listaa | When the ship attempts to make Lock-On Special Orders, you may roll 3D6 and discard the highest D6 before comparing the roll against the ... | Taulukon rivi. |
| S0562 | F310 | 4 listaa | This vessel may always attempt to go on Special Orders, even if another ship or squadron in the fleet has failed a command check this turn. | Taulukon rivi. |
| S0563 | F310 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | Bombers launched by this vessel may survive being intercepted by enemy fighters utilizing the ‘Resilient Attack Craft’ 4+ save rule in th... | Taulukon rivi. |
| S0564 | F310 | 4 listaa | As they are not fighters themselves, they still ignore other types of ordnance normally. | Taulukon rivi. |
| S0565 | F310 | 4 listaa | Re-roll this result if the ship does not carry attack craft. | Taulukon rivi. |
| S0566 | F310 | 4 listaa | This ship may re-roll the dice in a boarding action. | Taulukon rivi. |
| S0567 | F310 | Corsairs/Gothic Sector, Corsairs/Later Gothic War, Eldar/Iyanden Craftworld | This benefit can be combined with having an embarked Aspect Warrior Host. | Taulukon rivi. |
| S0568 | F310 | 4 listaa | Disciplined Crew: Whenever this ship checks leadership or attempts to go on Special Orders, you may roll 3D6 and discard the highest D6 b... | Taulukon rivi. |
| S0569 | F310 | 4 listaa | Elite Command Crew: Once per battle the ship may automatically pass a Leadership test or command check – there is no need to roll any dice. | Taulukon rivi. |
| S0570 | F310 | 4 listaa | This may be used even if another ship or squadron in the fleet has failed a command check this turn. | Taulukon rivi. |
| S0686 | F348 | Dark Eldar/Pirates | DARK ELDAR CREW SKILLS Over the course of a campaign, a ship’s crew develops experience that only comes from serving together in the cruc... | Crew skills -johdanto. (poimintavika: heading) |
| S0687 | F348 | Dark Eldar/Pirates | Bombers launched by this vessel may survive being intercepted by enemy fighters utilizing the ‘Resilient Attack Craft’ 4+ save rule in th... | Taulukon rivi. |
| S0767 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | ORK CREW SKILLS Over the course of a campaign, a ship’s crew develops experience that only comes from serving together in the crucible of... | Crew skills -johdanto. (poimintavika: heading) |
| S0768 | F362 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Roll on the following table: D6 roll Skill Shooty Boyz: These boyz are attempting to aim their weapons. | Taulukon otsikko ja rivi. (poimintavika: table) |
| S0769 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | When the Ship attempts Lock- on special orders you may roll 3D6 and discard the highest roll before comparing it to the ship’s leadership. | Taulukon rivi. |
| S0770 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The Ork ship may always repair at least one critical hit per turn, excepting those that may not be repaired. | Taulukon rivi. |
| S0771 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Note: escorts may re-roll this result. | Taulukon rivi. |
| S0772 | F362 (osittain) | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | If the ship/squadron attempts to Reload Ordnance, you may roll 3D6 and discard the highest die. | Taulukon rivi. |
| S0773 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Note: Ships/Squadrons without ordnance may ignore this roll. | Taulukon rivi. |
| S0774 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Using this skill, ships travelling through Asteroid fields on All Ahead Full special orders roll 3D6 and pick the two lowest. | Taulukon rivi. |
| S0775 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Escorts still get to re-roll this as usual. | Taulukon rivi. |
| S0776 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | If the test is failed while using this skill, the ship takes D6+1 impact hits from Asteroids (ignoring shields). | Taulukon rivi. |
| S0777 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Once per game you may re-roll a failed Leadership or Command check. | Taulukon rivi. |
| S0778 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Once per battle the ship may automatically pass a Leadership test or Command check without rolling any dice. | Taulukon rivi. |
| S0781 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | The ship adds +1 to its leadership when attempting Reload Ordnance special orders (re-roll this if the ship has no ordnance). | Refit/crew skill -taulukko. |
| S0782 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | While on special orders, the ships firepower is reduced by 25% (rounded up) rather than halved. | Taulukon rivi. |
| S0783 | F362 | Orks/Cyclops Cluster, Orks/Da Ork Clanz, Orks/Waaagh! | Rather than rolling D3 for the number of hits against ships, these Bombers may roll a D6. | Taulukon rivi. |

### subplot (26)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0210 | F120 | AdMech/Explorator | Roll a D6 for each Mechanicus capital ship. | Alajuonen tulos. |
| S0211 | F120 | AdMech/Explorator | On a 1 it takes D3 damage, on a 2 it suffers -1 Ld to take Lock On or Reload special orders. | Alajuonen tulos. |
| S0212 | F120 | AdMech/Explorator | You must destroy or cripple more enemy ships than you lose. | Alajuonen voittoehto. |
| S0213 | F120 | AdMech/Explorator | Roll a D6 for each Mechanicus capital ship in the fleet. | Alajuoni. |
| S0214 | F120 (osittain) | AdMech/Explorator | (+1/-1) Sacred Vessel: The ship is an example of or contains much valued archaeotech and must be protected at any cost. | Alajuonen rivi '(+1/-1)'-etuliitteellä. (poimintavika: table) |
| S0215 | F120 | AdMech/Explorator | This vessel cannot be crippled or destroyed. | Alajuoni. |
| S0216 | F120 | AdMech/Explorator | Even if the ship is only crippled, it will grant an easier venture to capture it. | Alajuoni. |
| S0217 | F120 | AdMech/Explorator | You must cripple or destroy it. | Alajuoni. |
| S0218 | F120 | AdMech/Explorator | Roll a D6 on the following two tables to see how the ship has been altered (Re-roll any result that cannot be applied to the vessel). | Experimental vessel -alajuoni. |
| S0219 | F120 | AdMech/Explorator | This ship must not be crippled or destroyed so that it can be examined to review its performance. | Alajuoni. |
| S0220 | F120 (osittain) | AdMech/Explorator | (+1/-1) D6 ROLL IMPROVEMENT All weapons (except ordnance) increase maximum range by +15 cm. | Improvement-taulukon otsikko ja rivi. (poimintavika: table) |
| S0221 | F120 | AdMech/Explorator | The ship gains +1 Shield. | Taulukon rivi. |
| S0222 | F120 | AdMech/Explorator | All turrets re-roll misses when defending against ordnance. | Taulukon rivi. |
| S0223 | F120 | AdMech/Explorator | All friendly vessels within 15 cm gain an additional +1 leadership when the enemy is on special orders (max 10). | Taulukon rivi. |
| S0224 | F120 | AdMech/Explorator | Dorsal or prow lances ignore shields on a roll of 6. | Taulukon rivi. |
| S0225 | F120 (osittain) | AdMech/Explorator | D6 ROLL SIDE EFFECT Weapons battery firepower and lance strength reduced by 50% (rounding up). | Side effect -taulukon otsikko ja rivi. (poimintavika: table) |
| S0226 | F120 | AdMech/Explorator | The ship must move an additional 5 cm before it can turn. | Taulukon rivi. |
| S0227 | F120 | AdMech/Explorator | The ship loses 5 cm speed. | Taulukon rivi. |
| S0228 | F120 | AdMech/Explorator | Dorsal or prow lances can only hit targets on a roll of 6. | Taulukon rivi. |
| S0295 | F139 | The Emperor's Inquisition | In addition to any sub-plots rolled normally, the fleet led by an Inquisitor must take a Secret Ploys sub-plot rolled randomly from [???]... | Secret Ploys -alajuoni. |
| S0344 | F146 | Grey Knights | In addition to any sub-plots rolled normally, the fleet led by an Inquisitor must take a Secret Ploys subplot rolled randomly from the ta... | Secret Ploys. |
| S0355 | F175 | RT | Any game that includes a Rogue Trader cruiser must include a sub- plot from [???] p.82-84 in the Rulebook. | Pakollinen alajuoni. |
| S0356 | F175 | RT | If the Rogue Trader was actually crippled in addition to failing the sub-plot, it counts as if being destroyed. | Alajuoni. |
| S0357 | F175 | RT | However, if the Rogue Trader cruiser survives the game (even if crippled) and the owning player succeeds in the sub-plot, the owning play... | Alajuoni. |
| S0358 | F175 | RT | However, if it disengages and the owning player fails the sub-plot, it counts as being destroyed for purposes of victory points, though i... | Alajuoni. |
| S0367 | F176 | RT/Exploration | Any game using the Rogue Trader fleet list must include a sub-plot from [???]-[???] of the Remastered Rulebook. | Pakollinen alajuoni; kirjan sivuviitteet '[???]'. |

### scenario_defences (2)

| id | sivu | listat | lause | perustelu |
|---|---|---|---|---|
| S0040 | F499 | 30 listaa | Alternatively, you can decide beforehand that you'll be fighting near to a planet, in which case the defending player may buy planetary d... | Planeetan koon mukainen määräraja 4/5/6. Koko on skenaariotieto, eikä kirja määrittele 'yhtä' puolustusta (laivue vai kappale). |
| S0041 | F499 | 30 listaa | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more... | Neuvo, ei sääntö ('for example ... perhaps 10 %'). |

