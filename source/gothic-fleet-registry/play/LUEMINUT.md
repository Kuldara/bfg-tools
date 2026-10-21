# Gothic Fleet Play — pelin aikainen kännykkäkortti (prototyyppi)

Kansio `play/` päähaarassa (alun perin haara `proto/digital-cards`). Ei kosketa
`build.py`:tä eikä `domain.js`:ää; `app_template.html`:ssä on vain Play-nappi.

```
python play/build_play.py       # play/Gothic Fleet Play.html (gitignoressa)
node   play/test_play.js -v     # sääntökerros kirjaa vasten, sivunumeroin + savutesti
node   play/test_play.js --rules   # vain sääntökerros (ei tarvitse rakennettua sivua)
node   play/smoke_play.js -v    # vain savutesti: rakennettu sivu Noden vm:ssä
```

Sivu luetaan samasta originista kuin builder (localhost:8741 tai
bfgtools.kuldare.com), jolloin se lukee builderin tallenteen
(`gothic-fleet-registry-v1`) suoraan — vain lukee, ei koskaan kirjoita.
Toiselle laitteelle laivasto tulee linkissä (latausruudun **to phone** →
QR-koodi), builderin vientitiedostona (**Open a fleet file**) tai liitettynä
tekstinä; ne menevät sivun omaan listaan `gothic-fleet-play-linked`.
Pelitila on omassa avaimessaan `gothic-fleet-play-v1`, sidottuna rosterin
sormenjälkeen.

```
node   play/mittari/tee_tapahtumat.js 3   # simulaattorin peleistä tapahtumanauha (tapahtumat.json)
node   play/mittari/mittaa.js             # syötteet per pelikierros oikeassa Chromessa (375x812)
python play/mittari/qr_check.py           # sivun QR-kooderi reportlabia vasten moduuli moduulilta
```

## Kännykkäkierros 19.10.2026: mitattu, ei arvattu

Käyttäjä pyysi testaamaan pelisivua käytännössä ja parantamaan sitä niin,
että vahvuudet paperikortteihin nähden vahvistuvat ja heikkoudet
tilkitään. Mittari ensin (`mittari/LUEMINUT.md`): simulaattori pelasi
Joonan seitsemän 1200-listaa (3 peliä kukin, 21 peliä, 1 021
vauriotapahtumaa), ja sama tapahtumanauha toistettiin vanhalla ja uudella
sivulla oikeassa Chromessa puhelimen koossa. Luku on syötteitä (napautus
tai pyyhkäisy) per pelikierros, ilman pelattu-merkkejä:

| ruutu | vanha | uusi, täysi näkymä | uusi, tiivis näkymä |
|---|---|---|---|
| 360×640 | 13,0 | 9,7 (−25 %) | 9,0 (−31 %) |
| 375×812 | 11,0 | 9,0 (−18 %) | 7,5 (−32 %) |
| 412×915 | 10,1 | 8,7 (−14 %) | 6,7 (−34 %) |

(Kaikki koot ja pelattu-merkkien hinta: `mittari/LUEMINUT.md`.) Vanhan
sivun rivi oli 264–519 px, ja koko rosteri 2,6–4,7 ruutua: 25.9.
paneelin peruste "kaksi riviä mahtuu aina" (155–265 px) ei enää pitänyt
asetaulukon tultua riville. Suurin kulu oli aseiden etsiminen vierittämällä.

**Mitä tehtiin**

- **Yläpalkki yhdelle riville** (87 → 57 px): vuoro, näkymä (Compact),
  Undo, Menu. INFO ja paluu builderiin ovat valikossa.
