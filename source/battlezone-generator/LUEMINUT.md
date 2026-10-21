# Battlezone Generator – celestial phenomena -maaston arpoja

Englanninkielinen selainsovellus, joka arpoo BFG Remastered Rulebook v1.10:n (s. 104–116) celestial
phenomena -maaston siemenestä ja piirtää sen pöydälle. Julkaistu: https://terrain-generator.kuldare.com
(Cloudflare Worker `terrain-generator`, `julkaisu/kokoa.py` tunnus `terrain`). Tehty 24.–25.9.2026, ja tausta on
muistiinpanossa `bfg-terrain-arpoja.md` (neljä simulaattorin `terrain.js`:n vikaa korjattu, renkaiden
ristiriita s. 108 vs s. 113 → `RING_ON = 5`).

## Tiedostot

| Tiedosto | Mitä |
|---|---|
| `index.html` | Koko sovellus: tyylit, sivu ja skripti. Sama tiedosto on lähde ja julkaisu, buildia ei ole. |
| `favicon.png`, `apple-touch-icon.png` | Kuvakkeet. |

Julkaisutiedostot ovat edelleen nämä kolme (`kokoa.py`:n lista ei muuttunut 21.10.).

## Arvontaydin (BZCORE, 21.10.2026)

Scenario Library käyttää samaa arvontaa skenaarioiden kartoilla (Generate terrain / Reroll, ks. sen
LUEMINUT "Maasto"). Jotta säännöt eivät erkaannu kahdeksi versioksi, ydin on yhdessä paikassa:
`index.html`:n skriptissä merkkien `/*BZCORE*/` ja `/*/BZCORE*/` välissä. Siihen kuuluvat nopat
(`makeRng`, `Dice`), battlezone-taulukot (`ZONES`, `PLANET_SUB`, `SUN_EDGE`, `PLANET_BAND`, `KIND`),
geometria (`extents`, `overlaps`, `onTable`), `generate()` ja sääntötekstit (`RULES`, `EVENT_RULES`). Ydin ei koske
sivuun (ei DOMia).

- **Muokkaa ydintä vain täällä.** Sitten aja Scenario Libraryssa `python tee_maastoydin.py`, joka kirjoittaa
  kopion `scenario library/battlezone-core.js` (sama teksti tavulleen, nimiavaruus `BZ`).
- **Vartijat:** `scenario library/testit/maastotesti.js` ja `kokoa.py` kaatuvat, jos kopio on vanha.
  Testi tarkistaa myös, että generaattorin omat kartat pysyvät samoina: 7 560 siementä × asetusta
  (battlezone, pöytä, aluekoko, kynnys) ryhmittäin SHA-1:nä `scenario library/testit/maasto_sormenjaljet.json`:ssa.
  Sormenjäljet otettiin ennen ytimen laajennusta, ja laajennuksen jälkeen ero oli 0 / 7 560.
- **Siirto 21.10.:** `RULES` ja `EVENT_RULES` siirrettiin piirtokoodin edeltä ytimen sisään. Sivun
  käytös ei muuttunut.

### `generate(seed, opts)`: skenaarioiden lisäasetukset

Generaattorin oma sivu antaa vain `zone`, `width`, `height`, `sector` ja `threshold`, eikä sen nopanheitto
muutu. Muut asetukset ovat valinnaisia, ja ne käyttää vain Scenario Library. Ilman niitä yhtään ylimääräistä
noppaa ei heitetä:

| Asetus | Mitä tekee |
|---|---|
| `zone: 'none'` / `{ die, rows: [[lo, hi, n]], text }` | ei battlezonea (skenaario luettelee palat) / skenaarion oma battlezone-heitto |
| `zoneText`, `sunText` | lokin selitys valitulle tai kiinteälle |
| `sun: 'left'…` / `'none'` / `{ rows, text }` | kiinteä aurinkoreuna / ei aurinkoreunaa (nauhojen suunta arvotaan) / oma heitto |
| `fixed: [{ shape: 'circle'|'box'|'annulus', … }]` | skenaarion omat piirteet; mitään ei arvota niiden päälle (KEEP_CLEAR 2 cm) |
| `planets` | planeettoja jo pöydällä → arvottu planeetta heitetään uudelleen (yksi planeetta, s. 108) |
| `hosts: [{ x, y, size, moons, rings, name, dia }]` | skenaarion planeetta "rings and moons as normal": halkaisija kaistalta, kuut ja renkaat kuten arvotulle; `size` voi olla heittotaulukko; siirtyy pöydälle, jos se ei mahdu (lokissa) |
| `pieces: [{ kind, count, area, set, apart, pick, moons, rings }]` | skenaarion luettelemat palat: määrä luku tai noppa (`'d3+2'`, `'2d3'`), alue, painettu koko, vähimmäisväli, alueen heitto |
| `areas: false`, `rolls`, `everyArea`, `table`, `cap` | ei 60 cm alueita / N heittoa koko pöydälle / ei 4+-porttia / skenaarion oma generaattoritaulukko / enintään N ilmiötä |
| `ignore`, `reroll` (+ `…Text`) | tulos ohitetaan (alue tyhjä) / heitetään uudelleen kuten toinen planeetta |
| `events: { flare, radiation }` | skenaarion valmiit solar flaret ja radiation burstit |

Jokainen uusi haara kirjaa lokiin, mitä tapahtui ja miksi (sama periaate kuin generaattorin
alkuperäisessä lokissa: heitetty noppa näkyy, hylätyt heitot raportoidaan).

## Testaus

- `node "scenario library/testit/maastotesti.js"`: ydin, generaattorin sormenjäljet ja kaikki skenaariot.
- Selaimessa: `preview_start terrain-generator` (portti 8791, juuren `.claude/launch.json`). 21.10.
  tarkistettu ytimen siirron jälkeen: sivu arpoo, piirtää, sääntöpaneeli ja Start of turn -kortti toimivat,
  konsolissa ei virheitä.

## Tietoiset rajaukset

Käyttäjä hylkäsi 25.9. nimeltä käsin muokkauksen, tulostusarkin, PNG-viennin ja permalinkin. Kieli on
englanti (jaetaan BFG-yhteisölle).
