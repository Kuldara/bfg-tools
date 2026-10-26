# P1-8a · Canonical intent: pysyvät ID:t, adapteri, `domain.js`

**Tila:** valmis 9.9.2026 · **Koko:** keskikokoinen (1 pv) · **Vaikutusluokka:** tallennus + arkkitehtuuri

**Toteutunut:** `domain.js` (adapteri `fromLegacyUnit`/`toLegacyUnit`,
`optionIndex`, `deepFreeze`; `build.py` upottaa `__DOMAIN__`-kohtaan);
`build_data.py` antaa 157 option-ID:tä (`sivu:sha1(norm(koko teksti))[:8]`);
`save()` kirjoittaa `schemaVersion: 2` + `oi`/`oqi`/`on` adapterin kautta,
`load()` ratkaisee ID → teksti (vain yksiselitteinen) → indeksi;
`test_domain.js` (702 väitettä ilman HTML:ää: ID-kaava, adapterin kierros
kaikilla golden-tapauksilla, sekoitettu optiojärjestys, puhtaus, kelvoton
intent) ja `test_save.js` §14–15 (ID voittaa väärän indeksin, tekstivara,
tuntematon optio raportoidaan, v1 → v2). Löydös matkalla: s.255:n kaksi
optiota eroavat vasta 90. merkin jälkeen, joten tiiviste lasketaan koko
tekstistä eikä katkaistusta.

Osa sateenvarjoa [P1-8](P1-8-resolveunit-v1.md). Lue ensin
`docs/SAVE_SCHEMA.md` (§ Päätös 9.9.2026) ja `docs/REVIEW-resolveUnit-v1-Codex.md`
(löydös "V1:n syöte lukitsisi epävakaan tallennusformaatin").

## Miksi ensin

Nykyinen tallenne osoittaa aluksen optioihin indeksillä (`os`, `oq`). Jos v1
rakennetaan sen päälle, "puhdas" ratkaisin on yhä sidottu optioiden
järjestykseen ja kohta 9 joutuisi muuttamaan juuri vakautetun rajapinnan.
ID:t tehdään ennen ratkaisinta.

## Mitä tehdään

1. **Option-ID datassa.** `build_data.py` antaa jokaiselle `ol[i]`-riville
   kentän `id` (ks. `docs/SAVE_SCHEMA.md`: sivu + normalisoidun tekstin
   tiiviste). Assert: ID:t uniikkeja aluksen sisällä. `bfg_data.json`-diff on
   pelkkiä `id`-kenttiä.
2. **`domain.js`-lähdemoduuli.** Uusi tiedosto, jonka `build.py` upottaa
   `app_template.html`:n `<script>`-lohkon alkuun (`__DOMAIN__`-merkki).
   Julkaisu on yhä yksi HTML. Node-testit tekevät `require("./domain.js")`
   suoraan — ei HTML:n pilkkomista, ei DOM-tynkää. Ensimmäinen sisältö:
   `optionId`, `CanonicalUnitIntent`-rakentimet ja adapteri. `build.py`
   assertoi edelleen ASCII:n ja yhden `<script>`-avaustagin.
3. **`CanonicalUnitIntent` + adapteri molempiin suuntiin.**
   `fromLegacyUnit(u, catalog)` ja `toLegacyUnit(intent, catalog)`.
   Adapteri on ainoa paikka, joka tuntee indeksit. Rakenne on
   `docs/DOMAIN_CONTRACT.md`:ssä.
4. **Tallenne kirjoittaa ID:t, lukee ID:t ensin.** `save()` lisää
   `schemaVersion: 2` ja `oi`/`oqi` (ID-avaimiset optiotilat ja määrät);
   `os`/`oq` säilyvät toistaiseksi rinnalla (dual-write), jotta vanha
   versio avaa uuden tallenteen. `load()` ratkaisee option ID:llä → tekstin
   alulla → indeksillä; indeksiin putoaminen kirjataan `LOAD_NOTE`en.
5. **Golden-migraatiotapaus.** Testi sekoittaa aluksen `ol`-järjestyksen
   tarkoituksella (kopio katalogista, ei alkuperäinen), lataa tallenteen ja
   vaatii saman profiilin ja hinnan. Ilman sitä migraatio on toive.
6. **Puhtaustestin runko.** `test_domain.js`: deepFreeze intent + katalogi,
   aja adapteri molempiin suuntiin, todista ettei syöte muutu. Sama runko
   laajenee P1-8b–c:ssä.

## Valmis kun

- `bfg_data.json`: jokaisella `ol`-rivillä `id`; `build_reproducible` kyllä
- `node test_domain.js` ajaa ilman HTML:ää: adapteri round-trip kaikille
  `referenssi/golden_cases.json`-tapauksille (luku tiedostosta) + migraatio
  sekoitetulla järjestyksellä + deepFreeze
- `test_save.js`: uusi tallenne avautuu, vanha (ilman `schemaVersion`)
  avautuu ja saa `schemaVersion: 2` seuraavassa tallennuksessa
- `python acceptance.py` vihreä; 462 + 62 kortista 0 muuttui
- `docs/SAVE_SCHEMA.md` päivitetty toteutuneeseen muotoon

## Älä tee tässä

- Älä siirrä laskimia `domain.js`:ään vielä — se on P1-8b.
- Älä poista `os`/`oq`-kirjoitusta — se poistuu kohdassa 9, kun
  julkaisumigraatio on tehty ja vanhat tallenteet hylätään ilmoituksella.
- Älä keksi ID:itä käsin; ne syntyvät datasta buildissa.
