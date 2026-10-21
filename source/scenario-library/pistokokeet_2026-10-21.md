# Scenario Library – käsin tehty pistokoetarkastus 21.10.2026

Käyttäjän pyyntö: *"luovia manual tarkastuksia pistokoe tyylisesti, mahdollisimman laajasti
scenario tietokantaan"*. Koneelliset testit olivat jo vihreitä, joten tällä kierroksella haettiin
virheitä, joita testit eivät näe. Skenaariot luettiin lähdettä vasten, pelattiin selaimessa läpi ja
niiden tulosfunktioita kokeiltiin reunatapauksilla.

Tarkastuksen alussa kirjastossa oli 192 skenaariota (0.8). Rinnakkainen istunto lisäsi kesken
tarkastuksen Project Distant Darknessin Chapter I:n (12 skenaariota, `?v=0.8.4`). Ne eivät kuulu
otantaan, mutta kaikki loppuun ajetut testit kattavat 204 skenaariota.

## 1. Otanta

- **Siemen 20261021** (Python `random.Random`), skripti `otanta.py` (scratchpad). Otanta on
  ositettu kategorioittain, ja kiintiöt on mitoitettu ositteiden koon mukaan.

| Osite | Koko | Kiintiö | Valitut |
|---|---|---|---|
| Core 10 | 10 | 4 | the-bait, planetary-assault, blockade-run, escalating-engagement |
| Books (RB-kampanjat + FL) | 17 | 5 | fl-space-hulk, fl-merchantmens-folly, parols-bait, gauntlet, bc-daemon-blockade |
| Classic GW | 52 | 10 (+1) | cl-inv-breakthrough, cl-damocles-4, cl-treasure-fleet, cl-abhorrence, cl-cerberus-4, cl-ahriman, cl-antioc-3, cl-planet-fall, cl-lachlon, cl-inv-snake, (+ cl-torpedo-run) |
| Rules writers (WR `committee`) | 13 | 4 | wr-solblade-4, assassination, diasporex-gambit, wr-solblade-1 |
| Community (WR muut) | 45 | 9 (+2) | wr-solar-collectors, wr-commerce-raiders, wr-convoy-battle, wr-mobeel-narrows, wr-limante-contact, wr-falling-down, wr-eldar-hunt-2, wr-sw-rebellion-2, wr-darkening-raid, (+ wr-looting-the-hulk, wr-srinagar) |
| Fan supplements | 55 | 10 (+1) | fan-t-derelict-base, fan-n-flanks, fan-n-kravertus, fan-t-neutron, fan-t-unexpected, fan-t-retrieve-salvage, fan-p-claw, fan-n-naravona, fan-p-light-dark, fan-n-ambush, (+ fan-s-tears) |

- **Tiedostokattavuus:** jokaisesta skenaariotiedostosta (index.html + 20 tiedostoa) vähintään yksi.
  Neljä tiedostoa jäi ensin ilman osumaa, joten samasta siemenvirrasta arvottiin niihin lisäykset:
  cl-early → cl-torpedo-run, fan-starblade → fan-s-tears, l4c → wr-looting-the-hulk ja
  l4d → wr-srinagar. Syvätarkastukseen tuli siis **46 skenaariota**.
- **Kevyt silmäys kaikille 192:lle:** kaikkien skenaarioiden näkyvä teksti dumpattiin
  (Set-up, Play ja Result jokaisessa versiossa sekä vuororadan muistutukset vuoroittain;
  `tekstidumppi.js`, headless Chrome). Dumpista ajettiin kieli- ja johdonmukaisuusheuristiikat (luku 2).

## 2. Menetelmä tarkastuskulmittain

1. **Lähde vs. sovellus (46).** Jokaisen otetun skenaarion lähdesivu luettiin itse:
   - RB/FL tekstidumpeista
   - Classic GW `_teksti/`-OCR:stä
   - Warp Rift PDF:istä PyMuPDF:llä
   - fanilisäosat `Fanilisaosat/_teksti/`-kansiosta

   Kun OCR hukkasi lukuja (Antioc 3 "within cm", Cerberus 4 "maximum size 'i vessels",
   Damocles 4 -profiilitaulukko), sivu renderöitiin kuvaksi ja luettiin siitä. Verrattavat asiat:
   pisteet, asettelumatkat, vuoromäärä, aloittaja, voittoehdot, erikoissäännöt, profiilit ja sivuviitteet.
