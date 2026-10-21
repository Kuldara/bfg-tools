# BFG XR -kytkin Gothic Fleet Registryyn: selvitys ja suunnitelma

*Laadittu 2.10.2026 (selvitys, ei toteutusta). Lähteet: BFG:XR v1.22.01 -PDF:t kansiossa `Battlefleet Gothic/BFGXR` (Google Drive -lataus 11.9.2026). Pohjana ovat viisi tutkimusraporttia (säännöt, Ships of the Imperium, Ships of the Xenos, sovelluksen kytkennät ja olemassa oleva data) sekä katselmoinnin pistokokeet repoon ja XR-tekstidumppeihin. Repoon tai BFGXR-kansioon ei ole koskettu. XR-sivunumerot ovat **PDF-sivuja**, ellei toisin mainita. XR:n painettu sivunumero on PDF − 5 (Rulebook), PDF − 3 (Imperium) ja PDF − 4 (Xenos). Remasteredissa painettu sivu on sama kuin PDF-sivu, XR:ssä ei.*

---

## 1. Tiivistelmä

- **Onnistuu.** Moottori on pääosin dataohjattu. resolveFleet ajaa 19 rule kindiä, ja kortit, tallennus ja play-sivun käyttöliittymä toimivat sillä katalogilla, joka niille annetaan. Itse kulmakytkin on pieni käyttöliittymätyö. Sen edellytykset eivät ole pieniä: moottorin parametrisointi, play-sivun avaimet ja build_play-poiminta sekä julkaisun suojaus vievät yhteensä noin 4–7 sessiota.
- **Iso kustannus on XR-sisältö.** Koneluettavaa ja ajantasaista XR-dataa ei ole olemassa. Poimittavaa ja kuratoitavaa on noin 220 profiilia ja 30 listaa (28 itsenäistä ja 2 detachmentia), lisäksi 5 Craftworld- ja 2 Bastion-varianttia. Työtapa on sama kuin Remastered-datassa. build_data.py:n noin 4 300 riviä kuratoituja tauluja ja paikkauslohkoja ei siirry, upgrades.py ei käytännössä siirry, eivätkä myöskään 358 + 88 goldenia tai referenssi-kansion 33 listatiedostoa.
- **Pelisäännöissä ero on pieni.** 20 vertaillusta mekaniikasta 9 on vaikutukseltaan samoja ja 6 muuttaa koodia (noin 10 haarakohtaa play_rules.js:ssä ja noin 6 domain.js:ssä). Työläin osa ovat sivuviitteet ja sääntötekstit: play_rules.js:ssä on noin 190 viitettä, domain.js:ssä noin 300–360 (laskutavasta riippuen) ja domainissa 128 Fleets-sivuihin nojaavaa sääntötekstiä.
- **Karkea työmääräarvio** on noin 35–60 työsessiota koko laajuudella, tai noin 30–50 ilman Tyranideja ja General Fleet Supportia. MVP, jossa ovat Imperial Navy, Necron Harvest ja toimiva kytkin, vie noin 13–19 sessiota. "Sessio" ei ole kalibroitu historiadataan, ks. luku 5.
- **Suositus:** vaihtoehto B, eli yksi HTML ja kaksi upotettua datasettiä. Ruleset valitaan latauksen yhteydessä, ja kytkimen kääntö tallentaa ja lataa sivun uudelleen. Kehitysvaiheessa käytetään erillistä XR-buildia (`build.py --ruleset xr`). **Julkinen build ja share-zip tehdään ilman XR:ää**, kunnes tekijältä on lupa. Vaihtoehtoa C (XR diff-kerroksena) ei kannata tehdä.
- **Ennen aloitusta tarvitaan käyttäjän päätökset:** AGENTS.md §1 (lähteenä vain Remastered) ja §5 (feature freeze, BACKLOG prioriteetti 3), faktiolaajuus sekä julkaisu. XR:llä ei ole uudelleenkäyttölisenssiä.

---

## 2. Mitä "kaikki seuraa kytkintä" tarkoittaa käytännössä

**Rajaus:** kytkin koskee builderia, katalogia, laillisuustarkistuksia, sovelluksen kortteja ja tulostusta, tallennusta, vientiä ja tuontia sekä play-sivua. **Ei koske** simulaattoria, boarding-ratkaisinta (Remastered-boarding), Battlezone Generatoria, Meta Almanacia eikä julkaisumateriaaleja (julkaisu/luvut.py, make_brochure.py, make_og.py, make_reddit_slide.py). Ne pysyvät Remastered-työkaluina, ellei niistä erikseen päätetä.

