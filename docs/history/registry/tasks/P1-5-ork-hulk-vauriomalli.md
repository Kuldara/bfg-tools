# P1-5 · Ork Hulk: oma vauriomalli

**Tila:** valmis 8.9.2026 · **Koko:** pieni · **Vaikutusluokka:** puuttuva domain-käsite (`customCriticalTable`)

## Tehty

`ORK_HULK_CRIT`: seitsemän riviä (alatulokset omina laskureinaan, koska
jokainen −1 on oma laskurinsa pöydällä), otsake "ORK HULK CRITICAL HITS
(D6)", vihje "attacker rolls D6", `repairLine` → "NO REPAIR … (Fleets
p. 391)". `resolveUnit().damage.critTable` kantaa taulukon nimen; kortti
lukee sen eikä päättele faktiosta.

Golden `ork-hulk-critical-table` GAP → OK. `print_check.js` vartioi
(taulukko on, 2D6 ei ole, korjauskielto on) ja vartija on
negatiivitestattu: haaran poisto antoi 4 löydöstä oikeilla viesteillä.

`print_check`in osiotarkistus luki critical-otsikon vakiosta; muiden
faktioiden otsikot sattuivat sisältämään sen osajonona. Nyt se lukee
`criticalModel(sh).title` — sopimuksen mukainen tarkistus, ei sattuma.

## Avoin kysymys: Chaos Space Hulk s.286

Ork-taulukko on otsikoitu "ORK HULK" ja on orkkihulkin sivuilla. Chaos
Space Hulkin sivu s.286 ei sano criticaleista mitään, eikä Rulebook v1.10
tunne hulkin critical-sääntöä (0 osumaa). Crippled-sääntö ulotettiin
aiemmin molempiin, koska sen lause sanoo "Space hulks" yleisesti — tämä
taulukko ei sano. **Chaos-hulk jää yleiselle 2D6-taulukolle.** Jos
kirjan tekijät tarkoittivat molempia, se on yhden rivin muutos
(`isOrkHulk` → `isSpaceHulk`) — mutta se tehdään lähteen, ei arvauksen
perusteella.

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/DOMAIN_CONTRACT.md`.

Tämä ei ole datapäivitys vaan puuttuva käsite: alus, jolla on **oma
critical-taulukko** eikä yleinen 2D6-taulukko. Korttigeneraattori tuntee
nyt viisi taulukkoa (yleinen, Tyranid, Necron, Eldar, Dark Eldar) ja
valitsee ne faktion mukaan. Ork Hulk on orkkien alus, joten se saa
yleisen taulukon — ja se on väärin.

## Mitä kirja sanoo — Fleets s. 391

> **ORK HULK CRITICAL HITS TABLE**
> Due to their massive size and lack of complex systems, do not roll for
> the effects of critical hits on a space hulk using the Critical Damage
> table. Instead the player who inflicted the critical should roll to see
> what happens:

| D6 | tulos |
|---|---|
| 1–2 | **Target high energy systems!** Roll a D6: 1–2 −1 dorsal lance · 3–4 −1 shield · 5–6 −1 turret strength |
| 3–4 | **Target weapons clusters!** Roll a D6, affecting only the firing arc where the hulk was hit: 1–2 −1 launch bay (except prow/aft) · 3–4 −1 torpedo strength (except aft) · 5–6 −2 weapons battery firepower |
| 5–6 | **Target thruster assemblies!** The hulk must roll higher than the number of thruster damage criticals it has suffered on a D6 in order to turn. |

> Damage rolled that does not apply for any reason immediately assumes the
> next higher level damage on the table. **Space Hulks cannot repair any
> critical damage in the course of a battle.**

Kortilla on nyt jo oikein: *ei crippleydy* (`crippledLine`, s. 391) ja
40 HP:n yhtenäinen kaista. Puuttuu: critical-taulukko ja korjauskielto.

## Golden-tapaus on valmiina ja punainen

`ork-hulk-critical-table` (s. 391): kortilla on oltava `ORK HULK CRITICAL`
ja `cannot repair`, eikä siinä saa olla `CRITICAL DAMAGE (2D6)`.

Tarkista myös **Chaos Space Hulk s. 286** — jos sen sivulla on sama
taulukko, sama käsite kattaa molemmat; jos ei, kirjaa ero. Älä oleta.

## Tehtävä

1. **Lisää `criticalModel()`-funktioon** (`app_template.html`, n. rivi 832)
   haara, joka tunnistaa space hulkin — käytä olemassa olevaa
   `isSpaceHulk(sh)`-apuria, älä uutta regexiä — ja palauttaa D6-taulukon
   yllä olevalla sisällöllä. Otsikko: `ORK HULK CRITICAL HITS (D6)`.

2. **`repairLine()`**: hulkille `NO REPAIR: a space hulk cannot repair
   critical damage (Fleets p. 391).`

3. **`docs/DOMAIN_CONTRACT.md`**: `ResolvedUnit.damage` saa kentän
   `critTable: "standard" | "tyranid" | ... | "ork-hulk"`. Kortti lukee
   sen, ei päättele faktiosta itse.

4. **`print_check.js`**: lisää invariantti — hulkin kortilla on hulk-
   taulukko eikä 2D6-taulukkoa. Negatiivitestaa vartija: poista haara
   hetkeksi, näe punainen, palauta.

## Valmis kun

```
node test_golden.js      ork-hulk-critical-table OK / OK / OK
node print_check.js      462 korttia, 0 löydöstä, uusi vartija mukana
python acceptance.py     ei uusia HYLATTY-rivejä
```

## Älä tee tässä tehtävässä

- Älä muuta muiden faktioiden taulukoita.
- Älä koske Ork Hulkin optioihin (rynnäkkötorpedot ovat `P1-3`).
- Älä ratkaise Chaos Space Hulkia arvaamalla — lue s. 286.
