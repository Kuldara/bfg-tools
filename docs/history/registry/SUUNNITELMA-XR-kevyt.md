# BFG:XR Gothic Fleet Registryyn: kevyt ja erillään pidetty versio

*Alustava suunnitelma 18.10.2026, päivitetty 19.10.: XR julkaistaan omana
sivustonaan (luku 3, "Julkaisu ja kytkin"). Ei toteutusta.*

Tausta: XR-yhteisö on pyytänyt builderiin XR-tukea. Tavoite on kertaluonteinen
palvelus: appiin tulee kytkin, joka vaihtaa XR-varianttiin. XR pidetään
arkkitehtuurisesti erillään, jotta se ei lisää monimutkaisuutta eikä riko
Remasteredia. Käyttöliittymän parannusten pitää silti periytyä myös XR:lle.

Pohjana on 2.10. selvitys `docs/SUUNNITELMA-XR.md`. Sen mittaukset ja löydökset
pätevät edelleen: XR-data, 20 uutta mekanismia, sääntöerot, id-törmäys ja
lisenssi. Tämä suunnitelma muuttaa kahta asiaa: **arkkitehtuurisuosituksen**
(kaksi buildia, ei yhtä yhdistettyä tiedostoa) ja **rajauksen** (builder ja
kortit ensin, Play-sivu ja korttiarkit myöhemmin tai ei lainkaan).

---

## 1. Tiivistelmä

- **Kytkin on helppo, sisältö on kallis.** Itse kytkin ja saumat jaettuun
  koodiin vievät 1–2 sessiota. Varsinainen työ on XR-datan poiminta ja
  kuratointi, koska koneluettavaa XR-dataa ei ole.
- **Suositus: yksi lähdekoodi ja kaksi buildia.** `build.py --ruleset xr`
  tuottaa tiedoston `Gothic Fleet Registry XR.html` samasta `app_template.html`:stä
  ja `domain.js`:stä. Koska template on sama, kaikki käyttöliittymän
  parannukset tulevat XR:lle ilmaiseksi.
- **XR on oma sivustonsa** (viides Cloudflare Pages -projekti), mutta ei oma
  koodikantansa. Remastered-sivuilta sinne pääsee BFG Tools -lapusta, joten
  Remastered-builderiin ei tarvita kytkintä lainkaan.
- **Jaettuun koodiin tulee yksi sauma.** XR-build upottaa `rules_xr.js`:n ennen
  domainia, ja domain ja template lukevat rulesetistä riippuvat asiat siitä.
  Oletuksena on nykyinen Remastered, joten Remastered-build pysyy käytökseltään
  identtisenä, eivätkä DOMAIN-objektin 13 kuluttajaa huomaa mitään.
- **MVP** on pelkkä Imperial Navy builderissa ja sovelluksen korteissa. Se vie
  noin **7–11 sessiota**. Koko Imperium vie noin 15–23 ja kaikki faktiot noin
  25–40 sessiota, ja Play-sivu lisää 3–6.
- **Ensimmäinen este ei ole tekninen vaan lupa.** XR:llä ei ole
  uudelleenkäyttölisenssiä (XR RB PDF 3). Yhteisön palveleminen tarkoittaa
  julkaisemista, joten tekijän (Xca|iber) lupa kannattaa kysyä ennen kuin
  työhön käytetään sessioitakaan.

---

## 2. Miksi kaksi buildia eikä yksi yhdistetty tiedosto

2.10. suositus oli B: yksi HTML, jossa on kaksi upotettua datasettiä. Kun
tavoitteena on kertaluonteinen ja erillään pidetty versio, B maksaa enemmän
kuin antaa.