2. **Pelaaminen selaimessa.** Testattiin Sub-plotien "Roll both" kummallekin, laskurit ja Result-tuomio
   sub-plot-matriiseineen (Cruiser Clash), näppäimet 1–4 ja ← → (Escalating Engagement) sekä versiot
   (Gauntlet Running battle, Commerce Raiders, Unexpected Encounter).

   Tuomio testattiin oraakkelitesteillä 60 tapauksella 22 skenaariosta. Mukana olivat reunat 0, 3, 7, 10
   ja 11 (Solblade 4), prosenttirajat 29/30/60/90 (Convoy Battle), tasapelit, kaikki tuhottu, Kravertuksen
   pistesummat ja Planetary Assaultin pyöristykset. Lisäksi tarkistettiin, että verbi taipuu oikein.
3. **Kartta vs. teksti vs. lähteen kartta.** Lähteen karttaa verrattiin sovelluksen karttaan kuvana
   (Blockade Run RB s. 133, Treasure Fleetin reunanumerot BM4 s. 7, Cerberus 4:n mitat BM14 s. 30).
   Muuten verrattiin kartan tekstejä askelten teksteihin.
4. **Puolet.** Askelten, muistutusten ja työkalujen puolet luettiin dumpista. Sisältötestin PUOLI ja
   VÄRI kattavat tämän koneellisesti.
5. **Kieli.** Koko dumpista ajettiin:
   - harvinaiset sanat, joita ei ole RB/FL:ssä eikä lähdeteksteissä
   - tuplasanat ja välimerkit
   - pronominit todellisista ihmisistä
   - "official", "committee" ja "High Admiralty"
   - sulkujen tasapaino
6. **Ristiintarkistus.**
   - Sources-sivun väitteet lähteitä vasten: RB s. 3–4, FL s. 4, FAQ 2026:n versioväite ja Warp Riftin päiväykset.
   - Arvonnan suodattimet `poolFiltered` lähde kerrallaan: 10/17/52/58/55 (nyt fan 67), Book rules only
     39 = K-luokan määrä, Fits 91 × 91 → 81.
   - `WR_DATES`.
   - Kaikki 290 sivuviitettä tiukemmalla toisella tarkistimella `viite2.py` (nyt `testit/sivuaudit_tiukka.py`): viitatulla sivulla on vain
     sekakirjaimin kirjoitettu osuma, mutta varsinainen ISOIN KIRJAIMIN kirjoitettu sääntöotsikko on toisella sivulla.
7. **Vanhat säännöt.** Classic GW -skenaarioiden kiinteitä pistearvoja verrattiin Fleets-kirjaan
   (Black Ship, Deathwatch, Emperor, avaruusasema ja hulkit).
8. **Käyttöliittymä.**
   - Kuvakaappaukset näytöistä 375 × 812, 390 × 844, 844 × 390, 1440 × 900 ja 1920 × 1080.
   - Pitkät nimet (Mobeel) ja monet versiot (Depth of Space, 7 versiota).
   - Näppäimet 1–4 ja ← →.
   - Kuvakierros (1 850 sivua) ja muutettujen Result-sivujen kuvat käytiin läpi silmin.

## 3. Löydökset

Vakavuus: **keskitaso** = väärä sääntö, väärä puoli tai tuomio voi olla väärin. **Pieni** =
epätarkkuus, sävy tai johdonmukaisuus.

