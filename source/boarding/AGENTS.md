# Ohje agentille

**Lue `LUEMINUT.md` ensin.** Sen luku "Tulkintapäätökset" listaa ne 22 kohtaa,
joissa kirjat ovat ristiriidassa tai vaiti, ja mitä sovellus valitsi. Jos aiot
muuttaa sääntölogiikkaa, tarkista ensin onko kyse jo tehdystä valinnasta.

## Komennot

```
python build_ships.py     # aluskanta fleet builderin datasta -> src/ships.json
python make_icons.py      # vain kun ikoneita muutetaan -> src/icons.json
node test_engine.js       # sääntömoottorin golden-tapaukset (kirjojen esimerkit)
node test_fuzz.js         # ominaisuussweep: 40 000 satunnaista boardingia
python build.py           # src/* -> Boarding.html
```

Aja testit ja `build.py` aina, kun olet muuttanut mitä tahansa `src/`:ssä. `Boarding.html`
on **generoitu** — älä muokkaa sitä käsin, muutos katoaa seuraavassa buildissa.

## Kiellot

1. **Älä kirjoita mitään `../fleet builder/`-kansioon.** Se on toinen projekti,
   oma git-reponsa ja oma hyväksyntäajonsa. Tämä projekti lukee siitä vain
   `bfg_data.json`:ia, ja vain `build_ships.py`:ssä.
2. **Älä muokkaa `src/ships.json`:ia tai `src/icons.json`:ia käsin.** Molemmat ovat
   generoituja. Alussäännöt lisätään `build_ships.py`:n `SHIP_FLAGS`-tauluun, ja
   jokainen rivi tarvitsee lähdelauseen, joka tarkistetaan aluksen omasta
   `sr`-tekstistä. Ikonit ja värit muutetaan `make_icons.py`:n `FLEETS`-, `G`- ja
   `H`-tauluissa.
3. **Älä lisää sääntöä ilman sivunumeroa.** Jokainen modifikaattori
   `src/engine.js`:ssä viittaa kommentissa kirjaan ja sivuun. Jos lähdettä ei
   löydy, se kuuluu `LUEMINUT.md`:n tulkintalistaan, ei hiljaa koodiin.
4. **Alus kuuluu miehistönsä laivastoon.** `build_ships.py` poimii kirjan
   laivastolistoista rungot, jotka laivasto miehittää itse (Explorator-listan
   imperiumin rungot, kaaoksen renegadet, rapid strike vesselit). Luokittelu on
   `LIST_CREW`-taulussa; uusi luokittelematon osio pysäyttää ajon. Älä lisää
   runkoa laivastoon ilman laivastolistan riviä ja sivuviitettä.
5. **Uusi laivasto tarvitsee ikonin.** `build.py` pysähtyy, jos laivastolta
   (`FLEETS`) tai runkotyypiltä (`H`) puuttuu rivi `make_icons.py`:ssä. Ikonit ovat omia
   yksinkertaistettuja muotoja, eivät kopioita julkaistuista logoista.
6. **Älä riko ei-vieritystä.** Jokainen näkymä mahtuu ruudulle. Kortit
   tiivistyvät portaittain (`fitSide`), listat samoin (`fitList`), ruudukko
   valitsee sarakemäärän (`fitGrid`). Ikoni ei koskaan katkaise nimeä
   (`fitGlyph`, `chipCut`, `fitTabs`, `fitVal`). Jos lisäät sisältöä, tarkista 320×568,
   360×640 ja vaakapuhelin 740×360.

## Rakenne

`src/engine.js` on puhdas sääntömoottori: ei DOM:ia, ei satunnaisuutta muuten
kuin injektoidun rng:n kautta, ajettavissa nodella. Kaikki sääntötieto on
siellä. `src/app.html` on pelkkä käyttöliittymä sen päällä; se ei saa sisältää
sääntölogiikkaa, jota moottori ei jo tiedä.

Testi on moottorin, ei käyttöliittymän. Jokainen väite on joko kirjan esimerkki
tai kirjan lause väitteeksi käännettynä. Älä kirjoita testiä, joka vain toistaa
toteutuksen.

## Esikatselu

`.claude/launch.json` työtilan juuressa, konfiguraatio `boarding`, portti 8751:
`http://localhost:8751/Battlefleet%20Gothic/boarding/Boarding.html`.
Sovelluksen globaalit selaimessa: `S` (tila), `render()`, `BOARDING` (moottori),
`SHIPDATA` (aluskanta). `file://` ei toimi esikatselussa, mutta valmis
`Boarding.html` toimii suoraan tiedostona avattuna.
