# Gothic Fleet Registry: nykyversion katselmointi Claudelle

**Paivays:** 8.9.2026  
**Kohde:** `Gothic Fleet Registry.html`  
**SHA-256:** `c2c6d9af33a528d8bd4b4a54670c923767b49a8ce36f3e59c2612bb87dfca1dd`  
**Rajaus:** sovelluksen lahteita ja julkaistavaa HTML-tiedostoa ei muutettu. Tama tiedosto on vain katselmointiraportti.

## Johtopaatos

Nykyversio on selva parannus. Kaikki paketin omat testit menevat lapi, aiempi saman tallenteen Mark-monistus on korjattu, estetty `localStorage` ei enaa kaada kaynnistysta ja selaimen 462 peruskortin auditissa ei ole ylivuotoa.

Versiota ei silti pidä julkaista viela. Normaalilla kayttoliittymalla toistuu kolme vakavaa kayttajapolkua:

1. laivastolistan vaihtaminen tyhjentaa ja ylikirjoittaa nykyisen laivaston ilman varoitusta;
2. AdMech Lunarin Nova Cannon -valinnat voivat jattaa piiloveloituksen tai veloittaa saman muutoksen kahdesti;
3. `Copy list` jattaa maksetut fleet-upgradet ja kasin lisatyn refit-/note-rivin pois.

Lisaksi kortin ratkaistu profiili on edelleen eri asia kuin laskutettu kokoonpano useissa aluksissa. Testit ovat vihreita, koska ne tarkistavat suurelta osin rakenteen, perusprofiilit ja toteutuksen oman pistelaskun, eivat kaikkien valintojen saantokirjasta johdettua lopputulosta.

Suositus: jatka nykyisesta koodipohjasta, mutta tee yksi kanoninen `resolveUnit()` ennen uusia ominaisuuksia. Frameworkin tai yhden HTML-tiedoston jakelumallin vaihtamiseen ei ole tarvetta.

## Testauksen yhteenveto

| Ajo | Tulos |
|---|---|
| `node test_validator.js` | kaikki lapi |
| `node test_upgrades.js` | kaikki lapi |
| `node test_save.js` | kaikki lapi |
| `node qa_structure.js` | 7 615 tarkistusta, 0 loydosta |
| `node stress.js 6` | 4 414 tapausta, 76 154 tarkistusta, 0 loydosta |
| `node print_check.js` | 462 korttia / 32 listaa ja 62 komentajakorttia, 0 loydosta |
| `python audit.py` | 171 alusta, 32 listaa, 810 listarivia, 0 loydosta |
| `python coverage.py` | 85 hinnoiteltua lausetta, kattamatta 0 |
| `python check_reference.py` | 32/32 listaa, 488 saantoa ja 688 listarivia, 0 loydosta |
| `python crosscheck_bsdata.py` | 752 tilastokenttaa, 98,9 % samoja; 8 tunnettua Remastered-versioeroa |
| Oikea selain, normaali kaynnistys | ei console warning/error -riveja |
| `?layout-audit=1` oikeassa selaimessa | 32 listaa, 462 korttia, 0 ylivuotoa |

Vihrea testisarja on arvokas savutesti, mutta alla olevat riippumattomat sopimustestit osoittavat sen aukot.

## 1. P1 - laivastolistan vaihtaminen havittaa nykyisen tyon

### Toisto

1. Valitse `Orks — Waaagh!`.
2. Lisaa Terror Ship, ota esimerkiksi Dakka Dakka ja kirjoita refit-/note-kenttaan teksti.
3. Vaihda `Fleet list` -valikosta Gothic Sectoriin.
4. Vaihda takaisin Waaagh!-listaan.

**Tulos:** laivasto on tyhja. Tyhja tila tallennetaan heti saman `localStorage`-avaimen paalle. Varoitusta, undo-toimintoa tai listakohtaista luonnosta ei ole.

Juurisyy on suora tapahtumakasittelija `app_template.html:2832`:

```js
$("#listsel").onchange = e => { S.li = +e.target.value; S.units = []; render(); };
```

`Clear` kysyy vahvistuksen, mutta saman lopputuloksen tekeva tavallinen pudotusvalikko ei kysy.

### Korjaus

- Ala ylikirjoita nykyista tallennetta ennen vahvistettua vaihtoa.
- Vahintaan nayta vahvistus, jos `S.units.length > 0`.
- Parempi malli on listakohtainen luonnos tai nimettyjen laivastojen lista seka undo/palautus.
- Lisaa oikea UI-testi: rakenna laivasto -> vaihda listaa -> peruuta/palaa -> kaikki rivit, valinnat ja pisteet sailyvat.