| Osa-alue | Mitä XR-tilassa vaihtuu | Uutta vai uudelleenkäyttöä |
|---|---|---|
| **Katalogi ja listat** | Oma bfg_data_xr.json: noin 202 laivaprofiilia kirjoista (Imperium 118, Xenos 81–84) ja 19–20 tuki- ja puolustusprofiilia Rulebookista (PDF 70–79). Listoja on 30: Imperium 19, joista 17 täyttä ja 2 detachmentia, ja Xenos 11, myös Demiurg War Host PDF 105. Lisäksi tulevat 5 Craftworld- ja 2 Bastion-varianttia. Remasteredissa listoja on 32. XR:ssä ovat Renegades, Ordo Malleus Banisher, Necron Dynasty, Tyranid Gestating, yksi yhdistetty Ork Green Tide ja yksi Tau-lista. XR:stä puuttuvat SM Codex Astartes, Corsairs Later Gothic War, Cyclops Cluster, Da Ork Clanz ja kaksi erillistä Tau-listaa. Iyanden on XR:ssä Craftworld-variantti. | Data kokonaan uutta, käyttöliittymä sama |
| **Pisteet ja laillisuustarkistukset** | Valtaosa listasäännöistä mahtuu nykyisiin 19 rule kindiin. Lisäksi tarvitaan noin 20 uutta mekanismia, ks. 3.2. Reservi- ja liittolaismalli on rakenteeltaan erilainen: XR:ssä on vain reservit ja "allies of convenience", ei liittolaismatriisia (XR RB PDF 64–65). R/A-painikkeen A-puoli piilotetaan XR-tilassa. | Moottori sama, uusia haaroja |
| **Laivakortit (sovellus)** | cardHTML on dataohjattu, joten statit, aseet ja optiot tulevat XR-datasta. Korttien sääntötekstit (SPECIAL_WEAPON_RULES 72, SPECIAL_HULL_RULES 53, COMMANDER_RULES 3) siteeraavat Fleets-sivuja ja kirjoitetaan XR:lle uudelleen. XR:n statisolut ovat pidempiä ('6 (10)', '1 / Holofields', '6+ Deflector / 5+', '3 Spore Cysts'), joten print_checkin ylivuoto ja opt-overflow (≥9 optiota, print_check.js l.327) on ajettava XR-datalla. | Asettelu sama, tekstit uusia |
| **Korttiarkit (toisen session)** | make_fleet_cards.js ja fleet_card_sheets.js eivät lue PDF:ää. Ne avaavat 'Gothic Fleet Registry.html':n headless-Chromessa ja kutsuvat sovelluksen buildCardSheet():a (make_fleet_cards.js:1–38). Ne pysyvät Remasteredissa vain, jos oletus-ruleset on Remastered ja sovelluksen globaalit (DATA, SHIPS, LISTS, buildCardSheet) ja alustusjärjestys säilyvät. Tiedostoja ei muokata. XR-arkit ovat niiden omistajan päätös. | Regressiopinta, ei muutoksia |
| **Play-sivu** | Kuusi koodiin vaikuttavaa eroa, ks. 3.1. Lisäksi tulevat faktioiden ja rakenteiden crit-taulut (XR:ssä noin 12–13, domainissa 7 rotukohtaista haaraa), XR-holofieldit (Xenos PDF 21) ja 2-hit-escorttien per laiva -hit-rata. Hit-rata muuttaa pelitietueen G rakennetta ja käyttöliittymää. 'Ready-made fleets' (rosters.json, 14 Remastered-rosteria) piilotetaan XR-tilassa. | Logiikka pääosin sama, RULESET-objekti, käyttöliittymään muutoksia |
| **Sääntötekstit ja sivuviitteet** | Jokainen viite vaihtuu, myös silloin kun sääntö on sama. Viitteitä on play_rules.js:ssä noin 190, domain.js:ssä noin 300–360 (198 "Fleets p." -osumaa ja 14 "Rulebook p." -osumaa), app_template.html:ssä 33 "Fleets p.", build_data.py:ssä 14 ja upgrades.py:ssä 21. LUEMINUT T1–T24 saa XR-vastineen, jonka tulkinnat käyttävät omaa etuliitettä (XT1…). | Kokonaan uutta |
| **Tallennus, vienti ja tuonti** | Rulesetille oma avainperhe. Remasteredin `gothic-fleet-registry-v1`, `-backup` ja `-backup-last` pysyvät tavulleen samoina. XR saa avaimet `gothic-fleet-registry-xr-v1`, `-xr-v1-backup` ja `-xr-v1-backup-last`. XR-dokumentti saa kentät `ruleset:"xr"` ja schemaVersion 5, jolloin nykyinen 1.1-sivu (SCHEMA_VERSION 4, app_template.html:1301) hylkää sen. Export-tiedostonimeen lisätään "XR" (app_template.html:3601). Play-sivun pelitietue saa ruleset-kentän, ja roster-sormenjälkeen lisätään ruleset. | Pieni, mutta pakollinen |

**Miksi erillinen tallennus on pakollinen:** XR käyttää samoja listanimiä kuin Remastered (Gothic Sector, Bastion, Armageddon, Bakka, Crusade, Dominion, Incursion, neljä jumalalaivastoa) ja samoja luokkanimiä eri hinnoilla. Jos Remastered-tallennus luettaisiin XR:n alla, se ratkeaisi hiljaa vääriin riveihin väärällä hinnalla. Juuri tätä virhettä docs/SAVE_SCHEMA.md vartioi.

---

## 3. Löydökset

### 3.1 Säännöt: XR vs Remastered

**Vaikutukseltaan samat (9):** Ld-taulukko (XR PDF 12 / Rem 45), kuusi käskyä puolituksineen (PDF 13–14, 19, 24, 26; ORDERS-taulu kenttä kentältä), crit-taulun 11 tulosta (PDF 25), catastrophic-taulun neljä vyöhykettä (PDF 28–29), crippling (PDF 25), kilvet ja BM (PDF 26–28), damage control (PDF 40), disengage (PDF 43) sekä laivueiden Ld ja puolitus (PDF 48–51). CRIT, CRITS, CRIP_LINE, catastrophic(), repairDice() ja squadronFire voivat jäädä ennalleen, vain viitteet vaihtuvat. Gunnery-taulukon 20 riviä ovat samat, eikä sovellus koodaa taulukkoa.

**Koodiin vaikuttavat erot (6):**

| Ero | XR | Remastered | Kohta repossa |
|---|---|---|---|
| Pienen kohteen kriitti | +1 vahinko, jos aloitushittejä < 3 (PDF 25, 38, 47) | escort tuhoutuu (Rem 66, 91–92) | domain.js repairLine ~l.2215, criticalTriggerLine ~l.2239; play_rules.js killMember l.746, isEscort l.250 |
| Escort-VP | crippled squadron pöydällä = 25 %, pyöristys ylös (PDF 84) | maksetaan vain tuhosta tai poistumisesta (Rem 123) | play_rules.js escortCrippled l.558, conceded l.569, concededPage l.594; T7 ratkeaa XR:ssä |
| AC-raja | satunnaiset baysit lasketaan maksimiin (PDF 31) | "+?"-merkintä (T10) | play_rules.js launch() l.692 |
| Ld:n lattia | ei alle 0, Ld ≤ 1 epäonnistuu automaattisesti (PDF 12) | ei lattiaa | play_rules.js leadership() l.340 |
| Boarding-bonus | faktiokohtainen crew damage bonus (PDF 46) | kiinteä Orks/Chaos +1, SM +2 | play_rules.js boardingValue l.549 |
| Brace | kerran hyökkääjää kohden vuorossa (PDF 26) | uusi yritys seuraavaa vastaan (Rem 66) | play_rules.js setOrder l.672 (braceLock) |

