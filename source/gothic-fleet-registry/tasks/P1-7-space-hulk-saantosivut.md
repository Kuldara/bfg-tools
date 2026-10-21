# P1-7 · Space Hulk: sääntösivut 287–288 ja 390–391 kortille

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen · **Vaikutusluokka:** aluksen sääntösivut profiilisivun jälkeen

## Tehty

- `CHAOS_HULK_CRIT` (s.288, "−1 prow and dorsal lance") `ORK_HULK_CRIT`in
  rinnalle; `criticalModel`, `repairLine`, `criticalTriggerHint` ja
  `crippledLine` molemmille hulkeille, sivuviite hulkin mukaan (288/391),
  catastrophic-korvaukset (asteroidikenttä D3×5 cm / warp rift) tekstiin.
- `SPECIAL_HULL_RULES`: seitsemän hulk-sääntöä kirjan sivuilta — liike,
  painovoimakenttä, päivitysrajoitus (molemmat); −1 Ld + 2× attack craft +
  listakäyttö (Chaos); Ld 6 + AAF/ram + Warlord-poikkeukset (Ork).
- **Chosen Terminators** ei enää tarjolla hulkille: `upgrades.py`
  `cond=dict(ty="battleship|grand cruiser")` — lause itse rajaa.
- Ulkoasu: `.k-st`-ruudut joustavat (`flex:0 1 7mm`, Leadership
  `max-width:20mm`). Mitattu selaimessa `fitCards()`in jälkeen: **mikään
  statsisolu ei vuoda** (TURNS "Special" + ruutu 13,6 px marginaalilla),
  kortin ulkopuolelle ei ylitä mikään.
- Pyydetty lisäys: toistettavan option (`qty`) muuttama aserivi saa FP:n
  viereen tyhjän ruudun (`i.wi`), johon pelaaja kirjoittaa lennosta
  vaihdetun arvon. Warsphere: ruutu on solunsa sisällä.

Golden 32 → 34: `chaos-space-hulk-card` (taulukko, ei 2D6, korjauskielto,
liike, −1 Ld, 2× attack craft, lippulaiva, catastrophic, s.288, Terminators
ei tarjolla) ja `ork-hulk-rules` (Ld 6, Warlord, s.391). Ajuri sai
`upgrade_offered` / `upgrade_not_offered` -odotuksen — ilman sitä
Terminators-väite olisi mennyt läpi tarkistamatta. `print_check` vartioi
molempia hulkkeja.

**Mittari prioriteetti 4:lle:** Chaos-hulkin kortin pienin efektiivinen
fontti `fitCards()`in jälkeen on **3,1 pt** (skaalat 0,78–0,92). Sääntöjä
on nyt enemmän kuin ennen ja tila on tiukka. Luettavuusraja on oma
tehtävänsä.

