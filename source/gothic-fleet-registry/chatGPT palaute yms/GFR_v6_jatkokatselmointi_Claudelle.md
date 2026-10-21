# Gothic Fleet Registry v6: jatkokatselmointi Claudelle

**Päiväys:** 8.9.2026  
**Kohde:** `Gothic Fleet Registry.html`  
**SHA-256:** `DC30A561E11ABB5B35F23CF65C87B204E020AB9BC594CE417C67BA1284EB68B5`  
**Rajaus:** sovelluksen lähteitä, dataa tai julkaisutiedostoja ei muutettu. Tämä tiedosto on vain uusi katselmointiraportti.

## Johtopäätös

Edellisen katselmoinnin pääkäyttäjäpolut on korjattu hyvin. Lista ei enää vaihdu tyhjentäen työtä ilman vahvistusta, AdMech Lunarin Nova-valinnat normalisoituvat samaan 235 pisteen lopputulokseen valintajärjestyksestä riippumatta, ja `Copy list` selittää nyt myös fleet-upgradet sekä käsin lisätyt pisteet. Kaikki projektin omat testit menevät läpi.

En silti hyväksy versiota vielä lopulliseksi julkaisuversioksi. Kolme sääntödatan/kortin semantiikan P1-ongelmaa on edelleen auki:

1. uusi profiilivaikutusmalli kattaa vain seitsemän erikseen merkittyä optiota; useita muita maksettuja tai valittuja profiilimuutoksia ei sovelleta tulostettavaan korttiin;
2. geneerinen Venerable Battle Barge osoittaa yhä aina Seditio Opprimereen, vaikka lähde käskee valitsemaan pohjarungon useista Imperial/Chaos-luokista;
3. Ork Hulk tulostaa yhä tavallisen 2D6 Critical Damage -taulukon eikä omaa D6-taulukkoaan.

Lisäksi Hive Shipin kolmen saman sivuasesetin moninkertaisuus ei näy oikein aseistustaulukossa. Korjaa nämä ennen julkaisua; muu nykyinen korjaussarja kannattaa säilyttää.

## Varmistetut korjaukset

### Lista- ja tallennuspolut

- `Fleet list` kysyy vahvistuksen, jos nykyisessä listassa on rivejä, ja palauttaa valinnan peruuttamalla. Toteutus on `app_template.html:2983-2995`.
- Nollan pisteen raja palautuu nollana eikä muutu 1500:ksi (`app_template.html:995-999`).
- Fleet-upgradejen tallennus käyttää osion ja rivin nimeä indeksin rinnalla. Osion siirto ja uudelleennimeys sekä tuntematon rivi/lista on testattu.
- Rikkinäisestä tallenteesta säilytetään ensimmäinen ja viimeisin varmuuskopio eikä tyhjä renderöinti ylikirjoita alkuperäistä.

### Kokoonpanon ratkaisu

- `setOptState()` ja `setUpState()` poistavat Nova Cannonin kanssa kelvottoman Power Ramin sekä päällekkäisen Nova-valinnan.
- Riippumaton selainkoe: Lunar 215 + oma Nova 20 = **235**, Power Ram ei jää piiloveloitukseksi eikä toinen Nova jää aktiiviseksi.
- Kuusi valintajärjestystä on lukittu testeihin; jokainen päätyy hintaan 235 ja yhteen Nova-riviin. Pelkkä Power Ram antaa 220.
- Dominatorin aikaisempi akkuversio, Hammerin kolmas torni ja Warspheren HP/firepower/shield/turret/range-vaikutukset näkyvät nyt korttia tuottavassa mallissa.
- Warspheren toistomäärä toimii: kolme `+2 HP / +2 firepower` -ostoa maksaa 205 pistettä, valitsin näyttää `×3`, korttimalli ratkaisee 16 HP ja FP 18.

### Vienti ja paketointi

- Selainkoe tuotti nyt tämän sisällön:

```text
Orks — Waaagh! — 212/1500 pts

• Terror Ship  212 pts
    – Dakka Dakka: +2 Turrets (+20)
    – Kustom force field (+7)
```

- Metatiedot on päivitetty: 32 listaa, 171 profiilia ja 462 korttia.
- `share version/Gothic Fleet Registry.zip` on rakennettu uudelleen. ZIP:n sisäisen HTML:n SHA-256 on täsmälleen sama kuin päätiedoston SHA yllä.
- `julkaisu/site/index.html`:n data- ja sovellusskriptien SHA:t ovat samat kuin päätiedostossa. Sivustoversio sisältää siis nykyisen korjauksen.
- Ork Hulkin crippled-teksti on korjattu: Hulk ei enää saa tavallista crippled-kaistaa.

