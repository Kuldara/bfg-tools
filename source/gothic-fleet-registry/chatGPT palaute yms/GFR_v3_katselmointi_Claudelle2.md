# Gothic Fleet Registry -- katselmointi 3 / palaute Claudelle

**Kohde:** `Gothic Fleet Registry(3).html`, tarkistettu 8.9.2026.  
**SHA-256:** `c9b8c43adcfef5e4d0843eae1691fa2a703a7dab98c54c45053467fdd3bc9143`  
**Vertailut:** keskustelussa toimitetut versiot `(1)` ja `(2)`.  
**Sääntölähteet:** liitetty Remastered Rulebook v1.10 ja Fleets WiP v0.36.

## Johtopäätös

Tämä on aidosti edellistä parempi versio. Viime katselmoinnin Bastion-, Sepulchre- ja Eldar-virheet on korjattu testatuissa tapauksissa. Todellisten aiempien versioiden tallenteiden palautus on parantunut olennaisesti. Korjauksia ei pidä perua eikä projektia kirjoittaa uudelleen.

Korjauskierros on kuitenkin osittainen. Alkuperäiset 13 hyväksymisehtoa epäonnistuvat edelleen. Lisäksi uusi komentajakortti tulostaa ostamattomia vaikutuksia ilman niiden optioiden nimiä tai ehtoja. Uusi tallenteiden suojaus toimii puuttuvien nimiviittausten kohdalla, mutta ei kaikilla virhepoluilla.

**Suositus:** jatka tästä versiosta, mutta tee seuraavaksi rajattu vakautuskierros. Älä ratkaise jokaista alla olevaa ristiriitaa uudella erikoistapauksella eri tulostuspolussa. Toisaalta pienet selvät sisältövirheet voi korjata heti; niiden ei tarvitse odottaa koko tietomallin yhtenäistämistä.

## 1. Todetut parannukset

| Kohde | Toistettu tulos |
|---|---|
| Bastion / Emperor ilman tukiristeilijöitä | Hylätään: Battleships `1 / 0`. Edellinen versio näytti `0 / 0` ja all clear. |
| Bastion / Avenger ilman tukiristeilijöitä | Hylätään. Myös laillisen Emperor + 3 Lunar -tukisuhteen kontrolli säilyi toimivana. |
| Necronien Sepulchre | Kaksi Cairnia omista alusoptioista ostetuilla Sepulchreilla hylätään: `2 / 1`. Testattu myös oikeilla käyttöliittymän painikkeilla, ei vain sisäisellä setterillä. |
| Eldar Later Gothic War | Pisteraja-asetuksilla 500/999 yksi battleship hylätään; 1000/1500/1999 kaksi hylätään; 2000 sallii kaksi kyseisen rajoituksen osalta. |
| Todellinen versio 2 -> 3 | 32/32 tallennusnäytettä säilyi. Jokaisessa yksi nimetty alus kustakin vanhan version laivastolistasta. |
| Todellinen versio 1 -> 3 | 29/30 vastaavaa näytettä palautui. Vanhan `Eldar Corsairs` -listan nimeä ei arvata kahden uuden listan välillä: raakadata säilyy varmuuskopiossa ja käyttäjä saa ilmoituksen. |
| Rikkaammat tallenteet | Viidessä erillisessä käynnistysmigraatiossa nimet, valinnat, määrät, huomautukset ja laskettu kokoonpano säilyivät. Tapaukset: AdMech, Orks, Tyranids, Chaos ja muuttunut Tau-osio. |
| Other fleet-list upgrades | Näkyvämpi avauspainike; avoin tila säilyi valinnan ja simuloidun uudelleenavaamisen yli. |
| Komentajakorttien muodostus | Kaikki 62 komentajamerkintää muodostivat kortin tuotannon `addUnit` -> `buildCardSheet` -polulla ilman poikkeuksia. Myös komentajan muokattava HTML-vienti aukesi uudelleen. |

Uudet Tau- ja Demiurg-tarkistukset toimivat myös testatuissa positiivisissa ja negatiivisissa tapauksissa: Explorerin 750/751-raja, Heron tukisuhde, Messengerin laskeminen erillään Defendereistä, Demiurg-aluksen kolme Tau-capitalia, Strongholdin kaksi cruiser-tukea sekä Warspheren alkavat 750 pistettä ja enintään kolme. Nämä ovat yksittäisten ehtojen testejä, eivät koko esimerkkilaivaston kaikkien sääntöjen hyväksymisiä.

