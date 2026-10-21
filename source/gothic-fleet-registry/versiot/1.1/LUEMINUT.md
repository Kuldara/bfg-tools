# Gothic Fleet Registry 1.1 — talletettu versio

Tämä kansio on **jäädytetty kopio julkaistusta 1.1:stä**. Sitä ei muokata. Se on
täällä kahta tarkoitusta varten: 1.2:n rinnalla vertailu, ja paluu taaksepäin jos
1.1 osoittautuu virheelliseksi.

## Mitä täällä on

| tiedosto | mitä |
|---|---|
| `Gothic Fleet Registry 1.1.html` | koko sovellus, 1 442 kB. Avaa selaimessa; toimii ilman verkkoa ja ilman muuta kansiota. |
| `bfg_data-1.1.json` | sama data, jonka build upotti tuohon tiedostoon. Vertailua varten. |

## Mikä muuttui 1.0:sta

**Lainalaivat.** Laivastoon voi ottaa aluksia toiselta laivastolistalta, ja
sovellus laskee ne kirjan mukaan. Kirjan lause on s.14: *"the restrictions on
maximum and minimum numbers of ships are determined for the fleet as a whole,
regardless of whether they were purchased from the list or as reserves."*

Pelaajalle se näkyy näin:

- Katalogin yllä on **lähdelistan valitsin**. Sen vaihtaminen ei vaihda laivaston
  omaa listaa, vaan vain sen, mitä vasemmalla tarjotaan.
- Vieraan listan alus saa **roolin**: *reserve* samalle rodulle, *ally* eri
  rodulle. Roolin voi vaihtaa aluksen riviltä.
- Alus pitää **lähdelistansa hinnan, optiot ja päivitykset**, ja sen kortti kertoo
  roolin ja lähdelistan.
- Laillisuustarkistus valvoo s.14:n 1:3-suhteen alustyypeittäin, tyyppiportin,
  s.15:n rotuportin, s.17:n liittolaismatriisin sekä listakohtaiset luvat ja kiellot.
- Vieraalta listalta ei tarjota komentajaa (s.14: *"may not take any special
  characters from the reserve fleet list"*).

**Tallennusmuoto 3.** Lainalaiva säilyy tallenteessa. Oman listan laivaston
tallenne on tavulleen sama kuin 1.0:ssa, joten vanha tallenne latautuu
sellaisenaan. 1.0 ei avaa 1.1:n tallennetta vaan ottaa varmuuskopion ja kertoo
siitä — se on suunniteltu käytös.

## Mitattu tila julkaisuhetkellä

| mittari | arvo |
|---|---|
| Laivastolistoja | 32 |
| Alusprofiileja | 171 |
| Sääntöjä referensseissä | 508 (234 valvottu, 255 näytetään, 18 rajattu ulos, 0 aukkoa listakohtaisissa) |
| Golden-tapauksia | 358 yksikkötasolla + 86 laivastotasolla |
| `test_domain.js` | 4 641 tarkistusta |
| Satunnaisajo | 5 971 laivastoa, 106 748 tarkistusta, 0 löydöstä |
| Tulostus | 1 442 korttia, 0 ylivuotoa, pienin teksti 4,24 pt |
| Hyväksyntä | 24/24 vaihetta läpi, tuomio LAPI |

## Ketkä voivat liittoutua

Fleets s.17 sanoo: *"no vessel can be allied to a fleet for which it is a natural
enemy, nor can it ally itself to a fleet that already contains allies for which it
is a natural enemy."* Kuka on kenenkin luonnollinen vihollinen, luetaan **ALLIES
MATRIX** -taulukosta.

Se taulukko **ei ole** Fleets Book WIP v0.36:ssa: otsikko on, sivu on muuten tyhjä.
Mutta se on julkaistu — Battlefleet Gothic: Remasteredin oma verkkoversio palauttaa
sen ja merkitsee lähteen itse: *"Editor's note: The following was taken from the 2010
FAQ."* Sanatarkka teksti ja alkuperä ovat repossa tiedostossa
`referenssi/liittolaismatriisi_2010_faq.txt`.

Koska **se ei ole kirjan sivu**, sovellus näyttää näiden rivien lähteeksi
*Allies Matrix (2010 FAQ)* eikä sivunumeroa. Pelaaja näkee siis mihin sääntö nojaa.

Pelaajalle tämä näkyy niin, että esimerkiksi Imperial Navy saa liittolaisekseen
Corsair Eldarin, Tau:n, Space Marinesin ja Rogue Traderit, mutta ei Chaosta, Dark
Eldaria, Craftworld Eldaria eikä orkkeja. Space Marine -liittolainen sulkee muut
pois Rogue Tradereja lukuun ottamatta. Necronit ja tyranidit eivät liittoudu
kenenkään kanssa, kummassakaan suunnassa.

Yksi lause kantaa pidemmalle kuin pari: *“Rogue Traders … may not take Xenos
vessels when allied with Space Marines.”* Se koskee koko laivastoa, joten Rogue
Trader -laivasto, jolla on Space Marine -liittolainen, ei saa pitää
Xenos-aluksia — myöskään omiaan.

Suhde on molemminpuolinen: liitto on laillinen vain jos **kumpikin** puoli sallii
sen. Järjestys on listan oma sääntö (esim. Crusade-listan kielto, s.99) → matriisi
→ s.14:n 1:3-budjetti.

## Päivitykset molemmilta listoilta

Kirjan s.14 sanoo: *"Reserve vessels may take any upgrades, refits, etc. available
to either fleet list but may not take any special characters from the reserve fleet
list to use with the primary fleet."* Molemmat puolet ovat voimassa.

Lainalaiva saa siis myös **isäntälistan** koko laivastolle tarkoitetut päivitykset,
ei vain lähdelistansa. Sitä rajaa s.16: vain jos listat ovat **samaa rotua**. Rotu on
pelitekninen ryhmä eikä biologinen laji — kirja erottaa Imperial Navyn ja Space
Marinesin vaikka molemmat ovat ihmisiä.

Sama päivitys molemmilla listoilla tarjotaan **kerran**: *"either fleet list"* koskee
saatavuutta, ei määrää.

Erikoishahmoa ei saa lähdelistalta lainkaan. Katalogi ei anna komentajalle plus-nappia
vieraalta listalta, ja se kerrotaan rivillä.
