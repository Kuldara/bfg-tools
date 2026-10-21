# Gothic Fleet Registry (4): katselmointi Claudelle

Kohde: `Gothic Fleet Registry(4).html`, verrattu versioon `(3)`.
Katselmointi 8.9.2026. Alkuperäistä sovellusta ei muutettu.

## Johtopäätös

Tämä on todellinen korjauskierros. Alkuperäisistä 13 hyväksymisehdosta kolme toimii nyt: crippled-raja, Mercuryn alennus ja 12 escortin ruudut. Korruptoituneiden tallenteiden raakadata säilyy testatuissa virhetilanteissa.

Julkaisua ei silti kannata hyväksyä vielä. Uusi päivitysnimien fallback kaksinkertaistaa ostoksia jopa saman version tallennus-palautuskierrossa. Komentajatekstien omistajuussuodatin poistaa hintaan kuuluvia sääntöjä. Tallennustilan estetty lukeminen puolestaan katkaisee nyt käynnistyksen, kun aikaisempi versio jatkoi ilman tallennusta.

Jatka tästä koodipohjasta, mutta korjaa regressiot ennen uusia laajennuksia. Yhden HTML-tiedoston jakelutapa ei ole ongelman syy.

## Testauksen yhteenveto

| Testiryhmä | Havainto |
|---|---|
| Alkuperäiset 13 ehtoa | 3 läpi, 10 edelleen auki |
| Alusten savutesti | 462 korttia ja 357 yksittäistä alusoptiota ilman poikkeuksia |
| Komentajakorttien tuotantopolku | 62 komentajamerkintää muodostaa kortin |
| `(3) -> (4)` perusmigraatiot | 32/32 yhden nimetyn aluksen näytettä säilyi |
| Viisi monipuolisempaa vanhaa tallennetta | Kaikki säilyivät; AdMech, Orks, Tyranids, Chaos ja Tau |
| Viisi rikkinäistä/puutteellista tallennetta | Raakadata säilyy varmuuskopiossa ja ilmoitus näkyy |
| Kahdeksan tarkennettua Chaos Lord + Mark -kierrosta | `(3)` säilyttää hinnan; `(4)` muuttaa hinnan kaikissa kahdeksassa |
| Komentaja + tarjottu päivitys -kierrot | 243 kokeilua, joista 18 muuttaa hintaa palautuksessa |
| Sovelluksen oma ulkoasuaudit | 462 korttia, 0 ilmoitettua ylivuotoa; pienin mitattu teksti noin 2,15 pt |

Nämä eivät ole ohjelman yleisiä laatuprosentteja. 243 kokeilun joukko tarkistaa tarjottujen komentajapäivitysten hintainvarianttia, ei kokonaisen laivastolistan laillisuutta. Ryhmät menevät osittain päällekkäin.

## 1. P1: saman version palautus monistaa maksetun päivityksen

### Toisto

Valitse Chaos - Khorne. Lisää Chaos Lord (Ld +1), 25 pistettä, ja osta sille Chaos Lords -osion Mark of Khorne, 20 pistettä. Kokonaisuus maksaa 45 pistettä ja tallentuu automaattisesti. Avaa sama versio uudelleen samalla tallenteella.

**Tulos: 65 pistettä ja kaksi ostettua Mark of Khorne -riviä. Ilmoitusta ei tule.**

Osto tehtiin oikealla painikkeella. Tallenne siirrettiin uuteen sivuun ennen sovelluksen normaalia käynnistystä. Kyse ei ole tulevan datamuutoksen simulaatiosta. Selaintallennus oli kuitenkin eristetty muistikorvike, ei käyttäjän tuotantodomain.

```text
Chaos Warmaster of Khorne / The Mark of Khorne  +20
Chaos Lords              / The Mark of Khorne  +20
Chaos Lord / base                              25
                                               --
                                               65
```

Sama vika toistuu `(3) -> (4)` siirrossa. Incursion-listan neljä Markia ja neljän jumalakohtaisen listan Lord + Mark -yhdistelmät monistuvat. Laajempi komentajatesti löysi vastaavia Imperial- ja Eldar-re-roll-tapauksia.

