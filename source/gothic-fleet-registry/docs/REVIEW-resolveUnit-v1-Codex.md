# Gothic Fleet Registry — ulkoinen katselmointi ennen `resolveUnit` v1:tä

**Katselmoija:** Codex  
**Päivä:** 9.9.2026  
**Tarkastettu commit:** `cdb7e90`  
**Rajaus:** nykyinen `resolveUnit` v0, `docs/DOMAIN_CONTRACT.md`, aiempi
`docs/REVIEW-resolveUnit-v0.md`, `tasks/P1-8-resolveunit-v1.md` sekä
hyväksyntä- ja golden-ajurit. Katselmointi oli read-only; sovelluskoodia tai
testejä ei muutettu.

## Tuomio

### Nykyinen v0

**HYVÄKSYTTY väliaikaiseksi julkisivuksi.** Nykyistä toteutusta ei tarvitse
perua. Täysi `python acceptance.py` meni läpi kaikilta tällä hetkellä
mitattavilta osilta:

- 60 golden-tapausta, 0 epäonnistumista ja 0 aukkoa
- 0 pintaeroa ja 0 tallennuskierrosvirhettä
- vaikutusjono 0
- 4 414 satunnaistapausta / 76 202 tarkistusta, 0 löydöstä
- 462 alus- ja 62 komentajakorttia, 0 rakenteellista löydöstä
- git-työpuu puhdas ajon jälkeen

v0 ratkaisi alkuperäisen Warsphere-ongelman ja antoi vaikutuksille yhden
nykyisen lukupisteen. Se on onnistunut strangler-vaihe.

### P1-8 nykyisessä muodossaan

**EI VALMIS TOTEUTETTAVAKSI SELLaisenaan.** Tehtävän tavoite on oikea, mutta
nykyinen allekirjoitus, migraatiojärjestys ja hyväksymisehdot jättävät
ratkaisijaan indeksisidonnaisuuden, aliasoinnin ja epämääräisen virhetilan.
P1-8 pitää koventaa alla olevilla muutoksilla ennen loopin jatkamista.

## Estävät löydökset

### P1 — V1:n syöte lukitsisi epävakaan tallennusformaatin domain-rajapinnaksi

P1-8 määrittelee `intent.options`, `quantities` ja `upgrades`, mutta nykyinen
tallenne käyttää aluksen optioissa indeksejä (`os`, `oq`) ja päivityksissä
osio-/rivi-indeksejä. Pysyvät tunnisteet on backlogissa vasta kohdassa 9.

Jos v1 rakennetaan ennen tunnisteita suoraan nykyisen `S`-olion muotoon,
"puhdas" ratkaisin jää puhtaaksi vain sivuvaikutusten suhteen mutta on yhä
sidottu listan ja optioiden järjestykseen. Kohta 9 joutuisi muuttamaan heti
juuri vakautetun v1-rajapinnan.

**Vaatimus:** erotetaan kaksi rakennetta:

```text
LegacySavedState (li/s/e/os/oq/ups)
              ↓ adapteri/migraatio
CanonicalUnitIntent (pysyvät list/entry/option/upgrade ID:t)
              ↓
resolveUnit(canonicalIntent, context, catalog)
```

Pysyvien ID:iden minimiperusta tehdään P1-8a:ssa ennen ratkaisinta, vaikka
varsinainen `schemaVersion`-julkaisumigraatio jäisi kohtaan 9. Domain-funktio ei
saa hyväksyä indeksejä ensisijaisina tunnisteina.

### P1 — "Tavulleen sama kuin v0" on väärä totuuslähde ja ristiriitainen ehto

P1-8 käskee vertaamaan v1:tä v0:aan "tavulleen" 34 golden-tapauksella.
Tapauksia on nyt 60. Lisäksi v1 lisää komentajat, aktiiviset säännöt,
`options`, `upgrades` ja varoitukset, joten koko tulos ei voi olla tavulleen
sama.

V0 on regressiovertailu, ei sääntöjen auktoriteetti. Tavutasoinen JSON-vertailu
lukitsee myös avainten järjestyksen ja v0:n mahdolliset virheet.

**Vaatimus:**

1. nykyisten aluscasejen yhteiset semanttiset kentät verrataan
   `deepStrictEqual`-tyyppisesti normalisoidun skeeman läpi;
