# Suunnitelma 1.1 — Lainalaivat

Laadittu 13.9.2026. Pohjana monimenetelmäkartoitus (kuusi rinnakkaista
selvitystä kirjasta, datasta, arkkitehtuurista ja nykytilasta), kolme
itsenäistä suunnitelmaehdotusta ja yhdeksän arviota kolmesta näkökulmasta.
Arviot kaatoivat kaikki kolme ehdotusta samoista syistä; tämä suunnitelma on
kirjoitettu niiden korjausten pohjalta.

Valmiuden määritelmä: `docs/DEFINITION_OF_DONE-1.1.md`. Järjestys ja muut
versiot: `docs/ROADMAP.md`.

---

## 1. Kolme estettä, jotka määräävät järjestyksen

**Este 1: 1.0 on julkaisematta.** `git tag -l` ei palauta v1.0:aa ja
`share_zip_current` on "EI". Julkaisemattomalla versiolla ei ole pelaajia,
joten 1.1:n tunnit menisivät tyhjään yleisöön. → Vaihe 0.

**Este 2: golden-tapaus ei yllä laivastotasolle.** `test_golden.js` asettaa
`S.units = []`, luo `addUnit()`:lla tasan yhden yksikön eikä kutsu
`checks()`:ia; kaikki 355 tapausta ovat yksikkötasoisia. Jokainen
lainalaivasääntö on laivastotason sääntö. Ilman ajuria 1.1:n lupauksia ei voi
todistaa. → Vaihe 1.

**Este 3: osioindeksit ovat nimettömiä.** Datassa on 654 osioindeksiviittausta
(361 pickiä + 293 paljasta `sec`-kenttää), ja vain 77 kantaa osion nimeä.
Kahden listan laivastossa sama indeksi tarkoittaa eri osiota eri listalla —
sama hiljainen vikaluokka, joka kaatoi Bastion Fleetsin taistelulaivasuhteen.
→ Vaihe 1.

---

## 2. Vaiheet

Jokaisen vaiheen jälkeen sovellus on julkaisukelpoinen. Työmäärät ovat
tekoälyavusteisia tunteja, joissa ihminen ohjaa ja päättää tulkinnat.

### Vaihe 0 — 1.0 ulos ja kirjanpito kuntoon · 3–5 h

**Tavoite:** versio pelaajien käsiin ja dokumentit keskenään yhtäpitäviksi.

Työ:
- J6: ZIP samasta commitista, `v1.0`-tagi, julkaisu Cloudflare Pagesiin.
- DoD:n tiivistelmä ja `acceptance.py`:n tuloste yhtenäistetään
  (`spot_check_open` puuttuu ajosta, `upgrade_effect_open` puuttuu
  tiivistelmästä).
- BACKLOGin v1.1-jonosta poistetaan jo tehdyt rivit (Tyranid carapace = J9,
  kortin PTS-kenttä = J3) ja jono osoitetaan tähän suunnitelmaan.
- J73:n sivuviite 103 → 101 (tarkistettu kirjasta).
- J46:n alakohdat yhteen kirjanpitoon.
- Käyttäjän päätökset T26 ja T27 kirjataan.

**Valmis kun:** `share_zip_current` = kyllä, `git tag -l` sisältää v1.0:n,
julkinen osoite vastaa, eikä yksikään DoD:n mittari esiinny vain toisessa
paikassa.

### Vaihe 1 — Varmennuksen edellytys · 10–14 h

**Tavoite:** koneisto, jolla 1.1:n väitteet voi ylipäätään todistaa. Yksikään
pelaajalle näkyvä ominaisuus ei synny tässä vaiheessa, ja se on tietoinen
valinta: ilman tätä kaikki myöhempi on todistamatonta.

Työ:
- ~~`referenssi/golden_cases.json` saa laivastotapausmuodon~~ → **tehty 14.9.**
  omana tiedostonaan `referenssi/golden_fleet_cases.json`. Muoto:
  `{"fleet": {"list", "limit", "units": [{"list", "entry"|"ship", "n", "repeat",
  "opts", "ups"}]}, "expect": {"total", "checks": [{"src"|"label", "ok", "v",
  "warn"}], "others_ok", "failing"}}`.
  *Poikkeama suunnitelmasta ja sen syy:* `golden_cases.json` on 4 600 rivin
  yksikkötapaustiedosto, jota toinen istunto muokkaa rinnakkain
  (korttitapaukset). Sama tiedosto olisi pakottanut osittaiseen stagingiin
  jokaisella committilla — juuri se, mitä käyttäjä kielsi 13.9.
  (`app_template.html`). Erillinen tiedosto on myös rakenteellisesti oikein:
  tapausmuoto ja ajuri ovat eri.
- ~~`test_golden.js`: monen yksikön ajuri~~ → **tehty 14.9.** `buildFleet()`
  kokoaa laivaston `addUnit()`:lla, `runFleetCase()` lukee `checks()`:in ja
  vertaa rivejä kirjan lauseeseen (`src`) tai otsikkoon (`label`); rivin on
  osuttava tasan kerran. Mukana laivastotason tallennuskierros (save → load →
  samat pisteet ja samat tarkistusrivit). Yksikkötasoiset 357 tapausta pysyivät
  ennallaan.