| # | Skenaario | Mitä | Lähde ja sivu | Vakavuus | Korjattu |
|---|---|---|---|---|---|
| L1 | fl-merchantmens-folly, fl-hunter-and-prey, fl-rt-gauntlet, fl-space-hulk, fan-s-crescent | Hyökkääjän vapaaehtoinen merkin aktivointi oli rajattu "from turn 2". Convoy ei rajaa vuoroa ("at the start of his own Movement Phase"), ja sovelluksen oma Convoy oli jo oikein. Starblade s. 22: "same as Convoy". | RB s. 135; FL s. 200–209; Starblade s. 22 | keskitaso | ✓ (myös omistusmuoto "the attackers’ movement") |
| L2 | siege-of-fularis | Taustateksti: "co-wrote the 2010 Compendium as a member of the High Admiralty (RB p. 3)". RB s. 3 nimeää vain Compendiumin tekijät. | RB s. 3–4 | pieni (todellinen henkilö) | ✓ |
| L3 | the-bait, parols-bait, bc-rearguard-attack, wr-commerce-raiders (+ fan-pdd:n entryFx) | Vuororata kertoi "up to 210 cm along the long edges", vaikka pitkä reuna on 180 cm. | RB s. 130, 179, 192 | pieni | ✓ yli pöydän pituuden "anywhere along the long edges" |
| L4 | escalating-engagement | Vuoron 1 muistutus "Arrival rolls at the start", vaikka reunalla ei vielä ole merkkejä. | RB s. 139 | pieni | ✓ |
| L5 | parols-bait | Result sanoi miinojen VP:n menevän "the attacker" -puolelle, vaikka sovittu arvo oli "The pursuers". | RB s. 179 | pieni | ✓ näyttää sovitun |
| L6 | 13 skenaariota (Invasionin kaikki, Kotol, Planet Fall, Battles in the Warp, FE Variant, Pirate Bases) | Joukkokortissa luki "SUGGESTED: ANY" ja 16 kortissa "SUGGESTED: ANY FLEET". Sama korjattiin 0.6.1:ssä vain otsakkeesta. | – | pieni | ✓ moottorissa: "any fleet" |
| L7 | moottori, `agreeBlock` | Kentän lähderivillä luki "Our suggestion — Our suggestion …", ja loppusulku katkesi ("(FL p. 500–"). Esiintyi 6 kentässä: Damocles 4, Darkening Raid ×2, Wolf Hunt ja Depth of Space ×2. | – | pieni | ✓ |
| L8 | cl-damocles-4 | Forces-teksti antaa ilmaiseksi "Tau Orbital cluster", mutta set-up sijoittaa "Security Orbital Station". Sovellus antoi aseman, eikä luentaa mainittu. | Fanatic 1 s. 28–29 | pieni (tulkinta näkyviin) | ✓ Source note |
| L9 | cl-treasure-fleet | Tuomio laski tuhotut kuljetusalukset "inactive"-pinoon ja antoi ne pöydän haltijalle, joten voittaja saattoi olla väärä. Esimerkki: 3 kaapattu, 2 tuhottu ja puolustaja pitää pöydän → oli "Defenders 5–3", oikein 3–3. | BFG Mag 4 s. 7 | keskitaso | ✓ laskuri "Transports destroyed" |
| L10 | cl-cerberus-4 (+ Ahriman Cerberus 2–3) | Space Marine -kuljetuslaivueesta puuttuivat "maximum size 4 vessels" ja "let your opponent know which squadron". Ahriman on lähteessä "most powerful vessel", sovelluksessa oli "most expensive". | BFG Mag 14 s. 28, 31 | pieni | ✓ |
| L11 | wr-solblade-4 | "+10 = major" luetaan "more than 10", vaikka 10 kuuluu myös luokkaan 7–10. Luentaa ei mainittu. Tuomio ei myöskään käyttänyt sovittua luokkaa: oletuksella 7 → "Minor Tyranid victory or draw". | WR41 s. 18 | pieni | ✓ note ja sovittu luokka tuomioon |
| L12 | wr-limante-contact | Bring-listassa oli "Low orbit table", joka on jäänne Planetary Assault -pohjasta. Sivu seuraa Surprise Attackia. | WR23 s. 13; WR32 s. 20 | pieni | ✓ |
| L13 | wr-falling-down | Puuttui: kaksi oikeaa kuljetusalusta eivät ole VP-arvoisia eivätkä tavoitteita paljastuksen jälkeen. | WR24 s. 33 | keskitaso (pisteytys) | ✓ Play + Victory |
| L14 | 10 WR-skenaariota (Mobeel, Falling Down, Norduun, SW Counter-Strike, Orbital Raid, Rebel World, Rebellion 1–2, Take the Stations, Who Goes There) | Result-välilehden "The game ends when" sanoi "Not given — …", vaikka pelin pituus on sovittava kenttä oletusarvoineen. | – | pieni (johdonmukaisuus) | ✓ ks. L23 |
| L15 | wr-srinagar | Sovitun kentän oletus oli "A Chaos cruiser of your choice", vaikka Cantatum Bellum on PUOLUSTAJAN (Imperial) alus. | WR48 s. 27 | keskitaso (väärä puoli) | ✓ "An Imperial cruiser" |
| L16 | wr-commerce-raiders | Result-välilehdeltä puuttui "Convoy VP from raider ships" -kenttä, vaikka tuomio käyttää sitä. Kenttä oli vain Play-välilehdellä. | – | pieni (UX) | ✓ `res: 1` |
| L17 | 16 turnaustehtävää | Pelikellossa luki "Time limit 2 h . Not started." | – | pieni | ✓ "2 h." |
| L18 | fan-t-retrieve-salvage (+ fan-pdd ×2) | Viite "Transports — RB p. 135" osoittaa Convoyn tulostaulukkoon. Kuljetusaluksen profiili on FL s. 85. | FL s. 85 | pieni | ✓ (fan-pdd:n viitteet korjasi rinnakkainen istunto: Light and Darkness FL p. 85, Supply and Demand FL p. 463) |
| L19 | wr-srinagar, wr-shattered-gate | "Warp rifts — RB p. 101". S. 101 käsittelee puolustusten sijoitusta warp riftin lähelle, ja itse sääntö on RB s. 111. sivuaudit hyväksyi viitteen, koska s. 101:llä on sekakirjaimin kirjoitettu otsikko "Warp Rifts". | RB s. 101/111 | pieni | ✓ |
| L20 | fan-p-claw | Lähde sanoo "10cm from any short table edge" (pöytä 120 × 120). Sovellus käyttää 180 × 120 -pöydällä pitkää reunaa. Se on järkevää, koska välimatka säilyy, mutta luentaa ei mainita. | Distant Sun s. 9 | pieni | ✓ rinnakkainen istunto lisäsi luennan Source notesiin |
| L21 | Sources-sivu | horizon "who is also one of the Remastered authors": RB s. 4 ja FL s. 4 eivät nimeä häntä tekijäksi (Saier, toimittajat Griffiths ja Passovoy). Hän ylläpitää FAQ-kierroksia. | RB s. 4, FL s. 4 | pieni (todellinen henkilö) | ✓ "who also maintains the Remastered FAQ runs (RB p. 4)" |
| L22 | `_wr.js` | `WR_DATES` puuttui numero 30, joten kuudessa kreditissä luki "Warp Rift 30." ilman päiväystä. | WR30 s. 1 (December 2010) | pieni | ✓ |
| L23 | moottori, `resultView` | Tuomio laskee lähteen tai oletuksen mukaan, mutta Result-välilehti ei näyttänyt, mitä oli sovittu (esim. Kotolin tasapeli, Planet Fallin tasapeli, Solblade 4, Light and Darknessin pakoreuna). | – | pieni (johdonmukaisuus) | ✓ "Agreed before the game" -laatikko tuomion alle, kun kohta on `v: 1` tai koskee pituutta, tasapeliä tai voittoa |
| L24 | cl-cerberus-3 | Lehti hinnoittelee Black Shipin 270 pts ja Deathwatch-iskuristeilijän 175 pts. Fleets-kirjan Blackship on taistelulaivaprofiili hintaan 300 pts (FL s. 148). Note viittasi Deathwatchiin sivulla FL p. 98, joka on Space Marine -lista; oikea sivu on s. 133. | BFG Mag 14 s. 26; FL s. 105, 133, 148 | pieni (vanha hinta) | ✓ Source note |
| L25 | 14 skenaariota, joissa on enemmän faktioita kuin puolia | Otsake näytti esimerkiksi "Suggested: Imperial Navy vs Tau vs Chaos vs Rogue Traders vs Space Marines vs Adeptus Mechanicus" (Depth of Space, 7 luonnosta). | – | pieni (kieli) | ✓ luettelo pilkuin, kun faktioita on enemmän kuin puolia |
| L26 | fan-n-recon, fan-n-flanks, fan-n-titan, fan-n-hulk | Lähteessä "Use an Attack Rating roll to determine who starts the battle", sovelluksessa "the winner chooses who takes the first turn". | Book of Nemesis s. 54–57 | pieni | ✓ "the winner takes the first turn" (kirjaimellinen, ks. kysymys 1) |

