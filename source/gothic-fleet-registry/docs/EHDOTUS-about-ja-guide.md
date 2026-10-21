# Ehdotus: About ja Guide sovellukseen

**Tila: ehdotus, ei toteutettu.** Toteutus osuu `app_template.html`:ään, joka
on toisen istunnon tiedosto ja jossa on committaamattomia muutoksia.

Tämä dokumentti vastaa kolmeen kysymykseen: **mihin** sisäänkäynti tulee,
**mitä** kummassakin osiossa lukee, ja **mistä** teksti tulee niin ettei se
vanhene huomaamatta.

---

## 1. Mihin — yksi nappi, ei kahta

Yläpalkissa on jo viisi nappia (*Print cards*, *Download for editing*,
*Print roster*, *Copy list*, *Clear*) sekä listavalinta, pisteraja ja
pistelaskuri. Kaksi uutta nappia rikkoisi rivin kannettavan leveydellä.

**Ehdotus:** yksi nappi `Guide`, ja sen takana paneeli, jossa on kaksi
osiota. Lisäksi jo olemassa oleva lähderivi (`#srcline`,
*"…Fleets Book WiP v0.36 … · Gothic Fleet Registry v1.0"*) muuttuu
klikattavaksi ja avaa saman paneelin **About**-kohdasta. Näin
sisäänkäyntejä on kaksi mutta nappeja yksi: *Guide* on huomattava, ja
versionumeron klikkaaminen on se, mitä ihmiset joka tapauksessa yrittävät.

**Paneelin muoto:** koko sivun peittävä kerros, kuten `#sheet` jo on —
malli on siis talossa valmiina. Sulkeutuu `Esc`illä, taustaa
klikkaamalla ja omalla *Close*-napillaan. Ei ansaa näppäimistölle.
`@media print { display:none }`, jottei se tule kortteihin.

**Koko:** noin 4 kt merkkausta 1428 kt:n tiedostoon on 0,3 %. Ei merkitystä.

---

## 2. Guide — mitä pelaaja tarvitsee, ensimmäisen käytön järjestyksessä

1. **Yksi lause siitä, mikä tämä on.** Rakenna laillinen BFG-laivasto ja
   tulosta sen kortit. Ei asennusta, ei verkkoyhteyttä.
2. **Kolme saraketta.** *Available to this list* = mitä voit ostaa.
   *Legality* = mitä tarkistetaan. *Your fleet* = mitä sinulla on.
3. **Take / Option / Hide.** Sovelluksen ydinvuorovaikutus.
4. **Kaksi eri tarkistusta — tärkein kohta koko oppaassa.**
   *Checked by the builder* on konesääntö. *Check yourself* on kirjan lause
   sivunumeroineen, jonka pelaaja tarkistaa itse. Sanottava suoraan:
   **vihreä "All clear" ei tarkoita, että laivasto on laillinen.** Se
   tarkoittaa, ettei yksikään konetarkistettu rajoitus kaadu. Jos tätä ei
   sanota, sovellus lupaa enemmän kuin se tekee.
5. **Sivunumerot.** Jokainen sääntölause kantaa Fleets-kirjan sivun, joten
   kirja on aina yhden haun päässä. Tämä on syy luottaa sovellukseen.
6. **Tulostus.** *Print cards* = aluskortit. *Print roster* = lista.
   *Download for editing* = sama arkki muokattavana HTML-tiedostona.
   *Copy list* = tekstinä leikepöydälle.
7. **Points limit.** Mitä se tekee ja mitä se ei tee.
8. **Kahden listan laivastot** (1.1). Reservit ja liittolaiset, 1:3
   alustyypeittäin, rotuportti, nimetty pääsy. Tämä kohta kirjoitetaan
   vasta kun 1.1:n käyttöliittymä on paikallaan.
9. **Mikä säilyy.** Mitä selain muistaa ja mitä ei.

Sävy: lyhyt, toteava, ei markkinointia. Sama kieli kuin
käyttöliittymässä (englanti).

---

## 3. About — mistä tämä tulee ja mihin siihen voi luottaa

1. **Lähde ja versio kopioitavassa muodossa.** Sama rivi kuin
   `#srcline`ssä. *"Mikä versio sinulla on"* on ensimmäinen tukikysymys,
   ja se on jo `build.py`:n kommentissa kirjattu.
2. **Mikä tämä ei ole.** Epävirallinen apuväline, ei sääntökirjan korvaaja.
   Kirja ratkaisee.
3. **Miten tämä on tehty ja tarkistettu.** Yksi rehellinen numerorivi voittaa
   kappaleen väitteitä:

   | asia | nyt |
   |---|---|
   | Laivastolistoja | 32 |
   | Alusprofiileja | 171 |
   | Kirjattuja sääntöjä | 506 |
   | Golden-tapauksia | 357 + 66 laivastotason |
   | Hyväksynnän vaiheita | 20 |
   | Sitaatteja kirjaa vasten | 938 |

4. **Tiedetyt rajat.** Mitä näytetään mutta ei tarkisteta
   (`general_rules_open`, nyt 3), ja että Fleets-kirja on WIP, jonka
   sivunumerot liikkuvat.