**Erot vain builderissa tai teksteissä (6):** reservit ja allies of convenience (PDF 64–65), Fleet Detachments (PDF 65), 21 yksikön General Fleet Support List (PDF 66–80, mukana oma Space Station -crit-taulu PDF 67), refitit 18 + 18 ja crew skillit 6 + 6 (Imperium PDF 154–155, Xenos PDF 126–127), torpedotyypit Rulebookissa (PDF 34–35) Fleets s. 19:n D6-ostotaulukon sijaan sekä Bridge Smashedin uudelleenheittosanamuoto (PDF 62). **Ei koodattu kummassakaan:** turret suppression (PDF 37) ja torpedo bombers (PDF 36).

**Faktio- ja rakennetaulut:** Xenos-kirjassa on 9 taulua: Dark Eldar PDF 10, Tormentor Spire 16, Eldar 21, Haven Spire 36, Necron Ld-sarakkeineen 45, Ork Space Hulk 75, Ork Rok 76 sekä Tyranid crit ja catastrophic 111. Imperium-kirjassa on lisäksi Chaos Space Hulk, Ramilies Star Fort ja Fortress-Monastery (Imperium-txt rivit 4183, 8383, 14210) sekä Mechanicuksen oma kriittiheitto (rivi 427). Rulebookissa on Space Station -taulu. Kaikki luetaan XR:stä uudelleen. Sisältö poikkeaa Remasteredista, esim. DE-taulu.

**XR:n sisäinen ristiriita:** Brace-ajoitus on PDF 13:lla "ordnance phase tai vastustajan vuoro" ja PDF 26:lla "aina kun laiva ottaa vahinkoa". Se kirjataan XR-tulkinnaksi XT1, ei Remasteredin T-numeroksi, koska T1 on jo varattu.

**Rakennemalli:** Sääntöerot mahtuvat RULESET-objektiin, joka välitetään play_rules-funktioille sekä domainin criticalModel-, repairLine- ja crippledLine-funktioille. Esimerkiksi:
`{id, pages:{critTable:…}, smallTargetCrit:'destroy'|'+1', vpEscortCrippled, escortCripRound:'floor'|'ceil', ldFloor, boardingBonus, ordLimitDiceMax, braceOncePerAttacker, critTables:{…}}`.

### 3.2 Data: muoto ja poiminnan toteutettavuus

**Profiilit.** XR:n vaakasivuilla on 1–2 laivaa sivulla, ja lore-teksti on samoilla y-riveillä kuin taulukko. Kirjoitusasu on "ARMOR", nimirivillä on "NAME.....N Points", eikä OPTIONS- tai SPECIAL-otsikoita ole. extract.py:parse olettaa yhden laivan pystysivulle eikä toimi. Geometriset apufunktiot rows, cells_of, cols_of, label_row ja STAT_RE siirtyvät pääosin.

**Kertakäyttöparserin tulos** (kertakäyttöinen selvitystyökalu, noin 100 riviä; ei repossa):
- Imperium: 119/121 statiriviä OK, 449 aseriviä ja 107/121 profiilia täysin puhtaita. Tunnetut virheet: kaksirivinen launch bay -solu (Dictator, Defiant), battle barge -sivut PDF 138–139, Man O' Warin rakennustaulukko PDF 119 ja Xenos Cutter PDF 128.
- Xenos: geometrinen parseri antoi 38/76 puhdasta, koska stat-regex kaatui. Tekstidumpista statisolut jäsentyivät 80/81 profiilissa. Stat-regexin pitää hyväksyä "Holofields", "5+ Reactive Hull" ja "-". Noin 20 profiilin aserivit vaativat geometriapohjaisen poiminnan (Eclipse, Hero, Proteus, Gorbag…).
- Arvio: tuotantotason xr_extract.py on noin 300 riviä ja lyhyt käsikorjauslista, samaa kokoluokkaa kuin extract.py (269 riviä).

**Optiot.** Optiot ovat proosaa nimetyissä kappaleissa ("Special Refits:", "Mechanicus Refits:", "Torpedo Bombers:"), ja hinta on lauseen sisällä. Imperiumin profiilisivuilla on 88 "+N points" -mainintaa ja Xenoksen sivuilla noin 116–185 (heuristinen laskenta). Remasteredissa ol-merkintöjä on 152 kpl 60 laivalla. XR:n optiot kirjoitetaan käsin. swaps.py käy todennäköisesti uudelleen. "Special Rules" -kappaleita on pelkästään Imperium-profiilisivuilla 59, ja ne kaikki tarvitsevat XR-sääntötekstin.

**Vertailu Remasterediin.** Tästä syystä vaihtoehto C ei toimi.
- Noin 112 nimeä on yhteisiä, noin 65 on vain XR:ssä ja noin 40 vain Remasteredissa. Sumealla vertailulla kummastakin "only"-listasta noin 10 on pelkkiä kirjoitusasueroja.
- 56 käsin tarkistetusta parista 39 maksaa saman ja 17 eri määrän (ero 5–100 p.). Esimerkkejä: Void Stalker 430/380, Flame of Asuryan 420/320, Exorcist 260/230, Fortress-Monastery 875/1000.
- Myös aseistus vaihtelee. XR:n Despoilerissa on WB 10 ja 4 prow-baya eikä prow lanceja. Exorcistissa on 3 laivuetta baya kohden, ja Retaliatorin WB on 45 cm. Eldar-laivoilla turns on 90° ja turrets 1–2.
- 2-hit-escortteja on XR:ssä 8 luokkaa: Imperium 2 (Rogue Trader -kirjan sivulla PDF 122, mm. Convoy Monitor) ja Xenos 6 (Corsair frigate, Hellebore, Jackal, Grunt, Defender, Kraken). Remasteredissa niitä ei ole.

**Listojen hinnat.** Listarivin hinta voi poiketa profiilista. Bakka-lista lisää tarkoituksella +5 kuuteen luokkaan (PDF 96), joten tarvitaan listarivikohtainen hinta. Selittämättömiä poikkeamia on kolme listariviä: Terminus Est on profiilissa 430, mutta 13th Black Crusade- ja Nurgle-listoissa 420 (PDF 54 vs 58 ja 62). Lisäksi "CSM Battle Barge 440" (PDF 60) on ilman omaa profiilia.