**Tarkistetut ja kunnossa:** Blockade Run (kartta RB s. 133), The Bait, Planetary Assault (tuomio ja
pyöristykset), Escalating Engagement, Daemon Blockade, Gauntlet (molemmat versiot), Space Hulk
(hulkkiprofiilit FL s. 286/389), Merchantmen's Folly (kuljetusalusvarianttien hinnat FL s. 182/192/521–524),
Breakthrough, Head of the Snake, Ahriman's Arrival (Abaddonin säännöt FL s. 230–231, sub-plotit RB s. 125/127),
Antioc 3 (30 cm / 10 cm kuvasta), Damocles 4 (aseman ja klusterin profiilit kuvasta), Abhorrence
(Desolator FL s. 267, low orbit RB s. 116), Planet Fall, Lachlon, Torpedo Run, Assassination, Diasporex
Gambit, Solblade 1, Solar Collectors (keräimen profiili WR15 s. 11), Convoy Battle (prosenttirajat),
Mobeel, Eldar Hunt 2, Rebellion 2, Darkening Raid, Looting the Hulk, Derelict Base, Neutron Star,
Retrieve the Salvage, Unexpected Encounter, Ambush, Naravona, Kravertus (pistesummat), Light and Darkness,
Into the Claw ja Tears in Motion (radiation burst RB s. 115). Sub-plottien kaikki 18 renown-arvoa
verrattiin RB s. 125–127:ään: 18/18 oikein. Kartoista Blockade Runin ja Treasure Fleetin reunanumerot
vastaavat lähteen karttaa.

