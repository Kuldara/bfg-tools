# P1-3 · Aseita lisäävät optiot

**Tila:** valmis 8.9.2026 · **Koko:** keskikokoinen · **Vaikutusluokka:** aserivin lisäys (`add`)

## Tehty

Uusi vaikutustyyppi `add` = `[nimi, kantama, tulivoima, kaari]` — sama
4-taulukko kuin listapäivityksen `en.add`, ja `armModel()` käsittelee
molemmat samalla koodilla. Take / Option / Hide säilyy: `take` tikattu,
`opt` tyhjä ruutu, `off` ei riviä.

Viisi alusta kirjasta `referenssi/optiot.json`:iin: Hammer s.374,
Gorbag's Revenge s.377, Terror ship s.380, Kill kroozer s.382, Ork Hulk
s.389 — kaikki speed 20 cm, strength **D6+2** (myös Hulk, vaikka sen omat
putket ovat 2D6). Kaari on putkien: keula → `Front`, Hulkilla
`Left/front/right`.

Golden: kuusi tapausta `GAP → OK`, mukaan lukien
`hammer-boarding-torpedoes-removed`, joka todistaa että rivi katoaa sekä
hinnasta että aseistuksesta kun valinta puretaan. Ajuri nappasi matkalla
kaksi omaa virhettäni: arvatun perushinnan Gorbag'sille (345, kirja 310)
ja tämän paketin väitteen Hulkin `D6+6`:sta.

`test_upgrades.js`: yleinen invariantti tuntee nyt `add`-vaikutuksen ja
ottaa riippuvuuden (`dep`) ennen mittausta; rivin ruudun tila kuuluu
näkyvään profiiliin.

Vaikutusjono 38 → 33.

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/RULES_TRUTH.md`.

Tämä tehtävä käsittelee **yhtä vaikutusperhettä**: optiot, jotka lisäävät
alukselle kokonaan uuden aserivin. Ei statseja (`P1-2`), ei aserivin
korvaamista toisella (`P1-4`).

## Ero muihin ase-vaikutuksiin

Datassa on jo kolme ase-mekanismia, ja ne kattavat 91 optiota:

| kenttä | mitä | esimerkki |
|---|---|---|
| `aws` (66) | valinta ryhmästä, `grp` + `gmax` | Hive Ship: "Choose one prow weapon" |
| `sw` (21) | vaihtoehtoinen rivi samalle paikalle | Strike Cruiser: launch bays ↔ torpedot |
| `swp` (4) | rivin kentän muutos | Dominator: kantama 45 cm, tulivoima 6 |

**Puuttuva mekanismi on neljäs: rivin LISÄÄMINEN.** Alus saa aseen, jota
sillä ei ennen ollut, eikä mikään korvaudu.

## Rajaus: rynnäkkötorpedot

Kirjan sanamuoto toistuu viidellä orkkialuksella:

```
s.374  Hammer class battlekroozer  "May be equipped with boarding
       torpedoes for +5 pts (speed 20 cm; strength D6+2)."
s.377  Gorbag's Revenge            "+5 pts (speed 20 cm; strength D6+2)"
s.380  Terror ship                 "If fitted with a torpedo launcha, it
                                    may carry boarding torpedoes"
s.382  Kill kroozer                sama
s.389  Ork Hulk                    "+15 pts (speed 20 cm; strength D6+6)"
```

Golden-tapaus `hammer-boarding-torpedoes` on valmiina ja punainen:
hinta 250 menee jo läpi, aserivi puuttuu.

Huomaa: Hammerin optiolla on datassa riippuvuus keulatorpedoihin
(`dep`). Tapaus valitsee edellytyksen ensin, joten se **ei ota kantaa
siihen onko riippuvuus itsessään oikein**. Jos epäilet sitä, se on oma
tehtävänsä ja vaatii oman kirjan sivunsa.

## Tehtävä

1. **Kuittaa viisi alusta kirjasta** `referenssi/optiot.json`:iin. Tarkista
   voimakkuus sivulta: kaikilla viidellä se on `D6+2` — myös Hulkilla,
   vaikka sen omat putket ovat `2D6`. (Tämän paketin ensimmäinen versio
   väitti Hulkille `D6+6` lukematta sivua; se oli väärin.) Tarkista myös
   kaari — keulaputket ovat `Front`, Hulkilla putkia on keula, vasen ja
   oikea.

2. **Lisää `OPT_EFFECTS`-tauluun uusi vaikutustyyppi `add`**, joka lisää
   aserivin:

   ```python
   (374, "boarding torpedoes"): dict(
       add=dict(a=["Boarding torpedoes", "20 cm", "D6+2", "Front"])),
   ```

   `build_data.py` liittää rivin aluksen `aw`-taulukkoon vasta kun optio on
   valittuna — eli mekanismi on ajonaikainen kuten `sw`, ei staattinen.
   Katso miten `sw` on toteutettu `armModel()`-funktiossa
   (`app_template.html`) ja tee lisäys samaan malliin.

3. **Kirjoita golden-tapaus jokaiselle viidelle**, ei vain Hammerille.
   Ilman valintaa aluksella ei saa olla riviä; valinnan kanssa on.

4. **Lisää tapaus, joka todistaa ettei rivi jää päälle**: valitse optio,
   poista valinta, ja vaadi että aserivi katoaa. Tämä on se kohta, jossa
   lisäävät vaikutukset tyypillisesti vuotavat.

## Valmis kun

```
node test_golden.js      hammer-boarding-torpedoes ja neljä uutta OK
python audit_effects.py  jono pienenee viidellä
python acceptance.py     ei uusia HYLATTY-rivejä
node print_check.js      462 korttia, 0 löydöstä
```

`print_check.js` on tässä tärkeä: uusi aserivi voi rikkoa kortin
sovituksen. Jos se kaatuu, ongelma on korttien tilassa, ei tässä
vaikutuksessa — mutta se on silti korjattava ennen kuin tehtävä on valmis.

## Älä tee tässä tehtävässä

- Älä muuta `aws`-, `sw`- tai `swp`-mekanismeja. Ne toimivat.
- Älä ota kantaa riippuvuuksiin (`dep`).
- Älä lisää statsivaikutuksia samaan muutokseen.
