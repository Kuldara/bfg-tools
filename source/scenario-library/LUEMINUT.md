# Scenario Library – BFG-skenaariot pelipöytää varten

Selainsovellus, joka esittää Battlefleet Gothic -skenaariot pelattavassa muodossa
eikä luettavassa. Pelaajan ei tarvitse selata kirjaa eikä tavata sääntölauseita.

- **0.1 (20.10.2026):** 10 skenaariota, eli Warp Rift -luettelon suositellut L1/L2
  (`../tulosteet/ref/warp_rift/skenaariot/`).
- **0.2 (20.10.2026):** lisätty kirjan 10 yleisskenaariota (RB s. 128–143), jotka
  ovat nyt oletusnäkymä. Lisäksi Before the battle -sivu, puolet roolin mukaan
  (faktio on suositus) ja kategoriavalinta. Yhteensä 20 skenaariota.
- **0.3 (20.10.2026):** pelialueen valinta ja vuororata.
  - Pelialue valitaan alasvedosta (yleiset matot + Custom), ja vieressä ovat W × H
    -kentät. Kaikki kartat piirretään valitulle pöydälle.
  - Vuororadan solut ovat napautettavia, värilliset pisteet merkitsevät
    vuorokohtaisia sääntöjä ja muutoskohdat on merkitty. Rata näyttää "This turn"
    -listan ja seuraavan muutoksen.

- **0.4–0.5 (20.10.2026):** sub-plotit, lähteet ja taustat, koko kirjaston arvonta
  (ks. alla).