**Id-törmäys.** Remasteredin laivakoodit ovat Fleets-sivuja 52–524. XR:n kirjojen sivut (Xenos 11–120, Imperium 9–152) menevät niiden kanssa päällekkäin, esim. XR:n Kill Kroozer PDF 68 ja Remasteredin laiva "68". XR tarvitsee oman id-avaruuden, esim. kirjaetuliitteen, ja oman datatiedoston. Remasteredin Tau-konfiguraatiotietueet (458b, 460b, 462b, 470b, 472b, 472c) ovat XR:ssä saman laivan optioita.

**Uudet mekanismit, joita moottorissa ei ole** (noin 20; tähdellä ne, joita ilman koko faktiota ei saa tehtyä):

1. 2-hit-escortit: laivueessa enintään neljä (PDF 48, 63), play-sivulle per laiva -hit-rata*
2. Pakollinen valinta optioryhmästä (gmin tai required; grep vahvistaa, ettei sitä ole): DE:n Kabal-patternit (Xenos PDF 11–13) ja Tyranidien gene templatet*
3. Templatesta riippuva pakollisuus, eli mitkä aseryhmät ovat pakollisia (Tyranid bio-cruiser PDF 115–117)*. Raportti luokitteli tämän **blockeriksi**. Toistuvien asesettien summaus on jo olemassa (BACKLOG P1-6 "count + summa"), joten uutta on vain ehdollinen pakollisuus.
4. Listatason optiot: torpedotyypit +5 / strength-piste tai +50 D3-heitosta, mine launcherit +5 / bay (Imperium PDF 92–93)
5. Johdetut laivat profiilimuunnoksella: Venerable "Points: Varies" (PDF 140), Ork-looted-laivat (Xenos PDF 61)*
6. Runkorakentaja: Rogue Trader Man O' War ja Fortune-budjetti (PDF 119)
7. Listarivikohtainen hinta (Bakka)
8. Fleet Detachment eli "joined list" -käsite (RB PDF 65; Inquisition ja RT -detachmentit)*
9. Reservien kopioraja alkuperäisen listan mukaan ja allies of convenience -rajoitukset (RB PDF 64)
10. Painotettu suhdesumma useasta lähteestä ja option ehdollistama suhde (Tyranid PDF 122–124)
11. Painotettu laivuekoko (Kraken lasketaan kahdeksi)
12. Prosenttirajat: famous craftworldit (Xenos PDF 39–41), Tyranidien ordnance enintään 10 %
13. Kustannus prosentteina toisen yksikön hinnasta: Ork-klaani +50 % komentajan hinnasta (PDF 61)
14. Ork heavy gunzin kaksoistulivoima "6 (10)" (PDF 59). play_rules.js:n num() palauttaa nykyään nullin.
15. Koostehinnoittelu: Taun siviiliorbitaalit (PDF 94)
16. Support-osiotyyppi kiinteällä Ld 7:llä ja omilla laivuerajoilla sekä Space Station -crit-haara (RB PDF 66–80)
17. Refit-uniikkius ("same name = same refit") ja kertova Reinforced Hull (+25 % hitejä)
18. Secondary commanders (RB PDF 62; IN-listoissa 0-3 Strategic Commander, Imp PDF 92). **Tarvitaan jo MVP:ssä.**
19. Pyöristys: "full 1000" (alas) vs "or part thereof" (ylös)
20. Cadian Ld-modifikaattori ja Obscura-reservit (PDF 94). Tarvitaan MVP:ssä, jos Bastion-variantit otetaan mukaan.

Lisäksi listoissa on XR:n valinnaisia sääntöjä, kuten DE "Only the Strong May Lead" ja Modern Blast Markers (RB PDF 28), sekä "Attack Rating", joka on vain näyttökenttä.

### 3.3 Olemassa oleva koneluettava data, lisenssi ja ylläpito

- **bsdata_cache** on klassinen BFG (Armada 207, Rulebook 189, 2010 Compendium 154 viittausta), ei XR. "BFGXR - Chaos" -julkaisu on määritelty, mutta siihen ei viitata kertaakaan.
- **ksnyder1986/Battlefleet-Gothic-XR** on ainoa XR-BattleScribe-data. Se on päivitetty viimeksi 2022-01-11, eikä sillä ole lisenssiä. Se on vain osittain XR: pisteet täsmäävät Imperial Navyssa 30/30, AdMechissa 8/8 ja Chaosissa 22/23, mutta xenokset ovat vanhaa BSDataa (Orks 7/10, Necron 1/3, Corsairs 0/3). Siitä puuttuvat RT Detachment, RT Expedition, Necron Dynasty ja Gestating. Kelpaa crosscheck_bsdata.py:n muunnelmalla **toiseksi mielipiteeksi Imperiumin pisteisiin**, ei lähteeksi. Kenttätason tarkkuutta (aseet, rajat) ei ole tarkistettu.
- **XR on jäädytetty.** v1.22.01 on ainoa numeroitu julkaisu (Update_Log: 148 muutosriviä), PDF:t ovat päivältä 2022-01-01, ja Specialist Arms -foorumi on suljettu (404). Kertapoiminta ei siis vanhene, toisin kuin Fleets WiP.
- **Ylläpito:** XR-PDF:ien versio (v1.22.01) ja SHA-256 tallennetaan bfg_data_xr.json:n metaan, ja build tarkistaa ne. Jos XR joskus päivittyy, ajetaan xr_extract.py uudelleen ja diffataan profiles_raw_xr.json. Muutos käsitellään PAIVITYSVAIKUTUS-portin XR-versiolla. Remastered päivittyy edelleen, joten jokainen moottorimuutos ajetaan molemmilla datasetillä. Simulaattorihaarasta tuttu käytäntö, sama binääri molemmille säännöille todennettuna identtiseksi, otetaan porttisäännöksi.
- **Lisenssi:** XR:ssä ei anneta uudelleenkäyttölupaa. RB PDF 3: sisältö kuuluu tekijöilleen, ja projekti on Xca|iberin henkilökohtainen. RB PDF 6: "100% fan-made". Harkinta, ei oikeudellinen arvio: yksityisessä offline-käytössä XR rinnastuu Remastered-dataan. **Julkaiseminen** (julkaisu/make_site.py → bfgtools.kuldare.com, julkaisu/make_share_zip.py → share version/) tehdään vasta tekijän luvalla. Sähköpostiosoite on RB PDF 3:lla. Sääntötekstit pidetään lyhyinä tiivistelminä sivuviittein.

