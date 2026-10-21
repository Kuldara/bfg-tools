# Manuaalinen korttipistokoe

Vihreä testisarja todistaa laskennan vakauden, ei kortin sääntösemantiikkaa.
9.9.2026 kaksi ulkopuolista pistokoetta löysi 13 tapausta 68/68 vihreän
takaa: kortti oli pisteiltään ja profiililtaan oikein mutta antoi
puutteellisen, ylimääräisen tai keskenään ristiriitaisen pelisäännön
(`docs/BACKLOG.md`, kohta 10b). Siksi pistokoe on osa jokaista kierrosta.

## Milloin

Jokaisen kohdan päätteeksi ennen committia, ja aina kun sääntötekstejä,
`OPT_EFFECTS`iä, `resolveUnit`ia tai korttiprojektiota on muutettu.
Vähintään 2–3 korttia kierrosta kohti: **yksi siemenellä arvottu**
(siemen = päivämäärä + juokseva numero, esim. `2026091001`) ja loput
**päätellyistä heikoista kohdista** — sinne, mihin muutos kohdistui, ja
tapauksiin, joissa kortin sisältö syntyy kontekstista (listakohtainen sääntö,
runkovalinta, maksettu optio jolla on mekaniikka, erikoisalus omalla
vauriomallilla, saattue).

## Miten — lähde ensin, kortti vasta sitten

1. **Valitse kortti ennen kuin katsot sen nykyistä sisältöä.**
2. **Lue kirja ensin.** `python pdf_text.py <profiilisivu> <listasivu>` ja
   tarvittaessa `--rulebook`. Kirjoita ylös kaikki, mitä kortilla pitää olla:
   pisteet, statsit, aserivit arvoineen, optiot hintoineen ja
   vaikutuksineen, listakohtaiset säännöt, erikoissäännöt, vaurio- ja
   critical-malli, ja mitä kortilla **ei saa** olla (toisen listan sääntö,
   piilotetun option sääntö, ominaisuus jota profiililla ei ole).
3. **Generoi kortti sovelluksen omalla polulla:**
   `node spot_check.js --list "…" --ship "…" [--opt i] [--up "…"] [--hull "…"] [--n k] [--all]`
   (tai `--seed N`). Tuloste on ratkaistu yksikkö, kortin teksti ja kirjan
   sivut samassa ajossa.
4. **Vertaa käsin**, kohta kohdalta: puuttuuko jotain (mekaniikka, arvo,
   sääntö), onko ylimääräistä (sääntö jota alus ei voi käyttää), onko
   ristiriitaa (yleinen sääntö vastaan aluksen oma), ovatko numerot
   samat. Epäselvä kohta tarkistetaan uudelleen kirjasta, myös
   jatkosivuilta.
5. **Kirjaa.** Raportti `docs/pistokokeet/YYYY-MM-DD-N.md`: tapaus, lähde
   (sivut), mitä kortilla oli, mitä piti olla, prio (P1 = pelaaminen
   muuttuu tai laiton valinta tarjolla; P2 = puute joka ei muuta
   lopputulosta; LÄPI). Läpäisyt kirjataan myös — ne ovat positiivisia
   regressiotapauksia.
6. **Löydös on golden-tapaus ennen korjausta.** `referenssi/golden_cases.json`:
   `card_contains` sille mikä puuttuu, `card_lacks` sille mikä on
   ylimääräistä tai ristiriitaista, rakenteinen odotus (`options`,
   `upgrades`, `leadership`, `issues`) sille mikä on laskettavissa.
   Osoita punaiseksi (`node test_golden.js`), korjaa oikeaan kerrokseen
   (`AGENTS.md` §4), aja `python acceptance.py`.
   Tapauksen `why` lainaa kirjan lauseen kokonaan, rajaus mukaan lukien
   (kenelle ja millä ehdolla). Pistokoe 8:n ainoa P1 oli regressio, jonka
   golden oli kirjoitettu lauseen lyhennelmästä: "If the ship embarking an
   Inquisitor…" — kirjassa "If an Imperial Navy or Adeptus Mechanicus ship
   embarking an Inquisitor…" (s.139).
   Ennen kuin luokittelet "sama asia myytävänä kahdesti", kokeile ottaa
   molemmat: nouseeko hinta kahdesti ja piirtyykö ase kahdesti? Kaksi
   toisensa sulkevaa reittiä samaan vaihtoon on hyväksytty ratkaisu
   (`test_upgrades.js` §Paallekkaiset vaihto-optiot, 8.9.2026). Pistokoe
   10:n K2 (Lunarin oma Nova ja Mechanicus-listan Nova) peruttiin tästä
   syystä.
   Hintalöydös vaatii myös yleissäännön sivun: Black Crusaden Daemonshipin
   Mark of Tzeentch näytti väärältä listan s.234 hintaan (+25) verrattuna,
   mutta s.227 sanoo "with the same effects and cost in points as described
   on pg. 232" (+30). Pistokoe 11:n L2 peruttiin ennen luokittelua.