**Huomioita, ei korjattu (tietoinen valinta):**
- Breakthroughin kartan nimiö "+50 VP per big ship off the far edge" yksinkertaistaa sääntöä (risteilijä,
  vähintään 150 pts:n escort-laivue tai kuljetusalus). Säännön tarkka muoto on Play- ja Result-välilehdillä.
  Nimiön pidentäminen vaatisi karttatestin uudelleensovituksen.
- `num`-kentän `step='5'`: VP-arvo, joka ei ole viidellä jaollinen (esim. 25 % × 145 = 36,25), on
  selaimessa teknisesti "invalid", mutta luetaan silti oikein. `parseInt` pudottaa desimaalit.
- Solblade 1: "feeding threshold" on luettu samaksi kuin seuraavan lauseen "at least 50%" (luonteva luenta).
- Escalating Engagement: kun "3" ja "→" painetaan heti peräkkäin, ensimmäinen → voi jäädä huomiotta,
  koska välilehti on vielä renderöitymässä. Tavallisella painalluksella toimii (4 → 7 kolmella painalluksella).

## 4. Korjaukset ja testit

Korjaukset tehtiin kahtena skriptattuna eränä (`patch1.py` ja `patch2.py` scratchpadissa):
tarkat korvaukset, määrän tarkistus, mtime-tarkistus ennen kirjoitusta, tmp + `os.replace` ja
varmuuskopio jokaisesta tiedostosta ennen muutosta (`bu_alku/`, `bu_patch1/`, `bu_patch2/`).
`fan-pdd.js`:ään ja `open-points.js`:ään ei koskettu, koska rinnakkainen istunto muokkasi niitä.
Muutetut tiedostot: `index.html`, `fleets.js`, `fan-starblade.js`, `blackcrusade.js`, `cl-mag-a.js`,
`cl-mag-c.js`, `cl-mag-d.js`, `wr-committee.js`, `wr-community-a.js`, `wr-community-l4b.js`,
`wr-community-l4d.js`, `wr-rating.js`, `_wr.js`, `fan-tournament.js` ja `fan-nemesis.js`.
Kaikille ajettiin `node --check`, myös index.html:n inline-skripteille.

