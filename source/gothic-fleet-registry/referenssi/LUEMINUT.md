# Käsin tehdyt referenssit

Tämä kansio on **kirjasta käsin luettu totuus**, jota vasten sovelluksen
generoitu data tarkistetaan. Se ei ole generoitu tiedosto: jokainen rivi
on luettu PDF:stä ja kirjattu tänne tarkoituksella.

Miksi: sovelluksen data syntyy jäsentimestä, ja jäsennin voi hiljaa
muuttua. Ilman kiinteää vertailukohtaa regressio näkyy vasta pelaajalla.
Auditointityö olisi myös haihtunut heti kun se on tehty — nyt se jää.

## Kansion sisältö

| tiedosto | mitä | tarkistin |
|---|---|---|
| `NN_nimi.json` | yhden laivastolistan säännöt ja rivit | `check_reference.py` |
| `golden_cases.json` | odotustapaukset, ajetaan kaikkia pintoja vasten | `test_golden.js` |
| `optiot.json` | aluksen optioiden vaikutukset | `audit_effects.py` |

Tiedostonimen kuvio ratkaisee: `check_reference.py` lukee vain
`NN_*.json`-tiedostot, joten muu kirjasta luettu totuus voi asua samassa
kansiossa omalla skeemallaan. Skeemat ovat `docs/RULES_TRUTH.md`:ssä.

## Rakenne

Yksi tiedosto per laivastolista, `NN_nimi.json`:

```
{
  "list":       täsmälleen sama nimi kuin bfg_data.json:ssa
  "book_page":  listan aloitussivu kirjassa
  "read_pages": sivut jotka on luettu tätä tiedostoa varten
  "read_on":    päivämäärä
  "rules":      koostumussäännöt kirjan sanamuodossa
  "entries":    listan valittavat rivit, nimi + hinta + profiilisivu
  "notes":      havainnot joita ei voi koodata säännöiksi
}
```

Rivillä voi olla lisäkenttiä:

| kenttä | merkitys |
|---|---|
| `sec`  | rajaa haun yhteen osioon — sama nimi ja hinta voi olla monessa |
| `mx`   | rivikohtainen määräraja, esim. `0-1` kirjan rivin edessä |
| `grp`  | rivi kuuluu poissulkevaan ryhmään; `true` = mikä tahansa ryhmä |
| `page` | profiilisivu; tarkistin vertaa sovelluksen korjattuun viitteeseen |

Säännöllä voi olla `kind` ja sen parametrit (`min`/`max`, `allow`/`per`,
`points`/`over`, `each`/`per`), jotka tarkistetaan silloin kun status on
`enforced`.

Säännön `status` kertoo mitä sovellukselta odotetaan:

| status | merkitys |
|---|---|
| `enforced` | sovelluksen pitää valvoa tätä koneellisesti |
| `manual`   | ei voida valvoa; riittää että teksti näkyy pelaajalle |
| `gap`      | pitäisi valvoa, mutta ei valvota — tunnettu puute |
| `not_shown`| kirjassa on, sovellus ei näytä — kirjattu tarkoituksella |

`gap` on tarkoituksella eri asia kuin `manual`. Se on tehtävälista, ei
hyväksytty tilanne, eikä se pääse unohtumaan koska tarkistin luettelee ne.

## Käyttö

```
python check_reference.py
```

Tarkistin vertaa jokaista referenssiä `bfg_data.json`:iin ja kertoo:

* `enforced`-sääntö joka ei enää ole valvottuna → **regressio**
* `enforced`-sääntö jonka parametrit muuttuivat → **regressio**
* `gap`-sääntö joka onkin nyt valvottu → referenssi on vanhentunut, päivitä
* `manual`-sääntö jonka tekstiä ei enää näytetä → sisältöä kadonnut
* listarivi jonka nimi tai hinta ei täsmää → jäsennin muuttui

Ajo palauttaa nollasta poikkeavan paluuarvon jos löydöksiä on, joten sen
voi liittää julkaisuputkeen.

## Tilanne

**32 / 32 listaa referoitu (7.9.2026).** 470 sääntöä ja 668 listariviä
tarkistuksessa, nolla löydöstä.

Referenssit ovat jo napanneet kiinni:

* rikkinäisen regexin joka kääntyi virheettömästi eikä osunut mihinkään
* kolme arvattua hintaa
* kadonneita listarivejä
* oman päättelyni jossa väitin puuttuvan lauseen olleen tarkoituksellinen