### Syy ja korjaus

`load()` alkaa alkuperäisen HTML:n riviltä 881. Palautus käy uuden datan rivejä läpi ja tekee välittömästi pelkkään nimeen perustuvan fallbackin, jos kyseisen kohderivin täsmäavainta ei ole tallenteessa.

Aikaisempi Warmaster-osio löytää Lordille tallennetun samannimisen Markin. Myöhemmin oikea Chaos Lords -osio käyttää samaa tallennettua valintaa uudelleen täsmähaulla. `found` rajoittaa fallback-hakua mutta ei täsmähakuun päätyvää toista käyttöä. Päivityksen kohdesopivuutta ei myöskään käytetä sovituksen rajaukseen.

Palauta tallennetut ostokset yksi kerrallaan. Ratkaise ensin kaikki täsmäosumat ja vasta sitten aidosti ratkaisemattomien ostosten fallbackit. Yksi tallennettu ostos saa tuottaa enintään yhden ostoksen. Fallback tarvitsee yksikäsitteisen, kyseiselle yksikölle sopivan kohteen. Moniselitteisyys kuuluu palautusilmoitukseen.

Pelkkä `!found[k]` täsmähaussa ei yksin riitä: aikaisempi väärä fallback voisi edelleen viedä valinnan oikealta kohteelta. Pitkäaikainen ratkaisu on pysyvä ID listalle, osiolle, tietueelle ja optiolle.

Pakollinen regressioehto:

```text
resolve(load(save(configuration))) == resolve(configuration)
```

Vertaa hintaa, ostoksia, aseita ja sääntöjä, ei vain palautuneiden alusnimien lukumäärää.

Todisteet: `results/roundtrip/roundtrip_results.json` ja `lord_after_reload.png`.

## 2. P1: komentajasuodatin poistaa ostetun komentajan perussäännöt

Aikaisemman 105 pisteen Warlord-testin ostamattomat Maniac Gunners-, Mad Meks- ja Looted Torpedoes -vaikutukset eivät enää näy yleisinä sääntöinä. Valitun Extra Power Fieldsin kuvaus näkyy oikean option yhteydessä. Tämä osa korjauksesta toimii.

Uusi `commanderCardHTML()` kuitenkin poistaa kaikki tekstit, joilla on `sec.own`-omistaja. Se ei erottele ostettua peruskomentajaa ostamattomasta optiosta. Peruskomentajan rivi ei tulosta `ownedText()`-sisältöä takaisin muualle.

| Ostettu komentaja | `(3)`-kortilla ollut, `(4)`-kortilta puuttuva sääntö |
|---|---|
| Veteran Captain, 50 pts | Hintaan sisältyvä re-roll ja squadron-vaatimus |
| Archmagos Explorator, 50 pts | Valittava Mechanicus Gift ja siihen liittyvät ehdot |
| Archmagos Veneratus, 100 pts | Sama Gift-kokonaisuus |
| Abaddon, 195 pts | Yksi re-roll vuoroa kohti |
| Warlord, 40 pts | Aluksensa Boarding Valuen kaksinkertaistaminen |
| Warlord + yksi lisäre-roll, 60 pts | Sama kaksinkertaistaminen |

**Warlordin Boarding Value x2 palaa korttiin vasta ostamalla kaksi lisäre-rollia.** Sääntö on datassa annettu `Two extra re-rolls` -rivin omistukseen. Kirjan s. 366 kappale koskee Warlordin alusta yleisesti, ei kyseistä re-roll-ostosta.

Archmagosin molempia versioita koskeva sääntö on puolestaan annettu yksin `Archmagos Veneratus (Ld 9)` -rivin omistukseen. Nykyisen komentajan nimellä omistettujen tekstien lisäys korjaisi siten Veneratuksen mutta jättäisi Exploratorin edelleen vääräksi.

### Korjaus

Erota yhteinen komentajatyyppiä koskeva sääntö, valitun peruskomentajan sääntö ja nimetyn lisävarusteen vaikutus. Esimerkiksi `scope: commander-family`, `scope: base-entry`, `scope: upgrade` ja pysyvät soveltuvuustunnisteet riittävät ilman suurta framework-uudistusta.