2. uudet kentät testataan erillisillä kirjasta tai käyttöliittymäsopimuksesta
   johdetuilla odotuksilla;
3. testin tulee käyttää kaikki 60 nykyistä casea dynaamisesti, ei kovakoodattua
   lukua;
4. pariteettitesti ei saa korvata golden-odotuksia.

### P1 — `ResolvedUnit` vuotaa viitteitä takaisin katalogiin

`armModel()` palauttaa muuttumattomalle perusriville suoraan `sh.aw`-taulukon
alkion. Ajonaikainen koe vahvisti:

```text
resolveUnit(u).weapons[0].a === SHIPS[u.ref].aw[0]  → true
```

Kuluttaja voi siis vahingossa muuttaa katalogia muuttamalla ratkaistua oliota.
Tämä rikkoo immuuttisen domain-tuloksen oletuksen, vaikka funktio ei itse
kirjoittaisi globaaliin tilaan.

**Vaatimus:** v1:n tulos ei jaa muokattavia taulukoita tai olioita intentin,
fleetin tai katalogin kanssa. Lisää testi, joka jäädyttää syötteet
`deepFreeze`llä, ratkaisee yksikön, yrittää muuttaa tulosta ja todistaa ettei
katalogi tai intent muutu. Kehitystestissä myös tulos kannattaa jäädyttää.

### P1 — Korttirajapinta ei mahdu nykyiseen `ResolvedUnit`-sopimukseen

P1-8 sanoo `cardHTML(R)`, mutta nykyinen kortti tarvitsee ratkaisimen ulkopuolelta
ainakin seuraavat tiedot:

- listan ja listarivin nimi sekä perushinta
- faction/värikonteksti ja lähdesivu
- option ja listapäivityksen tila, teksti, hinta, määrä ja ryhmä
- käyttäjän note/adjustment
- saattueen jäsenten nimet
- critical-taulukon rivit, trigger-teksti ja repair-teksti
- tähtiviitteiden esitysmalli

Nykyinen v0 ei palauta edes sopimuksessa jo luvattuja `options`- ja
`upgrades`-taulukoita. Ajonaikainen koe vahvisti molempien puuttuvan.
`cardHTML()` kutsuu yhä suoraan `unitPts`, `unitMaxPts`, `upgradesFor`,
`optState`, `armModel`, `specialLines`, `criticalModel` ja globaalia `L()`-tilaa.

**Vaatimus:** päätetään ennen toteutusta jompikumpi selkeä malli:

```text
ResolvedUnit → pure makeCardViewModel(resolvedUnit) → cardHTML(viewModel)
```

tai `ResolvedUnit` laajennetaan sisältämään kaikki semanttisesti tarpeellinen.
Suositus on erillinen puhdas projektio: domain-tulos ei sisällä HTML:ää eikä
CSS-esityspäätöksiä, mutta renderer ei enää kysy katalogilta tai globaalilta
tilalta mitään.

### P1 — Komentajan luvattu tulos ei ole mallinnettavissa nykyisestä datasta

P1-8 lupaa komentajalle `{ld, rerolls}`, mutta 62 komentajarivin datassa ei ole
`ld`- eikä `rerolls`-kenttää. Leadership esiintyy nimitekstissä joko kiinteänä
arvona (`Ld 8`) tai modifierina (`Ld +1`, `Ld +2`), jotka ovat eri käsitteitä.
Re-rollit voivat tulla erillisistä ostettavista riveistä.

Leadershipin regex-parsiminen käyttöajossa riviotsikosta tekisi uuden
tekstiriippuvaisen sääntömoottorin.

**Vaatimus:** normalisoi komentajat build-vaiheessa lähdeviitteineen:

```js
leadership: { kind: "fixed", value: 8 }
// tai
leadership: { kind: "modifier", value: 1 }
```

Re-rollit ja muut ostettavat ominaisuudet ratkaistaan samoista strukturoiduista
upgrade-valinnoista kuin pisteet. Lisää golden-tapaukset vähintään kiinteälle
Ld:lle, Ld-modifierille, nimetylle komentajalle, nollahintaiselle komentajalle
ja re-roll-päivitykselle.

### P1 — `warnings` ja automaattinen normalisointi ovat määrittelemätön tila

