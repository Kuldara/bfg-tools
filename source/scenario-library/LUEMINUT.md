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
- **Aukot kirjoituskentiksi, lähteet uudelleen ja laatututkimus (21.10., julkaistu):**
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
- **BFG Scenario Listing -vertailu (21.10., julkaistu 0.8:n mukana):** ElectricFan127 jakoi Discordissa
  yhteisön skenaarioluettelon (152 riviä). Lähes kaikki rivit ovat jo kirjastossa, ks.
  `../tulosteet/ref/bfg_julkaisut/Fanilisaosat/LUEMINUT.md`. Puuttuvat viisi fanilisäosaa
  (Advanced Scenarios, Book of Nemesis, Project Distant Darkness, Starblade ja Tournament Mission
  Pack, noin 50 skenaariota) ladattiin käyttäjän luvalla samaan kansioon. Niiden skenaariot
  lisättiin versiossa 0.8 (alla).
  - **Commerce Raiders:** kirjoittajan uusin versio 0.5 (online-dokumentti) on uusi oletusversio.
    Siinä on kolme asettelualuetta (Rearguard, Convoy ja Convoy Leaders, 30 × 15 cm), pienten
    pöytien sääntö (kartta kutistaa alueet) ja pisteytys kuljetuskapasiteetin mukaan, jossa
    parannukset eivät tuota pisteitä saattueelle.
- **Escalating Engagementin aloitusmerkit alueena (21.10. iltapäivä, 0.9.2, julkaistu klo 14.42, Worker 38f69b31, GitHub d0e7c2a):**
  horizon huomautti, että kartan P1- ja P2-merkit näyttivät kiinteiltä paikoilta. Käyttäjä: "turha olla
  tarkka piste vaan ennemmin deployment alue maalaus". Nyt kartalla on maalattu neutraali alue
  (30 cm reunoista) ja sen yläreunassa teksti "Starting markers: anywhere in here, 60 cm+ from the enemy
  marker". Teksti on yläreunassa, koska keskellä arvottu maasto peitti sen. Etäisyys on 60 cm kuten
  RB s. 138 (v1.10 ja v1.11); horizon muisti 30 cm, mutta se on etäisyys reunoista. Muutos koskee myös
  Ahriman's Arrivalia, joka lainaa kartan (`cl-mag-a.js`: P1/P2-nimeäminen poistettu). Karttatesti 0 + 0,
  maastotesti 0. Script-tagit `?v=0.9.2`.
- **Play-välilehden osiot voi piilottaa (21.10. ilta; julkaistu 0.11.2:n kanssa, GitHub 6c76abb. Ennen julkaisua selaintesti leveä ja kapea 0 virhettä, kuvakierros 1 850 sivua 0, mikään ei muuttunut testien aikana. Live: Cruiser Clashissa Play-kartta ja neljä Hide-nappia).** Käyttäjä: *"voi tietty olla hide ominaisuuksia play
  osuudessa. eri ihmisiä kiinnostaa eri jutut ja sillä vältyttäisiin scrollaukselta"*.
  - **Piilotettavat osiot:** vuoron opas (vuororata ja "Turn N" -lista; vuoronumero ja +/− pysyvät aina), kartta "On the
    table", "Scenario rules in play" ja "Tools". Hide- ja Show-nappi on otsikossa, ja piilotetusta osiosta jää vain otsikko.
  - **Tallennus:** valinta on pelaajan eikä skenaarion, joten se tallentuu kerran (`DB.ph`) ja pätee kaikkiin skenaarioihin.
    Mikään ei sulkeudu itsestään (UI-linja).
  - **Vaikutus:** puhelimella Escalating Engagementin Play-sivu lyheni 2 916 → 1 953 px, kun kartta ja säännöt piilotettiin.
- **0.11.2 (21.10. ilta): kartta Play-välilehdellä kaikissa.** Käyttäjä: *"itseasissa laita aina kartta tuohon play
  välilehteen kaikissa"*. Kumoaa 0.10:n `PLAYMAP_OFF`-rajauksen (30 asettelukarttaa). Mukaan tulivat myös kampanjat ja
  skenaariot, joissa ei ole kiinteää karttaa mutta maasto on arvottu (esim. Battles in the Warp). Kartta näkyy 200
  skenaariossa 204:stä. Ilman jäävät neljä kampanjaa, joilla ei ole omaa karttaa ja joiden taistelut pelataan muina
  skenaarioina: Phillipa, Pirates Campaign, Stygies-kampanjapuu ja Hive Ship Base. Niissäkin kartta näkyy, jos maasto
  arvotaan. Fleet Engagementin Play-kartta noudattaa samaa "Set-up to be decided" -sääntöä kuin Set-up.
- **0.11 (21.10.2026 ilta): skenaarion oma ilmiögeneraattori Set-up-työkaluun** (julkaistu: GitHub 432d071. Ennen julkaisua maastotesti 0, mittatesti 0, karttatesti 4 020 karttaa 0 + 0, selaintesti leveä ja kapea 15 184 näkymää 0 virhettä, sisältötesti 0 + 0, kuvakierros 1 850 sivua 0. Live tarkistettu: Battles in the Warpissa ei ole kartan yläpuolista ohjainta, ja työkalun nappi arpoo warp-ilmiöt). Käyttäjä Battles in the Warpista:
  *"tässähän voisi integroida tuon terrain generaattorin kustomina tuohon setup tolls missä arvotaan varp ilmiöitä.
  toteuta ja toteuta vastaaviin"* ja *"normimaastoa tuskin tähän kyseiseen generoidaan ollenkaan"*.
  - **`TERRAIN[id].tool`:** skenaarion oma heittotyökalu on nyt maastogeneraattori, jossa ovat napit Generate on the
    map / Reroll / Clear, tuloksen yhteenveto ja lähteen taulukko viitteeksi. Kartan yläpuolella ei ole erillistä
    maasto-ohjainta, joten kahta rinnakkaista heittoa (ent. varoitus "use one or the other") ei enää ole. Koskee seitsemää
    skenaariota: Battles in the Warp, Cerberus 2, Minor Engagement, Hunter and Prey, Dark Crescent Moon, Prophecy ja
    Spirit. Niiden vanhat ruutukohtaiset piirrot (`st.w.terr/neb/ast`) on poistettu käytöstä, joten mitään ei piirretä kahdesti.
  - **`TERRAIN[id].skin`:** skenaarion omat ilmiöt ytimen palatyypeillä. Ydin pysyy tavulleen samana kuin Battlezone
    Generatorissa. Skin antaa nimen, tunnuksen, värin, säännön, mittatekstin ja lokin samat nimet, ja `arrow` piirtää
    nuolen. `bzSkin` tekee muunnoksen generoinnin jälkeen.
    - **Battles in the Warp:** ei kirjan battlezonea eikä aurinkoreunaa. Jokaiselle 60 cm alueelle D6, ja 4+ heittää
      warp-taulukkoa (lähde: WR30 s. 16; määrä "as the base scenario’s battlezone would give"). Palat:
      - warp-virta = rift (D3×10 cm pitkä) nuolena scatter-suuntaan; jos nuoli osoittaisi pöydän yli, suunta
        heitetään uudelleen ja keskikohta pysyy ytimen paikassa
      - saalistajaparvi = asteroidin koko D3×5 × D3×5
      - haamuplaneetta = pieni planeetta ilman kirjan gravity welliä (D3×5 joka vuoro)
      - warp tsunami = tapahtuma, jonka vuorosääntö on kartan alla.
    - **Cerberus 2:** warp-avaruuden nimet (dense warp current, warp current, gateway to realspace, space hulk) kirjan
      säännöillä.
  - **Testi:** `maastotesti.js` tarkistaa lisäksi, että nuolet ovat kokonaan pöydällä. Testi löysi ensimmäisestä
    versiosta päällekkäisyyden (nuolen keskikohdan siirto), ja se korjattiin uudelleenheitolla.
- **Kahden laivaston suodatin (21.10. ilta):** käyttäjä: *"tuohon voi tietty laittaa kahden eri fleetin suosituksen. esim jos
  haluaa ork vs imperium niin suoraan suodattaa"* ja *"ettei ole pakko valita kahta"*. Etusivun Filtersiin ja Before the
  battle -arvontaan tulee toinen valikko "vs …" (`f.sug2`, `p.sug2`). Kumpikin on vapaaehtoinen. Kun molemmat on valittu,
  suosituksen pitää sisältää kumpikin laivasto, ja "any fleets" -skenaariot pysyvät mukana kuten ennenkin.
  Orks vs Imperial Navy: arvontapooli 70 (52 any fleets + 18 suositeltua), etusivu 72 (osittainen osuma, esim. Orks-alaryhmät).
- **Saapumisheitot nopalla (21.10. ilta, 0.12.1).** Käyttäjä Exterminatuksesta: *"ei voi vissiin rollata tuota patrol saapuu"*.
  - **Mitä muuttui:** neljässä skenaariossa oli pelkkä nopeustaulukko (pick). Tilalle tuli `ARRIVAL`-noppa: D6 jokaiselle
    laivalle, laivueelle tai merkille, ja tulos kertoo suoraan, mille nopeuksille se riittää (RB s. 139, 141). Exterminatuksessa ja Siege of
    Fularisissa sama nappi heittää myös saapumisreunan.
  - **Escalating Engagement:** tulos näyttää myös +2:n (omat laivat 30 cm:n sisällä).
  - **Above Belis Corona:** kumulatiivinen +1 (joka toinen epäonnistuminen) lisätään itse, ja teksti sanoo sen.
  - **Tallennetut tilat:** uudet tunnisteet (`arr2`, `pat`, `res`), jotta vanhat taulukkovalinnat eivät sotke noppaa.
    `shiproll` sai valinnaisen näyttömuodon `show` ("6 · edge 5").
- **0.12 (21.10.2026 ilta): skenaarion koon suodatin** (julkaistu käyttäjän luvalla ("joo"): Worker-versio ec842632,
  GitHub Kuldara/bfg-tools 9f947de; index.html tavuvertailussa TARKISTETTU, live 204 skenaariota, S/M/L 131/109/119). Käyttäjä: *"voisi myös lisätä yhdeksi
  suodattimeksi skenaarion koon. esim kolme. about 750 1250 ja 1500 tai isommat"*. Etusivun Filtersiin rivi **Size** ja
  Before the battle -arvontaan sama nappirivi: Small (up to 1000) / Medium (1000–1500) / Large (1500+). Valinta on
  vapaaehtoinen, ja toinen napautus poistaa sen. Käsin tehty luokitus kaikille 204 skenaariolle on `scenarios/sizes.js`:ssä.
  Ks. luku "Skenaarion koko (0.12)".
