# Boarding Actions — BFG:n boarding-ratkaisin

Yksi tiedosto, `Boarding.html`. Avaa se puhelimella, tabletilla tai koneella.
Ei palvelinta, ei verkkoyhteyttä, ei asennusta. Tila säilyy selaimessa, joten
kesken jäänyt taistelu on paikallaan kun palaat.

**Tämä on oma projektinsa.** Se lukee `fleet builder/bfg_data.json`:ia vain
kerran, kun aluskanta poimitaan (`build_ships.py`). Mitään fleet builderin
tiedostoa ei muuteta.

---

## Mitä se tekee

Ratkaisee End Phasen ensimmäisen kohdan — boarding actionin — alusta loppuun:
kelpoisuus, boarding-arvot, modifikaattorit, nopat, tulos, kriittiset osumat,
kriittisten taulukot, vahingon jako, hulkit ja katastrofivaurio.

Suunnitteluperiaate on, että **jokainen käyttäjän syöte on virhemahdollisuus**,
joten niitä on mahdollisimman vähän:

| Asia | Mistä se tulee |
|---|---|
| Runkotyyppi, damage points, turretit / spore cystit | alusprofiilista |
| Crippled | lasketaan jäljellä olevista DP:istä |
| Turrettien puolittuminen crippled-tilassa | lasketaan |
| Rotamodifikaattori (+1 Chaos, +2 Space Marines, …) | laivastosta |
| Mitä runkoja laivasto saa ottaa | kirjan laivastolistoista |
| Suhdemodifikaattori (+1 / +2 / +3 / +4) | lasketaan boarding-arvoista |
| Luokkakohtaiset säännöt (Endeavour, Hemlock, Blackship, Slaverer, …) | alusprofiilin erikoissäännöistä |
| Oikea kriittisten taulukko (Eldar, Tyranid, defences, Ork hulk) | aluksesta |
| Merkit, miehistöt, hahmot (Khorne, CSM crew, Warlord, Inkvisiittori, …) | **kysytään kerran per alus**, muistetaan |
| Blast Markerit ja special orders | **kaksi napautusta per kierros** |
| Nopat | sovellus heittää, tai napautat oman heittosi |

Käytännössä yksi boarding action on **yksi napautus**, kun alukset on kerran
valittu ja DP on ajan tasalla.

**Laivasto valitaan miehistön mukaan.** Aluslista ei ole kirjan painojärjestys
vaan se, mitä kukin laivastolista saa kentälle. Siksi Adeptus Mechanicuksen
alta löytyvät myös sen Explorator-listan imperiumin ja ordun rungot (Lunar,
Dictator, Nova…), Kaaoksen alta renegade-rungot (Lunar, Sword…), Space Marinesin
alta rapid strike vesselit ja Rogue Tradersin alta sen merirosvorungot.
Valinta ratkaisee modifikaattorit: mekanikuksen Lunaria boardaava saa
uusintaheiton (FL s. 118), renegade-Lunar saa +1 Chaos (FL s. 222) ja rapid
strike vessel +2 Space Marines (FL s. 106). **Liittolaiset valitaan oman
laivastonsa alta**, koska ne pitävät oman miehistönsä: inkvisiittorin alus
Inquisitionista, Rogue Traderin risteilijä Rogue Tradersista, kroot ja demiurg
omistaan. Bakka-laivaston mekanikusristeilijät valitaan Adeptus Mechanicuksen
alta (FL s. 49), ja Grey Knightsin saattajat Space Marinesin alta (FL s. 144).

Pääpelinäkymä ei vieritä. Jos sisältö ei mahdu, kortti tiivistyy portaittain
(`fitSide`). Pitkä tuloserittely vierittää vain oman sisältöalueensa; toiminto-
painikkeet pysyvät paikallaan, eikä koko sivu karkaa pöytäkäytössä.

---

## Käyttö pöydän ääressä

0. **Ensimmäisellä kerralla:** valitse heitetäänkö nopat sovelluksessa vai
   kädessä. Valinta muistetaan ja sen voi vaihtaa yläpalkista.
1. **Kerran pelin alussa:** napauta kummankin puolen alusruutua ja valitse
   laivasto ja alus. Jos aluksella on merkkejä, miehistöjä tai hahmoja, napauta
   aluksen alla olevaa sirpalepalkkia (**+ marks, crew, characters**) ja rastita
   ne. Ne jäävät näkyviin kortille, joten ne voi tarkistaa yhdellä silmäyksellä.
