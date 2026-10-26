# Tallennusformaatti

Avain: `localStorage["gothic-fleet-registry-v1"]`. Yksi JSON-olio, koko
sovelluksen tila `S`.

```json
{
  "li": 4,                    // laivastolistan indeksi
  "ln": "Space Marines — Crusade",   // ja sen NIMI (ensisijainen avain)
  "limit": 1500,
  "units": [
    {
      "s": 3,                 // osion indeksi
      "sn": "BATTLESHIPS",    // ja sen NIMI
      "e": 1,                 // listarivin indeksi
      "el": "Battle barge",   // ja sen NIMI
      "ref": 104,             // profiilisivu
      "n": 1,                 // runkoja
      "name": "",             // pelaajan antama nimi
      "opts": [],
      "os":  { "3": "take" }, // aluksen optiot INDEKSILLÄ   <-- ongelma
      "oq":  { "0": 3 },      // toistomäärät INDEKSILLÄ     <-- ongelma
      "ups": { "3:1": "take" },        // päivitykset indeksillä
      "upn": { "BATTLESHIPS\u0001Battle barge": "take" }  // ja nimellä
    }
  ]
}
```

## Mikä kestää datamuutoksen ja mikä ei

| viittaus | kestääkö | miten |
|---|---|---|
| laivastolista | **kyllä** | `ln` (nimi) ensisijainen, `li` vain varalla |
| osio | **kyllä** | `sn` (nimi) ensisijainen |
| listarivi | **kyllä** | `el` (nimi) ensisijainen |
| päivitykset | **kyllä** | `upn` = osion nimi + `\u0001` + rivin nimi |
| **aluksen optiot** | **ei** | `os` ja `oq` ovat pelkkiä indeksejä |

Jos kirjan uusi versio lisää alukselle option keskelle `ol`-listaa,
tallennettu `os: {"3": "take"}` osoittaa seuraavassa versiossa eri
optioon — **oikealla hinnalla, hiljaa.** Se on sama vikaluokka, joka
rikkoi Bastion Fleetsin taistelulaivasuhteen osioindeksin siirtyessä.

## Epäonnistuneen palautuksen suoja

`load()` hakee ensin nimellä, sitten indeksillä. Jos jokin ei ratkea:

- alkuperäistä tallennetta **ei ylikirjoiteta**
- se siirtyy avaimeen `...-backup` (ensimmäinen epäonnistuminen säilyy
  aina) ja `...-backup-last`
- `save()` kieltäytyy kirjoittamasta niin kauan kuin `LOAD_NOTE` on
  voimassa eikä laivastossa ole yhtään yksikköä

`node test_save.js` on tämän pysyvä regressiotesti: 34 väitettä, mukaan
lukien indeksisiirtymä, osion uudelleennimeäminen, rikkinäinen JSON,
puuttuva `units`, `units:[null]`, estetty tallennustila ja varmuuskopion
ylikirjoittamattomuus.

## Tiedosto: vienti ja tuonti (28.9.2026, J150)

> **19.10.2026 (J208):** tiedoston tuonti lisää laivastot nimettyyn kirjastoon
> (alla, *Nimetty kirjasto*) eikä enää avaa niitä listan muokattavan laivaston
> päälle; `importFleetText` poistettiin. Alla oleva kuvaus on historiaa.

**Saved fleets** -valikon Export kirjoittaa yhden listan laivaston tiedostoksi
`<lista> <pisteet> pts.json`. Sisältö on täsmälleen sama yhden listan dokumentti,
jonka `save()` kirjoittaa (`unitDoc` per yksikkö, nimet avaimina, indeksit varalla),
kahdella tunnisteella:

```json
{ "app": "Gothic Fleet Registry fleet", "page": "1.1", "schemaVersion": 4,
  "ln": "Orks — Waaagh!", "limit": 1500, "units": [ ... ] }
```

