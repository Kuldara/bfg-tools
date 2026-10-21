# Gothic Fleet Registry — laivastonrakentaja ja korttitulostin

Selaimessa toimiva työkalu Battlefleet Gothic: Remastered -laivastojen
kokoamiseen. Yksi HTML-tiedosto, ei asennusta, ei verkkoyhteyttä
(fontit haetaan verkosta jos on yhteys, muuten käytetään varafontteja).

**Kieli on englanti**, koska työkalu on tarkoitettu myös jaettavaksi
BFG-yhteisölle.

| Tiedosto | Mitä |
| -------- | ---- |
| **`Gothic Fleet Registry.html`** | **Tämä avataan, jaetaan ja tulostetaan.** Ainoa generoitu sovellustiedosto; doctype ja merkistö mukana. |
| `app_template.html` | käyttöliittymän lähde. Data ruiskutetaan `__DATA__`-kohtaan. |
| `bfg_data.json` | poimittu data: 171 alusprofiilia ja 32 laivastolistaa. |
| `extract.py` → `lists.py` → `build_data.py` → `build.py` | koontiketju, ajetaan tässä järjestyksessä. |
| `test_validator.js` / `print_check.js` / `audit.py` | tarkistustyokalut, ks. alla. |
| `make_fleet_cards.js` | tulostaa valmiin laivaston korttiarkin tai rosterin PDF:ksi komentoriviltä, ks. alla. |

## Mitä se tekee

1. **Valitse laivastolista** (30 kpl: Imperial Navy, Chaos, Orks, Eldar,
   Necrons, Tau, Space Marines, Rogue Traders, Adeptus Mechanicus …) ja
   pistemäärä.
2. **Vain sen listan sallimat alukset näkyvät**, ja **sen listan omalla
   hinnalla** — sama runko maksaa eri listoilla eri verran (Dictator on
   Gothic Sectorissa 220 p, Exploratorissa 255 p).
3. **Vain kyseisen aluksen omat optiot** tarjotaan valintaruutuina, ja
   riippuvuudet on kytketty: Terror Shipin boarding torpedoes on
   harmaana kunnes torpedo launcha on valittu.
4. **Laillisuus tarkistetaan elävänä** jokaisen muutoksen jälkeen, ja
   jokainen tarkistus näyttää sen virkkeen sääntökirjasta josta se on
   johdettu.
5. **Tulosta kortit** — samaa muotoa kuin `ship cards` -kansion kortit:
   144 × 135 mm, kaksi korttia per A4 pysty, tulosta 100 %. Osiot, värit ja
   mitat on poimittu suoraan kohde-PDF:istä, ks. alla. **Tulosta rosteri** —
   A4 pysty, koko lista pisteineen ja laillisuustarkistuksineen. Pitkä rosteri
   jatkuu automaattisesti uusille sivuille 14 mm tulostusmarginaaleilla, ja
   taulukon otsikkorivi toistuu.

Nykyinen tuotantoformaatti on **150 % / 2-up A4**. Vanha A6 / 4-up -sukupolvi
on poistettu. Tuleva 6 × 6 tuuman kortti on 152,4 × 152,4 mm ja tarvitsee
1-up A4:n tai 2-up A3:n: kaksi täysikokoista 6 × 6 tuuman korttia ei mahdu
A4:n 297 mm sivulle.

## Kortin ulkoasu

Kortti noudattaa projektin omia `ship cards` -kortteja osio osiolta. Mitat
ja varit on poimittu suoraan kohde-PDF:sta, ei arvattu:

| | |
| --- | --- |
| kortti | 144 x 135 mm, x = 33 mm, y = 16.3 ja 156.7 mm A4-pystylla |
| pohja | `#F6F2E9`, paneelit `#FFFFFF` / `#FAF9F6`, aksentti `#D1792A` |
| osiot | otsikkopalkki, statsirivi, DAMAGE + LOADOUT / OPTIONS, ARMAMENT + SPECIAL RULES / UPGRADES, CRITICAL DAMAGE (2D6), NOTES / STATUS |
| escortit | DAMAGE -> SQUADRON STATE (built / destroyed / remaining) ja CRITICAL DAMAGE -> SQUADRON HIT POINTS / MEMBERS |

### Pystytila kuuluu sisällölle

Kortin korkeus on kiinteä 135 mm, joten jokainen millimetri kehyksessä on
pois ARMAMENT- ja SPECIAL-lohkoista. Otsikkopalkki, tilastopalkki ja
laatikoiden välit on siksi vedetty tiukalle:

| | Ennen | Jälkeen |
| --- | ----- | ------- |
| otsikkopalkki | 13,8 mm | **10,3 mm** |
| tilastopalkki | 13,5 mm | **10,6 mm** |
| LOADOUT-rivi | 29,1 mm | 31,0 mm |
| ARMAMENT + SPECIAL | 44,2 mm | **48,7 mm** |

Alalohkot ovat samassa `flex:1`-rivissä, joten kaikki mitä kehyksestä
säästyy valuu niihin itsestään. Vaikutus näkyy juuri siellä missä pitääkin:
ahtaimman kortin (Hive Ship, 16 optiota) sisällön skaala nousi
**0,36 → 0,46** ja optiolistan **0,54 → 0,59**, yhä nollalla ylivuodolla
442 kortista.

**DAMAGE on kaksi kaistaa.** Ylärivi on ehjät hitit, alarivi
crippled-puolisko omalla otsikollaan (*CRIPPLED from box N*). Jako on nyt
rakenteessa eikä pelkässä ruudun värissä, ja koska ruudut eivät enää ole
yhtenä pitkänä jonona, lohko mahtuu 56 mm:n sijaan **38 mm**:iin — LOADOUT
sai 16 mm lisää vaakatilaa. Kaksi runkoa kantaa 40 hittiä; niillä ruutu
pienenee automaattisesti (`hp-big`), jottei kaista veisi kahdeksaa riviä.

**Faktiovarit.** Orkit, Adeptus Mechanicus, Tyranidit, Necronit ja Chaos
kayttavat taysin samoja pareja kuin painetut kortit. Muut listat saivat
oman parinsa samalla reseptilla (tumma runkovari + luettava valisavy):

| Lista | Tumma | Palkki |
| ----- | ----- | ------ |
| Orks | `#183625` | `#47764C` |
| Adeptus Mechanicus | `#4B1018` | `#8B2635` |
| Tyranids | `#351747` | `#824594` |
| Necrons | `#123735` | `#277369` |
| Chaos | `#24152E` | `#63376F` |
| Imperial Navy | `#14243F` | `#2E4C7E` |
| Space Marines | `#22303A` | `#46626F` |
| Eldar | `#12303F` | `#2C6A8C` |
| Dark Eldar | `#1A1424` | `#4A3A6B` |
| Tau / Demiurg / Kroot | `#33240C` | `#8C6520` |
| Rogue Trader / Merchant | `#2E2A1A` | `#6E6338` |
| Inquisition | `#1C1618` | `#5A403F` |

**Aselajien varit.** G, T ja O ovat painettujen korttien omat; L, N, R ja P
ovat uusia, jotta lanssit, nova cannonit, rammit ja Taun pulssiaseet eivat
jaa saman geneerisen patterivarin alle.