Sivun hintarivin jälkeen tuleva kappale ei automaattisesti koske vain sitä hintariviä. PDF:n sijainti auttaa ryhmittelyssä mutta ei todista soveltuvuutta. `own`-sidokset on tarkistettava semanttisesti ennen kuin niitä käytetään sääntöjen poistamiseen.

Lähteet: Fleets WiP v0.36, s. 38 (Veteran Captain), 124 (Archmagos), 234 (Abaddon), 366 (Warlord). Funktiot alkuperäisessä HTML:ssä: `ownedText` rivi 1040, `commanderCardHTML` rivi 2218, suodatin rivit 2232-2233.

Todisteet: `results/new_paths/new_paths_results.json` ja saman kansion komentajakuvat.

## 3. P2: estetty tallennusluku katkaisee käynnistyksen

`const r = localStorage.getItem(KEY);` on siirretty `load()`-funktion alussa kaikkien try/catch-lohkojen ulkopuolelle. Jos olion lukeminen tai `getItem` heittää SecurityErrorin, viimeinen `render()` ei suoritu.

| Simuloitu tila | `(3)` | `(4)` |
|---|---|---|
| Tallennus toimii | 32 laivastovalintaa, ei poikkeusta | Sama |
| localStorage-olion luku estetty | Käynnistyy, 32 valintaa | Poikkeus, 0 valintaa ja 0 katalogiriviä |
| getItem estetty | Käynnistyy, 32 valintaa | Sama katkeaminen |

Tämä on erikseen tuotettu virhetilanne, **ei väite oletusasetuksilla toimivan selaimen yleisestä rikkoutumisesta**. Suojaa ensimmäinenkin tallennusluku. Sovelluksen tulee pystyä käynnistymään ilman tallennusta ja ilmoittaa rajoituksesta.

Todisteet: `results/new_paths/new_paths_results.json` ja `blocked_storage.png`.

## 4. Nyt todetusti korjattuja asioita

**Crippled-raja:** 8 HP Lunar näyttää `from box 4`. `ceil(hp/2)` vastaa Rulebook v1.10 s. 65 esimerkkiä; ruutujako on samalla rajalla.

**12 escorttia:** valitun 12 Krakenin kortissa on 12 jäsen-/HP-ruutua. Kaikkien suurten ryhmien luettavuutta ei tutkittu.

**Negatiiviset hinnat:** neljä alusoption hintaa on muutettu `null`-arvosta negatiiviseksi. Mercury maksaa torpedovaihdolla 235, Victory 335, Dominator vanhemmalla aseistuksella 185 ja Warsphere yhdellä pienennyksellä 125. Miinusmerkin tulostus toimii. Maksimihintaan lisätään vain positiiviset avoimet vaihtoehdot, mutta poissulkevien alusoptioiden yhteinen maksimi on edelleen väärä.

**Raakadatan varmuuskopiot:** rikkinäinen JSON, puuttuva `units`, `units: [null]`, tuntematon laivasto ja poistunut alusrivi säilyttävät alkuperäisen raakadatan ja ilmoittavat ongelmasta. Kahden perättäisen virheen testissä ensimmäinen kopio säilyy `-backup`-avaimessa ja uusin `-backup-last`-avaimessa. Aktiivinen avain silti vaihtuu tyhjäksi listaksi: raakadata on palautettavissa varmuuskopiosta, ei säilynyt koskemattomana aktiivisessa avaimessa.

**Päivitysosion nimenmuutos:** aiempi Power Ramin pudottava simulaatio toimii nyt ja hinta säilyy 220:ssa. Kohdan 1 monistus osoittaa, miksi yksi onnistunut fallback-esimerkki ei riitä.

**Aiemmat laillisuuskorjaukset:** Bastionin battleship/cruiser-suhde, Sepulchre omien alusoptioiden kautta ja Eldarin täydet tuhannet toimivat edelleen samoilla kontrollitesteillä.

## 5. Alennettu hinta ei vielä takaa korjattua profiilia