### 3.4 Sovelluksen kytkennät (mikä siirtyy, mikä ei)

| Tiedosto | Koko | Siirtyy XR:ään |
|---|---|---|
| domain.js | 4 407 r. | Noin 3 400 r. geneeristä koodia (adapter, lend/reserve-moottori, condOK, upgrade-hinnoittelu, weaponRows count-summauksineen, resolveFleet). Noin 1 000 r. on Remastered-sisältöä: crit-taulut l.1957–2050, damage model l.2052–2257, SPECIAL_*_RULES ja COMMANDER_RULES l.2269–2958 sekä koukut (venerableView, hullPts +35, isMechanicusVessel, bioCap). **Globaalia `DOMAIN`-oliota käyttää 13 tiedostoa** (build.py, build_data.py, upgrades.py, acceptance.py, audit_upgrades.py, check_control.py, check_symmetry.js, test_domain.js, test_golden.js, play/play_rules.js, play/test_play.js, play/build_play.py), osa `new Function(src+';return DOMAIN;')`-muodossa. |
| play_rules.js | 782 r. | Logiikka lähes kokonaan. Viitteet ja noin 10 haarakohtaa eivät siirry. |
| play_template.html | 1 604 r. | Käyttöliittymä siirtyy. KEY_BUILDER (l.468), KEY_PLAY ja pelitietue G, rosterit sekä escortin yksi {dead}-paikka (freshUnit) tarvitsevat XR-haaran. |
| app_template.html | 3 741 r. | Lähes kaikki. Kovakoodattua Remasteredia ovat ADMECH_GIFTS (l.963–990), "Fleets WiP pg." (l.1894), R/A-painikkeet pg. 14/16 (l.1974–1976, 2286–2288) ja hull-tooltip p.102 (l.2274). URL-parametrit card-audit ja layout-audit (l.3723) pitää säilyttää ?rs=-parametrin rinnalla. |
| build_data.py | 5 932 r. | Vain apufunktiot (exactly-once-assertit, --prove-guard, option-ID:t, output-skeema). Taulut (~1 300 r.) ja listapaikkaukset (~3 000 r.) eivät siirry. |
| upgrades.py / swaps.py | 1 287 / 207 r. | upgrades.py ei käytännössä siirry. swaps.py todennäköisesti siirtyy. |
| extract.py / lists.py | 269 / 273 r. | Geometria-apufunktiot siirtyvät, parse-logiikka ei. |
| build.py / play/build_play.py | | Tarvitaan `--ruleset rm|xr|both`. build_play.py poimii app_templatesta resolveSavedin, factionColsin, arcGlyphin ja shortRangen seitsemällä vartijalla, joten boot-shimmi ei saa rikkoa poimintaa. |
| acceptance.py | 27 askelta | Raportin mukaan dataneutraaleja (ei erikseen todennettu): qa_structure, fuzz_save, check_symmetry, stress, layout_check, check_control, coverage ja build. GOLDEN, LISTASAANNOT (+ check_reference.py), PROFIILIT, SITAATIT, SIVUT, VAIKUTUSJONO ja PAIVITYSVAIKUTUS tarvitsevat XR-versiot. |
| testit | | test_domain (105 sivuviitettä), test_validator (75), test_play (265), print_check (24), test_save (lukitsee kenttäjoukon), play_red.py-mutaatioajuri (57), play/rosters.json (Remastered) |
| make_fleet_cards.js / fleet_card_sheets.js | toisen session | Ei muokata. Ajavat sovellus-HTML:ää headless-Chromessa → regressioportti `node make_fleet_cards.js --check-only`. Tila nyt: M ja ?? (kesken). |

Kytkimen paikka on `.topbar .brand` #srcline:n vieressä (app_template.html l.814–818). build.py vaatii tasan yhden kirjaimellisen `<script>`-avaustagin, ja ehto pysyy voimassa, kun lisätään toinen tyypitetty JSON-lohko.

---

## 4. Arkkitehtuurivaihtoehdot

| | **A: Kaksi erillistä buildia + linkki** | **B: Yksi sovellus, ajonaikainen ruleset, kaksi datasettiä** | **C: XR diff-kerroksena Remasteredin päällä** |
|---|---|---|---|
| Toteutus | build.py tuottaa kaksi HTML:ää, ja kulmassa on linkki toiseen | `<script id=bfgdata-rm>` ja `<script id=bfgdata-xr>`. Boot-shimmi lukee localStoragen `gothic-fleet-ruleset` (try/catch, ?rs= ohittaa), parsii vain valitun lohkon ja luo `DOMAIN = makeDomain(RULES[rs])` säilyttäen globaalit nimet. Kääntö: save(), avaimen ja näkymätilan kirjoitus, reload. | Remastered-data + XR-poikkeamat (hinnat, statit) |
| Koko | 1,66 MB + noin 1,3–1,6 MB, kaksi tiedostoa | noin 2,2–2,5 MB sekä builderille että play-sivulle (nyt 1,66 / 1,65 MB). Arvio, ei mitattu. | pienin |
| Plussat | yksinkertaisin, ei riskiä Remastered-tilalle | yksi jakelutiedosto (AGENTS §5), aito kulmakytkin, play-sivu voi valita datasetin dokumentin ruleset-kentästä | vähän dataa |
| Miinukset | rikkoo yhden tiedoston jakelun. file://-tiedostot eivät välttämättä jaa localStoragea, joten kytkin ei voi muistaa tilaa eikä Play-nappi toimi ristiin | Reload kääntäessä, koska hot swap ei ole turvallinen (DATA/SHIPS/LISTS ovat const-arvoja ja MAXPTS/UPFOR/OFFERED-välimuistit moduulitasolla). Kokoa tulee 0,5–0,8 MB lisää. **Julkinen build tarvitsee XR-vapaan version.** Alustusjärjestyksen muutos on regressioriski make_fleet_cards.js:lle ja build_play.py:lle. | **ei toimi**: aseistukset eroavat (Despoiler, Exorcist, Retaliator), listarakenteet eroavat, Tau-tietueet muuttuvat optioiksi, id:t törmäävät, noin 65 laivaa on vain XR:ssä ja noin 40 vain Remasteredissa |