Import (`importFleetText`) lukee tiedoston samalla `resolveSaved`-ratkaisijalla kuin
`load()`: nimi ensin, indeksi varalla, jokainen puuttuva rivi kerrotaan yläpalkin
huomautuksessa. Laivasto laskeutuu **omalle listalleen**: avoimeen laivastoon jos
lista on auki, muuten talteen (`S.stash`) ja avataan. Jos listalla on jo laivasto,
kysytään ennen korvaamista; kieltävä vastaus pitää vanhan ja kertoo sen. Koko
selaimen tallenne (`units` + `fleets`) tuo jokaisen laivastonsa samoin ehdoin.
Roska, puuttuva `units`, uudempi `schemaVersion` tai tuntematon lista hylätään
huomautuksella eikä avoimeen laivastoon kosketa.

Käsin muokattu tiedosto voi viedä samoihin tiloihin kuin käsin muokattu tallenne
(J20): tuonti ei validoi enempää kuin lataus. `node test_save.js` kattaa viennin,
tuonnin tyhjään ja toiselle listalle, siirtyneet indeksit, korvauskysymyksen,
koko tallenteen ja hylkäykset (13 väitettä).

## Mitä `P1-4`:n jälkeen tarvitaan

1. **Pysyvä tunniste optioille.** Ei keksittyjä ID:itä: profiilisivu +
   option tekstin tiiviste riittää ja syntyy samasta datasta.
   `os` ja `oq` avataan tunnisteella, indeksi jää varalle kuten muuallakin.

2. **`schemaVersion`.** Ilman sitä migraatiota ei voi kohdistaa. Lisää
   kentäksi `S`:ään ja kirjoita migraatio jokaiselle nostolle.

3. **Golden-tapaus migraatiolle.** Tapaus, joka sekoittaa aluksen
   optioiden järjestyksen ja vaatii palautetun laivaston profiilin ja
   hinnan muuttumattomiksi. Ilman sitä migraatio on toive, ei ominaisuus.

Nämä ovat prioriteetti 4 — katso `docs/BACKLOG.md`.

## Huomio agenteille

`test_golden.js` ajaa jokaiselle tapaukselle tallennuskierroksen
(`save` → `load` → sama profiili ja hinta). Se ei löydä indeksiongelmaa,
koska data ei muutu kesken ajon — se löytää sen, jos palautus rikkoo
jotain **nykyisellä** datalla. Indeksiongelman löytää vain testi, joka
muuttaa optiojärjestystä tarkoituksella.

## Päätös 9.9.2026: tunnisteet tehdään P1-8a:ssa, ennen ratkaisinta

Ulkoinen katselmointi (`docs/REVIEW-resolveUnit-v1-Codex.md`) vaati, ettei
v1-ratkaisin ota indeksejä ensisijaisiksi tunnisteiksi. Siksi kohdan 9
ID-osuus siirtyy `tasks/P1-8a-canonical-intent.md`:hen; tänne (kohta 9) jää
julkaisumigraation loppu.

**Option-ID** syntyy datasta buildissa, ei käsin:

```
id = <profiilisivu> + ":" + sha1(norm(teksti))[:8]
norm = pienet kirjaimet, vain [a-z0-9], KOKO teksti (ei katkaisua: s.255:n
       kaksi keulapatterivaihtoehtoa eroavat vasta 90. merkin jälkeen)
```

`build_data.py` assertoi, että ID:t ovat uniikkeja aluksen sisällä.
Sivuvariantit (esim. `472b`) käyttävät omaa sivuavaintaan. Jos option teksti
korjataan (poimintavirhe), ID muuttuu — silloin `load()` putoaa tekstin alkuun
(40 merkkiä, vain jos se on aluksella yksiselitteinen) ja viimeisenä indeksiin, ja kirjaa `LOAD_NOTE`en ettei ID
osunut. Se on hyväksytty: tekstikorjaus on harvinainen ja näkyvä, indeksin
siirtymä on yleinen ja hiljainen.