Rinnakkainen istunto nosti tagit `?v=0.8.4`:ään tämän tarkastuksen JS-muutosten jälkeen. Sen omat kaksi
viimeistä fan-pdd.js-korjausta tulivat sen jälkeen, joten kaikki 23 script-tagia nostettiin lopuksi
`?v=0.8.5`:een, ja testit ajettiin uudelleen (alla).

Testit korjausten jälkeen (204 skenaariota, `?v=0.8.5`):

| Testi | Tulos |
|---|---|
| selaintesti leveä 1440 | 15 184 näkymää, 204 erillistä otsikkoa, 0 virhettä |
| selaintesti kapea 375 | 15 184 näkymää, 204 erillistä otsikkoa, 0 virhettä |
| karttatesti | 3 120 karttaa, 14 984 tekstiä, 0 virhettä + 0 varoitusta |
| sisältötesti | 0 + 0 (15 180 tulosfunktiokutsua, 314 sovittavaa kohtaa) |
| sivuaudit.py | 310 viitettä, 0 tarkistamatta |
| sivuaudit_tiukka.py (uusi, tiukempi) | 1 osuma (L19) ennen korjausta; korjauksen jälkeen 0 (Chapter I:n "Lock On RB p. 63" tarkistettu käsin oikeaksi) |
| kuvakierros (tarkistus) | 1 850 sivua, 0 löydöstä |
| kuvakierros (kuvat, muutetut sivut) | 78 sivua, 0 löydöstä; Result-sivut katsottu silmin |

**Julkaistu 21.10. klo 12.40 versiona 0.8.5** (Worker 383f6eca, GitHub 6cca6f4), kun koko 204 skenaarion kokonaisuus oli testattu uudelleen. Alkuperäinen huomautus:
**Ei julkaistu.** Julkaisu tarvitsee käyttäjän luvan:
`cd "Battlefleet Gothic/julkaisu" && PYTHONIOENCODING=utf-8 python kokoa.py --kokoa --julkaise scenarios`.
Julkaisu peilaa myös GitHubiin, ja mukaan tulisi samalla rinnakkaisen istunnon Chapter I.

## 5. Avoimet kysymykset käyttäjälle

1. **Book of Nemesiksen turnausskenaariot (L26):** "Use an Attack Rating roll to determine who starts
   the battle". Muutin muotoon "voittaja aloittaa" (kirjaimellinen luenta). Aiempi muoto oli "voittaja
   valitsee", mikä on kirjan tavallinen käytäntö (RB s. 128, 133 ja 143 sanovat sen erikseen). Kumpi halutaan?
2. **Cerberus 3:n Inquisition-alukset (L24):** pelataanko lehden hinnoilla (270 ja 175 pts) vai Fleets-kirjan
   profiileilla ja hinnoilla (Blackship 300 pts, strike cruiser 145 + refitit)? Nyt asia on Source notessa
   ("Agree which costs you use"). Sen voisi tehdä myös sovittavaksi kentäksi `open-points.js`:ään, kun
   rinnakkainen istunto on valmis.
3. **Result-välilehden "Agreed before the game" -laatikko (L23):** näkyy noin 30 skenaariossa, joissa sovittu
   kohta koskee voittoa, tasapeliä tai pituutta. Riittääkö tämä vai halutaanko kaikki sovitut kohdat
   (kuten Play-välilehdellä)?
4. Into the Claw (L20) ja fan-pdd:n kuljetusalusviitteet (L18) korjasi rinnakkainen Chapter I -istunto
   (tarkistettu tiedostosta). Kysymys ei ole enää avoin.