## Testitulokset

| Ajo | Tulos |
|---|---|
| `node test_validator.js` | kaikki läpi |
| `node test_upgrades.js` | kaikki läpi; Nova-permutaatiot ja 7 uutta profiilivaikutusta läpi |
| `node test_save.js` | kaikki läpi |
| `node qa_structure.js` | 7 615 tarkistusta, 0 löydöstä |
| `node stress.js 6` | 4 414 tapausta, 76 154 tarkistusta, 0 löydöstä |
| `node print_check.js` | 462 korttia / 32 listaa, 62 komentajakorttia, 0 löydöstä |
| `python audit.py` | 171 alusta, 32 listaa, 810 listariviä, 0 löydöstä |
| `python coverage.py` | 85 hinnoiteltua lausetta, kattamatta 0 |
| `python check_reference.py` | 32/32 referenssiä, 488 sääntöä, 688 listariviä, 0 löydöstä |
| `python crosscheck_bsdata.py` | poistumiskoodi 0; vain tunnetut lähdeversioerot |
| Oikea selain: `?layout-audit=1` | 32 listaa, 462 korttia, 0 geometrista ylivuotoa |

Vihreä testisarja on hyödyllinen rakenteen regressiosuoja. Se ei kuitenkaan todista, että jokaisen option jälkeinen profiili vastaa sääntökirjaa. Alla olevat löydökset ovat riippumattomia, lähdetekstistä johdettuja sopimustestejä.

## 1. P1 — useita profiilia muuttavia optioita veloitetaan, mutta kortti jää perusprofiiliksi

Uusi `mod` / `swp` / `qty`-malli toimii niillä seitsemällä rivillä, joille kentät lisättiin. `test_upgrades.js:549-569` käy kuitenkin läpi vain rivit, joilla kyseiset kentät jo ovat, ja hyväksyy tuloksen, kun niitä löytyy vähintään seitsemän. Testi on siten itsensä rajaava: se ei löydä sääntökirjan muita profiilivaikutuksia.

Riippumaton suoritus nykyisen tuotanto-HTML:n funktioilla antoi muun muassa nämä tulokset:

| Profiili ja valittu optio | Hinta muuttuu | Korttimallin nykyinen tulos | Säännön edellyttämä tulos |
|---|---:|---|---|
| Mars, third turret +10 | 280 | Turrets 2 | Turrets 3 |
| Overlord, turret array +10 | 230 | Turrets 2 | Turrets 3 |
| Strike Cruiser, additional shield +15 | 160 | Shields 1 | Shields 2 |
| Repulsive, third shield +15 | 245 | Shields 2 | Shields 3 |
| Repulsive, dorsal lance range +10 | 240 | dorsal lance 30 cm | 45 cm |
| Merchant, hull structure +15 | 110 | Hits 4 | Hits 6 |
| Heavy Transport, Super-Heavy +50 | 90 | Hits 6 | Hits 10; lisäksi super-heavy-kääntyminen |
| Endeavour, prow armour option | 110 | Armour 5+, Turns 90° | prow 6+, Turns 45° |
| Emissary, deflector +10 | 120 | Armour 5+ | prow 6+ |
| Exorcist, short-range batteries | 230 | battery 45 cm / FP 8 | 30 cm / FP 10 |

Sama virheluokka toistuu profiilivariantteihin kopioiduissa riveissä, esimerkiksi molemmissa Merchant-konfiguraatioissa, kolmessa Emissary-konfiguraatiossa sekä Endeavour/Endurance/Defiant-versioissa. Tämä ei ole yksittäinen datavirhe vaan puuttuva kattavuussopimus.

Tulostettava kortti käyttää `effHits`, `effShieldsText`, `effTurrets` ja `armModel` -tuloksia (`app_template.html:2239-2253`, `2445`, `2540-2543`), joten yllä olevat arvot päätyvät myös paperikorttiin.

### Korjaus

- Lisää kaikki profiilia muuttavat optiot rakenteiseksi dataksi. Tarvitaan vähintään HP-, shield-, turret-, speed-, turn- ja armour-vaikutukset sekä kohdistettu aseiden range/firepower-muutos.
- Älä ratkaise kattavuutta hakemalla vain rivejä, joilla `mod` jo on. Tee lähteestä johdettu odotustaulukko kaikille profiilia muuttaville optioille.
- Lukitse yllä oleva taulukko testeihin: `take`-tilan jälkeen tarkista sekä pisteet että koko ratkaistu profiili.
- Paras pitkäaikainen ratkaisu on yksi `resolveUnit()`-tulos, jota editori, pistelasku, Copy list, rosteri ja kortti kaikki käyttävät.