Pyöristystavan tekeminen sääntökohtaiseksi `full`-lipulla on oikeansuuntainen muutos. Kaikkien `ceil`-laskujen muuttaminen `floor`-laskuiksi olisi rikkonut sääntöjä, joissa puhutaan alkavista pistejaksoista. Alkavan jakson kontrolli säilyi esimerkiksi kahdella Ork Warlordilla 501 pisteen asetuksella.

## 2. Alkuperäinen testisarja: 13 korjaamatonta hyväksymisehtoa

Tämä sarja on tarkoituksella koottu aiemmin havaituista virheistä. Sen 0/13 ei ole sovelluksen laatuprosentti. Myöskään kaikki rivit eivät ole itsenäisiä juurisyitä: tupla-Novan hinta ja aseistus ovat saman ristiriidan kaksi tarkistusta.

| # | Hyväksymisehto | Toteutuma versiossa 3 | Odotus |
|---:|---|---|---|
| 1 | Lunar crippled -raja | `CRIPPLED from box 5` | Neljäs menetetty HP |
| 2 | Hive Shipin toistuvat kylkien launch bay -setit | Kapasiteettiapuri 4; kylkirivi 1/1 | Kapasiteetti 8; kyljet 3/3 |
| 3 | Power Ram -> oma Nova | 240 pts; ram piilossa | 235 pts tai ristiriitainen valinta estettävä |
| 4 | Fleet-Nova + oma Nova, hinta | 255 pts | 235 pts / vain yksi Nova |
| 5 | Fleet-Nova + oma Nova, aseet | Kaksi aktiivista Nova-riviä | Yksi |
| 6 | 12 escortin seuranta | Kuusi jäsen-/HP-paikkaa | 12 |
| 7 | Geneerinen Venerable | Tulkitaan Seditio Opprimereksi | Erillinen geneerinen valinta tai näkyvästi manuaalinen toteutus |
| 8 | Mercuryn torpedovaihto | 255 pts | 235 pts |
| 9 | Hive Shipin pelkkien aseoptioiden maksimihinta | 525 pts | 320 pts |
| 10 | Copy list / ostettu Dakka | Puuttuu tekstistä | Mukana |
| 11 | Copy list / manuaalinen huomautus | Puuttuu tekstistä | Mukana |
| 12 | Uuden oman option lisääminen alkuun | Vanhan tallenteen Nova-valinta vaihtuu toiseksi | Valinta säilyy tai migraatio pysähtyy ilmoitukseen |
| 13 | Aseistamaton Hive ilman escortteja | `all clear` | Puuttuvat pakolliset valinnat / tarkistamattomuus näkyviin |

Rivin 12 testi on tarkoituksellinen tulevan datamuutoksen simulaatio. Se ei tarkoita, että tässä todellisessa 2 -> 3 -julkaisussa olisi lisätty kyseinen optio tai että aiempi tallennus olisi jo rikkoutunut näin.

### Pelillisesti keskeisimmät toistot

**Hive Ship:** sammuta avoimet valinnat ja valitse prow boarding torpedoes, thorax launch bays ja kolme port/starboard launch bay -settiä. Hinta on oikein `200 + 25 + 20 + 3*20 = 305`. Aseistuksesta kuitenkin katoaa kylkisettien toistomäärä. Fleets s. 431-432: jokainen setti antaa oman port- JA starboard-aseen; yhteiskapasiteetti on `2 + 3*(1+1) = 8`. Tämä on määrämallin virhe, ei oikea kohta kovakoodatulle Hive Ship -poikkeukselle.

**AdMech Lunar:** osta Power Ram, sitten oman profiilin Nova. Käyttöliittymätestissä ramin painikkeet katoavat mutta hinta jää 240 pisteeseen. Osta vaihtoehtoisesti fleet-päivityksen Nova ja sitten oma Nova: 255 pistettä ja kaksi Novaa. Kelpoisuus, veloitus ja aseistus katsovat edelleen eri polkuja.

**Lunar:** Rulebook s. 65 sanoo suoraan, että 8 HP:n Lunar crippleytyy neljästä vahingosta. Kortin `tick per Hit` ja `from box 5` ovat ristiriidassa tämän kanssa.