| | Aselaji | Merkki | Rivi |
| - | ------- | ------ | ---- |
| **G** | battery, gunz, muut | `#A97913` | `#F4E5BC` |
| **T** | torpedot | `#5B646D` | `#E5E8EA` |
| **O** | launch bay, attack craft | `#70469A` | `#E9DEF3` |
| **L** | lance | `#1F6F8B` | `#DCEAF0` |
| **N** | nova cannon, bombardment | `#A33A2E` | `#F6DFDB` |
| **R** | ram, klaw, boarding | `#7A5230` | `#EFE2D4` |
| **P** | pulse, railgun, ion | `#2E6B4A` | `#DFEDE2` |
| **M** | orbital mines (otettuna launch bayn tilalla, Fleets s.23 / s.512) | `#6B6E1C` | `#EEF0D8` |

## Optiot: rakennettava kortti

Jokaisella aluksen optiolla on builderissa kolme tilaa:

| Tila | Pisteet | Kortilla |
| ---- | ------- | -------- |
| **Take** | lasketaan mukaan | rivi rastitettuna |
| **Option** *(oletus)* | ei lasketa | rivi tyhjana ruutuna, hinta nakyvissa |
| **Hide** | ei lasketa | ei tulostu |

Oletus on **Option**, joten kortti on lahtokohtaisesti rakennettava: se
tulostuu tyhjine ruutuineen ja hintoineen, ja pelaaja rastii poydalla mita
otti. Sama ajatus kuin kansion `prototyypit/PROTO_Peruskortit_valinnoilla`
-kortissa. Kun haluat kortin jossa valinnat ovat jo kiinni, laita ne
**Take**-tilaan - silloin ne myos maksavat pisteita ja nakyvat rosterissa.

Riippuvuudet sailyvat: optio joka edellyttaa toista (esim. Terror Shipin
boarding torpedoes vaatii torpedo launchan) ei mene Take-tilaan ennen kuin
edellytys on Take.

**Pitkien optiolistojen sovitus.** Lähtöfontti ja option lohkon korkeus
valitaan option määrän mukaan, minkä jälkeen sisältö sovitetaan vielä mitatun
todellisen korkeuden perusteella. Tämä ei ole leikkausraja: kaikki nimet,
hinnat ja kuvaukset säilyvät. Jokainen
kortin sisältölaatikko — optiot, aseistus, erikoissäännöt, damage ja criticalit —
skaalautuu itsenäisesti niin pieneksi kuin tarvitaan. Kovaa minimiskaalaa ei ole,
eikä sisältöä piiloteta tai päästetä laatikon ulkopuolelle.

Escortin profiilioption hinta kerrotaan automaattisesti squadronin alusten
määrällä. Esimerkiksi kaksi 30 pisteen Gruntia ja +5 pistettä / alus maksavat
70 pistettä, eivät 65.

**Automaattisesti aina mukana** ilman erillista valintaa: aluksen
SPECIAL-lohko, profiilin ulkopuoliset faktio- ja asetyyppisäännöt,
faktiokohtainen critical-taulukko, crippled-saanto, escorttien yhden osuman
saanto ja koko aseistustaulukko varikoodattuna. STR/FP-sarakkeessa käytetään
vain kortille sopivia lyhenteitä, kuten `Sqn`, `Cap.` ja `Spec.`.

## Listan päivitykset: re-roll ei ole toinen amiraali

Kirjan listaosio *0-1 Admiral* sisältää sekä komentajavaihtoehdot että
niiden re-roll -rivit samassa pystyrivissä. Aiemmin rakentaja luki
jokaisen rivin yksiköksi, joten yksi amiraali ja yksi re-roll näyttivät
**kahdelta amiraalilta** ja määrätarkistus valitti aiheetta.

Nyt jokainen listarivi on luokiteltu (`upgrades.py`):

| Laji | Mikä | Lasketaanko osiorajaan |
| ---- | ---- | ---------------------- |
| `unit` | rivi jolla on alusprofiilin sivuviite | kyllä |
| `cmd` | komentaja — tunnus `(Ld 9)`, `(+1 Ld)` tai nimetty hahmo | kyllä |
| `up` | lisäosto: re-roll, Mark, gubbins, klaani, Dakka Dakka | **ei** |

Päivitystä ei voi enää lisätä omana rivinään. Se valitaan siinä
yksikössä johon se kuuluu, samalla kolmitilaisella rastilla kuin aluksen
omat optiot, ja se maksaa pisteitä vasta **Take**-tilassa. Kohteet
lasketaan valmiiksi dataan:

- osion sisällä, kun päivitykset ovat kaikkien yksikkörivien jälkeen →
  ne tarjotaan jokaiselle osion yksikölle (esim. Admiral-osion kolme
  re-roll-riviä kaikille kolmelle amiraalille)
- osion sisällä, kun rivit ovat lomittain → päivitys kiinnittyy
  lähimpään edeltävään yksikköön (esim. Tyranid ESCORTS, jossa jokaisella
  aluksella on omat bio-aseensa)
- otsikko nimeää kohteensa → *Admiral Re-rolls* osuu amiraaleihin,
  *Master of the Fleet Re-rolls* vain Master of the Fleetiin
- kohteeton → laivastonlaajuinen, tarjotaan mille tahansa alukselle
  ("Other fleet-list upgrades" -listan alla)

Aseenvalintaosio kuuluu sitä edeltävälle alukselle. Tyranidilistassa
*One prow weapon* ja *One thorax weapon* esiintyvät kahdesti — ensin hive
shipin hinnoilla, sitten cruiserin — joten ne kiinnitetään edeltävän
osion runkoon eikä koko laivastoon.

Päällekkäisyys karsitaan yksikkökohtaisesti: jos päivitys on jo aluksen
omana optiona samalla hinnalla, sitä ei tarjota toistamiseen. Näin sama
bio-ase tai Torture-risteilijän lisäase ei voi tulla ostetuksi kahdesti.
Suodatus on yksikkökohtainen eikä datassa, koska sama sääntö voi olla
päällekkäinen yhdellä aluksella ja tarpeellinen toisella — esimerkiksi
orkkien *boarding torpedoes +5* on Gorbag's Revengen oma optio, mutta
muille orkkien torpedoaluksille se tulee vain listan ORDNANCE-säännöstä.

Saman ryhmän päivitykset sulkevat toisensa: re-rolleista, Markeista ja
klaaneista voi olla voimassa vain yksi kerrallaan. Pakolliset
päivitykset (kulttilistojen Warmasterin Mark) ovat valmiiksi valittuina,
lukittuina ja aina hinnassa.

### Leipätekstiin jääneet hinnoitellut päivitykset

Kirja hinnoittelee osan päivityksistä pelkässä leipätekstissä, jolloin ne
eivät koskaan päätyneet listan riveiksi eikä niitä voinut valita.
`upgrades.py` poimii ne **lähdelauseeseen sidottuina**: jokainen lisäys
vaatii, että sen lause todella löytyy kyseisen osion sääntötekstistä, ja
lause tallennetaan rivin perusteluksi näkyviin. Jos kirjan sanamuoto
muuttuu, lisäys jää tekemättä ja ajo huomauttaa siitä — mitään ei keksitä.

**Myös FLEET RULES -lohkosta.** Osassa listoista sama asia on kirjoitettu
yhteen isoon sääntölohkoon ilman omaa osiootsikkoa. Ne jäivät aluksi
kokonaan pois — AdMechin Power Ram, Nova Cannon ja plasma-boosted
batteries olivat juuri tällaisia. Lisäksi kirja kirjoittaa faktion
yhteiset säännöt kerran, ja saman faktion muut listat nojaavat niihin:
Power Ram on Imperial Navyn sivuilla 29–34, ja Bastion, Armageddon ja
Bakka perivät sen. Siksi säännölle voi antaa **lähdelistan ja
kohdelistat erikseen**, ja rivit menevät kohdelistan osioon
*FLEET UPGRADES*.