- **0.6 (20.10.2026): kaikki skenaariot.** Loop-ajo käyttäjän pyynnöstä ("loopilla
  loppuun asti, kaikki skenaariot mukana"). 78 skenaariota: kirjan 10 + Armageddon 3
  + Black Crusade 7 + Warp Riftin koko luettelo (61, joista 3 Armageddon-skenaariota
  on jo kirjan puolella). Haku ja suodattimet etusivulla, uudet työkalut
  (vahvistustaulukko, kampanjapuu, hylyn ryöstö, maastoruudukko, pelikello).
  Julkaistu BFG Toolsiin: https://scenario-library.kuldare.com (ks. "Julkaisu").
- **0.6.1 (20.10.2026): kuvakierros ja korjaukset.** Käyttäjä pyysi löydöksestä
  (Mobeel Narrowsin "Chaos zone" valui laatikon yli) testisarjan, joka etsii
  samoja ongelmia, sekä käsin tehdyn tarkastuksen kuvakaappauksista kaikilta
  sivuilta, ei vain kartoista. Tehty:
  - `testit/karttatesti.js` ja `testit/kuvakierros.js` (ks. Testaus).
  - Yleiskorjaukset: sirut rivittyvät; "Playing with other fleets" -laatikon luvut
    eivät enää hyppää omille riveilleen (`.others > b:first-child`); kampanjapuun
    napit allekkain; vuororadan solut joustavat (10 vuoroa mahtuu puhelimelle);
    arvonnan lähdenapit rivittyvät.
  - Karttapiirtäjä: kartan koko selitteen riville (törmäsi alareunan teksteihin);
    vyöhykkeen teksti sovitetaan vyöhykkeeseen (kaksi riviä tai pienempi fontti,
    `fitBox`); pöydän sisäinen vaakateksti pysyy pöydällä; reunatekstit pienenevät,
    jos ne ovat reunaa pidempiä; mittaviivan teksti ei jää pöydän reunan yli.
    Apufunktiot `mapFont(W)` ja `textLen(l, W)` skenaarioiden piirtofunktioille.
  - Sisältö: "Suggested: Any" → Any fleets; kortin alarivi on aina pisteet;
    Sources-sivulle Black Crusade ja uudet merkinnät; Looting the Hulkin puolet ja
    B-kartta; Convoy Battlen tuloslaskurit Result-välilehdelle; noin 40 kartan
    tekstisijoittelua.
  - **Warp Riftin viralliset ja yhteisön skenaariot erikseen** (käyttäjä 20.10.):
    etusivulla Core 10 | Campaigns | WR official | Community | All, ja koko
    kirjaston arvonnassa lähteet Core 10 | Campaigns | WR official |
    Community · played | Community. WR official = `committee` + `lore`.
    Vanha tallennettu `src.wr = false` muunnetaan uusiksi napeiksi.
- **0.7 (20.10.2026): kirjojen ja vanhojen GW-julkaisujen skenaariot.** Käyttäjän
  pyyntö: lisää skenaariot zipin `BFG various magazines, publications` pohjalta
  (purettu `../tulosteet/ref/bfg_julkaisut/`, tekstit `_teksti/`, forkin luettelo
  `skenaariot/`) sekä Fleets v0.36:n omat. "Ei laatukompromisseja", käytännön testaus,
  kuvakaappausten tarkistus, kohtuullinen pelitestaus, loop kunnes valmis. Lisäksi
  (käyttäjä kesken työn): laajat käytettävyys- ja oikeellisuustestit, käsin tehdyt
  pistokokeet ja otannat.
  - 78 → **137 skenaariota**: Fleets-kirja 7 (+ Convoyn neljä uhkataulukkoa versioina),
    Classic GW 52 (Warp Storm 2, Planet Killer 2, BFG Magazine 29, Fanatic Magazine 4,
    Fanatic Online 6, joista Kotolin 5 taistelua on yksi skenaario versioineen, Invasion 9).
  - Etusivu: Core 10 | **Books** (kirjan kampanjat + Fleets) | **Classic GW** |
    WR official | Community | All. Arvonnan lähteisiin Books ja Classic GW.
  - Uusi sääntöluokka **W "Needs Warhammer 40,000"** (Invasionin Boarding Party ja
    Deadline: BFG-osa kokonaan, 40K-osa tiivistelmänä).
  - Testauksessa löytyi ja korjattiin 37 väärää ja 23 sivunumerotonta sääntöviitettä
    koko kirjastosta (ks. Testaus).

- **Warp Rift ei ole virallinen (20.10. ilta, julkaistu):** Discord-kommentti: *"Warp rift
  is not written by the High Admiralty / rules committee, it is written by whoever submits an
  article."* Kommentti on oikeassa. Etusivun "WR official", Discord-julkaisun "by the rules
  committee" ja merkki "Committee" antoivat ymmärtää, että komitea olisi tehnyt skenaariot.
  Ne ovat kuitenkin yksittäisten kirjoittajien henkilökohtaisia artikkeleita, ja kirjoittajat
  vain kuuluvat (nyt) HA:han tai komiteaan. Muutokset:
  - kategoria **Rules writers** (ent. WR official), vain `committee`, 13 skenaariota
  - merkki **Rules writer** (ent. Committee): "A personal article, not a committee release"
  - Shadowsun-kilpailun kaksi skenaariota (`lore`, merkki **Lore competition**, ent.
    Official lore) siirtyivät Community-kategoriaan (45) ja arvonnan Community-lähteeseen
  - Sources-sivulla: "its articles are written by whoever submits one". Ainoa
    komitealle merkitty julkaisu on WR48:n *Armada Indomitus: Codex Orks*.
  Tunnisteet (`committee`, `wro`) pysyivät, joten tallennetut valinnat toimivat edelleen.
- **Warp Riftin laatuluokitus (21.10., julkaistu; tasot poistettu samana iltana, ks. alla):** horizon vastasi Discordissa: *"Everything
  Ray, Bob, Nate or I have written for Warp Rift is the same fanwork status as any other
  written article … please don't give us a separate status."* ElectricFan127: arvioi teoksia
  niiden omilla ansioilla. Käyttäjä haluaa silti erottelun, joten se tehtiin skenaarion
  ansioista eikä kirjoittajasta:
  - Kaikilla 58 WR-skenaariolla on sama merkki **Warp Rift** (`trust: "wr"`, asetetaan
    latauksessa `wrInit()`:ssä; `grp` pysyy sisäisenä L-luokkana).
  - Kirjaston oma taso `scenarios/wr-rating.js`:ssä, ja jokaisella skenaariolla on
    yhden rivin perustelu, joka näkyy sivulla kohdassa "Library rating":
    - **Recommended** 35: kirjan säännöt (K/O) ja pöytävalmis. Ehdotuksen Recommended
      ja Solid yhdistettiin käyttäjän pyynnöstä.
    - **Agree first** 10: perusasioita puuttuu tai ne ovat epäselviä.
    - **Needs fan rules** 13: kaikki `book: "E"`.
  - Etusivulla yksi kategoria **Warp Rift** (58), jonka lista jaetaan tasoittain.
    Arvonnan lähteet olivat WR recommended / WR agree first / WR needs fan rules (poistettu samana iltana).
  - Tagit kortissa ja otsakkeessa: **Rules writer** (13, käyttäjä halusi pitää tagin ja
    sen löytymisen haulla: "rules writer(s)", "by rules writers", "committee", "high
    admiralty"), **Played** (19), **Lore competition** (2) ja **Play both sides** (Spreading
    War 11). Haku kattaa nyt myös `why`-rivin, merkin, tason ja tagien hakusanat (`TAG_ALIAS`).
  - Kirjoittajarivit pehmennettiin: "By Ray Bell, one of the 2010 Compendium authors" ja
    "By Roy “horizon” Amkreutz, Warp Rift’s editor". Aiempi muoto oli "rules committee member".
  - Vanhat tallenteet muunnetaan: kategoria `wro`/`comm` → `wr` (`CAT_OLD`) ja
    lähdesuodattimen neljä WR-avainta → `wr` (`lf()`). Arvonnan vanhat WR-avaimet
    ohitetaan, joten WR on taas mukana.
  - Kirjoittajan omat skenaariot eivät saa ansioperusteella erityisasemaa. Eisner Incident
    ja Depth of Space ovat Agree first, Solbladet ja Diversions Needs fan rules. Tämä on
    tarkoitus, älä "korjaa".
- **Aukot kirjoituskentiksi, lähteet uudelleen ja laatututkimus (21.10., EI vielä julkaistu):**
  Käyttäjä: *"lue org lähteet uudestaan … kun on epäselviä mittoja yms niin laita niihin
  kirjoituskenttä ja jos voit niin laita default arvo … virallisissa vähän vastaavissa
  tapauksissa … oma sanity check"* ja *"ei tarvi olla needs fan rules jos on selkeä vaihtoehto"*.
  Lisäksi *"tee kaikille … rank laadullisesti (sisäinen tutkimus) … miten laatua saisi huonoista
  paremmaksi lähdettä tarkastelemalla"*.
  - **Agree before you start:** jokainen kohta, jonka lähde jättää auki, on Set-upissa
    kirjoituskenttä oletusarvoineen. Kentät on määritelty Warp Riftille `scenarios/wr-rating.js`:ssä
    ja muille `scenarios/open-points.js`:ssä (`a`), ja ne tallennetaan `st.w["ag_" + id]`.
    Versiokohtaiset kentät käyttävät `only`/`not`-suodatusta. Oletus tulee kirjan vastaavasta virallisesta tapauksesta
    sivunumerolla, esimerkiksi aloitusvuoro RB s. 128/133/143, kesto RB s. 130/132/139/143,
    syvyys 15 cm RB s. 133/136/140 ja hyökkääjä RB s. 121, tai se on merkitty sanalla Suggestion
    (`o: 1`, sivulla "Our suggestion"). Askeleet, kartta, Play-säännöt, End ja Victory näyttävät sovitun arvon
    (`{a:id}`, `agV`, `agN`), ja Play-välilehdellä on lista sovituista.
  - **Ei laatuluokkia sivulla** (käyttäjä 21.10.: *"ei aleta luokittelemaan … max 3 kategoriaa
    mutta jos ei ole järkeä niin ei tehdä"* ja *"wart drift jäänee yhdeksi kategoriaksi mutta vanha
    alkuperäinen jako löytyy tägeillä"*). Oletusarvojen jälkeen Warp Riftin tasojako olisi ollut
    55 / 3 / 0, joten tasot (Recommended / Agree first / Needs fan rules) poistettiin. Warp Rift
    on yksi kategoria numerojärjestyksessä, ja vanha jako näkyy tageina: Rules writer, Lore
    competition, Community ja Played. Tagi **Agree first** tulee, kun auki jäävä kohta ratkaisee
    voiton (`v: 1`) tai lähde on luonnos (`sketch: 1`): Abhorrence, Mobeel ja Wolf Hunt.
    Arvonnan lähteissä on taas yksi Warp Rift.
  - **Kaikki skenaariot** (käyttäjä: *"anna sivuntekijän ehdotuksina kaikkiin"*): kirjojen ja
    Classic GW:n aukot Source notes -huomautuksista kentiksi (`open-points.js`). Yhteensä 94
    skenaariossa on kenttiä, 189 kohtaa versiot mukaan lukien.
  - **E vain ilman kirjojen vaihtoehtoa** (käyttäjän sääntö): 16 skenaariota E → O ja tagi
    *Fan rules optional* tai *Linked games optional*. Näitä ovat Classic GW:n Ahriman, Cold
    Passage, Cerberus 1 ja 4 (Ahrimanille vaihtoehto) sekä WR:n Diversions, Solblade 1–6, Solar
    Collectors, Eldar Hunt 2, Pirate Bases, Fall of Hyra ja Srinagar.
  - **Alkuperäislähteiden uudelleenluku** (kaikki 58 WR-skenaariota, scratchpadin `wr_txt/`)
    korjasi useita asioita:
    - Rebellion 1–2: vanhan kirjan sivut tunnistettu (old p. 76 = Planetary Assault RB s. 136,
      old p. 72 = Surprise Attack RB s. 132).
    - Hunter Hunted: miinakentille FL s. 513.
    - Convoy Battle: asettelu selviää tekstistä.
    - **Limante:** ensimmäinen versio (WR23) on Surprise Attack, ja siinä ovat orkkien tulot ja
      pakokulma. Siirretty Surprise Attack -pohjalle.
    - **Planet Killer Defence:** virallinen *The Planet Killer in Exterminatus* (FL s. 254) on
      oletusversio, raportin pikasäännöt toinen versio.
    - **Rear Guard:** Death and Gloryn asettelu (lähteen edellinen skenaario).
    - **Lachlon:** geometria (120 × 180) ratkaisee vyöhykkeet.
    - **Mobeel:** "map attached" ei ole kummassakaan painoksessa.
    - **Falling Down:** kartta on Ar'Cianrin.
  - **Järkevyystarkistus:** numerokenttä hyväksyy pilkun. Tyhjä, nolla, negatiivinen tai teksti
    palauttaa oletuksen, ja kartta piirtää enintään `max`-arvon (syvyys 30, kulma 45,
    piraattitukikohta 25, muuten 60). Karttatesti ajettiin sekä oletuksilla että kaikki
    numerokentät maksimissaan: 0/0, kun Eldar Hunt 1:n ja Hammer Needs an Anvilin pöydän
    vähimmäiskokoa nostettiin. Sisältötestin ARVIO tarkistaa kentät ja `{a:id}`-viittaukset.
  - **Sisäinen laatututkimus** kaikista 137 skenaariosta: `tutkimus/` (ks. sen LUEMINUT).
  - **Tutkimuksen suositukset toteutettu** (käyttäjä: *"toteuta kaikki suosituksesi"*):
    - Depth of Space: versiokohtaiset oletukset kirjoittajan mainitsemista virallisista
      skenaarioista.
    - Abhorrence: kentät, ja kartta seuraa niitä.
    - Boarding Party ja Deadline: W → O + Linked games optional.
    - Darkening Raid: E → O + Fan rules optional; vaihtoehtona contact-merkit (RB s. 134–135).
    - Pirate Bases: assault boat -versio.
    - Fall of Hyra: ohje ilman kytkettyjä pelejä.
    - Kotol: tasapeli ja vyöhykkeet kenttinä.
    - Wolf Hunt: kaappaukseen FL s. 207 -viite.
    - Falling Down: kartan alkuperä (Ar'Cianr, WR20) karttahuomautukseen.
    - Kirjastossa ei ole enää E- eikä W-skenaarioita; tyhjät sääntöluokat piilotetaan
      suodattimista.
- **Leveät näytöt (20.10. yö, julkaistu):** käyttäjän pyyntö parantaa käyttöä PC:llä,
  tabletilla ja käännetyllä puhelimella ("paljon tyhjää sivuille ja silti paljon
  vieritettävää"). Esittelyn jälkeen käyttäjä: "ihan ok näyttää", lisää optimointia, sitten
  "tarkasta ja julkaise". Ks. "Leveät näytöt" alla.

## Tiedostot

| Tiedosto | Mitä |
|---|---|
| `index.html` | Moottori, tyylit, kirjan 10 + kampanjat + alkuperäiset 7 WR-skenaariota. Sama tiedosto on lähde ja julkaisu, buildia ei ole. |
| `scenarios/*.js` | Loput skenaariot käsityönä, `addScenarios([...])`. Ladataan `<!--SCENARIO-FILES-->`-kohtaan `?v=`-parametrilla (nosta, kun tiedosto muuttuu, muuten selain tarjoilee vanhaa). |
| `scenarios/blackcrusade.js` | Black Crusade -kampanja, RB s. 191–199 (7). |
| `scenarios/_wr.js` | Yhteiset apurit: `WR_DATES`, `wrCredit(n, tekijä)`, `entryTicks`. |
| `scenarios/wr-committee.js` | WR-skenaariot, joiden kirjoittaja tekee myös sääntöjä (tagi Rules writer): Depth of Space (7 versiota), Diasporex Diversions, Solblade 1–6. |
| `scenarios/open-points.js` | Kirjojen ja Classic GW:n `OPEN`: auki jäävät kohdat kirjoituskenttinä (`a`) ja tagit (`t`). Sama muoto kuin `WR_RATE`:ssa. |
| `scenarios/wr-rating.js` | Warp Riftin `WR_RATE`: muistiinpano (`r`, sivulla "Our note"), auki jäävät kohdat kirjoituskenttinä (`a`: oletus, lähde tai oma ehdotus, yksikkö, max, versiot), tagit (`t`), `sketch`. `wrInit()` lukee molemmat tiedostot. Ladataan viimeisenä. |
| `tutkimus/` | Sisäinen laatututkimus (ei julkaista): kaikkien skenaarioiden pisteytys ja parannusehdotukset. |
| `scenarios/wr-community-a.js` | L3 pelattuja: Who Goes There?, Fannon's Patrol, Planet Killer, Minor Engagement, Commerce Raiders, Nest Raid, Planetary Disease, The Corpse. |
| `scenarios/wr-spreading-war.js` | L3 Reg Steinerin The Spreading War (WR28–29), 11 skenaariota. |
| `scenarios/wr-community-l4a…d.js` | L4 (ei peliraporttia tai vaatii fanisääntöjä), 24 skenaariota. |
| `scenarios/fleets.js` | Fleets v0.36:n skenaariot (FL s. 200–211, 312–315), 7. Convoyn uhkataulukot ovat ytimen Convoyssa (`THREATS`). |
| `scenarios/cl-early.js` | Warp Storm (Callavell, Torpedo Run), Planet Killer 1 (Space Hulk Convoy, Phillipa II -kampanjapuu), BFG Magazine 1 (Corribra II 1–4, Pirates-kampanja). |
| `scenarios/cl-mag-a…d.js` | BFG Magazine 4–19 ja Fanatic Magazine 1: Treasure Fleet … Damocles Gulf 1–4. |
| `scenarios/cl-fanatic.js` | Fanatic Magazine 7 (Privateer I–II) ja Fanatic Online (Daemon Run, Lachlon II, Port Maw Blockade, Abhorrence, Planet Fall, Battle over Kotol). |
| `scenarios/cl-invasion.js` | Invasion (GW US 2002): 7 yleisskenaariota + 2 40K-kytkettyä. |
| `testit/sisaltotesti.js` | Sisältötesti selaimessa: karttojen puolivärit, askelten puolet, tulosfunktiot satunnaissyötteillä, verbin taipuminen ja WR-luokitus (ARVIO). |
| `testit/leveat.js` | Leveiden näyttöjen mittari: näytöllisiä, leveys ja ensimmäisen näytön sisältö viidellä näytöllä (ks. Leveät näytöt). |
| `testit/sivuaudit.py` | Sääntöviitteiden auditointi RB/FL-tekstidumppeja vasten (otsikkotaso), käsin tarkistetut poikkeukset listassa. |
| `tee_kuvakkeet.py` | `apple-touch-icon.png` ja `favicon.png` (sama kuvio kuin SVG-favicon). |
| `testit/selaintesti.js` | Regressiotesti selaimessa (ks. Testaus). |
| `testit/karttatesti.js` | Karttojen tekstien sijoittelu kaikilla pöydillä ja fonttikoilla (ks. Testaus). |
| `testit/kuvakierros.js` | Kuvakaappaus jokaisesta sivusta ja asettelun tarkistus, Node + headless Chrome (ks. Testaus). |
| `julkaisu/discord-2026-10/` | Esittelydia ja postausteksti Discordiin (20.10.), ei julkaistava osa sovellusta. |
| `julkaisu/discord-2026-10-v07/` | 0.7:n iso dia (2560 × 1440) ja postausteksti (20.10.). Ei julkaistava osa sovellusta. |

Esikatselu: Browser-paneelin konfiguraatio `scenario-library` (portti 8781)
juuren `.claude/launch.json`:ssa.

## Testaus

`testit/selaintesti.js` renderöi jokaisen skenaarion × version × 5 pöytäkokoa ×
3 vuoroa × 4 välilehteä ja etsii tekstistä `undefined`/`NaN`/`[object`/`function`.
20.10. tulos: 78 skenaariota, 6 004 näkymää, 78 erillistä otsikkoa, 0 virhettä.
0.7 (20.10. ilta): 137 skenaariota, 10 324 näkymää, 137 erillistä otsikkoa, 0 virhettä.

- **Ansa (20.10.):** `history.replaceState` ei kelpaa reitin vaihtoon silmukassa,
  koska Chrome ohittaa sen noin sadan kutsun jälkeen. Aiemmat "0 virhettä" -ajot
  renderöivät siksi suurimmaksi osaksi samaa sivua. Testi ohittaa `parseHash`in, ja
  erillisten otsikoiden määrän on oltava sama kuin skenaarioiden määrä.
- Selain välimuistittaa `scenarios/*.js`:t; tarkista tuoreus esim.
  `SC.find(...).draw.toString()`-haulla, jos tulos näyttää vanhalta.

**Karttatesti** (`testit/karttatesti.js`, aja sivulla kuten selaintesti): jokainen
kartta jokaisessa versiossa, kaikilla alasvedon matoilla, joille skenaario mahtuu, sekä
leveällä että kapealla näytöllä (fontti 5,4·S / 6,8·S). Tekstien koko mitataan
selaimesta. Virheet: ZONE (vyöhykkeen teksti yli laatikon), CUT (leikkautuu kuvan
reunalla), OVERLAP (tekstit päällekkäin). Varoitukset: EDGE (puoliksi pöydän reunan
yli), PLANET, MARK. 20.10. alussa 72 virhettä + 67 varoitusta, lopussa 0 + 0
(1 216 karttaa, 6 056 tekstiä). 0.7: 2 116 karttaa, 10 206 tekstiä, 0 + 0.

**Kuvakierros** (`node "scenario library/testit/kuvakierros.js" <ulos-kansio>`, ulos
scratchpadiin): erillinen headless-Chrome, tumma teema. Jokainen sivu (etusivun
kategoriat ja suodatin, Before the battle, Sub-plots, Sources, jokaisen skenaarion
neljä välilehteä, Set-up ja Play joka versiossa) puhelimella 390 px kuvaksi ja
työpöydällä 1200 px tarkistukseen. Tarkistukset: HSCROLL, OUT, CLIP, OVERLAP,
SCROLLROW (sivuttain vieritettävä rivi, josta osa piilossa) ja TEXT. 20.10.:
728 sivua, 0 löydöstä. Kuvat käydään läpi käsin arkkeina (3 sivua rinnakkain);
koneelliset tarkistukset eivät huomaa sisältövikoja kuten "Suggested: Any" tai
kortin alarivillä näkyvää "4". `--vain=etuliite1,etuliite2` rajaa skenaariot (etusivut ja
yleissivut kuvataan aina).

**Sisältötesti** (`testit/sisaltotesti.js`, aja sivulla kuten selaintesti), 0.7:
- VÄRI: kartan teksti nimeää puolen mutta on toisen puolen värinen (reunat ohitetaan:
  ne väritetään käyttäjän mukaan). Löysi Corribra 1:n Orkkireunan ja Deadlinen
  käännetyt puolet (lainaa ytimen Planetary Assault -kartan, jossa a = hyökkääjä).
- PUOLI: askel/sääntö/vuoromuistutus on merkitty puolelle, mutta lause alkaa toisen
  puolen nimellä. Kotolin "The defender picks three of your cruisers" on sallittu.
- TULOS: jokaisen skenaarion `result()` 60 satunnaisella syötteellä per versio (10 320
  kutsua): ei poikkeuksia, ei undefined/NaN, verbi taipuu (yhteinen `wins(n)`:
  "The raiders win", "The Eldar win", "Defenders of Macharia win", muuten "wins").
- ARVIO (21.10.): jokaisella WR-skenaariolla on rivi `wr-rating.js`:ssä, taso fan ⇔
  `book: "E"`, eikä tiedostossa ole tuntemattomia tunnisteita.
- TYHJÄ: koskemattomassa pelissä näkyvä tuomio ei saa nimetä voittajaa. Kuvien otannasta
  löytyi Fall of Hyran "Draw" ennen peliä; pyyhkäisy löysi 12 samanlaista, mm. ytimen
  Planetary Assaultin "Defender's victory". Korjaus moottorissa: `verdict()` näyttää
  koskemattomalle pelille "Nothing recorded yet", ja `provisional(st, v)` (Planetary
  Assault -perhe `PA_PROV`: ennen VP:itä ja alle 10 assault pointia; Solblade 4 ja 6:
  ennen vuoroa 8) lisää "— if it ended now".
- 20.10.: 0 virhettä, 0 varoitusta.

**Sivuviiteauditointi** (`python -X utf8 "scenario library/testit/sivuaudit.py"`):
jokainen refs-pari tarkistetaan RB/FL-tekstidumppien (`simulaattorit yms/simulaattori/
saannot_txt/`) otsikoita vasten. 0.7:ssä löytyi 37 väärää viitettä, jotka olivat
pääosin vanhan kirjan sivuja tai arvauksia: kriittiset osumat RB 72–75 → 66–67,
boarding 86–87 → 89–90, hit-and-run 88/89 → 91, disengaging 122 → 56, asteroidit
109/44 → 110, torpedot 50–53 → 76–77, Mark of Slaanesh/Tzeentch FL 228 → 232,
Desolator/Repulsive FL 252 → 267/269 ym. Lisäksi 23 sivunumerotonta viitettä ("RB",
"FL") täydennettiin. Tulos: 222 viitettä, 22 käsin tarkistettua poikkeusta, 0
tarkistamatta. Tekstin sisäisistä viitteistä (noin 300) tarkistettiin 40 kpl
satunnaisotos käsin: 40/40 oikein.

**Käsin tehdyt tarkistukset 0.7:ssä**
- Kuvakierros katsottu kaikista uusista skenaarioista (Set-up, Play, Result,
  Kotolin viisi versiota): 40+ arkkia. Löydöksiä mm. kahdennetut vuoromuistutukset,
  turha kytkin (Abhorrence), FAQ-viitteen tähtimerkit, Lachlonin aseman nimi kuun päällä.
- Satunnaisotos 20 skenaariosta koko kirjastosta (siemen 20261020): 18 tarkistettu
  lähdetekstiä vasten (pisteet, ensimmäinen vuoro, pelin pituus, voittoehdot), 0 eroa.
- Tulosfunktioiden oraakkelitestit: Port Maw Blockaden taulukko 350 yhdistelmää 0
  eroa; Deadlinen Macro Cannon -aikataulu 6 tapausta (vihkon esimerkki mukana); 24
  tulostapausta uusista skenaarioista.
- Pelitestaus selaimessa: Port Maw koko peli 11 napautuksella (miinalaskurin +4).
- Käytettävyyslöydökset: `val`-työkalun tekstivalinnat eivät reagoineet
  (`+el.dataset.val` → NaN) → korjattu; 12 vuoron rata vieritti puhelimella → tiivis
  rata (`.track.dense`, ≥ 11 solua); laskuriin `bulk`-nappi.

## Kirjaston luokat

| `grp` / `trust` | Merkintä | Sisältö |
|---|---|---|
| `core` / `rulebook` | Rulebook | Kirjan 10 yleisskenaariota |
| `campaign` / `rulebook` | Rulebook | Armageddon (3) ja Black Crusade (7) |
| `committee` / `wr` | Warp Rift + tagi Rules writer | Kirjoittaja tekee myös sääntöjä (HA, sääntökomitea tai Remasteredin tekijä). Henkilökohtaisia artikkeleita, ei komitean julkaisuja |
| `lore` / `wr` | Warp Rift + tagi Lore competition | Shadowsun-kilpailun voittajat |
| `community` / `wr` | Warp Rift + tagit Community, Played | L3: peliraportti tai -kokemus lähteessä |
| `untested` / `wr` | Warp Rift + tagi Community | L4: ei peliraporttia |

WR-skenaarioiden `grp` on sisäinen L-luokka, ja `wrInit()` asettaa kaikille `trust: "wr"`.
Warp Rift on etusivulla ja arvonnassa yksi kategoria (21.10. ilta), ja lista on numerojärjestyksessä
(`wrIssue`). Vanha jako löytyy tageista ja haulla (käyttäjä 21.10.).
| `fleets` / `fleets` | Fleets book | Fleets v0.36:n skenaariot (etusivulla Books-kategoriassa) |
| `cl-ws`, `cl-mag`, `cl-inv`, `cl-fan` / `classic` | Classic GW | Warp Storm; Planet Killer + BFG Magazine; Invasion + 2002 Annual; Fanatic Magazine + Fanatic Online |

`book`: K = pelkkä kirja, O = kirja + skenaarion omat säännöt, E = "Needs fan rules"
(profiilit on annettu sovelluksessa, kun lähde ne antaa), W = "Needs Warhammer 40,000"
(0.7). `players` voi olla luku tai lista
(`[1, 2]` = "Solo or 2 players"); suodatin "3 or more" osuu kaikkiin ≥ 3.
`type: "Campaign"` piilottaa vuoropalkin ja nostaa kampanjapuun Play-välilehden
alkuun.

## Työkalut (widgetit) 0.6:ssa lisätyt

- `reinf`: D20 (tai muu) -vahvistustaulukko, jonka jokainen rivi saapuu kerran.
  Heitto kerran vuorossa (tuplanapautus ei arvo uudelleen), rivin napautus merkitsee
  käsin (Mobeel Narrows).
- `tree`: kampanjapuu. Solmuilla nimi, linkki kirjan skenaarioon (`sc`), teksti ja
  tulosnapit; loppusolmulla `end`-puoli. Polku tallessa, "Step back" (Stygies,
  Solitaire Campaign).
- `salvage`: hylyn ryöstö (5+ → 4+ → 3+ → 2+, löydöstä 5+, tyhjenemisheitto
  toisesta löydöstä alkaen; Looting the Hulk).
- `terrain` (ruudukko per ~60 cm, "once" = yksi planeetta) ja `timer` (pelikello).
  Maastoheitto vanhenee, jos pöydän koko muuttuu (pyytää heittämään uudelleen).
- `secret` sai oman ohjetekstin (`sub`) ja piiloarvonnan (`rnd`, Wolf Hunt).
- `num` toimii myös set-up-työkaluissa (`stools`).
- `steps`/`play`/`tools` suodatetaan versioittain `only`/`not`-kentillä; `pitch`,
  `glance`, `forces`, `notes`, `refs`, `mapNote`, `noMap`, `win`, `end` voivat olla
  version funktioita. `draw(v, W, H, st)` saa skenaarion tilan (Fleet Engagement
  Variantin kartta seuraa valittuja lähestymistapoja).

## Työkalut ja moottori 0.7:ssä

- `roll`: `d2: true` (2D6), `die: 10` (D10), `turn: true` (lisää vuoron numeron).
- `shiproll`: `n0` luku tai `n0(st)`, `roll()` voi palauttaa taulukon (näytetään
  "3 + 4") tai tekstin, `btn(n)`, `out(d, st)`, `foot(st)` (esim. puolustusten summa).
- `reinf`: `verb`, `sub`, `dup`, toistuvat rivit (`true`) ja "again"-rivit
  (heitä uudelleen samassa vuorossa, `again: true`); kun kaikki ovat saapuneet,
  nappi lukittuu ("Everything is in").
- `val`: tyhjä `opts` (vain heitto) ja tekstiarvot (`["Top", …]`, korjattu 0.7).
- `counter`: `bulk: n` lisää "+n"-napin (Port Maw'n miinat).
- `ending`: rivin kolmas kenttä on oma tulosnimi; `endingResult` ja kaikki
  "X wins" -otsikot käyttävät yhteistä `wins(n)`-apuria.
- Kartat: `sun` mille tahansa reunalle (`e: l/r/t/b`), `mapFont(W)` siirtymiin.
- Vuororata: ≥ 11 solua → tiivis rata, joka mahtuu 390 px puhelimelle.
- Ytimen Convoy: versiot `std / trap / stalk / mine / wolf` (FL s. 198–199, alun
  perin Warp Storm "Convoy Run Variants"), `THREATS`, `THREAT_PLAY`.

## Sisältö

| Kategoria (`grp`) | Skenaariot | Lähde |
|---|---|---|
| **Core 10** (oletus) | Cruiser Clash, The Bait, The Raiders, Surprise Attack, Blockade Run, Convoy, Planetary Assault, Escalating Engagement, Exterminatus, Fleet Engagement | RB s. 128–143 |
| **Campaigns** | The Gauntlet, Parol's Bait, Defence of Pelucidar | RB s. 178–181 (+ WR48:n Armada Indomitus -versio) |
| **Warp Rift** | Siege of Fularis, Assassination, Eliarenath's Gift, The Hammer Needs an Anvil, The Eisner Incident (komitea); Fall of Ar'Cianr, Unknown Weapons (lore) | WR5, 10, 11, 34, 43, 20 |
| **Campaigns** (0.6) | Black Crusade: Chance Encounter, Rearguard Attack, Alien Intervention, Above Belis Corona, Daemon Blockade, Navigate the Storm, Macharia's End | RB s. 191–199 |
| **Warp Rift · komitea** (0.6) | Depth of Space (7 versiota), Diasporex Diversions, Solblade 1–6 | WR40–43 ym. |
| **Warp Rift · L3** (0.6) | 8 yhteisön pelattua + The Spreading War (11) | WR14–49 |
| **Books · Fleets** (0.7) | Merchantmen's Folly, The Hunter and the Prey, The Gauntlet (Rogue Traders), Explorer's Prize, Space Hulk!, The Void Malevolent, Craftworld Assault | FL s. 200–211, 312–315 |
| **Classic GW** (0.7) | Warp Storm: Callavell, Torpedo Run · Planet Killer 1: Space Hulk Convoy, Phillipa II · BFG Magazine 1–19: Corribra II 1–4, Pirates, Treasure Fleet, Evacuation, Cadian Line, Ahriman's Arrival, Rath's Last Stand, Antioc 1/3/4, Execution Hour, The Siege, Defence of Macragge, Numitor, Cold Passage, They Come Only to Murder, Cerberus 1–4, Belis Corona 1–4, Damocles 1–2 · Fanatic Magazine: Damocles 3–4, Wolf Packs, Tau Space Tau Trade · Fanatic Online: Daemon Run, Lachlon II, Port Maw Blockade, Abhorrence, Planet Fall, Kotol (5) · Invasion: The Chart, Conquest, Breakthrough, Head of the Snake, Retrieval, Defensive Ring, Port Maw, Boarding Party, Deadline | BFG Magazine, Fanatic, Invasion |
| **Warp Rift · L4** (0.6) | 24: Mobeel Narrows, Choir of a Thousand Voices, Wolf Hunt, Hunter Hunted, Cat and Mouse, Solar Collectors, Hunt for the Eldar 1–2, Convoy Battle, Contact!, Falling Down, Darkening Technology Raid, Stygies-kampanjapuu, Looting the Hulk, Pirate Bases, Battles in the Warp, Fleet Engagement Variant, Solitaire Campaign, The Trap, Hive Ship Pirate Base, Norduun, Fall of Hyra, Shattered Gate, Srinagar | WR5–48 |

Kaikki tulkinnat ja ristiriidat ovat skenaarioiden "Source notes" -laatikoissa
(esim. tulostamattomat kartat: Convoy Battle, Looting the Hulk B; väärä kartta:
Falling Down; katkennut sääntö: Srinagar). Mitään ei ole valittu hiljaa.
Todellisista ihmisistä (kirjoittajat, pelaajat) käytetään neutraalia muotoa;
fiktiiviset hahmot lähteen mukaan.

Käyttäjä on pelannut Fleet Engagementin, Escalating Engagementin, The Raidersin
ja Cruiser Clashin. Ne tehtiin ensimmäisinä ja huolellisimmin.

## Rakenne

- **Etusivu.** Kategoriavalinta: Core 10 (oletus), Books, Classic GW, Warp Rift, All (21.10.; ennen Rules writers + Community, sitä ennen WR official + Community).
  Muissa kuin Corella on "Suggested for" -faktiosuodatin, joka näyttää myös "any
  fleets" -skenaariot. Keskeneräisen pelin kortissa näkyy vuoro. Ylimpänä on
  linkki Before the battle -sivulle.
- **Before the battle** (`#/prep`, RB s. 120–127):
  - pelia edeltävä järjestys (RB s. 123)
  - satunnainen skenaario (raid/battle + D6 → linkki skenaarioon)
  - attack ratingit (kummallekin pelaajalle valitaan 1–4 noppaa, paras noppa
    voittaa; mukana kirjan taulukko)
  - sub-plotit kummallekin pelaajalle (18 kpl omin sanoin) ja tulosmatriisi
    (Heroic Victory jne.)
- **Skenaario.** Sivulla on kolme välilehteä:
  - **Set-up:**
    - yhteenveto ja tarvikelista
    - joukot roolin mukaan ("suggested: Imperial Navy" tai "any fleet")
    - "Playing with other fleets" tai "Fleets" -laatikko
    - kartta SVG:nä senttimetreinä ja ruksattava askellista
    - set-up-työkalut (`stools`): Convoyn hyökkääjätaulukko, Blockade Runin
      kolmannes, planeetan koko, Surprise Attackin D3 ja Fleet Engagementin
      muodostelmatyökalu, joka on kartan yläpuolella (`stoolsFirst`)
    - lähdehuomiot ja sivunumerot
  - **Play:**
    - vuorolaskuri ja muistutukset vaiheen ja puolen mukaan
    - noppataulukot (oma noppa yhdellä napautuksella tai "Roll D6")
    - laskurit, nopeustaulukot, salainen alus ja Event Horizonin abordauslaskuri
  - **Result:** päättymis- ja voittoehdot, tuomio merkinnöistä sekä sub-plot-matriisi.
- **Versiot:**
  - Cruiser Clash: *Introductory / With alternatives*
  - Fleet Engagement: *Set-up A–D*. Muodostelmatyökalu kertoo vaihtoehdot ja
    vaihtaa karttaa.
  - Gauntlet: *Standard / Running battle*
  - Pelucidar: *Rulebook v1.10 / Armada Indomitus 2026*
- Tila tallentuu selaimen localStorageen (`bfg-scenario-library-v1`): skenaariot
  (`s`), Before the battle (`prep`), kategoria (`cat`) ja suodatin (`filter`).
  "New game" tyhjentää yhden skenaarion ilman vahvistusta.
- Numerot korostetaan automaattisesti (`fmt()`).
- Käyttöliittymä on englanniksi. Sovellus ei hae mitään verkosta.

## Leveät näytöt (20.10.)

Ennen: yksi 760 px:n palsta kaikilla näytöillä. PC:llä sisältö käytti 38–53 % leveydestä ja
Set-up vaati silti 3–4 näytöllistä; käännetyllä puhelimella otsake ja välilehdet täyttivät koko
ensimmäisen näytöllisen. Nyt asettelu valitaan JS:llä, ja kapea näkymä pysyy ennallaan.

- `layout()`: **narrow** (alle 960 px pystyssä), **wide** (≥ 960 px tai vaaka ≥ 700 px) ja
  **xwide** (≥ 1560 px). `applyLayout()` asettaa `<html>`-luokat `wide`, `xwide` ja `short`
  (vaaka ja korkeus ≤ 520 px eli käännetty puhelin). Mediakyselyjen muutos renderöi uudelleen.
- `cols(parts, cls)` jakaa näkymän palstoihin, ja tyhjät palstat jäävät pois:
  - **Set-up:** wide = tiedot, askeleet, työkalut ja lähdehuomiot vasemmalla, kartta tarttuu
    oikealle (`.mapstick`); käännetty puhelin = tiedot | kartta + askeleet + työkalut;
    xwide = tiedot | kartta + lähdehuomiot | askeleet + työkalut.
  - **Play:** wide = vuoro (tarttuu välilehtien alle) + työkalut | säännöt; xwide = vuoro | säännöt | työkalut.
  - **Result:** tuomio + syötteet (tarttuu) | päättyminen, voitto, sub-plotit.
  - **Sub-plots:** puolet rinnakkain.
  - **Etusivu:** sivupalkki (johdanto, kortit, pöytä) + kategoriat, haku ja korttiruudukko
    (`.cardgrid`, auto-fill 300 px). Käännetyllä puhelimella ei sivupalkkia, kortit kahtena palstana.
  - **Before the battle:** järjestys ja tavat | arvonta ja attack ratingit.
  - **Sources:** palstoina. **Sub-plots-sivu:** valinta | selaus.
- **Otsake** leveällä kahtena palstana (nimi ja sirut | lähde, kuvaus ja taustat). Käännetyllä
  puhelimella kahdelle riville ilman sarjaa ja kuvausta.
- **Välilehdet yläpalkissa** leveällä ja käännetyllä puhelimella (kierros 2): yksi tarttuva
  rivi takaisin-linkin ja BFG Toolsin välissä, joten erillistä välilehtiriviä ei ole.
  `--topH` mitataan aina, `--tabsH` on silloin 0.
- **Näppäimistö** (PC, kierros 2): 1–4 vaihtaa skenaarion välilehteä, ← → vaihtaa vuoroa
  Play-välilehdellä. Ei toimi kenttien sisällä, muokkausnäppäinten kanssa eikä toistona.
  Vihje näkyy alatunnisteessa vain leveällä.
- **Kartta** leveällä korkeintaan 60 vh (käännetyllä puhelimella 78 vh). Set-upin tarttuvassa
  karttapalstassa korkeus on `100vh − yläpalkki − 250 px`, jotta pöytävalinta, kartta, selite
  ja huomautus mahtuvat näyttöön. Mitattu kaikista 137 skenaariosta 1366 × 768:ssa ja
  1280 × 620:ssa: palsta mahtuu näyttöön jokaisessa. Fonttikoko riippuu nyt kartan palstan leveydestä (`mapColWidth()`,
  alle 560 px = puhelimen fontti), ei näytön leveydestä. `karttatesti.js` pakottaa fontin
  `window.__mapNarrow`-kytkimellä.
- **Mittari** `testit/leveat.js`: näytöllisten määrä, käytetty leveys ja mitkä avainosat
  näkyvät ensimmäisellä näytöllä kahdeksalla näytöllä (kannettavat 1280, 1366 ja 1536,
  PC 1440, PC 1920, tabletti 1180 × 820, puhelin vaakaan 844 × 390, puhelin 390 × 844).
  Kierros 1, 20.10.:

  | sivu | PC ennen → jälkeen | 1920 ennen → jälkeen | puhelin vaaka ennen → jälkeen |
  |---|---|---|---|
  | Port Maw Set-up | 3,5 → 2,0 | 2,9 → 1,4 | 8,1 → 5,3 |
  | Escalating Engagement Play | 2,1 → 1,5 | 1,7 → 1,0 | 4,8 → 3,7 |
  | Craftworld Assault Play | 2,9 → 1,9 | 2,4 → 1,3 | 6,7 → 4,4 |
  | etusivu (Core 10) | 2,8 → 1,3 | 2,3 → 1,0 | 6,4 → 4,5 |
  | etusivu (All) | 28,6 → 14,1 | 23,8 → 9,3 | 65,9 → 41,6 |

  **Kierros 2 (käyttäjä: "lisäoptimointia ja mietintää"):** kannettavilla (1280–1536) mittari
  näytti, ettei yksikään Set-up-askel mahtunut ensimmäiselle näytölle kartan alle, eli
  pelaaja vieritti kartan pois näkyvistä lukiessaan askelia. Kolmen palstan raja 1260 px:iin
  olisi kaventanut kartan alle 400 px:n. Valittu ratkaisu: kartta tarttuvaan oikeaan palstaan,
  ja askeleet ja työkalut vasemmalle. Sivu on nyt pidempi (Port Maw Set-up PC:llä 2,0 → 2,6
  näytöllistä), mutta kartta on näkyvissä koko Set-upin ajan, kun ennen se oli vain alussa.
  Tietoinen kompromissi, älä "korjaa" takaisin näytöllisten perusteella. Välilehdet
  yläpalkkiin säästivät käännetyllä puhelimella 0,1–0,2 näytöllistä sivua kohti.
  Kuvakierros löysi tarkistuksessa 618 sivulta saman päällekkäisyyden: `html.wide .tabs`
  -säännön marginaali `10px -24px 0` periytyi yläpalkin välilehdille, jolloin rivi meni
  10 px takaisin-linkin päälle ja yläpalkki kasvoi. Korjaus `html.wide .tabs.toptabs
  { margin: 0; padding: 0 }`; yläpalkki 83 → 57 px (käännetyllä puhelimella 48 px).
- **BFG Tools -valikko aukeaa vasemmalle** (`.top-in .bfgt-menu { left: auto; right: 0 }`,
  lappumerkkien ulkopuolella). Yhteinen lappu avaa valikon oikealle (`left:0`), koska muissa
  sovelluksissa lappu on otsikon vieressä. Täällä lappu on yläpalkin oikeassa reunassa, joten
  valikko valui näytön yli ja levitti puhelimella koko sivun 375 → 614 px (vika oli livessä jo
  0.7:ssä). Löytyi julkaisutarkistuksessa 20.10., kun lappuun tuli GitHub-rivi.

  Pystypuhelin pysyi ennallaan (sama HTML-järjestys). Kuvakierroksen 1200 px:n työpöytäajo
  tarkistaa nyt leveän asettelun kaikista skenaarioista: 1 258 sivua, 0 löydöstä. Selaintesti
  sekä leveänä (1440) että kapeana (375): 10 324 näkymää, 0 virhettä. Kierroksen 2 jälkeen
  sama: selaintesti molemmilla 10 324 näkymää 0 virhettä, karttatesti 0/0, sisältötesti 0/0
  ja kuvakierros 1 258 sivua, 0 löydöstä (yläpalkin korjauksen jälkeen).
- Esittelykuvat ennen/jälkeen: `julkaisu/leveys-esittely/` (kierroksen 2 tila).

## Suunnitteluperiaate: käsityö, ei tuotteistus (käyttäjä 20.10.)

Skenaarioita on kymmeniä, ja määrä ei kasva merkittävästi. Siksi jokainen
skenaario tehdään käsityönä:
- omat kartat, omat työkalut, omat vuorovaikutukset ja omat tekstit
- laatua ja skenaarion omaleimaisuutta ei uhrata yleisen rakenteen takia

Yhteisiä rakenteita (`MAPS`, `TURNFX`, widgetit) käytetään vain, kun ne eivät
heikennä yksittäistä skenaariota. Tämä on päinvastainen tilanne kuin Fleet
Registryn korteissa, joissa variaatioita on lukemattomia. Jos skenaario
hyötyisi omasta erikoistyökalusta, tehdään se.

## Before the battle: skenaarion valinta (0.5)

- "Pick the scenario" kertoo kirjan kolme vaihtoehtoista tapaa (RB s. 120):
  A sovitaan, B arvotaan ja C attack ratingit, joissa voittaja hyökkää ja
  valitsee skenaarion.
- **B · Roll it** -osiossa on kaksi tilaa:
  - **Rulebook tables:** kirjan D6-taulukot (vain kirjan kymmenen
    yleisskenaariota), ja tuloksen jälkeen Reroll.
  - **Whole library:** tämän sovelluksen oma lisäys, joka ei tule kirjasta.
    Arvonta on tasainen koko kirjastosta. Suodattimet: lähde (Core 10 /
    Books / Classic GW / Warp Rift, 21.10. illasta), "Book rules only", "Fits my table" (`FITS`
    nykyisellä pöydällä; jos jokin versio mahtuu, skenaario kelpaa) ja "Suggested
    for" -faktio (any-fleet-skenaariot pysyvät mukana). Altaan sirun napautus
    jättää skenaarion pois. Reroll arpoo eri skenaarion kuin edellinen.
- **C · Attack ratings:** "What is the roll for?" valitsee, valitseeko heitto
  skenaarion (RB s. 120) vai vain hyökkääjän (RB s. 121). Valintatilassa voittaja
  näkee valintalistan: Whole library -tilassa altaan, muuten Core 10:n.
- Tila tallentuu `DB.prep`:iin (`bmode`, `src`, `bookOnly`, `fits`, `sug`, `excl`,
  `lpick`, `rmode`).

## Lähteet ja taustat (0.5)

- **Sources-sivu** (`#/sources`): mikä on Battlefleet Gothic (alkuperäiset
  suunnittelijat RB s. 3), BFG Remastered (Simon Saier, FAQ-kierrokset horizon,
  RB s. 4), Warp Rift (fanilehti 2004–, 49 numeroa, Cybershadow ja horizon,
  specialist-arms.com) ja High Admiralty. Sivu selittää myös merkinnät ja
  lyhenteet. Linkki on etusivun johdannossa ja jokaisen skenaarion lähderivillä.
- **ⓘ Background & credits** -nappi jokaisen skenaarion otsikossa: 2–4 lauseen
  tausta omin sanoin sekä tekijät, julkaisu ja vuosi (`INFO[id]`). Avaus pysyy
  muistissa (`DB.info`), eikä paneeli sulkeudu itsestään.
- **Erillinen Sub-plots-sivu** (`#/subplots`, etusivun kortti Before the
  battle -kortin vieressä): arvonta Player 1:lle ja 2:lle samoilla korteilla ja
  työkaluilla (`FREE_SC`, tila `DB.free`), tulosmatriisi ja kaikki 18 selattavina.

## Sub-plotit (0.4)

Käyttäjän palaute: sub-plottien käyttö oli kenkkua, koska ei ollut selvää, mitä
tehdä ja milloin. Nyt jokaisessa skenaariossa on oma **Sub-plots**-välilehti
(Set-up · Sub-plots · Play · Result).

- **Valinta per puoli** (puolet a ja b): taulukko (1–2 Legacies, 3–4 Chance,
  5–6 Secret) ja noppa 1–6, "Roll both" tai "None". Valitun taulukon kuusi
  vaihtoehtoa näkyvät nimeltä. "Hide from opponent" piilottaa kortin. Piilotettuna
  muut välilehdet näyttävät vain "Secret sub-plot" -rivin.
- **Kortti** jakautuu kolmeen osaan:
  - *Before the battle*: askeleet ja työkalut. Noppa per kapitaalialus
    (`shiproll`, laivamäärä + Roll + tulkinta per laiva), arvon valinta tai heitto
    (`val`: D3, 2D6, D3×50), satunnainen laiva (`rand`), vapaa muistiinpano (`text`)
    ja D6-taulukot (Navigational Hazards, Experimental Shipin parannus ja sivuvaikutus).
  - *During the battle*: muistutukset.
  - *To complete it*: tavoite ja Achieved/Failed.
- **Kytkennät muihin välilehtiin:**
  - Set-up: `before`-askeleet tulevat listan alkuun ja `start`-askeleet (Meteor Storm)
    juuri ennen ensimmäistä vuoroa.
  - Play: muistutukset ja tavoite näkyvät oikean puolen värillä.
  - Vuororata: Surprise Attack! (vastustaja ilman special ordereita vuorot 1–D3) ja
    Hit-and-Runin takaraja (2D6). Ennen heittoa vuorolla 1 muistutetaan heittämään.
  - Result: "Who won the main mission?", jos skenaarion tuomio ei sitä jo kerro.
    Kummallekin puolelle näytetään Heroic Victory / Victory / Heroic Defeat /
    Miserable Defeat ja renown.
- **Tulkinta:** Meteor Storm!, Navigational Hazards ja Surprise Attack! sanovat
  "no additional victory conditions" (voitto on sankarillinen ja häviö tuomitaan).
  Ne lasketaan täytetyiksi täsmälleen silloin, kun pääpeli voitetaan (`auto`).
  Tasapeliä sub-plot-taulukko ei käsittele (RB s. 124), ja sovellus sanoo sen.
- Before the battle -sivun erillinen sub-plot-arpoja poistettiin, ja sivu ohjaa nyt
  skenaarion välilehdelle.

## Pelialue (0.3)

- Alasvedossa ovat yleisimmät pelimatot (tuumat ja jalat pyöristetty senttimetreiksi):
  - 180 × 120 (BFG:n kirja; Black Crusade -skenaariot RB s. 191–198 käyttävät tätä)
  - 183 × 122 (6′ × 4′)
  - 152 × 112 (60″ × 44″)
  - 122 × 122 (4′ × 4′)
  - 112 × 76 (44″ × 30″)
  - 91 × 91 (3′ × 3′)
  - 244 × 122 (8′ × 4′)
  - 200 × 200 (Unknown Weaponsin ihanne)
  - Custom
- Vieressä olevat W × H -kentät näyttävät aina nykyisen koon. Kun niihin
  kirjoittaa, valinta vaihtuu Customiin, tai esiasetukseen, jos mitat osuvat
  siihen. Raja-arvot ovat 40–400 cm. Asetus on yhteinen kaikille skenaarioille
  (`DB.table`), ja sen voi vaihtaa etusivulla tai skenaarion karttakortissa.
- Kartat ovat funktioita `MAPS[id](variantti, W, H)`:
  - Säännön absoluuttiset etäisyydet pysyvät, esimerkiksi 15 cm:n kaista, 60 cm:n
    väli, 45 cm reunasta ja planeetta 150 cm kaukaisesta reunasta.
  - Keskikohta, kolmannekset ja vastakkainen reuna seuraavat pöytää.
  - Fleet Engagementin merkityt mitat pysyvät, ja merkitsemättömät
    (sivukaistojen leveys, vyöhykkeiden syvyys) täyttävät loput.
  - Unknown Weaponsin keskusalue on puolet pöydästä kumpaankin suuntaan, kuten
    lähteen 200/100-suhde.
- `FITS[id]` kertoo pienimmän pöydän, jolle skenaarion mitat mahtuvat. Jos pöytä on
  pienempi, kartan alle tulee varoitus. `SRC_TABLE` näyttää lähteen nimeämän koon,
  jos se poikkeaa valitusta.
- Fonttikoko ja viivat skaalautuvat pöydän leveyden mukaan, joten teksti pysyy
  näytöllä samankokoisena. Ruudukko on 30 cm, ja 200 cm:stä alkaen 50 cm.
- Tekstipohja `{w3}` = kolmannes pöydän pituudesta (Eliarenath's Gift).

## Vuororata (0.3)

- `TURNFX[id](T, st, v)` palauttaa vuoron T erityissäännöt muodossa
  [puoli, teksti]. Se voi lukea työkalujen tilaa, esimerkiksi Raidersin
  heitetyn rangaistuksen pituuden, Escalatingin saapumatta olevat divisioonat,
  Eliarenathin ansan tai Event Horizonin osumat.
- Rata näyttää vuorot 1…max(viimeinen vuoro tai 8, nykyinen + 1). Pisteen väri
  kertoo puolen, viimeinen vuoro on alleviivattu ja muutoskohdan reunus on
  tummempi. Solun napautus hyppää vuoroon.
- Pelucidarissa näkyvät vuoron mahdolliset saapumiset: D6 + vuoro → rivit.

## Faktiolinja (käyttäjän päätös 20.10.)

Jokainen skenaario pelataan millä tahansa laivastoilla. Lähteen faktiot näytetään
**suosituksina**:
- Puolet nimetään roolin mukaan (Convoy, Raiders, Hunter), ja tekstit puhuvat
  rooleista.
- Faktiosidonnaiset säännöt on merkitty ("Tyranids", "Tau: gravity hooks").
- "Playing with other fleets" -ohjeet ovat omia ehdotuksiamme, ja ne on merkitty
  sanalla *Suggestion* aina, kun ne eivät tule lähteestä.
- Fularisin hyökkääjän on oltava Chaos (Blackstonet), ja se sanotaan suoraan.

## Käyttöliittymäperiaatteet (käyttäjän linja)

Vähän napautuksia, ei toasteja, ei vahvistuskysymyksiä, ei itsestään sulkeutuvia
paneeleja eikä automaattista vieritystä. Välilehden vaihto pitää välilehtipalkin
paikallaan. Valinnan toinen napautus poistaa sen.

## Sisältö ja tekijänoikeus

Kaikki tekstit on kirjoitettu omin sanoin pelaamista varten. Lähteistä ei ole
kopioitu taustatarinoita eikä kappaleita. Taulukot (saapumiset, sub-plotit,
muodostelmat) ovat pelimekaniikkaa. Jokaisella skenaariolla on lähde ja sivut.
Ennen julkista julkaisua kannattaa kysyä Warp Riftin toimittajalta (horizon) lupa
tai ainakin ilmoittaa asiasta.

## Tulkinnat ja rajaukset

Nämä näkyvät käyttäjälle "Source notes" -laatikoissa. Mitään ei ole valittu hiljaa.

**Kirjan skenaariot**

- Pöydän kokoa ei kerrota missään kirjan skenaariossa. Kartoissa käytetään
  180 × 120 cm:ä, ja siitä on maininta.
- **Cruiser Clash:** vyöhykkeet ovat kirjan kartan mukaan 90 cm leveitä ja 60 cm
  toisistaan, pitkiä reunoja vasten. Pisteet: 1 per vahinkopiste, +1 per lamautettu
  (ei tuhottu) alus ja +3 per tuhottu.
- **The Raiders:** D6 vuoron −1 Ld:n heittohetkeä ei kerrota. Sovellus heittää sen
  ennen ensimmäistä vuoroa.
- **Convoy:** kirja ei kerro, mitkä D6-tulokset tarkoittavat mitäkin lyhyttä reunaa.
- **Planetary Assault:** standby-tilan rajoituksia (Surprise Attack) ei mainita.
- **Escalating Engagement:** satunnaisen reunan numerot ovat kirjan kartasta:
  1 vasen, 2–3 ylä, 4–5 ala ja 6 oikea.
- **Exterminatus:** partioiden satunnaisen reunan heittotapaa ei kerrota.
- **Fleet Engagement:** kirjan kartat ovat kaavamaisia, ja vyöhykkeet on piirretty
  niiden mittamerkintöjen mukaan. B:n keskijako on merkitty 45 cm:ksi, vaikka
  kuva näyttää tasajaolta. B-tuloksessa kirja ei kerro, kumpi pelaaja ottaa
  kumman vyöhykkeen.

**Warp Riftin skenaariot**

- **Siege of Fularis:** partio on lähteessä "½ (750 pts)", mutta planeetalla on
  1000 pts. Sovellus noudattaa asetteluaskelta.
- **Assassination:** asetteluaskel 5 ja Special Rules on yhdistetty yhdeksi
  askeleeksi. Re-enactment on jätetty pois, koska se vaatii fanitekoiset profiilit.
- **Eliarenath's Gift:** vuorojärjestystä 3 pelaajalla ja aktivoidun ryhmän paikkaa
  ei kerrota.
- **Diasporex Gambit:** reunat on luettu vastakkaisiksi. Asettelusyvyyttä ei
  kerrota, eikä pelastuskapselia muissa kuin hit-and-run-tapauksissa.
- **Event Horizon:** hyökkääjää, pöydän kokoa ja kulman kokoa ei määritellä.
- **Parol's Bait:** miinojen VP:t menevät "the attackerille" (luonteva luenta:
  takaa-ajajat). Armada Indomitus viittaa s. 70:een, v1.10:ssä kohta on s. 130.
- **Pelucidar:** "his table edge" ja "any edge" ovat ristiriidassa, ja kartta puuttuu.
  Armada Indomitus muuttaa saapumistaulukkoa.
- **Unknown Weapons:** vain 200 × 200 cm pöytä kuvataan.

**Kirjojen ja vanhojen GW-julkaisujen skenaariot (0.7)**

Yksityiskohdat ovat skenaarioiden Source notes -laatikoissa. Periaatteet:
- Vanhat sääntöviittaukset (esim. "p. 66" = VP, "p. 44" = asteroidit, "Scenario Seven
  p. 76") on muunnettu Remastered-sivuiksi ja kerrottu, mistä ne tulevat.
- Kun Remastered tai FAQ 2026 muuttaa vanhaa sääntöä, sanotaan se (esim. Port Maw
  Blockade: FL s. 512 suojien kanssa, FAQ 2026 ilman → FAQ voittaa; minelayer-refit FL
  s. 23 maksaa, skenaariossa ilmainen).
- Lähteen aukot täytetään vain merkittyinä ehdotuksina: Abhorrencen asettelu ja
  reunat, sen "four damage points" (luettu: neljä osumaa jäljellä), Lachlonin
  vyöhykkeet (lyhyet reunat), Kotolin taistelut 1–4 (pitkät reunat), Kotolin
  "reload on a 5+" -luenta, Wolf Packsin merkkikaistat (tekstin 30 cm + kartan 45 cm).
- **Päällekkäiset** (ei uutta skenaariota, lähde kirjan skenaarion krediitteihin):
  Warp Storm Hunter, Prey ja BFG Magazine 1 Raiders → FL The Hunter and the Prey;
  BFG Magazine 8 Desperate Search → FL Explorer's Prize; Fanatic Magazine 3 Doom of
  the Eldar → FL Craftworld Assault; BFG Magazine 14 Gauntlet, Parol's Bait,
  Pelucidar → RB; Warp Storm Convoy Run Variants → Convoyn uhkataulukot.
- **Ei skenaarioita:** Incident at Stranivar ja Wolf Pack (novelleja), Brace for
  Impact (Q&A), War over Calydon (taisteluraportti), BFG Magazine 18 Elaysion Crusade
  (kampanjaraportti), 2002 Annual (uusintapainoksia ja ideoita).

## Julkaisu (20.10.2026)

- Osoite **https://scenario-library.kuldare.com**, Cloudflare Worker
  **`still-resonance-55fc`**. Nimi on dashboardin automaattinen: käyttäjä latasi
  ensimmäisen version (pelkkä `index.html`) käsin 20.10. klo 14.02 ja liitti
  domainin. Käyttäjä vahvisti, että tämä on Scenario Library.
- `julkaisu/kokoa.py`: tunnus `scenarios`, tiedostot `index.html`, kuvakkeet ja
  `scenarios/*.js` (glob). Lappu (`tools_badge.html`) linkittää tänne kaikista
  BFG Toolsin sovelluksista, ja builderin `build.py` hyväksyy isännän.
- Julkaisu: `cd ../julkaisu && python kokoa.py --kokoa --julkaise scenarios`.
- 0.7 julkaistu 20.10. myöhään (versio dfb678aa): live-sivulla 137 skenaariota ja kaikki kategoriat tarkistettu selaimella.
- Dian teon jälkeen julkaistu uudelleen (versio 495563da): Port Maw'n kartan teksti ympyrän sisällä ja Numitorin Desecrator-profiili (BFG Magazine 9).
- Leveät näytöt julkaistu 20.10. klo 20 (versio f2952393, 0.7.53) käyttäjän hyväksynnällä ("tarkasta ja julkaise"): live-sivu tarkistettu selaimella 1366 × 768:ssa, ja index.html on tavu tavulta sama kuin paikallinen. Samalla GitHub-peili (commit 96d6dd4) ja uusi lappu, jossa on GitHub-rivi.
- Warp Riftin sanamuotokorjaus julkaistu 20.10. illalla (versio d37cd2e4, 0.7.55, GitHub 47f1d40) käyttäjän hyväksynnällä ("julkaiset sit samalla kun on oikeat sanamuodot").
- Warp Riftin laatuluokitus julkaistu 21.10. (versio 0341316c, 0.7.56, GitHub 0c13f8b). Live-sivu tarkistettu: 58/58 luokiteltu, Rules writer -tagi näkyy.
- Lähdeteksteistä ja tekijänoikeudesta ks. "Sisältö ja tekijänoikeus": horizonille
  (Warp Riftin toimittaja) kannattaa yhä kertoa sovelluksesta.

## Seuraavat askeleet

- Victory points -laskuri (destroyed / crippled / disengaged, RB s. 123).
- PWA, jotta sovellusta voi käyttää pöydässä ilman verkkoa (kuten Fleet Play).
- Kortti- tai tulostusnäkymä (yksi A4 per skenaario).