- **Asetaulukko kuten tulostetulla kortilla** (käyttäjä 19.10.2026:
  *"samantyyliset aserivi uudistukset kuin korteissakin. eli vasen/oikea
  yhdistykset ja kantamien erottelu"*). Sivu ei laske näitä itse, vaan lukee
  kortin omat tiedot ratkaistulta riviltä (`R.weapons`, sama suodatus ja
  järjestys kuin `PLAY.armament`illa):
  - **Port/starboard-pari** (v1.2 J188, `domain.js pairRows` →
    `weapons[].pair`): kaksi riviä omine niminensä ja kaarineen, yksi
    korkea merkki, yksi kantama ja yksi voima, jonka alla *each*; parin
    rivien välissä ei viivaa. Ensimmäinen versio yhdisti parin yhdeksi
    "P+S"-riviksi, mutta se on juuri se suunta, jonka käyttäjä hylkäsi
    korteilta (*"tosi busy näköinen ja levoton"*), joten se korvattiin.
    Kortin malli maksaa mittarissa 0,1 syötettä per kierros enemmän.
    Pelisivulla pari pätee vain, kun kummallakin sivulla on sama nykyarvo
    eikä kumpaakaan ole vaiennettu: kritti, joka vaientaa toisen sivun
    (s. 67), purkaa parin, jotta yliviivattu rivi näyttää kumman.
  - **Kantama värikehyksessä** (v1.2 J183, `domain.js rangeCell` →
    `weapons[].range`): kaistat 15/30/45/60 cm ja yli kortin väreillä,
    yksikkö otsikossa *Range cm*. Solu, joka ei ole yksi kantama
    (laukaisuhallien aluksien nopeudet, Contact), on tekstiä kuten
    kortilla. Tiiviin näkymän sirussa sama kehys pienempänä.
  - **Pitkä nimi lyhenee kortin säännöllä** (v1.2 J186): yli 22 merkin
    nimessä *Starboard → Stbd*, koko nimi vihjeenä (`title`). Muuten
    nimi rivittyisi puhelimella toiselle riville.
  - Taulukon rivit tiivistyivät (solu 4 → 3 px, kaari 20 px).
- **Tiivis näkymä** (Compact, laitekohtainen `gothic-fleet-play-view`):
  rivillä nimi, Ld, CRIT, pelattu-merkki, statsirivi, **aseiden yhden rivin
  kooste** (merkki, voima nyt, kantama, kaari — puolitettu kriittivärillä,
  vaiennettu yliviivattuna), osumarata ja chipit. HIT +1 ei toistu: radan
  ruutu on jo yksi napautus. Nimet ja säännöt ovat kortilla (nimestä).
  Ilman asekoostetta tiivis näkymä maksoi 18,4/kierros (kortti auki ja
  kiinni joka katsomiselle), koosteen kanssa 7,5 (375×812).
- **Hyppynauha** alapalkissa (täysi näkymä): yksi siru per yksikkö, tila
  värinä (crippled, poissa, pelattu); napautus vie rivin yläpalkin alle.
  Käyttäjän oma ele saa vierittää (30.9.), render ei koskaan.
- **End Phase -paneeli** alapalkin napista: vain laivat, joilla on
  korjattavaa; jokainen korjaus yksi napautus (s. 88), korjauskelvoton
  (tähti, s. 67) sanotaan eikä tarjota; lopuksi "Fire not put out: +N"
  (s. 67). Kortin miinus (T24) jää väärän napautuksen korjaukseksi.
- **Laivasto puhelimeen.** Latausruudun builder-laivaston vieressä
  **to phone**: QR-koodi linkistä, jossa laivastodokumentti kulkee
  deflate-pakattuna base64url-muodossa (`#fleet=`; ilman
  CompressionStreamia `#fleetj=` pakkaamatta). Mitään ei lähetetä minnekään
  — linkki on laivasto. Kun sivu ajetaan levyltä tai localhostista, linkki
  osoittaa julkaistuun sivuun (bfgtools.kuldare.com), koska puhelin ei näe
  kumpaakaan. QR-kooderi on sivulla itsellään (ISO 18004, byte-tila, taso
  L kun se on pienempi kuin M, muuten M (J209); tarkistettu reportlabia vasten:
  `mittari/qr_check.py`, 152 tapausta, versiot 1–40, 0 eroa). 1200–1500
  pisteen laivasto on versio 17–25. Lisäksi **Open a fleet file** (builderin
  Export file) ja liittäminen; kaikki menevät sivun omaan listaan.
  Builderin Saved fleets -paneelissa on samat linkit (J207: Copy, To phone,
  Copy all, All to phone; J208: nimetty kirjasto, Export all as file). Linkin
  laivastot kantavat nimensä, ja pelisivu pitää ne omassa *Saved fleets*
  -listassaan (`gothic-fleet-play-linked`, 40 viimeisintä); samalla laitteella
  latausruutu näyttää myös builderin kirjaston (`gothic-fleet-registry-saves-v1`)
  nimineen ennen listojen muokattavia laivastoja.
  Puhelimesta puhelimeen (J209): oman listan jokaisella laivastolla on **to
  phone** (QR tämän puhelimen ruudulle, Copy link, Share) ja listan alla **All to
  phone**. QR-koodi on pienin mahdollinen versio (taso L, kun se on pienempi kuin
  M), koska toinen puhelin lukee isommat moduulit paremmin. QR-kooderi ja pakkaus ovat siksi
  `app_template.html`:ssä yhtenä lähteenä, ja `build_play.py` poimii ne
  pelisivulle (`PHONE_LINK`, `b64url`, `packFleet`, `unb64url`, `unpackFleet`,
  `QR`, `qrSvg`, `qrFull`).
  **Full screen** (J210): napista tai koodin napautuksesta koodi valkoiselle
  kerrokselle suurimpana mahtuvana, Smaller/Bigger 30–100 % kymmenyksin, koko
  muistetaan (`gothic-fleet-qr-full`). Sulkee vain Close tai Esc — toisen
  puhelimen kosketus koodiin ei saa viedä sitä.
  Valikon **Fleets and phone link** vie laivastolistaan (ja sen QR-koodeihin)
  kesken pelin: tallenne jää, ja lista tarjoaa Resume-napin (käyttäjä
  19.10.2026). Ennen tätä listalle pääsi pelin aikana vain *New game*
  -napilla, joka hävitti tallenteen.
- **Laivojen nimet alkuruudussa** (J211, käyttäjä 19.10.2026): Set up
  -ruudun laivan nimi on kirjoituskenttä. Nimi kuuluu vain tähän peliin
  (`G.nm` rivin indeksillä), builderin laivasto ei muutu; tyhjä kenttä palauttaa
  vanhan nimen. Uusi nimi näkyy kaikkialla `unitName`in kautta (rivit,
  hyppynauha, End Phase, raportti).
- **Näyttö pysyy päällä** pelin ollessa auki (Screen Wake Lock), valikosta
  pois laitekohtaisesti (`gothic-fleet-play-awake`).
- **Ruudun vaihto alkaa ylhäältä** ja ottaa napautuksia vasta 0,4 s
  päästä: setup avautui ennen puolivälistä, ja "ei tapahtunut mitään"
  -tuplanapautus valitsi Ld:n seuraavalta ruudulta (mitattu 19.10.).
  Kortti aukeaa samalla suojalla.
- **Kortin sulkeminen palaa samaan kohtaan.** Vanha sivu vieritti rosterin
  alkuun kortin avautuessa (todettu vanhalla sivulla: 1372 → 0 px), ja
  laiva piti etsiä uudestaan.
- **Peliraportti** valikossa BFG Meta Almanacin pohjalla
  (`meta-tietokanta/lisää dataa/FLEET_REPORT_TEMPLATE.md`): vastustajan
  laivasto, voittaja, skenaario ja huomiot syötetään, loput (pisteet, päivä,
  menetykset, luovutetut VP:t, lista A builderin `listLineOf`illa) tulevat
  tallenteesta. Copy / Share. Ei nimiä.
- **Asennettava sivu** (vain julkaistu sivusto, `julkaisu/make_site.py`):
  manifest, kuvakkeet ja service worker play/-kansioon; sivu haetaan aina
  ensin verkosta ja tallennettu käytetään vain ilman verkkoa (testattu
  paikallisesti: palvelin alas, sivu ja peli aukesivat). Kotinäytöltä
  avattuna ei osoitepalkkia. CSP on nyt polkukohtainen: play/ saa
  `worker-src`, `manifest-src` ja `connect-src 'self'`, muu sivusto pitää
  `connect-src 'none'`. Kehitysversio ja jaettava tiedosto pysyvät yhtenä
  tiedostona.
- **G-kirjaimen piilovalikko ja valmiit rosterit poistettu sivulta**
  (käyttäjä 19.10.2026). `rosters.json` jää mittarin testiaineistoksi.

**Mitä ei tehty, ja miksi**

- Näkymää ei vaihdeta automaattisesti vuoron mukaan, eikä vaihtoa
  suositella: mitattuna puolivuoroittainen vaihto (10,6/kierros 375×812:lla) maksoi
  enemmän kuin säästi.
- Pelattu-merkki maksaa mittarissa 7,1 syötettä per kierros (kaksi
  napautusta per alus per vuoro), eli enemmän kuin kaikki vauriot yhteensä.
  **Käyttäjän päätös 19.10.2026: pysyy kahden napautuksen mallina**
  (1. napautus liikkunut, 2. ammuttu, 25.9.): *"se on optionaalinen
  muistiapu"*. Hinta ei ole kirjauksen hinta, koska merkkiä ei ole pakko
  käyttää, joten mittari vertaa lukuja ilman sitä. Älä ehdota yhden
  napautuksen merkkiä uudestaan.
- Oletusnäkymä on yhä täysi (aseiden nimet näkyvät). Tiivis on mitattuna
  halvempi; vaihto on yksi napautus ja muistetaan laitteella.

## Rajaus 28.9.2026: spekit + HP + kritit, tokenit pöydälle

Käyttäjän linjaus: tärkein silmukka on katsoa oman laivan spekit — etenkin
aseet, joita ei muista — ja kirjata HP ja kritit. Käskyt, brace, kilvet,
blast-merkit ja ordnancen lataustila seurataan tokeneilla pöydällä, joten
ne poistettiin käyttöliittymästä. Rivillä on nyt statsirivi nykyarvoin,
asetaulukko (merkki, nimi, kantama, Str, ½-sarake, kaari), osumarata ja
krittichipit; napit ovat HIT ja CRIT. ½-sarake kertoo puolitetun arvon
mistä syystä tahansa (crippled s. 65, brace s. 47, käskyt s. 46) ja
korostuu kun laiva on crippled; sijaintikritti (s. 67) yliviivaa rivin.
Escort-laivueen alukset ovat samoja numeroruutuja kuin osumarata (täytetty
= tuhoutunut) ja Str-sarake näyttää alus × elossa = yhteensä (s. 99).

`play_rules.js` säilyttää käskyt, bracen, blast-merkit ja ordnance-liput
testattuina. Valikon **Tracking**-osiosta (⋯) ne voi kytkeä päälle: "Track
everything" tai yksitellen (käskyt & brace, kilvet & blast-merkit, ordnancen
lataus, laivaston laskurit). Asetus on laitekohtainen (`gothic-fleet-play-
track`), ei pelitallenteessa, ja oletus on kaikki pois — OFF-tila on tuote,
eikä sitä sotketa: pois kytketty seuranta myös nollaa vastaavan tilan
(`normaliseUntracked`), jotta sen luvut eivät vaikuta. Käskyseuranta päällä
alapalkissa on END TURN / START TURN -pari (bracen kesto, s. 47), muuten
NEW TURN, joka nollaa pelattu-merkit.

## Läppäri ja laivueen taulukko (28.9.2026)

Leveydestä 900 px ylöspäin rosteri on ruudukko (sarakkeet 400 px:n
mukaan, tiiviimpi rivikorkeus kuin kosketuksella). Ruudukko vierii
normaalisti, ja lisäksi alapalkin ‹ 1 / 3 › -napit hyppäävät ruudullisen
kerrallaan: sivu on vierityskohta, josta kokonainen rivistö alkaa
(`paginate()` mittaa kortit renderöinnin jälkeen), ja sivunumero seuraa
vieritystä. Kapeammalla ruudulla sivutus on piilossa.

Laivueen otsikkorivillä yhdistetty tuli on sama taulukko kuin aluksilla,
mutta vain summattavat järjestelmät: patterien FP ja lanssien Str — yksi rivi per asetyyppi ja kaari; eri kantamat samalla rivillä vyöhykkeinä ("18 within 30 · 12 to 60 cm" = mitä ampuu tuolle etäisyydelle) —
kaarittain ja kantamittain sekä torpedot ja laukaisuhallit yhdeksi salvoksi/aalloksi base-kontaktista (s. 99, T18); jokaisen aluksen luku on sen oma
nykyarvo (crippled puolittuu yksitellen), ½-sarake on yksittäin
puolitettujen summa. Nopat (Orkkien gunz) eivät summaudu ja jäävät
alusten omille riveille; jos mikään ei summaudu, rivi sanoo sen.

## Mikä tämä on ja mikä ei