7. **Päivitysketjut.** Ota päivitykset yksi kerrallaan ja katso tarjonta
   jokaisen askeleen jälkeen. `wide_check.py` tulostaa `tarjonta +/-` -rivit:
   mitä tulee tarjolle tai poistuu, kun päivitys otetaan. Pistokoe 11:n
   kaikki P1-rivit (Strand of Fortune Daemonshipille) ja L3 (miehistön Mark)
   näkyivät vasta ketjun toisella askeleella.
8. **Yleissäännöt listojen ulkopuolella.** Lue myös yleissivut, joihin lista
   tai profiili nojaa, eikä vain listan omaa tekstiä. s.22 ("Any ship with
   launch bays can be upgraded to carry torpedo bombers") ja s.23 (orbital
   mines) koskevat kaikkia listoja, mutta vain neljä listaa toisti ensimmäisen
   säännön. Kahdeksan otosta kirjasi kantoalukset LÄPI:ksi, kunnes pistokoe
   12 luki s.22:n. Haku: `python pdf_text.py --grep "Any ship"` yleissivuilta.

## Kolme tilaa, jotka kortti ei saa sekoittaa

1. **listanrakentajan mahdolliset valinnat** — mitä käyttöliittymä tarjoaa;
2. **käyttäjän nykyinen laillinen kokoonpano** — mitä on valittu ja mitä se
   maksaa;
3. **tulostettavan kortin pelitotuus** — mitä pöydällä pätee: aktiiviset
   aseet, otettujen optioiden mekaniikka, listakohtainen sääntö yleisen
   sijaan, ei sääntöä ominaisuudelle jota profiililla ei ole.

Kohdan 10b löydökset syntyivät näiden sekoittumisesta: maksettu optio näkyi
nimenä ja hintana ilman toimintaa (Sepulchre, Chaos Space Marines, Terminator
Honours, Power Ram); piilotetun option sääntö tulostui (Exploration Tyrantin
Nova Cannon); yleinen rotusääntö syrjäytti listan totuuden (Vanguard Kraken,
Ork Hulk); `maxPoints` laski laittoman yhdistelmän.

## Tilastollinen otos — kun kysytään "ollaanko valmiita"

Yksittäinen pistokoe löytää vikoja; vain satunnaisotos kertoo, kuinka
yleisiä ne ovat. 10.9.2026 kaksi 90 rivin otosta (`docs/pistokokeet/
2026-09-10-4-tilasto.md`, `2026-09-10-5-tilasto-2.md`) mittasivat P1-osuuden
21 % → 0 % korjausten ympärillä.

1. **Arvo rivit:** `python sample_rows.py <siemen>` (siemen = päivämäärä +
   sarja + 01, esim. `2026091301`; 90 riviä 524:stä antaa ±9
   prosenttiyksikön 95 %:n välin). Työkalu vain arpoo — se ei vertaa.
2. **Jokainen rivi käsin** kuten yllä: kirja ensin (profiilisivu, listasivu,
   sääntösivut), kortti `node spot_check.js --seed <siemen> --all --no-book`
   vasta sitten. Kaikki omat optiot rastittuna, koska optiot ovat vikatihein
   alue.
3. **Tuomio riville** = sen pahin löydös: P1 (hinta, stats tai maksettu
   kyky ilman mekaniikkaa), P2 (sääntö tai vaikutus puuttuu tai harhauttaa),
   P3 (tulkinta, esitys), LÄPI.
4. **Raportti** `docs/pistokokeet/YYYY-MM-DD-N-tilasto.md`: otanta,
   luokkaosuudet Wilson-välein (äärellisen populaation korjaus), jakauma
   laivastoperheittäin, juurisyyt otoksen riveineen ja arvio populaatiosta,
   rivikohtainen taulukko, johtopäätös.
5. **Löydös on golden-tapaus ennen korjausta** kuten aina; korjausten
   jälkeen uusi otos **uusilla siemenillä** — sama menetelmä, eri rivit.

Otos vedetään aina, kun sääntötekstejä, `OPT_EFFECTS`iä, päivitysehtoja tai
korttiprojektiota on muutettu laajemmin kuin yhden aluksen verran, ja aina
ennen versionumeron nostoa.