**Upgrade-ID** = nykyinen `upn`-avain (osion nimi + `\u0001` + rivin nimi),
listan nimi (`ln`) edessä canonical-muodossa.

**Tallenne v2** (`schemaVersion: 2`):

```json
{
  "schemaVersion": 2,
  "ln": "...", "li": 4, "limit": 1500,
  "units": [{
    "sn": "...", "el": "...", "s": 3, "e": 1,
    "ref": "104", "hull": null, "n": 1, "name": "", "note": "", "adjust": 0,
    "oi":  { "104:3f2a9c1e": "take" },
    "oqi": { "104:9b7d0e44": 3 },
    "on":  { "104:3f2a9c1e": "May replace its launch bays with", "104:9b7d0e44": "Add +2 Hit Points (max 3 t" },
    "os":  { "3": "take" }, "oq": { "0": 3 },
    "upn": { "BATTLESHIPS\u0001Battle barge": "take" }, "ups": { "3:1": "take" }
  }]
}
```

`oi`/`oqi` ovat ensisijaiset (ID:llä); `os`/`oq` kirjoitetaan rinnalle
(dual-write), jotta vanha versio avaa uuden tallenteen — se poistuu kohdassa 9.
`load()`-järjestys optiolle: `oi` (ID) → `on` (tekstin 40 ensimmäistä merkkiä)
→ ja vain tallenteelle ilman `oi`-kenttää `os` (indeksi). Optio, joka ei osu
ID:llä eikä tekstillä, raportoidaan `LOAD_NOTE`ssa ja varmuuskopio otetaan.
`save()` johtaa `oi`/`oqi`/`on` aina `DOMAIN.fromLegacyUnit`ista, joten
adapteri ja tallenne eivät voi olla eri mieltä. **Toteutettu P1-8a:ssa 9.9.2026.**
Tallenne ilman `schemaVersion`ia on versio 1 ja migroidaan lukiessa; se
tallennetaan seuraavalla kerralla versiona 2. Kohdassa 9 dual-write
poistetaan ja versio 1 hylätään selkeällä ilmoituksella (varmuuskopio
säilyy kuten nyt).

**Golden-migraatio** (`test_domain.js`): aluksen `ol`-järjestys sekoitetaan
katalogin kopiossa, tallenne ladataan, ja profiilin ja hinnan on oltava
samat. Se on ainoa testi, joka löytää indeksiongelman.

## Lataus ei siivoa (P1-8e)

`load()` ei enää pudota ristiriitaisia valintoja (kaksi vaihtoa samaan
asepaikkaan, riippuvuus ilman edellytystä). Tila palautuu sellaisenaan,
`resolveUnit` raportoi sen `issues`-rivinä, laivastonäkymä näyttää sen yksikön
alla ja laillisuustarkistus "Unit issues" -rivinä. Käyttäjän seuraava valinta
korjaa tilan `transition`in kautta näkyvällä ilmoituksella.

## Skeema 2 lukittu (kohta 9, 9.9.2026)

`save()` ei enää sarjoita `S`-oliota vaan rakentaa dokumentin adapterin
kautta (`saveDocument`), ja dokumentissa on vain skeeman nimeämät kentät:

```json
{ "schemaVersion": 2, "li": 4, "ln": "…", "limit": 1500,
  "units": [{ "s": 3, "e": 1, "sn": "…", "el": "…", "ref": 104, "hn": "…",
              "n": 1, "name": "", "note": "", "adj": 0, "custom": 450, "members": "", "upsOpen": 1,
              "oi": { "<id>": "take" }, "oqi": { "<id>": 3 }, "on": { "<id>": "40 merkkiä" },
              "upn": { "OSIO\u0001Rivi": "take" } }] }
```

