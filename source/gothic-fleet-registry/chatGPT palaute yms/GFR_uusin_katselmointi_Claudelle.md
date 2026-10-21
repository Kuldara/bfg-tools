# Gothic Fleet Registry - uusimman version jatkokatselmointi

**Päiväys:** 7.9.2026  
**Kohde:** `Gothic Fleet Registry(2).html`  
**Vertailu:** `Gothic Fleet Registry(1).html` ja edellisen katselmoinnin virhetapaukset.

## Johtopäätös

Tämä versio laajentaa sääntökattavuutta, mutta ei vielä ratkaise edellisessä katselmoinnissa löydettyjä ongelmia. Kaikki 13 aiemman kohdennetun testisarjan hyväksymisehtoa epäonnistuvat edelleen. Lisäksi versiovertailu osoittaa todellisen Bastion-validoinnin regression ja vanhan tallennuksen lukemisen yhteydessä laivaston tyhjentävän virheen.

13 testiä ovat tarkoituksella valittuja, jo aiemmin virheellisiksi havaittuja tapauksia. Luku ei ole koko sovelluksen onnistumisprosentti, eivätkä kaikki ehdot vastaa eri juurisyytä: esimerkiksi tupla-Novan hinnalle ja aseriveille on omat ehtonsa.

Suositus: korjaa tallennusten suojaus ja väärät sääntöviittaukset ennen tämän version viemistä vanhan julkaisun tilalle. Älä aloita koko sovellusta uudelleen tai vaihda frameworkia. Yhden HTML:n jakelumalli on edelleen toimiva ratkaisu.

## 1. Mitä oikeasti muuttui

| Asia | Vanha | Uusi |
|---|---:|---:|
| Laivastolistat | 30 | 32 |
| Alusprofiilit | 171 | 171 |
| Listojen alusmerkinnät | 460 | 462 |
| Tiedostokoko | 872 651 tavua | 1 016 962 tavua |

Kaikki 171 `ships`-tietuetta ovat JSON-jäsennyksen jälkeen rakenteellisesti identtiset vanhan version kanssa. Tämä ei tarkoita, että kaikki muu data olisi muuttumatonta: listat, säännöt ja selitystekstit ovat muuttuneet huomattavasti.

Sovelluksen varsinaisen JavaScript-lohkon muutokset rajoittuvat `checks()`- ja `addUnit()`-funktioihin. Muutokset kohdistuvat pakollisuusotsikon tekstiin, squadron-sääntöjen osumiseen oikeisiin osioihin, päivitysten lukumäärärajoitukseen ja uuden escort-ryhmän oletuskokoon. Aseistuksen muodostusta, pistelaskennan ydintä, tallennusmigraatiota tai korttien sovitusta ei ole korjattu. `code.diff` sisältää koko tämän koodieron.

Hyödyllisiä, ajossa varmistettuja muutoksia:

- Vanguard Fleetin Kraken-ryhmän oletuskoko on nyt 6; viisi hylätään ja kuusi hyväksytään tämän kokorajan osalta.
- Hive Fleetin Kraken-ryhmän oletuskoko on 1; 13 hylätään ja 12 hyväksytään kokorajan osalta.
- Kolme Tyranid-risteilijää yhden Hive Shipin kanssa hylätään suhteella 3/2.
- Cairn ilman Scytheä hylätään, ja yhden Scythen lisääminen täyttää kyseisen suhdevaatimuksen.

Grey Knightsin erottaminen omaksi listakseen ja Corsair-listan jakaminen kahteen versioon selkeyttävät luetteloa. Tämä katselmointi ei vahvista niiden kaikkia sääntösisältöjä oikeiksi.

## 2. P0 - vanha laivastotallenne voi tyhjentyä ja ylikirjoittua

### Toisto ja tulos