**Suositus: B, ja A on sen kehitysvaihe.** Ensin tehdään `build.py --ruleset xr`, joka tuottaa erillisen XR-HTML:n samalla moottorilla. Sillä XR-dataa kehitetään ja testataan. Kytkin ja yhdistetty tiedosto tulevat, kun XR-buildissa on vähintään MVP-laajuus. Näin Remastered-tuotantotiedosto ei ole koskaan puolivalmiin XR:n varassa. C hylätään.

**Tallennusmalli (B):**
- Kummallakin rulesetillä on oma avainperhe, myös backup-avaimet. Kääntö ei koske toisen rulesetin laivastoihin, ja ne palaavat, kun käännetään takaisin.
- Tuonti: jos dokumentin ruleset on eri kuin aktiivinen, sovellus tarjoaa vaihtoa ja tallentaa dokumentin oikean rulesetin avaimelle. Dokumenttia ei koskaan ratkaista ristiin. Vienti: tiedostonimeen tulee rulesetin tunnus.
- Play-sivu valitsee datasetin **dokumentin** ruleset-kentästä eikä kytkimestä, jotta liittäminen toisella laitteella toimii. Play-nappi välittää `?rs=xr`, play-sivu lukee vastaavan builder-avaimen, pelitietue G saa ruleset-kentän ja roster-sormenjälkeen lisätään ruleset.
- Uudelleenlataus palauttaa näkymän (välilehti, valittu lista, scroll), jotta kääntö ei maksa ylimääräisiä napautuksia.
- Automaattista muunnosta ei tehdä. Enintään eksplisiittinen "kopioi luokkanimen mukaan + raportti", joka on rajattu tämän suunnitelman ulkopuolelle.

**Julkaisun suojaus:** `build.py --ruleset rm` on julkaisubuildin oletus. make_site.py ja make_share_zip.py saavat assertin, joka kaataa ajon, jos HTML:ssä on `bfgdata-xr`-lohko, ellei lupapäätöstä ole kirjattu. share version/-kansioon ei kosketa (AGENTS §2, §5).

---

## 5. Toteutussuunnitelma

Isoimmat riskit tulevat ensin: moottorin parametrisointi ilman Remastered-regressiota, sitten poiminta ja sitten MVP-faktiot, joissa ovat pahimmat uudet mekanismit (2-hit-escortit, rotukohtaiset crit-taulut, secondary commanders). Työsessio tarkoittaa yhtä pitkää työistuntoa. Jokaisessa vaiheessa noudatetaan AGENTS §3:a: kirjan sivu, punainen golden, korjaus, acceptance ja pistokoe (docs/PISTOKOE.md). Kunkin faktion sääntötekstit ja sivuviitteet tehdään samassa vaiheessa kuin sen data.

### Vaihe 0 – Päätökset ja sopimus (0,5 sessiota)
- Käyttäjän päätökset kohdasta 6. Tarkistetaan BACKLOG prioriteetti 3:n tila (freeze).
- AGENTS.md päivitetään: §1 sallii XR:n kolme PDF:ää omalle rulesetilleen, §5 nostaa freezen tältä osin, ja sivukonventio sovitaan. Suositus: viitteissä on kirjatagi (`XR RB p.`, `XR Imp p.`, `XR Xen p.`) ja **painettu** sivunumero, koska kirjojen omat ristiviitteet käyttävät painettua numeroa. Extractor tallentaa molemmat numerot. XR-tulkinnat saavat etuliitteen XT.
- **Portti:** päätökset on kirjattu ja sivukonventio on dokumentoitu.

### Vaihe 1 – Moottorin parametrisointi, Remastered ennallaan (2–4 sessiota) – suurin regressioriski
- domain.js:n IIFE muutetaan muotoon `makeDomain(RULES)`. **Globaali `DOMAIN` säilyy Remastered-instanssina**, jotta 13 kuluttajaa toimii muuttumattomina. Remastered-sisältö (crit-taulut, damage model, SPECIAL_*_RULES, COMMANDER_RULES, squadronLimits-oletus) siirretään tiedostoon `rules_remastered.js`, ja build.py ja build_play.py upottavat sen.
- play_rules.js ottaa RULESET-objektin (pages-kartta ja noin 10 lippua), ja Remastered-arvot pysyvät oletuksina.
- **Portti:** bfg_data.json byte-identtinen. Korttidumppi kaikista profiileista ja optioista identtinen ennen ja jälkeen. resolveFleet identtinen kaikille rostereille (play/rosters.json ja golden_fleet_cases). acceptance.py vihreä ilman muutoksia, 358 + 88 goldenia läpi, test_domain, test_validator, test_play ja play_red.py läpi. `node make_fleet_cards.js --check-only` antaa saman raportin (vain luku).
- Huom: app_template.html:ää ei muokata toisen session committaamattomien muutosten rinnalla. Nyt make_fleet_cards.js on M-tilassa ja fleet_card_sheets.js ?-tilassa, joten git status tarkistetaan ennen aloitusta.

### Vaihe 2 – XR-poiminta (2–3 sessiota)
- `xr_extract.py` (~300 r.) tuottaa tiedoston `profiles_raw_xr.json` samassa skeemassa. Mukana ovat sivuoffsetit, x-leikkaus, otsikko–taulukko-linkitys, monirivinen bay-solu ja Holofields / Reactive Hull / "-" stat-regexissä. Id-avaruus kirjaetuliitteellä. PDF-hashit metaan.
- `lists_xr.py` tuottaa tiedoston `lists_raw_xr.json`.
- **Uudelleenkäyttö:** extract.py:n geometria-apufunktiot. Lähtökohtana selvityksen kertakäyttöparserin havainnot.
- **Portti:** Imperium 121/121, Xenos 81/81 (myös Tomb Complex ja Merchant) ja Rulebookin tukiprofiilit 19–20, poikkeukset käsikorjauslistassa. check_profiles-vastine XR-PDF:ää vasten. ksnyder-crosscheck IN-, AdMech- ja Chaos-pisteille, tavoitteena 0 selittämätöntä eroa (tunnetut: Inferno 170/180, Terminus Est). Raakadatasta tehty testikorttiajo print_checkillä, jotta pitkät statisolut näkyvät jo nyt.