- **Mutaatiotesti (14.9.):** ajuri, joka ei osaa mennä punaiseksi, on arvoton.
  Kahdeksan tahallista vääristystä — väärä summa, käännetty `ok`, väärä arvo,
  osumaton `src`, kahteen riviin osuva `label`, `others_ok`:n nappaama punainen,
  puuttuva listarivi ja vieras lähdelista — tuottivat kaikki punaisen, ja
  palautus vihreän.
- ~~Osion nimi kirjoitetaan **jokaiseen** indeksiviittaukseen~~ → **tehty
  14.9.** Kenttä `sn` (pick ja `up_sec`-rivi), `up_sn` ja `<avain>_sn`
  (`sec`, `allow_sec`, `per_sec`). Yhteensä **667 viittausta, kaikki
  nimettyjä**; luku on `acceptance.py`:n mittari `index_refs_unnamed` = 0.
  `a_sec`/`b_sec` eivät ole olemassa: `compare` käyttää `a_pick`/`b_pick`-
  muotoa, joka on pick eikä paljas indeksi.
- ~~`domain.js` vertaa nimeä ennen laskentaa~~ → **tehty 14.9.**
  `secNameIssues()` kävelee säännön läpi ennen laskentaa; ristiriita tuottaa
  tarkistusrivin `Data error: <sääntö>` eikä sääntöä lasketa lainkaan. Väärä
  luku näyttäisi pelin säännöltä, ja se on pahempi kuin näkyvä datavirhe.
- ~~`build_data.py`: vartija kaikkien siirtojen jälkeen~~ → **tehty 14.9.**
  Nimet leimataan, kun listan osiot ovat lopullisessa järjestyksessä, ja
  tarkistetaan uudelleen (a) heti vieraiden osioiden poiston jälkeen ja
  (b) juuri ennen `bfg_data.jsonin` kirjoitusta; 978 uudelleentarkistusta.
  Myöhäisen (`late=True`) polun säännöt leimataan vasta lopussa, koska niiden
  indeksit kirjoitetaan kaikkien siirtojen jälkeen.
- **Punaisuustodiste (14.9.):** `python build_data.py --prove-guard` työntää
  jokaiseen listaan yhden osion eteen korjaamatta indeksejä ja vaatii, että
  jokainen lista kaatuu: **32/32**. Sama siirtymä `test_domain.js`:n osiossa
  14 — ennen korjausta moottori kertoi laivastosta, jossa on Emperor-luokan
  taistelulaiva, "Battleships 0 / 0 OK"; korjauksen jälkeen se kertoo
  datavirheestä.

**Valmis kun:** ≥ 12 laivastotason golden-tapausta lukitsee nykyisen
käyttäytymisen vihreänä *(tehty: 19 kpl, 11 sääntölajia — `ratio`,
`section_count`, `squadron` yksinäisine saattajineen, `mandatory_at`
molemmilta puolilta rajaa, `per_points` sekä osittaisella että täydellä
kaistalla, `requires`, `hook_capacity`, `tiers`, `min_ratio`, `compare`)*;
vartija osoitettu punaiseksi tahallisella osiosiirtymällä; `index_refs_named`
kaikki; `acceptance.py` ei HYLÄTTY.

**Riski:** laivastotason golden voi lukita nykyisen virheellisen
käyttäytymisen. Torjunta: jokaisen uuden tapauksen odotus luetaan kirjasta,
ei ajamalla sovellusta.

### Vaihe 2 — Kirjan yleisluku totuudeksi · 6–8 h

**Tavoite:** Fleets s.14–17 on projektissa yhtenä totuuslähteenä, ennen kuin
yhtään mekanismia rakennetaan sen varaan.

Työ:
- `referenssi/99_yleiset_reservit.json`: jokainen s.14–17:n lause omana
  sääntönään sivunumerolla ja statuksella. Keskeiset lauseet:
  *"For every three battleships, cruisers or escorts chosen from the fleet
  list, you may also pick one ship of the same type from another fleet list
  belonging to the same race."* (s.14),
  *"Reserves are still subject to the restrictions on minimum and maximum
  numbers of certain types of vessels."* ja *"Basically, the restrictions on
  maximum and minimum numbers of ships are determined for the fleet as a whole,
  regardless of whether they were purchased from the list or as reserves."*
  (s.14),
  *"Reserve vessels may take any upgrades, refits, etc. available to either
  fleet list but may not take any special characters from the reserve fleet
  list to use with the primary fleet."* (s.14),
  *"Reserve fleets are those specifically described as such in their fleet
  lists, not merely those identified as being capable of allying with each
  other."* ja *"Some fleet lists explicitly provide access to ships from other
  races. These may only be taken exactly as described on their fleet list rules
  and may not also be taken as reserves."* (s.14–15),
  *"no more than one allied vessel may be taken for every three core vessels
  in the fleet"* (s.16),
  *"Allied and reserve vessels cannot use refits and upgrades from the fleet
  list they are allied to unless they are of the same race or the rules for
  that fleet specifically allow it."* (s.16).
  **Tehty 14.9.:** 25 lausetta, joista 19 `gap` (jokaisella `task`, joka
  nimeää vaiheen), 3 `enforced` (`enforced_by: "list_rules"` + `src_has`,
  eli yleislause on toteutettu listan omalla säännöllä) ja 3 `out_of_scope`.
  **Kirjan oma puute löytyi:** s.17:n ALLIES MATRIX on tässä painoksessa
  (WIP v0.36) pelkkä otsikko ilman matriisia — luonnollisia vihollisia ei voi
  lukea kirjasta, ja kirja itse sanoo saman sivun tekstissä, että luettelo on
  ohje eikä vaatimus. Tarkistettu sivukuvasta, ei vain tekstipoiminnasta.