Testi rakensi vanhassa sovelluksessa yhden nimetyn aluksen jokaiseen 30 vanhaan laivastolistaan käyttäen oikeaa `addUnit()`-polkua ja tallensi sen vanhan version oikealla `save()`-funktiolla. Nämä JSON-tallenteet annettiin uuden version `load()`- ja `render()`-polulle samalla tallennusavaimella.

**Vain 4/30 testitallennetta säilyi. 26/30 tyhjeni, ja tyhjä laivasto kirjoitettiin saman avaimen tallenteeksi.**

Säilyneet näytteet: Gothic Sector, Codex Astartes, Adeptus Mechanicus Explorator ja The Emperor's Inquisition. Tulos koskee valittuja 30 testitallennetta, ei jokaista mahdollista kokoonpanoa kussakin listassa.

### Juurisyy

`load()` luottaa laivastolistan numerolliseen indeksiin `li` ja aluksen osioindeksiin `u.s`. Listan nimeä verrataan vanhaan indeksiin osuvaan uuteen listaan, mutta oikeaa listaa ei etsitä sen siirryttyä. Myöskään siirtynyttä osiota ei haeta oikeasta paikasta. Uudet listat ja alkuun lisätyt `FLEET RULES` -osiot muuttavat juuri näitä indeksejä.

Epäonnistunut palautus johtaa tyhjään laivastoon. Seuraava `render()` kutsuu tallennusta ja ylikirjoittaa vanhan datan. Tämä on eri asia kuin edellisen katselmoinnin synteettinen testi, jossa aluksen optiolistan alkuun lisättiin uusi optio: nyt yhteensopimattomuus syntyy kahden toimitetun aidon version välillä.

### Korjaus

1. Ota vanha raakamuotoinen JSON muuttamattomana talteen ennen migraatiota.
2. Käytä pysyviä `fleetId`, `sectionId`, `entryId` ja `optionId` -tunnisteita; erota `schemaVersion` ja `catalogVersion`.
3. Toteuta näille kahdelle versiolle tietoinen migraatio. Älä päättele identiteettiä taulukon paikasta.
4. Migraation epäonnistuessa estä automaattinen ylikirjoitus ja näytä palautus-/vientimahdollisuus.

**Rajaus:** testi käytti vain muistissa olevaa `localStorage`-korviketta. Oikeita käyttäjätallenteita ei luettu eikä muutettu. Riski toteutuu, kun päivitetty sovellus lukee saman tallennusympäristön vanhaa dataa. Eri osoitteiden tai paikallisten tiedostojen tallennustilan jakautumista ei tässä testattu.

## 3. P1 - Bastionin aiemmin toimiva rajoitus antaa nyt väärän hyväksynnän

### Toisto

Bastion Fleets: Fleet-Admiral 50 + Emperor 365, ei yhtään risteilijää, pisteraja 1500.

| Versio | Battleships-tarkistus | Kokonaistila |
|---|---|---|
| Vanha | 1 / 0 | 1 problem |
| Uusi | 0 / 0 | all clear |

Sama virheluokka toistuu Avenger grand cruiserilla ilman tukiristeilijöitä. Myös kelvollinen Emperor + kolme Lunaria hyväksytään uudessa versiossa, mutta battleship-määrä raportoidaan siinäkin väärin nollaksi. Pelkät laillisten listojen hyväksymistestit eivät siis paljasta ongelmaa.

Fleets WiP v0.36 s. 37: yksi battleship per kolme cruiseria/battlecruiseria; yksi battlecruiser tai grand cruiser per kaksi cruiseria. Grand cruiser ei kelpaa battleshipin tukiristeilijäksi.

### Juurisyy

Vanhan listan `Battleships` on osiossa 2 ja `Cruisers` osiossa 3. Uudessa listassa ne ovat osioissa 3 ja 4. Sisäkkäiset `allow_pick[].sec`- ja `per_pick[].sec`-viittaukset ovat kuitenkin jääneet vanhoihin arvoihin. Osio 2 tarkoittaa nyt tyhjää `THE BASTION FLEETS` -tekstiosiota.