- `os`, `oq`, `ups` ja `opts` **eivät ole tallenteessa** (dual-write poistettu).
  Sovelluksen muistissa ne ovat yhä legacy-yksikön kenttiä; `load()` rakentaa ne
  ID- ja nimiavaimista.
- **Skeema 1** (ei `schemaVersion`) avataan: optiot ratkaistaan indeksillä, ja
  jos jokin optio on valittuna, `LOAD_NOTE` kertoo kerran, että valinnat kannattaa
  tarkistaa. Seuraava tallennus kirjoittaa skeeman 2.
- **Uudempi skeema** (`schemaVersion` > 2) ei avaudu puoliksi: varmuuskopio
  otetaan ja ilmoitus kertoo version.
- `test_save.js` §14–15 todistaa: kentät ovat skeeman mukaiset, ID voittaa
  väärän indeksin, skeema 1 → 2 -migraatio, skeema 99 hylätään.

## Skeema 3: lainalaiva (1.1, 14.9.2026)

Versio 1.1 sallii laivaston, jossa on aluksia **kahdelta listalta** (Fleets
s.14). Se pakotti tallenteeseen yhden uuden asian: yksikön on muistettava,
miltä listalta se ostettiin. Ilman sitä lataus ratkaisisi sen rivin
isäntälistalta samasta indeksistä — **eri alus eri hinnalla, äänettömästi**.

Kaksi uutta kenttää, molemmat **yksikkötasolla** ja molemmat kirjoitetaan
vain lainalaivalle:

| kenttä | arvo | milloin |
|---|---|---|
| `lst` | lähdelistan **nimi** (`nm`) | vain kun alus on toiselta listalta |
| `role` | `"reserve"` tai `"ally"` | sama ehto |

Oman listan aluksesta kumpikaan ei tule, joten **yhden listan tallenne on
tavulleen sama kuin skeemassa 2**. Juuri se tekee migraatiosta molempiin
suuntiin turvallisen: vanha tallenne latautuu sellaisenaan, ja uusi tallenne,
jossa ei ole lainalaivaa, on vanhan sivun luettavissa.

Ylätason kentät eivät muuttuneet: `schemaVersion`, `li`, `ln`, `limit`,
`units`. Lainalaivatieto on tarkoituksella yksikössä eikä omana taulunaan,
koska `test_save.js` lukitsee ylätason kenttäjoukon.

**Kaikki muu luetaan yksikön omalta listalta.** `s`, `e`, `sn`, `el`, `oi` ja
`upn` ovat lähdelistan koordinaatteja, ja sekä `saveDocument()` että `load()`
ratkaisevat ne `lst`:n nimeämältä listalta. Siksi `upn` saa pysyä
osio + rivi -avaimena ilman listan nimeä: kahden listan riveillä ei ole
yhteistä avainavaruutta, koska niitä ei koskaan haeta samasta listasta.

**Kadonnut lähdelista ei palaudu isäntälistan riviksi.** Jos `lst` nimeää
listan, jota ei ole, yksikkö menee `lost`-luetteloon ja lataus ottaa
varmuuskopion. Hiljainen palautus väärälle listalle olisi juuri se vika,
jonka estämiseksi kenttä on olemassa.

**Vanha sivu ei avaa skeema 3:a.** `schemaVersion` 3 on suurempi kuin 1.0:n
`DOMAIN.SCHEMA_VERSION`, joten 1.0 ottaa varmuuskopion ja kertoo siitä. Se on
suunniteltu käytös, ei vika — mutta se tekee päivityksestä yksisuuntaisen
pelaajalle, joka avaa molempia versioita.

`test_save.js` §16 todistaa: oman listan yksikössä ei ole `lst`/`role`,
lainalaivan rivi ja hinta säilyvät kierroksen yli, kadonnut lähdelista ei
palauta alusta, ja skeema 2 → 3 latautuu ilman ilmoitusta.

## Skeema 4: laivasto jokaiselle listalle (J146)