| | **A+: kaksi buildia, XR omalla sivustolla** (suositus nyt) | **B: yksi tiedosto ja kaksi datasettiä** |
|---|---|---|
| Käyttäjän kokemus | XR-pelaaja avaa XR-sivun, ja BFG Tools -lappu linkittää sivut ristiin | Kytkin tallentaa ja lataa sivun uudelleen, joten käytännössä sivu vaihtuu tässäkin |
| Remasteredin koko | ennallaan, 2,0 MB | noin 3 MB, koska `bfg_data.json` on 1,04 MB ja XR-data on samaa kokoluokkaa |
| Alustusjärjestys | ennallaan | Boot-shimmi muuttaa sen, mikä on riski `make_fleet_cards.js`:n headless-ajolle ja `build_play.py`:n funktiopoiminnalle |
| Lisenssi | XR-tiedosto julkaistaan erikseen, jos ja kun lupa tulee | XR-data on julkisessa Remastered-tiedostossa, ellei julkaisua varten tehdä vielä kolmatta buildia |
| UI-parannusten periytyminen | kyllä (sama template) | kyllä |
| Miinus | Offline-jakelussa on kaksi tiedostoa. Kytkin toimii, kun tiedostot ovat samassa kansiossa tai samalla sivustolla | Kaikki edellä mainitut |

Vaihtoehto C (XR diff-kerroksena Remasteredin päällä) on edelleen hylätty.
Aseistukset, listarakenteet ja id:t eroavat, ja noin 65 laivaa on vain XR:ssä.

---

## 3. Arkkitehtuuri

```
app_template.html ─┐
domain.js ─────────┤
                   ├─ build.py ──────────────→ Gothic Fleet Registry.html      (Remastered, ennallaan)
bfg_data.json ─────┘
                   ┌─ build.py --ruleset xr ─→ Gothic Fleet Registry XR.html   (XR)
xr/bfg_data_xr.json┤
xr/rules_xr.js ────┘
```

**Kaikki XR-sisältö on omassa `xr/`-alikansiossa**, jota Remastered ei lue:
`xr_extract.py`, `build_data_xr.py`, `profiles_raw_xr.json`, `bfg_data_xr.json`,
`rules_xr.js`, `referenssi_xr/`, `golden_cases_xr.json` ja `LUEMINUT.md`.
`build_data.py`:tä ei parametrisoida, koska sen noin 4 300 riviä kuratoituja
Remastered-tauluja ei siirry XR:ään.

**Saumat jaettuun koodiin** ovat ainoat muutokset Remastered-tiedostoihin:

1. **domain.js:** rulesetistä riippuva sisältö luetaan oliosta
   `RS = (typeof BFG_RULESET !== "undefined") ? BFG_RULESET : null`, ja
   oletuksena on nykyinen taulu. Rulesetistä riippuvaa sisältöä ovat
   crit-taulut (l.2136–2303), `SPECIAL_WEAPON_RULES` (l.2646),
   `SPECIAL_HULL_RULES` (l.2893), `COMMANDER_RULES` (l.3524) ja noin 25
   laivan nimeen sidottua regexiä. makeDomain-refaktorointia ei tehdä.
   **XR korvaa taulut eikä yhdisty niihin.** Remastered-taulut eivät saa jäädä
   XR:n varalle, koska sama laivan tai aseen nimi tulostaisi XR-kortille
   Remasteredin säännön ja Fleets-sivunumeron.
2. **app_template.html:** kovakoodatut Remastered-kohdat luetaan `DATA.meta`sta.
   Näitä ovat tallennusavain (`gothic-fleet-registry-v1` l.1575, XR:llä
   `-xr-v1` backup-avaimineen), sivunimiö "Fleets WiP pg." (l.2503 ja noin
   50 Fleets-viitettä), srcline (l.1317), export-tiedostonimi, `ADMECH_GIFTS`
   (l.1503), R/A-napit ja Play-nappi, joka on piilossa XR:ssä. Kytkintä ei
   tule, ks. "Julkaisu ja kytkin".
3. **build.py:** `--ruleset xr` valitsee datatiedoston, overlayn ja tulosnimen.
   XR:lle ei tehdä share-zipiä eikä julkaisua, ennen kuin lupa on kirjattu.
4. **acceptance.py:** kevyt XR-askel, jossa ovat XR-build, `qa_structure`,
   `layout_check` XR-datalla ja XR-goldenit. Sen tehtävä on huomata, jos
   käyttöliittymämuutos rikkoo XR:n. Täyttä XR-acceptancea ei tehdä.