Moottori ei kaadu: se laskee säännön väärästa osiosta nolla alusta ja näyttää vihreää. **Tämä on todistettu regressio, ei vain puuttuva ominaisuus.**

### Korjaus

Korjaa välittömästi virheelliset kohdistukset, mutta älä rajaa pysyvää ratkaisua yhteen indeksin kasvattamiseen. Sääntökohteiden pitää viitata pysyviin tunnisteisiin. Lisää testit, joissa tekstiosion lisääminen tai osioiden järjestyksen vaihtaminen ei muuta samoihin aluksiin sovellettavaa validointia. Viittauksen on osuttava paitsi olemassa olevaan myös semanttisesti oikeaan kohteeseen.

## 4. P1 - uusi Sepulchre-raja ei valvo normaalia valintapolkua

Uudessa datassa fleet-päivityksen Sepulchre-raja on `mx:1`. Uusi tarkistus laskee vain `u.ups`-valintoja. Cairnin oma Sepulchre-optio tallentuu kuitenkin `u.opts`/`u.os`-rakenteeseen. Vastaava fleet-päivitys piilotetaan käyttöliittymästä, koska oma optio jo kattaa sen.

Toistin myös oikeilla käyttöliittymän painikkeilla:

- 2 Cairnia, molemmille Sepulchre aluksen omista optioista.
- 2 Scytheä, jotta Tombship/Scythe-raja täyttyy.
- Yhteensä 1650 / 2000 pistettä.
- Tulos: **all clear**.

Kun samat Sepulchret asetetaan piilotetun fleet-päivityspolun kautta suoraan setterillä, uusi tarkistus hylkää kokoonpanon tuloksella 2/1. Tarkistus siis toimii vain toisessa sisäisessä esitystavassa.

Fleets s. 404-405 sallii Sepulchren yhdelle Tombshipille. Korjauksen pitää laskea ratkaistun kokoonpanon kanoniset Sepulchre-valinnat riippumatta siitä, mistä käyttöliittymän kohdasta ne valittiin. Älä lisää vain kolmatta erityistapausta kahden nykyisen valintamallin päälle.

Tämä ei ole näyttö vanhan toimivan tarkistuksen rikkoutumisesta: kyseessä on uusi mutta tavallisessa käytössä riittämätön tarkistus.

## 5. P1 - Eldarien uusi battleship-raja pyöristyy väärään suuntaan

Listassa `Eldar Corsairs - Later Gothic War` täysien tuhansien raja on kytketty geneeriseen `per_points`-laskentaan:

```js
Math.max(1, Math.ceil(lim / r.per)) * r.each
```

| Pisteraja testissä | Sovelluksen enimmäismäärä | Täysien tuhansien raja |
|---|---:|---:|
| 500 | 1 | 0 |
| 999 | 1 | 0 |
| 1000 | 1 | 1 |
| 1500 | 2 | 1 |
| 1999 | 2 | 1 |
| 2000 | 2 | 2 |

500 pisteen asetuksella Void Stalker 380 + Pirate Prince 100 saa `all clear`. 1500 pisteen asetuksella kaksi Void Stalkeria + Prince saa myös `all clear`.

Fleets s. 317 sanoo nimenomaisesti täysistä tuhansista ja antaa esimerkit 0-999 = ei battleshipejä, 1000-1999 = yksi.

**Älä vaihda geneeristä `ceil`-laskentaa kaikkialla `floor`-laskennaksi.** Muut säännöt voivat koskea alkavia pistejaksoja. Mallinna pyöristystapa ja sallittu nollatulos sääntökohtaisesti. Testaa vähintään 999/1000/1999/2000 sekä täysiä että alkavia jaksoja käyttävä sääntö. Pisterajan ja toteutuneen listahinnan käyttöperiaate on erikseen tehtävä eksplisiittiseksi; edellä esitetyt 500/1500 virhehyväksynnät eivät riipu siitä, kumpi valitaan, sillä testilistatkin jäävät kyseisten kynnysten alle.