2. **Joka End Phase:** säädä DP nappuloilla − ja +, napauta Blast Markers /
   Special orders jos tilanne niin vaatii, ja paina **RESOLVE**.
3. **Tulos:** näet pisteet, tuloksen nimen, vahingon, kriittiset osumat
   taulukkoteksteineen ja kunkin rungon lopputilan. **APPLY DAMAGE** vähentää
   vahingon suoraan aluksista, joten seuraava kierros on jo valmiina.
4. **Tasapeli** = grapple. Paina **NEXT END PHASE**, ja kierroslaskuri kasvaa
   (Dark Eldar tarvitsee sen).

**Ikonit:** jokaisella laivastolla on oma väri ja lähes jokaisella oma tunnus
(Imperial Navyn kotka, Kaaoksen kahdeksansakarainen tähti, orkkien kallo,
tyranidien kynnet…). Kolme Tau-listaa jakavat saman tunnuksen ja eroavat vain
oranssin sävyltä. Tunnus näkyy laivastovalitsimessa, alusvalitsimen otsikossa ja
kortin laivastopainikkeessa. Alusvalitsimen välilehdillä ja alusten nimien edessä
on runkotyypin siluetti laivaston värissä: mitä isompi siluetti, sitä isompi
runko (escort → cruiser → grand cruiser → battleship). Kuusikulmio on kirjan
*Defence*-tyyppi: asemat, alustat, hulkit, rokit, Warsphere ja karavaanit.
Maailman päällä seisova tykkitorni on *Ground* (Air Base), neljä ruutua on
All-välilehti. Ikonit ovat omia yksinkertaistettuja muotoja, eivät Games
Workshopin logoja.

Ahtaalla näytöllä nimi voittaa aina. Laivastovalitsimessa, otsikossa ja
laivastopainikkeessa tunnus ensin pienenee ja jää pois, jos nimi katkeaisi
silti. Alusvalitsimessa siluetti jää pois siitä sirusta, jonka nimi katkeaisi;
runkotyypin välilehdellä kaikki siluetit jäävät pois heti kun ruudukko käy
ahtaaksi, koska välilehti kertoo tyypin jo.

Yläpalkki: **⇄** vaihtaa hyökkääjän ja puolustajan, **↺ ALL** tyhjentää koko
taistelun vahvistuksen jälkeen, **?** avaa sääntöyhteenvedon ja taulukot sekä
**🎲 / ✋** vaihtaa digitaalisten ja omien noppien välillä. Kummankin puolen
otsikon **↺ Reset** tyhjentää vain kyseisen puolen. Jokaisen laivan **+1** tekee
siitä samanlaisen kopion (sama DP, miehistö, merkit ja päivitykset), ja **✕**
poistaa vain sen laivan.

Kun kummallakin puolella ei ole tasan yhtä alusta, ratkaisun yläpuolelle tulee
**MULTI-BOARDING**-palkki. Se näyttää osallistujamäärät ja avaa vaiheet sekä
Strike Cruiser vastaan neljä Vanguard dronea -esimerkin. Ratkaisu yhdistää
kummankin puolen boarding-arvot ja heittää kerran per puoli. Hävinneen puolen
omistaja jakaa piste-eron verran vahinkoa omille osallistuville aluksilleen.
Molemmat puolet tarkistavat tulostaulukon salliman kriittisen erikseen jokaista
vastapuolen alusta kohti; kriittisen lisävahinko kuuluu sen omalle kohteelle,
eikä sitä jaeta vahinkopotista uudelleen.

### Kumpi puoli heittää mitä

Jos puoli heittää muuta kuin tavallisen D6:n, kortilla on siitä oma palkki:
**▲ 2D6 KEEP THE HIGHEST** (tyranidit, FL s. 418) kullalla, **▼ 2D6 KEEP THE
LOWEST** punaisella ja **no crew · no dice** harmaalla. Sama tieto on
modifikaattoripainikkeen tekstissä (`2D6▲`), RESOLVE-napin alarivillä ja
tuloksessa, jossa **molemmat nopat näkyvät** ja laskuun mennyt on korostettu ja
hylätty yliviivattu. Käsinoppatilassa sovellus kysyy molemmat nopat erikseen
eikä pyydä valitsemaan korkeampaa — vertailu on sen työtä, ei pelaajan.