Kirjaa, ei tuomitse. Kortti kirjaa sen, mitä pöydässä tapahtui (osumat,
kritit, käsky, brace, blast-merkit, laukaistu ordnance) ja näyttää sen,
minkä kirja johtaa niistä (crippled-vaikutukset, kilvet nyt, Ld-tarkistuksen
luku, nousun arvo, korjausnopat, luovutetut VP:t). Se ei heitä noppaa eikä
ratkaise osuiko laukaus — "taistelun aikainen sääntömoottori" on roadmapin
rajauksen ulkopuolella, ja tämä pysyy rajauksen sisällä.

## Suunnittelupäätökset (paneeli 25.9.2026: 4 suunnittelijaa, 3 tuomaria)

Mittari: "kaikki käyttäjän syöte on virhe" — napautukset, pyyhkäisyt ja
vieritykset laskettiin kymmenelle tavalliselle pelitapahtumalle.

- **Pohja on rosteri, ei kortti.** Jokaisella rivillä on omat napit (HIT,
  BRACE, ORDER, CRIT), joten laivojen välillä ei plärätä: huomion siirto
  laivasta toiseen on silmänliike, ei napautus, kun rivit ovat samalla
  ruudulla. Mitattu 25.9. (katselmointi): kapitaalirivi on 155–265 px, joten
  390×844:llä kaksi vierekkäistä riviä mahtuu aina ja 375×667:llä vain
  pienemmät; kauempana olevat rivit maksavat yhden vierityksen. Yhden laivan
  näkymä maksoi paneelin laskuissa 27–39 syötettä kymmeneen tapahtumaan,
  rosteri 22–24.
- **Kortti on alalehti**, joka aukeaa rivin nimestä: tilastot nykyarvoin,
  aserivit nykyarvoin, kritit vaikutuksineen ja korjaus, numeroitu osumarata
  crippled-nauhoineen. Sama data, samat värit (`factionCols`, `wepClass`) ja
  sama kriittitaulukko kuin tulostettavalla kortilla.
- **Säännöt ovat oma taso.** INFO-kytkin näyttää sääntötekstit, crippled-
  rivin, korjausrivin, koko kriittitaulukon ja käskyjen kuvaukset; oletuksena
  ne ovat piilossa, ja valinta muistetaan laitteella. Optiot ja päivitykset
  eivät näy pelissä lainkaan — ne ovat jo profiilissa.
- **Pelattu-merkki** rivillä: 1. napautus = liikuttu, 2. = ammuttu, ja
  START TURN nollaa kaikki. Pelaamattomat laivat erottuvat.
- **Ld aina näkyvissä** rivin laatassa: Command checkin luku isolla ja
  muunnokset pienellä (-1 under fire, +1 enemy contacts, -3 bridge).
- **Luokka- ja asekoodaus** rivillä: BB / GC / CR / ESC-laivue ja aseryhmät
  kortin väreillä (WB, LAN, TORP, BAYS, NOVA …) nykyarvoineen.
- **Kapitaalilaivueet** ovat pelitilan ryhmä (kirjain A/B/C setupissa):
  yksi Ld (korkein elossa, s. 95), yksi käsky ja brace koko ryhmälle, ja
  ryhmän otsikkorivillä yhdistetty tulivoima kaarittain (s. 99).
- **Oletus on onnistuminen.** Käskyn tai bracen napautus kirjaa sen
  julistetuksi ja läpäistyksi; epäonnistuminen on erillinen FAILED-nappi.
  Yleinen tapaus maksaa yhden napautuksen, ja koko laivaston lukitseva
  virhenapautus ei ole viereisessä puolikkaassa.
- **Kaksi vuoronappia:** END TURN (oman vuoron loppu: bracet, jotka kestävät
  "seuraavan vuoron loppuun", päättyvät) ja START TURN (s. 51: käskynopat
  pois, lukko auki, pelattu-merkit nollaan). Ilman vuoron loppua brace
  näkyisi yhden vihollisvuoron liian pitkään.
- **Ei noppia.** Kaikki neljä suunnittelijaa ja tuomarit: heitto pitää nähdä
  pöydässä.
- **Undo** on yksi nappi ylhäällä (30 askelta).

## Sääntötulkinnat (Rulebook v1.10, sivut)

