# Suunnitelma: Check yourself tyhjäksi

> **Toteutettu 20.10.2026** (BACKLOG J212–J221). Not checked -ryhmä on
> tyhjä. Toteutus poikkesi suunnitelmasta näissä: inkvisiittorin risteilijä
> luetaan sijoituksena eikä runkovalintana (T56), Battlefleet Obscura Reserve
> Fleetin lista puuttuu kirjasta (s. 34 tyhjä) ja lause on Fleet facts
> -ryhmässä, ja Taun Orca/Dhow-laivueet emoalusten mukaan ovat pöydän
> laivuemuodostusta (In play). Tila ja ylläpito: `LUEMINUT.md`.

Tehty 20.10.2026 käyttäjän linjauksesta. Kaikki lauseet joko poistetaan,
siirretään omaan ryhmäänsä tai muutetaan builderin ominaisuudeksi.
Kampanja ja skenaario saa oman ryhmänsä. Fleet rules on oma ryhmänsä, jossa
erotellaan, mitä builder tarkistaa ja mitä ei. Pohjana ovat `YHTEENVETO.md`:n
luokitus ja varmistusajo. Lauseiden tunnisteet (S0001…) viittaavat
`LIITE_luokat.md`:hen.

## 1. Mihin kukin lause menee

Nykyään 2 497 esiintymää on yhdessä "Check yourself" -ryhmässä. Tavoitetila:

| määränpää | esiintymiä | lähde (luokka) | huom |
|---|---|---|---|
| **Fleet rules → Checked by the builder** | 510 | VALVOTTU 377, RAKENNE 133 | tila (vihreä/punainen) näkyy lauseen vieressä |
| **Fleet rules → In play** | 767 | PELI | aiheittain: ordnance, Ld, aseet, kriittitaulukot, erikoissäännöt |
| **Campaign & scenario** | 642 | KAMPANJA | oma taitettu ryhmä, kiinni oletuksena |
| rivin oma selite | 192 | KUVAUS (row) | lause siirtyy sille riville, jota se kuvaa |
| pois | 195 | TAUSTA 156, KUVAUS (drop) 39 | kerronta, johdannot, esimerkit, tuplat |
| poiminta korjataan | 33 | ROSKA | luokitellaan korjauksen jälkeen uudelleen (enimmäkseen PELI/KAMPANJA) |
| **rosterin yhteenveto** | 30 | LASKETTAVA 23, vastustajan edut 7 | attack rating, VP-arvot, vastustajan edut |
| **varoitus rivillä** | 7 | sopimussäännöt | "needs your opponent's agreement" |
| **Models & painting** | 3 | maalaussäännöt | pieni ryhmä Fleet rules -paneelissa |
| laivueryhmä (vaihe 5) | 18 | pöytälaivueet | siihen asti *Not checked* |
| **uusi tarkistus tai ominaisuus** | 100 | OMINAISUUS | siihen asti *Not checked* |

Varsinaiseen "Check yourself" -ryhmään ei jää mitään. Sen tilalle tulee
**Not checked by the builder** -lista: tunnetut kirjan säännöt, joita ei
vielä valvota, sivunumeroineen. Lista lyhenee sitä mukaa kuin tarkistuksia
lisätään (alussa 118 esiintymää, lopussa 0). Laskuri laskee vain tämän
listan, ei kaikkia lauseita (nyt `app_template.html:3338`, `:3359`).

## 2. Fleet rules -ryhmä

Lauseista 56 % (1 395 / 2 497) on listojen FLEET RULES -osioissa, ja niistä
1 081 on pelin aikaisia tai kampanjasääntöjä. Ne eivät kuulu katalogin
ostolistaan. Ehdotus on listakohtainen Fleet rules -paneeli, esimerkiksi
oma välilehti tai painike laillisuuspaneelin vieressä:

```
FLEET RULES — Chaos — Black Crusade                         (Fleets pp. 226–235)
  Fleet composition
    ✓ Checked by the builder  (20)   jokainen lause + tarkistuksen tila
    ✗ Not checked             (6)    kirjan lause + sivu + mitä pitää katsoa
  Commanders and flagship            laskettu sijoitus (vaihe 4)
  In play                    (43)    Daemonships · Marks of Chaos · Ordnance · Abaddon
  Models and painting
  Campaign & scenario        (16)    ▸ kiinni
```

- Katalogin osioihin jäävät vain kyseisen osion *Checked*- ja
  *Not checked* -rivit, eikä rivien kuvauksia toisteta osion tekstinä.