Kokonaiset hinnastotaulukot poimitaan samalla tavalla omiksi
osioikseen: Tyranidien 11 bio-parannusta (*BIO-ENHANCEMENTS*) ja Da Ork
Clanzin 12 Gubbinsia (*GUBBINS*) olivat ladottuina leipätekstin sekaan
pisteviivariveinä.

Näin saadaan mukaan 113 riviä, muun muassa:

- Chaosin Warmasterin `+25` lisä-re-roll ja kulttilistojen **pakollinen
  Mark** (Khorne +20, Nurgle +35, Tzeentch +25, Slaanesh +25)
- Chaos Lordin `+25` re-roll ja Chaos Space Marine -miehistö `+35`
  sekä Chosen Terminators `+10`
- Orkkien **Dakka Dakka**: `+2 turrets` `+20` ja escorteille
  `+1 turret` `+5 / alus`
- Da Ork Clanzin ilmainen Warlord ja kuusi klaanipäivitystä
- torpedo bombers per launch bay (Bakka, Explorator, Iyanden, Demiurg,
  Da Ork Clanz), Bakkan `+1 turret`, Rogue Traderin Power Ram ja
  Xenotech, inkvisiittorin ja piraattikapteenin re-rollit
- AdMechin **Power Ram** `+5`, **Nova Cannon** `+20` (risteilijä) ja
  `+10` (Retribution), **plasma-boosted batteries** `+10`, escorttien
  `+1 turret` `+5 / alus` ja Endeavourin/Endurancen ilmainen dorsal lance
- orkkien **torpedo-bommat** ja boarding torpedot kaikissa kolmessa
  listassa, Tau'n **Improved Logic Engines** `+10`

### Hinta launch bay -voimakkuuden mukaan

`+10 points per launch bay` ei ole `+10`. Kirja sanoo tämän itse:
*"This means a Terror Ship must pay +40 points and a Space Hulk must pay
+160 points to use Torpedo Bommas."* Hinta kerrotaan siis aluksen
laukaisukansien **yhteisvoimakkuudella** — Terror Shipillä 2 + 2 = 4,
Ork-hulkilla D6+2 + D6+2 = 16 maksimin mukaan. Rakentaja näyttää
laskutoimituksen auki: `+10 x 4 bays = +40`. Jos jokin rivi on
epäselvästi ladottu, perään tulee `(check)`.

### Kelpoisuusehdot ja profiilin muutokset

Osa päivityksistä koskee vain tiettyjä aluksia, ja kirja sanoo ehdon
sanallisesti. Ehdot ovat nyt konetarkistettavia: Power Ram vaatii 6+
keulapanssarin eikä käy alukselle jolla on Nova Cannon; Nova Cannon
vaatii risteilijän (ei kevyen) jolla on keulatorpedot; escorttien
`+1 turret` ei näy capital shipillä. Ehtoa arvioidaan **valitusta**
kokoonpanosta ja aina päivityksen oma vaikutus poissuljettuna — muuten
*"vaatii keulatorpedot"* kumoaisi itsensä heti kun torpedot on vaihdettu
Nova Cannoniin. Jos valinta menettää kelpoisuutensa toisen valinnan
takia, se otetaan pois eikä jää maksamaan pisteitä hiljaa.

Päivitys voi myös **muuttaa profiilia**: vaihtaa aseistusrivin
nimihahmon perusteella (plasma-boosted 30 cm → 45 cm), lisätä rivin
(AdMechin pakollinen 60 cm dorsal lance) tai muuttaa tilastoa (AdMechin
pakollinen `+1 turret`). Molemmat AdMech-muutokset sisältyvät jo
pistehintaan, joten ne ovat automaattisesti päällä ja kortti näyttää
muutetun arvon. **Kumpikin vahvistuu riippumattomasta
BSData-katalogista**, jossa AdMech-Lunarilla on 3 turrettia ja oma 60 cm
dorsal lance.

Kolme sääntöä jää tarkoituksella tekemättä, ja ajo kertoo miksi:
Black Crusaden Warmasterilla ei ole pakollista Markia, Tzeentchin Lordin
re-roll tulee Markin mukana (Mark on jo oma hinnoiteltu rivinsä), ja
Space Marine -listan ORDNANCE ei sisällä torpedo bombereita.

## Valikkoaseet: Hide poistaa aseen myös taulukosta

Osalla aluksista kirjan aseistustaulukko ei ole varustus vaan **valikko**.
Hive shipin taulukossa ovat kaikki keula-, thorax- ja sivuaseet, joista
ostetaan yksi kustakin paikasta — eivät kaikki yhtä aikaa.

Aiemmin **Hide** poisti rivin vain LOADOUT-lohkosta, ja ase jäi silti
aseistustaulukkoon: kortti väitti alusta, joka ampuu kaikilla
vaihtoehdoilla samanaikaisesti. Nyt sääntö on sama kuin muillakin
optioilla:

| Tila | Aseistustaulukko |
| ---- | ---------------- |
| **Take** | rivi näkyy, ruutu rastitettuna |
| **Option** | rivi näkyy, ruutu tyhjänä — valinta tehdään pöydällä |
| **Hide** | rivi katoaa |

Rivi jolla ei ole yhtään valikko-optiota on vakioaseistusta eikä katoa
koskaan — esimerkiksi Hammer-battlekroozerin keulagunz jää, vaikka sen
toissijainen keula-ase piilotetaan.

Kytkentä on `build_data.py`:n `WEAPON_MENU`-taulukossa: **optio kertoo
mihin aseistusriviin se osuu**. Indeksit on kirjoitettu käsin ja
tarkistettu rivi riviltä, koska nimet toistuvat samassa taulukossa —
hive shipillä on kaksi *Pyro-acid batterya* ja kaksi *Bio-plasma spinesia*
eri paikoissa, eikä automaattinen nimihaku osaisi erottaa niitä. Ajo
kaatuu, jos jokin indeksi osoittaa olemattomaan riviin tai optioon.

Katettuna 12 alusta: Dragonship, Wraithship, Shadowhunter, Torture,
Corsair, Hammer, Hive Ship, Tyranid Cruiser, Kraken, Vanguard Drone,
Escort Drone sekä Orbitals ja Waystation. Sivuparit (Port + Starboard)
ovat yksi valinta ja kaksi riviä, ja hive shipin kolme sivusettiä
osoittavat samoihin riveihin, koska kirja tulostaa sivuaseet kerran.

Aseen nimi lyhennetään näytölle samalla tavalla kuin kantama ja voima
(`shortWeaponName`): vain vakiintuneet lyhennykset, ei sanojen katkaisua.
Rastiruutu vie nimisarakkeesta noin kolme merkkiä, ja ilman lyhennystä
taulukon pisin nimi *Port / Starboard Launch bays* typistyi.

## Asevaihdot aseistustaulukossa

Optio *"May replace its prow heavy gun battery with a torpedo launcha
(Speed 30 cm, Strength D6+2)"* muuttaa aseistustaulukkoa, ei vain
tekstiä. `swaps.py` jäsentää korvattavan rivin ja korvaajan tilastot, ja
kortti näyttää lopputuloksen option tilan mukaan:

| Optio | Aseistustaulukko |
| ----- | ---------------- |
| **Take** | korvattu rivi poistuu, korvaaja tilalle **merkittynä** |
| **Option** | molemmat rivit näkyvissä; **perusrivi on merkitty**, koska se on se ase joka on käytössä kunnes vaihto tehdään |
| **Hide** | vain alkuperäinen rivi |