## 2. P1 - oma alusoptio ja fleet-upgrade eivat muodosta samaa kokoonpanoa

### Piiloveloitus

Normaali UI-polku:

1. `Adeptus Mechanicus — Explorator`.
2. Lisaa Lunar, 215 pistetta.
3. Ota `Imperial Power Ram`, +5.
4. Ota Lunarin oma `Can replace its prow torpedoes with a nova cannon`, +20.

**Tulos:** Power Ram katoaa nakyvista, mutta summa on 240. Oikea summa on 235: 215 + yksi Nova Cannon 20. Piilotettu ram veloitetaan edelleen.

### Kaksoisveloitus

Tuoreella Lunarilla ota ensin listan `Nova Cannon Instead Of Prow Torpedoes`, sitten aluksen oma Nova-optio.

**Tulos:** 255 pistetta. Listan Nova-rivi katoaa nakyvista, mutta molemmat +20 valinnat jaavat laskuun. Kyseessa on yksi sama prow-slotin vaihto, joten tuloksen pitaa olla 235 ja kortilla yksi Nova-rivi.

Juurisyy: `setUpState()` siivoaa fleet-upgradejen kelpoisuutta, mutta `setOptState()` (`app_template.html:1054`) ei ratkaise tai pura jo ostettuja fleet-upgradeja. `upgradesFor()` voi piilottaa kelvottoman rivin, kun taas `upgradePts()` (`app_template.html:1263`) veloittaa sen yha. Hinta, nakyvyys ja aseistus lukevat eri tilaa.

### Korjaus

Ratkaise aluksen omat optiot, fleet-upgradet, profiilimuutokset, ase-slotit, hinta ja tulostettavat tekstit yhteen kanoniseen tulokseen. Molempien settereiden jalkeen on ajettava sama normalisointi. Sama semanttinen vaikutus saa esiintya vain kerran riippumatta siita, mista UI-kohdasta tai missa jarjestyksessa se valittiin.

Pakollinen regressiosopimus:

```text
resolve(actions in any valid order) == same price, weapons, stats and rules
no hidden selected item may contribute points
one weapon slot resolves to exactly one active weapon
```

## 3. P1 - Copy list tuottaa hinnan, jota sen sisalto ei selita

UI-toisto:

- Terror Ship 185
- Dakka Dakka: +2 Turrets, +20
- kasin kirjoitettu `Kustom force field`, +7
- yhteensa 212

Kopioitu tulos oli:

```text
• Terror Ship  212 pts
```

Dakka Dakka ja manuaalinen huomautus puuttuvat kokonaan. Vastaanottaja ei voi tarkistaa, mista 27 lisapistetta tuli.

`listText()` (`app_template.html:2814`) tulostaa vain `u.opts`-valinnat. Se ei kay lapi `u.ups`-valintoja eika `u.note`/`u.adj`-tietoja. `printRoster()` tekee taman jo paremmin, joten kahden viennin sopimus on ristiriidassa.

### Korjaus

Kaikkien vientien tulee lukea samaa ratkaistua optiolistaa. Testaa vahintaan oma alusoptio, fleet-upgrade, pakollinen upgrade, manuaalinen note + positiivinen/negatiivinen `adj`, squadron-koko ja avoin hinta. Varmista, etta kortti, rosteri ja Copy list selittavat saman kokonaissumman.

## 4. P1 - useiden maksettujen optioiden vaikutus ei paady kortin profiiliin

Kohdennetun ajon tulokset:

| Valinta | Hinta | Kortin/profiilin havainto | Odotettu vaikutus |
|---|---:|---|---|
| Dominator, earlier version -5 | 185 | patterit edelleen 30 cm / FP 12 | 45 cm / FP 6 |
| Hammer, turret upgrade +10 | 255 | TURRETS edelleen 2 | TURRETS 3 |
| Warsphere, +2 HP/+2 FP +20 | 165 | HP 10 ja FP 12 ennallaan | HP 12 ja FP 14 |
| Hive Ship, kolme side launch bay -settia | 260 | yksi `1 / 1` -rivi; `bayStrength()` = 4 | side 3 / 3, kokonaiskapasiteetti 6 ilman thorax-bayta |
| Ork Hulk | 600 | tavallinen `CRITICAL DAMAGE (2D6)` ja normaali crippled-malli | Hulkin oma critical/crippled-kasittely, Fleets s. 391 |