| # | kohta | ratkaisu |
|---|---|---|
| T1 | Kilvet ja blast-merkit | Yksi luku laivaa kohti: rungossa kiinni olevat Blast Markerit. Kilpi asettaa merkin jokaisesta torjutusta osumasta (s. 70) ja jokainen merkki vie kilven tulituksessa (s. 69), joten "kilpiä pystyssä" = kilvet − merkit, eikä erillistä käytetty-laskuria ole. Kilvet palaavat vain kun laiva liikkuu merkeistä pois (s. 70) — MOVED CLEAR on oma napautus, ei vuoron vaihto. |
| T2 | Epäonnistunut Brace | Lukitsee bracen tätä hyökkääjää vastaan (s. 47) **ja** laivaston muut käskyt tällä vuorolla (s. 48: epäonnistunut Command check), koska Brace on Command check. Brace itse on lukosta vapaa (s. 48). |
| T3 | Bracen kesto | "Until the end of its next turn" (s. 47): päättyy END TURN -napautukseen sinä vuorona, ei seuraavan vuoron alkuun. Vihollisen vuorolla otettu brace kestää oman seuraavan vuoron loppuun. |
| T4 | Kritit, joita ei voi soveltaa | s. 67: korjaamattomaan kohtaan toistuva tulos sovelletaan seuraavana tuloksena — toinen 9 on 10, toinen 10 on 11 — ja aseistus, jota laivalla ei ole (kirjan esimerkki: ei dorsal-aseita → 3 starboard), samoin. Ld −3 vain kerran. Jos seuraava tulos on 11 tai 12, kortti kysyy heiton ensin (`critTarget`). |
| T5 | Muiden taulukoiden kritit | Eldarin, Necronin, Tyranidin ja hulkkien taulukot (`R.damage.critical`) laskevat tulokset ja korjaukset, mutta standarditaulukon vaikutukset (ei käännöksiä, −10 cm, Ld −3, kilvet 0, ampumakiellot) sovelletaan vain kun otsikko on `CRITICAL DAMAGE (2D6)`. |
| T6 | Kritin lisävahinko | 6 ja 8 (+1) lisätään automaattisesti — se on kirjan aritmetiikkaa, ei tuomitsemista, ja säästää napautuksen. 11 ja 12 (+D3/+D6) kysyvät heiton tuloksen. Tulipalon vahinko End Phasessa ei ole automaattinen (korjausheitto on välissä): rivin FIRE-merkki on nappi "FIRE ×N · +N hits", N = korjaamattomien tulipalojen määrä (s. 67: kritit kasautuvat, jokainen tulipalo vie osuman). |
| T7 | Escort-laivueen "crippled" | Ristiriita: s. 57 "at least half ... destroyed (rounding down)", s. 123 "loses half of its ships, rounding up". 5 laivan laivueessa 2 vs 3. Prototyyppi käyttää **s. 57:ää** (irtautumisen oma sääntö) irtautuneen laivueen VP:ssä; escort-laivue luovuttaa pisteitä muuten vain kokonaan tuhoutuneena (s. 123). Kirjattu, ei valittu hiljaa. |
| T8 | Lippulaivan Ld | Fleets-kirjan komentajarivi "improves its Leadership to the value shown" (esim. Imperial Navy s. 35): kiinteä arvo korvaa heiton, muunnos (+1, max 10) lisätään heitettyyn. |
| T9 | Hulkin VP | Hulkki on tuhoutunut laiva (täydet pisteet, s. 123). "Holding the field" 50 % on kentän haltijan bonus, ei luovutus; sitä ei lasketa prototyypissä. |
| T10 | Laivaston ordnance-raja | Ilmassa olevat attack craft -merkit vs. elossa olevat (crippled-puolitetut) laukaisuhallit (s. 73) on yläpalkin laskuri, jota pelaaja päivittää. Torpedoilla ei rajaa (s. 73). Nopalla ilmaistu hallimäärä (Ork D3+1) näkyy laskurissa "+?"-merkkinä. |
| T11 | Komentajan pisteet VP:ssä | s. 123: tuhoutuneen tai irtautuneen laivan arvoon lasketaan "any Admiral, Warmaster or Chaos Lord on board". Lippulaivan VP-rivit saavat komentajan pisteet mukaan (`conceded(R, st, plus)`). |
| T12 | Necronin reaktiivinen runko | Fleets s. 402: 4+/5+/6+ save "is treated in the same manner as a brace save" — ei kilpi, ei puolitu, ei kulu blast-merkeistä; näytetään tekstinä. Sama sivu: "immune to Damage, Leadership and Movement modifiers from ... Blast Markers" → ei Under Fire −1. Damage control -noppien puolitus blast-merkeistä (s. 88) jää toistaiseksi standardina — avoin. |
| T13 | Noppavahvuudet laivueen tulessa | Orkkien gunz (D6+2, Fleets s. 360) ei ole luku: yhdistetyssä tulessa (s. 99) numerot summataan ja nopat luetellaan rinnalla ("WB 12 + D6+2 + D6+2"), escort-laivueella "D6×3". |
| T15 | Necronin Portal | Fleets s. 401: käskyt eivät rajoita, mutta crippled tai braced puolittaa **alaspäin**; molemmat → ei Portal-hyökkäyksiä. |
| T16 | Necronin Star Pulse | Fleets s. 400: ei toimi crippledinä eikä millään käskyllä (myös Lock On). |
| T17 | Vanhat tallenteet | Ennen 28.9. tallennettu peli (blast, käsky, brace laskuissa) siivotaan jatkettaessa: sivu ei enää omista niitä kenttiä. |
| T18 | Laivueen yhdistetty ordnance | s. 99: torpedot ja attack craft yhdistyvät yhdeksi salvoksi/aalloksi vain base-kontaktista — laivueen taulukko näyttää summan merkinnällä "base contact". Orkkien torpedo launchat eivät yhdisty koskaan (Fleets s. 360, kortin sääntörivi): ne eivät lisää mitään summaan ja escort-rivillä lukee "separate". Nova cannoneja ei yhdistetä. |
| T14 | Squadronin Ld ja Under Fire | s. 95: "even if only some of the ships in a squadron have Blast Markers" — yksikin merkitty jäsen tuo −1:n laivueen korkeimpaan Ld:hen. |
| T19 | Catastrophic Damage 0 osumassa | Kun capital ship putoaa nollaan, kortille aukeaa itsestään sen oma taulukko luvut valmiiksi laskettuina **aloitusosumista** (s. 71): Rulebook 2D6 (2–6 drifting hulk, 7–8 blazing hulk, 9–11 plasma drive overload: ½ hits Blast Markeria ja lance-osumat Str ½ hits, 12 warp drive implosion: hits BM ja Str hits); 3D6 kun laivan sääntö niin sanoo (Mercury Fleets s. 64, polttoainetankkeri s. 182; yli 12 = 12); Tyranidit oma taulukko (Fleets s. 423: 2–7 drifting carcass, 8–9 death throes = heittää uudestaan joka liikkeen jälkeen, 10–11 biological eruption, 12 bio-plasma detonation); ja ilman heittoa neljäksi Blast Markeriksi ne alukset, joiden oma vahinkolohko niin sanoo — kivialukset (Rok Fleets s. 393, Warsphere s. 495, Stryxis-karavaani s. 197) ja Nicassar Caravan (s. 492, oma sivu, ei kivialus). Tunnistus on aluksen omasta tekstistä, ei nimestä. Boarding-actionissa nollaan ajettu laiva on drifting hulk ilman heittoa (s. 90), oma nappi. Pelaaja napauttaa heiton rivin; kortti muuttuu hylyksi: nimi yli, ikoni (drifting / blazing / gone), kirjan rivi ja hylkyrivi (ei kilpiä/holofieldejä, turretit 0, osutaan alkuperäiseen Armouriin, heitto tälle taulukolle joka kerta kun vihollisen alus/laivue/ordnance-aalto tekee osumia — kuinka monta tahansa, s. 71), ei spekseja eikä aseita, CATASTROPHIC-nappi jää. Huom: s. 71:n "roll once … each time hits are inflicted" koskee kaikkia hylkyjä, ei vain palavaa; blazing heittää lisäksi joka liikkeen jälkeen. Popoverissa koko lista: ajelehtii 4D6 cm + BM; ei kilpiä, pommittajat eivät vähennä turretteja, peittää ampumalinjat; kohdistus (ei Ld-testiä ohittaa lähimpänä, normaali testi kun ei lähin; torpedot eivät ohita, boarding-torpedot saavat, ohjatut väistävät s. 77–78); omat eivät saa ampua/boardata (harhautuneet omat torpedot osuvat, s. 71) — **Necronit saavat** (Fleets s. 402), **Mechanicus** Ld-testillä omaan *drifting*-hylkyyn (Fleets s. 118); VP: kentän haltija saa puolet hylyn arvosta, myös omista (s. 123). Räjähdys on aluevaikutus: holofield ei suojaa, kilvet suojaavat; yksi BM paikalle, loput viuhkana kiinni (s. 71). Space hulkit (Chaos Fleets s. 288, Ork s. 391): 9–11 hajoaa asteroidikentäksi D3×5 cm ilman vahinkoa, 12 warp rift. **Puolustukset eivät ajaudu** (s. 101: "defences never drift, they always remain in place", Blackstone kirjan esimerkki): drifting/blazing-rivit ja hylkyrivi sanovat "stays in place"; blazing heittää uudestaan joka Movement phasessa siinä missä laiva olisi liikkunut (tulkinta). **Tähtilinnake** (Ramilies Fleets s. 500–505; Fortress-Monastery viittauksella s. 110, `R.stats.quadrant`): kortilla on 8.10.2026 alkaen kaikki neljä kvadranttirataa (T29; sitä ennen yksi) — kvadrantti ei nollassa ota enempää vahinkoa ja on asteroidikenttä (s. 501); linnake itse heittää D6:n omalla taulukollaan (1–2 Wrecked paikallaan, 3 15 cm asteroidikenttä, 4–5 hyper-plasma meltdown, 6 warpbubble implosion, s. 505) vasta kun kaikki neljä kvadranttia ovat nollassa (s. 502) — taulukko aukeaa vasta silloin, ja popover sanoo säännön. Tyranidien popover ei väitä kilpien suojaavan: rivi 12 sanoo päinvastoin (Fleets s. 423). Kun heiton tulos on kortilla, hylyn osumarataa ei enää muokata napautuksella (HIT/rata ohittavat) — UNDO on tie takaisin; taulukon rivin voi valita vain 0 osumassa, ja UNDO sulkee taulukon, jos laiva ei enää ole nollassa. |
| T20 | Amiraali lippulaivan kortilla | Komentaja ei ole oma rivi rosterissa vaan CMD-rivi lippulaivan kortilla (nimi, Ld-muunnos, re-rollit) — kortti, joka pelataan, kantaa sen, mitä sen kannella on. Komentajan pisteet lasketaan lippulaivan VP:hen (T11). |
| T21 | Laivueen summa seuraa alusten tilaa | s. 99 summaa jokaisen aluksen *nykyarvon*: tuhoutunut (s. 71 "no hits left … out of action"), hylky (s. 71) tai irtautunut (s. 57, poistettu pöydältä) jäsen ei ole summassa ja otsikko sanoo "N of M firing"; jäsenlistassa poissa oleva on yliviivattu syineen, crippled merkitty (arvot puolittuvat yksitellen, s. 99). Kritin (s. 67) vaientama ase näkyy rivin alla yliviivattuna nimen ja syyn kanssa, jotta summan pudotus näkyy. Laivueen Ld ohittaa myös irtautuneen (s. 95). Kaikki poissa → "No ship left firing". Nopilla ilmaistut vahvuudet (Orkkien gunz) eivät katoa taulukosta hiljaa: alarivi sanoo "Rolled ship by ship, not summed" (Fleets s. 360, T13). Orkkien gunz ovat weapon batteryja (Fleets s. 360) ja summautuvat batteryriville; heavy gunz (joka osuma 2 osumaa, s. 360) ja bombardment cannonit summautuvat omille riveilleen, koska niiden osumat eivät voi jakaa gunnery-heittoa tavallisten kanssa. |
| T22 | Necronien luovuttamat VP | Fleets s. 402 "count up the Necron losses": irtautunut vahingoitta 10 %, irtautunut vahingoittuneena tai irtautunut raider 25 %, crippled 50 %, tuhoutunut 200 %, drifting-hylkynä jätetty 300 % (blazing = "not left as a drifting hulk" = 200 %, kunnes ajautuu). Tuhoutunut raider normaalisti 100 %. Menu > VP käyttää samaa `conceded`-laskua, ja kortin VP-rivi viittaa siihen sivuun, josta luku tulee (`concededPage`: Necronit Fleets s. 402, escort s. 57 ja 123, muut s. 123). |
| T23 | Tyranidien itsetuho | Fleets s. 418: Tyranidien boardaama capital ship voi End Phasessa Ld-testillä tuhota itsensä (D6 1–3 plasma drive overload, 4–6 warp drive implosion). Ei kortilla: se tapahtuu ennen 0 osumaa eikä ole 0-osuman tilaa; kirjattu tähän. |
| T24 | Kritin miinus | Kritiikkitaulukon jokaisella tuloksella on plus ja heti sen vieressä miinus (käyttäjä 30.9.). Taulukon alla ollut koonti ja sen REPAIR-napit poistettiin: miinus on nyt sekä pelin korjaus (damage control, s. 88) että väärän napautuksen korjaus. Siksi miinus vähentää vain tuloksen, ei koskaan osumia — korjaus ei paranna vauriota; väärin napautetun tuloksen oma +1 osuma (6 Engine, 8 Thrusters) lähtee UNDOlla tai osumaradalta. Miinus vähentää myös tuloksen, jota pelissä ei voi korjata (9, 10, s. 67): se on pelaajan kirjanpitoa, ja taulukon tähti muistuttaa säännöstä. Kun tulosta ei ole aluksella, miinus on selvästi pois käytöstä. Tulipalojen End Phase -osumat lisätään rivin FIRE-merkistä (T6). |
| T25 | Re-rollit sanoin ja Abaddonin vuorokohtainen | Komentajan re-rollit näytetään builderin omalla lauseella (`DOMAIN.rerollText`): mitä hinta jo sisältää, mitä ostettiin päälle ja kirjan rajaus (käyttäjä 5.10.). Komentajattomalla laivastolla on oma re-rollinsa (Necrons s. 404, Demiurg s. 486 "The fleet gets one re-roll"): RR-laskuri näkyy myös niillä, eikä sitä menetetä lippulaivan mukana, koska lippulaivaa ei ole. Abaddonin re-roll on "1 per turn" (Fleets s. 231: "Abaddon's fleet is allowed to re-roll a single Command check or Leadership test each turn"). Vuoro on yhden pelaajan vuoro (s. 50), ja re-rollin voi käyttää myös vastustajan vuorolla (Brace for Impact -tarkistus, s. 47), joten laskuri palaa yhteen sekä oman että vastustajan vuoron alussa. Tulkinta: jos pelaatte niin, että "turn" on koko kierros, vähennä laskuria käsin. Muiden komentajien re-rollit ovat kerran pelissä (Fleets s. 11) eivätkä palaa. |
| T26 | Re-roll-ruudut | Jokaisella re-rollilla on oma ruutunsa (käyttäjä 5.10.: "rastiruudut rerollien träkkäämiseen, hintaan kuuluvat ja ostetut erivärisinä"): napautus merkitsee juuri sen ruudun käytetyksi, toinen napautus palauttaa sen (väärä napautus). Väri ja sana kertovat alkuperän: *incl.* kuuluu hintaan, *bought* on ostettu builderissa, *option* on listan avoin optio, joka otettiin käyttöön pöydässä, *added* on laskurin plussalla lisätty (esim. sub-plotin lisä-re-roll, s. 127). Katkoviivaruutu on avoin optio: sitä ei ole laskettu laivaston pisteisiin, ja napautus tekee siitä oman ruutunsa (jokainen ruutu vaihtuu vain vapaan ja käytetyn välillä: katselmointi 5.10. osoitti, että kolmas “pois”-tila antoi käytetyn re-rollin takaisin vapaana, kun harhanapautusta korjattiin samasta kohdasta; väärin käyttöön otettu optio perutaan UNDOlla tai rastitaan käytetyksi) — sivu ei muuta rakennettua laivastoa eikä sen pisteitä, se vain kirjaa. Avoimista saman ryhmän riveistä tarjotaan suurin (One / Two / Three extra = kolme ruutua). Aluksella voi olla myös omia re-rolleja (Scion of Prospero s. 258: kaksi hinnassa; Mark of Tzeentch s. 234 “This ship has an extra re-roll”; Fortress-Monastery s. 111 “usable only by the fortress-monastery itself”): ne ovat aluksen kortilla omalla rivillään “Ship's own re-rolls” eivätkä kuulu laivaston pooliin. Tyranidien Hive Mind Influence -re-rollit (s. 430) ovat laivaston pooli kuten Necronin ja Demiurgin. Ruudut ovat lippulaivan kortin CMD-rivin alla; muun komentajan (Veteran Captain s. 38, Farseer s. 318, toinen Warlord) omat ruudut ovat hänen omalla rivillään, koska ne eivät ole laivaston yhteisiä; komentajattoman laivaston ruudut ovat Fleet re-rolls -rivillä. Yläpalkin RR-laskuri (Tracking päällä) näyttää saman poolin: miinus käyttää ensimmäisen vapaan ruudun, plus palauttaa viimeksi käytetyn tai lisää ruudun. Bridge Smashed lippulaivalla (s. 67) lukitsee kaikki ruudut. Jos 9 oli väärä napautus ja se otetaan miinuksella pois, ruudut palaavat ennalleen. Laivaston komentaja on se komentaja, joka on laivastoLISTASSA ensin (Admiral ennen Veteran Captainia, Warmaster ennen Chaos Lordia, Autarch ennen Farseeria) — ei rosterin ensimmäinen, koska rosterin järjestys on pelaajan. Laskurin miinus peruu ensin oman plussansa. Abaddonin vuorokohtainen ruutu palaa NEW TURNissa; ilman Orders-seurantaa sivulla ei ole vastustajan vuoron alkua, joten ruutu napautetaan silloin itse takaisin (teksti sanoo sen). Ennen ruutuja tallennettu peli saa ruudut lukemansa päälle (`PLAY.adoptRerolls`). |
| T27 | Yhden osuman yksiköt ovat jäsenmalli | Planeettapuolustukset 8.10.2026 (Fleets s. 496–517). Builder kertoo kentällä `R.squadron`, että yksikkö on N kerrallaan ostettuja yhden osuman kappaleita: kirjan Escort-tyypit ja yhden osuman puolustukset (Rulebook s. 100: “1HP defences grouped in up to six units”; alustat Defence/1 Fleets s. 509–511, siilot ja lentotukikohta Ground/1 s. 517). Kuusi alustaa = kuusi ruutua: osuma tai kritti tuhoaa YHDEN (s. 66), ei osumarataa, ei krittitaulukkoa, ei Catastrophic-heittoa. `PLAY.isEscort` on nimestään huolimatta tämä jäsenmalli; tyyppiregex jäi varalle käsin tehtyjä testitynkiä varten. **Korjattu vika:** escort-laivueen viimeinen menetys ilmoitti “roll 2D6 on the Catastrophic damage table”. Escort ei heitä: “When an escort is destroyed, replace it with a Blast Marker” (s. 71) — ilmoitus sanoo nyt sen, eikä taulukkoa avata. **Kirjan aukko:** yhden osuman puolustukselle s. 101 antaa heiton vain “defence with multiple hits” -kohteille, mutta kirja ei sano, jääkö tuhoutuneesta alustasta Blast Marker (s. 71 puhuu escorteista). Sivu sanoo vain “no roll (p. 101)” eikä keksi merkkiä. |
| T28 | Puolustusten luovuttamat VP | s. 123, “Escort Ships, Orbital Defences and Other Vessels”: “Each destroyed planetary defence installation earns a player a number of victory points equal to the installation's points value. Each destroyed escort earns its value in victory points provided the entire escort squadron is destroyed.” **Luenta:** paikallaan pysyvä puolustus (`R.defence.stationary`) on installation. (1) Yhden osuman alustat, siilot ja lentotukikohdat luovuttavat pisteensä kappale kerrallaan (yksikön pisteet / kappaleet × tuhotut) — ei kaikki tai ei mitään kuten escort-laivue. (2) Monen osuman asema, telakka, Blackstone, Tau-orbitaali ja Haven luovuttavat pisteensä vasta tuhoutuneina; **crippled ei luovuta mitään**, koska 25 % on samalla sivulla nimenomaan “If a capital ship is crippled”. Vaihtoehtoinen luenta (ei valittu): s. 101 “these work just like capital ships” → 25 %; s. 101 rajaa lauseen kuitenkin vahingon ottamiseen (“When it comes to taking damage”). Jos pelaatte toisin, lisätkää 25 % käsin; koodissa ratkaisu on yksi rivi (`conceded`: `isInstallation`). (3) Tähtilinnake on tuhoutunut vasta kun kaikki neljä kvadranttia ovat nollassa (Fleets s. 502) — crippled tai tuhottu kvadrantti ei luovuta mitään; komentajan pisteet mukaan kuten lippulaivalla (T11). (4) Defence Monitor, System Ship ja Fire Ship ovat tyyppiä Escort/1 (Fleets s. 514–516), joten niihin sovelletaan escort-lausetta: pisteet vasta kun koko laivue on tuhottu, irtautuminen kuten escorteilla (s. 57). Vaihtoehto (ei valittu): nekin ovat “planetary defences” ja maksaisivat alus kerrallaan. (5) **Kirjan aukko:** itsensä räjäyttänyt Fire Ship (s. 516) — kirja ei sano, onko se “destroyed” VP:n kannalta (miinoilla on oma lauseensa, fire shipillä ei). Sivu ei erota ammuttua räjäytetystä: rastitettu = poissa, ja laivue maksaa kun kaikki ovat poissa. (6) Yksittäin ostetut orbitaalimiinat: “count for victory points when destroyed, regardless of how they are removed from play” (Fleets s. 512) — jokainen rastitettu miina on pisteensä (5). Miinakenttää ei tuhota vaan tukahdutetaan, ja siitä vapautetut miinat “do not normally count for victory points” (s. 513) → miinakenttä ei luovuta mitään. Sivun VP-summa laskee nyt kaikki rivit (`vpTotal`), ei vain aluksia. |
| T29 | Tähtilinnakkeen neljä kvadranttia | Fleets s. 501–505 (Fortress-Monastery samoin, s. 110–111). Pelitilassa `st.quads` = neljä {hits, crits} ja `st.qsel` = valittu. **Nimet NW / NE / SW / SE** ovat tulostetun kortin: kirjan kaavio s. 501 nimeää kvadrantit North/East/South/West ja piirtää telakointilaiturit niiden väliin; käyttäjän fyysisessä mallissa laiturit ovat pääilmansuunnissa ja kvadrantit niiden välissä. Valittu kvadrantti on se, jonka radan, kilvet, turretit, kvadranttiaseet, kritit ja korjausnopat (s. 502 “Damage control is also undertaken individually”) kortti näyttää ja johon seuraava HIT/CRIT menee (“All damage and criticals only affect the quadrant that they are inflicted against”, s. 501). Valinta on näkymän valinta, ei tapahtuma: se ei vie UNDO-askelta eikä sulje auki olevaa taulukkoa. Kvadrantti on crippled kuudessa osumassa (“crippled individually once they are reduced to 6 Damage Points”, s. 501) ja nollassa poissa: lisäosumat eivät tee mitään ja se on asteroidikenttä (s. 501) — sen aseet vaikenevat, kilvet ja turretit 0, HIT-nappi pois käytöstä. Linnake tuhoutuu vasta kun kaikki neljä ovat nollassa (s. 502); vasta silloin aukeaa D6-taulukko (s. 505), ilman alusten “Boarded to 0” -nappia, koska linnaketta saa boardata vain space hulk (s. 502, s. 111). **Basilica-rivit** (`zone: "basilica"`) kuuluvat koko linnakkeelle. Tulkinta: kvadrantin crippled ei puolita niitä (kirja ei sano tätä erikseen; se seuraa s. 501:n lauseesta, että vahinko koskee vain osuman saanutta kvadranttia). Brace puolittaa ne (“as normal”, s. 503) ja kritti 11 missä tahansa kvadrantissa vie ne (“the Basilica weapons are lost”, s. 505) — tämä yksi linnakkeen kritin vaikutus on johdettu, muut lasketaan ja näytetään (T5): 6 Reactors, 9 Command Tower −2 Ld, 10 Shields ja 11/12:n “every quadrant D3/D6” tehdään käsin kvadrantti kerrallaan. Boarding-arvo: kaikkien kvadranttien jäljellä olevat osumat + boardatun kvadrantin turretit (s. 502). **Vanha tallenne** (yksi rata): osumat ja kritit siirtyvät NW-kvadrantille (`PLAY.adoptUnit`); jos tallenteessa oli jo Catastrophic-tulos, pelaaja oli julistanut linnakkeen tuhotuksi, ja se pysyy tuhottuna (kaikki neljä nollassa) tuloksineen. |
| T30 | Kiinteä Leadership | `R.leadership.kind === "fixed"` aluksella: 7 planeettapuolustuksille — “do not roll for leadership or have a leadership value … on a nominal leadership of 7” (Rulebook s. 100; sama laatikossa Fleets s. 499) — ja 10 Fortress-Monasterylle (“base leadership of 10”, Fleets s. 111). Asetusruudussa pilleri arvolla, syyllä ja sivulla, ei noppalaattoja, eikä yksikkö estä pelin aloitusta; Ld-ponnahdus näyttää yksikön oman sääntörivin. Ramilies heittää (“rolled as for a capital ship”, s. 503) ja Haven heittää (s. 336). Ennen 8.10. tallennetussa pelissä Fortress-Monasterylle napautettu arvo vaihtuu kirjan 10:een. **Ristiriita Fleets s. 499:** vasemman palstan lopussa, “In a campaign” -kappaleen perässä, on irtolause “However, they automatically pass any other leadership tests they may be required to make”, kun taas saman sivun laatikko ja Rulebook s. 100 sanovat “They also make all other leadership checks they may have to make against Ld 7”. Sivu näyttää builderin sääntörivin (Ld 7); ristiriita on kirjattu, ei ratkaistu hiljaa. Komentaja linnakkeessa: hänen oma arvonsa korvaa linnakkeen (“their own Leadership value is used by the fort”, s. 503; Fortress-Monastery “even if less!”, s. 111); kun hän siirtyy pois, linnake saa oman arvonsa takaisin. |
| T31 | Käskyt, joita yksikkö saa ottaa | `R.orders` rajaa käskyvalikon, `canOrder`in ja INFO-taulukon: puolustuksilla vain Reload Ordnance ja Brace (Rulebook s. 100), Ramiliesilla, Fortress-Monasterylla ja Havenilla myös Lock On (Fleets s. 503, 111, 336). Syy ja sivu näytetään yksikön omalla sääntörivillä (`R.rules`, slot “orders”) — sivu ei kirjoita sääntöä uudestaan. Linnakkeen kvadranttikohtaiset käskyt (“split orders”, s. 503) eivät ole seurannassa: sivulla on yksi käsky ja yksi brace koko linnakkeelle. |
| T32 | Kenen kyytiin komentaja | Vain capital ship, tähtilinnake (“Fleet Commanders may be placed aboard a Ramilies”, Fleets s. 503; “aboard a fortress”, s. 111) tai Haven (“can lead the battle aboard it instead of a ship”, s. 336 — tunnistus Havenin omasta sääntörivistä, koska builderilla ei ole tälle kenttää). Ei koskaan alusta, asemaa, Blackstonea, lentotukikohtaa tai puolustusalusta: niillä ei ole Ld-arvoa lainkaan (Rulebook s. 100). Oletuslippulaiva on suurin oikea capital ship; linnake vasta kun aluksia ei ole; muuten ei ketään (komentaja jää omalle rivilleen). Tähtilinnake ei saa SQN-nappia (“A Ramilies Star Fort cannot squadron with other orbital defences”, Rulebook s. 100). Ramiliesin oma re-roll (s. 503) tulee builderista aluksen omana rivinä; sääntöä “added to the commander's own re-rolls” ei yhdistetä pooliin — komentajan ollessa kyydissä molemmat ruuturivit ovat samalla kortilla. |
| T33 | Paikallaan pysyvä puolustus | `PLAY.isStill`: builderin `R.defence.stationary`, muuten profiilin nopeus 0 tai viiva. Nopeus “0” ilman cm:ää (Fleets s. 506–511, 517) luetaan numerona; crippled ei koskaan näytä −5 cm:ää (s. 65:n vähennys on liikkuvan aluksen; “Satellite units may not move”, Rulebook s. 100; “defences never drift, they always remain in place”, s. 101). Rivillä lukee STATIONARY nopeuden ja käännösten paikalla; pelattu-merkki kulkee TO PLAY ↔ SHOT ilman MOVED-tilaa. **Tulkinta:** irtautumiskytkimiä ei näytetä — irtautumistesti tehdään “at the end of its Movement Phase” (s. 56), ja yksikkö, joka ei liiku, ei voi poistua pöydältä. D6 Blast Marker -poisto End Phasessa (Rulebook s. 101; Ramilies koko linnakkeesta s. 502; Haven s. 336) on yksikön sääntörivi (INFO ja blast-ponnahdus), ei laskuri. **Defences Critical Hits Table** (Rulebook s. 101): builder antaa sen monen osuman paikallaan pysyville puolustuksille otsikolla, joka ei ala “CRITICAL DAMAGE”, joten alusten taulukon vaikutukset (ei käännöksiä, −10 cm, Ld −3, sijaintiaseet) eivät osu niihin — testattu. T5:n mukaisesti tulokset lasketaan ja näytetään, mutta taulukon omia vaikutuksia ei johdeta: 10 ei nollaa kilpiä, 6 ei puolita kilpiä ja turretteja, FIRE-merkki ei ole nappi, ja rivien 6 ja 8–9 “+1” napautetaan radalle käsin. 11 ja 12 kysyvät D3/D6:n kuten ennen. |
| T34 | Sääntökortit: miinat, miinakentät, fire shipit | Rungoton rivi, jolla on `R.ruleCard`, on oikea rivi: nimi, määrä, pisteet, sivu ja yhden lauseen kuvaus; nimestä aukeaa kortti, jolla ovat kaikki askeleet (`R.ruleCard.steps`, otsikko + teksti — builderin teksti, sivu ei kirjoita sääntöä itse), ja INFO päällä askeleet näkyvät myös rivillä. Orbitaalimiinoilla on rasti per miina (rasti = miina on poistunut pelistä, T28). Miinakentällä on määrä ja huomautus koosta, joka heitetään asettelussa (D3 × 5 cm kahdesti, Fleets s. 513) — kokoa, havaintoheittoja ja kentästä vapautettuja miinoja ei kirjata. Fire Ship on alus (Escort/1, s. 516): jäsenruudut kuten laivueella, asetaulukon paikalla “No armament” ja sen askeleet aina näkyvissä rivillä ja kortilla. |
| T35 | Attack craft -raja puolustuksilla | Tracking “Fleet counters” päällä: `PLAY.launchBays` laskee laivueen jokaisen elossa olevan jäsenen hallit (kaksi lentotukikohtaa 2 × 4, Fleets s. 517) ja linnakkeen kaikkien kvadranttien hallit — crippled puolitettuna, tuhottu nollana — Ramiliesilla kaksinkertaisena (“up to twice the attack craft markers as the number of launch bays it has remaining”, Fleets s. 502), Fortress-Monasterylla ei (“Use the value listed in its profile”, s. 111; tunnistus builderin sääntörivistä). |
| T36 | Savutesti | Mikään ei aiemmin ajanut `play_template.html`:ää. `play/smoke_play.js` lataa RAKENNETUN sivun Noden vm:ään tynkä-DOMilla ja pelaa neljä laivastoa läpi: Imperial Navy, jossa on komentaja, capital ship, escort-laivue ja listan jokainen PLANETARY DEFENCES -rivi; Space Marines Crusade (Fortress-Monastery, vanhan tallenteen jatkaminen); Eldar (Haven); Tau (orbitaalit). Jokainen asetusruutu, rivi, kortti (INFO päällä ja pois, seuranta päällä ja pois), ponnahdus ja valikko piirretään; testi kaatuu poikkeukseen tai “undefined”/“NaN”-tekstiin, ja lisäksi tarkistetaan kirjasta luetut asiat (sivu väitteessä). `test_play.js` ajaa sen lopuksi (`--rules` ohittaa). Rakennetun sivun pitää olla tehty nykyisistä lähteistä; vertailu on sisällöstä, ei aikaleimoista: sivun pitää sisältää `domain.js`, `play_rules.js` ja data sellaisinaan, mallin jokainen pala ja ne `app_template.html`:n lohkot, jotka `build_play.py` poimii (lista luetaan `build_play.py`:stä). Muutos `app_template.html`:n muihin kohtiin ei siis tee sivusta vanhaa; muuten testi on punainen ja käskee ajaa `build_play.py`:n. Uusi puolustusrivi tulee savutestiin itsestään. Samalla korjattiin kaksi mallin vanhaa vikaa, jotka savutesti toi esiin: kortin SPEED-ruutu näytti aina yliviivatun perusarvon (“20 cm ~~20~~”), ja Fleets-kirjan sivut näkyivät ilmoituksissa ilman kirjan nimeä (“p. 423”). |
| T40 | Ld-valinta 5–10, ei automatiikkaa | **Käyttäjän päätös 13.10.2026:** *”playstä jätetään kyl täysin out of scope mikään ld luvun automaatio. vain simppeli valinta käyttäjältä”* — pelaaja valitsee arvon ja tekee siihen liittyvät laskut itse. **Valikko.** Asetusruutu ja Ld-ponnahdus tarjoavat arvot 5–10 (`PLAY.LD_VALUES`) jokaiselle heittävälle yksikölle: Rulebookin taulukko antaa 6–9 (s. 45), Orkit, merirosvot ja transportit 5–8 (“a Leadership range of 5 to 8”, Fleets s. 358; s. 178, s. 85), Adeptus Mechanicus 7–9 (s. 118), Eldar ja Dark Eldar 7–10 (s. 302, 342), Space Marinet 8–10 (s. 94) ja “Grey Knights count as Space Marines in all respects” (s. 144); mikään ei nouse yli 10:n (Rulebook s. 48). Yhdessä laivastossa on usean taulukon aluksia, joten valikkoa ei kavenneta aluskohtaisesti. **Ei johdeta.** Aluksen oma +1 (Emperor s. 53, Oberon s. 56, Nicassar Caravan s. 492): sivu lisäsi sen itse yhden päivän (BACKLOG J196) ja se poistettiin samana iltana (J198) — pelaaja valitsee suoraan arvon, jolla alus testaa. Samasta syystä ei mallinneta Demiurgin kiinteää aloitus-Ld:tä ja sen laskua vaurioista (s. 488–490), transporttien −1:tä (s. 85, 289, 333, 476), Chaos Space Hulkin −1:tä (s. 287), Dhow'n Ld:tä emoaluksesta (s. 491), Sepulchren Ld 10:tä (s. 400), Veteran Captainia (s. 38) eikä Inquisitorin aluksen +1:tä (s. 140–142). Aiempi tulkinta (komentajan arvo korvaa aluksen luontaisen Ld:n ja aluksen +1 jää päälle) raukesi: sivu ei laske kumpaakaan yhteen. **Valikon ulkopuolella.** Tyranidien Vanguard-laivueen Ld on laivueen jäljellä olevien alusten määrä (s. 429), joten se voi olla alle 5; sitä ei valita valikosta vaan luetaan pöydältä. **Ennallaan, käyttäjän vahvistamana 14.10.2026** (*”ei poisteta”*; tehty ennen J196:ta, ks. T8): komentajan Ld-rivi lippulaivalla, puolustusten kiinteä Ld 7 (Rulebook s. 100) ja Fortress-Monasteryn Ld 10 (Fleets s. 111), laivueen korkein Ld (s. 95) sekä seuratun Bridge Smashed -kriitin −3 (s. 67). |