Nykyiset setterit korjaavat valintoja hiljaa: keskenään poissulkeva optio
pudottaa toisen, riippuvuuden rikkoutuminen pudottaa riippuvan option ja
kelvoton listapäivitys poistetaan. P1-8 käskee lopettamaan tämän, mutta ei
määrittele mitä ratkaistulle profiilille ja pisteille tehdään kelvottomassa
intentissä.

**Vaatimus:** erota kolme vastuuta:

```text
transition(intent, action) → { intent, notices }  // UI:n tietoinen vaihto
validateIntent(intent, context) → Issue[]          // ei muuta syötettä
resolveUnit(valid-or-invalid intent, ...) → deterministinen tulos + Issue[]
```

UI saa edelleen vaihtaa saman ryhmän vanhan valinnan uuteen, mutta muutoksen
pitää olla näkyvä eikä vahinko. Suoraan ladattu tai testissä rakennettu
kelvoton intent säilyy muuttumattomana ja saa strukturoidun ongelman:

```js
{ code, severity, path, message, sourcePage }
```

Pelkkä `warnings: ["teksti"]` on liian hauras testeille, lokalisaatiolle ja
käyttöliittymän kohdistukselle.

## Merkittävät muut löydökset

### P2 — Ratkaisimen ja fleet-validaattorin vastuu pitää erottaa

Allekirjoitus antaa yhdelle yksikölle koko `{list, units, limit}`-fleetin.
Se voi johtaa sykliin: yksikkö tarvitsee fleetin ja fleetin validointi tarvitsee
kaikki ratkaistut yksiköt.

Suositeltu jako:

```text
resolveUnit(intent, unitContext, catalog) → ResolvedUnit
resolveFleet(fleetIntent, catalog) → { units: ResolvedUnit[], issues, totals }
```

`unitContext` sisältää listan ja yksikköön sovellettavat fleet-valinnat, ei
välttämättä koko raakaa `units`-taulukkoa. Jos koko fleet tarvitaan, riippuvuus
ja suoritusjärjestys pitää määritellä eikä `resolveUnit` saa kutsua itseään
epäsuorasti.

### P2 — P1-8 aliarvioi globaalin riippuvuusgraafin

Vaihe 2 nimeää vain `shipOf`, `entOf`, `upState` ja `optState`. Käytännössä
ratkaisin vetää mukanaan myös ainakin `L`, `unitPts`, `unitMaxPts`,
`upgradePts`, `upgradesFor`, `condOK`, `armModel`, `statMod`, `statSet`,
`isEscort`, `coveredByShipOption`, `bayStrength` ja useita apureita.

Tätä ei pidä siirtää yhtenä 2–4 päivän massapatchina. Pilko migraatio niin,
että jokainen vaihe pysyy vihreänä:

1. P1-8a: canonical intent, ID:t, skeema ja puhtaustestit
2. P1-8b: puhtaat option/upgrade/price/weapon-apurit
3. P1-8c: `resolveUnit` + v0-adapteri ja dual-run-pariteetti
4. P1-8d: projektiot ja pintojen siirto yksi kerrallaan
5. P1-8e: komentajat, issues ja adapterin poisto

### P2 — Todellinen DOM-riippumaton testaus vaatii erillisen lähdemoduulin

Nykyinen golden-ajuri lukee generoidun HTML:n, irrottaa koko `<script>`-lohkon
ja rakentaa DOM-tyngän. Jos v1 jää `app_template.html`:n sisään, testi ei ole
aidosti DOM-riippumaton vaikka funktion argumentit olisivat puhtaat.

AGENTS.md sallii modulaarisen lähteen, kun build tuottaa yhä yhden HTML:n.
Suositus: erota domain-logiikka lähdetiedostoon (esim. `domain.js`) ja anna
`build.py`:n upottaa se valmiiseen yhden tiedoston julkaisuun. Node-testit
tuovat saman lähdemoduulin suoraan ilman HTML:n pilkkomista tai DOM-stubia.

### P2 — Golden-ajurilla on vielä pinta-aukkoja

Nykyinen ajuri on paljon aiempaa parempi, mutta:

- kortin aseriveistä verrataan ratkaistuun malliin käytännössä nimiä, ei
  systemaattisesti range/FP/arc/count/box-kenttiä;