Dominatorin -5 valinta laskee hinnan 190 -> 185. Patterit ovat silti 30 cm / FP 12 eivätkä valinnan edellyttämät 45 cm / FP 6. Lähde: Fleets s. 68.

Warspheren -20 valinta laskee 145 -> 125. Seuranta pysyy 10 HP:ssa ja patteri FP 12:ssa. Yhden pienennyksen jälkeen pitäisi olla 8 HP ja FP 10. Lähde: Fleets s. 494.

Nämä ovat aiemmin puuttuneiden profiilivaikutusten jatkumoa, eivät todiste siitä, että miinushinnan korjaus itsessään olisi rikkonut aseistuksen. Hintaa ja vaikutusta on silti testattava yhtenä ostoksena.

## 6. Alkuperäisestä listasta edelleen auki

| Tapaus | Tulos `(4)` |
|---|---|
| Hive + kolme kylkien bay-settiä | 305 pts oikein, kyljillä 1/1 eikä 3/3; kapasiteettiapuri 4 eikä 8 |
| AdMech Lunar: ram -> oma Nova | 240 eikä 235; maksettu ram piiloutuu |
| AdMech Lunar: fleet-Nova + oma Nova | 255 pts ja kaksi Nova-riviä |
| Geneerinen Venerable | Edelleen Seditio Opprimere, 450 pts |
| Hive Shipin aseoptioiden maksimi | 525 eikä 320 |
| Copy list | Dakka ja manuaalinen huomautus puuttuvat |
| Oman option eteen lisätty uusi optio | Tallennettu Nova-valinta vaihtuu indeksin vuoksi; datamuutossimulaatio |
| Aseistamaton Hive ilman escortteja | Edelleen `all clear`; olennaiset ehdot tarkistamatta |

Kahdeksan riviä vastaa kymmentä hyväksymisehtoa: tupla-Novan hinta/rivimäärä ja tekstiviennin kaksi puutetta testataan erikseen. Ork Space Hulkin normaali critical/crippled-ohje ja Hammerin turret-lisän puuttuminen arvosta näkyvät myös raportissa, mutta eivät kuulu alkuperäiseen 13 ehtoon.

## 7. Seuraavan erän tavoite

Korjaa ensin ostosten monistuminen palautuksessa ja estetty tallennusluku. Korjaa sitten komentajasääntöjen soveltuvuus. Ostamattoman vaikutuksen poissaolon rinnalla pitää aina testata ostetun vaikutuksen ja perussäännön läsnäolo.

Yhtenäistä seuraavaksi kokoonpanon ratkaisu: hinta, aseiden määrät, profiilimuutokset ja sovellettavat säännöt samasta ratkaistusta tuloksesta. UI, kortti, rosteri ja Copy list lukevat tätä tulosta. Jakelumuoto voi edelleen olla yksi HTML.

## Rajaukset

Kaikki ajot tehtiin Chromiumissa. Tallennustila oli ennen käynnistystä asennettu muistikorvike. Aitoa domain-navigointia yritettiin, mutta ympäristö esti sen (`ERR_BLOCKED_BY_ADMINISTRATOR`). Tuotantodomainin tai file-alkuperän käyttöoikeuksia ei siten testattu.

Vanhan regressiosarjan indeksikohteet tarkistettiin vastaavia uusia profiileja vastaan. Uudet Mark-testit etsivät komentajan oman päivityksen kohdeviittauksineen; ensimmäinen samanniminen Mark ei kelpaa automaattisesti.

Muokattavan HTML-viennin muodostus ja uudelleenavaaminen onnistuivat alukselle ja komentajalle. Normaaleissa testeissä ei tullut JavaScript-poikkeuksia. Tallennuslukukiellon poikkeukset ovat erikseen merkittyjä virhesimulaatioita. Kaikkia sääntöyhdistelmiä ei tarkistettu.

Paketissa ei ole alkuperäistä sovellusta, fontteja tai kokonaisia lähdekirjoja. Tiivisteet ovat `manifest.json`:ssa; ajokomennot `README.md`:ssä. `code.diff` jättää upotetut fontit ja koko datalohkon pois. Raportin rivinumerot viittaavat alkuperäiseen HTML:aan.