Korvaava rivi saa oman värikoodinsa ja oman tähtiviittauksensa
erikoissääntöön: Terror Shipin *Prow torpedo launcha* viittaa *Ork
Torpedo Launchas* -sääntöön aivan kuten alkuperäinen rivi omaansa.

24 vaihto-optiosta 21 jäsentyy. Loput kolme jäävät tekstiksi, koska ne
ovat aidosti monitulkintaisia (Murder class korvaa yhden aseen kahdella,
Lite Kroozer tarjoaa kaksi vaihtoehtoa, Omnissiah's Victoryn kohta on
leipätekstiä). Jäsennin on tahallaan tiukka: väärin arvattu ase olisi
pahempi kuin puuttuva.

## Vaihtoehtoryhmä ja kaariruusuke

Aseistustaulukossa on kahdenlaisia rivejä: **vakioaseita**, joita ei valita,
ja **valintarivejä**. Valintarivit jakautuvat vielä kahtia, ja ero näkyy
merkin muodossa:

| Merkki | Merkitys |
| ------ | -------- |
| **neliö** | itsenäinen valinta — valikkoase, jonka voi ottaa muista riippumatta |
| **ympyrä** | valitse yksi ryhmästä — perusrivi ja sen korvaajat |

Ympyräryhmä on **yksi aseen paikka**, ja siinä on aina tasan yksi täytetty
ympyrä. Se on mahdollista siksi, että perusrivi on taulukossa vain silloin
kun mitään korvaajaa ei ole otettu — jolloin se on määritelmällisesti se ase
joka on käytössä. `print_check.js` tarkistaa tämän invariantin jokaiselta
kortilta.

Aiemmin ryhmässä saattoi olla nolla merkkiä eikä kortilta nähnyt kumpi ase
on voimassa. Ryhmää myös *erotti* paksu katkoviiva, joka oli väärin päin:
rivit kuuluvat yhteen. Viiva ei ollut suunniteltu vaan seuraus säännöstä
joka asetti pelkän `border-top-style`n — leveydeksi jäi `medium` (3 px) ja
väriksi `currentColor`, kun kortin muut viivat ovat 0,4–0,7 pt. Tilalla on
nyt pystypalkki, joka kulkee ryhmän läpi. Ryhmitys ei voi olla värissä,
koska rivien taustaväri tulee asetyypistä.

Ryhmien väliin jää tyhjä väli, ja se on **oma rivinsä eikä täytettä**.
Täytteenä se ei toimisi: rivin taustaväri täyttää myös täytteen, joten
kahden samanvärisen rivin välissä — *Prow bombardment cannon battery* ja
*Prow bombardment cannon* ovat molemmat punaisia — rako ei näkyisi
lainkaan. Välirivin `tbody` on `gp`, ei `g`, joten se ei saa palkkia.

**Fire Arc on kuva, ei tekstiä.** Neljä lohkoa, etu ylöspäin: tumma lohko on
kiinteä kaari, harmaa on valittavissa oleva. Ruusuke on samalla se ruutu
johon käytetty kaari merkitään, joten erillistä kirjoitusruutua ei ole.

Syy on mitattu: 442 kortin 1829 aserivistä **438 kaarisolua katkesi
ellipsiksi**, `L/F/R` yksin 326 kertaa. Sarake oli 10,3 mm, josta
kirjoitusruutu vei 6,6 mm — tekstille jäi 1,3 mm, eli mikä tahansa
yhtä kirjainta pidempi kaari katkesi. Kuvana sarake tarvitsee 5,8 mm.

### Sarakkeet

Vapautunut tila meni nimisarakkeelle. Samalla kapeat sarakkeet saivat
rivittyä ja ylipitkät solut pienennetään katkaisun sijaan.

| Sarake | Ennen | Jälkeen | Katkaistuja soluja ennen → jälkeen |
| ------ | ----- | ------- | ---------------------------------- |
| Armament | 38,4 mm | **42,9 mm** | 10 → 0 |
| Range/Speed | 13,2 mm | 13,2 mm | 131 → 0 |
| Str/FP | 11,9 mm | 11,9 mm | 41 → 0 |
| Arc | 10,3 mm | **5,8 mm** | 438 → 0 |

Kolme eri keinoa, koska sarakkeet ovat erilaisia:

- **Nimisarake** pysyy yhdellä rivillä — rivitetty asenimi näyttäisi
  rikkinäiseltä — ja sen kuusi ylipitkää solua pienennetään enintään
  0,8-kertaisiksi.
- **Range ja Str rivittyvät.** Pisimmät arvot ovat kaksisanaisia
  (*Thunderhawk: 20 cm*, *Cap. 1 Orca/Warden*) ja mahtuvat kahdelle
  riville. `shortStrength` lisää kauttaviivan jälkeen näkymättömän
  katkaisukohdan, koska ilman sitä selain ei saa katkaista *Orca/Wardenia*
  mistään.
- **Moniarvoinen kantama** tiivistyy pelkiksi luvuiksi: `30/20/30`.
  Yksikkö jää pois, koska otsikko sanoo jo Range.

Pelkkä fonttien pienentäminen ei olisi riittänyt: mittaus osoitti, että se
olisi vienyt 61 solua 71:stä alle 0,7-kertaiseen kokoon ja yhden 0,25:een.
Se ei ole parannus katkaisuun nähden vaan toinen tapa hukata tieto.

**Pystytila ei muuttunut.** Ruusuke on täsmälleen sen kirjoitusruudun
korkuinen jonka se korvasi (3,2 mm), joten rivikorkeus säilyi ja
`?layout-audit=1` antaa saman `minZoneScale`-arvon 0,3604 kuin ennen
muutosta — nollalla ylivuodolla 442 kortista.

## Download for editing

`Print cards` -napin vieressä on **Download for editing**. Se lataa
täsmälleen saman arkin itsenäisenä HTML-tiedostona, jossa tekstiä voi
klikata ja kirjoittaa päälle.

Se ei ole uusi taitto vaan **sama DOM jonka Print tekee**, käärittynä
omaksi tiedostokseen: samat `@page`-säännöt, sama CSS, sama
`print-color-adjust`. Siksi Ctrl+P → *Tallenna PDF:nä* antaa ladatusta
tiedostosta identtisen tuloksen kuin tulostus suoraan sovelluksesta.

Kolme asiaa tekee siitä käyttökelpoisen eikä vain avattavan:

1. **Sovitus ajetaan uudelleen jokaisen muokkauksen jälkeen.** Kortin
   lohkot kutistetaan mahtumaan mittaamalla. Jos skaalat paistettaisiin
   kiinteiksi, pidempi teksti valuisi laatikon yli — juuri se raja jota
   koko projekti pitää. `fitCards` menee mukaan **lähdekoodina**
   (`fitCards.toString()`), ei kopiona, joten sovituslogiikka ei pääse
   eriytymään. Testattu: 3 880 merkin lisäys kutisti lohkon skaalaan
   0,48 eikä ylittänyt laatikkoa.
2. **Tallenna muokattu kopio** -nappi. Muokkaukset elävät DOMissa eikä
   Ctrl+S tallenna niitä luotettavasti; ilman tätä työ katoaisi
   välilehden sulkiessa.
3. **Liittämisen siivous.** `contenteditable` päästäisi selaimen
   työntämään merkintää liitetyn tekstin mukana; `plaintext-only` ja oma
   paste-käsittelijä pitävät kortin puhtaana.