| T41 | Tulipalo ja korjaus joka End Phasessa | s. 88: "Both players can attempt to repair critical damage during the End Phase" ja s. 67 Fire!: "Roll to repair (extinguish) the fire in the End Phase, if it is not put out it causes one point of extra damage and keeps burning". **Luenta:** End Phase on jokaisen pelaajan vuoron lopussa, ja molemmat korjaavat siinä, joten tulipalo voi polttaa kahdesti kierroksessa (simulaattori tekee samoin: `endPhase` korjaa kaikki elossa olevat). Siksi FIRE-nappia ei lukita vuoroksi; se laskee, montako kertaa palot lisättiin tällä vuorolla ("added 2× this turn", J192:n laskurimalli), ja väärä napautus perutaan UNDOlla. Järjestys End Phase -paneelissa on kirjan: korjaukset ensin (s. 88 kohta 2), sitten palavat palot (s. 67). |
| T42 | Builderin laivueet alkavat SQN-ryhminä | J222 (20.10.2026): builder tallentaa yksikölle laivuetunnisteen `sq` (J216; sama kirjain = sama laivue, `docs/SAVE_SCHEMA.md`). Uusi peli (`newGame` → `builderGroups`, myös linkillä tai liitetyllä laivastolla) antaa SQN-ryhmän niille aluksille, joille Set up tarjoaa SQN-napin (`sqnShip`: capital ship, ei escort eikä tähtilinnake, Rulebook s. 100). Tunniste, joka on vähintään kahdella tällaisella aluksella, saa kirjaimen A–C builderin tunnisteiden aakkosjärjestyksessä (builderin B ja D → A ja B), koska sivulla on kolme SQN-kirjainta ja niiden värit. **Rajaukset:** yksinäinen tunniste (Clanzin yhden kroozerin skwadron s. 372 tai kesken jäänyt laivue) ei tee ryhmää, koska yhden aluksen ryhmä ei muuta pöydällä mitään; neljäs ja sitä seuraavat laivueet alkavat ilman ryhmää; escort-laivue ja Blood Axe -tiddlan kommandeeratut saattajat (J220) pysyvät omina yksikköinään kuten ennen. Sivu ei valvo laivuetta: laivue, jonka builder näyttää punaisena (esim. battleship ja grand cruiser yhdessä, Fleets s. 13), alkaa silti ryhmänä, koska se on pelaajan tallentama laivasto. SQN-nappi muuttaa ryhmää kuten ennen, ja jatkettu peli pitää omat ryhmänsä (`G.grp` pelitallenteessa). Savutesti: kaksi C-tunnisteista Lunaria samassa ryhmässä; tunnisteeton Lunar, yksin E-tunnisteinen Lunar ja C-tunnisteinen escort-laivue ilman ryhmää. |