### Vaihe 3 – MVP: Imperial Navy + Necron Harvest erillisenä XR-buildina (6–9 sessiota)
- **Valinta:** IN (Gothic Sector, Bastion, Armageddon, Bakka) testaa listarivikohtaisen hinnan (Bakka), torpedotyyppien listatason hinnoittelun, nova cannon -rajan, **secondary commanders** -mekanismin ja reservit. Reservejä voi testata vain MVP-listojen kesken, koska SM- ja AdMech-lähteet tulevat vaiheessa 5. Bastionin Cadia- ja Obscura-variantit joko toteutetaan (mekanismi 20) tai jätetään vaiheeseen 5. Necron Harvest testaa 2-hit-escortin (Jackal), oman crit-taulun Ld-sarakkeineen (Xenos PDF 45), Monumentin automaattisen sijoituksen ja XR:n Necron-VP:n.
- `build_data_xr.py`: omat taulut näille listoille. Olemassa olevaa tiedostoa ei parametrisoida.
- `rules_xr.js`: XR-perustaulut, small-target-kriitti, Brace-lukko, Ld-lattia, VP-säännöt, Necron-taulu, RB-sivuviitteet ja MVP-laivojen sääntötekstit. Lisäksi `build.py --ruleset xr`.
- Play-sivulle 2-hit-escorttien per laiva -hit-rata (G-rakenne, käyttöliittymä ja testit) sekä XR-haarat.
- **Portti:** `referenssi_xr/`, jossa on kirjasta luettu listasääntötiedosto jokaiselle MVP-listalle (NN_*.json-tyyliin, check_reference-vastine) ja noin 40–60 goldenia (`golden_cases_xr.json`). acceptance.py:hin `--ruleset xr`, ja dataneutraalit askeleet ajetaan XR-datalle. LUEMINUT_XR aloitetaan, ja Brace-ajoitus kirjataan XT1:ksi. XR-build kootaan, ja kortit menevät print_checkin ja layout_checkin läpi. Pistokoe 2–3 XR-kortille. Play_red-mutaatiot XR-haaroille.

### Vaihe 4 – Kytkin (2–3 sessiota)
- Kaksi JSON-lohkoa, boot-shimmi (globaalit nimet ja alustusjärjestys säilyvät), kulmakytkin, avainperhe `-xr-v1` backup-avaimineen, schemaVersion 5 ja `ruleset`, tuonti ja vienti ruleset-tarkistuksella sekä tiedostonimen tunnus. Play-sivulle dokumentista valittu datasetti, oikea builder-avain, ruleset G:hen ja sormenjälkeen, rosterit piilossa XR:ssä. build_play.py:n poimintavartijat läpi. Julkaisun suojaus make_site.py:hin ja make_share_zip.py:hin. Tekemättömät faktiot piilotetaan XR-tilassa, ja kattavuus näytetään kerran srclinessä.
- **Portti:** test_save.js:n XR-haara ja fuzz_save molemmille. Remastered-tallennus pysyy tavulleen samana kääntö edestakaisin -testissä, ja 1.1-sivu hylkää XR-dokumentin. Uudelleenlataus palauttaa näkymän. make_fleet_cards --check-only ennallaan. make_site kaatuu, jos HTML:ssä on XR-lohko ilman lupaa.
- **Tämän jälkeen käyttäjällä on toimiva kulmakytkin MVP-laajuudella. MVP vie yhteensä noin 13–19 sessiota.**