- *In play* -aiheet tulevat `f`-kentästä. Sama aineisto kelpaa Play-sivun
  sääntöviitteeksi.
- Planetary defences -osion 203 lausetta jakautuvat samoin (Checked 81,
  In play 62, Campaign 60).

## 3. Tarkista itse -lauseet (15) ja niiden uusi paikka

| id | sivu | listat | sääntö | uusi paikka |
|---|---|---|---|---|
| S0051 | F38 | Bastion | Veteran Captainin alukset on oltava laivueessa | laivueryhmä |
| S0421 | F227 | 6 Chaos-listaa | Daemonship ei saa olla laivueessa | laivueryhmä |
| S0816 | F367 | Waaagh! | Rokit laivueessa enintään neljä, vain Rokkeja | laivueryhmä |
| S1111 | F455 | 2 Tau-listaa | Orcat laivueena, jos emoalukset ovat laivueena | laivueryhmä (hook-emo) |
| S1112 | F455 | 2 Tau-listaa | Orca-laivueen katto kuusi | laivueryhmä |
| S1113 | F455 | 2 Tau-listaa | Orcat vain emoalustensa laivueen Orcien kanssa | laivueryhmä (hook-emo) |
| S1120 | F455 | 2 Tau-listaa | Dhowt laivueena emoalusten mukaan | laivueryhmä (hook-emo) |
| S1121 | F455 | 2 Tau-listaa | Dhow-laivueen katto kuusi | laivueryhmä |
| S0243 | F121 | Explorator | saattajat Mechanicus-väreissä | Models & painting |
| S0893 | F369 | Clanz | klaaniväri: enemmistö aluksista, yli puolet mallista | Models & painting |
| S0910 | F369 | Clanz | Blood Axe -lainasaattajat orkkiväreissä | Models & painting |
| S0035 | F142 | 6 listaa | Ordo Malleus: Chaos-vastustaja saa ilmaisen Markin tai Daemonshipin | rosteri: Opponent bonuses |
| S0311 | F141 | Inquisition | Ordo Xenos: xenos-vastustaja saa D6×50 pts saattajia | rosteri: Opponent bonuses |
| S0352 | F174 | 3 RT-listaa | Siluria ja Havoc vain vastustajan suostumuksella | varoitus rivillä |
| S1004 | F426 | 2 Tyranid-listaa | bio-enhancements yksittäispelissä vain sopimuksella | varoitus rivillä |

Seitsemän lausetta (17 esiintymää) voi siirtää heti: maalaus 3, vastustajan
edut 2 ja sopimukset 2. Kahdeksan laivuesääntöä (18 esiintymää) odottaa
vaihetta 5, ja siihen asti ne ovat *Not checked*.

## 4. Lisättävät tarkistukset

Jokainen alkaa punaisesta golden-tapauksesta (AGENTS.md §3). Työmäärät ovat
arvioita.

### 4a. Nopeat, olemassa olevilla sääntölajeilla

| # | tarkistus | lauseet | sääntölaji | arvio |
|---|---|---|---|---|
| 1 | Bakan refit ei reservialukselle (nyt sallitaan, virhe) | S0106 | rivin ehto uudella avaimella `norole` | 1 h |
| 2 | AdMech: SM-reservit ilman inkvisiittoria, kun ei IN-capitalia eikä xenosta (nyt väärä punainen) | S0249, S0250 | reservimoottorin listapoikkeus | 2–3 h |
| 3 | AdMech: reservisaattajat ilman 1:3-rajaa, samalta listalta kuin capital-reservit (nyt väärä punainen) | S0255, S0256 | sama | yllä |
| 4 | RT: Veteran Rogue Trader ≤ RT-risteilijät | S0345 | `ratio` | 0,5 h |
| 5 | Tau: Kor'O Mesme vaatii Custodianin | S1094 | `requires` | 0,5 h |
| 6 | War Host: hook-kapasiteetti (nyt notice) | S1168 | `hook_capacity` | 1 h |
| 7 | Exploration: liittolaiset vain yhdeltä listalta | S0380 | uusi pieni laji `distinct_donors` | 1 h |
| 8 | Exploration: ei Demiurgia eikä Krootia SM-alusten kanssa | S0384, S0386 | `conditional_cap` rotuehdolla (pickHas tuntee rodun) | 1 h |
| 9 | Tyranidit: pakollinen asevalinta | S1041, S1043, S1058, S1059 | `need1` (Waystationin malli) | 1–2 h |
| 10 | Iyanden: Autarchin Dragonship-lippulaiva ei laske rajaan | S0641 | ratio-poikkeus komentajaehdolla | 1 h |
| 11 | Chaos: CSM-miehistön Thunderhawk-vaihto puuttuu | S0512 | uusi rivi + aseiden vaihto (VBB:n malli) | 1–2 h |
| 12 | Opponent bonuses rosteriin | S0035, S0311, S0340 | laskettu inforivi | 1 h |
| 13 | Sopimusvaroitus riville | S0352, S1004 | warn-rivi, kun rivi on otettu | 1 h |