## Mitä ei seurata, ja miksi

- Torpedosalvojen ja attack craft -merkkien vahvuus pöydällä (s. 76–77): ne
  ovat pöydän esineitä, ei laivan tilaa.
- Turrettien sitominen torpedoihin vs. attack craftiin per Ordnance Phase
  (s. 80): pieni, kerran per vaihe ja pöydässä ilmeinen.
- Formaatiossa/ei formaatiossa (s. 96), grapple (s. 90), teleport käytetty
  (s. 92): jätetty prototyypistä; merkintä NOTES-kenttään.
- Tähtilinnakkeesta (kvadranttien osumat ja kritit seurataan, T29):
  kvadranttikohtaiset käskyt (s. 503), kvadranttikohtaiset blast-merkit ja
  kilvet (s. 502 — seurannassa on yksi merkkilaskuri koko linnakkeelle),
  massatut turretit (s. 502), pyöriminen (s. 502), telakointi (s. 503) ja
  kritin 11/12 “jokaiselle kvadrantille D3/D6” (s. 505, käsin).
- Defences- ja Star Fort -krittitaulukoiden omat vaikutukset (Rulebook
  s. 101, Fleets s. 505): tulokset lasketaan, vaikutukset tekee pelaaja
  (T33) — poikkeuksena Basilican menetys kritistä 11 (T29). Orbit Lost
  -putoaminen D6 cm/vuoro on pöydän asia.
