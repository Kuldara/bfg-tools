# Katselmointi: `resolveUnit` v0

**Katselmoija:** Claude (Fable 5.1), 8.9.2026 ilta.
**Riippumattomuus:** osittainen. v0:n kirjoitti eri malli (Opus 5), mutta
samassa sessiossa ja samalla kontekstilla. Tämä on heikompi kuin aidosti
ulkopuolinen katselmointi, ja se on sanottava ääneen: sokeat pisteet ovat
todennäköisesti yhteisiä. Suositus alla: teetä toinen kierros Codexilla
tämän raportin pohjalta — sen tehtävä on kumota nämä johtopäätökset, ei
vahvistaa niitä.

**Kysymys:** onko `ResolvedUnit`-rakenne riittävä P1-2…P1-6:n
vaikutuksille, vai puuttuuko siitä kenttä, joka pakottaisi muuttamaan
rajapintaa kesken?

**Vastaus:** riittävä P1-2:lle ja P1-3:lle sellaisenaan. P1-4, P1-5 ja
P1-6 tarvitsevat kukin yhden lisäkentän, ja ne on lueteltu alla etukäteen,
jotta ne lisätään sopimukseen ennen toteutusta eikä sen aikana.

---

## Koeteltu

| tapaus | tulos |
|---|---|
| tavallinen risteilijä (Mars) | ok |
| `sw`-vaihtoehdot (Strike Cruiser, torpedorefit valittu) | `alt`+`box` yhdessä; aktiivisuodatin `box == null \|\| "on"` antaa 4 oikeaa riviä |
| saattue (Cobra ×2) | `hulls 2`, `points 60`, `hits 1` per runko — ok |
| pakollinen päivitys (AdMech Dictator) | `turrets 4` kaikilla pinnoilla — ok |
| toistettava optio (Warsphere ×3) | `hits 16` kaikilla pinnoilla — ok |
| yksikkö ilman listariviä (Waystation) | ratkeaa, `points null` — ok, kirjattu sopimukseen |
| **komentaja** (Chaos Warmaster) | **`null`** — ks. löydös 1 |
| 462 korttia ennen/jälkeen | 0 tavua muuttui |

## Löydökset

### 1. Komentaja ei ratkea — rajapinta-aukko, ei P1-2:n este

`resolveUnit` palauttaa `null`, kun rivillä ei ole alusprofiilia. Komentaja
on silti yksikkö: sillä on pisteet, Ld, uusinnat ja oma kortti
(`commanderCardHTML`). Laivastonäkymä ja rosteri laskevat komentajan
pisteet suoraan `unitPts`illa — eli sama "usea paikka" -rakenne, jonka v0
poisti aluksilta, on yhä voimassa komentajilla.

**Ei estä P1-2…P1-6** (ne koskevat alusoptioita). **Estää DoD 2:n**
("kaikki näkymät käyttävät samaa ratkaistua mallia"). Kirjataan v1:n
vaatimukseksi: `resolveUnit` palauttaa komentajalle `{kind: "commander",
points, ld, rerolls, …}`.

### 2. Kortti kutsuu laskimia yhä suoraan — ei ristiriitaa, mutta velka

`cardHTML` lukee statsit `R.stats`ista, mutta kutsuu `armModel`,
`specialLines` ja `unitPts` itse kolmessa kohdassa (`armRows`,
säännöt, optiolaatikko). v0:ssa tulos on identtinen, koska ne ovat samat
funktiot. Mutta kun P1-6 muuttaa `armModel`in tuottamaan instansseja,
kortin on luettava `R.weapons` — muuten sama alus ratkaistaan taas kahdesti.

**Toimenpide P1-6:ssa, ei nyt:** `cardHTML(u)` → `cardHTML(R)` tai
vähintään `armRows(R.weapons, …)`.

### 3. `rules` ei tunne yksikköä

`rules: specialLines(sh)` ottaa vain profiilin. Optioriippuvainen sääntö
("If fitted with a torpedo launcha, it may carry boarding torpedoes",
Terror ship s.380) ei voi näkyä tai kadota valinnan mukaan. Kortti ei tee
sitä nytkään, joten tämä ei ole regressio — mutta sopimus lupaa
"aktiiviset säännöt", ja v0 antaa "profiilin säännöt".