**Uudet mekanismit kuuluvat jaettuun koodiin.** Erillään pitäminen vuotaa tässä
kohdassa: XR:n listasäännöt, joita moottori ei osaa (ks. vanhan suunnitelman
kohta 3.2, noin 20 kpl), lisätään `domain.js`:ään yleisinä rule kindeinä, jotka
eivät vaikuta Remastered-dataan. IN-MVP tarvitsee niistä noin neljä: secondary
commanders, listarivikohtaisen hinnan (Bakka), listatason torpedotyypit ja
XR:n reservimallin. Jokainen on Remastered-regressioportin takana.

**Ei kosketa:** `play/` (XR-Play on erillinen päätös), `make_fleet_cards.js` ja
`fleet_card_sheets.js` (toisen session korttiarkit, Remastered),
`julkaisu/` (kunnes lupa on saatu) eikä simulaattori, boarding tai almanakka.

**Julkaisu ja kytkin (19.10.):** XR julkaistaan omana sivustonaan, mutta
lähde pysyy samassa repossa.

- **Osoite** noudattaa nykyistä kaavaa, esim. `bfgtools.xr.kuldare.com`
  (vrt. `bfgtools.boarding…` ja `bfgtools.meta…`). Lisäys tehdään
  `julkaisu/LUEMINUT.md`:n ohjeella: rivi `kokoa.py`:n `APPS`-listaan, linkki
  ja `data-here`-sääntö `tools_badge.html`:ään sekä viides isäntä builderin
  `build.py`:n lappu­tarkistukseen, joka sallii nyt tasan neljä
  kuldare.com-isäntää. XR:llä on oma `make_site_xr.py` tai `make_site.py
  --ruleset xr`.
- **Kytkintä ei tehdä Remastered-builderiin.** BFG Tools -lappu linkittää jo
  sisarsovellukset ristiin (J200), joten XR-linkki lappuun riittää
  löydettävyyteen. Pelaaja pelaa joko Remasteredia tai XR:ää eikä vaihda kesken
  laivaston rakentamisen. Remastered-templateen ei siis tule kytkimen
  käyttöliittymää. XR-buildin yläpalkissa voi olla pieni linkki "Remastered
  version".
- **Lupa ja poisto:** XR-sivu ja lapun XR-linkki julkaistaan vasta luvan
  jälkeen. Jos tekijä myöhemmin kieltää, poistetaan yksi Cloudflare-projekti
  ja yksi lapun rivi, eikä Remastered-sivuun tarvitse koskea.
- **Tallennukset:** eri osoite tarkoittaa verkossa omaa localStoragea, joten
  Remastered- ja XR-laivastot eivät voi sekoittua. Oma avainperhe (`-xr-v1`)
  tehdään silti offline-tiedostoa varten. Muunnosta ei tehdä. Tuonti tarkistaa
  dokumentin `ruleset`-kentän ja kieltäytyy ratkaisemasta ristiin, koska samat
  listanimet eri hinnoilla tuottaisivat hiljaa vääriä laivoja.
- **Offline-jakelu:** XR saa oman zipin (`Gothic Fleet Registry XR.zip`) XR-sivun
  latauslinkiksi. Remasteredin `share version/` pysyy ennallaan, ja siinä on
  tasan yksi tiedosto.

---

## 4. Vaiheet ja työmäärä