**Mercury:** Fleets s. 64 sallii Novan vaihtamisen Strength 6 -torpedoihin -20 pisteellä. Oman option `c: null` ei ole nollahinta. Jos hintaa ei tiedetä, loppusummaa ei saa esittää täysin laskettuna ilman varoitusta.

Myös aiemmin raportoitu Space Hulkin normaali 2D6-critical-taulukko ja normaali crippled-ohje ovat edelleen mukana. Tämä ei sisälly edellä olevan 13 ehdon laskentaan.

## 3. Uusi komentajakortti: toimiva tulostus, harhaanjohtava sääntösisältö

**Toisto:** Orks -- Waaagh!, Ork Warlord 40 + Two extra re-rolls 40 + Extra Power Fields 25 = **105 pistettä**. Kortin vasemmalla puolella ovat oikein vain nämä ostokset. Oikealla `COMMANDER RULES` tulostaa kuitenkin myös seuraavat vaikutukset ilman niiden optioiden nimiä tai ehtoa:

- Gunz-firepowerin uusinta (Maniac Gunners, ei ostettu).
- Damage Control -noppien uusinta (Mad Meks, ei ostettu).
- Torpedosalvon Strength-noppien uusinta (Looted Torpedoes, ei ostettu).

Fleets s. 366 sallii yhden gubbinin. Tässä se on Extra Power Fields. Kortin alkuperäisen tekstin joukossa on kyllä yhden päivityksen rajoitus, mutta irrallisia vaikutuslauseita ei yhdistetä ostettaviin nimiin. Siksi kortti ei kuvaa yksiselitteisesti valittua komentajaa.

**Rajaus:** tämä havainto koskee tulostettua sääntöviitettä. Se ei osoita, että laskentamoottori olisi numeerisesti antanut kolme ilmaista gubbinia; 105 pisteen veloitus on oikein.

**Syy:** `commanderCardHTML()` kopioi `sec.text.slice(0,12)` sellaisenaan riippumatta valinnoista. Geneerinen laivastolistakappale ei ole sama asia kuin ratkaistun komentajan säännöt.

**Korjaus:** erottele perussäännöt ja ostokohtaiset vaikutukset. Tulosta ostettujen vaikutukset tai esitä avoimet optiot nimettyinä ja selvästi ehdollisina. Älä tee uutta regex-suodatinta, joka yrittää tunnistaa irrallisista lauseista, mitkä kuuluvat millekin ostokselle.

**Todiste:** `results/followup/commander.png` ja `followup_results.json`.

## 4. Tallennussuojaus: hyvä korjaus, mutta virhepolkujen kattavuus puuttuu

### Todellinen parannus

Vanhojen listojen ja osioiden siirtyminen ei enää tyhjennä koko otosta. Tuntematon laivastonimi tai poistunut alusrivi luo alkuperäisestä tallenteesta varmuuskopion ja näyttää ilmoituksen. Vanhan `Eldar Corsairs` -tallenteen sisältö säilyy täsmälleen `gothic-fleet-registry-v1-backup`-avaimessa.

### Vielä epäonnistuvat virhetilannesimulaatiot

| Syöte | Alkuperäinen raakadata säilyy päätallenteessa tai backupissa | Ilmoitus |
|---|---|---|
| Tuntematon laivastonimi | Kyllä | Kyllä |
| Tuntematon alusrivi | Kyllä | Kyllä |
| Katkaistu JSON | Ei | Ei |
| Kelvollinen JSON ilman `units`-kenttää | Ei | Ei |
| `units: [null]` | Ei | Ei |

Kolmessa viimeisessä tapauksessa palautus päättyy hiljaiseen `return`- tai `catch`-polkuun. Sovelluksen käynnistys jatkaa `render()`-kutsuun, joka tallentaa tyhjän oletustilan alkuperäisen päälle.

Nämä ovat tarkoituksella rikottuja testisyötteitä. Katselmoinnissa ei havaittu oikean käyttäjän JSON:n spontaania korruptoitumista, eikä oikeisiin selaintallenteisiin koskettu.

### Toinen simuloitu tuleva migraatiotapaus

