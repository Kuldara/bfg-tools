# Definition of Done — GFR v1.1 "Lainalaivat"

> **GFR 1.1 on valmis, kun pelaaja voi lisätä laivastoon aluksia toiselta
> laivastolistalta jokaisessa tapauksessa, jonka kirja nimeää, ja sovellus
> laskee ne kirjan mukaan: isäntälistan kiintiöihin, oikealla suhteella,
> oikealla rodulla ja oikeilla päivityksillä — ja jokainen näistä on todistettu
> laivastotason testillä, joka oli punainen ennen korjausta.**

Tämä täydentää `docs/DEFINITION_OF_DONE.md`:tä. Kaikki 1.0:n mittarit pysyvät
voimassa: jos jokin niistä nousee nollasta, 1.1 ei ole valmis riippumatta siitä,
mitä alla olevista on tehty.

---

## 1. Uudet mitattavat rivit

Lähtöarvot on mitattu 13.9.2026 tästä repositoriosta. Jokainen rivi on
laskettavissa koneella; jos lukua ei voi laskea, se ei kelpaa kriteeriksi.

| mittari | mistä | lähtöarvo | 1.1-ehto |
|---|---|---|---|
| `fleet_goldens` | `referenssi/golden_fleet_cases.json`: tapaukset, joissa on `fleet`-kenttä ja odotus laivaston tarkistusriveille | **0** → **66** (14.9.) | ≥ 40, ja jokaisella kirjan lause sivunumeroineen ✔ |
| `golden_driver_fleet_capable` | `test_golden.js` osaa rakentaa monen yksikön laivaston ja lukea `checks()`:in | **ei** → **kyllä** (14.9.) | kyllä |
| `index_refs_named` | osion NIMI jokaisessa osioindeksiviittauksessa (pick + `sec`/`allow_sec`/`per_sec`/`up_sec`) | **78 / 645** → **667 / 667** (14.9.); mittari `acceptance.py`: `index_refs_unnamed` = 0 | kaikki / kaikki ✔ |
| `index_guard_red_proof` | vartija osaa kaataa buildin, kun osio siirtyy | **ei** → **kyllä** (14.9.): `python build_data.py --prove-guard` = 32/32 listaa, oma askel `acceptance.py`:ssä | kyllä, todistettu tahallisella siirtymällä ✔ |
| ~~`reserve_sections_with_rows`~~ | ~~osiot, joiden otsikossa on reserve/allies ja joissa on vähintään yksi valittava rivi~~ | **2 / 18** → **5 / 19** (14.9.) | **Mittari hylätty 14.9.** Se mittasi väärää asiaa: kirja hoitaa valtaosan reservipääsystä luvalla, kiellolla tai listan omalla nimetyllä osiolla, ei riveillä reserviotsikon alla. Rivien pakottaminen tyhjiin otsikoihin olisi keksimistä. Tilalla `general_rules_open` ja tapauskohtaiset goldenit |
| `reserve_grants` | listat, joilla on nimetty reservilupa (`res_ok`) tai kielto (`res_ban`) | **0** → **6** (14.9.: Dominion, Corsairs ×2, Iyanden + kiellot Crusade, Grey Knights; lisäksi inkvisiittorilupa 8 listalle) | jokainen kirjan lause, joka poikkeaa yleissäännöstä, on joko lupana tai kieltona datassa |
| `cross_list_quota_proofs` | laivastotapaukset, jotka todistavat s.14:n "fleet as a whole" -laskennan | **0** → **12** (14.9.) | ≥ 8, kattaen `section_count`, `cap`, `ratio` ja `squadron` ✔ (kaikki neljä katettu) |
| `section_kinds` | osion laji (`type` = aluslaji, `own` = nimetyt alukset) | **puuttuu** → **143 / 143** (14.9.; 43 otsikkoa kuratoitu) | jokainen aluksellinen osio luokiteltu, build kaatuu luokittelemattomaan ✔ |
| `notice_rows` | `kind: "notice"` -rivit datassa | **4** | ≤ 1, ja jäljelle jäävä on kirjattu 1.2:een päivämäärällä |
| `general_rules_read` | Fleets s.14–17 luettuna referenssitiedostoksi | **0 lausetta** → **25 lausetta** (14.9., `referenssi/99_yleiset_reservit.json`) | jokainen lause luettu, statusoitu ja `check_reference.py`:n tarkistama ✔ |
| `general_rules_open` | niistä vielä valvomatta (`gap`) | **19 / 25** → **3 / 25** (14.9.; 18 enforced, 4 out_of_scope) | 0 — jokainen `gap` joko valvottuna tai perusteltuna muuksi statukseksi. **Jäljellä olevat 3 ovat estyneitä:** kaksi vaatii päivitysavainavaruuden nimeämisen (`app_template.html`, toinen istunto) ja yksi on 1.2:n mekanismi (lähdelistan omat säännöt lainatuille aluksille) |
| `list_race_table` | listan rotu (s.14:n luettelo) datassa | **puuttuu** → **32 / 32** (14.9.; 26 rodullista, 6 luettelon ulkopuolella) | 32 / 32 listaa, kuratoitu taulu, osuttava tasan kerran ✔ |
| `ship_reserve_type` | profiilin tyyppi s.14:n mukaan (`rt`) | **puuttuu** → **171 / 171** (14.9.; 22 `Defence`/`Ground`-runkoa luokiteltu käsin) | jokainen profiili luokiteltu, build kaatuu luokittelemattomaan ✔ |
| `save_schema` | tallennusmuodon versio | **2** → **3** (14.9.) | 3, ja migraatio 2 → 3 todennettu molempiin suuntiin ✔ — `lst` ja `role` vain lainalaivalle, joten yhden listan tallenne on tavulleen sama kuin skeemassa 2; kadonnut lähdelista ei palauta alusta vaan ottaa varmuuskopion. `test_save.js` §16, neljä väitettä |
| `ui_foreign_unit` | pelaaja voi lisätä toisen listan aluksen käyttöliittymästä | **ei** → **kyllä** (14.9.) | kyllä ✔ — katalogin lähdelistan valitsin, rooli oletuksena rodun mukaan ja vaihdettavissa aluksen riviltä, kortti kertoo roolin ja lahjoittajalistan. Todennettu selaimessa: lisätty, merkitty, hinnoiteltu lähdelistalta ja säilyy latauksen yli |