Sivulöydös: `unitMaxPts()` antaa hulkille 650, vaikka CSM crew +35 on
tarjolla — se ei laske listapäivityksiä. Kortin "max N" -teksti on siis
alakanttiin. Kirjattu, ei korjattu tässä.

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/DOMAIN_CONTRACT.md`.

## Löydös (ChatGPT tulosti ja tarkisti Chaos Space Hulkin kortin)

> "Ei vielä pelikäyttöön. Perusprofiili on oikein, mutta korttiin on
> yhdistetty Space Hulkin aseistus ja tavallisen aluksen vahinkosäännöt.
> Lisäksi lähes kaikki Hulkin varsinaiset erikoissäännöt puuttuvat."

Tarkistin: kortin `specialLines` on **tyhjä**. Profiilisivu 286 sisältää
vain statsit, aseet ja loren — säännöt ovat sivuilla **287–288**, ja
`extract.py` lukee vain profiilisivun OPTIONS/SPECIAL/NOTES-lohkot.
Sama koskee Ork Hulkia (389 → 390–391).

**Oma virheeni P1-5:ssä:** rajasin critical-taulukon vain Ork Hulkille,
koska "s.286 ei sano criticaleista mitään". Luin väärän sivun. Chaos Space
Hulkin oma taulukko on **s.288** — lähes sama kuin Orkin, yksi solu eroaa
("−1 prow and dorsal lance" vs "−1 dorsal lance").

## Kirja

| sääntö | Chaos s.287–288 | Ork s.390–391 |
|---|---|---|
| Liike | 10 cm suoraan, ei enempää eikä vähempää; blast markerit ja vauriot eivät hidasta | sama |
| Kääntyminen | ≤45° joka toisessa Movement-vaiheessa, liikkeen lopussa | sama |
| Painovoimakenttä | oma 5 cm jalustan reunasta; planeetan kentässä lisäkäännös | sama |
| Leadership | **−1 Ld kaikkien muiden muutosten jälkeen** | **aina Ld 6** |
| Special orders | ei CTNH, ei Burn Retros | sama + AAF sallittu ilman lisäliikettä; ram vs. puolustus 2D6, muu 3D6 |
| Attack craft | **jopa 2× jäljellä olevat launch bayt** | — |
| Warlord | — | ei tuplaa boarding-arvoa; Looted Torps/Maniac Gunners yksi järjestelmä/vuoro; Extra Powerfields +50; Mad Meks ohittaa critin 6:lla |
| Päivitykset | ei mitään, joka parantaa Boarding Valuea, kääntymistä tai nopeutta | sama |
| Critical | oma D6-taulukko, ei korjausta | oma D6-taulukko, ei korjausta |
| Crippled | ei crippleydy | sama |
| Catastrophic | Plasma Drive Overload → asteroidikenttä D3×5 cm, ei vahinkoa; Warp Drive Implosion → warp rift | sama |
| Käyttö listassa | 0–1, **pakollinen lippulaiva**, ei Chaos Markeja, ei Planet Killerin / Activated Blackstonen / Terminus Estin kanssa; ≤2 muuta battleshipiä; lasketaan battleshipiksi toisen ottamisessa | 1 per 1 500 pts; Warlord komentaa |

## Tehtävä

1. `CHAOS_HULK_CRIT` rinnalle `ORK_HULK_CRIT`ille; `criticalModel` valitsee
   nimen mukaan. `repairLine` ja `criticalTriggerHint` molemmille.
2. `crippledLine`: sivuviite hulkin mukaan (288 / 391) ja catastrophic-
   korvaukset tekstiin.
3. `SPECIAL_HULL_RULES`: molempien hulkien säännöt kirjan sivuilta,
   kortille tiiviisti. Listakäytön rajoitukset (`USING`) samaan — ne ovat
   "näytetty pelaajalle" -tilassa kunnes listamoottori valvoo ne
   (prioriteetti 3).
4. **Chosen Terminators** ei kuulu hulkille: lause sanoo "battleships and
   grand cruisers", hulk on Defence, ja s.288 kieltää boarding-arvoa
   parantavat päivitykset. `upgrades.py`: `cond=dict(ty=…)`.
5. Golden: `chaos-space-hulk-card` (oma taulukko, ei 2D6, korjauskielto,
   liike- ja Ld-säännöt, catastrophic, s.288-viite, Terminators ei
   tarjolla) ja `ork-hulk-rules` (Ld 6, Warlord-poikkeukset).
6. `print_check.js`: hulk-invariantti molemmille.
7. Ulkoasu (ChatGPT): Leadership-kenttä leikkautuu, Turns-ruutu peittää
   "Special"-tekstin. `.k-st`-laatikot joustaviksi.

## Opetus kittiin

Aluksen säännöt voivat jatkua profiilisivun **jälkeisillä sivuilla**,
joilla ei ole TYPE/HITS-otsikkoa. `extract.py` ei näe niitä. Kunnes
poimija osaa sen, sääntösivut kirjataan `SPECIAL_HULL_RULES`iin käsin,
sivunumeroineen — ja `AGENTS.md`:hen sääntö: *lue profiilisivun jälkeiset
sivut aina, kunnes seuraava profiili alkaa.*