Tallenna AdMech Lunar + Power Ram, 220 pistettä. Vaihda testidatassa päivitysosion nimi `FLEET UPGRADES` toiseksi. Palauta tallenne: alus jää, mutta ram katoaa, hinnaksi tulee 215, eikä tule varoitusta tai alkuperäisen säilyttävää backupia.

Tämä ei ole tapahtunut todellisen 2 -> 3 -versionvaihdon toistossa. Se osoittaa, miksi nimen käyttäminen avaimena on parannus indeksiin mutta ei vielä pysyvä tunniste. Myös yksittäisen ostoksen katoaminen on tietohävikki, vaikka koko laivasto ei katoaisi.

### Korjausperiaate

1. Lue ja säilytä alkuperäinen raw tallenne ennen migraatiota; validoi rakenne.
2. Palautuksen lopputulos on eksplisiittisesti `ok`, `partial` tai `failed`.
3. `partial` ja `failed` eivät saa kirjoittaa alkuperäisen päälle automaattisesti.
4. Raportoi myös kadonneet päivitykset ja omat optiot, ei vain kadonneita aluksia.
5. Lisää käyttäjälle varmuuskopion vienti/palautus. Pelkkä localStorage-avaimen nimen kertominen on tekninen hätäratkaisu.
6. Älä käytä yhtä ylikirjoitettavaa backup-avainta ainoana palautushistoriana. Uusi epäonnistuminen voi korvata edellisen turvakopion.

## 5. Rakenteellinen arvio

Yhden HTML-tiedoston jakelu on edelleen tarkoituksenmukainen. Backend, React tai uusi tietokanta eivät itsessään korjaisi tässä havaittuja ristiriitoja.

Ongelma on edelleen kaksi rinnakkaista optiojärjestelmää ja monta erillistä tulkintaa valitusta aluksesta. Sepulchren uusi `upgradeTakenAnyWay()` korjaa nykyisen toiston, mutta samaan hintaan ja tekstin sanoihin perustuva vastaavuus ei ole pysyvä identiteetti. Sama laite tarvitsee yhden tunnisteen, vaikka sitä tarjotaan sekä laivastolistassa että aluksen omissa optioissa.

Tavoite voi olla pieni puhdas funktio, ei koko ohjelman uudelleenkirjoitus:

```text
resolveUnit(profile, fleetContext, selections)
  -> selectedPurchases + priceBreakdown
  -> effectiveStats + effectiveArmament (including quantities)
  -> applicableRules
  -> errors + unverifiedRequirements
```

Kortti, rosteri, Copy list, pistelasku ja laillisuustarkistus lukevat tätä lopputulosta. Jokaisen ostetun asian pitää näkyä erittelyssä. Jokainen tuloste kuvaa samaa valittua kokoonpanoa. Käyttöliittymän eri esityspaikat eivät saa luoda eri totuuksia.

Lisää erilliset pysyvät `fleetId`, `sectionId`, `entryId`, `upgradeId` ja `optionId` sekä `schemaVersion`. Migraatiot vanhoista nimistä/indekseistä voivat olla eksplisiittisiä taulukoita. Älä vain nimeä nykyistä indeksiä ID:ksi. Sääntöviittausten eheys pitää tarkistaa myös datan generointivaiheessa.

## 6. Korjausjärjestys ja hyväksymisrajat

### A. Estä tietohävikki ja tee varoituksista rehellisiä

Kaikki viisi palautuksen virhetilannetta säilyttävät raw-tallenteen. Kadonnut ostos raportoidaan. Osittainen validointi ei näy `all clear` -kokonaislupauksena. Säilyttäkää nykyiset onnistuvat 32 + 30 migraationäytettä vertailuaineistona.

### B. Korjaa selvät rajatut virheet heti

Lunarin crippled-raja, Mercuryn negatiivinen hinta ja 12 escortin seuranta eivät tarvitse suurta arkkitehtuurityötä. Lisää ensin odotettu tulos testiin ja korjaa sen jälkeen toteutus. Tarkista myös odd-HP- ja ei-crippled-poikkeukset ennen yleisen HP-kaavan muuttamista.

### C. Yhtenäistä ostokset ja niistä johdetut arvot