- rosterista verrataan vain hits ja points, ei optioita ja päivityksiä;
- Copy list ei ole golden-pintavertailussa;
- komentajista ei ole semanttisia golden-tapauksia;
- 462 kortin testi ei kata kaikkia optioyhdistelmiä;
- save-roundtrip vertailee saman dataversion sisällä eikä testaa ID-migraatiota.

P1-8:n pintamigraatio tarvitsee vähintään yhden täyden "rich unit" -fixturen,
jossa on oma optio, listapäivitys, määrä, nimi/note/adjustment, useita aseita ja
save-roundtrip. Sen kaikki projektiot verrataan kenttä kentältä.

### P2 — Nykyinen renderöinti muuttaa intenttiä

`cardHTML()` kirjoittaa escortille `u._mem = members`. Ajonaikainen koe
vahvisti, että pelkkä kortin renderöinti lisää kentän syöteolioon. Tämä ei ole
nykyinen käyttäjäbugi, mutta v1:n puhtaustavoitteen vastainen ja hyvä
regressiotesti.

**Vaatimus:** yksikään resolveri tai projektio ei muuta intenttiä, fleetia tai
katalogia. Testaa syötteiden identtisyys ennen ja jälkeen myös
`cardHTML(viewModel)`-polulla.

## Aiemman katselmoinnin kolme kumousyritystä

1. **Aktiivisuodatin `box == null || box === "on"`:** en löytänyt nykyisestä
   `armModel`ista rivityyppiä, jossa aktiivinen vaihtoehto jäisi tällä ehdolla
   pois tai avoin vaihtoehto pääsisi mukaan. Nykyiselle mallille väite kestää.
   V1:ssä tila kannattaa silti vaihtaa eksplisiittiseksi enumiksi
   (`active/offered/hidden`) eikä päätellä `box`-esityskentästä.

2. **462 muuttumatonta korttia:** todistaa hyvän perusregression mutta ei
   kaikkia optiokokoonpanoja. 60 golden-tapausta paikkaa aukkoa merkittävästi,
   ei täydellisesti. Väite pitää muotoilla rajatummin.

3. **Komentajan `null`:** en löytänyt sellaista nykyistä komentajariviä, joka
   suoraan muuttaisi alusprofiilin statsia v0-resolverissa. Se ei estänyt
   P1-2…P1-7:ää. Se kuitenkin estää DoD:n yhden totuuden tavoitteen, ja datan
   puuttuva leadership-rakenne tekee siitä P1-8:n aidon suunnittelutehtävän.

## Päivitetty hyväksymisportti P1-8:lle

P1-8 voidaan aloittaa, kun tehtäväpakettiin on lisätty nämä ehdot:

- canonical intent käyttää pysyviä ID:itä, legacy-save käsitellään adapterissa
- domain-lähde voidaan testata ilman HTML:ää, DOM:ia, `localStorage`ia tai `S`:ää
- resolveri ei muuta eikä aliasoi mitään syötettä
- `kind` on eksplisiittinen kaikille tuloksille (`ship` / `commander`)
- komentajan leadership on strukturoitu build-vaiheessa, ei parsittu runtime-tekstistä
- options/upgrades/issues ovat skeemassa ja testeissä, eivät vain dokumentissa
- invalid intentin semantiikka on määritelty
- v0-pariteetti koskee yhteisiä semanttisia kenttiä kaikissa nykyisissä
  golden-caseissa; uudet kentät saavat riippumattomat odotukset
- kortti, fleet view, roster ja Copy list käyttävät puhtaita projektioita
- aserivin kaikki neljä saraketta ja tila verrataan ainakin rich fixtureissä
- adapteri poistetaan vasta dual-runin ja kaikkien pintojen migraation jälkeen
- täysi `python acceptance.py` pysyy vihreänä jokaisen osavaiheen jälkeen

## Suositeltu seuraava päätös

**Älä aloita kohtaa 8 ennen v1:tä**, koska listasääntöjen uusi logiikka
kasvattaisi globaalin `S`-riippuvuuden purkualuetta. Mutta älä myöskään anna
loopin aloittaa nykyistä P1-8:aa yhtenä massatehtävänä.

Ensin päivitetään P1-8 yllä olevaksi viiden osapaketin strangler-migraatioksi.
Sen jälkeen työn voi käynnistää. Nykyinen `cdb7e90` on hyvä ja palautettava
tarkastuspiste.
