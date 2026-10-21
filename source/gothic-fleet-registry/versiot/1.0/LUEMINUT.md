# Gothic Fleet Registry 1.0 — talletettu versio

Tämä kansio on **jäädytetty kopio julkaistusta 1.0:sta**. Sitä ei muokata. Se on
täällä kahta tarkoitusta varten: 1.1:n rinnalla vertailu, ja paluu taaksepäin jos
1.1 osoittautuu virheelliseksi.

## Mitä täällä on

| tiedosto | mitä |
|---|---|
| `Gothic Fleet Registry 1.0.html` | koko sovellus, 1 325 kB. Avaa selaimessa; toimii ilman verkkoa ja ilman muuta kansiota. |
| `bfg_data-1.0.json` | sama data, jonka build upotti tuohon tiedostoon. Vertailua varten. |

Repositorion juuressa oleva `Gothic Fleet Registry.html` on **buildin tuotos** ja
`.gitignore`ssa: se korvautuu jokaisella `python build.py` -ajolla. Siksi
julkaistu versio on talletettu tänne omalla nimellään.

## Mitä versiota tämä on

- Commit: `7ee4d5f` (sovelluksen koodi ja data ovat samat kuin `9bdc4db`, jonka
  jälkeen on tullut vain dokumentteja).
- Tagi: `v1.0`.
- Rakennettu 11.9.2026 klo 14.10 työpuusta. Mukana on toisen istunnon
  committaamaton yhden rivin muutos komentajakortin pistekenttään
  (`app_template.html`, `commanderCardHTML`) — se on osa julkaistua tiedostoa,
  joten se on myös tässä kopiossa.

## Mitattu tila julkaisuhetkellä

| mittari | arvo |
|---|---|
| Laivastolistoja | 32 |
| Alusprofiileja | 171 |
| Sääntöjä referensseissä | 495 (211 valvottu, 262 näytetään, 22 rajattu ulos, 0 aukkoa) |
| Golden-tapauksia | 355 |
| Tulostus | 1 092 korttia, 0 ylivuotoa, pienin teksti 4,24 pt |
| Stress | 4 612 laivastoa, 0 löydöstä |
| `acceptance.py` | VAKAUTUS KESKEN (ainoa avoin: `share_zip_current`) |

## Miten vertaat 1.1:een

```powershell
# 1.0 rinnakkain kehitysversion kanssa: avaa molemmat eri välilehtiin
start "versiot\1.0\Gothic Fleet Registry 1.0.html"
start "Gothic Fleet Registry.html"

# datan ero kahden version välillä
python -c "import json;a=json.load(open('versiot/1.0/bfg_data-1.0.json',encoding='utf-8'));b=json.load(open('bfg_data.json',encoding='utf-8'));print(len(a['lists']),len(b['lists']))"

# koko koodin ero tagiin
git diff v1.0 -- domain.js build_data.py
```

Selaimen tallennustila on sidottu tiedoston osoitteeseen, joten 1.0:n ja
kehitysversion laivastot eivät sekoitu keskenään.
