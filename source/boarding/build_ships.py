# -*- coding: utf-8 -*-
"""Poimii boarding-resolverin aluskannan fleet builderin datasta.

    python build_ships.py

Lukee (VAIN LUKU, toinen projekti):
    F:\\3D print LLM\\Battlefleet Gothic\\fleet builder\\bfg_data.json
Kirjoittaa:
    src/ships.json

Aluskannasta tarvitaan vain se, mika vaikuttaa boarding actioniin:
nimi, laivasto, runkotyyppi, damage points, turretit (tai spore cystit) ja
ne alus- tai luokkakohtaiset erikoissaannot, jotka muuttavat boardingia.

Erikoissaantoliput eivat synny regexista ajon aikana: ne ovat tassa
tiedostossa kasin poimittuina SHIP_FLAGS-taulussa, ja jokaisen rivin
lahdelause tarkistetaan aluksen omasta sr-tekstista. Jos kirja muuttuu
niin ettei lause enaa loydy, ajo huutaa - se on koko tarkistuksen idea.
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SRC = r"F:\3D print LLM\Battlefleet Gothic\fleet builder\bfg_data.json"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "src", "ships.json")

# --------------------------------------------------------------------------
# Laivastot: naytettava nimi + rotamodifikaattorin tunniste.
# Rotamodifikaattori on laivastotason asia; alustason poikkeukset ovat
# SHIP_FLAGSissa.
# --------------------------------------------------------------------------
FLEETS = [
    # key in data,          display,                   race tag
    ("IMPERIAL NAVY",        "Imperial Navy",           "imperial"),
    ("SPACE MARINES",        "Space Marines",           "spacemarines"),
    ("ADEPTUS MECHANICUS",   "Adeptus Mechanicus",      "admech"),
    ("INQUISITION",          "Inquisition",             "inquisition"),
    ("ROGUE TRADERS",        "Rogue Traders",           "roguetrader"),
    ("CHAOS",                "Chaos",                   "chaos"),
    ("ORKS",                 "Orks",                    "ork"),
    ("ELDAR",                "Eldar",                   "eldar"),
    ("DARK ELDAR",           "Dark Eldar",              "darkeldar"),
    ("NECRON",               "Necrons",                 "necron"),
    ("TYRANID",              "Tyranids",                "tyranid"),
    ("TAU KOR\u2019VATTRA",  "Tau Kor\u2019vattra",     "tau"),
    ("TAU KOR\u2019OR\u2019VESH", "Tau Kor\u2019or\u2019vesh", "tau_kororvesh"),
    ("TAU",                  "Tau defences",            "tau"),
    ("KROOT",                "Kroot",                   "kroot"),
    ("DEMIURG",              "Demiurg",                 "demiurg"),
    ("NICASSAR",             "Nicassar",                "nicassar"),
    ("HIGH ORBIT DEFENCES",  "Orbital defences",        "imperial"),
    ("LOW ORBIT DEFENCES",   "Planetary defences",      "imperial"),
    ("ADDITIONAL VESSELS",   "Civilian vessels",        "none"),
]


# --------------------------------------------------------------------------
# Laivastolistat: kuka miehittaa rungon.
#
# Kirjan lista voi ottaa rungon toisen kirjan osiosta. Boardingissa ratkaisee
# MIEHISTO, ei se mihin kirjan osioon profiili on painettu: Explorator-lista
# ottaa Imperial Navyn rungot mutta ne ovat mekanikuksen aluksia (FL s.121,
# s.125), ja Kaaoksen renegade-rungot ovat kaaoksen aluksia (FL s.222).
#
# LIST_CREW-taulun avain on (listan nimi, osion otsikko) ja arvo:
#   "own"          = listan oma laivasto miehittaa
#   "book"         = jokainen alus jaa oman kirjansa laivastoon (liittolaiset)
#   "<LAIVASTO>"   = nimetty laivasto miehittaa
# "ex" antaa poikkeukset alkukirjaimilla (listan oma nimike), "fl" lisattavat
# liput ja "pg" lahdesivun.
#
# Jos listaan ilmestyy osio, jossa on toisen kirjan runko eika riviä tassa
# taulussa ole, ajo pysahtyy - samalla periaatteella kuin SHIP_FLAGS.
# --------------------------------------------------------------------------
LIST_FLEET = {
    "Imperial Navy \u2014 Gothic Sector": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Bastion Fleets": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Armageddon Sector": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Bakka Sector": "IMPERIAL NAVY",
    "Space Marines \u2014 Codex Astartes": "SPACE MARINES",
    "Space Marines \u2014 Crusade": "SPACE MARINES",
    "Space Marines \u2014 Dominion": "SPACE MARINES",
    "Adeptus Mechanicus \u2014 Explorator": "ADEPTUS MECHANICUS",
    "The Emperor's Inquisition": "INQUISITION",
    "Grey Knights": "INQUISITION",
    "Rogue Traders": "ROGUE TRADERS",
    "Rogue Traders \u2014 Exploration": "ROGUE TRADERS",
    "Rogue Traders \u2014 Pirates and Wolf Packs": "ROGUE TRADERS",
    "Chaos \u2014 Incursion": "CHAOS",
    "Chaos \u2014 Black Crusade": "CHAOS",
    "Chaos \u2014 Tzeentch": "CHAOS",
    "Chaos \u2014 Nurgle": "CHAOS",
    "Chaos \u2014 Khorne": "CHAOS",
    "Chaos \u2014 Slaanesh": "CHAOS",
    "Eldar Corsairs \u2014 Gothic Sector": "ELDAR",
    "Eldar Corsairs \u2014 Later Gothic War": "ELDAR",
    "Eldar \u2014 Iyanden Craftworld": "ELDAR",
    "Dark Eldar \u2014 Pirates": "DARK ELDAR",
    "Orks \u2014 Cyclops Cluster": "ORKS",
    "Orks \u2014 Waaagh!": "ORKS",
    "Orks \u2014 Da Ork Clanz": "ORKS",
    "Necrons \u2014 Harvest Fleet": "NECRON",
    "Tyranids \u2014 Vanguard Fleet": "TYRANID",
    "Tyranids \u2014 Hive Fleet": "TYRANID",
    "Tau \u2014 Merchant Fleet": "TAU KOR\u2019VATTRA",
    "Tau \u2014 Commerce Protection": "TAU KOR\u2019OR\u2019VESH",
    "Demiurg \u2014 War Host": "DEMIURG",
}

# Liittolaisosiot, jotka toistuvat lahes joka listassa.
_ALLY = {"crew": "book", "pg": 15, "generic": True,
         "why": "liittolaiskontingentti pitaa oman miehistonsa (FL s.15)"}
# Ordo Malleuksen ja Segmentum Obscuruksen varastorungot: kaaoksen profiileja
# imperiumin miehistoilla (FL s.39: "crewed with sailors from destroyed or
# crippled vessels"; FL s.15: reserves ovat aina samaa rotua; FL s.142).
_IMP_RESERVE = {"crew": "IMPERIAL NAVY", "pg": 39,
                "why": "varastorunko imperiumin miehistolla (FL s.39, s.142)"}

LIST_CREW = {}
for _l in LIST_FLEET:
    LIST_CREW[(_l, "THE INQUISITION")] = _ALLY
    LIST_CREW[(_l, "ROGUE TRADERS")] = _ALLY
for _l in ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Armageddon Sector",
           "Imperial Navy \u2014 Bakka Sector", "Adeptus Mechanicus \u2014 Explorator"):
    LIST_CREW[(_l, "ORDO MALLEUS RESERVES")] = _IMP_RESERVE
LIST_CREW[("Imperial Navy \u2014 Bastion Fleets",
           "THE RESERVE FLEETS OF SEGMENTUM OBSCURUS")] = _IMP_RESERVE

# Armageddon: tahti nimikkeessa = Space Marine -alus (FL s.41), ja rapid strike
# vesselit ovat ordun miehistamia imperiumin runkoja (FL s.106).
_ARM_EX = [("Rapid Strike Vessel", "SPACE MARINES"), ("Space Marine", "book"),
           ("Nova", "book"), ("Gladius", "book"), ("Hunter", "book")]
for _sec in ("Battleships", "Cruisers", "ESCORTS"):
    LIST_CREW[("Imperial Navy \u2014 Armageddon Sector", _sec)] = {
        "crew": "own", "ex": _ARM_EX, "pg": 41,
        "why": "tahdella merkityt ovat Space Marine -aluksia (FL s.41, s.106)"}

# Space Marine -listojen rapid strike vesselit: imperiumin runkoja ordun
# miehistolla ja kaikilla Space Marine -saannoilla (FL s.106).
for _l in ("Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Dominion"):
    LIST_CREW[(_l, "ESCORTS")] = {"crew": "own", "pg": 106,
                                  "why": "rapid strike vessel = ordun miehisto (FL s.106)"}
# Grey Knights: koko lista on Space Marine -miehistoa (FL s.144).
LIST_CREW[("Grey Knights", "ESCORTS")] = {
    "crew": "SPACE MARINES", "pg": 144,
    "why": "Grey Knights count as Space Marines in all respects (FL s.144)"}

# Explorator: imperiumin ja ordun rungot ovat mekanikuksen aluksia, eivatka saa
# Space Marine -bonusta (FL s.121, s.125).
for _sec in ("Battleships", "Cruisers", "ESCORTS"):
    LIST_CREW[("Adeptus Mechanicus \u2014 Explorator", _sec)] = {
        "crew": "own", "pg": 121,
        "why": "count as Mechanicus vessels ... nor do they get any boarding "
               "action bonuses Space Marine escorts may have (FL s.121)",
        # FL s.119: "All Mechanicus capital ships add +1 to a given vessel's
        # original turret value" ja "These improvements are already included in
        # the point cost". FL s.121: saattajat eivat saa sita automaattisesti
        # (ne voivat ostaa sen, ja se hoituu kortin turrettisaatimella).
        # FL s.126: Omnissiah's Victory ei saa refitteja lainkaan - se on
        # aluskannan oma rivi eika kulje taman kautta.
        "tu_cap": 1, "tu_pg": 119, "tu_check": True}

# Rogue Trader -listat miehittavat runkonsa itse (FL s.174, s.178).
for _l, _secs in (("Rogue Traders", ("CAPITAL SHIPS", "NOTES FROM NATE MONTES")),
                  ("Rogue Traders \u2014 Exploration",
                   ("CAPITAL SHIPS", "NOTES FROM NATE MONTES", "TRANSPORTS")),
                  ("Rogue Traders \u2014 Pirates and Wolf Packs",
                   ("ESCORTS", "NOTES FROM NATE MONTES"))):
    for _sec in _secs:
        LIST_CREW[(_l, _sec)] = {"crew": "own", "pg": 174,
                                 "why": "rogue traderin oma runko (FL s.174, s.178)"}
LIST_CREW[("Rogue Traders \u2014 Pirates and Wolf Packs", "CAPITAL SHIPS")] = {
    "crew": "own", "ex": [("Space Marine Strike Cruiser", "book")], "pg": 178,
    "why": "merirosvon oma runko; Space Marine -risteilija pysyy ordun aluksena"}
for _l in ("Rogue Traders", "Rogue Traders \u2014 Exploration"):
    for _sec in ("XENOS ALLIES", "The Demiurg", "The Kroot"):
        LIST_CREW[(_l, _sec)] = _ALLY

# Kaaos: renegade-rungot ovat kaikilta osin kaaoksen aluksia (+1), mutta niille
# ei voi ottaa Chaos Space Marine -miehistoa, Chaos Lordia eika merkkia
# (FL s.222, s.225).
for _l in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
           "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    LIST_CREW[(_l, "RENEGADE IMPERIAL VESSELS")] = {
        "crew": "own", "fl": ["renegade"], "pg": 222,
        "why": "they count as Chaos vessels in all respects (FL s.222)"}

# Tau ja Demiurg: puolitussaanto seuraa rungon omaa haaraa, ei listaa
# (FL s.450), ja War Hostin muut rungot ovat liittolaisia (FL s.486).
for _l, _secs in (("Tau \u2014 Merchant Fleet",
                   ("ESCORTS", "Kroot Vessels", "Demiurg Vessels", "Nicassar Vessels")),
                  ("Tau \u2014 Commerce Protection",
                   ("Battleships", "Cruisers", "ESCORTS", "Kroot Vessels",
                    "Demiurg Vessels", "Nicassar Vessels")),
                  ("Demiurg \u2014 War Host",
                   ("Kroot Vessels", "Tau Escorts", "Nicassar Escorts"))):
    for _sec in _secs:
        LIST_CREW[(_l, _sec)] = {"crew": "book", "pg": 450,
                                 "why": "runko pitaa oman haaransa saannot (FL s.450, s.486)"}
_RT_CONTINGENT = {"crew": "ROGUE TRADERS", "pg": 174,
                  "why": "rogue trader -kontingentti (FL s.174)"}
LIST_CREW[("Tau \u2014 Commerce Protection", "Rogue Traders")] = _RT_CONTINGENT
LIST_CREW[("Demiurg \u2014 War Host", "Rogue Trader Escorts")] = _RT_CONTINGENT
LIST_CREW[("Demiurg \u2014 War Host", "Cruisers")] = {
    "crew": "book", "ex": [("Dauntless", "ROGUE TRADERS")], "pg": 486,
    "why": "liittolaisrungot pitavat omat saantonsa (FL s.486)"}

# Miehiston mukana kulkevat liput jaavat lahtolaivastoon: lainattu runko saa
# uuden miehiston, ei vanhan miehiston bonuksia.
CREW_FLAGS = ("marines", "greyknights", "csm", "khorne", "nurgle", "berzerkers",
              "terminators", "goff", "abaddon", "aspect", "megaarmour",
              "clanzwarlord", "blackship")


# --------------------------------------------------------------------------
# Alus- ja luokkakohtaiset boarding-saannot.
# avain: "<LAIVASTO>|<ALUKSEN NIMI>"  ->  (liput, lahdelauseen tunniste)
# Lahdelause tarkistetaan sr/op/ol-tekstista; None = ei tarkisteta
# (saanto tulee laivastolistalta, ei alusprofiililta).
# --------------------------------------------------------------------------
SHIP_FLAGS = {
    # Aluskohtaiset boarding-, kriittinen- ja katastrofipoikkeukset. Boarding-
    # resolveri joutuu tuntemaan myos profiilikohtaiset kriittiset saannot,
    # koska boarding action voi aiheuttaa kriittisen ja sen lisavahinko voi
    # johtaa suoraan katastrofiheittoon.
    "IMPERIAL NAVY|MERCURY CLASS BATTLECRUISER":
        (["cata3"], "rolls 3D6 for catastrophic damage"),

    # Nama rungot ohittavat Prow Armament Damaged -tuloksen kokonaan eivatka
    # siirra sita seuraavaan kriittiseen tulokseen (FL s.58-60, 63, 268-271).
    "IMPERIAL NAVY|VENGEANCE CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "IMPERIAL NAVY|EXORCIST CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "IMPERIAL NAVY|AVENGER CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignore prow critical damage"),
    "IMPERIAL NAVY|JOVIAN CLASS BATTLECRUISER":
        (["orders2", "ignoreprow"], [
            "gains a +2 bonus when the enemy is on special orders instead of +1",
            "may ignore the result entirely instead of moving up the table",
        ]),
    "CHAOS|RETALIATOR CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "CHAOS|VENGEANCE CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "CHAOS|EXECUTOR CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),

    # Demiurgin Bridge Smashed ei vahenna Leadershipia vaan aiheuttaa +1
    # lisavahingon (FL s.488-490).
    "DEMIURG|‘STRONGHOLD’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),
    "DEMIURG|‘BASTION’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),
    "DEMIURG|‘CITADEL’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),

    # Kapea keskikaytava: +1 puolustettaessa
    "IMPERIAL NAVY|ENDEAVOUR CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDEAVOUR CLASS LIGHT CRUISER (BAKKA)":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDURANCE CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDURANCE CLASS LIGHT CRUISER (BAKKA)":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|DEFIANT CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "ROGUE TRADERS|ENDEAVOUR CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),

    # Inkvisitio
    "INQUISITION|BLACKSHIP":
        (["blackship", "gellar"], "never attempt to board an enemy vessel"),
    "INQUISITION|GREY KNIGHTS BATTLE BARGE":
        (["greyknights", "marines"], "re- roll any boarding action result"),
    "INQUISITION|GREY KNIGHTS STRIKE CRUISER":
        (["greyknights", "marines"], "re- roll any boarding action result"),

    # Kaaos
    "CHAOS|SLAVERER, WORLD EATERS BATTLE BARGE":
        (["khorne", "csm", "berzerkers", "terminators"],
         "boarding modifier of +2 in addition to its improved boarding value"),
    "CHAOS|TERMINUS EST, DEATH GUARD BATTLE BARGE":
        (["nurgle"], "bears the Mark of Nurgle as part of its point cost"),
    "ELDAR|FLAME OF ASURYAN, YRIEL'S FLAGSHIP":
        (["aspect"], "count as an Aspect Warrior fighting crew"),
    "CHAOS|ACTIVATED BLACKSTONE FORTRESS":
        (["nocrew"], "does not add a D6 to its boarding score"),

    # Eldar
    "ELDAR|HEMLOCK CLASS DESTROYER":
        (["noboard", "easyprey"], "cannot initiate boarding actions"),
    "ELDAR|SHADOWHUNTER":
        (["noboard", "easyprey", "hr_target_plus1"], "cannot initiate boarding actions"),

    # Runkokohtaiset kriittisten taulukot ja hulkit
    "KROOT|WARSPHERE":
        (["critplus1", "nocata4"], None),
    "NICASSAR|CARAVAN":
        (["critplus1", "nocata4"], None),
    # Tahtitukikohtia voi boardata vain space hulk (FL s.502, s.111)
    "HIGH ORBIT DEFENCES|RAMILIES CLASS STAR FORT":
        (["fortress", "ramilies"], None),
    "ELDAR|HAVEN SPACE STATION":
        (["haven"], None),
    "SPACE MARINES|FORTRESS-MONASTERY":
        (["fortress", "ramilies"], None),

    # Rogue Trader -listan xenosrungot ovat alienaluksia Ordo Xenosia vastaan
    # (FL s. 141). Laivastotunniste ei riita, koska samassa listassa on
    # imperiumin runkoja.
    "ROGUE TRADERS|XENOS VESSEL":
        (["alien"], None),
    "ROGUE TRADERS|PTHUXUTL WAR CRUISER":
        (["alien"], None),
    "ROGUE TRADERS|FRA’AL RAIDER":
        (["alien"], None),
    "ROGUE TRADERS|NEKULLI WHIP":
        (["alien"], None),
    "ROGUE TRADERS|FRA’AL BATTLESHIP":
        (["alien"], None),
    "ROGUE TRADERS|STRYXIS CARAVAN VESSEL":
        (["alien"], None),

    "ORKS|ROK":
        (["critplus1", "nocata4"], None),
    "ORKS|ORK HULK":
        (["orkhulk", "spacehulk"], None),
    "CHAOS|CHAOS SPACE HULK":
        (["chaoshulk", "spacehulk"], None),
    "CHAOS|WAGE OF SIN, EMPEROR'S CHILDREN BATTLE BARGE":
        (["csm"], "Emperor’s Children Chaos Space Marines"),

    # Orkit
    "ORKS|ZUKOV'S KLAW ASSAULT KROOZER":
        (["goff"], "additional +1 modifier during boarding actions"),
    "ORKS|GRUNT ASSAULT SHIP":
        (["hp2"], "Count as 2HP when determining their boarding value"),
}

# Naytettavan nimen poikkeukset: (lyhyt nimi, alaotsikko)
NAME_OVERRIDE = {
    "OMNISSIAH'S VICTORY, ARK MECHANICUS": ("Omnissiah\u2019s Victory", "Ark Mechanicus"),
    "SEDITIO OPPRIMERE, VENERABLE BATTLE BARGE": ("Seditio Opprimere", "Venerable battle barge"),
    "SCION OF PROSPERO, THOUSAND SONS BATTLE BARGE": ("Scion of Prospero", "Thousand Sons battle barge"),
    "SLAVERER, WORLD EATERS BATTLE BARGE": ("Slaverer", "World Eaters battle barge"),
    "TERMINUS EST, DEATH GUARD BATTLE BARGE": ("Terminus Est", "Death Guard battle barge"),
    "WAGE OF SIN, EMPEROR'S CHILDREN BATTLE BARGE": ("Wage of Sin", "Emperor\u2019s Children battle barge"),
    "FLAME OF ASURYAN, YRIEL'S FLAGSHIP": ("Flame of Asuryan", "Yriel\u2019s flagship"),
    "GORBAG\u2019S REVENGE BATTLESHIP": ("Gorbag\u2019s Revenge", "Battleship"),
    "ZUKOV'S KLAW ASSAULT KROOZER": ("Zukov\u2019s Klaw", "Assault kroozer"),
    "THE PLANET KILLER": ("Planet Killer", "Battleship"),
    "\u2018STRONGHOLD\u2019 COMMERCE VESSEL": ("Stronghold", "Commerce vessel"),
    "\u2018BASTION\u2019 COMMERCE VESSEL": ("Bastion", "Commerce vessel"),
    "\u2018CITADEL\u2019 COMMERCE VESSEL": ("Citadel", "Commerce vessel"),
    "Q-SHIP": ("Q-Ship", "Escort"),
    "HIVE SHIP": ("Hive ship", "Tyranid battleship"),
    "CRUISER": ("Tyranid cruiser", "Cruiser"),
    "KRAKEN": ("Kraken", "No spore cysts"),
    "VANGUARD DRONE SHIP": ("Vanguard drone", "Escort"),
    "ESCORT DRONE": ("Escort drone", "Escort"),
    "RAMILIES CLASS STAR FORT": ("Ramilies", "Star fort"),
    "ACTIVATED BLACKSTONE FORTRESS": ("Blackstone Fortress", "Activated"),
    "BLACKSTONE FORTRESS": ("Blackstone Fortress", "Dormant"),
}

# Tau-konfiguraatiot: "GAL'LEATH (EXPLORER) CLASS STARSHIP - VASH'YA MK XXIII CONFIGURATION"
TAU_RE = re.compile(
    r"^(?P<base>.+?)\s+CLASS\s+(?P<hull>[A-Z\u2019' ]+?)\s*[\u2014\u2013-]\s*(?P<cfg>.+?)\s*(?:CONFIGURATION)?$")

KEEP_UPPER = {"MK", "II", "III", "IV", "VI", "VII", "VIII", "IX", "XI", "XII",
              "XXIII", "XXIV", "XXV", "AI", "PDF"}


def _word(w):
    if not w:
        return w
    lead = ""
    while w and w[0] in "(\u2018\u2019'\"":
        lead += w[0]
        w = w[1:]
    trail = ""
    while w and w[-1] in ")\u2018\u2019'\".,":
        trail = w[-1] + trail
        w = w[:-1]
    if not w:
        return lead + trail
    if w.upper() in KEEP_UPPER:
        w = w.upper()
    else:
        # sailyta heittomerkin jalkeinen pieni kirjain: KOR'VATTRA -> Kor'vattra
        w = w[0].upper() + w[1:].lower()
    return lead + w + trail


def titlecase(s):
    return " ".join(_word(w) for w in s.split(" ") if w)


def split_name(nm, ty):
    """-> (lyhyt nayttonimi, alaotsikko)

    " CLASS " on kirjan oma erotin luokkanimen ja rungon valilla, joten sen
    varassa jako on turvallinen. Ilman sita nimea EI pilkota - "Kill Kroozer"
    ei ole "Kill"-luokan kroozer - vaan alaotsikoksi tulee profiilin runkotyyppi.
    """
    if nm in NAME_OVERRIDE:
        return NAME_OVERRIDE[nm]

    m = TAU_RE.match(nm)
    if m and ("\u2014" in nm or "\u2013" in nm):
        base = titlecase(m.group("base"))
        cfg = titlecase(m.group("cfg").replace(" CONFIGURATION", ""))
        return base, cfg

    head, tail = nm, ""
    if ", " in head:
        head, tail = head.split(", ", 1)

    paren = ""
    pm = re.search(r"\s*(\([^)]*\))\s*$", head)
    if pm:
        paren = pm.group(1)
        head = head[: pm.start()]

    if " CLASS " in head:
        base, hull = head.split(" CLASS ", 1)
    else:
        base, hull = head, ty

    base = titlecase(base)
    if paren:
        base = base + " " + titlecase(paren)
    sub = titlecase(hull) if hull else ""
    if tail:
        sub = (titlecase(tail) + (" " + sub.lower() if sub else "")).strip()
    return base, sub or titlecase(ty)



def list_has_turret_refit(lst):
    """Explorator-listan pakollinen +1 turretti isoille aluksille (FL s.119).
    Jos data muuttuu niin ettei rivia enaa ole, ajo huutaa."""
    for sec in lst.get("secs", []):
        for ent in sec.get("ents", []):
            if (ent.get("k") == "up" and ent.get("req")
                    and (ent.get("mod") or {}).get("tu") == 1):
                return True
    return False


def crew_for(entry_label, sec_rule, own_fleet, book_fleet):
    """Kuka miehittaa taman nimikkeen: laivastoavain."""
    crew = sec_rule["crew"]
    for prefix, other in sec_rule.get("ex", ()):
        if entry_label.lower().startswith(prefix.lower()):
            crew = other
            break
    if crew == "own":
        return own_fleet
    if crew == "book":
        return book_fleet
    return crew


def borrowed_rows(data, ships_in, base_rows, fleet_keys):
    """Rungot, jotka laivasto miehittaa itse vaikka profiili on toisen kirjan
    osiossa (FL:n laivastolistat). Palauttaa uudet rivit ja ongelmat."""
    problems = []
    rows = []
    have = set()                      # (laivastoindeksi, nayttonimi)
    by_id = {}
    for r in base_rows:
        have.add((r["f"], r["full"]))
        by_id.setdefault((fleet_keys[r["f"]], r["full"]), r)

    seen_rules = set()
    added = {}
    for lst in data.get("lists", []):
        lname = lst.get("nm", "")
        own = LIST_FLEET.get(lname)
        if own is None:
            problems.append("LUOKITTELEMATON LISTA: %s" % lname)
            continue
        for sec in lst.get("secs", []):
            ents = [e for e in sec.get("ents", [])
                    if e.get("k") == "unit" and e.get("r") is not None]
            if not ents:
                continue
            stitle = sec.get("t", "")
            rule = LIST_CREW.get((lname, stitle))
            foreign = any(ships_in.get(str(e["r"]), {}).get("fl") != own for e in ents)
            renamed = any("rapid strike" in (e.get("l") or "").lower() for e in ents)
            if rule is None:
                if foreign or renamed:
                    problems.append("LUOKITTELEMATON OSIO: %s / %s "
                                    "(vieras runko tai uudelleennimetty nimike)"
                                    % (lname, stitle))
                continue
            seen_rules.add((lname, stitle))
            if rule.get("tu_check") and not list_has_turret_refit(lst):
                problems.append("TURRETTIREFIT KADONNUT LISTALTA: %s (FL s.%s)"
                                % (lname, rule.get("tu_pg")))
            for e in ents:
                prof = ships_in.get(str(e["r"]))
                if prof is None:
                    problems.append("TUNTEMATON ALUSVIITE: %s / %s / %s"
                                    % (lname, stitle, e.get("l")))
                    continue
                book = prof["fl"]
                crew = crew_for(e.get("l") or "", rule, own, book)
                if crew == book:
                    continue
                if crew not in fleet_keys:
                    problems.append("TUNTEMATON MIEHISTOLAIVASTO %s: %s / %s"
                                    % (crew, lname, stitle))
                    continue
                src = by_id.get((book, prof["nm"]))
                if src is None:
                    problems.append("LAINATTAVAA RUNKOA EI OLE ALUSKANNASSA: %s (%s)"
                                    % (prof["nm"], book))
                    continue
                fi = fleet_keys.index(crew)
                if (fi, prof["nm"]) in have:
                    continue          # laivastolla on jo samanniminen runko
                have.add((fi, prof["nm"]))
                row = dict(src)
                row["f"] = fi
                if rule.get("tu_cap") and row["t"] != "Escort":
                    row["tu"] = row["tu"] + rule["tu_cap"]
                flags = [f for f in row.get("fl", []) if f not in CREW_FLAGS]
                flags.extend([f for f in rule.get("fl", []) if f not in flags])
                if flags:
                    row["fl"] = flags
                elif "fl" in row:
                    del row["fl"]
                row["from"] = book          # mista kirjasta profiili on
                rows.append(row)
                added.setdefault(crew, []).append(prof["nm"])

    for key, rule in LIST_CREW.items():
        if key not in seen_rules and not rule.get("generic"):
            problems.append("LIST_CREW-rivi ei osunut yhteenkaan osioon: %s / %s" % key)

    for fleet in sorted(added):
        print("  %-20s + %d runkoa listoilta: %s"
              % (fleet, len(added[fleet]), ", ".join(sorted(added[fleet]))[:150]))
    return rows, problems


def main():
    if not os.path.exists(SRC):
        print("EI LOYDY:", SRC)
        return 2
    data = json.load(open(SRC, encoding="utf-8"))
    ships_in = data["ships"]

    fleet_keys = [f[0] for f in FLEETS]
    out_fleets = [{"id": f[0], "name": f[1], "race": f[2]} for f in FLEETS]

    seen_flag_keys = set()
    problems = []
    out_ships = []

    for sid, s in sorted(ships_in.items(), key=lambda kv: (int(re.match(r"\d+", kv[0]).group(0)), kv[0])):
        fl = s["fl"]
        if fl not in fleet_keys:
            problems.append("tuntematon laivasto: %s (%s)" % (fl, s["nm"]))
            continue
        fi = fleet_keys.index(fl)

        tu_raw = str(s.get("tu", "0")).strip()
        if tu_raw in ("\u2013", "\u2014", "-", "", "0"):
            tu = 0
        else:
            m = re.match(r"\d+", tu_raw)
            tu = int(m.group(0)) if m else 0

        key = fl + "|" + s["nm"]
        flags = []
        if key in SHIP_FLAGS:
            flags, needle = SHIP_FLAGS[key]
            flags = list(flags)
            seen_flag_keys.add(key)
            if needle:
                hay = (s.get("sr") or "") + " " + (s.get("op") or "") + " " + \
                      json.dumps(s.get("ol") or [], ensure_ascii=False)
                needles = needle if isinstance(needle, list) else [needle]
                for expected in needles:
                    if expected.lower() not in hay.lower():
                        problems.append("LAHDELAUSE KADONNUT: %s -- odotettiin %r" % (key, expected))

        short, sub = split_name(s["nm"], s["ty"])
        row = {
            "f": fi,
            "n": short,
            "s": sub,
            "full": s["nm"],
            "t": s["ty"],
            "hp": int(s["hp"]),
            "tu": tu,
            "pg": int(s["pg"]),
        }
        if str(s.get("tl", "")).upper().startswith("SPORE"):
            row["spores"] = 1
        if flags:
            row["fl"] = flags
        race = FLEETS[fi][2]
        if race in ("eldar", "darkeldar"):
            # Jokaisella eldaraluksella on holofield/shadowfield, ja se
            # heitetaan koko boarding-yritysta vastaan (FL s.303, s.342).
            row["on"] = ["holofields"]
        out_ships.append(row)

    for key in SHIP_FLAGS:
        if key not in seen_flag_keys:
            problems.append("SHIP_FLAGS-rivi ei osunut yhteenkaan alukseen: %s" % key)

    borrowed, borrow_problems = borrowed_rows(data, ships_in, out_ships, fleet_keys)
    out_ships.extend(borrowed)
    problems.extend(borrow_problems)

    out = {
        "src": "bfg_data.json / " + str(data.get("src", ""))[:120],
        "fleets": out_fleets,
        "ships": out_ships,
    }
    # Vaillinainen tai epavarma aluskanta ei paady levylle: vanha tiedosto jaa
    # voimaan, jotta seuraava build.py ei paista virhetta valmiiseen appiin.
    if problems:
        print("\nONGELMAT (%d) - %s EI kirjoitettu:" % (len(problems), OUT))
        for p in problems:
            print("  -", p)
        return 1

    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    os.replace(tmp, OUT)

    print("kirjoitettu %s  (%d alusta, %d laivastoa, %d tavua)"
          % (OUT, len(out_ships), len(out_fleets), os.path.getsize(OUT)))
    print("ongelmia ei ole")
    return 0


if __name__ == "__main__":
    sys.exit(main())
