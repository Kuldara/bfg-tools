# Tiekartta

Järjestys ei ole toivelista vaan riippuvuusketju: kukin versio poistaa esteen
seuraavalta. Mitatut lähtöluvut ovat `docs/DEVELOPMENT_STATUS.md`:ssä
(generoitu). Valmiuden määritelmät: `docs/DEFINITION_OF_DONE.md` (1.0) ja
`docs/DEFINITION_OF_DONE-1.1.md` (1.1). Vaiheittainen työ:
`docs/SUUNNITELMA-1.1.md`.

**Sääntö säilyy: jokaisen version jälkeen sovellus on käyttökelpoinen ja
julkaisukelpoinen.**

---

## Mitattu lähtötilanne 13.9.2026

| asia | tila | mistä |
|---|---|---|
| DoD-mittarit | 13/14 nollassa tai "kyllä" | `acceptance.py` 11.9. |
| `share_zip_current` | **EI** | ainoa avoin mittari, käyttäjän askel |
| v1.0-tagi | **puuttuu** | `git tag -l` ei palauta v1.0:aa |
| Golden-tapauksia | 355, **kaikki yksikkötasoisia** | `test_golden.js` luo tasan yhden yksikön eikä kutsu `checks()`:ia |
| Osioindeksiviittauksia | **654**, joista nimen kantaa 77 | 361 pickiä + 293 paljasta `sec`-kenttää |
| Reservi-/liittolaisosioita | **18** otsikossa, 14 listalla | niistä **16 ilman yhtään riviä**, 14 ilman sääntöä |
| "not checked by the app" -rivejä | 4 | 3 × gravitic hook, 1 × Dominionin reservit |
| Näytettäviä sääntölauseita | 2 183 (Clanz yksin 177) | listojen tekstit |
| Runkoja | 152, joista 112 esiintyy useammalla listalla | vieras runko on jo arkipäivää |

Kaksi näistä ratkaisee 1.1:n järjestyksen:

1. **1.0 ei ole pelaajien käsissä.** Julkaisematon versio ei tuota palautetta
   eikä käyttäjiä, joten jokainen 1.1:n tunti menee tyhjään yleisöön.
2. **Golden-tapaus ei yllä laivastotasolle.** Jokainen lainalaivasääntö on
   laivastotason sääntö. Ilman laivastotason golden-ajuria 1.1:n keskeisintä
   lupausta ei voi todistaa — ja projektin oma sääntö on, ettei testi, joka ei
   ole ollut punainen, todista mitään.

---

## 1.0 — julkaisu

**Lupaus pelaajalle:** laivastonrakennus, laillisuustarkistus ja pelikuntoiset
kortit 32 listalle, yhtenä tiedostona ilman asennusta.

**Tila:** koodi on valmis ja mitattu. Jäljellä on vain J6: ZIP samasta
commitista, `v1.0`-tagi ja julkaisu Cloudflare Pagesiin.

**Valmis kun:** `share_zip_current` = kyllä, `git tag -l` sisältää v1.0:n ja
julkinen osoite vastaa.

---

## 1.0.1 — julkaisu ja kirjanpito · noin 3–5 h

**Lupaus:** ei uusia ominaisuuksia. Tämä versio siivoaa sen, mikä estää
seuraavan version aloittamisen rehellisesti.

- J6 loppuun (ZIP, tagi, Cloudflare).
- Dokumenttien ristiriidat pois: DoD:n tiivistelmä lupaa mittarin
  `spot_check_open`, jota `acceptance.py` ei raportoi; BACKLOGin v1.1-jonossa on
  kaksi jo tehtyä riviä (Tyranid carapace = J9, kortin PTS-kenttä = J3); J73:n
  sivuviite on 103, oikea on 101; J46:n alakohdat on kirjattu kahdessa paikassa
  eri tavalla.
- Käyttäjän päätökset T26 ja T27 kirjataan.

**Valmis kun:** jokainen DoD:n mainitsema mittari esiintyy myös
`acceptance.py`:n tulosteessa ja päinvastoin; BACKLOGin v1.1-jono vastaa tätä
tiekarttaa.

---

## 1.0.2 — pienet lupaukset · noin 8–12 h

**Lupaus:** neljä asiaa, jotka pelaaja huomaa heti ja jotka eivät vaadi
moottorimuutosta.

| kohta | mistä | miksi nyt |
|---|---|---|
| Laivasto säilyy listaa vaihdettaessa | yhteisöpalaute | Nyt listan vaihto tyhjentää laivaston. Laivastokartta per lista on tallennusmuodon muutos, ei moottorin. |
| "Check yourself" -suodatin | 2 183 lausetta, Clanz 177 | Pelaaja näkee vain ne osiot, joista hänellä on aluksia; koko lista napin takana. Hyödyttää jokaista listaa. |
| Gravitic hook -kapasiteetti valvontaan | 11 runkoa kantaa hook-riviä profiilissa | Lunastaa kolme neljästä "not checked" -varoituksesta. Data on jo olemassa. |
| Ork Clanzin kolme todistettua virhettä | s.371, s.369 | MORE GUBBINS ei kirjan mukaan kuluta Warlordin re-roll-budjettia; Klawsin saattajahinta (+5 per Grunt) puuttuu; referenssi ja data ovat eri mieltä Gubbins-säännön statuksesta. |