**Muokkausisäntänä on kokonainen sivu**, ei yksittäiset tekstit. Kaikki on
valittavissa ja poistettavissa, myös rakenne: Ctrl+A ja Delete sivun sisällä
tyhjentää arkin.

Ensimmäinen versio merkitsi muokattavaksi vain lehtielementit joissa oli
tekstiä, ja silloin ulkopuolelle jäivät kaikki elementit joilla on lapsia —
osiotunnisteet (`h4` + `em`), aseistuksen nimisolu (värilaatta + tähti +
teksti), kaarisolu ja kriittisten vaurioiden rivit. Niitä ei saanut
poistettua. Nyt kaikki viisi ovat muokattavissa.

Rakenteen saa rikki, ja se on tarkoitus: arkki on tehokäyttäjän työkalu,
jossa vastuu on käyttäjällä. Väärin menneen korjaa lataamalla arkin
uudelleen builderista.

Kaksi asiaa jotka CSS piirtää eikä niitä voi muokata tekstinä:

- **rastiruudun X ja valintaympyrän piste** — merkkiä klikkaamalla se
  kääntyy päälle ja pois (`.k-opt .cb`, `.k-arm .wb`, `.k-arm .rb`).
  Ympyrä käyttäytyy ryhmävalintana: yksi päälle, sisarukset pois.
- **sääntöluettelon luetelmamerkki** — katoaa kun rivin poistaa

**Ladattu arkki on tuloste, ei builderin tila.** Muokkaukset eivät palaa
builderiin eivätkä päivitä pisteitä. Se sopii korjauksiin ja
käsinlisäyksiin, ei laivaston rakentamiseen.

### Kaksi ansaa jotka tämä kaivoi esiin

**Kirjaimellinen `<script>`-avaustagi lähdekoodissa katkaisee testit.**
Selaimen jäsennin ei siitä välitä (vain sulkeva tagi päättää lohkon),
mutta `test_*.js` ja layout-audit poimivat sovelluksen koodin jakamalla
tiedoston sillä merkkijonolla ja ottamalla `[1]`. Toinen esiintymä
katkaisi poiminnan kesken merkkijonoa ja node kaatui. Tagi kootaan nyt
paloista, ja `build.py` tarkistaa että avaustageja on tasan yksi.

**Ladatun tiedoston skripti kääritään IIFE:en.** Ilman sitä se kaatui
`Identifier '$' has already been declared` -virheeseen, jos sivulla oli
jo `$` määriteltynä — jolloin sovitusta ei ajettu lainkaan eikä
muokkauskuuntelijaa kytketty. Tiedosto olisi *näyttänyt* toimivan.
`test_upgrades.js` kääntää kootun skriptin `new Function`illa, mikä
paljastaa lainausmerkki- ja kenoviivavirheet heti.

## Korttiarkki PDF:ksi komentoriviltä

`make_fleet_cards.js` tekee saman kuin *Print cards* → *Tallenna PDF:nä*, mutta
ilman selainta ja käsityötä. Se ottaa kopion tiedostosta
`Gothic Fleet Registry.html`, ruiskuttaa loppuun käynnistysskriptin joka
rakentaa rosterin ja kutsuu **sovelluksen omaa `buildCardSheet()`:iä**, ja
tulostaa sivun headless-Chromella.

```bash
node make_fleet_cards.js               # kaikki maaritellyt arkit
node make_fleet_cards.js crusade       # vain yksi
node make_fleet_cards.js crusade --keep-html
```

Kortteja ei siis piirretä uudestaan node-DOMiin. Se on tarkoituksellista:
kortin lohkot sovitetaan **mittaamalla** (`fitCards`), ja mittaaminen vaatii
oikean selaimen — node-DOM antaisi väärät skaalat. Ero
`print_check.js`:ään on juuri tämä: se tarkistaa kortin *sisällön* ilman
selainta, tämä tuottaa kortin *ulkoasun* selaimella.

Arkit on määritelty tiedoston alussa `SPECS`-oliossa: listan nimi,
pistekatto, alusrivit ja niiden nimet. `kind: "roster"` vaihtaa tulosteen
rosteriarkiksi. Optioihin ei kosketa, jolloin ne tulostuvat **tyhjinä
ruutuina** — kortti on maksimaalisen konfiguroitava. Listan päivitykset
(Honour Guard) ovat oletuksena `off` eivätkä tulostu lainkaan, joten ne
pyydetään erikseen `capUps`-kentällä.

Ensimmäinen käyttäjä on Space Marine Crusade Fleet: kortit menevät kansioon
`tulosteet/valmiit/ship cards/puuttuvat/` ja rosteriarkit kansioon
`tulosteet/valmiit/`.

## Kattohinta

Avoimeksi jätetty optio ei maksa pisteitä, mutta se voidaan rastia
pöydällä — joten listan loppusumma ei yksin kerro, paljonko pelivaraa
tarvitaan. Sekä yksikkörivi, laivaston summa että kortin **LOADOUT /
OPTIONS** -otsikko kertovat siksi myös kattohinnan: *"205 pts as ticked,
max 210"*. Toisensa poissulkevista päivityksistä kattoon lasketaan vain
kallein, koska useampaa ei voi ottaa.

## Faktiolohko: Gifts of the Omnissiah

Adeptus Mechanicus on ainoa faktio jolla on **pakollinen alusta koskeva
D6-taulukko** normaalissa pelissa: *"Mechanicus capital ships must also roll
a D6 once against the Mechanicus Gifts table"* (Fleets s. 119). Muiden
faktioiden vastaavat taulukot (eldarien ja orkkien refitit, crew skills,
Chaos promotions) ovat **kampanjamateriaalia** eivatka kuulu kortille;
niiden tilalla on aina paalla olevia faktiosaantoja.

Siksi lahjataulukko on kortilla vain AdMechilla, SPECIAL RULES -lohkon
ylaosassa kahtena sarakkeena. Numero on ulkoreunallinen ympyra, jotta
heitetyn lahjan voi varittaa. Aluksen omat saannot jatkuvat sen alla
normaalisti.

**Rajaus.** Lahjat ja korjausbonus koskevat vain Explorator-listan
capital shipeja. Listan escortit otetaan Imperial Navy- ja Space Marines
-listoilta *"otherwise unmodified from their normal profiles"* (Fleets
s. 125), joten ne eivat ole Mechanicus-aluksia: niilla ei ole lahjalohkoa
eika +1D6 korjausta. `print_check.js` valvoo molempia suuntia.

## Vakiorivien siivous

| Rivi | Ennen | Nyt |
| ---- | ----- | --- |
| kriittisen laukaisin | oma rivi erikoissaannoissa | CRITICAL DAMAGE -otsikkorivilla (`through shields: 6 -> 2D6`) |
| REPAIR, vakio | 2 rivia | `REPAIR: End Phase, D6 / remaining Hit; 6 = 1 crit; blast contact 1/2 dice.` |
| REPAIR, necronit | pitka, `4+` | sama lyhyt muoto, `4+ = 1 crit` |
| REPAIR, AdMech | **vaara** geneerinen rivi | `ALL ADMECH: REPAIR +1D6.` (Fleets s. 120) |

Eldarin ja Dark Eldarin laukaisin poikkeaa vakiosta (`every Hit: 4+` /
`every Hit: 6`), joten ne pysyvat oikeina saantorivaina.