Warsphere on viela erillinen maaramallin puute: +2 HP/+2 FP saadaan ostaa enintaan kolme kertaa ja -2 HP/-2 FP enintaan kaksi kertaa, mutta UI:ssa kummallakin on vain yksi Take/Option/Hide-tila. Toistoa ei voi esittaa eika hinnoitella.

`armModel()` (`app_template.html:2038`) tuntee eksplisiittiset `sw`-vaihdot ja `effTurrets()` (`app_template.html:2122`) fleet-upgraden `mod`-kentat. Aluksen omille optioille ei ole yleista stats-/quantity-mallia. Heuristinen haku nosti 57 aluksen omaa optiota, joiden teksti puhuu ase-, HP-, shield-, turret-, armour-, range- tai vastaavasta muutoksesta mutta joilla ei ole `sw`-rakennetta. Kaikki 57 eivat valttamatta vaadi numeerista profiilimuutosta, mutta ne ovat pakollinen semanttinen katselmointijono.

### Korjaus

- Laajenna option dataan eksplisiittiset `effects` ja `quantity`/`maxQuantity`.
- Johda tehokkaat statsit ja aseistus vain ratkaistusta tuloksesta.
- Testaa jokaiselle vaikutusoptiolle seka hinta etta muuttunut profiili. Pelkka oikea hinta ei ole hyvaksyminen.
- Lisaa Hive Shipille toistuvan valinnan maara aseistusriville ja launch bay -kapasiteettiin.
- Mallinna Hulkin poikkeava vauriotaulukko omana hullityyppinaan.

## 5. P1 - geneerinen Venerable Battle Barge muuttuu hiljaa Seditio Opprimereksi

`Space Marines — Codex Astartes` -listan `Venerable battle barge (varies)` ratkaistuu suoraan profiiliin 103:

```text
SEDITIO OPPRIMERE, VENERABLE BATTLE BARGE
```

Tama ei ole geneerinen sivun 102 valinta vaan nimetty esimerkki sivulta 103. Kayttaja voi muuttaa pistehintaa, mutta statsit, aseistus ja saannot jaavat Sedition profiiliksi.

Nykyinen `test_validator.js` jopa vaatii taman mappauksen PASS-tulokseksi. Testi siis lukitsee tunnetun semanttisen virheen.

### Korjaus

Tee geneerisesta Venerablesta oikea valinta-/rakennuspolku tai nayta eksplisiittisesti, ettei geneerista profiilia viela tueta. Ala korvaa sita nimetylla aluksella ilman kayttajan valintaa. Muuta regressiotesti vertaamaan saantokirjasta johdettuun odotukseen, ei nykyiseen `r:103`-arvoon.

## 6. P1 - komentajakortti vuotaa vaihtoehtoisen komentajan saantoja

`showsAsCommanderRule()` (`app_template.html:2232`) palauttaa `true` kaikille teksteille, joiden omistaja ei ole upgrade-rivi. Se ei tarkista, onko tekstin omistaja juuri valittu komentajarivi.

Toisto: lisaa tavallinen `Fleet-Admiral (Ld 8)` Armageddon-listalta ja muodosta komentajakortti.

**Tulos:** kortille tulee `Your fleet commander gets a single re-roll included...`, vaikka datan `own` sitoo tekstin `Master of the Fleet (Ld 10)` -riviin. Samassa osiossa on nelja vaihtoehtoista komentajaa.

Aiempi korjaus tarvitsi yhteisia commander-family-saantoja, koska esimerkiksi Archmagosin sivuasettelu omisti molempia Archmagoseja koskevan tekstin vain Veneratus-riville. Ratkaisu ei voi siksi olla pelkka `owner === selectedLabel`, mutta kaikkien base-entry-tekstien nayttaminen kaikille ei ole myoskaan oikein.

### Korjaus

Kayta eksplisiittista soveltuvuutta, esimerkiksi `scope: commander-family`, `scope: base-entry` ja `scope: upgrade`, seka pysyvia tunnisteita. Lisaa jokaiselle monen komentajan osiolle positiivinen ja negatiivinen matriisi: valitun perussaanto nakyy, vaihtoehtoisen komentajan oma saanto ei nay, yhteinen perhesaanto nakyy kaikille.

## 7. P1 - jaettava ZIP sisaltaa vanhan sovelluksen