- Miinakentän koko, havaintoheitot ja kentästä vapautetut miinat (Fleets
  s. 513): eivät ole VP:tä eivätkä yksikön tilaa (T34).
- Matalan kiertoradan pöytä (Fleets s. 498): siilot ja lentotukikohdat
  ovat rivejä kuten muutkin; sivu ei tiedä, kummalla pöydällä ne ovat.

## Valmiit rosterit

`play/make_rosters.js` lukee Joonan 1200- ja 1500-rosterit (käsin kirjattu
työkirjasta `fleet rosterit Kalle ja Joona/Joona_BFG_fleet_rosterit_v22_ork_alt_da_slow_n_furius.xlsx`)
ja ajaa ne rakennetun builderin läpi (`addUnit`, `addUnitFrom` reserveille,
`setOptState`, `setUpState`, `setHull`, `save`) → `play/rosters.json`.
Rostereita on 21: alkuperäiset 7 laivastoa × 1200/1500 (v14, ennallaan v22:ssa),
19.10.2026 lisätyt Bastion, Dark Eldar ja Tau × 1200/1500 sekä Ork-vaihtoehto
"Da Slow 'n' Furius" 1500. Uudet ovat tiedoston lopussa, jotta vanhojen
järjestys ei muutu. Pisteet verrataan taulukkoon; erot:

