# CLAUDE.md — Gothic Fleet Registry

Projektin varsinainen työohje on `AGENTS.md`, joka tuodaan tähän kokonaan:

@AGENTS.md

## Lisäksi Claude-istunnoille

- Tämä on oma git-reponsa. Juuren `F:\3D print LLM\CLAUDE.md` pätee myös tähän
  (UTF-8, Drive, rinnakkaiset istunnot).
- **Rinnakkaiset istunnot:** aja `git status` ennen kuin kosket
  `app_template.html`:ään. Jos siinä on toisen committaamattomia muutoksia, tee
  muutos `domain.js`:ään tai dataan (`build_data.py`), tai odota. Committaa vain
  omat tiedostosi. `make_fleet_cards.js` ja `fleet_card_sheets.js` ovat olleet
  pitkään committaamatta, joten älä niputa niitä muiden muutosten mukaan
  kysymättä.
- **Esikatselu:** `preview_start registry` (8731) tai `registry-2` (8741). Kehityssivu on
  `http://localhost:8731/Battlefleet%20Gothic/fleet%20builder/Gothic%20Fleet%20Registry.html?v=N`.
  Nosta `?v=` jokaisen buildin jälkeen. Sovelluksen globaalit ovat `LISTS`,
  `SHIPS`, `S`, `addUnit(si, ei)`, `setOptState(u, i, "take")`, `resolveUnit(u)`
  ja `cardHTML(u)`. Siivoa testilaivastot paneelin localStoragesta lopuksi.
- **Backlogin tunnisteet:** `J<nro>` viittaa `docs/BACKLOG.md`:hen ja `T<nro>`
  pelikortin tulkintoihin `play/LUEMINUT.md`:ssä. Käytä samoja commit-viesteissä.
- **Historia:** `C:\Users\joona\.claude\projects\F--3D-print-LLM\memory\`. Tähän
  repoon liittyvät muistiinpanot ovat `bfg-*`-alkuisia, esimerkiksi
  `bfg-korttigeneraattorit.md`, `bfg-tulostusasetus-ja-pdf-tarkistin.md`,
  `bfg-taysi-hyvaksynta-ennen-julkaisua.md` ja `bfg-v1-julkaisutila.md`.