| Artefakti | Havainto |
|---|---|
| nykyinen `Gothic Fleet Registry.html` | 1 015 313 tavua, SHA-256 `c2c6...a1dd`, 8.9. klo 9.16 |
| `share version/Gothic Fleet Registry.zip` -paketin HTML | 1 017 278 tavua, SHA-256 `c9b8...9143`, 8.9. klo 1.40 |
| `julkaisu/site/index.html` | sisaltaa nykyiset tallennus- ja komentajakorjausten tunnisteet |

ZIP:n HTML ei sisalla nykyisen version `showsAsCommanderRule`-korjausta, yhden ostoksen yhden palautuksen suojaa eika nykyista tallennusvirheen ilmoitusta. Jos ZIP on kayttajille jaettava paketti, julkaisu palauttaa jo korjattuja regressioita.

### Korjaus

Rakenna kaikki jakeluartefaktit samasta vahvistetusta HTML:sta vasta testien jalkeen. Tee manifesti, jossa on versionumero, katalogiversio ja SHA-256. Julkaisutestin tulee avata ZIP streamista ja verrata sen HTML:n tiivistetta juuri hyvaksyttyyn buildiin.

## 8. P1 - aluksen omat optiot tallentuvat edelleen indekseina

Fleet-upgradejen palautusta on vahvistettu nimilla, mutta aluksen omat optiot ovat yha `u.os[index]` / `u.opts[index]`. Synteettisessa katalogimuutoksessa Lunarin Nova-option eteen lisattiin yksi uusi optio. Uudelleenlatauksen jalkeen valittuna oli uusi `Inserted option`, ei Nova Cannon.

`save()`/`load()` alkavat riveilta `app_template.html:835` ja `:859`. Tallennusavaimen nimi on yha `gothic-fleet-registry-v1`, eika tallenteessa ole erillista `schemaVersion`- ja `catalogVersion`-tietoa.

### Korjaus

Anna listalle, osiolle, riville ja jokaiselle optiolle pysyva ID. Tallenna optiovalinnat ID:lla; indeksi saa olla korkeintaan vanhan datan migraatioapu. Migraation pitaa olla kuluttamaton ja moniselitteisyyden pitaa paatya palautusilmoitukseen, ei vaaran option valintaan.

## 9. P2 - nolla ylivuotoa ei tarkoita luettavaa korttia

Oikean selaimen layout-audit raportoi:

```text
cards 462, overflows 0
minOptionScale 0.6127
minZoneScale 0.4796
minCardScale 1
```

Hive Shipin 9+ option tilassa kuvaustekstin lahtokoko on 3,65 pt. Option skaala 0,6127 tekee efektiiviseksi kooksi noin **2,24 pt**. Sisalto ei leikkaannu, mutta se ei ole kaytannossa luettavaa tavallisessa tulosteessa.

Audit rakentaa vain `en.r`-alukset oletustilassa. `auditAllCardLayouts()` (`app_template.html:2706`) ei aja `applyRequired()`-vaihetta audit-yksikoille eika ota komentajakortteja mukaan. Nain se voi aliarvioida todellisen kortin sisallon.

### Korjaus

Paata eksplisiittinen tulostuksen minimikoko. Jos sisalto ei mahdu sen ylapuolella, tee jatkokortti, tiivistetty yhteenveto tai selkea virheilmoitus; ala jatka rajatonta pienennysta. Auditoi peruskortin lisaksi pakolliset paivitykset, kaikki valittu -aaritila, suurimmat squadronit ja komentajakortit.

## 10. P2 - metadata, ohje ja todellinen katalogi eivat vastaa toisiaan

Todellinen nykytila on 32 listaa, 171 profiilia ja 462 korttia. `build.py:68-69` kirjoittaa kuitenkin hakukone- ja linkkikuvaukseen `30 fleet lists` ja `460 cards`. Samat vanhat luvut ovat nykyisessa HTML:ssa ja sivujulkaisussa. `LUEMINUT.md` sisaltaa useita viela vanhempia 30 listan / 442 kortin lukuja.

Johda luvut buildissa datasta. Lisaa testi, joka vertaa nakyvaa metadataa, README-yhteenvetoa ja layout-auditin laskemia maaria katalogiin.

## 11. P2 - 0 pisteen raja ei selvia tallennus-palautuskierroksesta

`load()` kayttaa `limit: o.limit || 1500` (`app_template.html:972`). Tallennettu 0 palautuu arvoksi 1500. Jos 0 on sallittu syote, sen on sailtyttava; jos se ei ole sallittu, UI:n tulee estaa se. Kayta tyyppi-/raja-arvotarkistusta totuusarvotarkistuksen sijasta.