### Laaja tarkastus — rivin kaikki kokoonpanot ja painettu kortti

Pistokokeet 4 ja 5 katsoivat rivin yhdessä kokoonpanossa (kaikki omat
optiot). Se ei näe optiota, joka muuttaa väärän rivin (Lite kroozer), eikä
kortin painettua tekstiä. Laajassa tarkastuksessa jokaisesta rivistä
katsotaan käsin, kirja ensin:

1. **Oletuskokoonpano:** hinta, statsit, aserivit, säännöt ja vauriolaatikko
   profiilisivua ja listasivua vasten; lisäksi **kaikki tarjotut päivitykset**
   (omat ja listan yhteiset) — onko jokainen tälle riville laillinen ja
   puuttuuko jokin, jonka kirja antaa.
2. **Jokainen optio yksin:** mitä optio muuttaa (pisteet, statsit, aserivit,
   säännöt) verrattuna option lauseeseen kirjassa — ei vain, että se maksaa
   oikein.
3. **Kaikki otettuna:** yhteishinta ja yhdistelmien laillisuus (poissulkevat
   ryhmät, riippuvuudet).
4. **Painettu korttiteksti** kaikki otettuna: nimi, pisteet, statsirivi,
   aserivit arvoineen, optioruudut hintoineen, sääntölaatikko, vaurio- ja
   critical-laatikko — kortti sellaisena kuin pelaaja sen lukee, ei
   ratkaisimen tuloste. Ei sisäisiä merkintöjä, ei "see text", ei ristiriitaa
   sääntölaatikon ja vauriolaatikon välillä.
5. **Komentajalla:** Ld, sisältyvät ja ostetut re-rollit, pakolliset rivit,
   osiotekstin lauseet (vain säännöt, ei kertomusta) ja nimetyn hahmon
   dossierisäännöt.

Apuväline: `python wide_check.py <siemen>` ajaa `spot_check.js`:n oletuksella,
jokaisella optiolla yksin ja kaikki otettuna, ja tulostaa oletuksen (pisteet,
statsit, aserivit, **kaikki tarjotut päivitykset**, säännöt, vaurio),
optiokohtaiset erot oletukseen ja painetun korttitekstin. Työkalu vain
tulostaa — vertailu kirjaan tehdään käsin. Yksittäin: `node spot_check.js
--seed N`, `--opt i`, `--all`.

Pistokoe 6 (`docs/pistokokeet/2026-09-10-6-tilasto-3.md`) ajoi 90 rivin
otoksen tällä menetelmällä. Se löysi vikaluokan, jota kohdat 4–5 eivät
mitanneet: listan yhteinen päivitysrivi väärän aluksen valittavissa (38/90
riviä, kaikki kymmenestä juurisyystä). Siksi kohta 1:n "kaikki tarjotut
päivitykset" ei ole valinnainen — jokaisen rivin lähdelause luetaan ja
verrataan siihen, kenelle sovellus rivin tarjoaa.

Pistokoe 7 (`…-7-tilasto-4.md`) pudotti osuuden 13 %:iin. Samana päivänä
ulkoinen katselmointi (Codex) löysi seuraavan sokean kohdan: **päivitys
voi olla oikein tarjottu ja hinnoiteltu mutta jäädä ilman vaikutusta**
(Extra Power Fields ei nosta kilpiä). Siksi laajaan tarkastukseen kuuluu
kohta 6: **jokainen tarjottu päivitys otettuna** — muuttuuko profiili,
aseistus tai sääntölaatikko niin kuin päivityksen lause kirjassa sanoo.

## Kirjainventaario — mitä sovelluksesta puuttuu kokonaan

Otokset ja laaja tarkastus lähtevät sovelluksen riveistä, joten ne näkevät
vain sen, mikä sovelluksessa jo on. J21 (orbital mines, Bug Hunt 10.9.2026)
kulki 12 otoksen läpi: rivi oli olemassa ja hinta oikein, mutta vaikutus
puuttui (rivi luokiteltu tekstiksi), poissulku torpedo bombereiden kanssa
puuttui ja osa tukikelpoisuudesta puuttui (grand cruiserit, s.14).
Inventaario kääntää suunnan: **kirjasta lähtien, kaikki, ei otosta.**
Raportti: `docs/pistokokeet/2026-09-10-18-kirjainventaario.md`.

