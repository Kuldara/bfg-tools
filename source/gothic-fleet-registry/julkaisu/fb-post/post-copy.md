# Facebook-postaus: Battlefleet Gothic -ryhmä (8,1k jäsentä)

Sävy: oma iltaprojekti, ei tuotelanseeraus. Konkretiaa numeroina, rajat
myönnetään ääneen, lukijalta pyydetään virheitä. Ei sanoja "seamless",
"powerful", "revolutionary", "ultimate", eikä ylisanoja omasta työstä.

Tarkista ennen postausta: osoitteessa on 1.1 (Cloudflare-julkaisu on sinun
askeleesi) ja kuvat ovat tästä kansiosta.

---

## Päävaihtoehto (kopioi tämä)

I've been building a fleet builder for BFG: Remastered in my evenings, and it's
finally at the point where I use it at the table instead of a spreadsheet.

https://bfgtools.kuldare.com/

It's free, runs in a browser tab, and prints the ship cards.

What it does:
• 32 fleet lists and 171 ship profiles from the Remastered books
• points update as you click, and the legality panel names the rule you broke
  and quotes the sentence it comes from
• anything that can't be checked honestly is printed beside the list as "Check
  yourself" — I'd rather show you the sentence than pretend the app knows
• prints ship cards two to an A4, plus commander cards and a roster, or
  downloads the whole sheet as an editable HTML file
• one HTML file: no account, no server, works offline, fleets stay in your
  browser

The newest version covers the fiddly bits I kept getting wrong by hand:
reserves and allies (the one-in-three budget, the allies matrix, renegade
Imperial hulls in a Chaos fleet, the Ordo Malleus route to Chaos ships), Marks
of Chaos, a weapons line on every ship row so you can tell a Gothic from a
Lunar without opening a card, and a separate fleet kept for every list so
switching lists doesn't throw your work away.

It's a fan project: nothing to buy, no ads, not affiliated with GW. Built
against Fleets Book WiP v0.36 and Rulebook v1.10. The books are still the
authority — where the app and the book disagree, the book wins and I want to
hear about it.

Bug reports are the most useful thing you can send me: fleet list, ship,
options ticked, page number, what you expected, what it showed. Everything
confirmed becomes a permanent test, so the same mistake can't quietly come
back.

---

## Lyhyt vaihtoehto (jos haluat tiiviin)

Free fleet builder for BFG: Remastered, made in my evenings and used at my own
table: https://bfgtools.kuldare.com/

32 fleet lists, 171 ship profiles, live points, legality checks that quote the
book sentence and page, and printable ship cards two to an A4. One HTML file —
no account, works offline, fleets stay in your browser.

Newest version handles reserves and allies, Marks of Chaos, and keeps a
separate fleet for every list.

Fan project, not affiliated with GW. The books are still the authority: if the
app and the book disagree, tell me — list, ship, options, page, expected,
shown. Confirmed reports become permanent tests.

---

## Kolme aloitusriviä, jos haluat vaihtaa koukun

1. "I got tired of doing fleet arithmetic on paper, so I spent a few months of
   evenings building this."
2. "A free BFG: Remastered fleet builder that prints the play cards. One HTML
   file, works offline."
3. "My group kept arguing about what a fleet was allowed to take, so I made the
   rulebook do the arguing."

---

## Diat ja kuvatekstit

Järjestys on tarkoituksella tämä: ensin mikä se on, sitten kolme asiaa jotka
erottavat sen paperista, sitten kortti jonka takia koko homma on olemassa.

1. **01-builder.png** — koko työkalu kerralla.
   *"Pick ships on the left. Points and rule checks keep up on the right."*

2. **02-arms-line.png** — alusrivit aseineen.
   *"Every row says what the ship actually shoots with, so you can tell a
   Gothic from a Lunar without opening a card."*

3. **03-checks.png** — punaiset tarkistukset.
   *"When a fleet breaks a rule it says which rule, and quotes the sentence it
   came from."*

4. **04-borrow.png** — lainaus toiselta listalta.
   *"Reserves and allies: it knows which ships another list will lend you,
   which it won't, and what has to be in your fleet first."*

5. **05-fleet-per-list.png** — laivasto joka listalle.
   *"Every fleet list keeps its own fleet and its own points limit. Switching
   lists doesn't throw your work away."*

6. **06-card.png** — tulostettava kortti.
   *"The card carries the rules that apply to that ship in that fleet, with the
   page they came from. Two per A4."*

Jos haluat vain neljä diaa: 1, 2, 4 ja 6.

---

## Ensimmäinen kommentti (kirjoita heti postauksen jälkeen)

Two things worth saying out loud:

1. It does not automate every BFG rule, and it doesn't pretend to. Restrictions
   that can be represented honestly are enforced and shown with their source
   sentence; the rest sit beside the list as "Check yourself". Ordnance,
   refits, campaign rules and anything phrased as an exception are yours to
   verify.
2. If something looks wrong, the page number plus the options you ticked is far
   more useful than a screenshot on its own. That's enough for me to reproduce
   it, fix it, and lock it with a test.

You can also save the page (Ctrl+S) and use it offline at the table — it's a
single file, no network needed.

---

## Valinnainen kappale: LLM-avusteisuus

1.0:n Reddit-postauksessa tämä sanottiin ääneen. Facebook-ryhmässä se voi
viedä keskustelun sivuun. Kaksi tapaa:

**A. Jätä pois päätekstistä, vastaa jos kysytään:**
"Yes, a lot of it was written with LLM assistance. That's exactly why every
rule carries its page number and why the checks quote the book: the source, not
the model, decides what's correct. Anything that couldn't be verified against a
page is marked 'Check yourself'."

**B. Sano heti ensimmäisessä kommentissa** (rehellisin, jos ryhmä on tarkka):
"Development was LLM-assisted. The books decide what's right, not the model:
every list entry was checked against the page, the app shows the sentence it
enforces, and confirmed bug reports become permanent regression tests."

---

## Mitä kannattaa välttää

- Älä lupaa "kaikki säännöt tarkistettu automaattisesti" — se ei pidä paikkaansa
  ja ensimmäinen vastaesimerkki syö loput.
- Älä käytä lanseerausretoriikkaa ("proud to announce", "the ultimate tool").
  Ryhmä tunnistaa sen heti.
- Älä listaa testimääriä päätekstissä. Ne kuuluvat vastaukseen, jos joku kysyy
  "miten tiedät että se on oikein".
- Älä pyydä jakoja tai tykkäyksiä. Linkki ja pyyntö virheraporteista riittää.