## 12. P2 - Legality / all clear on liian vahva lupaus manuaalisten ehtojen rinnalla

Aseistamaton Hive Ship voi saada koneellisten tarkistusten tilaksi `Legality — all clear`, vaikka pakolliset asevalinnat ja useat koostumusehdot ovat vain `Check yourself` -tekstia. Alalaidan selite rajaa lupausta, mutta otsikko kertoo silti useimmille kayttajille listan olevan laillinen.

Muuta tila esimerkiksi muotoon `Machine checks clear — N manual checks remain`. Tulostetun rosterin vastaava lause kannattaa muuttaa samalla. `All clear` kuuluu nayttaa vain, jos listalla ei ole ratkaisemattomia pakollisia manuaaliehtoja.

## Todetusti toimivaa

- Sama Chaos Lord + Mark -tallenne ei enaa monista ostosta: 45 -> 45, yksi Mark.
- Katkennut tai osittain yhteensopimaton tallenne saa varmuuskopion ja kayttajalle ilmoituksen.
- Estetty tallennusluku ei kaada sovellusta.
- Bastionin battleship/cruiser-suhde, Sepulchren 0-1-raja ja Eldarin taydet tuhannet toimivat aiempien kontrollien mukaan.
- 8 HP aluksen crippled-raja alkaa ruudusta 4.
- 12 escortin kortti saa 12 seurantapaikkaa.
- Mercuryn -20 vaihto tekee myos oikean prow-asevaihdon.
- Listan fleet-upgradet ja manuaalinen note nakyvat rosteritulosteessa, vaikka ne puuttuvat Copy list -viennista.
- Julkaistava nykyinen HTML ei sisalla ulkoisia verkkohakuja, ja normaali kaynnistys on virheeton.

## Korjausjarjestys Claudelle

1. **Suojaa kayttajan tyo.** Estä varoittamaton listanvaihdon ylikirjoitus ja siirra omat optiot pysyviin tunnisteisiin. Ala jaa vanhaa ZIP:ia.
2. **Tee yksi ratkaistu kokoonpano.** Korjaa Nova/power ram -reittiriippuvuus ja kaikki piiloveloitukset. Hinta, statsit, aseistus, saannot ja naytetyt valinnat tulevat samasta tuloksesta.
3. **Mallinna vaikutukset ja maarat.** Dominator, Hammer, Warsphere, Hive Ship ja muut 57 katselmointikandidaattia. Lisaa Hulkin oma vauriomalli.
4. **Korjaa ulostulot ja soveltuvuudet.** Copy list, komentajan scope ja geneerinen Venerable.
5. **Nosta testien todistusvoimaa.** Odotukset saantokirjasta, ei nykyisesta datasta; testaa valintajarjestysten permutaatiot ja kaikki vientikanavat.
6. **Rakenna vasta lopuksi artefaktit.** HTML, site ja ZIP samasta hashista; paivita dynaaminen metadata ja dokumentaatio.

## Seuraavan version hyvaksymisehdot

- Fleet list -vaihto ei voi tuhota laivastoa ilman vahvistusta ja palautuspolkua.
- AdMech Lunar maksaa 235 molemmilla Nova-valintapoluilla; yksi aktiivinen Nova, ei piilotettua ramia.
- Copy list, rosteri ja kortti listaavat samat maksetut ja manuaaliset valinnat seka saman summan.
- Dominatorin, Hammerin, Warspheren ja Hiven valitut vaikutukset muuttavat tulostettua profiilia oikein.
- Warspheren toistuvat ostot voidaan valita sallittuun maksimiin asti.
- Fleet-Admiral ei saa Master of the Fleetin omaa saantoa; yhteiset komentajasaannot sailyvat.
- Venerable ei muutu Seditio Opprimereksi ilman eksplisiittista valintaa.
- Oman option lisaaminen tai jarjestyksen vaihto ei muuta vanhaa semanttista valintaa.
- Layout-audit kattaa required/all-taken/commander-tilat ja noudattaa sovittua luettavuusrajaa.
- ZIP:n HTML:n hash vastaa hyvaksyttya buildia.

## Rajaukset

Testaus tehtiin Chromium-pohjaisessa selaimessa paikallisesta HTTP-palvelimesta ja Node/Python-testisovittimilla. Oikeaa tuotantodomainia, kaikkia selaimia, tulostimen fyysista mittakaavaa tai kaikkia noin 1 200 manuaalista saantovirketta ei tarkistettu. Selaintestin `localStorage` sisalsi vain katselmoinnin testilaivastoja.