1. **Lohkot:** yleissivut s.6–23, jokainen rotuosio (erikoissäännöt,
   listasivut ja profiilisivujen OPTIONS-rivit ja huomautukset),
   planetaariset puolustukset s.496–517, lisäalukset s.518–524, ja
   Rulebookin korttiin vaikuttavat säännöt erikseen.
2. **Poiminta sovellusta katsomatta:** jokainen lause, joka myy, sallii,
   kieltää, muuttaa, sulkee pois tai tuo kortille säännön, kirjataan muodossa
   `{sivu, sanatarkka lainaus, laji, kenelle, hinta, lausekkeet[]}`.
   Lainaukset tarkistetaan skriptillä kirjan tekstiä vasten, jolloin keksitty
   lainaus ei pääse kartoitukseen.
3. **Kartoitus:** jokaiselle kohdalle haetaan sovelluksen vastine: listarivi,
   aluksen optio, sääntömääritelmä, validaattorin tarkistus tai asetyyppi.
   Jos vastinetta ei ole, kohta kirjataan perustellusti "ei rakentajan
   asiaksi" (kampanja, skenaario tai pelinaikainen sääntö ilman korttia).
   Vastineeton kohta on löydös.
4. **Lausekkeet yksitellen:** jokainen lauseke ajetaan sovelluksen omalla
   polulla (`spot_check.js`): hinta, vaikutus kortilla, poissulut ja
   riippuvuudet. Pelkkä "rivi löytyy" ei riitä.
5. **Tukikelpoisuusmatriisi:** kohta × kaikki rungot × listat. Kirjan
   predikaattia verrataan sovelluksen tarjontaan molempiin suuntiin (liian
   laaja ja liian suppea). Reunat tarkistetaan aina: grand cruiser,
   battlecruiser, battleship, escort, toisen rodun alus ja erikoisrunko
   (hulk, rok, asema).
6. **Parit:** samaa paikkaa (launch bayt, keula, kilvet, turretit,
   miehistö) koskevat kohdat otetaan pareittain samalle alukselle. Kirjasta
   tarkistetaan, sulkevatko ne toisensa pois.
7. **Mallit:** poiminta on mekaanista lukemista, joten sen tekee halvempi
   malli (sonnet-agentti). Lainausten tarkistus ja matriisi ovat skriptejä.
   Kartoituksen tuomio, luokitus ja korjaukset tehdään itse, ja golden on
   aina punainen ennen korjausta.

## Monimenetelmä — rajat, yhdistelmät, tulkinnat ja poiminnan recall

Kirjainventaario (pistokoe 18) löytää puuttuvat kohdat, mutta ei mittaa,
mitä poiminta itse ohitti, eikä sitä, onko tehty tulkinta oikea.
Pistokoe 19 (`docs/pistokokeet/2026-09-11-19-monimenetelma.md`) lisää
kolmetoista menetelmää, joista tärkeimmät:

- **Rajatestit.** Jokainen pisteraja ajetaan kynnyksellä sekä sen alla ja
  yllä. Kirjan sanamuoto ratkaisee: "over 750" ei ole sama kuin "750 or
  more", ja "per 500 points or part thereof" ei ole sama kuin "for every FULL
  750".
- **Kaksoispoiminta.** Toinen agentti poimii satunnaissivut itsenäisesti.
  Ero ensimmäiseen poimintaan kertoo, kuinka paljon poiminta jättää
  huomaamatta.
- **Pelkällä kortilla pelaaminen.** Agentti vastaa sääntökysymyksiin
  pelkän kortin perusteella, ja vastaukset verrataan kirjaan. Näin nähdään,
  riittääkö kortti pöydällä.
- **Sääntölakimies.** Agentti yrittää rakentaa laittoman laivaston, jonka
  sovellus hyväksyy. Jokainen väite tarkistetaan kirjasta.
- **Tulkintakirjanpito.** Jokaisesta aiemmasta monitulkintaisesta
  päätöksestä kirjataan vaihtoehtoiset lukutavat, riippumaton lähde
  (BSData) ja perustelu.

Jokainen löydös käy tulkintavarmistuksen läpi ennen korjausta: lause
kokonaan, ympäröivä teksti, riippumaton lähde ja vaihtoehtoiset lukutavat.
Aidosti monitulkintainen kohta kirjataan päätökseksi.

Kokeen aikana lisättiin kaksi koneellista menetelmää:

- **M14.** Kirjan jokainen "crippled"-lause aluksen sivulla ja seuraavalla
  sivulla verrataan kortin crippled-riviin.
- **M15.** Jokaisen saattajakortin kriittisen osuman rivit tarkistetaan
  kirjaa vasten.