Noppamäärän voi myös asettaa käsin: **Roll modifiers → Dice this side throws**
(By the rules / D6 / 2D6 ▲ highest / 2D6 ▼ lowest). Se on tarkoitettu
kampanja- ja house rule -tilanteisiin, ja kortti sanoo silloin *by hand*.
Kirjojen boarding-säännöissä ei ole yhtään 2D6-matalin-heittoa: se esiintyy
vain hit-and-run-hyökkäyksissä tyranideja vastaan (FL s. 418, RB s. 92), eikä
niitä ratkota tässä työkalussa.

Boarding-arvon ja modifikaattorien isot numerot ovat painikkeita (kohotettu
reuna ja **ⓘ**-merkki oikealla): ne avaavat erittelyn rivi riviltä
sivunumeroineen. Modifikaattorinäkymän alalaidassa on
**Anything else** -säädin kampanjabonuksille ja house ruleille, joita sovellus
ei tunne.

---

## Lähteet

| Lyhenne | Kirja |
|---|---|
| RB | *BFG Remastered Rulebook v1.10* — `chatgpt-projekti/20_SAANNOT_Rulebook_v1-10.pdf` |
| REF | *Battlefleet Gothic — Boarding Actions*, 2-sivuinen koontiarkki — `chatgpt-projekti/34_Boarding_Actions_Reference.pdf` |
| FL | *BFG Remastered Official Fleets WIP v0.36* — `tulosteet/ref/BFG-Remastered-Official-Fleets_WIP.pdf` |
| FAQ | High Admiraltyn *Collected FAQ 2026*, lukittu vienti 20.10.2026 — `tulosteet/ref/warp_rift/faq2026_live_20261020.txt`. Voittaa RB:n ja FL:n ristiriidassa (käyttäjän päätös 20.10.2026). |

Painettu sivunumero = PDF:n sivunumero molemmissa kirjoissa. FAQ:hon viitataan
kohdan otsikolla.

Keskeiset kohdat: boarding RB s. 89–91, End Phase s. 88, crippled s. 65,
kriittiset s. 66–67, katastrofivaurio s. 71, defences-kriittiset s. 101,
hit-and-run ja teleport s. 92. Eldarin kriittiset FL s. 305, tyranidien s. 423,
Ork hulkin s. 391, holofieldit s. 303, shadowfieldit s. 342, tyranidien boarding
s. 418.

---

## Tulkintapäätökset

Nämä ovat kohtia, joissa kirjat ovat ristiriidassa tai vaiti. Sovellus tekee
valinnan, ja valinta on tässä, jotta sen voi kiistää.

1. **Crippled +2 kertautuu jokaisesta crippled-vihollisaluksesta.** REF:n
   esimerkki 3 laskee kaksi crippled Kill Kroozeria erikseen (+4), ja vain sillä
   lukemalla painettu loppusumma 11 täsmää. Blast Markerit ja special orders
   lasketaan sen sijaan **kerran**, koska mikään lähde ei todista toisin.
2. **REF:n esimerkki 2 jättää suhdemodifikaattorin pois** (11 vs 10 antaa +1).
   Sovellus noudattaa sääntötekstiä RB s. 90, ei esimerkkiä. Esimerkin oikea
   tulos on Stormed, ei Driven Back.
3. **REF:n esimerkki 3 painaa orkkien boarding-arvoksi 8**, vaikka 5 + 4 = 9.
   Esimerkin oma vahinkolasku vaatii 9:ää. Kyseessä on painovirhe.
4. **Tau puolittaa pyöristäen ylös.** Kirjat eivät sano pyöristystä; RB:n muu
   puolitus (s. 65, s. 88) pyöristää ylös.
5. **Crippled puolustaja lisää puolet turreteistaan** (ylöspäin pyöristäen).
   RB s. 65 puolittaa turretit, ja lisättävä on "remaining turrets".
6. **Mark of Khornen +1 kriittisen aiheuttamisheittoon koskee kaikkia
   Khorne-aluksia** (REF). FL painaa lauseen vain Incursion-listan Warmasterin
   kohdalle.