## 6. Aiemmat 13 hyväksymisehtoa: kaikki edelleen korjaamatta

Testiadapterin listojen ja osioiden paikat päivitettiin vastaamaan uutta katalogia. Odotettuja sääntötuloksia ei löysennetty.

| Hyväksymisehto | Uuden version havainto | Odotettu |
|---|---|---|
| Lunar crippled neljän menetetyn HP:n jälkeen | from box 5 | from box 4 |
| Hive: toistuvien launch bay -settien määrä säilyy | kapasiteettiapuri 4; kyljillä 1/1 | kokonaiskapasiteetti 8; kyljillä 3/3 |
| Ram -> oma Nova ei jätä piiloveloitusta | 240 pts, ram piilossa | 235 pts |
| Sama Nova ei tule veloitetuksi kahdesti | 255 pts | 235 pts |
| Aktiivinen Nova-aserivi ei kahdennu | 2 riviä | 1 rivi |
| 12 escortille 12 seurantaruutua | 6 ruutua | 12 ruutua |
| Geneerinen Venerable ei tarkoita Seditioa | Seditio Opprimere 450 | geneerinen valinta tai tuen puutteen ilmoitus |
| Mercuryn torpedovaihdon alennus | 255 pts | 235 pts |
| Hive: avoin aseoptioiden maksimi huomioi poissulkevuuden | 525 pts | 320 pts |
| Copy list säilyttää ostetun Dakkan | puuttuu | mukana |
| Copy list säilyttää manuaalisen huomautuksen | puuttuu | mukana |
| Oman optiolistan muutos ei muuta tallennettua Nova-valintaa | muuttuu testissä toiseksi optioksi | sama semanttinen valinta |
| Aseeton Hive ilman escortteja ei saa ehdotonta all clear -tilaa | all clear | virheet / tarkistuksen keskeneräisyys näkyviin |

Venerablen huomautus ei enää suoraan väitä kirjan sivuviitettä vääräksi. Se kuitenkin edelleen korvaa s. 102 geneerisen säännön s. 103 nimetyllä Seditio-profiililla. Sanamuodon pehmentäminen ei korjaa valinnan sisältöä.

Lisähavainnot säilyvät: Ork Hulk saa tavallisen 2D6 critical -taulukon ja crippled-tekstin. `auditAllCardLayouts()` raportoi 462 kortille nolla ylivuotoa, mutta Hive-kortin pienin efektiivinen tekstikoko on edelleen noin 2,15 pt. Luettavuutta ei siis voi hyväksyä pelkällä overflow-testillä. Tämä on CSS-mittaus, ei fyysisen tulosteen lukutesti. Audit ei myöskään rakenna kaikkia testialuksia `applyRequired()`-vaiheen kautta kuten normaali lisäystoiminto.

Tarkistuksen sääntölähteitä: Rulebook v1.10 s. 65 (crippled); Fleets WiP v0.36 s. 64 (Mercury), 102-103 (Venerable/Seditio), 121 (AdMech-optioehdot), 391 (Ork Hulk), 430-432 (Hive Fleet ja Hive Shipin asevalinnat). Edellinen katselmointi sisältää näiden aiempien löydösten pidemmät perustelut.

## 7. Korjausjärjestys Claudelle

**Ensimmäinen vaihe: estä tiedon menetys ja virhehyväksynnät.** Suojaa tallenne, korjaa Bastionin kohdistukset, Sepulchren tavallinen UI-polku ja Eldarin pyöristys. Älä käsittele tyhjää väärään kohteeseen osunutta joukkoa onnistuneena validointina ilman semanttista tarkistusta.