5. **Versiohistoria korkealta** — oma lukunsa alla.
6. **Mistä virheestä ilmoitetaan.** Tämä on koko sivun arvokkain linkki:
   sovelluksen ainoa arvo on uskollisuus kirjalle, joten virheilmoitus on
   se, mikä pitää sen totena. **Vaatii käyttäjän päätöksen** (sähköposti,
   Discord-ketju vai muu).
7. **Attribuutio.** Battlefleet Gothic ja sen tekstit ovat Games
   Workshopin; tämä on fanityökalu. **Vaatii käyttäjän päätöksen**
   sanamuodosta.

---

## 4. Versiohistoria korkealta

Ei 130 commitin lokia. **Yksi rivi per versio, ja rivi kertoo mitä pelaaja
voi nyt tehdä — ei mitä koodissa muuttui.** Lähde on `docs/ROADMAP.md`,
joten historia ja tiekartta eivät pääse eri linjoille.

| versio | mitä pelaaja voi |
|---|---|
| **1.0** | Rakentaa laivaston 32 listalta, nähdä mikä tarkistetaan, tulostaa kortit ja listan. Yksi tiedosto, ei asennusta. |
| **1.0.1** | Ei uusia ominaisuuksia: julkaisu ja kirjanpito kuntoon. |
| **1.0.2** | Pienet lupaukset lunastettu. |
| **1.1 — Lainalaivat** | Koota laivasto useammasta kuin yhdestä listasta: reservit ja liittolaiset, 1:3 alustyypeittäin, rotuportti ja nimetty pääsy. |
| **1.2 →** | `docs/ROADMAP.md`. |

---

## 5. Mistä teksti tulee — ehdotuksen tärkein kohta

Tämän istunnon molemmat tarkastuslöydökset (J112, J113) olivat samaa lajia:
**teksti, joka oli olemassa vain yhdessä paikassa eikä sitä verrattu
mihinkään, oli ehtinyt vanhentua.** About-osio on täsmälleen sellaista
tekstiä — se on täynnä lukuja, jotka vanhenevat joka kierroksella.

Siksi:

- **Guiden proosa** on aidosti staattista ja saa asua mallipohjassa.
- **Aboutin luvut eivät.** `build.py` korvaa jo `__VERSION__`-merkin ja
  `build_data.py` tietää listojen, alusten ja sääntöjen määrät. Sama
  koneisto tuottaa `__STATS__`-merkin, jolloin **väärä luku on
  buildin kaatuminen eikä lukijan ongelma.**
- **Versiohistoria** asuu yhdessä tiedostossa, jota sekä julkaisumuistiot
  että sovellus lukevat. Kahta käsin ylläpidettyä historiaa ei synny.
- `acceptance.py` saa vaiheen, joka vertaa Aboutissa näkyviä lukuja
  mitattuihin — sama kuvio kuin `SITAATIT` ja `RAKENNE`.

---

## 6. Päätökset 14.9.2026

Kaikki neljä avointa kohtaa on päätetty. **Tila: ehdotus → valmis toteutettavaksi**,
kun `app_template.html` vapautuu.

| kysymys | päätös |
|---|---|
| Virheilmoituksen osoite | **Ei linkkiä vielä** |
| Sisäänkäynti | **Yksi `Guide`-nappi + klikattava versiorivi** |
| Attribuutio | **Täysi vastuuvapaus** |
| Ajoitus | **1.0.2** |

**Virheilmoitus jää pois.** Luvun 3 kohta 6 poistetaan tästä versiosta.
Seuraus on kirjattava rehellisesti: ensimmäisten käyttäjien löydökset eivät
tule takaisin mitään reittiä, joten 1.0.2:n jälkeinen palaute tulee vain
siellä missä sovellusta jaetaan. Lisääminen myöhemmin on halpaa — About on
jo olemassa, linkki on yksi rivi.

**Attribuutiolause** menee sovellukseen sanatarkasti tässä muodossa:

> Battlefleet Gothic and all associated names, logos and imagery are
> trademarks of Games Workshop Limited. This is an unofficial fan-made tool.
> It is not endorsed by or affiliated with Games Workshop.

**Ajoitus 1.0.2** tarkoittaa, että luvun 2 kohta 8 (kahden listan laivastot)
jää tässä vaiheessa kirjoittamatta ja täydennetään 1.1:ssä. Se on tietoinen
valinta: opas ei saa kuvata ominaisuutta, jota käyttöliittymässä ei vielä ole.

## 7. Työmäärä

| osa | tunnit |
|---|---|
| Paneeli, sisäänkäynnit, näppäimistö ja tulostuspiilotus | 2–3 |
| Guiden teksti | 2–3 |
| Aboutin teksti ja versiohistoria | 1–2 |
| Lukujen tuonti buildista + hyväksynnän vaihe | 2–3 |
| **yhteensä** | **7–11** |

**Päätetty: 1.0.2.** Se ei kosketa moottoria eikä dataa, joten se sopii
väliversioon. Työ on tekemättä niin kauan kuin `app_template.html`:ssä on
toisen istunnon committaamattomia muutoksia.