Yhteensä noin 14–18 h. Not checked -lista lyhenee 18 esiintymällä, ja
kolme virhettä korjautuu. Kohdat 12–13 siirtävät Tarkista itse -lauseita
(vaihe 1), eivät lyhennä listaa.

### 4b. Laskettu tieto rosteriin

- **Attack rating** (15 lausetta, kaikki listat): taulukko listoittain
  kirjasta ja ehdot laivastosta. Ehdolliset:
  - Dominion 2, jos mukana on IN-, AdMech- tai RT-alus (S0165).
  - Crusade 1 fortress-monasteryn kanssa (S0154).
  - Inquisitor Lord: IN tai AdMech 2, SM 3, Blackshipin kanssa 2 (S0287, S0288, S0341).
  - Yriel 4 (S0633).

  Näytetään rosterissa, Copy listissä ja Play-sivulla.
- **VP-arvo** Demiurg-linnakkeille (S1163).

### 4c. Lippulaiva ja komentajan sijoitus (25 lausetta)

Suurin osa sijoitussäännöistä on **deterministisiä**, joten builder voi
laskea paikan itse. Kysyä tarvitsee vain, kun kirja jättää valinnan.

| sääntö | tyyppi | lauseet |
|---|---|---|
| kalleimpaan alukseen (Warmaster, Pirate Captain, Clanzin Warlord, GK-inkvisiittori) | laskettu, tasatilanteessa valinta | S0326, S0394, S0477, S0491, S0513, S0822 |
| tiettyyn alukseen, jos se on mukana (MoF → VBB tai battle barge; Archmagos Veneratus → Ark; Inquisitor → Inq cruiser → Blackship; Hero → Flame; Abaddon → Planet Killer; Mesme → Custodian; Warlord → hulk) | laskettu | S0141, S0145, S0158, S0268, S0286, S0324, S0325, S0504, S0625, S0631, S0829, S1094 |
| kiellot (Lord ei Warmasterin eikä Abaddonin alukselle; Daemonship ilman komentajaa; AdMech-komentaja vain Mechanicus-alukselle) | tarkistus, kun Lordeja on useita | S0253, S0473, S0495, S0507, S0515, S0526, S0530 |

Tulos näkyy komentajakortilla ("Aboard: Despoiler class battleship") ja
laivastonäkymässä, ja pelaaja voi vaihtaa sitä vain sallittujen alusten
välillä. Pohja on valmiina: L.aboard (Yriel, `domain.js:4516`) ja rivi
"Embarks the Inquisitor" (`upgrades.py:642`). J8:n päätös säilyy, koska
aluksen statseja ei muuteta.

### 4d. Ork Clanz -apu: Warlordin komento

Clanz on suurin lista (183 lausetta, joista 11 on ominaisuusehdokkaita).
Sen sääntö on poikkeuksellinen: laivasto rakennetaan Warlord kerrallaan, ja
jokaisella Warlordilla on omat laivueensa (s.372–373).

Mitä builder tekisi:

1. **Warlordin lohkot laivastonäkymässä.** Jokainen alus kuuluu yhdelle
   Warlordille (pudotusvalikko riville; oletuksena viimeksi lisätty Warlord).
   Lohkon otsikossa: re-rollit, klaani, Gubbins-budjetti ja lippulaiva.
2. **Laivuerakenne Warlordia kohden** (S0824, S0836–S0838): jokaista re-rollia
   kohden yksi tiddla (vähintään 3) ja yksi muu laivue. Muita laivueita
   ovat Big ship skwadron (1–2 kroozeria, S0826), Rok ja 'Uge ship.
   Lohkoon tulisi tila tyyliin "1 re-roll: 1/1 tiddla, 1/1 other".
3. **'Uge ship** (S0828, S0839): enintään yksi Warlordia kohden, ja Warlordilla
   pitää olla kaksi kroozeria eli vähintään yksi lisä-re-roll.
4. **Space Hulk** (S0829, S0840): hulkin Warlord johtaa vain hulkkia, ja
   hulkki täyttää kaikki hänen laivuepaikkansa.