| Vaihe | Sisältö | Sessioita | Portti |
|---|---|---|---|
| 0 Päätökset | lupa, laajuus, AGENTS.md §1 ja §5 | ei sessiota | kirjattu |
| 1 Saumat | domain-overlay, `DATA.meta`, `--ruleset xr`, avainperhe. XR-build avautuu yhdellä testilaivalla. Oma sivusto ja lapun linkki tehdään vasta luvan jälkeen | 1–2 | Remasteredin korttidumppi ja resolveFleet identtiset kaikille rostereille, täysi `acceptance.py` LAPI, `make_fleet_cards.js --check-only` ennallaan |
| 2 Profiilipoiminta | `xr_extract.py` noin 300 riviä, geometria-apurit extract.py:stä | 2–3 | Imperium 121/121 ja Xenos 81/81 käsikorjauslistalla. ksnyder-crosscheck IN-, AdMech- ja Chaos-pisteille |
| 3 Imperial Navy | Gothic Sector, Bastion, Armageddon ja Bakka. Optiot käsin, 4 uutta mekanismia, korttien sääntötekstit | 4–6 | `referenssi_xr/` per lista, goldenit punaisina ensin, pistokoe 2–3 kortille |
| **= XR beta (IN)** | | **7–11** | |
| 4 Muu Imperium | Chaos (7 listaa), SM, AdMech, Inquisition ja Rogue Traders (detachmentit, Man O' War) | 8–12 | kuten edellä |
| 5 Xenos | Dark Eldar, Eldar, Tau ja Demiurg, Orkit, Necronit, Tyranidit | 10–16, Tyranidit 3–5 | Tyranidit voi rajata pois (template-riippuvainen pakollisuus on ainoa aidosti vaikea mekanismi) |
| (6 Play-sivu XR) | 6 sääntöeroa, 2-hit-escorttien hit-rata, faktioiden crit-taulut | 3–6 | test_play XR-haara |

Työmäärä pienenee 2.10. arviosta (MVP 13–19), koska boot-shimmi, makeDomain-
refaktorointi, play_rules-parametrisointi ja Necron-MVP jäävät pois. Sessio ei
ole kalibroitu mittayksikkö. Se tarkoittaa yhtä pitkää työistuntoa.

**Kiintiöarvio (19.10., karkea).** Max-tilauksen viikkokiintiöstä oli käytetty
12 % noin vuorokaudessa (alkaen 18.10. klo 12 Suomen aikaa). Käyttö jakautui
noin kymmeneen eri kokoiseen istuntoon, eli keskimäärin vähän yli 1 % istuntoa
kohden. XR-datatyössä luetaan paljon PDF-tekstiä pitkässä kontekstissa, joten
arvio on 2–4 % sessiota kohden.

| Laajuus | Sessioita | Viikkokiintiöstä | Eilisen kaltaisina päivinä |
|---|---|---|---|
| Vaihe 1 (saumat) | 1–2 | 2–8 % | alle päivä |
| IN-beta | 7–11 | 15–45 % | 1–4 päivää |
| Koko Imperium | 15–23 | 30–90 % | 3–7 päivää |
| Kaikki faktiot | 25–40 | 50–160 % | 1–2 viikon koko kiintiö |

Kalibrointi: lue `get_usage` ennen vaihetta 1 ja sen jälkeen, ja korjaa
taulukko mitatulla luvulla. Kallein virhe olisi raskas moniagenttiajo, joka
8.10. täytti viikkorajan kesken muutoksen. Kirjan tarkistukseen käytetään
yhtä lukijaa ja yhtä varmentajaa kapeaa aihetta kohden.

---

## 5. Vaikeus suhteessa muuhun tässä työtilassa tehtyyn

| Kokoluokka | Esimerkkejä | XR:n osa |
|---|---|---|
| Pieni, 1–2 sessiota | BFG Tools -lappu (J200), Sheet-valikko (J194), yhden laivaston lisäkortit | saumat ja kytkin (vaihe 1) |
| Keskikokoinen | boarding-ratkaisin, Gothic Fleet Play, Meta Almanac | IN-beta (vaiheet 1–3) |
| Iso | Registryn Remastered-data ja tarkistuskoneisto (syyskuussa noin 190 committia), simulaattori ja AI-tutkimus | koko XR |

- **Tekninen vaikeus on matala tai keskitasoa.** Moottori, käyttöliittymä,
  kortit ja tarkistimet ovat valmiina, ja saumat ovat pieniä. Tyranidien gene
  templatet ovat ainoa kohta, joka vaatii uutta mallinnusta.
- **Sisällön työmäärä on suuri.** Koko XR on samaa kokoluokkaa kuin
  Remastered-datan työ syyskuussa, koska kirjan lukeminen, optioiden
  kirjoittaminen käsin (XR:ssä ne ovat proosaa ja hinta on lauseen sisällä)
  ja referenssien lukeminen tehdään kokonaan uudelleen. Se on helpompaa kuin
  alkuperäinen, koska koneisto on olemassa, mutta isompaa kuin mikään tämän
  kuun muista projekteista.
- **Tarkkuusvaatimus on sama kuin Remasteredissa.** Syyskuussa vihreä
  testisarja ei todistanut kortteja: kaksi pistokoetta löysi 13 virhettä.
  XR-yhteisö löytää samanlaiset virheet, jos niitä ei etsitä itse.

---

## 6. Riskit

1. **"One-off" ei pysy one-offina.** Yhteisö löytää virheitä ja pyytää
   korjauksia. Lievennys: XR-sivulla lukee kerran "XR beta, community data",
   ja siinä on virheilmoituskanava. Laajuus rajataan siihen, mitä pyydettiin.
   Yhteisöltä pyydetään tarkistajia ja heidän omia lista- tai taulukkodatojaan.
2. **Regressio Remasteredissa.** Saumat ja uudet mekanismit ovat jaetussa
   koodissa. Portti: Remasteredin korttidumppi ja resolveFleet pysyvät
   identtisinä, ja täysi acceptance ajetaan ennen jokaista committia.
3. **Hiljainen väärä tieto.** Samoja lista- ja laivanimiä on eri hinnoilla.
   Siksi tallennusavaimet ovat erilliset, tuonnissa on ruleset-tarkistus ja
   Remastered-sääntötekstien nimiregexit korvataan eikä yhdistetä.
4. **Lisenssi.** Lupaa ei ole, eikä yhteisön pyyntö ole tekijän lupa. Ilman
   lupaa XR-build voi olla vain yksityinen.
5. **Kahden buildin ylläpito.** Jokainen käyttöliittymämuutos rakennetaan myös
   XR:lle. Kevyt XR-askel huomaa kaatumiset, mutta ei semantiikkaa. Uusi
   Remastered-ominaisuus, joka olettaa Remastered-datan, voi toimia XR:ssä
   oudosti.
6. **AGENTS.md:n säännöt.** §1 tuntee vain Remastered-PDF:t auktoriteettina, ja
   §5 jäädyttää uudet ominaisuudet. Molemmat pitää päivittää ennen aloitusta.
7. **Rinnakkaiset istunnot monoliitissa.** Vaihe 1 muokkaa
   `app_template.html`:ää, joten se tehdään, kun templatessa ei ole kenenkään
   committaamattomia muutoksia. 18.10. template oli puhdas, ja vain
   `AGENTS.md` ja `make_fleet_cards.js` oli muutettu.
8. **Uudet mekanismit.** Arvio on noin 20 kaikkiaan ja noin 4 IN-MVP:ssä. Jokin
   listasääntö voi vaatia vielä yhden.

---

## 7. Päätökset ennen aloitusta

1. **Mitä XR-yhteisö tarkalleen pyysi?** Mitkä faktiot ja mitkä toiminnot
   (rakentaminen, kortit, Play)? Tämä ratkaisee, riittääkö IN-beta.
2. **Lupa:** kysytäänkö Xca|iberilta (sähköposti XR RB PDF 3) ennen työtä?
   Suositus on kysyä, koska se on halpaa ja ratkaisee, onko koko työllä
   jakelukanavaa.
3. **Kaksi tiedostoa (A+) omalla XR-sivustolla** yhden yhdistetyn (B) sijaan?
   Osoite, esim. `bfgtools.xr.kuldare.com`?
4. **Play-sivu:** mukaan heti, myöhemmin vai ei lainkaan?
5. **AGENTS.md §1 ja §5:** avataanko XR omana rulesetinään omine PDF:ineen?
6. **Sivukonventio:** painettu sivu kirjatagilla (`XR Imp p. 89`) vai
   PDF-sivu? Vanha suunnitelma suosittaa painettua sivua, koska XR:n painettu
   sivu ≠ PDF-sivu (RB −5, Imperium −3, Xenos −4).