- **0.10.7 (21.10.2026 ilta): ei oletuksia kartalle eikä maastoa ilman nappia** (julkaistu yhdessä kahden laivaston suodattimen kanssa: GitHub 977e549; ennen julkaisua selaintesti leveä + kapea 0 virhettä, karttatesti 4 020 karttaa 0 + 0, sisältötesti 0 + 0, mittatesti 0, maastotesti 0, kuvakierros 1 850 sivua 0; live tarkistettu: Fleet Engagement "Set-up to be decided", maastonappi ilman laatikkoa, psug2/lsug2 julkaistussa index.html:ssä). Käyttäjä: *"älä näytä esim
  fleet engagment deployment karttaa avatessa kun sitä ei ole vielä päätetty. pitäisi varmaan olla tyhjä ja lukea
  jotain että to be desided jne. ja kaikkiin vastaaviin sama"* ja *"ei kannata laittaa terrainia defaulttina. vasta
  jos painetaan sitä nappia. monet ei edes halua arpia sitä mun sivulla"*.
  - **Asettelu, joka päätetään pöydässä** (`PENDING_VAR`, `varPending`): Fleet Engagement ja The Art of Command 1
    (asettelu A–D muodostelmista ja heitosta). Kun asettelua ei ole valittu, kartta on tyhjä pöytä tekstillä "Set-up
    to be decided", rivin otsikko on "Set-up: to be decided" eikä yksikään A–D-nappi ole valittuna. Valinta
    (`st.vSet`) tulee versionapista tai Formations-työkalun "Show set-up X" -napista. Vanha tallennettu `st.v` ei riitä päätökseksi: käyttäjällä näkyi aiemmin valittu Set-up B, vaikka tämän pelin muodostelmia ei ollut valittu. Korjattu ja julkaistu 21.10. (GitHub 6a5caa4). New game nollaa valinnan,
    koska asettelu päätetään joka peliin erikseen. Testit (`mapOf`) piirtävät yhä kaikki A–D.
  - **Heitosta riippuvat kartan osat piirretään vasta heiton jälkeen** (ennen heittoa näkyi oletus):
    - Lachlonin kuut ja asema: "Moons and station: roll them below".
    - Craftworld Assaultin gravity well: "craftworld: roll its size below".
    - No Way Outin pyrstö: "tail: 3D6 cm, roll below".
    - Shadow of the Cometin komeetta ja hyökkääjien laatikko: "roll which end it starts from". Myös
      pelikartassa, joka ennen oletti alapään.
    - Wolf Packsin saattueen tuloreuna ja pakoreuna: "Convoy entry edge: roll it below".
  - Sovittavien kohtien (`{a:…}`) oletukset jäivät ennalleen: ne ovat ehdotuksia, jotka näkyvät "Agreed before the
    game" -laatikossa, eivät arvauksia.
  - **Maasto:** sitä ei arvottu koskaan ilman nappia (190 koskematonta skenaariota tarkistettu, maastoa ei
    yhdessäkään). Ennen arvontaa Set-upissa näkyy nyt vain pieni "Generate terrain" -nappi ja yksi rivi, eikä
    otsikkoa, battlezone-valikkoa tai selityslaatikkoa. Ne tulevat näkyviin arvonnan jälkeen.
- **0.10 (21.10.2026 ilta): kartta Play-välilehdelle (julkaistu klo 16.30: Worker 82db3901, GitHub 39a144a; ennen julkaisua selaintesti leveä + kapea 15 184 näkymää 0 virhettä, karttatesti 4 020 karttaa 0 + 0, sisältötesti 0 + 0, mittatesti 0, maastotesti 0, kuvakierros 1 850 sivua 0; live tarkistettu: The Bait vuoro 4 = 90 cm kuten kirjan esimerkki).** Käyttäjä: *"esim tuossa escalating engagement
  scenaariossa olisi hyötyä että kartta edelleen näkyvissä play välilehdessä. ainakin pienempänä (ja siinä on
  sit vähän eri kartta piirto kuin vuoro 0) ja mieti muut scenaariot myös missä tämä parannus relevantti ja
  toteuta ja julkaise"*.
  - **Moottori:** `mapOf(sc, v, playT)` ja `playMapBlock`. Play-välilehdellä on "On the table" -kartta, joka
    on pienempi kuin Set-upissa (34 vh puhelimella, 44 vh leveällä). Kapealla se on vuoropaneelin alla.
    Leveällä se on oikeassa palstassa sääntöjen yläpuolella, jotta se ei jää tarttuvan vuoropaneelin alle.
    Arvottu maasto on sama kuin Set-upissa, ja vuoron vaihto piirtää kartan uudelleen.
  - **Missä:** kaikissa kartallisissa skenaarioissa paitsi `PLAYMAP_OFF` (30 kpl) ja kampanjat.
    `scenarios/play-maps.js` perustelee rajauksen: niissä kartta kertoo vain asettelun eikä pelissä ole
    paikkasidonnaisia sääntöjä. Esimerkkejä: Cruiser Clash, Fleet Engagement ja "no special rules" -taistelut.
    Valinta tehtiin lukemalla jokaisen skenaarion Play-säännöt: 155:ssä on reuna-, saapumis-, poistumis- tai
    etäisyyssääntö, ja 44:stä ilman sellaista 14 jäi silti mukaan, koska niiden kohteet ovat kartalla
    (asemat, hylyt, pelastusmerkit).
  - **Oma pelinaikainen piirto (`PLAYMAP[id].draw`) 11 skenaariossa**, joissa pelin kuva eroaa asettelusta:
    - Escalating Engagement ja Ahriman's Arrival: aloitusalue pois, reunat "D6: 2–3" jne. ja reservimerkkien
      sääntö.
    - Vuoron mukaan kasvava saapumiskaista pitkillä reunoilla: The Bait, Parol's Bait, Rearguard Attack,
      Rising Shadow, Live Another Day, The Trap (lyhyemmällä pöydällä myöhässä kuten Set-upin tiksit) ja
      Commerce Raiders (30 cm × vuoro käytäväreunasta).
    - Shadow of the Comet: komeetan paikka vuorolla N (10 cm / vuoro, lähtöpää Set-upin heitosta).
    - Solblade 2: shokkiaalto 15 + 30 (T − 2) cm Tyranidien ja 30 + 30 (T − 2) cm Solbladen siirron jälkeen.
  - **Testit:** `karttatesti.js` tarkistaa myös pelikartat vuoroilla 1, 2, 3, 4, 6 ja 8 (4 020 karttaa, 0 + 0).
    Testi löysi 26 tekstien päällekkäisyyttä, ja ne korjattiin: tekstit kolmelle riville, The Trapin teksti
    aseman sivuun ja komeetan teksti mittaviivan vastakkaiselle puolelle.
- **Tekniset mitat kaikkiin karttoihin (0.9.3, 21.10.2026 ilta; julkaistu klo 16 versiona 0.9.8):** käyttäjä: *"ainakin kaikessa saisi
  olla tekniseen piirrustuksen tyyliset mitat että tuon kuvan saa aina replikoitua omalla pöydällä"*, ja pisteistä:
  *"turha olla tarkka piste vaan ennemmin deployment alue maalaus minne laittaa se yksikkö"*. Moottori mittaa jokaisen
  kiinteän kohteen pöydän reunoista pöydän ulkopuolelle, ja kartat, joissa piste näytti kiinteältä paikalta vaikka sääntö
  sallii alueen, korjattiin. Selite kertoo ruudukon ("180 × 120 cm · grid 30 cm"). Uusi testi `testit/mittatesti.js`.
  Ks. luku "Tekniset mitat (0.9.3)". Script-tagit `?v=0.9.8`.
- **Rules writer myös fanilisäosiin ja Event Horizon -nimi (21.10. iltapäivä, julkaistu 0.9.1:n mukana):**
  horizon kysyi Discordissa, miten Rules writer -tagi on jaettu lisäosille, ja toivoi skenaariolleen
  nimeä "Just Event Horizon". Muutokset:
  - Tagi kertoo kirjoittajan roolista, ei lähteestä (käyttäjän päätös). Siksi `FAN_TAG` antaa sen myös
    Project Distant Darknessille (28 skenaariota) ja Starbladelle (9), koska horizon on niiden (toinen)
    kirjoittaja. Luokka pysyy Fan supplements. Tagi on nyt 50 skenaariolla, ja haku "rules writer"
    löytää ne.
  - Sources-sivun tagirivi ja Fan supplements -osio kertovat tämän.
  - `event-horizon`: nimi "Event Horizon" (ennen "The Eisner Incident", lehden kartan kuvateksti),
    series "Warp Rift 43 · 20th anniversary issue".
  Muutokset ovat `index.html`:ssä. Ne menevät livenä terrain-ominaisuuden julkaisun mukana, koska
  terrain-istunto muokkasi samaa tiedostoa samaan aikaan.
- **0.8.x (21.10.2026): Project Distant Darkness Chapter I (julkaistu 21.10. versiona 0.8.5).** Käyttäjä toi
  zipin ("lisää scenario sourceja"): siinä oli puuttunut Chapter I *The Art of Command*; Main ja Chapter II
  olivat tavulleen samat kuin kansiossa jo olleet. 12 skenaariota (kymmenen tehtävää ja kaksi pientä
  sukkula-alatehtävää) Revivalin ja Distant Sunin väliin, 192 → **204 skenaariota**. Tulkinnat: luku
  "Fanilisäosat (0.8)" → Project Distant Darkness. Testit ks. Testaus. Moottoriin valinnainen
  `legend: [[väri, teksti], …]` kartan selitteelle (Part One: Fleet Engagementin värit ovat vyöhykkeitä).
- **0.8 (21.10.2026): fanilisäosat (julkaistu 21.10. käyttäjän luvalla, Worker-versio 6ef53186,
  GitHub-peili 3af2fba; index.html tavuvertailussa TARKISTETTU).** Viiden
  fanilisäosan skenaariot, 137 → **192 skenaariota** (+55). Yksityiskohdat: luku "Fanilisäosat (0.8)".
  - Uusi kategoria **Fan supplements** etusivulle, Sources-sivulle ja koko kirjaston arvontaan, merkki
    **Fan supplement** (`trust: "fan"`) ja neljä ryhmää: `fan-tour`, `fan-nem`, `fan-pdd`, `fan-sb`.
  - Uudet tagit **Tournament** ja **Fixed forces** (hakusanoineen, Sources-sivun merkintätaulukossa).
  - Karttoihin monikulmio `{ z: "poly", pts }` (kolmiovyöhykkeet: Influence of Space Power, Recon in Force).
  - Alatunniste "version 0.8 · 192 scenarios" ja krediitteihin fanilisäosat; meta description mainitsee
    ne. Skenaariotiedostojen `?v=0.8.0`.
  - Testit: selaintesti leveä 1440 ja kapea 375, karttatesti (myös arvottu maasto ja numerokentät
    maksimissa), sisältötesti, sivuviiteauditointi ja kuvakierros: kaikista 0 löydöstä (ks. Testaus).