## 2. P1 — Venerable Battle Barge ei ole Seditio Opprimere

Kaikki kolme Space Marine -listaa osoittavat edelleen geneerisen `Venerable battle barge` -rivin suoraan profiiliin 103:

```text
Codex Astartes -> ref 103 -> SEDITIO OPPRIMERE
Crusade        -> ref 103 -> SEDITIO OPPRIMERE
Dominion       -> ref 103 -> SEDITIO OPPRIMERE
```

Fleets WiP v0.36 s. 102 sanoo toisin: Venerable Battle Bargeksi valitaan yksi sallittu Imperial- tai Chaos-battleship, grand cruiser, battlecruiser tai heavy cruiser; uniikit alukset on rajattu pois. Valitun rungon normaali hinta maksetaan ja Space Marine -miehistö lisää 35 pistettä. Aluksen omaa optionaalista refittiä tai upgradea ei saa ottaa.

Seditio Opprimere s. 103 on yksi nimetty esimerkkialus, ei tämän geneerisen valinnan kanoninen runko. Nykyinen testi jopa lukitsee väärän oletuksen kohdassa `test_validator.js:248-257`, joten vihreä tulos on tässä väärä oraakkeli.

### Korjaus

- Mallinna Venerable erikoisriviksi, jossa käyttäjä valitsee sallitun pohjarungon.
- Hinta = valitun rungon normaali hinta +35.
- Estä uniikit rungot ja pohjarungon omat optionaaliset refitit/upgradet.
- Säilytä Seditio erillisenä nimettynä profiilina vain siellä, missä juuri se alus valitaan.
- Korvaa nykyinen testi lähdesopimuksella: vähintään kaksi eri sallittua pohjarunkoa, +35, omat optiot estetty, uniikki runko estetty.

## 3. P1 — Ork Hulk käyttää väärää critical damage -taulukkoa

Crippled-osuus on nyt oikein, mutta `criticalModel()` käsittelee vain Tyranid-, Necron-, Eldar- ja Dark Eldar -poikkeukset ja putoaa muuten tavalliseen 2D6-taulukkoon (`app_template.html:800-818`). Nykyinen Ork Hulk -korttimalli palauttaa:

```text
CRITICAL DAMAGE (2D6)
2 Dorsal, 3 Starboard, 4 Port, 5 Prow, 6 Engine, ...
```

Fleets s. 391 määrää Ork Hulkille oman D6-taulukon:

- 1-2: high-energy systems, jonka sisällä lance/shield/turret;
- 3-4: osuma-arkin weapon clusters, jonka sisällä launch bay/torpedo/battery;
- 5-6: thruster assemblies;
- Hulk ei voi korjata critical damagea taistelun aikana.

Samalla sivulla on Hulkin omat catastrophic-poikkeukset plasma drive overloadille ja warp drive implosionille. Ainakin nämä tekstit on tuotava kortille tai selkeään Hulk-sääntölohkoon.

### Korjaus

Lisää `ORK_HULK_CRIT` ja tunnista `isSpaceHulk(sh)` ennen tavallista fallbackia. Lisää testi, joka vaatii D6-otsikon, kolme tulosryhmää, no-repair-säännön eikä salli tavallisen 2D6-taulukon rivejä Hulk-kortille.

## 4. P1 — Hive Shipin toistetut sivuasesetit eivät monistu aseistustaulukossa

Hive Shipissä kolme ryhmää viittaa samoihin `aw`-indekseihin. Kun kaikissa kolmessa port/starboard-ryhmässä valitaan Launch Bays, pisteet veloitetaan kolmesti ja LOADOUT näyttää kolme valintaa, mutta ratkaistu aseistus sisältää edelleen vain yhden rivin:

```text
Port / Starboard Launch bays ... 1 / 1 squadron
```

Kolmen saman setin kokoonpanon pitää välittää kolmen setin määrä, käytännössä 3 / 3 squadron, eikä yhden setin peruslukemaa. Sama rakenteellinen ongelma koskee myös kolmea samanlaista pyro-acid- tai bio-plasma-settiä: identtinen `aw`-indeksi ei kanna valittua moninkertaisuutta.

### Korjaus

- Ratkaise valinnat aseinstansseiksi tai yhdistä samanlaiset rivit laskettavalla määrällä.
- Älä käytä pelkkää `Set`/samaa `aw`-indeksiä, kun kolme eri valintaryhmää voi valita saman aseen.
- Lisää 1, 2 ja 3 saman side-setin sopimustestit sekä pisteille että tulostettavalle Strength/squadrons-arvolle.