7. **Berzerker Tiden D3 ylimääräistä heittoa** heitetään samaa rajaa vasten kuin
   varsinainen kriittinen. Kumpikaan kirja ei sano, mitä rajaa ne käyttävät;
   sovellus sanoo tämän ääneen tuloksessa.
8. **Tyranidien spore cystit lasketaan puolustajan turretarvona** (REF ja sen
   esimerkki 3). Ne lisätään kaksinkertaistamisen **jälkeen**.
9. **Boardaava tyranidi saa Blast Marker -modifikaattorin aina**, koska boarding
   itsessään asettaa Blast Markerin kohteeseen (FL s. 418). Vihollinen ei saa
   sitä koskaan tyranidin omista markereista.
10. **Inkvisiittorin +2 ei summaudu Space Marine -bonuksen kanssa** (FL s. 144:n
    Grey Knights -lauseke laajennettuna kaikkiin kolmeen ordoon).
11. **Hexagrammic wards** (Ordo Malleus tai Grey Knights) kumoavat sekä Mark of
    Nurglen boardaamattomuuden että Mark of Khornen kaksinkertaistuksen.
12. **Miehistötön alus ei saa miehistömodifikaattoreita.** Activated Blackstone
    Fortressilla "ei ole miehistöä eikä se siksi lisää D6:tta" (FL s. 284).
    Sovellus jättää siltä pois myös rotabonuksen ja miehistöpäivitykset —
    boarding-arvo ja vastustajan tilaan perustuvat modifikaattorit jäävät
    voimaan. Kirja ei sano tätä suoraan; +1 Chaos miehistöttömälle artefaktille
    olisi kuitenkin selvästi väärin.
13. **Space hulkkia ei koskaan cripplata** (FL s. 288, s. 391), joten se ei anna
    viholliselle +2 eikä puolita turretteja. **Tyranidin spore cystit pysyvät
    täydessä vahvuudessa** crippled-tilassa (FL s. 424), toisin kuin turretit.
14. **Rotakohtaiset taulukot ovat käytössä:** kriittiset Eldar (FL s. 305), Dark
    Eldar (s. 344), tyranidit (s. 423), necronit (s. 401), Ork hulk (s. 391),
    Chaos-hulk (s. 288), Ramilies (s. 505), Eldar Haven (s. 337) ja puolustukset
    (RB s. 101); katastrofivaurio tyranidit (s. 423), hulkit (s. 288/391),
    Ramilies (s. 505). Kroot Warsphere, Nicassar Caravan ja Rok eivät heitä
    kumpaakaan: kriittinen on +1 vahinko ja tuho on neljä Blast Markeria.