### Vaihe 5 – Imperium loppuun (9–14 sessiota)
- Chaos (7 listaa: Marks (5), Daemonship-tasot, CSM-miehistö, Abaddon, Chaos Space Hulk -taulu), SM (Venerable-johdannaiset, strike cruiser -variantit, Fortress-Monastery-taulu), AdMech (17 Mechanicus-varianttia, Gifts-taulu, Mechanicus-kriittiheitto), IN:n Ramilies ja Bastion-variantit, Inquisition ja RT (Fleet Detachment "joined list" -käsitteenä, Man O' War -runkorakentaja, Xenos Cutter, RT:n 2-hit-escortit).
- **Portti:** referenssi_xr ja goldenit per lista, pistokoe, ksnyder-crosscheck.

### Vaihe 6 – Xenos (12–18 sessiota) – sisältää blockerin
- Järjestys helposta vaikeaan:
  1. Dark Eldar: pakollinen pattern-valinta (gmin), oma crit-taulu ja Tormentor Spire -taulu.
  2. Eldar: XR-holofieldit (play-sivu), famous craftworldien prosenttirajat, Haven Spire -taulu ja 7 uutta runkoa.
  3. Tau ja Demiurg: koukut, orbitaalien koostehinta, yhdistetty lista ja Demiurg War Host.
  4. Orkit: kaksoistulivoima (myös play_rules num()), looted-muunnos, klaani +50 %, Space Hulk- ja Rok-taulut.
  5. Tyranidit: gene templatet. Tämä on blocker, koska se vaatii templatesta riippuvan pakollisuusmallin. Toistuvien asesettien summaus on jo olemassa. Arvio pelkälle tälle osalle on 3–5 sessiota.
- **Portti:** kuten edellä. Tyranidit voidaan rajata pois, jos template-malli osoittautuu liian raskaaksi.

### Vaihe 7 – General Fleet Support ja refitit (2–4 sessiota, valinnainen)
- 21 tukiyksikköä, support-osiotyyppi, Space Station -crit-taulu sekä 18 + 18 refitiä ja 6 + 6 crew skilliä uniikkiustarkistuksella. Refitit ovat kampanja-ainesta ja voivat jäädä builderista pois.

### Vaihe 8 – Viimeistely ja julkaisupäätös (1–2 sessiota)
- Jäljelle jääneet viitteet, LUEMINUT_XR:n kokoaminen, build.py:n DESC per ruleset ja julkaisuputken päätös lupatilanteen mukaan. Sääntötekstit on tehty jo faktiovaiheissa.

**Yhteensä noin 35–60 sessiota** (ilman vaihetta 7 ja Tyranideja noin 30–50). Arvio on epävarma etenkin vaiheissa 5–6, koska XR:n listaproosaa ei ole luettu kokonaan: Xenos-listat on vasta laskettu, Imperium-listoille ei ole kirjoitettu täyttä parseria, ja faktioiden erityissäännöt on vertailtu vain otoksina. "Sessio" ei ole kalibroitu. Vertailukohdaksi Remastered-sisältö syntyi git-historiassa 186 commitissa 14 aktiivipäivänä (8.–30.9.2026), lisäksi tuli git-aikaa edeltävä työ, ja silti 9.9. kaksi pistokoetta löysi 13 virhettä. Remastered-työstä siirtyvät moottori, käyttöliittymä, kortit, tallennuslogiikka, dataneutraalit laatuportit ja kokemus. Kuratoitu sisältö ja käsin luettu referenssi, jotka olivat Remastered-työn suurin osa, tehdään uudelleen.

---

## 6. Riskit ja avoimet kysymykset käyttäjälle

**Vain sinä voit päättää:**
1. **Faktiolaajuus.** Kaikki 12 faktiota vai ensin Imperium (19 listaa)? Tyranidit ovat kallein (blocker), ja niiden pois jättäminen säästäisi arviolta 3–5 sessiota.
2. **AGENTS.md §1 ja §5.** Avataanko freeze XR:lle ja hyväksytäänkö XR-PDF:t toiseksi auktoriteetiksi, kumpikin omalle rulesetilleen? Onko BACKLOG prioriteetti 3 maalissa?
3. **Kortit.** Pysyykö sovelluksen nykyinen korttiasettelu XR-datalla (suositus), vai pitääkö kortin näyttää XR-kirjan profiililta? make_fleet_cards.js- ja fleet_card_sheets.js-arkit pysyvät Remasteredissa, ellei niiden omistava sessio lisää ?rs-tukea. Ne ovat kuitenkin regressiopinta ja ajetaan --check-only-tilassa.
4. **Lisenssi ja jakelu.** Pidetäänkö XR vain yksityisessä buildissa, vai pyydetäänkö Xca|iberilta (sähköposti RB PDF 3) lupa ennen julkista sivua? Siihen asti julkinen sivu ja share-zip rakennetaan ilman XR:ää, ja assert varmistaa sen.
5. **Kahden rulesetin ylläpito.** Jokainen moottorimuutos testataan jatkossa kahdella datasetillä. XR on jäädytetty, joten sen data ei vanhene, mutta golden-, pistokoe- ja testiajot kaksinkertaistuvat. Remasteredin Fleets WiP -päivitykset jatkuvat ennallaan.
6. **Tallennettu laivasto kääntäessä.** Suositus on erilliset tallennukset, jolloin kääntö näyttää toisen rulesetin omat laivastot eikä muunnosta tehdä. Haluatko lisäksi eksplisiittisen "kopioi luokkanimen mukaan" -toiminnon?
7. **Sivukonventio.** Painettu sivu (suositus, kirjan omat ristiviitteet) vai PDF-sivu?
8. **XR:n epäselvyydet**, joihin tarvitaan tulkinta: Brace-ajoitus (PDF 13 vs 26), Terminus Est 430 vs 420, CSM Battle Barge 440 ilman profiilia, VP-prosenttien pyöristys (XR ei määrittele) ja crippled + disengaged (luettu 25 %:ksi).
9. **Play-sivun laajuus.** Lisätäänkö seurantaan XR:n turret suppression ja torpedo bombers, joita kumpikaan nykyinen versio ei koodaa? Tuodaanko XR:lle valmiita rostereita?
10. **Rajaus.** Vahvistetaanko, että simulaattori, boarding-ratkaisin, Battlezone Generator ja Meta Almanac jäävät kytkimen ulkopuolelle?

**Tekniset riskit:**
- Vaiheen 1 refaktorointi koskee domain.js:ää, play_rules.js:ää ja app_template.html:ää sekä 13 DOMAIN-kuluttajaa. Regressioriski Remastered-tilaan on suurin juuri siinä. Portti on byte- ja dumppivertailu ja täysi acceptance.py-ajo ilman goldenmuutoksia. Rinnakkaiset istunnot samassa monoliitissa ovat lisäriski, ja toisen session korttiputki on kesken.
- Boot-shimmin alustusjärjestys voi rikkoa make_fleet_cards.js:n headless-ajon ja build_play.py:n funktiopoiminnan, vaikka niiden tiedostoihin ei kosketa.
- Tiedostokoko kasvaa arviolta 2,2–2,5 megatavuun, mutta sitä ei ole mitattu. Puhelimen play-sivulla koko kannattaa tarkistaa.
- XR:n pidemmät statisolut ja optiomäärät voivat aiheuttaa korttiylivuotoja, joita Remastered-data ei koskaan tuottanut.
- Uusien mekanismien määrä (~20) on arvio. Jokin listasääntö voi vaatia vielä uuden rule kindin.
- **Ei selvitetty:** faktioiden erityissääntöjen (holofields, Necron, Tyranid) täysi vertailu, XR:n kampanja- ja skenaario-VP:t, natural enemies -listan vastaavuus tiedostoon liittolaismatriisi_2010_faq.txt, ksnyder-datan kenttätason tarkkuus (vain pisteet tarkistettu), Taun waystation-profiilin olemassaolo XR:ssä (PDF 94), Update_Login 148 muutosrivin vaikutus, ovatko acceptance-askeleet coverage ja check_symmetry todella dataneutraaleja, toisen Imperium-2-hit-escortin tarkka nimi sivulla PDF 122 sekä se, jakavatko kaksi file://-HTML:ää localStoragen (merkitsee vain vaihtoehdolle A).