- World Eaters 1190/1480 (taulukko 1200/1490): Chosen Terminators +10 vaatii
  builderin lukemana World Eaters -miehistön ensin (Fleets s. 224–225).
- Tyranids 1500: builder laskee 25 escortia, katto 2 × 12 (rosteri kuten
  taulukossa, huomautus näkyy).
- Escort-laivueet on jaettu enintään kuuteen (Orks 1500 Onslaught 5+3,
  AdMech 1500 Hunter 4+3 ja Gladius 6+3); Eldarin sekalaivueet 2+2 ovat
  builderissa neljä yksikköä, koska yksi yksikkö on yhtä luokkaa.
- Bastion Fleet 1500: Power Ram (+5) yhdelle Endeavourille vaatii 6+ keulan
  (Fleets s. 32). Endeavour ottaa siksi ilmaisen 6+-keulaoptionsa (s. 72,
  käännös 45°), vaikka taulukko ei sano keulasta mitään. 1500 kuten
  taulukossa J223:sta (20.10.) alkaen; ennen sitä builder luki keulan
  perusprofiilista ja antoi 1495.
- Orks Da Slow 'n' Furius 1500: hulkin Warlord ottaa rivin "Extra Power
  Fields (Space Hulk)" +50 (s. 390) ja on sijoitettu hulkille, Terror #1:n
  Warlord Terrorille (`aboard`). 1500 kuten taulukossa J224:stä (20.10.)
  alkaen; ennen sitä 1475.

19.10.2026 alkaen rosterit eivät ole sivulla: käyttäjä poisti G-kirjaimen
piilovalikon. `rosters.json` on syötemittarin (`mittari/`) testiaineisto:
samat Joonan 1200-listat ovat simulaattorissa, joten simuloidun pelin
tapahtumat osuvat rosterin yksiköihin.

Ajo: `python build.py && node play/make_rosters.js`.

## Julkaisu

Osa päähaaraa 28.9.2026 (J149, vaihtoehto A): builderin **Play**-nappi avaa
`play/Gothic Fleet Play.html`:n samasta osoitteesta, `julkaisu/make_site.py`
kopioi sen `site/play/`-kansioon ja `acceptance.py` rakentaa sen (BUILD
PELIKORTTI) ja ajaa `test_play.js`:n (PELIKORTTI). Kehityksessä:
`http://localhost:8731/Battlefleet%20Gothic/fleet%20builder/play/Gothic%20Fleet%20Play.html`.
Jaettavaan ZIPiin pelisivu menee `play/`-alikansiona builderin viereen.

## Tiedostot

| tiedosto | mitä |
|---|---|
| `play_template.html` | sivun runko: HTML + CSS + käyttöliittymä-JS, merkit `__TOKENS__ __FONTS__ __DOMAIN__ __PLAYRULES__ __SHARED__ __DATA__ __VERSION__` |
| `play_rules.js` | puhdas sääntökerros pelitilan yli, `require`ttava; sivut kommenteissa |
| `test_play.js` | sääntökerros kirjaa vasten; jokainen tarkistus osoitettu punaiseksi ennen toteutusta tai mutaatiolla; ajaa lopuksi savutestin |
| `smoke_play.js` | savutesti: rakennettu sivu Noden vm:ssä, yksi yksikkö jokaista lajia (T36) |
| `make_rosters.js` → `rosters.json` | Joonan rosterit builderin moottorilla; mittarin testiaineisto (ei enää sivulla) |
| `mittari/` | syötemittari: `tee_tapahtumat.js` (simulaattorin pelit → `tapahtumat.json`), `mittaa.js` (toisto Chromessa), `qr_check.py`; ks. `mittari/LUEMINUT.md` |
| `build_play.py` | kokoaa yhden tiedoston; poimii `resolveSaved`in, `factionCols`in, `arcGlyph`in ym. sekä teeman tokenit `app_template.html`:sta buildin aikana, joten kopioita ei ole |
