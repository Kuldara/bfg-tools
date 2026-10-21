# P1-6 · Hive Ship: toistuvat asesetit

**Tila:** valmis 8.9.2026 · **Koko:** pieni · **Vaikutusluokka:** puuttuva domain-käsite (`repeatableWeaponSet`)

## Tehty

`armModel()`: kun useampi valittu optio omistaa saman rivin
(`aws`), rivi saa `count` = valittujen määrä ja tulivoima on **summa**
(`timesStrength`): `1 / 1 squadron` ×3 → `3 / 3 squadrons`, `4` ×3 →
`12`. Teksti, joka ei ole summattavissa (`Special`, `D6+2`), saa
merkinnän `×n`. Ratkaisin kantaa `count`in, kortti ja rosteri lukevat
saman rivin — paketin suositus "instanssit ratkaisimeen, summa kortille"
yhdessä rivissä.

Golden: `hive-ship-three-side-bays`, `hive-ship-two-side-pyro`,
`hive-ship-three-side-bio` → OK. Datakysely (paketin kohta 4) löysi kaksi
muuta samaan riviin osoittavaa ryhmää, ja **mekanismi kattoi molemmat
ilman lisäkoodia** — kirjasta luetut tapaukset todistavat sen:

- **Tyranid Cruiser s.434**: "Choose up to two port/starboard weapon
  sets", 80 + 2×15 = 110, Port Pyro-acid 2×4 = 8 → `tyranid-cruiser-two-side-pyro`
- **Torture s.352**: "up to 2 Impaler assault modules" à +20 → 250,
  `Special ×2` → `torture-two-impalers`

Golden 28 → 32, aukkoja 0.

Kirjan oma epäjohdonmukaisuus kirjattu tapaukseen: Hive Shipin
optioteksti sanoo "Bio-plasma discharge", aseistustaulukko "Bio-plasma
spines". Rivin nimi tulee taulukosta.

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/DOMAIN_CONTRACT.md`.

Tämä ei ole datapäivitys vaan puuttuva käsite: **sama asesetti voidaan
ostaa useaan kertaan, ja jokainen ostos on oma ase-instanssinsa.**
Nykyinen malli tuntee vain "onko rivi valittu vai ei".

## Mitä kirja sanoo — Fleets s. 432

> Choose up to three port/starboard weapon sets for the point cost listed
> below **(each set gives both a port and a starboard weapon)**:

| set | hinta |
|---|---|
| Pyro-acid battery (port 30 cm/4/Left + starboard 30 cm/4/Right) | +15 |
| Bio-plasma discharge (port 15 cm/2 + starboard 15 cm/2) | +20 |
| Launch bays (1 / 1 squadron) | +20 |

Kolme launch bay -settiä = kolme porttia ja kolme styyrpuuria, eli
**3 / 3 squadrons** yhteensä. Sama pyro-acidille: 3 × 4 = 12 tulivoimaa
per puoli.

## Mitä datassa on nyt

Optiot on mallinnettu oikein ryhminä `hive_side_1`, `hive_side_2`,
`hive_side_3`, kukin `gmax=1`, ja hinta on oikein (200 + 3×20 = 260).
Mutta **kaikki kolme settiä osoittavat samaan yhteen aserivin** "Port /
Starboard Launch bays | 1 / 1 squadron" `aws`-mekanismilla. Kortille
tulee yksi rivi tikattuna, vaikka pelaaja maksoi kolmesta.

Golden-tapaus `hive-ship-three-side-bays` on valmiina ja punainen:
odotus on kolme voimassa olevaa instanssia.

## Kaksi hyväksyttävää toteutusta

**A. Instanssit erikseen** — jokainen valittu setti tuottaa oman rivinsä.
Kortilla kolme riviä "Port / Starboard Launch bays 1 / 1 squadron".
Kirjan mukainen, mutta vie kolme riviä.

**B. Instanssit summattuna** — sama rivi, tulivoima kerrottuna:
"Port / Starboard Launch bays 3 / 3 squadrons". Pelipöydällä selkeämpi.

Valitse toinen ja **kirjaa valinta `docs/DOMAIN_CONTRACT.md`:hen**.
Jos valitset B:n, päivitä golden-tapaus muotoon
`weapon: {match: "Port / Starboard Launch bays", fp: "3 / 3 squadrons"}`
— se on tapauksen `why`-kentässä jo mainittu hyväksyttäväksi.

Suositus: **B kortille, A ratkaisimeen.** `ResolvedUnit.weapons` sisältää
instanssit (A), ja kortti summaa samannimiset (B). Silloin ratkaisin on
kirjan mukainen ja kortti luettava, eikä kumpikaan valehtele.

## Tehtävä

1. **`ResolvedUnit.weapons`** saa kentän `count` (instanssien määrä) —
   `docs/DOMAIN_CONTRACT.md`.

2. **`armModel()`**: kun useampi valittu optio osoittaa samaan riviin
   `aws`-mekanismilla, tuota instanssi per valinta (tai `count`).

3. **Kortti**: summaa samannimiset instanssit tulivoimaan
   (`1 / 1 squadron` × 3 → `3 / 3 squadrons`; `4` × 3 → `12`).
   Tulivoiman muoto `a / b` on port/starboard-pari — summaa molemmat.

4. **Tarkista sama Hive Shipin pyro-acid- ja bio-plasma-seteille**, ja
   katso onko datassa muita `gmax=1`-ryhmiä, jotka osoittavat samaan
   riviin — `python -c` -kysely riittää. Jos on, ne kuuluvat samaan
   käsitteeseen.

5. **Golden-tapaukset** pyro-acid ×2 ja bio-plasma ×3 lisäksi, hinnat
   kirjasta: 200 + 2×15 = 230 ja 200 + 3×20 = 260.

## Valmis kun

```
node test_golden.js      hive-ship-three-side-bays + uudet OK / OK / OK
node print_check.js      462 korttia, 0 löydöstä
python acceptance.py     ei uusia HYLATTY-rivejä
```

`print_check.js` on tässä kriittinen: Hive Ship on jo nyt datan
täysin optioin varustettu alus (16 optiota), ja kortin sovitus on sen
kohdalla tiukimmillaan. Jos lisärivit rikkovat sovituksen, se on
ratkaistava tässä — ei kutistamalla.

## Älä tee tässä tehtävässä

- Älä muuta `grp`/`gmax`-mekanismia — se toimii.
- Älä muuta hintoja — ne ovat oikein.
- Älä lisää luettavuusrajaa `fitCards`iin — se on prioriteetti 4.