Vaikutus luettavuuteen mitattuna 442 kortilla: alle 5 pt jaavia lohkoja
144 -> 140, alle 4 pt 68 -> 61. Yksi kortti huononi: **Omnissiah's Victory**
putosi 2,59 pistekokoon, koska silla on jo entuudestaan kahdeksan omaa
saantoa ja nyt lisaksi kuusi lahjaa. Korjaus on siirtaa pakolliset
aluskohtaiset saannot LOADOUT-lohkoon referenssin tapaan; se on
suunnitelmassa mutta ei viela toteutettu.

## Mitä se valvoo ja mitä ei

Tämä on työkalun tärkein ominaisuus, ja se on tehty läpinäkyväksi.
Sääntötekstit ovat proosaa; osa on koneellisesti tulkittavissa, osa ei.

**Valvotaan (129 sääntöä 30 listalla).** Jokainen näistä näyttää
lähdevirkkeensä tarkistuksen alla:

| Tyyppi | Esimerkki |
| ------ | --------- |
| pisteraja | 1225 / 1250 |
| osiokohtainen katto | `0-12 Cruisers` |
| suhdeluku | *You may include 1 battleship for every three cruisers in the fleet.* |
| kokonaiskatto | *You may include up to six kroozers in your fleet.* |
| pisteisiin sidottu määrä | *…a max. of one Warlord per 500 points.* |
| pakollisuusraja | *If the fleet is worth 1,000 points or more, a Mechanicus Archmagos must be included…* |
| squadronin koko | *…in squadrons of 2–6* |
| rivikohtainen raja | `(0–1) Dethdeala` |

**Ei valvota (n. 1200 virkettä).** Nämä näytetään sellaisenaan
osioidensa alla merkillä **Check yourself**: ordnance-valinnat, refitit,
kampanjasäännöt, poikkeukset ja kaikki mikä on kirjoitettu muotoon
"unless", "instead of", "may also". Työkalu ei väitä tarkistavansa niitä.

Kunkin laivaston omat sääntösivut (esim. Adeptus Mechanicus s. 118–123:
Mechanicus Gifts, plasma-boosted batteries, nova cannon Gothiciin) ovat
mukana **FLEET RULES** -osiona tekstinä. Niistä tulevat pistelisät
annetaan yksikön **± pts** -kentässä ja kirjoitetaan **Refit / note**
-kenttään, joka tulostuu kortille.

## Rasitustesti ja rakennetarkistus

`print_check.js` ja `?layout-audit=1` ajavat kortit **oletustilassa**. Suurin
osa vioista ei kuitenkaan ole oletustilassa vaan siinä mitä käyttäjä tekee:
vaihto otettu, optio piilotettu, päivitys päällä, laivue täynnä. Kaksi
työkalua kattaa sen aukon.

| | |
| --- | --- |
| `node stress.js [kierroksia]` | jokainen alus jokaisella listalla satunnaisilla optio- ja päivitystiloilla; oletuksena 6 kierrosta / alus, ja lisäksi ääriarvot *kaikki off / opt / take*. Tarkistaa kortin rakenteen, pistelaskun ja tallennuksen. Siemen on kiinteä, joten löydös on toistettavissa. |
| `node qa_structure.js` | datan **sisäiset** viittaukset: osoittaako optio olemassa olevaan aseistusriviin, onko jokainen alus jonkin listan kautta saatavissa, kestääkö laivueen kokolaskenta arvot −5…99. |

Ensimmäinen ajo löysi kaksi vikaa, jotka kumpikaan eivät näy oletustilassa.

**Samaa aseriviä ei voi korvata kahdesti.** Strike Cruiser saa vaihtaa
launch baynsä joko torpedoiksi *tai* pommituskanuunaksi. Molemmat optiot
osoittavat samaan aseistusriviin, ja molemmat pystyi ottamaan: kortille tuli
kaksi merkittyä riviä samaan paikkaan ja kumpikin optio laskutettiin. Sama
koskee Grey Knights Strike Cruiseria ja Chaos Battle Bargea. Nyt
`setOptState` purkaa ristiriidan, ja `load` siivoaa vanhan tallenteen.

**Kahdesta identtisestä painoksesta valitaan oman faktion painos.** Kirja
viittaa Chaos-listoilla Vengeance-risteilijän Imperial Navy -painokseen
(pg. 58), vaikka Chaos-osiossa on sama profiili sivulla 270. Kortti painoi
siis Chaos-laivastoon alaotsikon *Imperial Navy | Grand Cruiser | pg. 58*.
Uudelleenosoitus tehdään vain kun samanniminen profiili löytyy, sen faktio
vastaa listaa ja **tilastot ja aseistus ovat täysin identtiset** — kolmas
ehto on turvaraja, jottei eri alukseen vaihdeta koskaan.

### Poimijasta löytyneet aukot

Rakennetarkistuksen orpolista — alus datassa mutta ei minkään listan kautta
saatavissa — paljasti kolme erillistä vikaa:

**Listarivi katosi, jos hinta oli sana.** Poiminnan hintakuvio hyväksyi
sanamuodot mutta vaati niidenkin perään sanan `pts`. Kirja ei kirjoita sitä:

```
(0-1) Venerable battle barge (pg. 102)............varies
Auxiliary vessels (pg. 191).......................varies
Ghostship (pg. 306)..................................Free
```

Kaikki kolme putosivat hiljaa. Vakavin on **Venerable battle barge**: se on
Space Marine -listojen 0-1 paikka, ja sen mukana katosi ainoa nimetty
esimerkki **Seditio Opprimere** (s. 103). Numerohinta vaatii yhä `pts`,
koska ilman sitä mikä tahansa lukuun päättyvä sisällysluettelon rivi
näyttäisi listariviltä. `Free` on nyt nolla, ei tuntematon.

**Hinta oli jäänyt aluksen nimeen.** Neljällä aluksella PDF painaa hinnan
samalle riville otsikon kanssa sarkaimella erotettuna, jolloin poimija otti
otsikoksi koko rivin. Kaksi niistä oli jo listoilla, eli kortin otsikossa
luki *"Scion Of Prospero, Thousand Sons Battle Barge⇥ 450 Pts"* — ja aluksen
oma perushinta jäi tyhjäksi. Nimi ja hinta erotellaan nyt sarkaimen kohdalta.

**Kolme alusta ei ollut kenenkään saatavissa.** PTHUXUTL WAR CRUISER,
FRA'AL RAIDER ja NEKULLI WHIP (s. 186–188) ovat Xenos Vesselin nimettyjä
variantteja: kirja ei anna niille omaa listariviään, koska ne maksavat saman
50 pistettä. Kullakin on kuitenkin oma aseensa ja omat erikoissääntönsä,
joten yhteinen kortti ei riitä. Ne laajennetaan nyt samalle riville samalla
mekanismilla jolla Taun konfiguraatiot jo hoidetaan, ja laajennus on
itsevarmistava: jos sivun 184 lähdelause katoaa, ajo kaatuu.

Avoimen hinnan (`varies`) lähtöarvoksi tulee profiilin oma hinta — Seditio
Opprimere on 450 pistettä — jonka voi kirjoittaa yli.

## Tarkistustyokalut

Kolme skriptia, jotka ajetaan aina datan tai kortin muutoksen jalkeen:

