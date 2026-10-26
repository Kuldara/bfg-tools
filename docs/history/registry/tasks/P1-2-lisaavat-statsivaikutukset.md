# P1-2 · Lisäävät statsivaikutukset

**Tila:** valmis 8.9.2026 · **Koko:** keskikokoinen · **Vaikutusluokka:** `mod`

## Tehty

Neljä kirjasta kuitattua riviä `referenssi/optiot.json`:iin (sivut 61,
66, 105, 269) ja neljä avainta `build_data.py`:n `OPT_EFFECTS`-tauluun,
kaikki `mod`-lisäyksinä (+1 torni / +1 kilpi), ei asetuksina.

Golden: `mars-third-turret`, `overlord-turret-array`,
`strike-cruiser-extra-shield`, `repulsive-third-shield` — kaikki
`GAP → OK` kolmessa sarakkeessa (hinta, profiili, pinnat). Ajuri
ilmoitti itse "AUKI-merkitty meni läpi: 4", ja statukset päivitettiin.

Vaikutusjono 42 → 38. Rajapintaa ei tarvinnut muuttaa: `mod` kulkee
`statMod` → `effTurrets`/`effShieldsText` → `R.stats`, ja kaikki viisi
pintaa lukevat sen. Tämä oli P1-1:n tarkoitus: yksi toteutus, ei viisi.

Sivutuote: `audit_effects.py` raportoi nyt myös kuittaukset, joiden
optio on jo toteutettu (kirjan lukemisen tallenne), ja varoittaa
kuittauksesta, joka ei osu yhteenkään optioon (kirjoitusvirhe).

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/RULES_TRUTH.md`, `docs/DOMAIN_CONTRACT.md`.

Tämä tehtävä käsittelee **yhtä vaikutusperhettä**: optiot, jotka lisäävät
tai asettavat yhden statsiluvun (tornit, kilvet). Älä laajenna sitä
aseoptioihin — ne ovat `P1-3`.

## Rajaus

Neljä alusta, jotka golden-ajuri jo osoittaa aukoiksi:

| alus | sivu | perus | optio | hinta | odotus |
|---|---|---|---|---|---|
| Mars class battlecruiser | 61 | 270, tornit 2 | kolmas torni | +10 | **280 pts, tornit 3** |
| Overlord class battlecruiser | 66 | 220, tornit 2 | turret array 2→3 | +10 | **230 pts, tornit 3** |
| Strike Cruiser | 105 | 145, kilvet 1 | lisäkilpi | +15 | **160 pts, kilvet 2** |
| Repulsive class grand cruiser | 269 | 230, kilvet 2 | kolmas kilpi | +15 | **245 pts, kilvet 3** |

Kirjan sanamuodot:

```
s.61   "May purchase a third turret for an additional +10 points."
s.66   "Can have its turret array upgraded from 2 to 3 at an additional
        cost of +10 pts"
s.105  "May take an additional shield for +15 points."
s.269  "May have a third shield for +15 pts, when modelled on a large
        60 mm base."
```

Golden-tapaukset ovat valmiina: `mars-third-turret`,
`overlord-turret-array`, `strike-cruiser-extra-shield`,
`repulsive-third-shield`. Ne ovat punaisia nyt.

## Tehtävä

1. **Kuittaa kirjasta.** Lisää jokaiselle rivi `referenssi/optiot.json`:iin
   sivunumeroineen ja perusteluineen (muoto: `docs/RULES_TRUTH.md` §3).
   Ilman sivunumeroa kuittaus ei kelpaa.

2. **Toteuta `build_data.py`:n `OPT_EFFECTS`-tauluun.** Se on ainoa paikka,
   jossa vaikutus saa syntyä. Malli on jo olemassa:

   ```python
   OPT_EFFECTS = {
       (374, "upgrade its turrets from two to three"): dict(mod=dict(tu=1)),
       (494, "add +1 shield"):                          dict(mod=dict(sh=1)),
   }
   ```

   Huomaa: `mod` on **lisäys**, ei asetus. Mars saa `tu=1` (2 → 3), ei
   `tu=3`. Jos kirja sanoo "upgraded from 2 to 3" ja perusarvo on 2,
   lisäys +1 antaa saman tuloksen ja kestää paremmin datan muutoksen.

3. **Aja hyväksyntä.** Neljän tapauksen on muututtava `GAP` → `OK`
   kaikissa kolmessa sarakkeessa.

4. **Poista `status: "gap"` ja `task`** noista neljästä tapauksesta
   `golden_cases.json`:issa. Ajuri huomauttaa siitä itsekin
   (`AUKI-merkitty meni lapi`).

## Valmis kun

```
node test_golden.js      neljä tapausta OK / OK / OK
python audit_effects.py  jono 42 -> 38
python acceptance.py     ei uusia HYLATTY-rivejä
```

## Älä tee tässä tehtävässä

- Älä koske aseita muuttaviin optioihin (`swp`, `sw`, `aws`) — `P1-3`.
- Älä lisää muita kuin neljä nimettyä alusta, vaikka jonossa on 42 riviä.
  Rajaus on tehtävän arvo: sekalainen korjaus on katselmoimaton.
- Älä muuta perusstatseja. Jos perusarvo näyttää väärältä, se on
  `check_profiles.py`:n asia ja oma tehtävänsä.

## Seuraava samasta perheestä

Kun nämä neljä ovat vihreitä, jonossa on samaa luokkaa lisää — aja
`python audit_effects.py -v` ja ota seuraava neljän ryhmä. Uusi tehtävä,
ei tämän laajennus.