Hyväksymistapaukset: Hive 305 pts / 8 bayta; kaikki Novan valintareitit yksi veloitus ja yksi ase; ram ei voi jäädä piiloveloitukseksi; samat ostokset ja huomautukset kaikissa vienneissä. Testaa A -> B ja B -> A, tallennus/palautus sekä off/opt/take-vaihdot.

### D. Kytke sääntötekstit valintoihin ja tarkista luettavuus

105 pisteen Warlord tulostaa Extra Power Fieldsin vaikutuksen, ei ostamattomia gubbineja ilman ehtoja. Venerable ei muutu nimetyn aluksen profiiliksi vain nimen samankaltaisuuden perusteella.

Korttien oma ulkoasuaudit palautti edelleen 462 korttia / 0 ylivuotoa, mutta pienin mitattu efektiivinen tekstikoko oli noin 2,15 pt. Minimikoko on erillinen hyväksymisehto: pelkkä rajaton skaalaus ei tee tiheästä kortista luettavaa. Mittaus ei ole fyysisen paperitulosteen lukutesti.

## 7. Testien kattavuus ja rajoitukset

- Chromiumissa 462 alusmerkinnän korttia ja 357 yksittäisen alusoption savutestiä ilman JavaScript-poikkeuksia; näiden lisäksi 62 uuden komentajakortin tuotantopolun testiä.
- 171 alusprofiilin tietueet ovat rakenteellisesti identtiset versioiden 2 ja 3 välillä. Mercuryn profiilidata ja Hiven asevalinnat ovat ennallaan; myös geneerisen Venerablen väärä listaviittaus todettiin erillisessä testissä.
- 13 alkuperäistä regressioehtoa ajettiin uudelleen samoilla odotuksilla.
- Molempien todellisten aiempien versioiden tallennusformaatit testattiin. Viidessä rikkaammassa tapauksessa tallennustilan sisältö siirrettiin uudelle sivulle ennen sovelluksen käynnistystä.
- Tallennustestit käyttävät muistissa olevaa localStorage-korviketta. Tämä EI ole oikean `file://`-alkuperän tai tuotantodomainin pysyvyystesti. Ympäristön navigointirajoituksen vuoksi oikeaa alkuperäsiirtymää ei testattu.
- Oikeisiin käyttäjätallenteisiin ei koskettu. Alkuperäisiä HTML-tiedostoja ei muutettu.
- Savutesti ei todista sääntösisältöä oikeaksi. Kaikkia alus/optio/laivastoyhdistelmiä tai muita selaimia ei testattu.

## 8. Koodipaikat toimitetussa versiossa

Rivinumerot koskevat alkuperäistä `Gothic Fleet Registry(3).html` -tiedostoa, eivät diffiin tehtyä lyhennettyä esitystä.

| Funktio | Rivi |
|---|---:|
| save / load / keepBackup | 851 / 874 / 948 |
| normalizeSwaps / setOptState | 984 / 996 |
| upgradeTakenAnyWay / setUpState | 1101 / 1145 |
| unitPts / unitMaxPts | 1213 / 1227 |
| checks | 1297 |
| armModel | 1971 |
| commanderCardHTML / cardHTML | 2153 / 2207 |
| fitCards / auditAllCardLayouts | 2346 / 2605 |
| listText | 2713 |

## 9. Lähteet ja tulostiedostot

Sääntöviitteet aiempien toistojen odotuksille: Rulebook v1.10 s. 65; Fleets WiP v0.36 s. 37 (Bastion), 64 (Mercury), 102-103 (Venerable/Seditio), 121 (AdMech), 317 (Eldar), 366 (Warlord), 391 (Space Hulk), 404 (Sepulchre), 431-432 (Hive), 454-457 (Tau), 486-487 (Demiurg).

Testipaketissa ovat ajettavat testit, koneelliset havaintotulokset, kuvat ja tämä muistio. `code.diff` ei sisällä fontteja tai koko upotettua tietokantaa. Testit on ajettava erikseen toimitetuilla HTML-snapshoteilla. `regression_status.json` sisältää hyväksymisehdot; pelkän testiskriptin onnistunut suoritus ei tarkoita, että ehdot olisivat menneet läpi.

**Lopputulos:** säilytä nykyiset toimivat korjaukset. Seuraavan muutoksen onnistumista mitataan yhtenäisellä kokoonpanolla ja tietojen säilymisellä, ei uusien tarkistusten tai korttien lukumäärällä.