## 5. P2 — editori näyttää perusarvot, vaikka valinta on jo ratkaistu kortille

Selainkoe Warspherellä: `+2 HP / +2 firepower` valittiin kolme kertaa, hinta oli oikein 205 ja valitsin näytti `×3`, mutta editorin statsirivi näytti edelleen `Hits 10`. `renderFleet()` käyttää HP-, speed-, turn-, shield- ja armour-kenttiin suoraan `sh.*`-arvoja; vain turrets käyttää tällä hetkellä efektiivistä arvoa (`app_template.html:1592-1599`).

Tulostettava kortti saa tässä tapauksessa 16 HP oikein, mutta käyttäjä näkee ennen tulostamista ristiriitaisen profiilin. Käytä editorissakin samaa ratkaistua profiilia.

## 6. P2 — aluksen omat optiot tallennetaan yhä vain indeksillä

Lista, osio, listarivi ja fleet-upgradet saivat nimipohjaisen palautuksen, mutta aluksen omat optiot ovat edelleen `u.os[i]`, `u.opts = [i...]` ja toistomäärät `u.oq[i]` (`app_template.html:1041-1098`). Jos profiiliin lisätään optio vanhojen väliin, vanha tallenne ottaa seuraavassa versiossa väärän option ilman varoitusta.

Riippumaton migraatiotesti:

1. Marsin option indeksissä 1 (`third turret`) tallennettiin `take`.
2. Profiilin alkuun simuloitiin uusi optio.
3. Latauksen jälkeen indeksi 1 tarkoitti targeting matrixia; alkuperäinen third turret siirtyi indeksiin 2 ja palautui `opt`-tilaan.

Lisää ship-optioille vakaa tunniste tai vähintään normalisoitu tekstiavain sekä migraatio. Sama koskee `oq`-määrää. Lisää testi option lisäykselle, poistolle ja järjestyksen muutokselle.

## 7. P2 — nolla ylivuotoa ei tarkoita luettavaa korttia

Oikean selaimen auditin tulos:

```json
{"lists":32,"cards":462,"overflows":0,"minOptionScale":0.6127,"minZoneScale":0.4796}
```

Pahin on Tyranid Hive Ship, 16 optiota. `opt-overflow`-kuvauksen lähtökoko on 3,65 pt ja optioalueen skaala 0,6127, eli kuvausteksti jää noin **2,24 pisteeseen**. Nimet ovat noin 2,88 pt. Tämä ei ole käytännössä luettavaa paperilla, vaikka geometrinen ylivuoto on nolla.

Auditilla ei myöskään ole kovaa luettavuusrajaa, ja sen testiyksiköt luodaan ilman `applyRequired()`-kutsua (`app_template.html:2843-2861`). Komentajakortit eivät kuulu selaimen layout-audittiin. `print_check.js` kyllä käyttää required-upgradeja ja käy komentajakortit läpi, mutta se on rakennetesti eikä mittaa renderöityä minimifonttia.

### Korjaus

- Aseta hyväksyttävä minimifontti/minimiskaala ja epäonnistuta audit, kun se alittuu.
- Jos kaikki teksti ei mahdu luettavana, jaa poikkeuksellisen tiheä kortti kahteen sivuun tai siirrä pitkät option kuvaukset viite-/lisäsivulle.
- Aja layout-audit samoilla required-tiloilla kuin normaalikäyttö ja lisää komentajakortit.

## Julkaisun hyväksymisehdot

1. Yllä olevan profiilivaikutustaulukon jokainen rivi tuottaa oikean hinnan ja oikean tulostettavan profiilin.
2. Venerable Battle Barge valitsee pohjarungon sääntökirjan sallimasta joukosta, lisää 35 pistettä ja estää kielletyt optiot.
3. Ork Hulk tulostaa oman D6 critical table -mallinsa ja no-repair/catastrophic-poikkeukset.
4. Hive Shipin kolme samaa sivuasesettiä näkyy kolmen setin vahvuutena.
5. Tallenteen ship-optiot kestävät option lisäämisen ja uudelleenjärjestelyn.
6. Pahin kortti täyttää sovitun luettavuusrajan, ei vain `overflow=false`-ehtoa.

Kun nämä on korjattu, aja nykyinen testisarja sellaisenaan uudelleen. Se on nyt hyvä regressiopohja; ongelma on enää siinä, että sääntökirjasta johdettuja semanttisia odotuksia on lisättävä vihreiden rakennetestien rinnalle.
