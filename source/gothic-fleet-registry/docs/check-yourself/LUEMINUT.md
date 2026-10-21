# Check yourself -lauseiden käsiluokittelu

Käyttäjän pyyntö 19.–20.10.2026: jokainen builderin "Check yourself" -lause
käydään läpi käsin, kirjan sivu tarkistetaan, ja lause luokitellaan sen mukaan,
mitä sille pitäisi tehdä (poistaa, siirtää muualle, toteuttaa ominaisuutena).
Luokitus oli ensin päätösaineisto; suunnitelma on sittemmin toteutettu
(ks. Tila alla).

## Tiedostot

| tiedosto | mitä | miten tehty |
|---|---|---|
| `lauseet.json` | 1 170 uniikkia lausetta (2 497 esiintymää 32 listalla): teksti, esiintymät (lista, osio), kirjan sivuehdokkaat, koodiviitteet, säännön src-osumat | koneellinen poiminta `bfg_data.json`:sta 20.10. (sec.text, jota saman osion sec.rules[].src ei kata — sama ehto kuin `app_template.html:2684`) |
| `luokitus_NN.jsonl` | käsiluokitus, yksi rivi per lause, erissä 60 lausetta | luettu käsin; sivu tarkistettu kirjan tekstidumpista |
| `YHTEENVETO.md` | **aloita tästä**: tulokset, löydetyt virheet, ominaisuusjono, avoimet tulkinnat | kirjoitettu käsin luokitusten ja varmistusajon pohjalta |
| `SUUNNITELMA.md` | toteutussuunnitelma: mihin kukin lause menee, Fleet rules -paneeli, uudet tarkistukset, Clanz-apu, vaiheet | kirjoitettu 20.10. käyttäjän linjauksesta |
| `LIITE_luokat.md` | jokainen lause luokittain ja perheittäin (id, sivu, listat, perustelu) | generoitu luokituksista; älä muokkaa käsin |
| `luokitus_kaikki.json` | lause + esiintymät + luokitus yhdessä; kelpaa buildin syötteeksi | generoitu |
| `varmistus/` | `harness.js` + `probe1–8.js`: koodiväitteiden varmistus ajamalla sovelluksen moottoria (sama lataus kuin `test_golden.js`) | `node varmistus/probeN.js`; ei muuta mitään |

Generointiskriptit (poiminta, näkymät, kokoaminen, liite) ajettiin istunnon
scratchpadista. Uusintaa varten logiikka on lyhyt: lauseet ovat
`sec.text`-rivejä, joita saman osion `sec.rules[].src` ei kata, ja sivu
haetaan kolmella 7 sanan näytteellä.

Sivuehdokkaat on haettu dumpeista `simulaattorit yms/simulaattori/saannot_txt/`
(`fleets.txt` = F, `rulebook.txt` = R; painettu sivu = PDF-sivu). Muoto
`F142(3/3)` tarkoittaa, että lauseen kolmesta 7 sanan näytteestä kaikki
löytyivät sivulta 142. Osittainen osuma on katsottu käsin.

## Luokat (`l`)