15. **Boarding-vahingosta ei heitetä lisäkriittisiä** (REF), ja 0 DP:hen
    pudonnut alus on drifting hulk ilman katastrofiheittoa — **paitsi** jos
    kriittisen lisävahinko vei sen nollaan, jolloin katastrofitaulukko heitetään
    (RB s. 90). Sovellus erottaa nämä kaksi tapausta. RB s. 66:n yleislause
    ("a check for critical damage is made for every point of damage scored on
    a ship, no matter what its source is") puoltaisi lisäkriittisiä. FAQ 2026
    (*Boarding Actions: do you roll for critical hits…*) ratkaisee asian
    sovelluksen valinnan mukaisesti: yksi kriittinen kummallekin alukselle
    omalla nopallaan, eikä hävinneen vahinkopisteistä heitetä lisää.
16. **Yksi alus voi boardata useita vihollisaluksia.** Tekijöiltä 13.9.2026
    saatu vahvistus käskee ratkaisemaan tilanteen normaalina multi-boardingina:
    kummankin puolen boarding-arvot yhdistetään, kumpikin puoli heittää kerran,
    hävinneen puolen omistaja jakaa vahingon aluksilleen ja kriittinen tarkistetaan
    jokaiselle mukana olevalle alukselle. Tämä toimii myös toiseen suuntaan eli
    usean aluksen boardatessa yhtä.
17. **Holofield-säästö on aluskohtainen.** FL s. 303–304: säästö heitetään
    kerran kutakin hyökkäystä vastaan, ja sen heittää hyökkäyksen kohteena oleva
    alus. Moniboardingissa jokainen puolustava holofield-runko heittää siis oman
    säästönsä. Onnistunut säästö vie sen aluksen ulos tästä boardingista — se ei
    enää lisää boarding-arvoa, ei ota vahinkoa eikä saa kriittistä — ja jos
    kaikki puolustajat säästävät, koko yritys jää tekemättä. Kirjat eivät
    käsittele tilannetta, jossa puolustajia on useita; tämä on lähin luenta
    säännön omasta sanamuodosta.
18. **Space hulk ei saa Khornen kaksinkertaistusta mutta saa Abaddonin.**
    FL s. 288 kieltää hulkilta Kaaoksen merkit ja kaikki boarding-arvoa
    parantavat päivitykset (myös s. 390), joten Mark of Khorne on estetty
    moottorissa. Abaddon on aito ristiriita: sama kielto koskisi häntäkin, mutta
    REF:n esimerkki 4 laskee nimenomaan Chaos Space Hulkin **Abaddonin kanssa**
    arvoon 86 (40×2 + 6). Sovellus noudattaa REF:iä, koska se on ainoa lähde
    joka ottaa asiaan kantaa.
19. **Turretit ja spore cystit ovat käsin säädettävissä.** RB s. 89 laskee
    *jäljellä olevat* turretit, ja listat ostavat niitä lisää (Ork Dakka Dakka
    FL s. 365, mekanikuksen saattajat +5 p. FL s. 121, tyranidien lisäspore-
    cystit FL s. 426) samalla kun kriittiset vievät niitä pois. Profiilin luku on
    lähtöarvo, ei lopullinen; kortti merkitsee käsin muutetun tähdellä.
    Poikkeus on Explorator-listan **pakollinen** +1 turretti: se kuuluu isojen
    alusten pistehintaan (FL s. 119), joten se on valmiiksi aluskannassa. Se ei
    koske saattajia (FL s. 121) eikä Omnissiah's Victorya, joka ei saa refittejä
    lainkaan (FL s. 126).
20. **Tähtilinnakkeen muut lohkot syötetään käsin.** FL s. 502: boarding-arvoon
    lasketaan kaikkien neljän lohkon jäljellä olevat HP, mutta turreteista vain
    boardattavan lohkon. Aluskannassa on yksi lohko, joten muiden lohkojen HP on
    oma säädin ja se lisätään **vain** boarding-arvoon — ei crippled-testiin, ei
    turretteihin eikä vahinkoon.
21. **Runko kuuluu siihen laivastoon, joka sen miehittää.** Kirjan
    laivastolistat ottavat runkoja toistensa osioista, ja boardingissa ratkaisee
    miehistö: Explorator-listan imperiumin ja ordun rungot ovat mekanikuksen
    aluksia eivätkä saa Space Marine -bonusta (FL s. 121, s. 125), renegade-
    rungot ovat kaikilta osin kaaoksen aluksia (FL s. 222), rapid strike
    vesselit ovat ordun miehittämiä imperiumin runkoja (FL s. 106), Ordo
    Malleuksen ja Segmentum Obscuruksen varastorungot ovat kaaoksen profiileja
    imperiumin miehistöillä (FL s. 39, s. 142, s. 15) ja Rogue Trader -listojen
    rungot ovat rogue traderin omia (FL s. 174, s. 178). Sovellus listaa siksi
    saman rungon useammassa laivastossa. Liittolaiskontingentit (Inquisition,
    Rogue Traders, kroot, demiurg, nicassar) pysyvät oman laivastonsa alla.
22. **Renegade-rungolle ei voi ottaa merkkejä eikä CSM-miehistöä.** FL s. 222
    kieltää niiltä Chaos Lordit, Chaos Space Marinet ja kaaoksen ordnanssin, ja
    s. 225 mukaan merkki tarvitsee aina Lordin tai CSM-miehistön. Ne saavat siis
    vain kaaoksen +1, ja sovellus piilottaa niiltä merkit ja miehistöpäivitykset.

---

## Rakentaminen

```
python build_ships.py     # bfg_data.json  ->  src/ships.json   (235 runkoa)
python make_icons.py      # vain kun ikoneita muutetaan  ->  src/icons.json
node test_engine.js       # sääntömoottorin golden-tapaukset (kirjojen esimerkit)
node test_fuzz.js         # 40 000 satunnaista boardingia invarianttien läpi
python build.py           # src/*  ->  Boarding.html            (yksi tiedosto)
```

`build.py` kieltäytyy rakentamasta, jos jollakin aluskannan laivastolla tai
runkotyypillä ei ole ikonia, jos väri ei ole muotoa `#rrggbb` tai jos ikonissa on
muuta kuin `path`/`circle`-geometriaa. Uusi laivasto `build_ships.py`:ssä vaatii
siis rivin myös `make_icons.py`:n `FLEETS`-tauluun, ja uusi runkotyyppi (`t`)
rivin `H`-tauluun. Aja sen jälkeen `make_icons.py` ja `build.py`.

`build_ships.py` lukee myös kirjan laivastolistat ja poimii niistä rungot, jotka
laivasto miehittää itse vaikka profiili on toisen kirjan osiossa. Kuka miehittää
minkäkin osion, on `LIST_CREW`-taulussa sivuviitteineen. Jos listaan ilmestyy
osio, jossa on vieras runko eikä taulussa ole riviä, ajo pysähtyy.

`build_ships.py` tarkistaa jokaisen käsin poimitun alussäännön lähdelauseen
aluksen omasta `sr`-tekstistä. Jos data muuttuu niin ettei lause enää löydy, ajo
huutaa sen sijaan että lippu katoaisi hiljaa.

`test_engine.js` ajaa kirjojen omat esimerkit sääntömoottoria vasten. Kaikki
väitteet ovat joko kirjan esimerkkejä tai kirjan lauseita väitteiksi
käännettyinä. Jos jokin esimerkki on itse väärässä, tapaus koodaa kirjan luvut
siltä osin kuin ne eivät ole kiistanalaisia ja nimeää kiistan kommentissa.

Esikatselu selaimessa: työtilan juuren `.claude/launch.json` tuntee
konfiguraation `boarding` (portti 8751), osoite
`http://localhost:8751/Battlefleet%20Gothic/boarding/Boarding.html`.

---

## Tiedostot

```
Boarding.html        valmis sovellus, ainoa mitä pöydässä tarvitaan
web/index.html       staattiseen web-hotelliin ladattava aloitussivu
web/README.txt       lyhyt hostausohje
build.py             kokoaa molemmat HTML-versiot ja zipin
build_ships.py       poimii aluskannan fleet builderin datasta
make_icons.py        laivastojen värit ja ikonit sekä runkotyyppien siluetit
test_engine.js       golden-tapaukset
test_fuzz.js         ominaisuussweep satunnaisilla boardingeilla
src/engine.js        sääntömoottori, ei DOM:ia, ajettavissa nodella
src/app.html         käyttöliittymä
src/ships.json       generoitu, älä muokkaa käsin
src/icons.json       generoitu make_icons.py:llä, älä muokkaa käsin
```

---

## Tunnetut rajat

- **Ramilies ja linnoitusluostari** ovat kirjassa nelilohkoisia: boarding-arvo on
  kaikkien lohkojen jäljellä olevat HP plus **boardattavan lohkon** turretit
  (FL s. 502). Sovellus käsittelee yhden valitun lohkon kerrallaan, koska
  aluskannassa ei ole neljän lohkon erillisiä arvoja; muiden lohkojen HP
  syötetään käsin (tulkintapäätös 20). Nollaan pudonnut lohko merkitään
  tuhotuksi eikä koko linnoitusta räjäytetä; muiden lohkojen vahinko on pidettävä
  erikseen. Käytännön merkitys on pieni: niitä voi boardata vain space hulk.
- **Tyranidien All Is Lost** näytetään oikea-aikaisena sääntömuistutuksena,
  mutta Leadership-testiä ei heitetä automaattisesti, koska sovellus ei seuraa
  alusten Leadership-arvoja.
- **Mark of Khornen +1 kriittisen aiheuttamisheittoon** annetaan koko puolelle,
  ei alukselle. Monen aluksen boardingissa, jossa vain osalla on merkki, tämä on
  hieman antelias.
- **Hit-and-run ja teleport** eivät ole mukana, ks. alla.

## Mitä tämä ei tee

Hit-and-run- ja teleport-hyökkäykset ratkaistaan samassa End Phasen kohdassa,
mutta ne eivät ole tässä. Ne ovat yksinkertaisia (D6, 1 epäonnistuu, 2+ katso
kriittisten taulukosta), eikä niissä ole samaa modifikaattorisotkua. Jos ne
halutaan mukaan, kriittisten taulukot ovat jo moottorissa valmiina.