- **0.9 (21.10.2026): maasto skenaarion kartalle (julkaistu 21.10. klo 14 käyttäjän luvalla, 0.9.1).** Käyttäjä: *"saisiko
  tuon mun terrain generaattorin tuonne skenaario sivun sisään? eli joku nappi että generate terrain ja reroll
  nappi. se sitten olisi automaattisesti scenaarioon sopivalla terrainilla jos sellainen määritetty tai itsestään
  selvää"* ja kesken työn: *"ei aleta tässä mitenkään digitaalisesti toteuttamaan mitän custom vuorottelevaa
  asettelua … mutta jos voidaan generoida skenaarion pyytämän tyylistä maastoa niin tietty. kaikkiin kyl voidaan
  laittaa optio että generoi maasto. (maininta sit jos tarvii että ei ole skenaarion ajatuksen mukainene)"*.
  Set-upin kartan alla on nyt **Celestial phenomena** -paneeli: Generate terrain / Reroll / Clear, battlezone
  skenaarion mukaan, palat ja niiden säännöt. Ks. luku "Maasto (0.9)".
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
| `scenarios/fan-tournament.js` | Fanilisäosat (0.8): AdeptiConin turnaustehtävät 2007–2016 (Tournament Mission Pack) ja kuusi niistä Advanced Scenarios -versioina, 17 skenaariota. Yhteiset apurit: battle pointit (`tpResult`, `advResult`), anti-disengage-bonus (`cowTool`), sivutavoitteet (`secRoll`, `secTools`, `ptsTools`). |
| `scenarios/fan-nemesis.js` | Book of Nemesis (2007): Gehennan 4 erikoisskenaariota, 3 historiallista, 4 turnaus- ja 2 erikoisskenaariota (13). Gehennan omat puolustukset (`DEF_PROFILES`) työkaluissa. |
| `scenarios/fan-pdd.js` | Project Distant Darkness: Revival 9 + The Art of Command 12 + Distant Sun 7 (28). Lisäosan omat profiilit (Mantis, Marauder, hahmot, Tigershark) työkaluissa ja huomautuksissa kirjan vaihtoehdon kanssa. |
| `scenarios/fan-starblade.js` | Starblade (9). Arvottu asteroidiruudukko piirtyy karttaan (`squares`). |
| `testit/sisaltotesti.js` | Sisältötesti selaimessa: karttojen puolivärit, askelten puolet, tulosfunktiot satunnaissyötteillä, verbin taipuminen ja WR-luokitus (ARVIO). |
| `testit/leveat.js` | Leveiden näyttöjen mittari: näytöllisiä, leveys ja ensimmäisen näytön sisältö viidellä näytöllä (ks. Leveät näytöt). |
| `testit/sivuaudit.py` | Sääntöviitteiden auditointi RB/FL-tekstidumppeja vasten (otsikkotaso), käsin tarkistetut poikkeukset listassa. |
| `tee_kuvakkeet.py` | `apple-touch-icon.png` ja `favicon.png` (sama kuvio kuin SVG-favicon). |
| `testit/selaintesti.js` | Regressiotesti selaimessa (ks. Testaus). |
| `testit/karttatesti.js` | Karttojen tekstien sijoittelu kaikilla pöydillä ja fonttikoilla (ks. Testaus). Mittojen luvut ovat mukana. |
| `testit/mittatesti.js` | Node (0.9.3): jokaisen kartan kiinteät kohteet on mitattu pöydän reunoista, ja jokainen mitan luku vastaa piirrettyä pituutta. Ks. "Tekniset mitat (0.9.3)". |
| `testit/kuvakierros.js` | Kuvakaappaus jokaisesta sivusta ja asettelun tarkistus, Node + headless Chrome (ks. Testaus). `--maasto` arpoo maaston jokaiseen skenaarioon ennen kuvausta (0.9). |
| `battlezone-core.js` | **GENEROITU, älä muokkaa** (0.9): Battlezone Generatorin arvontaydin, kopio `../terrain generator/index.html`:n BZCORE-lohkosta nimiavaruutena `BZ`. Ks. "Maasto (0.9)". |
| `tee_maastoydin.py` | Kirjoittaa `battlezone-core.js`:n generaattorista (`--tarkista` = vain tarkistus). |
| `scenarios/terrain-map.js` | `TERRAIN`: jokaisen 204 skenaarion maasto (battlezone ja peruste, skenaarion planeetat ja palat, maininta). |
| `scenarios/sizes.js` | `SIZE` (0.12): jokaisen 204 skenaarion kokoluokka (S/M/L tai any), pisteet ja peruste. Ks. "Skenaarion koko (0.12)". |
| `testit/kokotesti.js` | Node (0.12): jokainen skenaario luokiteltu, luokat sallittuja, pisteteksti ja luokka johdonmukaisia, suodattimen luvut etusivulla ja arvonnassa samat. |
| `testit/maastotesti.js` | Maastotesti Nodessa: ydinkopio, generaattorin sormenjäljet, jokainen skenaario × versio × 5 pöytää × 12 siementä. |
| `testit/_lataa.js` | Lataa kirjaston Nodeen ilman selainta (DOM tyhjinä olioina); maastotestin apuri. |
| `testit/maasto_sormenjaljet.json` | Battlezone Generatorin omien karttojen sormenjäljet (7 560 tapausta, ennen ytimen laajennusta). |
| `julkaisu/discord-2026-10/` | Esittelydia ja postausteksti Discordiin (20.10.), ei julkaistava osa sovellusta. |
| `julkaisu/discord-2026-10-v07/` | 0.7:n iso dia (2560 × 1440) ja postausteksti (20.10.). Ei julkaistava osa sovellusta. |

Esikatselu: Browser-paneelin konfiguraatio `scenario-library` (portti 8781)
juuren `.claude/launch.json`:ssa. Jos toinen istunto pitää porttia 8781, käytä `scenario-library-2`
(portti 8783, lisätty 21.10.).

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

**0.8 (21.10.2026), 192 skenaariota:** selaintesti leveänä (1440) ja kapeana (375) 14 284 näkymää,
192 erillistä otsikkoa, 0 virhettä; karttatesti 2 930 karttaa, 14 244 tekstiä, 0 + 0, lisäksi arvottu
maasto piirrettynä (sumu- ja asteroidiruudut) 0 + 0 ja numerokentät maksimissaan 0 + 0; sisältötesti
0 + 0 (14 280 tulosfunktiokutsua, 289 sovittavaa kohtaa); sivuviiteauditointi 290 viitettä, 0
tarkistamatta; kuvakierros koko kirjastosta 1 742 sivua, 0 löydöstä, ja uusista sivuista kuvina 494
sivua, 0 löydöstä. Ensimmäinen karttatestiajo löysi 15 + 16 (lähinnä 244 × 122 -pöytä puhelinfontilla,
jossa fontti on lähes 9 cm), kuvakierros 19 (taulukon `nowrap`-ensimmäinen sarake ja liian pitkä
tulosnapin oikea teksti); kaikki korjattu. Lisäksi kaikki 63 fanikarttaa (versioineen) katsottiin silmin
rinnakkain 180 × 120 -pöydällä: kolme ahdasta kohtaa, joita karttatesti ei mittaa (nuoli tekstin
alussa, teksti kiinni vyöhykkeen reunassa), korjattiin.

**0.8 + Chapter I (21.10.2026, `?v=0.8.4`), 204 skenaariota:** selaintesti leveänä (1440) ja kapeana (375)
15 184 näkymää, 204 erillistä otsikkoa, 0 virhettä; karttatesti 3 120 karttaa, 14 984 tekstiä, 0 + 0;
sisältötesti 0 + 0 (15 180 tulosfunktiokutsua, 314 sovittavaa kohtaa); sivuviiteauditointi 310 viitettä,
0 tarkistamatta; kuvakierros koko kirjastosta 1 850 sivua, 0 löydöstä, ja PDD:n sivuista kuvina 258 sivua,
0 löydöstä. Ensimmäinen karttatestiajo löysi 1 + 3 (nimiöt päällekkäin 244 × 122 -pöydällä
puhelinfontilla, asteroidinimiö pöydän reunan yli, teksti merkin päällä). Uudet kartat katsottiin lisäksi
silmin rinnakkain: viisi kohtaa, joita testi ei mittaa (mittaviiva tekstin läpi, tekstit katkoviivan
päällä, Fleet Engagement -kartan selite laivastojen nimillä). Selitteelle tuli valinnainen kenttä
`legend: [[väri, teksti], …]` (index.html), jota Part One käyttää ("Dark zone", "Light zone"). Kaikki
korjattu.

**Pistokoetarkastus 21.10.2026 (käsin, `pistokokeet_2026-10-21.md`):** siemennetty, kategorioittain ositettu
otanta (siemen 20261021): 46 skenaariota luettiin lähdettä vasten, ja kaikki skenaariotiedostot olivat mukana. Kaikkien
192:n näkyvä teksti tarkistettiin heuristiikoilla. Lisäksi tehtiin 60 tuomion oraakkelitapausta, selainpelaus, karttoja
lähteen karttaa vasten ja neljä näyttökokoa. Löydöksiä 26, joista 24 korjattiin. Keskitason löydökset: Fleetsin
Convoy-merkkien vapaaehtoinen aktivointi oli rajattu vuoroon 2, Treasure Fleetin tuomio jakoi tuhotut kuljetusalukset,
Srinagarin Cantatum Bellum merkittiin Chaos-alukseksi ja Falling Downin paljastetut kuljetusalukset puuttuivat. Moottoriin
tuli kaksi muutosta. Result näyttää sovitut voittoon, tasapeliin ja pituuteen liittyvät kohdat (`agreeList(sc, st, only)`),
ja joukkokortissa "Suggested: Any" näkyy muodossa "any fleet". Uusi tarkistin `testit/sivuaudit_tiukka.py` etsii viitteitä,
joiden sivulla on vain sekakirjaiminen osuma, vaikka varsinainen otsikko on toisella sivulla. Se löysi Warp rifts RB s. 101 → 111,
jonka `sivuaudit.py` hyväksyi. Kaksi löydöstä (`fan-pdd.js`) korjasi rinnakkainen Chapter I -istunto. Script-tagit lopuksi `?v=0.8.5`. Käyttäjän päätökset (21.10. iltapäivä): Book of Nemesiksen turnausskenaarioissa attack rating
-heiton voittaja *aloittaa* (lähteen sanamuoto), ja Cerberus 3:n Inquisition-alukset pelataan lehden hinnoilla
(270/175 pts, Fleets-kirjan 300 pts mainittu Source notessa; `?v=0.9.3`).
Testit korjausten jälkeen (204 skenaariota) olivat vihreitä.

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
| `fan-tour`, `fan-nem`, `fan-pdd`, `fan-sb` / `fan` | Fan supplement | Fanilisäosat (0.8): turnaustehtävät, Book of Nemesis, Project Distant Darkness, Starblade. Etusivulla kategoria Fan supplements, arvonnassa oma lähde. |

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
| **Warp Rift** | Siege of Fularis, Assassination, Eliarenath's Gift, The Hammer Needs an Anvil, Event Horizon (komitea; nimi ennen "The Eisner Incident", tekijä toivoi 21.10. pelkkää Event Horizonia); Fall of Ar'Cianr, Unknown Weapons (lore) | WR5, 10, 11, 34, 43, 20 |
| **Campaigns** (0.6) | Black Crusade: Chance Encounter, Rearguard Attack, Alien Intervention, Above Belis Corona, Daemon Blockade, Navigate the Storm, Macharia's End | RB s. 191–199 |
| **Warp Rift · komitea** (0.6) | Depth of Space (7 versiota), Diasporex Diversions, Solblade 1–6 | WR40–43 ym. |
| **Warp Rift · L3** (0.6) | 8 yhteisön pelattua + The Spreading War (11) | WR14–49 |
| **Books · Fleets** (0.7) | Merchantmen's Folly, The Hunter and the Prey, The Gauntlet (Rogue Traders), Explorer's Prize, Space Hulk!, The Void Malevolent, Craftworld Assault | FL s. 200–211, 312–315 |
| **Classic GW** (0.7) | Warp Storm: Callavell, Torpedo Run · Planet Killer 1: Space Hulk Convoy, Phillipa II · BFG Magazine 1–19: Corribra II 1–4, Pirates, Treasure Fleet, Evacuation, Cadian Line, Ahriman's Arrival, Rath's Last Stand, Antioc 1/3/4, Execution Hour, The Siege, Defence of Macragge, Numitor, Cold Passage, They Come Only to Murder, Cerberus 1–4, Belis Corona 1–4, Damocles 1–2 · Fanatic Magazine: Damocles 3–4, Wolf Packs, Tau Space Tau Trade · Fanatic Online: Daemon Run, Lachlon II, Port Maw Blockade, Abhorrence, Planet Fall, Kotol (5) · Invasion: The Chart, Conquest, Breakthrough, Head of the Snake, Retrieval, Defensive Ring, Port Maw, Boarding Party, Deadline | BFG Magazine, Fanatic, Invasion |
| **Fan supplements** (0.8) | Turnaus 17: Manna from the Heaven (+ Supply Run), The Road to Hell, The Influence of Space Power, Battle on the Edge of the Warp, Scavenger Hunt, The Black Hole, Sink the Bismark, An Unexpected Encounter, Battle in the Derelict Base, Capture the Station, Retrieve the Salvage, Protect the Salvage, Brace for Impact, Wrecks O’Plenty, Neutron Star, Shepard Moon, Hide N’ Seek · Book of Nemesis 13: Death of the Governor, Guns of Naravona, Shadow of the Comet, Line of Gehenna, Incident at Kravertus II, The Fall of Great Armada, The Longest Travel, Recon in Force, Tearing the Flanks, Titan Clash, Capture the Hulk, Ambush, Gunnery Practice · Project Distant Darkness 28: Hunter-Prey, Light and Darkness, Stolen Goods, Barrage, Crossfire, Silent Strike, Hunter Cadre, Another Day Another Plan, Into Darkness; The Art of Command 12: When It All Comes Back, Awakening in the Labyrinth, The Truth of Scheming, To Find the Light, No Way Out, Distant Darkness, Ly’tan’s Flight, A Lost Tale, The Art of Command Part One ja Part Two, Garit’s Escape, For the Greater Good; Distant Sun: Into the Claw, Supply and Demand, Nightmares, Spirit Within Spirit Without, Rising Shadow, Abandon All Hope, Ever Dream · Starblade 9: Dark Crescent Moon … Starblade | `../tulosteet/ref/bfg_julkaisut/Fanilisaosat/` |
| **Warp Rift · L4** (0.6) | 24: Mobeel Narrows, Choir of a Thousand Voices, Wolf Hunt, Hunter Hunted, Cat and Mouse, Solar Collectors, Hunt for the Eldar 1–2, Convoy Battle, Contact!, Falling Down, Darkening Technology Raid, Stygies-kampanjapuu, Looting the Hulk, Pirate Bases, Battles in the Warp, Fleet Engagement Variant, Solitaire Campaign, The Trap, Hive Ship Pirate Base, Norduun, Fall of Hyra, Shattered Gate, Srinagar | WR5–48 |