**Toinen vaihe: yksi ratkaistu kokoonpano.** Aluksen omat optiot ja fleet-päivitykset voivat pysyä käyttöliittymässä erillisinä, mutta niiden vaikutukset, määrät, riippuvuudet ja piste-erittely pitää ratkaista samassa mallissa. Kortti, rosteri, Copy list ja validointi lukevat samaa `resolveUnit()`-tulosta. Tämä poistaa Sepulchren ja Novan kaltaisen reittiriippuvuuden juurisyyn.

**Kolmas vaihe: julkaisun hyväksymiskriteerit.** Testaa vanha tallenne -> uusi julkaisu, laillinen lista sekä sitä lähellä oleva laiton lista, toistuvat aseostot, negatiiviset hinnat, samojen päivitysten eri valintajärjestykset ja kaikkien vientien vastaavuus. Tallenna odotusarvot riippumattomasti sääntökirjasta, ei samasta funktiosta jota testataan.

**Neljäs vaihe: rehellinen kattavuus.** Erota tarkistetut ehdot, löydetyt virheet ja tarkistamatta jääneet ehdot. `All clear` ei saa tarkoittaa, että toiminto vain ei osannut tarkistaa käsillä olevaa sääntöä. Korttien ulkoasutestille tarvitaan myös luettavuuden alaraja ja selkeä ylivuotopolku, ei rajaton pienennys.

Koko sovelluksen uudelleenkirjoittaminen ei ole edellytys. Etene hallituilla muutoksilla ja pysyvillä regressiotesteillä; pidä yksi HTML jakelumuotona.

## 8. Testauksen laajuus ja rajaukset

Uusimmasta tiedostosta muodostettiin Chromiumissa 462 listan alusmerkinnän peruskortit, käsiteltiin 62 komentajamerkintää ja kokeiltiin 357 yksittäistä alusoptiota. Näissä savutesteissä ei tullut JavaScript-poikkeuksia. Muokattavan HTML-viennin muodostus ja uudelleenavaaminen onnistui. Testiajon verkkopyyntiloki oli tyhjä.

Suurin osa kohdennetuista testeistä kutsuu oikean sovelluksen funktioita selaimen sisältä. Ram -> Nova ja kaksois-Sepulchre varmistettiin lisäksi painikkeilla. Migraatiotesti käyttää aitoja save/load-funktioita mutta muistissa olevaa tallennustilaa. Kyseessä ei ole kaikkien selainten, kaikkien sääntöyhdistelmien, todellisen palvelinjulkaisun tai paikallisen tiedoston pysyvän tallennuksen kattava E2E-testi.

Alkuperäisiä HTML-tiedostoja ei muutettu. Paketin testit ovat tähän snapshotiin sidottuja; seuraavaa versiota testattaessa luettelopaikat ja adapterit on tarkistettava, mutta hyväksymisehtoja ei pidä muuttaa toteutuksen virheitä vastaaviksi.

## 9. Tiedostot ja tunnisteet

- `audit_registry_v2.py`: aiempien virhetapausten uusinta, savutesti ja valinnainen ulkoasuaudit.
- `audit_changes.py`: aito versiovertailu, tallenteiden siirto ja uusien tarkistusten testit.
- `current_results/`: 13 hyväksymisehdon tulokset, muut havainnot ja Hive-korttikuva.
- `changes_results/`: versionvaihdon tulokset ja Bastionin väärän hyväksynnän kuva.
- `new_contracts.json`: lisättyjen hyväksymisehtojen sekä toimivien kontrollien tulokset.
- `code.diff`: sovelluksen varsinaisen JavaScript-lohkon muutos.
- `comparison.json`: tiedostotunnisteet ja vertailun perustiedot.

Vanha SHA-256: `a79bc5b46517d4f3ca4c923e91823bdca2f0bcfa319b975aa1e9f6f5956f431f`  
Uusi SHA-256: `a7977307ea68a15ba88badc9a963d8a499e2f267693614831830a2a63bb57c24`