Kokemus pistokokeesta 19: agenttien korttitarkastus- ja sääntölakimiesväitteistä
noin 40 % oli vääriä. Syitä oli kolme: toisen listan hinta, sivuviittauksen
ohittaminen ja käyttöliittymän suodattama tarjonta. Siksi agentti vain
ehdottaa, ja jokainen väite luetaan kirjasta ennen tuomiota. Vastaavasti
agentin toistuva löydös monessa listassa (esimerkiksi ainoa saattaja) on
yksi juurisyy, ei monta löydöstä.

Kierros 3 lisäsi kolme opetusta:

- **Saman sivun esimerkki ohjaa lukutapaa.** Hulkkien kielto "any upgrade
  that improves Boarding Value" luettiin kolmessa pistokokeessa koskemaan
  myös boarding-nopan muuntimia. Sama sivu kuitenkin sanoo "Mega-armoured
  Boarding Parties is unchanged". Päättely "sama vaikutus kuin jo kielletyllä"
  tarkistetaan ennen käyttöä, koska kielletty voi itse olla tulkintavirhe.
- **Katkennut teksti: poiminta vai kirja?** WIP-kirjan taitto katkaisee
  kappaleita (s.241, 245, 249). Sivukuva (`fitz`, `get_pixmap`) erottaa
  poimintavirheen kirjan omasta katkosta.
- **Hinta yhdellä ja usealla aluksella.** Jokainen hintatyyppi (per ship,
  per bay, per squadron) testataan sekä yhdellä että usealla aluksella.
  Per-bay-hinta ei skaalautunut laivueelle (J85, P1).

## Lainalaivat ja neljä koneellista menetelmää — pistokoe 20

Versio 1.1 toi uuden konfiguraatioavaruuden: (isäntälista, lähdelista, alus,
rooli) × isännän päivitykset. Yksikään aiempi kierros ei ollut nähnyt sitä,
ja P1-osuus oli 50 % (`docs/pistokokeet/2026-09-14-20-lainalaivat.md`).

- **M20 lainalaiva-pistokoe.** `node spot_check.js --seed N --from "<isäntä>"
  --role reserve` ottaa siemenen rivin lähdelistalta ja laivaston toiselta.
  Tuloste merkitsee isännän rivit *ISANNALTA* ja näyttää laivaston
  tarkistusrivit. Isäntä arvotaan deterministisesti: rivin listan jälkeen
  seuraava samanrotuinen lista ilman `res_ban`-listoja. Lue ensin profiilisivu,
  lähdelistan sivu, isäntälistan sivu ja s.14–16; yhden aluksen laivastossa
  "Reserves (T) = 1 / 0" on odotettu punainen, ei löydös.
- **M16 sivutarkistus** `python check_pages.py`: jokainen pelaajalle näytetty
  lause (saannon lähdelause, *Check yourself*, rivin huomautus) on kirjassa.
  Löysi 16 sovelluksen omaa lausetta kirjan sääntöinä → `sec.notes` ja
  *Builder's notes*.
- **M17 laskutarkistus** `python check_golden_math.py`: goldenin perustelun
  lasku täsmää odotukseen. Testi ei voi huomata sitä itse, koska se vertaa vain
  sovellusta odotukseen.
- **M18 tallennefuzz** `node fuzz_save.js`: tuhansia siemenellä arvottuja
  rikkomuksia skeema 3:n tallenteeseen; invariantti on "palautunut yksikkö
  vastaa ladattua dokumenttia tai puuttuu ilmoituksen kera".
- **M19 symmetria** `node check_symmetry.js`: sama isäntä, samat omat alukset,
  eri samanrotuinen lähde → sama budjettirivi; sama pari toisin päin → sama
  muoto.

Kaikki neljä ovat `acceptance.py`:n vaiheita. Kokemus: lukijoiden 19
väitteestä 8 oli juurisyiltään oikeita ja loput olivat joko dokumentoituja
päätöksiä (T34), laivastotason sääntöjä tai jo punaisen laivaston sivuoireita.
Vahvistus kannattaa tehdä deterministisesti ennen agenttia: `check_quotes.py`:n
`Book.has` lainaukselle ja Node-ajo väitteelle maksavat murto-osan.

## Ulkopuoliset pistokokeet

`chatGPT palaute yms/GFR_manuaalinen_korttipistokoe_2026-09-09.md` ja
`…_2_2026-09-09.md` ovat mallit: rajaus ja menetelmä, yhteenvetotaulukko,
löydös lähteineen, "miksi vihreä ei löytänyt", korjausjärjestys ja
hyväksymisehdot. Sama rakenne omiin raportteihin.