Kaikki tulkinnat ja ristiriidat ovat skenaarioiden "Source notes" -laatikoissa
(esim. tulostamattomat kartat: Convoy Battle, Looting the Hulk B; väärä kartta:
Falling Down; katkennut sääntö: Srinagar). Mitään ei ole valittu hiljaa.
Todellisista ihmisistä (kirjoittajat, pelaajat) käytetään neutraalia muotoa;
fiktiiviset hahmot lähteen mukaan.

Käyttäjä on pelannut Fleet Engagementin, Escalating Engagementin, The Raidersin
ja Cruiser Clashin. Ne tehtiin ensimmäisinä ja huolellisimmin.

## Rakenne

- **Etusivu.** Kategoriavalinta: Core 10 (oletus), Books, Classic GW, Warp Rift, Fan supplements (0.8), All (21.10.; ennen Rules writers + Community, sitä ennen WR official + Community).
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
  karttapalstassa korkeus on `100vh − yläpalkki − 250 px` (0.9:stä 300 px, koska maaston ohjausrivi on kartan
  yläpuolella, ks. "Maasto (0.9)"), jotta pöytävalinta, kartta, selite
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
    Books / Classic GW / Warp Rift, 21.10. illasta; Fan supplements 0.8:sta), "Book rules only", "Fits my table" (`FITS`
    nykyisellä pöydällä; jos jokin versio mahtuu, skenaario kelpaa) ja "Suggested
    for" -faktio (any-fleet-skenaariot pysyvät mukana). Altaan sirun napautus
    jättää skenaarion pois. Reroll arpoo eri skenaarion kuin edellinen.
- **C · Attack ratings:** "What is the roll for?" valitsee, valitseeko heitto
  skenaarion (RB s. 120) vai vain hyökkääjän (RB s. 121). Valintatilassa voittaja
  näkee valintalistan: Whole library -tilassa altaan, muuten Core 10:n.
- Tila tallentuu `DB.prep`:iin (`bmode`, `src`, `bookOnly`, `fits`, `sug`, `sug2`, `size` (0.12), `excl`,
  `lpick`, `rmode`). Etusivun suodattimet ovat `DB.lf`:ssä (`trust`, `book`, `pl`, `fits`, `size`, `sug`, `sug2`).

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

## Fanilisäosat (0.8, 21.10.2026)

Lähteet ja puretut tekstit: `../tulosteet/ref/bfg_julkaisut/Fanilisaosat/` (oma LUEMINUT). Sivunumerot
ovat PDF-sivuja; Book of Nemesiksessä myös painettu sivu ("p. 42 (printed 40)").

| Lisäosa | Skenaariot | Tiedosto |
|---|---|---|
| BFG Tournament Mission Pack (AdeptiConin tehtävät 2007–2016, vihkon koonnut Paolo Barbero) + BFG Advanced Scenarios (Paolo Barbero) | 18 tehtävää → 17 skenaariota | `fan-tournament.js` |
| Book of Nemesis (Cypra Probatii -portaali, päätoimittaja Marcin K. Gerkowicz, 2007) | 13 | `fan-nemesis.js` |
| Project Distant Darkness: Revival + Chapter I The Art of Command + Chapter II Distant Sun (horizon & Zhai Morenn) | 9 + 12 + 7 | `fan-pdd.js` |
| Starblade (horizon) | 9 | `fan-starblade.js` |

**Päällekkäisyydet (kerran kirjastossa, toinen lähde krediiteissä ja versiona):** Advanced Scenariosin
kuusi tehtävää ovat AdeptiCon-tehtävien uudistettuja versioita: The Road to Hell (A2), The Black Hole
(A6), An Unexpected Encounter (B3), Capture the Station (B5 Capture the Research Platform), Brace for
Impact (C2) ja Wrecks O’Plenty (C3). Jokaisessa on versiot *Advanced Scenarios* (oletus) ja *AdeptiCon
vuosi*. Lisäksi Manna from the Heaven (2007) ja Supply Run (2010) ovat sama tehtävä, joten ne ovat yksi
skenaario kahtena versiona. Turnauspaketissa on 18 tehtävää (A1–C6), joista sivut 9–11 (A6, B1, B2)
ovat pelkkinä kuvina; ne ja koko Advanced Scenarios luettiin tekstintunnistuksella
(`../tulosteet/ref/bfg_julkaisut/_tyokalut/winocr.ps1`, renderöinti `renderoi_ocr.py` samassa kansiossa),
ja tekstit tallennettiin lähdekansion `_teksti/`-tiedostoihin. Kuvien kartat ja taulukot luettiin
kuvasta.

**Pisteytys:** turnaustehtävien Result-välilehti laskee paketin battle pointit. Tournament Mission
Pack: VP-ero → 9/9, 11/7, 14/3 tai 17/0 (s. 2) sekä "You cowards!" -bonus (+1000/750/500/250, kun
vastustajalla ei ole laivoja vuoron 2–5 lopussa). Advanced Scenarios: VP-ero → 7/7, 9/5, 11/3 tai 13/1
ja kolme tavoitetta +4/+2/+2 BP (s. 5), sekä "Admirals, beware!" (+1000/800/600/400, vuorot 1–4).
AdeptiConin D6-sivutavoitteet arvotaan Set-upissa ja merkitään Resultissa (full/partial/failed); paketti
ei kerro niiden arvoa, joten tuomio tulee VP:istä ja sivutavoitteet näkyvät tuomion selitteessä.
2013–2016-tehtävien sivutavoitteiden pisteet (esim. 5/3/1) lasketaan selitteeseen.

**Sääntöluokka:** kaikki lisäosat ovat O (tai K, kun skenaariossa on vain asettelu ja VP: Tearing the
Flanks, Titan Clash, Ambush). E-luokkaa ei tarvittu, koska Fleets v0.36 sisältää lähes kaiken:
Starbladen Craftworld Eldar -alukset (Flame of Asuryan = Spirit of Arina ilman Aspect Warrior -miehistöä,
FL s. 329–332), Distant Darknessin Tau-alukset (Kor’or’vesh, FL s. 456–478), Tyranidien vanguard ja
evoluutiot, Chaos Space Hulk, puolustukset. Lisäosien omat lisät (PDD:n hahmot, Mantis, Marauder,
Tigershark, Ly’tanin Explorer, Gehennan puolustukset, Naravona, WR17:n Rogue Trader -alukset) annetaan
sivulla lähteen profiileina ja kirjan vaihtoehdolla → tagi **Fan rules optional**.

**Tagit:** Tournament (turnaus + Nemesiksen turnausskenaariot), Fixed forces (PDD, Starblade,
Kravertus), Played (Distant Sun: lähde nimeää pelitestaajat), Fan rules optional, Agree first (kun
oletus ratkaisee voiton, `v: 1`).

**Tulkinnat ja rajaukset** (kaikki näkyvät Source notes -laatikoissa ja Agree before you start
-kentissä; mitään ei valittu hiljaa):
- AdeptiConin 2014–2016 "Auxiliary Fleet" ja "First Blood" eivät ole paketissa selitetty → kentät
  oletuksineen. Supply Runin 5–6-sivutavoite on otsikoitu Disgraced Ship mutta tekstiltään Protect the
  Flag → teksti voittaa. Road to Hellin (2007) Protect the Planet viittaa planeettaan, jota ei ole →
  luetaan warp riftiksi (kenttä). Wrecks O’Plentyn ja Neutron Starin "11 markers 2–12" on Brace for
  Impactista jäänyt rivi.
- Retrieve the Salvage: merkkien arvojakauma, kuljetusten määrä ja rivien paikka puuttuvat → kentät
  (`v: 1`). Shepard Moon: renkaat, kuun paikka ja abordauksen vaikeus (oletus 2013-tehtävän 8 hitin
  alusta, TMP s. 14).
- Influence of Space Power: paketin kartta on luonnos; vyöhykkeet piirretään samankokoisina kolmioina
  (viivat alkavat 45 cm samasta kulmasta).
- Book of Nemesis: Shadow of the Cometin komeettasäännöt ovat SG-artikkelissa; sama komeetta on
  Fanatic Onlinen New Celestial Phenomena -artikkelissa, jota käytetään. Gehennan erikoispuolustusten
  profiilit (s. 26–27; OCR:ssä komentokeskuksen ja flak-alustan profiilit olivat sekaisin, korjattu
  kuvasta). Ambushin Game Length -kappale toistaa voittoehdot → pituus kenttänä. Gehennan puukampanjaa
  ei tehty omaksi skenaarioksi (rinnakkaisia taisteluita joukkueittain, ei sovi `tree`-työkaluun);
  vaikutukset kampanjaan ovat huomautuksissa.
- Project Distant Darkness: Light and Darknessin pakoreuna (teksti: pitkä reuna, kartta: lyhyt) ja Into
  Darknessin pelaajajako ja pituus → kentät. Supply and Demandin saattueen laatikko on mahdoton
  sellaisenaan → oma luenta kenttänä. Silent Strike mainitsee vuoron 6, vaikka peli on 8 vuoroa → 8.
  Abandon All Hopen miinat 10 vai 15 cm → kenttä (oletus 15, voittoehto). "Outer biosphere" ei ole
  kirjan vyöhyke → primary biosphere.
