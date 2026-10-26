# Ehdollisten optioiden auditointi 2026-09-10 / 15 — J16

Käyttäjän 1.0-portin toinen kohta. Jokainen alusoptio, jonka tekstissä on
ehto, luokiteltiin kirjasta. Ehto voi olla vaikutus (mitä option ottaminen
tekee), riippuvuus (vaatii toisen valinnan) tai rajoitus (sulkee toisen
valinnan pois). Ulkoisen katselmoinnin mukaan "21 ehdollista optiotekstiä
ilman riippuvuusmetadataa". Sen jälkeen Warspheren kolme on korjattu
(`hpmin`, pistokoe 12 M3).

## Menetelmä

- **Haku:** kaikki listoilla käytössä olevien alusten optiot, joiden
  tekstissä on jokin sanoista *if, or greater, or less, may only, only if,
  instead of, up to, unless, require(s), must, provided, as long as* (ja
  laajemmassa haussa myös *only, except, cannot, not with*).
- **Kaksi joukkoa:** 16 optiota ilman `dep`/`grp`/`hpmin`/`cond`-metadataa
  ja 9 optiota, joilla metadata on. Jälkimmäisistä tarkistettiin, että
  metadata vastaa kirjan ehtoa.
- **Kirja:** jokaisen option profiilisivu (s.72–76, 84, 181, 182, 192,
  255, 268, 269, 374–383, 437, 494) ja ehdon kohde (s.175 Xenotech, s.23).
  Toteutus tarkistettiin `spot_check.js`:llä (optio otettuna: statsit,
  aseet, tarjonta).

## Tulos

25 ehdollisesta optiosta **yksi vika** (Q1, P1), korjattu commitissa
`a16a1ce`. Muut 24 olivat oikein: ehto oli joko option oma mallinnettu
vaikutus, metadatalla toteutettu riippuvuus tai ehto, joka täyttyy
rakenteellisesti aina.

### Q1 (P1): Fast Clipper ja Xenotech-refit

| | |
|---|---|
| kirja | s.192 "Fast Clipper: Instead of taking a refit normally, for no extra cost this vessel type can be converted to a fast clipper by entirely removing its primary battery armament for the Advanced Drive Technology refit"; s.175 "each Rogue Trader vessel may roll randomly against the Xenotech System table below for +15 points per cruiser or +5 points per escort. For an additional +5 points per ship, the player can select the desired technology instead of rolling randomly for it." |
| vika | Fast Clipper otettuna Armed Cargo Vessel sai yhä Xenotech-rivit ("Xenotech System, rolled randomly (escort, per ship)" ja "Choose the Xenotech System instead of rolling"). Laiton yhdistelmä: kaksi refitiä. |
| juurisyy | rivien ehto ei tuntenut aluksen omaa valintaa. Olemassa oleva `noopt` kysyy vain, *onko* aluksella tällainen optio, ei onko se otettu. |
| korjaus | uusi ehtoavain `offopt` (`domain.js condOK`): rivi poistuu, kun aluksen oma vastaava optio on otettu. Rogue Traders- ja Exploration-listan saattajarivit ja valintarivi saavat `offopt="^Fast Clipper"`. Golden `rt-fast-clipper-no-xenotech-refit` (ensin punaisena) ja vastapari `rt-xenotech-refit-without-fast-clipper`. Selaimessa (`DOMAIN.resolveUnit`): ilman Fast Clipperia 25 cm ja kaksi Xenotech-riviä, Fast Clipperin kanssa 30 cm eikä yhtään riviä. |

### Luokittelu

| optio (sivu) | ehto kirjassa | luokka | toteutus |
|---|---|---|---|
| Endeavour, Endurance, Defiant (s.72, 73, 74, 75, 76, 181): "May increase the prow armour to 6+ for no additional cost" | "However, if this option is taken, the turning radius of these vessels is reduced to 45 degrees." | vaikutus | `set` ar 6+ front / 5+ ja tn 45° (`referenssi/optiot.json`); tarkistettu otettuna |
| Cobra (s.84): detection gear | "Can only be taken by escort squadrons where more than half the escorts are Cobras, and all the Cobras in the squadron must take the refit. Only Imperial escort squadrons may take this refit, not pirates, Chaos renegades, etc." | täyttyy rakenteellisesti | yksikkö on yhden luokan squadron ja optio koskee kaikkia; Pirates-listalla optio kielletty (`optno`, pistokoe 10) |
| Heavy Transport (s.182): Xenotech +10 | "When included in a Rogue Trader fleet in a campaign or one-off game" | täyttyy rakenteellisesti | alus on vain Rogue Traders- ja Exploration-listoilla; listan Xenotech-rivejä ei tarjota sille (`nmno heavy transport`) |
| Heavy Transport (s.182): Fuel Tanker, Repair Tender, Super-Heavy Transport | "Many specialized heavy transports ... like the Repair Tender and the Super-Heavy Transport variants below" | tulkinta | kirja ei sano "choose one", ja Super-Heavy mainitsee itse "supertankers"; yhdistelmät sallitaan (kirjattu) |
| **Armed Cargo Vessel (s.192): Fast Clipper** | "Instead of taking a refit normally" | **rajoitus – vika Q1** | korjattu `offopt` |
| Retaliator (s.268): improved thrusters | "may move 5D6 cm when on All Ahead Full orders ... This costs no extra points." | vaikutus | teksti kortilla |
| Repulsive (s.269): third shield +15 | "when modelled on a large 60 mm base" | mallinnusehto, ei pelisääntö | `mod` sh +1 (`optiot.json`) |
| Warsphere (s.494): +2HP/+2 FP +20, −2HP/−2 FP −20 | "(up to three times)", "(up to two times)" | määräraja | `qty` 3 ja 2; 10 HP -ehto muihin optioihin `hpmin` (M3) |
| Chaos battle barge (s.255): Chosen Terminators | "If Chaos Space Marines are taken" | riippuvuus | `dep` |
| Terror ship, Kill kroozer (s.380, 382): boarding torpedoes | "If fitted with a torpedo launcha" | riippuvuus | `dep` launcha-vaihtoon |
| Lite kroozer (s.383): torpedo launcha ja boarding torpedoes | "instead of heavy gunz", "If fitted with a torpedo launcha" | vaihto ja riippuvuus | `grp` ja `dep` |
| Escort drone (s.437): fireship | "Instead of taking one of the above, up to 10% of the Tyranid escort drones in the fleet can elect to become fireships" | vaihto; 10 % on laivastotason raja | `grp` aseiden kanssa; 10 %:n rajaa ei valvota (kirjattu) |
| Warsphere (s.494): shield, turret, range | "Warspheres 10HP or greater" | riippuvuus | `hpmin` 10 (M3) |

Kirjattu (ei korjattu): Heavy Transportin varianttien yhdistelmät ja
escort droneiden fireship-osuuden 10 %:n raja (laivastotaso, sama kuin
muut kokoonpanorajat, joita validaattori ei laske).

## Tarkistukset

`python acceptance.py` korjauksen jälkeen: kaikki tarkistukset LÄPI,
golden 287, tuomio VAKAUTUS KESKEN (ainoa auki oleva kohta on
`share_zip_current`, käyttäjän julkaisuaskel).