**Toimenpide:** sopimukseen `rules` → *aluksen säännöt suodatettuna
valintojen mukaan*; toteutus P1-3:n yhteydessä, koska sen optiot ovat
juuri ehdollisia.

### 4. `warnings: []` on tyhjä lupaus

Yksikkötason varoitukset (riippuvuus täyttymättä, ryhmän ylitys,
kelvoton yhdistelmä) elävät `setOptState`in sivuvaikutuksissa — se
*korjaa* tilan hiljaa (pudottaa option `opt`-tilaan) sen sijaan että
*kertoisi*. Käyttäjä ei näe miksi valinta hävisi. DoD 3: "käyttäjälle
kerrotaan ymmärrettävästi, mikä sääntö rikkoutuu."

**Toimenpide:** v1. `resolveUnit` palauttaa varoitukset; `setOptState`
lakkaa korjaamasta hiljaa.

### 5. Puuttuvat kentät tuleville tehtäville — lisää sopimukseen ennen toteutusta

| tehtävä | kenttä | miksi |
|---|---|---|
| P1-4 Venerable | `hull: { chosenRef, choices[] }` | listarivi ei osoita yhteen profiiliin |
| P1-5 Ork Hulk | `damage.critTable: "standard" \| "ork-hulk" \| …` | kortti ei saa päätellä faktiosta |
| P1-6 Hive Ship | `weapons[].count` | instanssien määrä |
| v1 | `options[]`, `upgrades[]` | sopimus lupaa ne; v0 ei anna |

Kaikki ovat **lisäyksiä**, eivät muutoksia. Yksikään ei riko nykyistä
lukijaa. Se on riittävä syy jatkaa: rajapinta laajenee, ei vaihdu.

### 6. Globaali tila — tiedetty, kirjattu, ei vielä ongelma

v0 nojaa `S`:ään (`shipOf`, `entOf`, `upState`, `L()`). Se on julkisivu,
ei ratkaisin. Vaara on, että se jää: "resolveUnit" nimenä antaa
vaikutelman puhtaudesta, jota ei ole. Sopimuksessa on nyt v1:n allekirjoitus
ja BACKLOG:ssa sen paikka. Riittää — kunhan sitä ei siirretä.

## Päätös

**Jatka P1-2:een.** Sen vaikutukset (`mod`) kulkevat jo
`effTurrets`/`effShieldsText` → `R.stats` -polkua, jonka golden-tapaukset
kattavat. Rajapintaan ei tarvita muutosta.

**Ennen P1-4/5/6:** lisää löydöksen 5 kentät `docs/DOMAIN_CONTRACT.md`:hen
ja kortin luku `R.weapons`ista (löydös 2).

**Ennen v1:** löydökset 1, 3, 4.

## Mitä ulkopuolisen katselmoijan pitäisi yrittää kumota

1. "Aktiivisuodatin `box == null || box === "on"` on oikea kaikille
   riveille." — Onko `alt`-rivi, jolla `box` puuttuu? Onko `aws`-rivi,
   joka on `hide`-tilassa ja silti mukana?
2. "462 kortista 0 muuttui todistaa, ettei v0 muuttanut laskentaa." —
   Tilannekuva otettiin ilman valintoja. Optioiden kanssa kortti ei ollut
   snapshotissa. Golden kattaa 23 tapausta; se ei ole 462 × valinnat.
3. "Komentajan `null` ei haittaa P1-2:ta." — Onko listaa, jossa
   komentajan valinta muuttaa aluksen profiilia (Ld-bonus, uusinta)?

## Ulkoinen katselmointi tehty 9.9.2026

Codex katselmoi commitin `cdb7e90` read-only: `docs/REVIEW-resolveUnit-v1-Codex.md`.
Kumousyritykset: 1) aktiivisuodatin kestää nykyiselle mallille, v1:ssä tila
vaihdetaan enumiksi; 2) "462 kortista 0 muuttui" todistaa perusregression,
ei optiokokoonpanoja — väite muotoiltiin rajatummin; 3) komentajaa, joka
muuttaisi aluksen statsia, ei löytynyt, mutta leadership-datan puute tekee
komentajista P1-8e:n suunnittelutehtävän. Löydökset 1–6 tästä katselmoinnista
suljetaan paketeissa `tasks/P1-8a…e`.