- Project Distant Darkness Chapter I, *The Art of Command* (lisätty 21.10. käyttäjän tuomasta zipistä,
  `_lahde/`): jokainen tehtävä on yksi kappale tarinan keskellä, ja lähde antaa yleensä vain toisen puolen
  tavoitteen ("Endtime") → kaikki muu on vastapuolen voitto, sanottuna huomautuksissa. Hahmojen arvot
  (s. 4) poikkeavat sekä Revivalista että Distant Sunista → oma `CHARS_AOC`; yhteiset re-rollit s. 5.
  Imperiumin Tau-alukset olivat alun perin Forge Worldin (IA3) → FL:n Kor’vattra/Kor’or’vesh; "Lar’shi"
  = Hero, "ion cannon variant" = Dal’yth/Vash’ya, "launch bay variant" = Vash’ya. Kentät: Mission Onen
  Castellanin paikka; Labyrinthin renkaan 25 cm planeetan reunasta (silloin Castellanit ovat keskellä
  "just outside"); Truth of Schemingin telakan uni, ohituksen uusinta ja lähtötapa (telakalle ei profiilia
  → FL:n orbital dock); No Way Outin epäonnistunut luovutus; Distant Darknessin dronien aseet ja panssari
  (ei annettu), "All Ahead Full on 2D6" = 2D6 cm 4D6:n sijaan; sukkuloiden liike ja ammunta; Part Onen
  Horizon’s Edge (profiililinkki puuttuu → battle barge) ja "standard Forgeworld" Emissary; Part Twon
  Empire-alue, pituus (Cruiser Clash, 8 vuoroa) ja itsetuhon heittohetki; For the Greater Goodin
  pelastus ja pelastus ilman kaikkia viittä (oletus tasapeli). Part One on tavallinen Fleet Engagement
  (variantit A–D ja muodostelmatyökalu kuten ytimessä; kartan värit ovat vyöhykkeet, eivät laivastot).
- Starblade: alukset kirjasta suoraan; "phantom lances" = Shadowhunterin shadow lance. Voiton
  muoto Gracessa, Tragedyssä ja finaalissa ("defeat Barha’desh") → kentät. Visionsin Eldar-vyöhyke
  luettu kulmavyöhykkeeksi pitkän reunan varrella.

**Kuvakierros:** `node "scenario library/testit/kuvakierros.js" <ulos> --vain=fan-`; uudet sivut
ja kaikki versiot, puhelin 390 ja työpöytä 1200. Kuvat käytiin läpi arkkeina (ks. Testaus).

## Maasto (0.9, 21.10.2026)

Battlezone Generator (`../terrain generator/`, terrain-generator.kuldare.com) on nyt jokaisen skenaarion
Set-upissa. Kartan **yläpuolella**, pöydän koon alla, on ohjausrivi **Celestial phenomena**: battlezone (valinta,
jos lähde jättää sen auki), Surprise Attackissa planeetan koko, **Generate terrain** ja sen jälkeen **Reroll** ja
**Clear**. Maasto piirtyy skenaarion omaan karttaan. Kartan **alla** ovat peruste, mahdollinen maininta,
yhteenveto, palat sirupainikkeina, valitun palan tai battlezonen säännöt ja koko heittoloki.

- **Miksi ohjausrivi on kartan yläpuolella:** ensimmäisessä versiossa koko paneeli oli kartan alla, ja 1366 × 768
  -näytöllä Generate-nappi jäi 199 skenaariossa näkymän alle. Nyt se näkyy kaikissa 204 skenaariossa sekä sivun
  alussa että tarttuvassa tilassa, myös 1280 × 620:ssa (mitattu). Tarttuvan kartan korkeus on siksi
  `100vh − yläpalkki − 300 px` (ennen 250 px), jotta ohjausrivi, kartta ja selite mahtuvat. Tiedot kartan alla
  vierittyvät karttapalstan sisällä (palstan `max-height` + `overflow-y: auto`), ja sen vieritys säilyy
  uudelleenpiirrossa.
- **Sirut lajeittain:** kun paloja on yli 10 (esim. nebula 28 pilveä), kentät, pilvet ja riftit näytetään yhtenä
  siruna lajia kohden ("Gas & dust clouds × 28"). Lajin napautus näyttää kaikki sen palat paikkoineen ja lajin
  säännöt ja korostaa palat kartalla. Planeetat ja kuut näkyvät aina yksitellen. Kartan palan napautus valitsee
  yksittäisen palan.

### Arkkitehtuuri: yksi totuuden lähde

- **Ydin on generaattorissa.** `../terrain generator/index.html`:n BZCORE-lohko sisältää nopat, battlezone-taulukot,
  geometrian, `generate()`:n ja sääntötekstit (RULES, EVENT_RULES). Se on ainoa lähde. `tee_maastoydin.py` kirjoittaa
  siitä `battlezone-core.js`:n, jossa teksti on tavulleen sama IIFE:n sisällä nimiavaruutena `BZ`. Kirjaston omat
  globaalit (`d6`, `R`, `ANY` …) eivät siksi törmää ytimen nimiin.
- **Miksi kopio eikä jaettu tiedosto:** sovellukset ovat erillisiä Workereita eri domaineilla, eikä kumpikaan hae mitään
  verkosta. Generaattori pysyy yhtenä tiedostona ja julkaistaan kuten ennen (`kokoa.py`:n tiedostolista ei muuttunut).
  Erkaantuminen estetään kolmella tavalla: `testit/maastotesti.js` kaatuu, `kokoa.py` ei kokoa eikä julkaise
  Scenario Librarya vanhalla kopiolla (`core_stale`), ja `python kokoa.py` (synkkaus) kirjoittaa kopion itse.
  Mallina oli lapun markkerimenettely.
- **Generaattorin omat kartat eivät muuttuneet.** Ytimen `generate()` sai valinnaisia asetuksia (ks. generaattorin
  LUEMINUT). Ilman niitä se heittää täsmälleen samat nopat: 7 560 siementä × asetusta vertailtiin ennen ja jälkeen,
  ja ero oli 0. Sormenjäljet ovat tiedostossa `testit/maasto_sormenjaljet.json`, ja maastotesti tarkistaa ne joka ajolla.
- **Kirjaston moottori** (`index.html`, lohko "celestial phenomena (0.9)"): `bzSpec` (taulukon rivi + versio),
  `bzChoices`/`bzZone` (battlezonen valinta), `bzFixed` (kartan esteet), `bzRun` (asetukset ytimelle ja arvonta),
  `bzSVG` (piirto), `bzBox` (paneeli), `bzRules` (säännöt), `bzPlay` ja `bzEvTool` (Play). `mapOf` liittää tuloksen
  karttaan, joten karttatesti, kuvakierros ja `#mapzone`:n päivitys (pöydän koko) näkevät saman maaston.
- **Tila:** `st.bz = { seed, z, p, sel, log, ev }`, eli siemen, battlezonen valinta, planeetan koko (Surprise Attack),
  valittu pala, onko loki auki ja vuorojen flare/burst-heitot. Kartta lasketaan aina uudelleen siemenestä, pöydästä,
  versiosta ja valinnoista, joten tallennettua karttaa ei ole eikä se voi vanhentua. Pöydän koon vaihto arpoo samalla
  siemenellä uudelle pöydälle. Reroll vaihtaa siemenen. "New game" tyhjentää maaston muun tilan mukana.

### Battlezone-taulukko (`scenarios/terrain-map.js`)

Jokaisella 204 skenaariolla on rivi. Kentät ja periaatteet:

- **`z` battlezone.** Joko lähteen nimeämä (`5`), lähteen vaihtoehdot (`[4, 3]`: valinta, ensimmäinen oletuksena),
  lähteen oma heitto (`{ die, rows }`, esim. The Bait 1–3 outer, 4–6 deep), skenaarion oma battlezone-työkalu
  (Craftworld Assault, The Siege: työkalun tulos, jos heitetty, muuten sama taulukko arvotaan), `"any"` (lähde jättää
  auki: oletus on kirjan D6, RB s. 105, tai valitaan mikä tahansa) tai `"none"` (lähde luettelee palat itse, eikä
  battlezonea ole).
- **`by` peruste**, joka näkyy paneelissa. `src` = lähde sanoo (sivu skenaarion lähteestä), `obv` = ilmeinen
  (esim. "As The Gauntlet"), `book` = lähde jättää auki, kirjan oletus, `ours` = oma luenta, ja `why` kertoo miksi.
- **Skenaarion omat piirteet säilyvät.** Kartan planeetat, asteroidikentät (`hatch`), asteroidi- ja kaasurenkaat,
  merkit (asemat, hulkit, tavoitteet) ja pienet ympyrät (r ≤ 10 cm: riftit, pesät, portit) ovat esteitä. Arvottu maasto
  ei mene niiden päälle (KEEP_CLEAR 2 cm kuten generaattorissa). `keep` lisää lähteen vaatimat tyhjät alueet:
  "none within 15 cm of the station", "45 cm from the belt", Naravonan 60 cm käytävä, Shepardin renkaat. Vyöhykkeet
  (deployment) eivät ole esteitä, koska kirja ei kiellä maastoa niissä.
- **Skenaarion planeetat:** `hosts` = "generate rings, moons etc. as normal" (Surprise Attack, Planetary Assault,
  Exterminatus, Treasure Fleet, Port Maw (kaksi kuuta), WR Planetary Defence). Paikka tulee kartalta ja halkaisija
  kaistalta, ja kuut ja renkaat arvotaan kuten generaattorissa. Koko tulee lähteestä, skenaarion Planet size
  -työkalusta tai Surprise Attackin pistevalinnasta (paneelin toinen valinta).
- **Luetellut palat (`pieces`)**, kun lähde antaa määrät eikä battlezone-generaattoria. Esimerkkejä: Eliarenath's Gift
  D3+3 ja D6+4 kenttää kaistoille, Hunter and the Prey D3 per neljännes, Navigate the Storm 16 riftiä 10 cm:n välein,
  turnaustehtävien listat, Starblade-finaali ilman aurinkoreunaa ja nebulat 40 cm:n ruuduittain. Koot tulevat kirjan
  nopista (s. 110–113), ellei lähde anna kokoa (`set`, esim. Planet Fall 10 cm, Rising Shadow 20 × 35 cm).
- **`warn`:** käyttäjän linjan mukaan nappi on kaikissa skenaarioissa. Kun arvottu maasto ei ole skenaarion
  ajatuksen mukainen, paneelissa on yhden rivin maininta. Tapaukset: lähde asettaa phenomenat vuorotellen tai yksi
  pelaaja asettaa ne (Method 1), lähde sanoo "nothing else" (kiinteä kartta), "no phenomena" (ensimmäinen peli,
  Gunnery Practice, Kotol 1–2), skenaariolla on oma ruutuheittotyökalunsa (Warp Space, Minor Engagement,
  Hunter-Prey, Dark Crescent Moon, Prophecy: "use one or the other") tai kampanja/ympäristö, jonka taistelut
  pelataan omina skenaarioinaan. Vuorottelevaa asettelua ei toteuteta (käyttäjä 21.10.).