- ~~`check_reference.py` hyväksyy tiedoston, jolla ei ole `list`-kenttää
  (`scope: "general"`)~~ → **tehty 14.9.** `check_general()`: `enforced`
  vaatii osoituksen (`src_has` löytyy jonkin listan säännöstä tai `kind` on
  datassa), `gap` vaatii `task`-kentän, muut vaativat perustelun. Kuusi
  mutaatiota todistivat tarkistimen punaiseksi. `acceptance.py` mittaa
  `general_rules_open`; 1.0:n `unclassified_rules` pysyy listasääntöjen
  mittarina eikä sekoitu 1.1:n työjonoon.
- ~~`build_data.py`: kuratoitu `LIST_RACE`-taulu~~ → **tehty 14.9.** 32 riviä,
  jokainen osuu tasan kerran, jokaisella perustelu. **26 listaa saa rodun, 6 ei
  saa lainkaan:** Rogue Traders (3), Demiurg, Inquisition ja Grey Knights.
  Peruste on kirjan oma sanamuoto: rotuluettelo on suljettu (*"For the purpose
  of the game, the races are: …"*, s.14) eikä nimeä niitä, ja s.15 sanoo, että
  listan nimetty pääsy *"may only be taken exactly as described on their fleet
  list rules and may not also be taken as reserves"*. Rotu `space marines`
  Grey Knightsille ohittaisi s.138:n ja s.145:n omat ehdot (Inquisitor Lord,
  Ordo Malleus), joten se olisi väärin.
- ~~Alustyypin luokittelu s.14:n mukaan~~ → **tehty 14.9.** Profiilin kenttä
  `rt` ∈ `battleship` / `cruiser` / `escort` / `none`. `Cruiser` ja
  `Grand Cruiser` → `cruiser` (s.14 nimeää grand cruiserit cruisereiksi);
  **kaikki 22 `Defence`- ja `Ground`-runkoa on luokiteltu käsin**, eikä build
  salli yhdenkään jäädä oletukselle. Chaos Space Hulk on `battleship`
  (s.288: *"It counts as a battleship for purposes of taking another"*), Ork
  hulk ei ole mitään kolmesta tyypistä (kirja ei sano niin; sen määrän
  ratkaisee oma sääntö s.367/s.372). Jakauma: 32 / 68 / 50 / 21.
- **Punaisuustodiste (14.9.):** `--prove-guard` poistaa yhdeltä listalta rodun
  ja yhdeltä profiililta tyypin ja vaatii, että kumpikin kaataa buildin.
  `test_domain.js` §15 oli punaisena ennen korjausta 14 tarkistuksella.

**Valmis kun:** `check_reference.py` 0 löydöstä; jokaisella s.14–17:n lauseella
on status; rotutaulu ja tyyppikartta kaatavat buildin, jos osuma katoaa.

### Vaihe 3 — Moottori · 16–22 h

**Tavoite:** laivasto voi koostua useamman listan yksiköistä, ja säännöt
laskevat oikein.

Työ:
- ~~Yksikkö kantaa oman listansa ja roolinsa: `core` | `reserve` | `ally`.
  `selectionOf` johtaa listan yksiköstä, ei kontekstista.~~ → **tehty 14.9.**
  `listOfIntent()` ratkaisee listan `entry.list`-kentästä ja kontekstista vain
  varalta; `selectionOf`, `validateIntent`, `transition`, `fromLegacyUnit` ja
  `toLegacyUnit` käyttävät sitä. Legacy-yksikkö kantaa `u.lst`- ja
  `u.role`-kentät. **Goldenit löysivät oikean virheen:** `validateIntent` ja
  `transition` lukivat yhä kontekstin listaa, joten jokainen vieras yksikkö sai
  virheen `entry.unknown` — se näkyi laivastotapauksissa ylimääräisenä
  punaisena rivinä.
- **Yleissäännöt s.14–16 moottoriin (tehty 14.9.):** reservien 1:3 tyypeittäin
  (s.14), tyyppiportti (s.14: vain battleship, cruiser tai escort; grand
  cruiser on cruiser), rotuportti (s.15) ja liittolaisten 1:3 ydinaluksiin
  nähden (s.16). Rivit syntyvät vain, kun laivastossa tosiaan on lainalaiva,
  joten yhden listan laivasto lukee täsmälleen kuten ennen.
- **Osioindeksi on listan oma (tehty 14.9.):** `matches()` vaatii nyt, että
  yksikkö kuuluu siihen listaan, jonka sääntöä lasketaan. Ilman tätä Bastionin
  Avenger (osio 3 = *Battleships*) olisi laskettu Gothic Sectorin osioon 3 =
  *Battlecruisers*. Koska kirja silti vaatii laskemaan lainalaivat isännän
  kiintiöihin (s.14), laivasto **kertoo näkyvästi**, ettei sitä vielä tehdä:
  rivi *"Borrowed ships and this list's own limits — not counted yet"*.
- ~~`resolveFleet` ratkaisee jokaisen yksikön omalla kontekstillaan ja laskee
  isäntälistan kiintiöt koko laivastosta (s.14).~~ → **tehty 14.9.**
  Silta osiopohjaisen laskennan ja kirjan tyyppipohjaisen säännön välillä on
  **osion otsikko**: se on kirjan oma tapa luokitella alus siinä listassa,
  jossa alus on painettu. Osio on joko `type` (otsikko nimeää aluslajin:
  Cruisers, Battleships, ESCORTS, KROOZERS…) tai `own` (otsikko nimeää tietyt
  alukset tai listan oman nimetyn pääsyn: Planet Killer, Chaos Space Hulk,
  Kroot Vessels, RESERVES). Lainalaiva laskeutuu isännän sääntöön, kun
  molemmat otsikot ovat `type` ja ne ovat sama otsikko. **43 otsikkoa
  luokiteltu käsin, 143 osiota**; build kaatuu luokittelemattomaan osioon
  (`--prove-guard` todistaa senkin). Ks. päätös T34.
  Viisi uutta golden-tapausta todistavat laskennan neljällä sääntölajilla:
  `section_count` (0-12 Cruisers 13/12), `cap` (kuusi kroozeria 7/6), `ratio`
  (reserviristeilijä **nimittäjässä**: viisi omaa sallisi yhden taistelulaivan,
  kuusi sallii kaksi) ja `squadron` (reservilaivue 7 alusta).
- Pick laajenee muotoon `{list?, sec, sn, re?}`; puuttuva `list` tarkoittaa
  säännön omaa listaa, jolloin nykyiset 361 pickiä säilyttävät merkityksensä.
- ~~Uudet sääntölajit `reserve_ratio` ja `ally_ratio` (1:3, tyypeittäin).~~ →
  **tehty 14.9.** Ne eivät ole datan sääntörivejä vaan yleissääntöjä, joten ne
  elävät `resolveFleet`issa; todiste on nimetty laivastotapaus
  (`check_reference.py`: `enforced_by: "fleet_golden"` + `goldens`).
- ~~Rotuportti (s.15)~~ → **tehty 14.9.**; **nimetyt poikkeukset jäljellä**,
  esimerkiksi: *"a Gothic Sector fleet list cannot take Space Marine vessels as
  reserves"* (s.15). Tämä ei laukea vielä siksikään, että Space Marines on eri
  rotu — poikkeus tarvitaan vasta, kun listakohtaiset luvat tulevat mukaan.
- ~~Reservin reservi -kielto: rivi tietää, onko se itse reservi.~~ →
  **tehty 14.9.** Osion laji sai kaksi arvoa lisää: `reserve` (listan oma
  reserviosio — sen alukset ovat jonkun toisen listan) ja `access` (listan
  nimetty pääsy toisen rodun aluksiin: Kroot, Demiurg, Nicassar, Rogue
  Traders, Tau Escorts, Stryxis). Kummankaan rivi ei kelpaa lainattavaksi, ja
  virhe siteeraa oikeaa lausetta: *"you cannot use a reserve of a reserve"*
  (s.15) tai *"may not also be taken as reserves"* (s.15). Luokittelu:
  100 `type`, 26 `own`, 1 `reserve`, 16 `access`.
  Esimerkki on datassa oikeasti olemassa: Bakka Sectorin RESERVES-osion
  Jovian class battlecruiser (s.48).
- Päivitykset: reservialus saa molempien listojen päivitykset, mutta ei
  lahjoittajalistan erikoishahmoja (s.14). **Jäljellä.** Lähdelistan
  päivitykset toimivat jo (ne tulevat yksikön omalta listalta), mutta
  isäntälistan päivitysten tarjoaminen vaatii avaimen laajennuksen:
  `upState(sel, si, ei)` avaa päivityksen osio- ja riviindeksillä, jotka
  tarkoittavat eri asiaa kahdella listalla. Avainavaruus on nimettävä
  (esim. `h:si:ei`) ennen kuin tämän voi tehdä oikein, ja se muuttaa myös
  tallennusmuotoa — siis samaan aikaan skeeman 3 kanssa.
- Tallennusmuoto 3: yksikkö kantaa lähdelistan; migraatio 2 → 3.
  **ODOTTAA TOISTA ISTUNTOA:** `saveDocument()` ja `load()` ovat
  `app_template.html`:ssä, jossa on committaamattomia muutoksia. Siihen asti
  lainalaiva ei säily tallenteessa, ja laivastotapaukset ohittavat
  tallennuskierroksen sillä perusteella (ajuri kirjaa syyn tapauksen riville).

**Valmis kun:** jokaisella yllä olevalla kirjan lauseella on laivastotason
golden; §13:n 46 tapausta ajettu vieraalla yksiköllä kahden luettelon mallilla
(muuttuvat / muuttumattomat); `test_save.js` todistaa migraation molempiin
suuntiin; `acceptance.py` ei HYLÄTTY.

**Tilanne 14.9.:** jokaisella toteutetulla lauseella on golden (62
laivastotapausta). Kaksi ehtoa jää auki ja molemmat samasta syystä: ne
vaativat `app_template.html`:ää, jossa on toisen istunnon committaamattomia
muutoksia — tallennusmuoto 3 ja §13:n ajo vieraalla yksiköllä (se tarvitsee
tallennuskierroksen). `acceptance.py` ei ole HYLÄTTY.

**Riski:** kiintiölaskenta on osiopohjainen, ei tyyppipohjainen. 58
`section_count`-, 9 `cap`- ja 44 `ratio`-sääntöä on käytävä läpi ja
luokiteltava: laskeutuuko vieras runko tähän sääntöön vai ei. Torjunta:
luokittelu on pakollinen kenttä, ja build kaatuu luokittelemattomaan sääntöön.

### Vaihe 4 — Kirjan tapaukset ja käyttöliittymä · 14–20 h

**Tavoite:** pelaaja pääsee tekemään sen, mitä yhteisö pyysi.

Työ:
- Käyttöliittymä: `addUnit` ja katalogi tunnistavat lähdelistan; oma
  "Reserves & allies" -paneeli; kortti kertoo roolin ja lahjoittajalistan.
- Kirjan tapaukset järjestyksessä:
  1. ~~**Inquisition** kahdeksalle isäntälistalle (s.138: *"The Inquisition has
     no fleet list on its own"*). Ratkaisee yhteisöpalautteen suoraan.~~ →
     **tehty 14.9.** Osio `THE INQUISITION` kahdeksalle listalle, jotka kirja
     nimeää (*"any Imperial Navy, Space Marine or Adeptus Mechanicus fleet"*):
     Inquisitor Lord (Ld 9) 75, Inquisitorial Cruiser 270 (0-1), Inquisition
     Blackship 300 (0-1), Grey Knights Strike Cruiser 165. Säännöt: Lordi
     750 pisteestä (`allowed_at`), GK Strike Cruiser yksi per 500 pistettä
     **vain Lordin johtamassa** laivastossa (`per_points` + `cond_pick`), ja
     Lordi johtaa laivastoa listan oman komentajan **sijasta** (`cap` kahden
     osion yli, sama rakenne kuin Eldar Herolla s.316). Isännän komentajapakko
     täyttyy myös Lordilla. Grey Knights Battle barge jäi pois: se vaatii Ordo
     Malleus -inkvisiittorin (s.138, s.145), jota näiden listojen
     komentajaosioissa ei ole — se pysyy Grey Knights -listalla. 4 goldenia,
     joista ensimmäinen on yhteisöpalautteen oma esimerkki.
  2. ~~**Chaosin renegaatit** (s.222). Vaatii ensin sääntöikkunan korjauksen.~~
     → **tehty 14.9., mutta toisin kuin suunnitelmassa.** Sääntöikkunaa ei
     laajennettu: mittasin, että kuuden sivun katon poisto toisi 5–14 sivua
     lisää tekstiä **kahdelletoista listalle** (Imperial Navylle 14, Rogue
     Tradersille 14, Chaosille 14) — enimmäkseen kertomusta ja profiileja.
     Riski on suurempi kuin hyöty. Sen sijaan osio `RENEGADE IMPERIAL VESSELS`
     lisättiin suoraan kuudelle Chaos-listalle, ja **kirjan lause on sen
     tekstinä** — pelaaja näkee täsmälleen saman kuin laajennetusta ikkunasta.
     Rivit: Imperiumin risteilijät ≤185 p (10) ja saattajat (6), kaikki ilman
     profiilipäivityksiä (*"may not take any upgrade listed in their
     profile"*). Kaksi sääntöä: yksi risteilijä ja kuusi saattajaa **täyttä**
     1 500:aa kohti. Lauseen loppu *"they count as Chaos vessels in all
     respects"* toteutuu sillä, että listan oma *0-12 Cruisers* ja
     saattajalaivuesääntö laskevat ne mukaan (`section_count` sai `pick`-tuen).
     4 goldenia + erillinen todiste siitä, että ilman `pick`iä renegaatti jää
     laskematta.
  3. ~~**Bastion Fleetsin** viisi Chaos-runkoa (s.39).~~ → **tehty 14.9.**
     Repulsive 230, Executor 210, Hades 200, Carnage 180, Murder 170 listan
     omaan RESERVES-osioon, varianttikiellolla (`noopt`, s.39: *"you cannot
     pick any of the ship class variants"*). Hinnat luetaan Chaos-listoilta,
     koska s.39 ei anna niitä. **Uusi yleinen mekanismi:** listan *oman*
     reserviosion rivi on reservi, vaikka se ostetaan tältä listalta — silloin
     se kuluttaa saman 1:3-budjetin kuin muualta lainattu alus, mikä on juuri
     se, mitä kirjan *"or from the above selection of Chaos vessels (but not
     both)"* tarkoittaa. Rotuporttia ei sovelleta omaan reserviosioon: lista
     nimeää alukset itse.
  4. **Bakan** Imperial-reservit ja Rogue Trader -risteilijä (s.48–50).
     Osittain tehty 14.9.: Jovian on nyt Bakan oma reservi ja kuluttaa 1:3:n
     (s.50), ja listan oma päällekkäinen sääntö poistettiin — sama suhde tulee
     kirjan yleissäännöstä, eikä yhdestä virheestä pidä tulla kahta punaista
     riviä. **Jäljellä:** *"One Rogue Trader cruiser and its attendant escorts
     may be taken for every 750 points in the fleet"* ja *"Reserve cruisers
     (not battlecruisers or grand cruisers) always count toward the
     twelve-cruiser fleet limit"* (s.50).
  5. ~~**Dominionin** Imperial Navy -reservit (s.101).~~ → **tehty 14.9.**
     s.101 sanoo suoraan *"Contrary to the normal rules"*, joten listalle
     kirjattiin **nimetty reservilupa** (`res_ok`): rotu `imperial navy` sekä
     kolme Rogue Traders -listaa, joilta on rajattu pois xenos-rivit
     (*"non-xenos Rogue Trader vessels"*). Lupa kaataa rotuportin vain
     nimetyiltä lähteiltä — Chaos ei kelpaa. Lisäksi *"When reserves are taken
     in this manner, the fleet can have up to twelve cruisers"*: listan oma
     0-10 muuttui ehdolliseksi katoksi, jonka ehto on **rooli** eikä rivi
     (`conditional_cap.cond_role`). J92:n huomautus *"ei vielä
     sovelluksessa"* poistettiin — se olisi nyt väärää tietoa. 6 goldenia.
  6. ~~**Eldar Corsairs ↔ Iyanden** (s.316, s.319).~~ → **tehty 14.9.**
     Kirja käyttää sanaa *reserves* molemmilla sivuilla (*"in order to use
     Craftworld Eldar vessels as reserves"*), joten se on **ehdollinen
     reservilupa**, ei liittolaissuhde — ja juuri siksi sitä ei voi hoitaa
     rodulla: Eldar ja Craftworld Eldar ovat s.14:n luettelossa eri rotuja.
     Lupa (`res_ok` + `needs_re`) vaatii, että laivastoa johtaa Eldar Hero
     (tai Iyandenilla Prince Yriel, s.319). Suhdeluvut tulevat kirjan
     yleisestä 1:3:sta. 4 goldenia, kumpikin suunta molemmin puolin ehtoa.
  7. **Rogue Traders ja Tau** ristiin (s.174–175, s.454–457). **Tehty 14.9.**
     Tau-suunta oli jo datassa (Tau-listojen omat *Rogue Traders* -osiot
     sääntöineen). RT-suunta lisättiin: *XENOS ALLIES* -osio sai rivit
     (Stronghold 350, Bastion 255, Citadel 185, Kroot Warsphere 145) ja
     säännön s.175:n lauseesta. Samalla Bakan *"One Rogue Trader cruiser and
     its attendant escorts may be taken for every 750 points in the fleet"*
     (s.50) sai oman osionsa ja sääntönsä. **Lukutapa:** kumpikaan lause ei
     sano *"or part thereof"* — toisin kuin s.174:n oma RT-risteilijäsääntö —
     joten 750 luetaan täytenä. 4 goldenia, molemmat rajan puolet.
     **Tehty 14.9. myös s.174:n laajat lauseet:** osio `ROGUE TRADERS`
     21 listalle — Tau, Demiurg ja Imperiumin listat saavat *"one Rogue Trader
     cruiser for every 750 points or part thereof"*, muut *"a single Rogue
     Trader capital ship"*. Ulkopuolelle jäävät Necronit ja tyranidit (kirjan
     *"except"*), RT-listat itse, Bakka / Tau Commerce Protection / Demiurg
     (oma tarkempi sääntö) sekä Crusade ja Grey Knights (oma kielto).
     *"Rogue Trader cruisers always count against cruiser restrictions"*
     toteutuu `section_count`in `pick`illä — sama mekanismi kuin Chaosin
     renegaateilla, ei erillistä poikkeusta.

**Valmis kun:** ~~`reserve_sections_with_rows` ≥ 14/18~~; jokaisella
tapauksella golden kirjan lauseella; pelaaja voi rakentaa yhteisön esimerkin
(Inquisitorial Cruiser johtamassa Navy-laivastoa) käyttöliittymästä alusta
loppuun.

**Tilanne 14.9.:** jokaisella seitsemällä tapauksella on golden kirjan
lauseella. **Mittari `reserve_sections_with_rows` osoittautui vääräksi
mittariksi** ja korvattiin: 19:stä reservi- tai liittolaisotsikosta vain
viidellä *on* rivejä, koska kirja hoitaa loput toisin — luvalla (`res_ok`,
4 listaa), kiellolla (`res_ban`, 2 listaa), listan omalla nimetyllä osiolla
(Kroot, Demiurg, Nicassar, Rogue Traders, Tau Escorts, THE INQUISITION) tai
kirjan yleissäännöllä. Rivien pakottaminen tyhjiin otsikoihin olisi
keksimistä. Uusi mittari on `general_rules_open` ja tapauskohtaiset goldenit.
**Yhteisön esimerkki toimii moottorissa** (golden
`inquisitorial-cruiser-leads-a-navy-fleet`), mutta **käyttöliittymästä sitä ei
vielä voi rakentaa**: katalogi näyttää vain valitun listan rivit. Se ja
tallennusmuoto 3 ovat `app_template.html`:ssä ja odottavat toista istuntoa.

---

## 3. Tulkintapäätökset

Käyttäjä siirsi päätökset 14.9.2026 minulle ("ratkaise päätöslistasi parhaasi
mukaan"). Jokainen on ratkaistu kirjan lauseella, ei mieltymyksellä. Kaksi
ratkesi niin, ettei tulkinnanvaraa jäänyt lainkaan.

| T | Kysymys | **Päätös 14.9.** | Peruste |
|---|---|---|---|
| T26 | Lasketaanko kiintiöt pelin pisterajasta vai laivaston omista pisteistä? | **Sanamuoto ratkaisee.** `per_points` ja `tiers` laivaston omista pisteistä, `points_share` pisterajasta | s.372 "for every 500 points, or part, that the fleet **is worth**", Corsairs "for every full 1,000 points **it contains**", SM "or part thereof **in your fleet**" → laivaston pisteet, sama linja kuin T24. Tyranidit s.431 "10 % of the fleet's points **allowance**" → allowance on pelin koko, ei rakennettu laivasto |
| T27 | Rogue Traderin crew skillin +10 %: laskupohja ja pyöristys | **Vahvistettu nykyinen:** runko, optiot ja refitit ennen crew skilliä, ylöspäin | s.175 "+10% point value" tarkoittaa aluksen tai laivueen arvoa, ja Rulebook pyöristää ylöspäin (s.88, s.99) |
| T28 | Ketkä saavat reservejä ja mistä? | **Päätös: kirjan mukaan, ei jää tulkinnaksi.** Isäntä: mikä tahansa lista (*"Any fleet chosen from one of the fleet lists may also include reserves"*, s.14). Lahjoittaja: saman rodun lista (*"must come from the same 'race'"*, s.14 ja rotuluettelo s.15). Pelkkä liittolaissuhde ei kelpaa (*"Reserve fleets are those specifically described as such in their fleet lists, not merely those identified as being capable of allying with each other"*, s.14), ja listan oma kielto voittaa (Gothic Sector ei saa Space Marine -aluksia, s.15). **Laajuus on siis 94 suunnattua listaparia**, joista Imperial Navy 30 ja Chaos 30. **Tarkennus 14.9.:** kun rotuluettelo luettiin suljettuna (s.14 *"the races are"*) ja `LIST_RACE` kirjattiin, luku on **68 suunnattua paria** — Rogue Traders, Demiurg, Inquisition ja Grey Knights eivät ole luettelossa, joten ne toimivat vain omien listasääntöjensä kautta. Jakauma: Chaos 30, Imperial Navy 20, Space Marines 6, Orks 6, Eldar 2, Tyranids 2, Tau 2 | Keskikorkea |
| T34 | Mihin isäntälistan kiintiöön lainalaiva laskeutuu, kun sovellus laskee osioittain ja kirja tyypeittäin? | **Sen otsikon mukaan, jonka alla alus on omalla listallaan — ja vain jos isännän osiossa on saman s.14-lajin rivi.** Ratkaistu 14.9., **tarkennettu 15.9.** Osio luokitellaan `type` (aluslaji) tai `own`; lainalaiva laskeutuu vain samannimiseen `type`-osioon, jossa on rivi samaa lajia (`rt`: battleship / cruiser / escort) | Kirjan oma esimerkki s.14 laskee reservinä otetun grand cruiserin isännän grand cruiser -kiintiöön, eli **lajin** mukaan — ja lajin kertoo se otsikko, jonka alle kirja painaa aluksen. Kun listojen otsikot eroavat (Bastion painaa grand cruiserit otsikon *Battleships* alle), lähdelistan oma otsikko on kirjan oma luokittelu juuri sille alukselle. Jos vastaavaa otsikkoa ei isännällä ole, alusta ei lasketa mihinkään ja laivasto kertoo sen rivillään: alilaskenta on turvallisempi kuin väärä kiintiö, koska väärä luku näyttää pelin säännöltä. `own`-osiot eivät ota vastaan lainalaivoja, koska s.15 pitää nimetyn pääsyn ja reservin erillään. **Tarkennus 15.9. (Codex-katselmointi):** pelkkä otsikko ei riitä. Bastion painaa taistelulaivat, grand cruiserit JA battlecruiserit yhden otsikon *Battleships* alle, joten otsikkovertailu yksin laski lainatun Avengerin (grand cruiser) Gothic Sectorin **taistelulaivaksi** ja söi sen ainoan taistelulaivapaikan. s.14 sanoo suoraan: *“battlecruisers, grand cruisers, heavy cruisers, cruisers, and light cruisers all count as ‘cruisers’”*. Nyt otsikon lisäksi vaaditaan saman lajin rivi isännän osiossa; muuten alusta ei lasketa mihinkään ja siitä kerrotaan omalla rivillään |
| T33 | Saako lahjoittajalista olla mikä tahansa saman rodun lista, vai vain sellainen, joka kuvaa itsensä reservilistaksi? | **Mikä tahansa saman rodun lista.** Ratkaistu 14.9. | s.14:n oma lause on ehdoton (*"you may also pick one ship of the same type from another fleet list belonging to the same race"*), ja **kirjan molemmat esimerkit lahjoittavat tavallisilta listoilta**: *"for every three cruisers chosen from the Gothic Sector fleet list, you could pick one cruiser from another Imperial Navy fleet list"* (s.14) ja *"a Gothic Sector fleet list with six cruisers may take both a grand cruiser from the Imperial Bastions fleet list and a cruiser from the Adeptus Mechanicus fleet list"* (s.15). Lause *"Reserve fleets are those specifically described as such … not merely those identified as being capable of allying"* (s.14) erottaa reservin liittolaisuudesta, ei rajaa lahjoittajia |
| T29 | Inquisition: oma lista vai liite isäntälistaan? | **Molemmat:** lista säilyy (tallenteet ja kortit toimivat) ja saa ilmoituksen, että kirjan mukainen tapa on liittää se isäntälaivastoon; liiteosio lisätään kahdeksalle isäntälistalle | s.138 "The Inquisition has no fleet list on its own. Instead, there are various ways to add an Inquisitor or Inquisitorial ships to the Imperial factions." Listan poistaminen rikkoisi olemassa olevat tallenteet ilman että kirja sitä vaatii |
| T30 | Klaani ja legioona: aluksen päivitysrivi vai Warlord-ryhmän attribuutti? | **1.1: vain todistetut virheet. Ryhmäattribuutti 1.2:een** | s.369 "A Warlord and his skwadrons may only be from one clan" on ryhmätason sääntö. Ryhmätaso palvelee myös kapitaalilaivueita (s.13) ja komentajan sijoitusta (J8) — yksi mekanismi kolmelle tarpeelle, ja se on liian iso 1.1:een |
| T31 | Space Hulkin Gubbins-tuplaus (s.372) — koskeeko se myös MORE GUBBINSia (s.371)? | **Ei koske.** Tuplaus vain GUBBINS-listalle; MORE GUBBINS listahintaan eikä kuluta Warlordin re-roll-budjettia; Klaws saa Grunt-saattajarivin +5 | s.372 "upgrades from **the list of Gubbins** for double the listed cost" nimeää yhden listan. MORE GUBBINS on oma otsikkonsa omalla luvallaan: "The following gubbins can be taken by **any number of capital ships in the fleet**" ja "(Not for escorts except the Grunt at +5 points per escort.)" |

---

## 4. Riskit

| riski | miksi | torjunta |
|---|---|---|
| Hiljainen osioindeksivika kahden listan välillä | 654 viittausta, joista 77 nimettyä | Vaihe 1 nimeää kaikki ja kaataa buildin ristiriitaan |
| Golden lukitsee väärän käytöksen | Kävi jo kerran: hulkkitulkinta oli vihreänä kolme kierrosta | Odotus luetaan kirjasta, ei ajamalla sovellusta |
| Kiintiöiden osiopohjaisuus | Kirja puhuu tyypeistä, sovellus osioista | 111 säännön pakollinen luokittelu vaiheessa 3 |
| Tallennusmuodon migraatio | Vanhat tallenteet ovat pelaajien selaimissa | Skeema 3 molempiin suuntiin testattuna, epäonnistunut palautus säilyttää varmuuskopion |
| Tulostusmarginaali | 0,04 pt jäljellä | Jokainen uusi korttiteksti mitataan `layout_check.js`:llä ennen committia |
| Laajuuden kasvu | 18 reservi-osiota, 62 osiota puhuu aiheesta | T28 päättää laajuuden ennen vaihetta 3 |

---

## 5. Työmäärä yhteensä

| vaihe | tunnit |
|---|---|
| 0 — 1.0 ulos ja kirjanpito | 3–5 |
| 1 — varmennuksen edellytys | 10–14 |
| 2 — kirjan yleisluku totuudeksi | 6–8 |
| 3 — moottori | 16–22 |
| 4 — tapaukset ja käyttöliittymä | 14–20 |
| **1.1 yhteensä** | **49–69** |

Lisäksi 1.0.2:n pienet lupaukset 8–12 h, jotka voi tehdä vaiheen 0 jälkeen
missä järjestyksessä tahansa (`docs/ROADMAP.md`).

## 6. Vaiheiden 0–4 jälkeinen tarkastus (14.9.2026)

Vaiheet 0–4 ovat valmiit kaikilta osin, jotka eivät vaadi käyttäjää tai
`app_template.html`:ää. Sen jälkeen tehtiin erillinen tarkastuskierros, joka
kysyi eri kysymyksen kuin testit: **valehteleeko jokin tarkistus itselleen.**
Kaikki aiemmat tarkistukset vertaavat dataa itseensä tai moottoriin, joten
kumpikaan löydös alla ei olisi voinut tulla niistä esiin.

| löydös | mitä varmistaa jatkossa |
|---|---|
| Bastion Fleetsin osiossa (s.39) sama lause kahdesti — poiminnasta ja kuratoinnista | `qa_structure.js` osa 5, 78270 tarkistusta |
| Sitaatti ei aina ollut kirjan lause; 21 aitoa korjausta | `check_quotes.py`, hyväksynnän vaihe `SITAATIT`, 938 sitaattia |

Yksityiskohdat `docs/BACKLOG.md` riveillä J112 ja J113. Kumpikin korjaus
osoitettiin ensin punaiseksi rikkomalla data tahallaan ja sitten vihreäksi.

**Jäljellä 1.1:stä** vain kaksi lajia:

- **toista istuntoa odottavat** (`app_template.html`): vieraiden yksiköiden
  luettelo käyttöliittymässä, tallennusmuoto 3, päivitykset molemmilta
  listoilta, J103 `applyRequired`
- **käyttäjää odottavat**: J6 (jakelu-ZIP) ja Cloudflare-julkaisu