Listaa vaihtaessa laivasto ei enää katoa, vaan jää talteen oman listansa
nimen alle ja palaa kun listaan palataan (käyttäjä 20.9.2026). Siitä seuraa
tallenteeseen **yksi uusi ylätason kenttä**:

| kenttä | arvo | milloin |
|---|---|---|
| `fleets` | `[{ "ln": <listan nimi>, "limit": <pisteraja>, "units": [ … ] }]` | vain jos jollain toisella listalla on laivasto |

**Pisteraja kuuluu laivastolle.** Se syöttää laillisuuspaneelin
(`resolveFleet({ limit })`), joten edellisen listan luku tekisi tarkistuksista
vääriä sillä hetkellä kun listaa vaihtaa. Lista jolla ei ole omaa laivastoa
avautuu sillä rajalla, joka on jo ruudulla.

**Avoin laivasto pysyy `units`issa.** Se on tarkoituksellinen valinta: kenttä
tarkoittaa yhä sitä laivastoa, joka pelaajalla on auki, joten tallennetta
lukeva vanhempi rakenne saa siitä saman kuin ennenkin. `fleets` on pelkkä
lisä, ja sen yksiköt ovat tismalleen samaa muotoa kuin `units`in yksiköt.

**Jokainen laivasto kirjoitetaan ja luetaan OMAN listansa riveillä.**
`saveDocument()` antaa `unitDoc(u, L0)`:lle sen laivaston listan, ei avoinna
olevaa, ja `load()` kutsuu `resolveSaved(units, L0, lost)`:ia kerran per
laivasto. Tätä ilman talteen pantu alus tallentui avoimen listan saman
indeksin riville: Nurglen *Devastation* palasi *Repulsive class grand
cruiserina*, oikean näköiseltä riviltä ja väärällä hinnalla (löytyi
selaintarkistuksessa 20.9.).

**Tyhjää laivastoa ei kirjoiteta**, joten yhden listan tallenteessa ei ole
`fleets`-kenttää lainkaan ja sen ylätason kenttäjoukko on ennallaan
(`test_save.js` lukitsee sen).

**Vikatilanteet kerrotaan, ei pudoteta.** Lista jota ei enää ole, sama lista
sekä avoimena että talteen pantuna, tai roskaa `fleets`in tilalla: laivasto
jää pois, `LOAD_NOTE` kertoo siitä ja alkuperäinen tallenne jää
varmuuskopioksi. `fuzz_save.js` rikkoo myös talteen pannut laivastot (viisi
uutta rikkomusta) ja mittaa saman invariantin kuin avoimelle: mikään ei saa
palata väärin eikä kadota ilman ilmoitusta.

**Vanha sivu ei avaa skeema 4:ää** — sama yksisuuntaisuus kuin skeemassa 3:
`DOMAIN.SCHEMA_VERSION` on 4, ja pienemmän version lukija ottaa
varmuuskopion ja kertoo siitä.

`test_save.js` §12 todistaa: avoin laivasto pysyy `units`issa, talteen pannun
rivit kirjoitetaan sen oman listan nimillä, molemmat palaavat kierroksen yli,
tyhjä ei jää talteen, kadonnut lista kerrotaan ja skeema 3 avautuu ennallaan.

## Nimetty kirjasto (J208, 19.10.2026)

Käyttäjä: laivastot tallennetaan nimellä erikseen, QR-koodi ja tiedosto lisäävät
laivastoja sinne, ja sovellus muistaa muokkaukset listaa vaihdettaessa kuten
ennenkin. Kirjasto on **oma avaimensa**, joten yllä kuvattu työtallenne
(`gothic-fleet-registry-v1`, skeema 4) ei muutu lainkaan:

```json
// localStorage["gothic-fleet-registry-saves-v1"]
{ "v": 1,
  "saves": [ { "id": "mgx1k2-0", "name": "Khorne 1190 club", "ln": "Chaos — Khorne",
               "limit": 1200, "units": [ ...unitDoc... ], "pts": 1190,
               "saved": "2026-10-19", "from": "link" } ],      // from: "link" | "file" | puuttuu
  "open": { "Chaos — Khorne": "mgx1k2-0" } }               // lista -> tallennus, josta sen muokattava tuli
```

- **Save** (`saveOpenAs`) kirjoittaa avoimen laivaston (`fleetDocument`in rivit,
  nimet ensin) tallennukseen, josta se tuli (`open[lista]`), tai uudeksi; Save as
  new tekee aina uuden. Nimi ei törmää: *Nimi (2)*.
- **Tallentamaton** (`openUnsaved`) = laivastossa on aluksia eikä tallennusta, tai
  `[ln, limit, units]` eroaa tallennuksesta. Yläpalkin Save-napin piste kertoo sen.
- **Open** (`libOpen`) avaa tallennuksen omalle listalleen `resolveSaved`illa
  (nimi ensin, indeksi varalla). Listan muokattava laivasto väistyy kysymättä vain,
  jos mitään ei menetetä (tyhjä, sama tai tallennettu); muuten kysytään.
- **Import file, linkki ja QR** (`libAdd`) lisäävät kirjastoon eivätkä koske
  ruudulla olevaan. Sama laivasto (sama lista, raja ja alukset) ei tule kahdesti.
  Hylätään huomautuksella: roska, ei yksiköitä, uudempi `schemaVersion`,
  tuntematon lista; puuttuva rivi kerrotaan, loput tulevat.
- **Dokumentti** (Export, Copy, To phone, `libDocument`): yksi laivasto tai kaikki
  samassa muodossa kuin työtallenne, nimet mukana:
  `{ schemaVersion, name, ln, limit, units, fleets: [ { name, ln, limit, units } ] }`.
  Tiedostoon lisätään `app` ja `page`. Gothic Fleet Play lukee saman muodon
  (`fleetsIn`) ja pitää nimet omassa listassaan (`gothic-fleet-play-linked`).
- Avaus linkistä builderissa (`#fleet=` / `#fleetj=`) lisää laivastot kirjastoon
  ja poistaa ne osoitteesta.

`test_save.js` *Nimetty kirjasto* todistaa nämä, myös siirtyneet indeksit,
kysymyksen ilman lupaa ja linkin pakkauksen kierroksen.

## Yksikön viittaukset: uid, aboard, sq ja cmd (J215/J216, 20.10.2026)

Neljä valinnaista yksikkökenttää. Skeeman numero ei muutu, koska vanha
sivu ohittaa tuntemattomat kentät ja uusi sivu lukee vanhan tallenteen
sellaisenaan (kentät puuttuvat = automaattinen sijoitus, ei laivueita).

| kenttä | arvo | milloin |
|---|---|---|
| `uid` | yksikön tunniste, `"u12"` | vain kun toinen yksikkö viittaa siihen |
| `aboard` | komentajan aluksen `uid` | pelaaja valitsi aluksen (J215) |
| `sq` | laivuetunniste, `"A"` | alus on laivueessa; sama tunniste = sama laivue (J216) |
| `cmd` | Clanzin Warlordin `uid` | pelaaja valitsi skwadronin Warlordin (J216) |

Sovellus antaa jokaiselle avoimen laivaston yksikölle `uid`:n
(`ensureUids`), mutta `unitDocs` kirjoittaa sen vain yksikölle, johon
`aboard` tai `cmd` osoittaa. Laivasto ilman valintoja tallentuu siis
tavulleen kuten ennen. Viittaus kadonneeseen yksikköön (alus poistettu)
ei ole virhe: sijoitus palaa automaattiseksi. Pelisivu lukee samat kentät
(`resolveSaved` säilyttää ne), ja sen lippulaiva tulee builderin
sijoituksesta, kun kirja tai pelaaja on sen ratkaissut.