- **Aurinkoreuna:** kartan `sun`-esine on kiinteä. Jos sitä ei ole, käytetään taulukon `sun`-kenttää (esim. "one long
  edge sunward" → pitkän reunan heitto), ja muuten kirjan D6 (RB s. 109). Arvottu reuna piirretään kartalle, ja selite
  sanoo "Sunward (rolled)".
- **Play-välilehti:** Flare Regionissa, Mercurial Zonessa ja Inner Biospheressa on muistutus "fighting sunward"
  (RB s. 114). Jos maasto tuotti solar flareja tai radiation bursteja (tai skenaario antaa ne, Tears in Motion), Toolsissa
  on nopat vuoron alkuun: kerran per vuoro ja flare kerran pelissä (RB s. 115).

### Tulkinnat ja rajaukset (maasto)

Nämä näkyvät paneelin perusteluissa, maininnoissa ja lokissa. Mitään ei ole valittu hiljaa:

- **Yksi planeetta "in all cases"** (RB s. 108): kun skenaario asettaa oman planeettansa, arvottu planeetta
  heitetään uudelleen. Tämä koskee myös Pelucidaria, joka asetetaan arvonnan jälkeen, ja Reconnaissance Runia
  ("at least one planet"). Lähteen luettelemat palat (turnauslistat) eivät ole arvontaa, joten niissä voi olla
  kaksi planeettaa.
- **Kartan planeetat ovat symboleja** (säde 7–15 cm). Esteenä käytetään todellista kokoa: nimiöstä (large/giant),
  taulukon `fixedSize`-kentästä tai oletuksena mediumin ylärajaa (12,5 cm).
- **Skenaarion planeetta pöydän reunalla:** jos arvottu halkaisija ei mahdu kartan paikalle (pieni pöytä), planeetta
  siirtyy pöydälle, ja loki kertoo, kuinka paljon.
- **Kartan aurinkoreuna on sopimus:** Hunter and the Prey heittää sen, mutta kartta näyttää vasemman, ja maasto noudattaa
  karttaa ("mirror the table").
- **Arvotun suuren planeetan renkaat** eivät estä mitään ja voivat mennä merkin tai pöydän reunan yli, kuten
  generaattorissa (renkaat saavat sulautua, RB s. 113).
- **Omat luennat** (`ours`, maininnalla): Damocles 3:n flare/mercurial-heitto 1–3/4–6, Hunter Cadren "outer biosphere"
  → primary (oletus) tai outer, Kotol 3–5 deep space kuten Kotol 1, Rear Guard Outer Reaches kuten Death and Glory.
- **Muut:** Minor Engagementin planeetta 1–5 small, 6 medium (kirjan sisävyöhykkeiden alitaulukko). Cerberus 1:n
  nebula on 35 cm:n kaistalla blokadireunalla (nauhat mahtuvat myös pystyyn). Into the Claw'n "small" asteroidikentät
  saavat kirjan D3×5 cm. Capture the Stationin (AdeptiCon) "a moon or a medium planet" on medium planet. Port Maw'n
  kuu suunnataan uudelleen, jos se ei mahdu (lähteessä se jää pois). Rising Shadow'n riftin paikka laatikossa arvotaan
  scatter-nopan sijaan. Above Belis Coronan "30 cm from the planet" mitataan piirretyn planeetan reunasta.
- **Tunnukset A1, C2 …** piirretään skenaarion tekstien alle (`.bzl`-kerros), joten skenaarion teksti pysyy luettavana.
  Karttatesti ohittaa ne, ja maastotesti tarkistaa maaston.

### Testit (0.9)

- `node testit/maastotesti.js`: ydin = generaattorin BZCORE, generaattorin 7 560 karttaa ennallaan, 204/204 riviä,
  15 180 karttaa (skenaario × versio × 5 pöytää × 12 siementä) ja 73 723 palaa: deterministinen, pöydällä, ei
  päällekkäin, ei kiinteiden piirteiden tai keep-alueiden päällä, battlezone taulukon mukainen, ignore-tuloksia ei ole,
  planeettaraja pitää ja tekstit (paneeli, säännöt jokaiselle palalle, Play, loki) ovat ehjiä. **0 virhettä.**
  Ensimmäinen ajo löysi yhden vian: suuri skenaarioplaneetta ulottui 91 × 91 -pöydän yli. Korjattu ytimessä
  (planeetta siirtyy pöydälle).
- Selaintesti puhtaalla tilalla (1024) ja jokainen skenaario maasto arvottuna, sääntöpaneeli ja loki auki, leveänä
  (1440) ja kapeana (375): kukin 15 184 näkymää, 204 otsikkoa, 0 virhettä. Karttatesti maasto arvottuna:
  3 120 karttaa, 14 964 tekstiä, 0 + 0. Sisältötesti 0 + 0. Sivuviiteauditointi 310 viitettä, 0 tarkistamatta; tiukka 0.
- Kuvakierros: `--maasto` (jokaisessa skenaariossa maasto arvottuna, battlezonen säännöt ja loki auki) ja ilman
  maastoa, kumpikin 1 850 sivua, 0 löydöstä (lopullisella asettelulla ajettu uudelleen: sama tulos).
- Leveät näytöt: Generate-nappi ja kartta selitteineen mahtuvat näkyviin kaikissa 204 skenaariossa 1366 × 768:ssa
  ja 1280 × 620:ssa, sekä sivun alussa että tarttuvassa tilassa.
- Skriptitagit `?v=0.9.1` (myös `battlezone-core.js`), alatunniste "version 0.9".
- Esittelykuvat ennen ja jälkeen (puhelin 390 ja PC 1440): `julkaisu/maasto-esittely/`.
- Käsin: kaksi yhdeksän kartan arkkia eri tyypeistä (planeetta keskellä, kaistat, neljännekset, riftimyrsky,
  käytävä, 45 cm:n esteet, renkaat, ei aurinkoreunaa, oma taulukko, nebula, kaksi kuuta, renkaallinen jättiläinen,
  laatikkoheitto, valmiit bursts ja nebulakaista). Lisäksi Play-välilehden flare-noppa vuoroittain: flare vuorolla 2,
  ja vuorolla 3 "went off on turn 2 … stop rolling". Battlezone Generator selaimessa ytimen siirron jälkeen:
  arpoo, piirtää, säännöt ja Start of turn toimivat, ja konsolissa ei virheitä.
- Komento: `node testit/kuvakierros.js <ulos> --maasto` kuvaa sivut maasto arvottuna.

## Tekniset mitat (0.9.3, 21.10.2026)

Käyttäjä: *"ainakin kaikessa saisi olla tekniseen piirrustuksen tyyliset mitat että tuon kuvan saa aina replikoitua
omalla pöydällä"*. Arvotusta maastosta: *"terrain sijoittelu mittoja ei tarvi. kerrot vain ruudukon mitat aina jossain.
ei se terrain ole niin millilleen"*. Pisteistä: *"turha olla tarkka piste vaan ennemmin deployment alue maalaus minne laittaa
se yksikkö"* (Escalating Engagement, 0.9.2).

### Järjestelmä (`index.html`, lohko "dimensions (0.9.3)" ennen `mapSVG`:tä)

- **Yleinen moottori, ei käsityötä 245 karttaan.** `dimFeatures` poimii kartan kiinteät kohteet: vyöhykkeet ja kentät
  (rect, hatch, poly-kärjet), planeetat, merkit, ympyrät ja renkaat (keskipiste + säde), kulmaympyrät (säde reunalla),
  akselinsuuntaiset jakoviivat ja vuoromerkit (tick). Uusi esine `{ z: "cm", x, y, l }` on keskipisteen risti
  symbolisen kokoiselle kohteelle (The Bait, Parol's Bait, Corribra 3, To Find the Light, Hunter Hunted, Corribra 4).
- **Ratkaisija** (`dimPlan`): pöydän reunat tunnetaan. Käsin tehty `dim`, jonka teksti on pelkkä luku, on rajoite (kun toinen
  pää tunnetaan, toinenkin tunnetaan), esim. Cruiser Clashin "90" ja "60". Puuttuvat arvot mitataan reunasta lyhin ensin,
  kunnes kaikki tunnetaan, joten mittoja tulee vähin määrä. Pelkkä luku pöydän reunasta alkaen ("45 cm") siirtyy
  reunamitaksi; ehdolliset ("up to 100 cm", "at least 60 cm", "30+") jäävät paikalleen sääntömerkinnöiksi.
- **Piirto** (`dimSVG`): mitat ovat pöydän ulkopuolella, kuten teknisessä piirustuksessa: apuviiva kohteesta reunalle
  (pöydän sisällä ohut katkoviiva), nuolellinen mittaviiva ja luku keskellä. x-mitat lähempään pitkään reunaan, y-mitat
  sivuille; tasatilanteessa reuna, jolla on vähemmän reunatekstejä. Vasen puolisko mitataan vasemmasta reunasta ja oikea
  oikeasta. Puoliskolla enintään kaksi arvoa mitataan kumpikin reunasta (pinottuina, säännön luku säilyy: konvoin "45"
  ei hajoa muotoon 30 + 15); kolme tai useampi (ruudukot, vuoromerkit, Gunneryn 10 vyöhykettä) ketjuna yhdellä rivillä.
  Reunarivi on reunaviivan ja -tekstin ulkopuolella, ja `viewBox` kasvaa vain sillä puolella, jolla mittoja on.
  Luvut ilman yksikköä (kaikki senttejä), fontti 0,8 × kartan fontti, viivan ja luvun väri `--chart-label` (tummassa
  teemassa `--chart-frame` jäi liian himmeäksi). Lyhyellä välillä nuolet ulkopuolelta ja luku välin ohi.
- **Säde:** viiva keskeltä kehälle ja luku kehän ulkopuolelle kohtaan, jossa se ei osu teksteihin. Kun ympyrän keskellä on
  planeetta, viiva alkaa planeetan reunasta ja luku on etäisyys reunasta ("30"), koska painovoimakaivo ja muut etäisyydet
  mitataan planeetan reunasta (RB s. 113) ja planeettasymbolin koko on vain kuva. Muuten "R30". Sädemittaa ei piirretä, jos
  kartan teksti jo kertoo luvun ("within 30 cm"), eikä kaasu- ja asteroidinauhoille (`gas`/`ast`: leveys ja etäisyys ovat
  askeleissa).
- **Selite** (`mapSize`): "180 × 120 cm · grid 30 cm" (200 cm:stä alkaen 50 cm, `mapGrid`). Tämä on arvotun maaston ainoa
  mitta, kuten käyttäjä pyysi.
- **Käsin tehdyt mitat** säilyivät rajoitteina ja saivat saman ohuen tyylin ("60 cm" → "60").

### Liput ja periaatteet

- `free: 1` = kohteen paikka ei ole kiinteä (lähde: "anywhere", "up to 150 cm", "as on the map, agree the spots",
  "near your short edge", "in one quarter", "placed by the tool"), joten mittoja ei tule. Kohde jää kuvaksi, ja teksti tai
  alue kertoo säännön. `free: "x"` / `"y"` = vapaa vain siinä suunnassa (esim. konvoin tulokaistan 8 cm:n leveys on symboli,
  korkeus 45 cm reunoista on sääntö). `nr: 1` = ei sädemittaa (koko on symboli tai kerrotaan sanoin).
- **Mittaa vain, mitä lähde kiinnittää.** Kaikki 245 karttaa käytiin läpi arkkeina (20 karttaa kerrallaan) skenaarion
  askelia ja karttahuomautusta vasten. Säännön paikat ("in the centre", "60 cm from…", "150 cm from the Tau edge") ovat
  mitattuja kohteita; vapaat merkittiin `free`-lipulla.
- **Lehtien luonnoskartat:** paikat pyöristettiin 180 × 120 -pöydällä tasalukuihin, jos lähde antaa vain kuvan (Callavell,
  Who Goes There?, Kotol 3). Lähteen tarkat luvut eivät muuttuneet.
- **Planeetan reunasta annetut etäisyydet** (Fannon's Patrol "5 cm from both edges", Nightmares "the planet's edge is 30 cm
  from…", Planetary Disease "10 cm from the defender's zone") mitataan planeetan reunaan käsin tehdyllä mitalla, ja
  planeetta itse on `free`, koska sen keskipisteen paikka riippuisi symbolin koosta.

### Pisteistä alueiksi ja muut sisältökorjaukset (tarkistus 21.10.)

- **Solar Collectors:** kolmen pisteen tilalle 10 cm:n katkoviivakaista ja teksti "up to 10 cm onto the table, as far
  apart as you like".
- **Down the 'Slot, Wrecking Yard:** "comms ship: anywhere", merkki vapaa.
- **Alien Intervention:** 30 cm:n ympyrä keskellä ("planet + hulk: within 30 cm of the centre"), planeetta ja hulkki kuvina.
- **Belis Corona 2 ja 3:** reservimerkit pitkän reunan 15 cm:n kaistaleelle lyhyen reunan päähän, molemmille pitkille reunoille.
- **Truth of Scheming:** "dockyard + orbitals: anywhere in the 15 cm gravity well", merkit vapaita.
- **Pirate Bases:** "the bases go anywhere, 60 cm apart", tukikohdat ja niiden ympyrät vapaita, 60 cm:n mitta jää.
- **Lievemmät ylärajat:** Damocles 3 "up to 60 cm", Belis Corona 1 telakka "up to 30 cm" vyöstä (vyön leveys heitetään:
  mitataan keskiviiva), Cold Passage "up to 50 cm" ja taistelulaivat "within 5 cm of a long edge".
- **Muut samanlaiset** (sanat anywhere/within/up to/near/as on the map): Planetary Assault, Exterminatus, Deadline,
  Planet Killer Defence, Belis 2–3, Damocles 2 ja 4, Rebellion 1 ja Craftworld Assault (planeetta "no more than 150 cm"),
  Siege of Fularis ("no more than 100 cm"), Pelucidar ("anywhere"), Numitor (tulopisteet "agree the exact spots"),
  Hunter and the Prey (planeetat "at least 30 cm", mitta "30+"), Space Hulk!, Kotol 5, Retrieval, Depth of Spacen
  tarinaversiot, Diasporex Diversionsin räjähdykset, Choir, Mobeel, Lachlon (kuut ja asema työkalun heitosta), Limante,
  Falling Down, Kravertus, Fall of the Great Armada, Comet, Labyrinth, Ly'tan's Flight ja muut kuvailevat paikat.
- **Korjatut virheet, jotka mitat paljastivat:** Surprise Attackin planeetta oli 2 cm keskeltä sivussa (kosmeettinen siirto),
  Solblade 4:n Solblade oli H × 0,2:ssa vaikka lähde sanoo "in the centre of that edge", Rebellion 2:n planeetta W × 0,62:ssa
  vaikka "as in Surprise Attack" = keskellä, Event Horizonin toinen rengas 2 cm liian kaukana (25 cm + 3,5), Rath's Last
  Standin painovoimakaivo oli 31 cm keskeltä eli 21 cm planeetan reunasta (nyt 30 cm reunasta, kuten karttahuomautus), Cerberus 4:n Alurmenin kaivo 6 → 10 cm, The Siegen puolustusalue
  oli kutistettu 45 cm:n ympyräksi (nyt 60 cm:n ympyrä ja 15 cm:n rajaviivat). Mittatesti löysi myös 11 käsin tehtyä mittaa,
  joiden luku ei vastannut piirrettyä pituutta muilla kuin 180 × 120 -pöydillä: Chance Encounterin ja Titan Clashin "60 cm"
  (vyöhykkeiden väliin jäävä jäännös, poistettu), Shadow of the Cometin "45 cm" (mitattiin kuun reunasta), Kravertuksen
  "60 cm" (Arbitrum siirtyi pienellä pöydällä) ja Who Goes There?:n "60 cm".

### Tietoiset rajaukset (älä "korjaa")

- **Arvottu maasto (0.9) ei saa sijaintimittoja**, vain ruudukon koon selitteessä (käyttäjän päätös 21.10.).
- **Vapaat kohteet eivät saa mittoja,** vaikka ne on piirretty jonnekin: mitta väittäisi paikan kiinteäksi.
- **Symboliset koot** (planeettojen säde, merkkien etäisyys reunasta "on the edge", laatikoiden leveys tulokaistoilla) eivät
  saa mittoja.
- **Ketju vs. reunasta:** kolmesta arvosta alkaen ketju, jotta reunan ulkopuolelle riittää yksi rivi. Ketjun ensimmäinen
  luku on reunasta, seuraavat edellisestä.
- **Diagonaaliviivat** (Cerberus 4:n lähestymislinjat) eivät ole mitattavia kohteita.

### Testit (0.9.3)

- `node testit/mittatesti.js` (Node): jokainen kartta × versio × jokainen alasvedon pöytä, jolle skenaario mahtuu × leveä ja
  kapea fontti × maasto pois/päällä. Testi poimii kohteet itse kartan esineistä (ei moottorin funktiolla) ja tarkistaa
  piirretyistä mitoista (`m.dims`), että jokainen kiinteän kohteen x ja y ketjuuntuu pöydän reunaan (UNDIM), että säde on
  mitattu tai sanottu (RADIUS) ja että jokainen luku vastaa piirrettyä pituutta (LABEL). `--lista` näyttää vapaaksi merkityt.
  Tulos: 4 680 karttaa, 0 virhettä. Ensimmäinen ajo löysi 11 LABEL-virhettä (ks. yllä).
- Karttatesti (mitat mukana tekstien päällekkäisyydessä): 3 120 karttaa, 26 740 tekstiä, 0 + 0; lisäksi numerokentät
  maksimissaan 0 + 0 ja maasto arvottuna 0 + 0. Ensimmäinen ajo löysi 3 + 6 (säteen luku nimen päällä, kolmirivinen teksti
  reunassa 244 × 122 -pöydällä, planeettojen nimet päällekkäin 152 × 112:ssa); korjattu.
- Selaintesti leveänä (1440) ja kapeana (375): kumpikin 15 184 näkymää, 204 otsikkoa, 0 virhettä. Sisältötesti 0 + 0.
  Maastotesti 0 virhettä (15 180 karttaa, 73 733 palaa). Kuvakierros 1 850 sivua, 0 löydöstä.
- Käsin: kaikki 245 karttaa arkkeina kahdesti (ennen ja jälkeen korjausten, PC-fontilla), puhelinfontilla otos, sekä
  sovellus Browser-paneelissa puhelimella (375, tumma teema) ja PC:llä (1440).
- Ennen/jälkeen-kuvat: `julkaisu/mitat-esittely/` (puhelin ja PC). Arkki- ja vertailutyökalut olivat scratchpadissa
  (`arkki.js`, `vertailu.js`): ne piirtävät kartat `testit/_lataa.js`:n kautta HTML:ksi ja headless-Chromella kuviksi.

## Skenaarion koko (0.12, 21.10.2026)

Käyttäjä: *"voisi myös lisätä yhdeksi suodattimeksi skenaarion koon. esim kolme. about 750 1250 ja 1500 tai isommat"*.
Pisteet ovat skenaarioissa vapaata tekstiä (41 "Fixed forces", 14 "Equal", 11 "Equal: 1250 or 1500 pts", loput
yksilöllisiä), joten luokitus on tehty käsin, skenaario kerrallaan, `scenarios/sizes.js`:ään.

### Luokat

Luokka tulee **isomman puolen pisteistä** eli siitä, kuinka paljon pelaajan pitää tuoda:
- **Small** (`S`): enintään 1000 (750-pelit, partiot, escort-kahakat)
- **Medium** (`M`): 1001–1499 (1250)
- **Large** (`L`): 1500 tai enemmän

`SIZE[id] = { s, pts, why }`: `s` on taulukko (`["S"]`, `["M", "L"]` …) tai `"any"`. `pts` ja `why` ovat englanniksi kuten
muiden taulukoiden perustelut, mutta sivulla niitä ei (vielä) näytetä; kortin alarivillä näkyy jo glance-kentän pisteteksti.

### Luokittelusäännöt

- **Sovittava koko = any.** "Equal", "Agreed", "Any" ja suhteet ("Defender +50%", "Cat 4 : mouse 1") näkyvät kaikissa
  luokissa kuten "any fleets" laivastosuodattimessa. Puuttuva rivi tulkitaan samoin (`sizeOk`), mutta testi vaatii rivin.
- **Väli tai versiot osuvat useaan luokkaan.** "1250 or 1500" → Medium + Large. Versiot yhdistetään: Battle over Kotol
  (750 → 1500) on S + M + L. Suodatin ei katso valittua versiota.
- **Budjetti "up to X" = X.** Esim. turnausten Advanced-versio "up to 1250" on Medium.
- **Lähteen suositus ratkaisee, laskuesimerkki ei.** The Siege: *"We have found 1,500 points serves very well"* (BFG Magazine 9)
  → Large. Nest Raid, Planetary Disease ja The Corpse: "500–1250 recommended" → Small + Medium. Who Goes There "about 1000"
  → Small. Sen sijaan Reconnaissance Runin "660 against 2000", Cat and Mousen "1000 : 250" ja Convoy Battlen "2000 → 30"
  ovat esimerkkejä → any.
- **Budjetin päälle annetut liikkuvat alukset lasketaan listahintaan.** Lachlon II: 1000 + ilmainen Emperor-luokan Legatus
  Stygies (365) = 1365 → Medium. Siege of Fularis: kaksi Blackstonea. Line of Gehenna: Chaos space hulk (650).
- **Eivät nosta luokkaa:** D6×10-puolustukset, kiinteät tavoitteet (Naravonan battlestation, Damocles 4:n Tau-asema),
  kuljetusalukset (Navigate the Storm: 1000 + 10 kuljetusta → Small) ja saatettava hulkki (Space Hulk!).
- **Kampanjat, joiden taistelut pelataan muina skenaarioina, ovat any:** Phillipa II (400–800 → 2000), Pirates (rosterit
  2000/1500), Stygies-kampanjapuu (rosterit 1500–2000), Solitaire Campaign ja Hive Ship Pirate Base. Tietoinen linja: Pirates
  ja Stygies vaativat ison kokoelman, vaikka yksittäinen taistelu voi olla pieni. Testi vaatii `type: "Campaign"` → any.
- **Satunnaiset hyökkääjät** arvioidaan taulukon keskiarvolla: Merchantmen's Folly D3+5 heittoa ≈ 500–950 → Small,
  Space Hulk! ≈ 1 000 ja saattue 1200 → Medium, Evacuation D3+3 heittoa ≈ 550 → Small.

### Kiinteät joukot: laskutapa

- Kaikki, millä on listahinta, eli alukset ja puolustukset (asemat, alustat), lasketaan listahintaan. Kuljetuksia ja
  hyökkäysalusmerkkejä ei lasketa, paitsi tyranidien ostettavat merkit.
- Hinnat ovat Fleets v0.36:sta: `../fleet builder/bfg_data.json` (generoitu Fleets WiP v0.36:sta ja RB v1.10:stä). Tyranidit on
  laskettu aseineen `saannot_txt/fleets.txt`:n taulukosta (hive ship 200, cruiser 80, Kraken 25, vanguard 20, escort drone 10 +
  aseet). Skenaarion oma profiili: Invincible 290 (Cold Passage). Spirit of Arina = Flame of Asuryan 320 kuten sovelluksen
  huomautuksissa.
- **Komentajat, merkit ja päivitykset eivät ole summassa.** Jos ne veisivät isomman puolen rajan yli tai summa on rajan
  tuntumassa, skenaario saa molemmat luokat ja `why` kertoo syyn.

### Rajatapaukset (kirjattu, älä "korjaa" kysymättä)

| Skenaario | Luokka | Peruste |
|---|---|---|
| Chance Encounter | S + M | Planet Killer -laivasto 950 + Warmaster (Ld 9, 3 re-rollia) |
| Death and Glory 2: Rear Guard | S + M | 870–1040 luokkavalinnoista riippuen |
| Distant Darkness | S + M | viisi Protectoria 925 + viisi nimettyä komentajaa |
| Ever Dream | S + M | Abandon All Hopen rippeet ≈ 970 aseineen, evoluutiot ja komentajat päälle |
| Tears in Motion | S + M | neljä grand cruiseria 930 + merkit ja daemonship |
| Starblade | S + M | 830 + Warmaster (Ld 10) ja Nurglen merkit |
| The Art of Command, Part One | M + L | Tau 1385, Novamarines 1460 Horizon's Edgen kanssa (battle barge), + Master of the Fleet |
| Grace | M + L | molemmat 1450 listahinnoin, amiraalit päälle |
| Hunt for the Eldar 2 | M + L | osan 1 (1500 vs 1000) eloonjääneet + Haven 500 |
| Eliarenath's Gift | M | partio 1180, väijytys 1250; Eclipse (250) on kolmas osapuoli. Jos väijyjä pelaa sen, hän tuo 1500 |
| Carrier Clash (Antioc 4) | S + M + L | "Equal, 1000 or more": tiukka raja, 1000 on Small |
| Battle over Kotol, Ambush (Book of Nemesis) | S + M + L | viisi taistelua 750 → 1500; puolustaja 1000–1500 |
| Cadian Line, Minor Engagement | any | sovittu, enintään 1500 |
| The Battle of Numitor, The Fate of the Abhorrence | any | lähde sallii sovitun koon; historialliset laivastot ≈ 1850 ja ≈ 1450 |
| In the Depth of Space | S + L | versiot 750, Flood 1500, pikaluonnos 500 tai 1500; ei Medium-versiota |
| Solblade 1, 2, 4, 5, 6 | L | Solblade-pelaaja tuo 250, tyranidit 1500–2000: isomman puolen sääntö |
| Norduun | M | Chaos-saattueen metsästäjät 1020–1090 + Warmaster |

### Jakauma (21.10.2026, `testit/kokotesti.js`)

| Luokka(t) | Skenaarioita |
|---|---|
| S | 59 |
| M | 16 |
| L | 35 |
| S + M | 10 |
| M + L | 22 (mm. kaikki 17 turnausskenaariota) |
| S + L | 1 |
| S + M + L | 3 |
| any | 58 |

Suodattimen tulos: **Small 131** (73 omaa + 58 any), **Medium 109** (51 + 58), **Large 119** (61 + 58).
Orks vs Imperial Navy (etusivu 72) + Small 49, + Medium 54, + Large 50.

### Käyttöliittymä

- Etusivun Filters: oma rivi **Size** Players-rivin alla, napit kuten Players (`chip("lfs", …)`, `DB.lf.size`). Lasketaan
  Filters-napin lukuun, ja Clear filters tyhjentää sen.
- Before the battle → Whole library: kolme nappia Book rules only / Fits my table -rivin alla (`psize`, `DB.prep.size`).
- Brief ehdotti alasvetovalikkoa ("Any size / Small / Medium / Large"). Tein napit, koska valinta on silloin yksi napautus
  eikä kaksi (UI-linja), ja Players-suodatin toimii jo samoin. "Any size" on se, ettei mitään nappia ole valittu.
- Samalla korjattu vanha vika (käyttäjän luvalla): puhelimella etusivun "Suggested for" -valikko valui Filters-paneelin
  reunan yli, koska `.flrow select` -säännöstä puuttui `max-width: 100%` (arvonnan `.tblctl select`issä se oli).

### Testit (0.12)

- `node "scenario library/testit/kokotesti.js"`: 204 riviä, 92 johdonmukaisuustarkistusta, suodattimen luvut etusivulla ja
  arvonnassa samat, 0 virhettä.
- Selaintesti (`?v=0.12.0`) leveänä (1440) ja kapeana (375): kumpikin 15 184 näkymää, 204 otsikkoa, 0 virhettä. Lisäksi
  etusivu ja arvonta jokaisella kokovalinnalla: luvut 204 / 131 / 109 / 119 molemmissa, ei vaakavieritystä kapealla.
- Sisältötesti 0 + 0 (15 180 tulosfunktiokutsua, 314 sovittavaa kohtaa). Mittatesti 0 virhettä. Kaikki `scenarios/*.js`
  `node --check`.
- Kuvakierros: 1 854 sivua, 0 löydöstä. `kuvakierros.js` kuvaa nyt myös sivut `home-filters-size` (Large valittuna) ja
  `prep-lib-size` (Small valittuna); muilla sivuilla kokovalinta tyhjennetään.
- Esittelykuvat: `julkaisu/koko-esittely/` (PC 1440 ja puhelin 390, tumma teema).
- **Ansa (21.10.):** headless-Chrome Pythonin `http.server`ia (esikatselu 8785) vasten latasi osan skenaariotiedostoista
  vajaana (All 77 / 204), vaikka load-tapahtuma tuli. Kuvaa omalla Node-palvelimella kuten `kuvakierros.js` ja tarkista
  `SC.length` ennen kuvaa.

## Julkaisu (20.10.2026)

- Osoite **https://scenario-library.kuldare.com**, Cloudflare Worker
  **`still-resonance-55fc`**. Nimi on dashboardin automaattinen: käyttäjä latasi
  ensimmäisen version (pelkkä `index.html`) käsin 20.10. klo 14.02 ja liitti
  domainin. Käyttäjä vahvisti, että tämä on Scenario Library.
- `julkaisu/kokoa.py`: tunnus `scenarios`, tiedostot `index.html`, kuvakkeet, `battlezone-core.js` (0.9) ja
  `scenarios/*.js` (glob). Koonti kieltäytyy, jos `battlezone-core.js` ei vastaa generaattorin BZCORE-lohkoa. Lappu (`tools_badge.html`) linkittää tänne kaikista
  BFG Toolsin sovelluksista, ja builderin `build.py` hyväksyy isännän.
- Julkaisu: `cd ../julkaisu && python kokoa.py --kokoa --julkaise scenarios`.
- 0.7 julkaistu 20.10. myöhään (versio dfb678aa): live-sivulla 137 skenaariota ja kaikki kategoriat tarkistettu selaimella.
- Dian teon jälkeen julkaistu uudelleen (versio 495563da): Port Maw'n kartan teksti ympyrän sisällä ja Numitorin Desecrator-profiili (BFG Magazine 9).
- Leveät näytöt julkaistu 20.10. klo 20 (versio f2952393, 0.7.53) käyttäjän hyväksynnällä ("tarkasta ja julkaise"): live-sivu tarkistettu selaimella 1366 × 768:ssa, ja index.html on tavu tavulta sama kuin paikallinen. Samalla GitHub-peili (commit 96d6dd4) ja uusi lappu, jossa on GitHub-rivi.
- Warp Riftin sanamuotokorjaus julkaistu 20.10. illalla (versio d37cd2e4, 0.7.55, GitHub 47f1d40) käyttäjän hyväksynnällä ("julkaiset sit samalla kun on oikeat sanamuodot").
- Warp Riftin laatuluokitus julkaistu 21.10. (versio 0341316c, 0.7.56, GitHub 0c13f8b). Live-sivu tarkistettu: 58/58 luokiteltu, Rules writer -tagi näkyy.
- Kirjoituskentät kaikkiin skenaarioihin, Warp Rift yhdeksi kategoriaksi ja tutkimuksen suositukset julkaistu 21.10. (versio a07a4db8, 0.7.68, GitHub Kuldara/bfg-tools 9eaed6b) käyttäjän luvalla ("julkaise"). Samalla lapun GitHub-linkki Kuldara-käyttäjänimeen.
- 0.8.5 julkaistu 21.10. klo 12.40 (Worker-versio 383f6eca, GitHub Kuldara/bfg-tools 6cca6f4) käyttäjän
  pyynnöstä ("testataan vielä uusi kokonaisuus ja uudet skenaariot ja julkaisu"): 204 skenaariota, eli
  Chapter I:n 12 skenaariota ja pistokokeiden 26 korjausta. Ennen julkaisua koko kokonaisuus testattiin
  uudelleen, eikä yksikään tiedosto muuttunut testien aikana (md5-tilannekuva):
  - selaintesti leveänä ja kapeana: 15 184 näkymää, 0 virhettä
  - karttatesti 3 120 karttaa, 0 + 0, ja sisältötesti 0 + 0
  - kuvakierros: 1 850 sivua, 0 löydöstä
  - sivuaudit: 310 viitettä, 0 tarkistamatta
  Käsin luettiin lähdettä vasten Mission One, Five ja Ten, ja For the Greater Goodin Result pelattiin
  läpi sovitulla tasapelillä. Live-sivu tarkistettiin: 204 skenaariota ja `fan-pdd.js?v=0.8.5`.
- 0.9.1 julkaistu 21.10. klo 14 käyttäjän luvalla ("julkaise") yhdessä Battlezone Generatorin kanssa (`--julkaise
  scenarios terrain`). Worker-versiot: Scenario Library 6ad5d1bb, Battlezone Generator 65b9e358. GitHub
  Kuldara/bfg-tools f6e2975. Mukana ovat maasto skenaarion kartalle, Event Horizon -nimi ja Rules writer
  -tagi PDD:lle ja Starbladelle. Tarkistukset ennen julkaisua:
  - md5-tilannekuva: mikään ei muuttunut testien aikana
  - maastotesti 0 virhettä (ydin = BZCORE, generaattorin 7 560 karttaa ennallaan, 15 180 skenaariokarttaa)
  - selaintesti leveänä: 15 184 näkymää, 0 virhettä
  Live-sivulla nimi on Event Horizon, Rules writer -tagi on 50 skenaariolla, ja Generate terrain →
  Reroll / Clear toimii (Deep Space, asteroidikentät). Battlezone Generator latautuu, ja index.html on
  molemmissa tavu tavulta sama kuin paikallinen.
- 0.9.8 julkaistu 21.10. klo 16 käyttäjän luvalla ("julkaise"). Worker-versio 301c6b56, GitHub Kuldara/bfg-tools
  1614a98. Mukana ovat tekniset mitat kaikkiin karttoihin ja epäselvät pisteet alueiksi. Tarkistukset ennen
  julkaisua:
  - md5-tilannekuva: mikään ei muuttunut testien aikana
  - kaikki skenaariotiedostot `node --check`, inline-skriptit ok
  - mittatesti 0 virhettä (4 680 karttaa, 20 115 mittaa, 27 384 kohdetta)
  - maastotesti 0 virhettä
  Live tarkistettu puhelimella: Solar Collectorsin 10 cm:n kaista, mitat 20 / 10 / 20 cm ja "grid 30 cm"
  selitteessä; `?v=0.9.8`; index.html on tavu tavulta sama kuin paikallinen.
- 0.12 julkaistu 21.10. illalla käyttäjän luvalla ("joo"). Worker-versio ec842632, GitHub Kuldara/bfg-tools 9f947de.
  Mukana ovat kokosuodatin (`scenarios/sizes.js`) ja Filters-valikon reunakorjaus. Tarkistukset ennen julkaisua:
  - md5-tilannekuva: mikään ei muuttunut julkaisun aikana
  - kokotesti 0, selaintesti leveänä ja kapeana 15 184 näkymää 0 virhettä, sisältötesti 0 + 0, mittatesti 0
  - kuvakierros 1 854 sivua 0 löydöstä, korjauksen jälkeen yleissivut 26 sivua 0 löydöstä
  Live: `sizes.js` on tavulleen sama kuin paikallinen, "version 0.12", 204 skenaariota, Small/Medium/Large 131/109/119.
- Lähdeteksteistä ja tekijänoikeudesta ks. "Sisältö ja tekijänoikeus": horizonille
  (Warp Riftin toimittaja) kannattaa yhä kertoa sovelluksesta.

## Seuraavat askeleet

- Victory points -laskuri (destroyed / crippled / disengaged, RB s. 123).
- PWA, jotta sovellusta voi käyttää pöydässä ilman verkkoa (kuten Fleet Play).
- Kortti- tai tulostusnäkymä (yksi A4 per skenaario).