| luokka | merkitys | toimenpide (`a`) |
|---|---|---|
| `VALVOTTU` | laivaston laillisuussääntö, jonka moottori jo valvoo, mutta lause näkyy silti "Check yourself" -ryhmässä (eri osio, eri sanamuoto, rivin ehto, ryhmä, ENTRY_LIMITS) | `checked`: siirto "Checked by the builder" -ryhmään |
| `RAKENNE` | sääntö, jota sovelluksen rakenne ei anna rikkoa (esim. yksi rivi = yksi laivue) | `guaranteed`: oma "Guaranteed by the builder" -ryhmä |
| `OMINAISUUS` | laillisuussääntö, jonka voisi valvoa; `f` kertoo, mikä puuttuva käsite estää | `feature` |
| `LASKETTAVA` | ei laillisuutta, mutta sovellus voisi laskea tai näyttää arvon (attack rating, VP-arvo) | `roster` |
| `TARKISTA` | aito pelaajan tarkistettava laillisuus, jota ei kannata valvoa (pöytä, malli, sopimus) | `keep`: jää Check yourself -ryhmään |
| `PELI` | pelin aikainen sääntö | `play`: "In play" -ryhmä / kortti / Play-sivu |
| `KAMPANJA` | kampanja- tai skenaariosääntö | `campaign`: taitettu ryhmä |
| `KUVAUS` | listarivin tai päivityksen kuvaus (mitä se tekee, mitä se maksaa) | `row`: rivin selitteeksi, ei sääntölauseeksi |
| `TAUSTA` | kerronta, johdanto, selittävä virke ilman sääntöä | `drop` |
| `ROSKA` | poimintavirhe: katkelma, taulukkoroskaa, tupla, väärä osio | `fix` |
| `TULKINTA` | kirjan ristiriita tai monitulkintaisuus | `ask`: käyttäjälle / BACKLOG |

Muut kentät: `p` = varmistettu sivu, `pok` = `ok` / `osittain` (löytyikö
lause sivulta sellaisenaan), `f` = perhe tai aihe, `n` = perustelu,
`x` = poimintavika (`heading`, `table`, `split`, `wronglist`, `dup`) ja
`vk` = koodiväitteen varmistus (`ajo ok`, `osittain`, `aukko ajossa`,
`VIRHE ajossa`, `koodi luettu`).

## Tila 20.10.2026: toteutettu

Luokittelu (alla) tehtiin ensin päätösaineistoksi, ja käyttäjä pyysi sitten
toteuttamaan koko suunnitelman (*”joo, toteuta kaikki”*). Vaiheet ovat
BACKLOGissa:

| vaihe | BACKLOG | mitä |
|---|---|---|
| 1 | J212 | Fleet rules -lohko, lauseiden ryhmät `sec.cls`, laskuri vain Not checked |
| 2 | J213 | nopeat tarkistukset ja kolme vikaa (T50, T51) |
| 3 | J214 | laivaston tiedot: attack rating, vastustajan edut, Demiurgien VP (T53) |
| 4 | J215 | komentajan sijoitus aluksille (`uid`, `aboard`) |
| 5 | J216 | laivueet (`sq`) ja Clanzin Warlord-komento (`cmd`, T52) |
| 6 | J217–J221 | reitit: Bakkan AdMech, Demiurg-palkkasoturit (T54), Void Stalker, RT-rungot (T55), inkvisiittorin risteilijä (T56), RT-saattajat, Explorationin apualukset, Blood Axe, Wardenit, liittolaisen erikoishahmo |

**Not checked -ryhmä on tyhjä** (0 lausetta; ennen J213:a 125). Ryhmät:
checked 722, play 759, campaign 642, drop 249, row 206, info 31, models 3
esiintymää.

**Ylläpito:** totuus on nyt `referenssi/check_yourself.json`. Kun tarkistus
toteutetaan, lause siirretään ryhmästä toiseen skriptillä
`python docs/check-yourself/aseta_ryhma.py <ryhmä> S0106 … [--list "<lista>"]`.
`tee_referenssi.py` teki tiedoston kerran luokituksista eikä sitä ajeta
uudelleen (se kumoaisi myöhemmät siirrot). `check_reference.py` raportoi
luokittelemattoman lauseen.

## Luokittelun tila 20.10.2026 (ennen toteutusta)

Valmis: 1 170 / 1 170 lausetta luokiteltu, 110 koodiväitettä varmistettu
(81 ajossa ok, 16 aukkoa, 3 virhettä, 3 osittain, 7 vain koodista luettu).
Tulokset ja suositukset: `YHTEENVETO.md`. Seuraava askel on käyttäjän päätös
siitä, mitkä ominaisuudet toteutetaan. Sovellukseen ei ole koskettu.