**Valmis kun:** `notice`-rivejä 4 → 1, tallennusmuodon migraatio todennettu
molempiin suuntiin, ja jokaisella korjauksella on golden tai testi, joka oli
punainen ensin.

---

## 1.1 — Lainalaivat · JULKAISTU 14.9.2026

**Tila: valmis ja rakennettu.** `APP_VERSION = "1.1"`, jaettava paketti ja
sivustoversio ovat samasta buildista, ja hyväksynnän 20 vaihetta menevät läpi.
Jäädytetty kopio on `versiot/1.1/`. Jäljellä on vain käyttäjän askel:
Cloudflare Pages.

Versiot **1.0.1** ja **1.0.2** ohitettiin: niiden sisältö oli julkaisu ja
kirjanpito, jotka tehtiin tässä samalla. About- ja Guide-osiot oli päätetty
1.0.2:een (`docs/EHDOTUS-about-ja-guide.md`), joten ne siirtyvät seuraavaan
versioon — ne eivät ole 1.1:n lupaus eivätkä estä julkaisua.

**Mitään ei jäänyt kesken.** Viimeisetkin kaksi yleissääntöä (s.14 ja s.16,
päivitykset molemmilta listoilta) ovat valvottuina: käyttäjä ratkaisi ne kaksi
kirjan tulkintakysymystä, jotka estivät työn (T35 ja T37, BACKLOG J117).
`general_rules_open` on **0** ja `acceptance.py`:n tuomio ensimmäistä kertaa
**LAPI**.

**Lupaus:** pelaaja voi lisätä laivastoon aluksia toiselta laivastolistalta
silloin kun kirja sen sallii — ja sovellus laskee ne kirjan mukaan.

**Laajuus on laskettu, ei arvattu.** Kirja rajaa reservit saman rodun listoihin
(s.14–15), mikä tarkoittaa **94 suunnattua listaparia**: Imperial Navy 30,
Chaos 30, Space Marines 12, Orks 6, Rogue Traders 6, Tau 6, Eldar 2, Tyranids 2.
Liittolaissuhteet (esimerkiksi Eldar Corsairs ↔ Iyanden tai Tau ↔ Demiurg) ovat
eri mekanismi ja tulevat listan omina riveinä.

Neljä vaihetta, kukin julkaisukelpoinen:

1. **Varmennuksen edellytys.** Golden-ajuri laivastotasolle ja osion nimi
   jokaiseen 654 indeksiviittaukseen.
2. **Kirjan yleisluku totuudeksi.** Fleets s.14–17 (RESERVES; ALLIES,
   SUBJECTS AND MERCENARIES) omaksi referenssitiedostokseen, listoille rotu.
3. **Moottori.** Yksikkö kantaa oman listansa ja roolinsa; isäntälistan
   kiintiöt laskevat lainalaivat mukaan (s.14: "determined for the fleet as a
   whole"); rotaportti, reservin reservi -kielto, päivitykset molemmilta
   listoilta mutta ei erikoishahmoja lahjoittajalistalta.
4. **Kirjan tapaukset ja käyttöliittymä.** Katalogi vieraille riveille, kortti
   kertoo roolin ja lahjoittajalistan, ja kirjan tapaukset toteutetaan
   järjestyksessä: Inquisition, Chaosin renegaatit, Bastion, Bakka, Dominion,
   Eldar, Rogue Traders ja Tau.

Yksityiskohdat, työmäärät ja vaihekohtaiset valmiuskriteerit:
`docs/SUUNNITELMA-1.1.md`.

---

## 1.2 — ehdokkaat

Ei aikataulua. Järjestys ratkaistaan 1.1:n palautteella.

- **Klaani ja legioona ryhmätasona.** Kirja tekee valinnan Warlordille ja
  skwadronille (s.369), sovellus alukselle. Vaatii ryhmäkäsitteen yksikön ja
  laivaston väliin — sama taso, jota kapitaalilaivueet (s.13) ja komentajan
  sijoitus (J8) tarvitsevat.
- **Kapitaalialusten laivueet** (s.13: 2–4 ja 2–3) rosteriin ja kortille.
- **Liittolaismatriisi** (s.17) ja luonnollisten vihollisten valvonta.
- **Nimetyt tallenteet.** Vienti ja tuonti tiedostona on tehty (J150,
  28.9.2026: Saved fleets -valikon Export/Import, sama dokumentti kuin
  selaimen tallenne). Nimetyt tallenteet listaa kohti jäävät; J20:n neljä
  tilaa ovat tuonnissa yhä avoinna kuten käsin muokatussa tallenteessa.
- **Pelikortti, vaihe 2.** Play-sivu (J149, 28.9.2026) on julkaistu toisena
  tiedostona builderin Play-napin takaa. Jäljellä: jakolinkki tai QR
  puhelimeen (builderin tiedostovienti on tehty, J150),
  ja tarvittaessa upotus samaan tiedostoon play-tilana.
- **Loput valvomattomat säännöt:** yleinen aseluokitus ja profiileista luettava
  hook-kapasiteetti niiltä osin kuin 1.0.2 ei kata.

---

## Mitä ei tehdä

Nämä pysyvät rajauksen ulkopuolella myös 1.1:ssä ja 1.2:ssa. Rajaus on
tuotepäätös, ei puute:

- Kampanjasäännöt ja skenaariot.
- Taistelun aikainen sääntömoottori.
- Tilit ja pilvitallennus.
- Yhden tiedoston jakelumallin purkaminen.