---

## 2. Kerroskohtaiset ehdot

**Data.** Jokainen lainalaivarivi on syntynyt kirjan lauseesta, ja lause on
`referenssi/NN_*.json`:ssa statuksella `enforced`. Yksikään uusi rivi ei ole
kopio toisen listan rivistä ilman lähdelistan tunnistetta: kopiointi kadottaa
lahjoittajalistan päivitykset, jotka kirja nimenomaan sallii (s.14: "Reserve
vessels may take any upgrades, refits, etc. available to either fleet list").

**Moottori.** Lainalaiva lasketaan isäntälistan kiintiöihin. Kirjan lause on
yksiselitteinen (s.14): *"the restrictions on maximum and minimum numbers of
ships are determined for the fleet as a whole, regardless of whether they were
purchased from the list or as reserves"*. Kriteeri, joka vaatii isäntälistan
tarkistusrivien pysyvän muuttumattomina lainalaivaa lisättäessä, on siis kirjan
vastainen eikä kelpaa.

**Regressio.** `test_domain.js` §13:n 46 laivastotapausta ajetaan uudelleen niin,
että laivastoon liitetään yksi vieras yksikkö. Tarkistusrivit jaetaan etukäteen
kahteen luetteloon: ne joiden arvon **on muututtava** (tyyppiin tai pistemäärään
perustuvat) ja ne joiden **ei saa muuttua** (lahjoittajalistan omat säännöt).
Molemmat luettelot ovat tiedostossa, ja poikkeama kumpaan tahansa suuntaan on
punainen.

**Käyttöliittymä.** Vieras alus on lisättävissä käyttöliittymästä, ei vain
datasta. Kortti kertoo aluksen roolin ja lahjoittajalistan. Tallenne palautuu
oikein, kun laivastossa on kahden listan yksiköitä.

**Tulostus.** `print_overflows` 0 ja `unreadable_print_cases` 0 sen jälkeen, kun
kortille on lisätty rooli- ja lahjoittajamerkintä. Marginaali on 0,04 pt
(pienin teksti 4,24 pt, raja 4,2 pt), joten jokainen uusi korttiteksti mitataan
ennen committia.

---

## 3. Mitä 1.1 ei lupaa

Nämä eivät estä 1.1:n valmistumista, ja ne kirjataan näkyviin sovellukseen
`notice`-riveinä tai listatekstinä:

- Liittolaismatriisi ja luonnolliset viholliset (s.17).
- Kampanjapoikkeukset (s.15: reservit, jotka kampanja lisää laivastoon).
- Klaani ja legioona ryhmätason attribuuttina (1.2).
- Kapitaalialusten laivueet (s.13) ja komentajan sijoitus alukselle (J8).
- Nimetyt tallenteet, tuonti ja jakolinkki (1.2, edellyttää J20:tä).

---

## 4. Miten tämä mitataan

    python acceptance.py              # 1.0:n mittarit, tuomio
    python check_reference.py         # referenssit, myös uusi yleistiedosto
    node test_golden.js               # yksikkö- ja laivastotapaukset
    node test_domain.js               # §13 regressio vieraalla yksiköllä
    node layout_check.js              # kortin luettavuus lisämerkintöjen kanssa

Uudet mittarit raportoidaan samaan `docs/DEVELOPMENT_STATUS.md`:ään
`acceptance.py`:n kautta. Mittari, jota ei vielä voi mitata, raportoidaan
sanoilla **ei mitattu** — ei nollana.

---

## 5. Lopputila 14.9.2026

**1.1 on rakennettu ja julkaisukelpoinen.** `APP_VERSION = "1.1"`, jaettava
paketti ja sivustoversio ovat samasta buildista, jäädytetty kopio on
`versiot/1.1/`. Hyväksynnän 20 vaihetta menevät läpi ja 17 mittaria 18:sta on
nollassa tai kyllä. `share_zip_current` on ensimmäistä kertaa **kyllä**.

| mittari | lähtö 13.9. | nyt |
|---|---|---|
| `fleet_goldens` | 0 | 80 |
| `general_rules_open` | 19 / 25 | **0 / 25** |
| `index_refs_unnamed` | 567 | 0 |
| `save_schema` | 2 | 3 |
| `ui_foreign_unit` | ei | kyllä |
| `share_zip_current` | EI | kyllä |
| `test_domain.js` | 4 246 | 4 606 |

**Kaikki 18 mittaria ovat nollassa tai kyllä, ja `acceptance.py`:n tuomio on
ensimmäistä kertaa `LAPI`.** Myös viimeinen aukko suljettiin: s.14:n ja s.16:n
päivityslauseet ovat nyt `enforced`, todisteinaan kolme nimettyä
laivastotapausta. Käyttäjän päätökset T35 ja T37 ratkaisivat ne kirjan
tulkintakysymykset, jotka estivät työn.

Yksi asia jäi tarkoituksella toteuttamatta ja se on kirjattu: s.16:n loppuosa
*"or the rules for that fleet specifically allow it"*. Datassa ei ole kenttää
sille eikä yhtäkään listaa ole tunnistettu sellaiseksi, ja poisjättäminen voi
vain pidättää lupaa, ei antaa liikaa.

Jäljellä oleva askel on käyttäjän: julkaisu Cloudflare Pagesiin.