| Skripti | Mita tarkistaa |
| ------- | -------------- |
| `node test_validator.js` | laillisuuslogiikka, lähdeviitteet, vaihtoehtoiset profiilit ja valintaryhmien reunatapaukset |
| `node print_check.js` | **renderoi jokaisen listan täydet kortit** (442 korttia / 30 listaa) ja vertaa jokaista korttia profiiliin: osiot, statsit, aserivit, värikoodit, STR/FP-lyhenteet, tähtiviittausten ID-parit, optiot, faktiosäännöt, critical-taulukot ja HIT-ruudut |
| `node test_upgrades.js` | listan päivitykset, kiinnityskohteet, pakolliset Markit, asevaihdot kortilla, kattohinta ja tallenteen kestävyys rivien siirtyessä |
| `python audit.py` | vertaa `bfg_data.json` takaisin lahde-PDF:aan rivi rivilta |
| `python crosscheck_bsdata.py` | vertaa datan **toiseen riippumattomaan lähteeseen**, BattleScriben BSData-katalogeihin (`--refresh` hakee tuoreet) |
| `python coverage.py` | käy läpi jokaisen listan koko sääntötekstin ja kertoo, **mikä kirjan hinnoiteltu asia ei ole valittavissa** (`--all` näyttää myös katetut) |

Lisäksi avaaminen osoitteella `Gothic Fleet Registry.html?layout-audit=1`
renderöi kaikki 442 korttia selaimen todellisella tulostus-CSS:llä ja ilmoittaa
mahdolliset sisältöylitykset `body[data-layout-audit]`-attribuutissa.

### Kattavuustarkistus

`audit.py` tarkistaa, että poimitut rivit vastaavat PDF:ää. Se ei kerro
mitään siitä, mitä jäi **poimimatta** — ja juuri se oli suurin
virhelähde: kirja kirjoittaa osan päivityksistä riveiksi ja osan
leipätekstiin, ja leipätekstiin jääneet unohtuvat.

`coverage.py` sulkee tuon aukon. Se lukee jokaisen listan koko
sääntötekstin lause lauseelta, poimii pistehinnan sisältävät lauseet ja
katsoo, löytyykö listalta vastaava valittava rivi. Kohina — laivaston
kokorajat, kampanjasäännöt, skenaariohankinnat — suodatetaan, ja käsin
katselmoidut tapaukset on kirjattu `REVIEWED`-taulukkoon perusteluineen,
jottei samaa lajittelua tarvitse tehdä joka ajolla.

Nykytulos: **146 hinnoiteltua lausetta, kattamatta 0.**

Toinen haku etsii **ilmaiset, pakolliset profiilimuutokset** — hintaan
perustuva haku ei löydä niitä koskaan. Juuri sieltä löytyivät AdMechin
kaksi pahinta puutetta: `+1 turret` kaikille capital shipeille ja 60 cm
dorsal lance jokaiselle risteilijälle.

Kolmas haku etsii **alusrivit jotka jäivät FLEET RULES -lohkoon** kirjan
sivunvaihdon takia. Se nosti 23 tapausta, jotka kaikki osoittautuivat
naapurilistan vuodoksi: jokainen alus oli jo omalla listallaan. Tulos on
negatiivinen mutta tarkistettu.

### Riippumaton ristiintarkistus

`audit.py` todistaa, että poiminta vastaa lähde-PDF:ää. Se ei todista, että
PDF olisi *luettu oikein* niissä kohdin, joissa taulukon geometria on
hankala — jos sarake luetaan väärin, virhe päätyy molempiin.