5. **Klaani** (S0891, S0897): kaikki Warlordin laivueet samaa klaania;
   kroozer-laivueessa jokainen alus maksaa klaanin.
6. **Gubbins** (S0821): budjetti Warlordin omien re-rollien mukaan ja vain
   hänen omalle alukselleen tai laivueelleen. Nykyinen budjetti on
   laivastotason (`up_budget`).
7. **Lippulaiva** (S0822): kallein alus Warlordin omassa komennossa
   lasketaan ja näytetään.
8. **Kortit:** Warlordin kortti luettelee hänen laivueensa, koska re-rollit
   ovat vain niille (S0823).

Toteutus: yksikölle kenttä `cmd` (Warlordin yksikkö-id) ja kroozereille
`sq` (laivuetunniste). Tarkistukset tehdään puhtaana funktiona
`domain.js`:ään, ja `test_domain.js`:ään tulevat kirjan esimerkit S0836–S0838
(pienin ja suurin laivasto, sekä "yksi Rok + yhdeksän saattajaa").
Tallennusmuoto saa kaksi valinnaista kenttää, joten migraatiota ei tarvita.
Arvio 8–12 h.

**Avoin tulkinta (käyttäjälle):** onko "for every re-roll ... one tiddla
skwadron of at least three escorts and one other skwadron" tarkka määrä
(täsmälleen 2 × re-rollit) vai yläraja? Kirjan esimerkit (pienin ja suurin
laivasto) viittaavat tarkkaan määrään.

### 4e. Laivueryhmä (yleistys Clanzista)

Sama `sq`-kenttä kaikille listoille kattaa:

- capital-laivueet 2–4 ja 2–3 (s.13)
- Daemonship ei laivueessa (S0421)
- Rok-laivueet enintään neljä (S0816)
- Veteran Captainin laivue (S0051)
- Tau Orca- ja Dhow-laivueet emoalusten mukaan (S1111–S1113, S1120, S1121)
- sekalaivueet: RT:n apualus RT-saattajien kanssa (S0362) ja Piratesin RT Xenos Vessels (S0409, S0410)

Kun tämä on tehty, kahdeksan viimeistä Tarkista itse -lausetta muuttuu
tarkistuksiksi.

### 4f. Reitit ja runkovalinnat (isompi datatyö, 1.1-mekanismilla)

| reitti | lauseet |
|---|---|
| AdMech-risteilijät Bakan battlecruiser-paikoille, ei Archmagosta, Fleet Defence Turret | S0089–S0091, S0102 |
| RT:n toinen risteilijä Exploration-variantiksi; RT-risteilijän runkovalinta | S0349, S0354 |
| Void Stalker Iyandeniin (1 000 pts ja kolme Corsair-risteilijää) | S0653 |
| Blood Axe -tiddla: enintään kolme IN- tai Chaos-saattajaa | S0909 |
| Demiurg Bastion palkkasoturina mihin tahansa laivastoon paitsi Orks, Tyranids, Necrons | S1143, S1144 |
| RT-risteilijän "attendant escorts" inkvisiittorin kanssa | S0298, S0308 |
| Exploration-apualukset (yksi rotu, ei Orks, DE, Necrons, Tyranids; ei xenosta SM-apualusten kanssa) | S0373–S0375 |
| Exploration-liittolaisten erikoishahmo ja 0-1 battleship | S0381, S0382 |
| Battlefleet Obscura Reserve Fleet -listavariantti | S0058 |
| Inquisitorial cruiser mikä tahansa IN-risteilijä (tulkinta) | S0281 |

## 5. Ehdotettu järjestys

| vaihe | sisältö | Not checked -lista |
|---|---|---|
| 1 | Fleet rules -paneeli, Campaign & scenario -ryhmä, rivien selitteet, poistot, laskuri, Tarkista itse -lauseista maalaus, vastustajan edut ja sopimukset | 2 497 → 118 |
| 2 | 4a-tarkistukset ja kolme virhettä | 118 → 100 |
| 3 | 4b attack rating ja VP | (ei vaikuta listaan, uutta tietoa) |
| 4 | 4c lippulaiva ja sijoitus | 100 → 51 |
| 5 | 4d Clanz-apu ja 4e laivueryhmä | 51 → 22 |
| 6 | 4f reitit | 22 → 0 |

Vaihe 1 on pelkkää dataa ja käyttöliittymää: build lukee `luokitus_kaikki.json`:n
(tai siitä tehdyn `referenssi/check_yourself.json`:n) ja liittää jokaiseen
lauseeseen ryhmän. `check_reference.py` saa tarkistuksen, ettei uusi lause
jää luokittelematta.