`crosscheck_bsdata.py` sulkee tuon aukon vertaamalla dataa
[BSData/battlefleetgothic](https://github.com/BSData/battlefleetgothic)
-katalogeihin, jotka ovat yhteisön käsin syöttämä BattleScribe-datasetti
samoista aluksista. Skeema osuu lähes yksi yhteen: `Unit`-profiilissa ovat
Type, Hits, Speed, Turns, Shields, Armour ja Turrets, `Armament`-profiilissa
Range/Speed, Firepower/Str ja Fire Arc.

**BSData seuraa alkuperäistä BFG-kompendiumia, ei Remastered WiP:iä.**
Pistehinnat ja osa arvoista poikkeavat tarkoituksella, eikä ero ole virhe.
Vertailu ei voi kumota lähde-PDF:ää — se kertoo, *missä kohdin* kaksi
lähdettä eroavat, jotta ne voi katsoa käsin.

Nimien vastaavuus ei ole arvattu. Kun automaattinen osuma jää epäselväksi,
pari on käyty läpi käsin ja kirjattu taulukkoon: `ALIAS` kertoo 14 tapausta
joissa sama alus on eri nimellä (*Kraken* = *Tyranid Kraken*), ja `NOT_SAME`
kuusi tapausta joissa samankaltainen nimi tarkoittaa eri alusta
(Space Marine *Battle Barge* ≠ *Chaos Battle Barge*, *Omnissiah's Victory*
≠ geneerinen *Ark Mechanicus*).

Nykytulos: **132 alusta vertailtu, 752 tilastokenttää, 98,9 % identtisiä.**
Kaikki 8 eroa on tarkistettu käsin lähde-PDF:stä ja ne ovat
Remastered-muutoksia, eivät poimintavirheitä — esimerkiksi Vanquisher
15 cm / 5 turrettia (BSData 20 cm / 4) ja Tau-alusten uusi
`6+ front *` -panssari. Alusten hinnoista 122/124 ja komentajien sekä
lisäostojen hinnoista 152/195 täsmää; loput ovat kirjan omia
uudelleenhinnoitteluja (esim. Gothic Sectorin kolme re-rollia 150 pts,
BSDatassa 100).

Työkalu noutaa katalogit hakemistoon `bsdata_cache/`. Sitä ei tarvita
ohjelman ajamiseen, vain tähän tarkistukseen, ja sen voi poistaa.

Nykytila: kaikki viisi ajoa läpi, `print_check` 0 löydöstä, PDF:ään takaisin vertaava
`audit` 0 löydöstä ja selaimen 442 kortin layout-audit 0 ylitystä.

## Lahteesta loydetyt virheet

Auditti löysi kirjasta ristiriitoja. Sivuviitteet ristiintarkistetaan rivin
nimeä vasten: jos ne ovat ristiriidassa, korjaus kirjataan dataan ja näkyy
sekä valikossa että kortilla.

| Loydos | Kasittely |
| ------ | --------- |
| 34 listarivin sivuviite osoitti väärään alukseen (mm. Chaos-listojen `Chaos battle barge (pg. 266)` -> Despoiler, `Styx (pg. 268)` -> Retaliator) | korjattu nimen perusteella, korjaus näkyvissä |
| Inquisition-listan rapid strike vessel -viitteet osoittivat väärään profiiliin | Sword korjattu s. 82:een ja Cobra s. 84:ään |
| `Zukov's Klaw` painettu muodossa `(pg. 377)). 2310 pts` | luettu 310 pisteeksi, viite korjattu |
| Rogue Trader -profiilien kaksi `[???]`-Xenotech-ristiviitettä (s. 184 ja 192) | korjattu Xenotech-säännön sivulle 175 |
| `Aspect Warrior Host (pg. 305)` osoittaa sääntösivulle, ei alusprofiiliin | käsitellään oikein päivityksenä, ei aluksena |

Poimijasta löytyi samalla useita omia reunatapauksia, jotka korjattiin:

- Sivuilla joilla on **useita** SPECIAL/OPTIONS-lohkoja (esim. Tau Orbitals,
  yksi lohko per moduuli) myohempi lohko ylikirjoitti aiemmat.
- Otsikko `NOTE` (yksikko) jai lukematta, koska koodi luki vain `NOTES`.
  Tama pudotti mm. Gal'leath-luokan saannon kortilta.
- Tyranidien `SPORES`-sarake ei käyttänyt tavallista `TURRETS`-otsikkoa.
- Samalla sivulla painetut vaihtoehtoiset Tau-asekonfiguraatiot jäivät yhden
  profiilin alle. Ne tuotetaan nyt kuutena erillisenä valittavana profiilina.
- Moniosaiset `Choose one` -valinnat ja Tyranid Hive Shipin puolipisteiset
  valinnat pilkottiin oikeiksi, toisensa poissulkeviksi optioiksi.

## Aseiden erikoissaannot ja tahtiviittaus

Kohdekortin tapaan värillinen tähti aseen edessä viittaa samalla värillä ja
samalla sisäisellä sääntö-ID:llä merkittyyn kohtaan SPECIAL RULES / UPGRADES
-lohkossa. Linkitys kattaa sekä alusprofiilin että manuaalien yhteiset
ase- ja faktiosäännöt:

- jos aluksen SPECIAL-lohko nimeaa aseen, seka saanto etta aserivi saavat
  tahden (esim. Dethdeala: `* Prow bombardment cannon` ja
  `* The rules for the bombardment cannon can be found on pg. 94.`)
- jos optio nimeaa aseen, seka optiorivi etta aserivi saavat tahden
- valinnaisen erikoisaseen tähtiviite syntyy myös silloin, kun asetta ei vielä
  ole otettu; sääntö pysyy kortilla valintaa varten

Mukana ovat muun muassa nova- ja bombardment cannonit, boarding torpedoes,
Space Marine-, Ork-, Eldar-, Dark Eldar-, Tau-, Necron-, Tyranid-, Demiurg-
ja Rogue Trader -erikoisaseet sekä faktioiden profiilin ulkopuoliset
liike-, suoja-, boarding- ja critical-säännöt. Automatisoitu testi varmistaa,
että jokaisella erikoisaserivillä on sekä tähti että vastaava SPECIAL-kohta,
ja että orpoja viittauksia ei jää.

### Kaksi korjausta 6.9.2026

**Thunderhawk Annihilator puuttui.** Crusade-lista antaa launch bayn lentää
myös Annihilatoreita (Fleets s. 96), mutta sääntö ei ollut kortilla lainkaan.
Säännön saa sitoa **listaan** eikä vain laivastoon: uusi valinnainen `list`-kenttä
`fleetMatches()`:ssa. Sitominen on pakollista, koska Grey Knights- ja
Inkvisitio-rungot sanovat profiilissaan erikseen, ettei niillä ole
Annihilatoreita — sama runko, eri lista, eri sääntö.

**Profiilin oma lause söi sääntötekstejä.** Jos profiilin SPECIAL-lause sattui
nimeämään aseen, aseen sääntöteksti jäi kokonaan pois — vaikka lause ei
kertonut säännöstä mitään. Strike cruiserin laivastorajoitus *"as many strike
cruisers … (with replaced launch bays and/or prow bombardment cannon)"*
vaimensi näin seka Thunderhawkin että bombardment cannonin. Mitattuna vika vei
säännön **43 kortilta**: mm. Hammer class battlekroozerilta neljä sääntöä,
Grey Knights -rungoilta Thunderhawkin ja Tau-konfiguraatioilta Mantan.

Sääntöteksti tulostuu nyt aina, ja ne neljä tapausta joissa profiililause
oikeasti *on* sama sääntö on merkitty sääntöön `selfText`-lausekkeella:
Dethdealan sivuviite bombardment cannoniin, Pthuxutlin disruptor, Nekullin
whisperlance ja Demiurgin launch bay. Vaimennettuja on siis 43 → 16, ja kaikki
16 ovat noita tarkoituksellisia.

Layout kestää lisäyksen: 460 kortin auditissa ylivuotoja 0 ja pienimmät skaalat
ennallaan (option 0,588, lohko 0,460).

**Rosteriarkki listaa myös listan päivitykset.** Ennen rosterin rivillä näkyivät
vain aluksen omat optiot, joten kaksi re-rollia ostanut Master of the Fleet luki
pelkkänä 100 pisteen rivinä ja Honour Guard 435 pisteen battle bargena ilman
selitystä.

## Varit tulostuksessa

Selain **ei tulosta taustavareja** ellei tulostusdialogissa ole rastittu
"Background graphics" / "Taustagrafiikka". Kortti kayttaa
`print-color-adjust: exact`, joka pakottaa varit mukaan ilman etta asetusta
tarvitsee muuttaa. Jos kortti silti tulostuu harmaana, rasti se asetus.

## Mistä data on

Kaikki poimittu koneellisesti lähdePDF:istä, ei käsin naputeltu:

- **Alusprofiilit** (171 kpl) — `BFG-Remastered-Official-Fleets_WIP.pdf`,
  profiilisivujen `TYPE/HITS … ARMAMENT`-taulukot. Statsirivi jäsennetään
  hahmontunnistuksella ja aseistustaulukko sarakegeometrialla, koska
  leveä ARMOUR-solu vuotaa naapurisarakkeisiin. Näistä 165 poimitaan suoraan
  profiiliotsikoista ja kuusi on samalle sivulle painettuja Tau-konfiguraatioita.
- **Laivastolistat** (30 kpl, 684 riviä) — samojen PDF:ien listasivut.
  Rivit sidotaan profiileihin `(pg. NN)`-viitteen kautta, joten linkitys
  on täsmällinen eikä nimien arvailua.
- **Critical hits -taulukko** korteilla — Rulebook v1.10 s. 67.

Tunnetut lähdevirheet ja niitä vastaavat eksplisiittiset korjaukset on
merkitty dataan. `Zukov's Klaw` on esimerkiksi painettu muodossa
`(pg. 377)). 2310 pts`; se luetaan 310 pisteeksi ja väärä sivuviite korjataan.

## Ajaminen ja päivittäminen

```bash
node test_validator.js
```

Datan uudelleenpoiminta lähdePDF:istä (vaatii `pymupdf`):

```bash
python extract.py && python lists.py && python build_data.py && python build.py
```

Käyttöliittymän muokkaus: muokkaa `app_template.html`, aja `python build.py`.

Paikallinen esikatselu: `.claude/launch.json` sisältää `registry`-
palvelimen portissa 8731.

## Rajaukset

- Kortti on 144 × 135 mm. Jokainen sisältölohko kutistetaan tarvittaessa
  erikseen ilman kovaa alarajaa; vasta sen jälkeen koko kortti voi skaalautua.
  Sisältöä ei leikata eikä piiloteta. Pisimmässä nykyisessä optiolistassa on
  16 optiota (Tyranid Hive Ship); 442 kortin auditissa option pienin skaala
  on 52,04 % ja minkään lohkon sisältö ei ylitä rajojaan.
- Panssari ja launch bay -kantama lyhennetään kortille kirjan lyhyeen
  muotoon (`6+ front / 5+ sides / 4+ rear` → `6+/5+/4+`,
  `Fighta-Bommas: 25 cm / Assault Boats: 30 cm` → `25/30cm`), koska pitkä
  muoto ei mahdu solun leveyteen. Täysi teksti on aina sääntökirjassa,
  ja kortti kertoo sivunumeron.
- Squadronin ruudukossa on aina kuusi paikkaa, koska se on yleisin
  yläraja. Listat joissa raja on eri (esim. Da Ork Clanzin tiddla
  skwadron 3–10) näyttävät oman sääntönsä tekstinä.
- Ordnance-lisät jotka hinnoitellaan per launch bay (esim. torpedo
  bombers +10 / bay) tunnistetaan, mutta määrää ei lasketa — käytä
  ± pts -kenttää.
