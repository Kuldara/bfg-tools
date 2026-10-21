# -*- coding: utf-8 -*-
"""Erottelee laivastolistan rivit YKSIKOIHIN ja PAIVITYKSIIN.

Tausta: kirjan listaosio "0-1 Admiral" sisaltaa seka komentajavaihtoehdot
etta niiden re-roll -rivit. Aiemmin kaikki rivit laskettiin yksikoiksi,
joten yksi amiraali + yksi re-roll nayttivat kahdelta amiraalilta ja
osiorajoitus valitti. Re-roll ei ole yksikko vaan komentajan lisaosto,
tasan kuten nova cannon on aluksen lisaosto.

Tama moduuli tekee kolme asiaa:

  1. luokittelee rivit  (yksikko / komentaja / paivitys)
  2. laskee jokaiselle paivitykselle KOHTEET joihin sen voi kiinnittaa
  3. lisaa ne paivitykset jotka kirja kirjoittaa vain leipatekstiin
     (esim. Khornen Warmasterin pakollinen Mark, Dakka Dakka)

Kohta 3 on itsetarkistava: jokainen lisays vaatii etta sen lahdelause
loytyy oikeasti kyseisen osion saantotekstista. Jos kirjan sanamuoto
muuttuu, lisays jaa tekematta ja ajo huomauttaa siita - mitaan ei keksita.
"""
import re

# ---------------------------------------------------------------- luokittelu

# "(Ld 8)", "(Ld +2)", "(+1 Ld)", "(Ld10)" -- komentajan tuntomerkki
CMD_LD = re.compile(r"\((?:Ld\s*\+?\d+|\+\d+\s*Ld)\)", re.I)

# Komentajat joiden riville kirja ei kirjoita Ld-arvoa.
CMD_NAMES = re.compile(
    r"^(?:ork\s+warlord|lord\s+admiral\s+rath|prince\s+yriel|abaddon"
    r"|space\s+marine\s+captain|\d[-–]\d\s+farseers?|farseers?"
    r"|ordo\s+\w+\s+inquisitor\s+lord|inquisitor\s+lord"
    r"|veteran\s+rogue\s+trader|pirate\s+captain|master\s+of\s+the\s+fleet)\b", re.I)

# Rivit jotka nayttavat komentajalta mutta ovat lisaostoja.
NOT_CMD = re.compile(r"re-roll|\bmark\b|honour\s+guard|terminator", re.I)


def entry_kind(e):
    """'unit' = oma runko listalla, 'cmd' = komentaja, 'up' = lisaosto."""
    if e.get("r"):
        return "unit"
    lab = str(e.get("l") or "")
    if NOT_CMD.search(lab):
        return "up"
    if CMD_LD.search(lab) or CMD_NAMES.match(lab.strip()):
        return "cmd"
    return "up"


# Toisensa poissulkevat ryhmat: naista voi ottaa vain yhden per kohde.
GROUPS = [
    ("rr",    re.compile(r"re-roll", re.I)),
    ("mark",  re.compile(r"^the\s+mark\s+of|^mark\s+of", re.I)),
    ("clan",  re.compile(r"^clan:", re.I)),
    ("daemon", re.compile(r"^daemonship:", re.I)),
]


def group_of(label):
    for name, rx in GROUPS:
        if rx.search(str(label or "")):
            return name
    return None


# Osiokohtaiset poissulkevat ryhmat. GROUPS paattelee ryhman rivin
# NIMESTA, mutta orkkien Warlord-paivitykset ovat toisensa poissulkevia
# vain WARLORD-osiossa: kirja sanoo sivuilla 365 ja 366 "may include up
# to one of the upgrades shown below at the additional cost indicated".
# Tasan samannimiset rivit ovat myos Clanz-listan GUBBINS-osiossa,
# jossa raja on toinen (yksi paivitys per Warlordin re-roll), joten
# nimipohjainen ryhma olisi siella vaara.
SEC_GROUPS = [
    (re.compile(r"^Orks"), re.compile(r"^WARLORD$"), "warlord_up"),
]
_SEC_GROUP_HITS = [0]
_ONE_WEAPON_HITS = [0]
# Osiot joissa hinnasto on pelkkina alusluokkina.
HULL_PRICE_SECS = ("DAEMON SHIPS", "DAEMONSHIPS")
_HULL_PRICE_HITS = [0]
# Daemonship-rivit joiden hintaan Mark sisaltyy (Nurgle 4, Khorne 3,
# Slaanesh 4 = 11; build_data.py vaatii luvun).
_MARK_INC_HITS = [0]
# Daemonship-rivit joilta nimetty alus on suljettu pois (Nurgle 4 Terminus
# Est, Slaanesh 4 Wage of Sin, Tzeentch 4 Scion of Prospero = 12).
_NAMED_EXCL_HITS = [0]


# Kirjan omat rivit joiden lause rajaa kohteen, mutta rivi jasentyy
# ilman ehtoa. (lista, osio, rivin nimi, ehto.) Pistokoe 6 loysi jokaisen:
# Forces of Chaos -rivit tarjottiin escorteille ja Markittomille aluksille
# (s.236: "capital ships ... that have the Mark of Tzeentch", s.240 "Any
# capital ships with the Mark of Nurgle", s.244 "Any ships with the Mark
# of Khorne", s.248 "Any ships with the Mark of Slaanesh"; Strand of
# Fortune s.236 "Any ship led by a Lord of Tzeentch"), Grey Knights -rivit
# escorteille (s.145 "Any Grey Knights capital ship", "one Grey Knights
# vessel may take Grey Knight Terminators" - teleporttihyokkays on capital
# shipin kyky). Nurglen, Khornen ja Slaaneshin Daemonship sisaltaa Markin.
ROW_CONDS = [
    # s.486: "These re-rolls can only be used for Demiurg vessels and not
    # with other starships they may take as allies" - rivi tarjottiin Tau
    # Orcalle (Codex 10.9.). Osto kirjataan Demiurg-alukselle.
    (re.compile(r"^Demiurg"), re.compile(r"^Re-rolls$"),
     re.compile(r"re-roll", re.I), dict(nm="commerce vessel")),
    # s.370-371 Gubbins: "(Not for escorts.)" Extra Power Fields, Maniac
    # Turrets, Mad Meks, Mega-Armoured Boarding Parties, Prow Ram, Tellyporta,
    # Klaws (paitsi Grunt omalla optiollaan), Shokk-Attack Lance; "More
    # Gubbins ... can only be added to capital ships" (Assault Karrier).
    # Clanz-lista tarjosi kaikki tiddla skwadronille (pistokoe 7 rivit 16, 36).
    (re.compile(r"Da Ork Clanz"), re.compile(r"^GUBBINS$"),
     re.compile(r"^(?:Extra Power Fields|Maniac Turrets|Mad Meks|Mega-Armoured Boarding Parties"
                r"|Prow Ram|Tellyporta|Klaws|Shokk-Attack Lance|Assault Karrier)$", re.I),
     dict(cap=1)),
    (re.compile(r"^Grey Knights$"), re.compile(r"^ORDNANCE AND UPGRADES$"),
     re.compile(r"^Grey Knights Terminators$", re.I), dict(cap=1)),
    # s.145 "Any Grey Knights capital ship in the fleet may embark an Honour
    # Guard": Blackship (s.148 "not crewed by Space Marines") ja Inquisitorial
    # Cruiser eivat ole Grey Knightsin aluksia (pistokoe 9 rivi 6).
    (re.compile(r"^Grey Knights$"), re.compile(r"^ORDNANCE AND UPGRADES$"),
     re.compile(r"^Grey Knights Honour Guard$", re.I), dict(cap=1, nmno=r"blackship|inquisitorial")),
    (re.compile(r"Tzeentch"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^Warp Beasts$", re.I), dict(cap=1, up=r"^the mark of tzeentch")),
    # s.236 "Any ship led by a Lord of Tzeentch (and not the Warmaster!)" ja
    # s.237 "A Daemonship may not be commanded by a Warmaster or a Chaos Lord"
    # (pistokoe 11 rivit 60, 61, 69).
    (re.compile(r"Tzeentch"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^Strand of Fortune$", re.I), dict(cap=1, noup=r"^daemonship:")),
    (re.compile(r"Nurgle"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^(?:Hives of Nurgle|Ark of Pestilence)$", re.I),
     dict(cap=1, up=r"^the mark of nurgle|^daemonship:")),
    (re.compile(r"Khorne"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^Berzerker Tide$", re.I),
     dict(cap=1, up=r"^the mark of khorne|^daemonship:")),
    (re.compile(r"Slaanesh"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^(?:Veil of Lust|Siren.s Summon)$", re.I),
     dict(cap=1, up=r"^the mark of slaanesh|^daemonship:")),
]
_ROW_COND_HITS = [0]
_ROW_COND_LOG = []
# Da Ork Clanz s.372: "Space Hulks so led can take upgrades from the list of
# Gubbins for double the listed cost. Upgrades that increase its boarding
# value or speed may not be taken." Soopa Boostas (+5 cm) jaa pois; muista
# hulkille oma kopio tuplahintaan (s.390: "Extra Powerfields costs +50 pts
# instead of +25"). Mega-Armoured Boarding Parties on nopan muunnin, ei
# boarding value - s.390: "Mega-armoured Boarding Parties is unchanged"
# (pistokoe 19 kierros 3, T15: aiempi kielto oli tulkintavirhe).
_HULK_GUBBIN_NO = re.compile(r"^(?:Soopa Boostas)$", re.I)
# s.371 MORE GUBBINS on oma listansa omalla luvallaan: "The following gubbins
# can be taken by any number of capital ships in the fleet." s.372:n tuplaus
# koskee "upgrades from the list of Gubbins", eli s.370-371:n GUBBINS-listaa,
# joten hulk maksaa naista listahinnan (tulkintapaatos T31, 14.9.2026).
_HULK_GUBBIN_FLAT = re.compile(r"^(?:Klaws|Shokk-Attack Lance|Assault Karrier)$", re.I)
_HULK_GUBBIN_HITS = [0]
# Waaagh!-listan hulkin Warlord (s.390, J224): oma +50-rivi, ks. vaihe 4.
_HULK_PF_HITS = [0]
# Osiot joissa Markit eivat sulje toisiaan pois: s.232 "they may be given
# up to four Marks of Chaos as shown below (no Mark may be taken more than
# once)". GROUPS antaa nimen perusteella ryhman "mark"; tassa se puretaan.
_MULTI_MARK = re.compile(r"up to four Marks of Chaos", re.I)
_MULTI_MARK_HITS = [0]


# Listapaivitysten vaikutukset ja kortin kuvaukset (tyojono J1, Codex 10.9.).
# (lista, osio, rivin nimi, kentat). Kentat kirjoitetaan riville; "cond"
# yhdistetaan olemassa olevaan ehtoon. desc = kirjan lause, joka tulostuu
# kortin paivitysruutuun kun kirjan osiossa ei ole rivin omaa lausetta.
# Jokainen lause on kirjasta (sivu kommentissa); tama on kasin luettu taulu.
_CLANZ = re.compile(r"Da Ork Clanz")
_GUB = re.compile(r"^GUBBINS$")
_CLAN = re.compile(r"^CLAN UPGRADES$")
_TYR = re.compile(r"^Tyranids")
_BIO = re.compile(r"^BIO-ENHANCEMENTS$")
ROW_EFFECTS = [
    # --- Da Ork Clanz: Gubbins (s.370-371) ---
    (_CLANZ, _GUB, re.compile(r"^Soopa Boostas$", re.I),
     dict(mod=dict(sp=5), desc="The ship gains +5 cm speed, and it rolls 4D6 cm when on All Ahead Full special orders.")),
    (_CLANZ, _GUB, re.compile(r"^Extra Power Fields$", re.I),
     dict(mod=dict(sh=1), desc="The ship's shield value is increased by +1. If this would take it to 3 or more shields, don't forget to mount it on a 60 mm base!")),
    (_CLANZ, _GUB, re.compile(r"^Extra Turrets$", re.I),
     dict(mod=dict(tu=2), cond=dict(cap=1, noup=r"^maniac turrets"),
          desc="The ship gains +2 Turrets. This cannot be combined with Maniac Turrets.")),
    (_CLANZ, _GUB, re.compile(r"^Maniac Turrets$", re.I),
     dict(set=dict(tu="D3"), cond=dict(noup=r"^extra turrets"),
          desc="The ship's turret value is replaced by D3 turrets. This cannot be combined with Extra Turrets.")),
    (_CLANZ, _GUB, re.compile(r"^Looted Lances$", re.I),
     dict(swp=dict(f=r"heavy gunz", nmf=r"heavy gunz(?: battery)?", nm="lance battery", rg="30 cm", st="2"),
          cond=dict(cap=1, has="heavy gunz"),
          desc="Any heavy gunz batteries on the ship are replaced with a Strength-2 lance battery. Range is 30 cm for capital ships.")),
    (_CLANZ, _GUB, re.compile(r"^Looted Torpedoes$", re.I),
     # Vaikutus vain torpedoilla: Slamblastalla (s.378) ei ole torpedoja,
     # joten rivi maksoi 20 pts ilman vaikutusta (pistokoe 8 rivi 37).
     dict(cond=dict(has="torpedo"),
          desc="The ship may re-roll the dice for the Strength of torpedo salvoes when it fires.")),
    (_CLANZ, _GUB, re.compile(r"^Mad Meks$", re.I),
     dict(desc="The ship may re-roll the dice when repairing critical damage.")),
    (_CLANZ, _GUB, re.compile(r"^Maniac Gunners$", re.I),
     dict(desc="The ship may re-roll the dice for the firepower of its gunz when it fires.")),
    (_CLANZ, _GUB, re.compile(r"^Mega-Armoured Boarding Parties$", re.I),
     dict(desc="The ship has an additional +1 modifier when rolling for boarding actions and hit-and-run attacks of any type.")),
    (_CLANZ, _GUB, re.compile(r"^Prow Ram$", re.I),
     dict(desc="+1 bonus when rolling a leadership check to ram, and the ram causes 1Hp before rolling to inflict damage.")),
    (_CLANZ, _GUB, re.compile(r"^Tellyporta$", re.I),
     dict(desc="Hit-and-run teleport attacks can be made to 30 cm.")),
    (_CLANZ, _GUB, re.compile(r"^Shokk-Attack Lance$", re.I),
     dict(swp=dict(f=r"prow heavy gunz", nmf=r"heavy gunz(?: battery)?", nm="shokk-attack lance", rg="30 cm", st="Special"),
          cond=dict(has="prow heavy gunz"),
          desc="Replaces the prow heavy gunz. Not while crippled or braced; only against a ship with shields down. Hits on 4+ at 30 cm (holofields and bracing save): D3+1 snotling hordes board it, each adding an extra D6 to its next Leadership check or special order until cleared; a miss places a Blast Marker on the Ork ship. Against escorts: D6, 1-3 destroys the nearest unshielded escort, 4+ places a Blast Marker.")),
    (_CLANZ, _GUB, re.compile(r"^Assault Karrier$", re.I),
     dict(cond=dict(has=["launch bay", "torpedo"]),
          desc="Takes boarding torpedoes for free but may only use assault boats. It may launch +1 assault boat marker each time it launches attack craft (even if crippled or braced, but not both).")),
    # --- Da Ork Clanz: klaanit (s.369) ---
    (_CLANZ, _CLAN, re.compile(r"^Clan: Goffs", re.I),
     dict(desc="All Goff ships (including tiddla skwadrons) gain a +1 bonus to the dice roll during boarding actions and a +1 Leadership bonus when attempting to ram.")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Evil Sunz", re.I),
     dict(mod=dict(sp=5), desc="All Evil Sunz ships gain +5 cm speed.")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Bad Moonz", re.I),
     dict(desc="All ships in a Bad Moonz skwadron gain the Maniac Gunners upgrade: they may re-roll the dice for the firepower of their gunz.")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Deathskullz", re.I),
     dict(desc="Deathskullz capital ships and/or tiddla skwadrons have 'looted' upgrades (torpedoes and/or lances) for no additional cost.")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Blood Axes", re.I),
     dict(desc="The Warlord's ship may take one refit from the Imperial Navy refit table (rolled randomly) for +20 points. A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos escorts at their listed cost.")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Snakebites", re.I),
     dict(cond=dict(ty=r"escort|defence"),
          desc="Snakebite capital ship skwadrons can only be space hulks or roks. Snakebite skwadrons gain a +1 bonus to Command checks when attempting to Brace for Impact.")),
    # --- Tyranids: bio-enhancements (s.426-427) ---
    (_TYR, _BIO, re.compile(r"^Solar Vanes$", re.I),
     dict(mod=dict(sp=5), desc="The ship gains +5 cm speed.")),
    (_TYR, _BIO, re.compile(r"^Adrenaline Sacs$", re.I),
     dict(desc="The ship gains +1D6 when on All Ahead Full special orders.")),
    (_TYR, _BIO, re.compile(r"^Psychic Scream$", re.I),
     dict(cond=dict(nm="hive ship"), desc="Any enemy vessels within 15 cm suffer -2 Ld. Intended solely for hive ships.")),
    (_TYR, _BIO, re.compile(r"^More Discharge Vents$", re.I),
     dict(cond=dict(cap=1), desc="The creature reduces the distance it needs to move before turning by 5 cm. Not intended for escorts.")),
    (_TYR, _BIO, re.compile(r"^Extra Spore Cysts", re.I),
     dict(mod=dict(tu=1), cond=dict(nmno="kraken"),
          desc="The ship gains one spore cyst (+1 spore; each cyst is one shield and one turret). No more than two can be gained this way; Kraken cannot take it.")),
    (_TYR, _BIO, re.compile(r"^Reinforced Carapace", re.I),
     dict(mod=dict(hp=1), cond=dict(cap=1),
          desc="The ship gains +1 Hit. No more than four additional Hits for hive ships, and no more than three for cruisers. Not intended for escorts.")),
    (_TYR, _BIO, re.compile(r"^Mucous Membrane$", re.I),
     dict(desc="Bombers and assault boats suffer -1 on their Attack roll, and all torpedoes must roll +1 to hit (maximum of 6+). Ranged weapon hits remain unaffected.")),
    (_TYR, _BIO, re.compile(r"^Accelerated Healing$", re.I),
     dict(cond=dict(cap=1), desc="Capital ships roll two extra dice in the End phase when attempting to repair critical damage, added after halving for a Blast Marker in contact. Not intended for escorts.")),
    (_TYR, _BIO, re.compile(r"^Drone Link$", re.I),
     dict(desc="When within 15 cm of a Vanguard drone ship, all pyro-acid batteries benefit from a left shift on the Gunnery table (before all other modifiers).")),
    (_TYR, _BIO, re.compile(r"^Tenacity$", re.I),
     dict(desc="When on All Ahead Full, Burn Retros or Come to New Heading special orders, its pyro-acid batteries and bio-plasma weapons are unaffected.")),
    (_TYR, _BIO, re.compile(r"^Mega-Spore Mines$", re.I),
     dict(per="bay", cond=dict(cap=1, has="launch bay"),
          swp=dict(f=r"launch bays?", nmf=r"launch bays?", nm="mega-spore mine launchers", rg="Mega-spore mines"),
          desc="All launch bays are exchanged for spore mine launchers; each launch bay can launch one mega-spore mine in the Ordnance phase. Mega-spore mines follow the rules for mines, but the hits rolled against armour are fire criticals instead. Not intended for escorts.")),
    # --- Demiurg: laivaston re-rollit (s.486) ---
    (re.compile(r"^Demiurg"), re.compile(r"^Re-rolls$"), re.compile(r"re-roll", re.I),
     dict(desc="Demiurg fleet re-rolls, bought for the fleet as a whole and not as Fleet Commander re-rolls: the fleet gets one re-roll plus these. They can only be used for Demiurg vessels, not allied ships. Buy them once for the fleet.")),
    # --- saantotekstit riveille, joilla kirjan lausetta ei ollut (J1) ---
    (re.compile(r""), re.compile(r""), re.compile(r"^Torpedo bombers$", re.I),
     dict(desc="Torpedo bombers are an additional attack craft type (bombers are not replaced): 20 cm, count as bombers for interception. From the Ordnance phase after launch a squadron may become a Strength-2 torpedo salvo, removed at the end of that phase; a wave may combine salvoes. Cost per launch bay Strength. (Fleets p. 22)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Shark assault boats", re.I),
     dict(desc="The Emperor's launch bays may also launch Shark assault boats (30 cm). (Fleets pp. 49, 53)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Xenotech System, rolled randomly", re.I),
     dict(desc="Roll D6 on the Xenotech Systems table and note the result: 1 Long Range Sensors +1 base Ld (max 10); 2 Targeting Matrix: targets within 30 cm count as closing, no right shift beyond 30 cm; 3 Advanced Shielding +1 shield; 4 Ship Defense Grid +1 turret; 5 Advanced Drive +5 cm speed and +1D6 on All Ahead Full; 6 Gravitic Thrusters double the maximum turn. (Fleets p. 175)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Choose the Xenotech System", re.I),
     dict(desc="Pay +5 per ship to select the Xenotech System instead of rolling for it. (Fleets p. 175)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Leech torpedoes$", re.I),
     dict(desc="Leech torpedoes at no extra cost, loaded with a specific Reload Ordnance roll (or start loaded by noting it on the ship sheet). A hit causes one automatic critical instead of damage: Speed -10 cm and no All Ahead Full until repaired. (Fleets p. 347)")),
    (re.compile(r"^Orks"), re.compile(r""), re.compile(r"^Torpedo-bommas$", re.I),
     dict(desc="Torpedo-bommas: 20 cm bombers with no fighter ability. From the turn after launch each marker may become a Strength-2 torpedo salvo; an additional attack craft type. Cost per launch bay strength. (Fleets p. 359)")),
    (re.compile(r"^Orks"), re.compile(r""), re.compile(r"^Boarding torpedoes( \(Space Hulk\))?$", re.I),
     dict(desc="Its torpedoes may be boarding torpedoes: a Hit & Run attack instead of torpedo damage when they hit. (Fleets p. 360, Rulebook p. 78)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Improved Logic Engines$", re.I),
     dict(desc="Kor'O'Mesme's vessel ignores the Leadership effects of being in contact with Blast Markers. (Fleets p. 453)")),
    (re.compile(r"Crusade"), re.compile(r"^Fortress-Monastery$"), re.compile(r"re-roll", re.I),
     dict(desc="The fortress-monastery's own re-rolls, usable for its own command checks only. If the Master of the Fleet is assigned to it, they are added to his and may be used by the entire fleet. (Fleets p. 98)")),
    (re.compile(r"^Necrons"), re.compile(r"^Re-rolls$"), re.compile(r"re-roll", re.I),
     dict(desc="Necron fleet re-rolls, bought for the fleet as a whole and not as Fleet Commander re-rolls: the fleet gets one re-roll plus these. Buy them once for the fleet. (Fleets p. 404)")),
    (re.compile(r"^Tyranids"), re.compile(r"^FLEET COMMANDER$"), re.compile(r"^Hive Mind Influence re-roll$", re.I),
     dict(desc="Works like a normal fleet commander re-roll. At most one per hive ship in the fleet. (Fleets p. 430)")),
    (re.compile(r"^Tyranids"), re.compile(r"^FLEET COMMANDER$"), re.compile(r"^Hive Mind Imperative$", re.I),
     dict(desc="A Command check or Leadership test is passed automatically; decide before the dice are rolled. At most one per two hive ships, or one with at least one hive ship. (Fleets p. 430)")),
    (re.compile(r"^Tyranids"), re.compile(r"^HIVE SHIPS$"), re.compile(r"^Increase to Ld 9$", re.I),
     dict(desc="The hive ship has Leadership 9 instead of 8. (Fleets p. 430)")),
    # --- Chaos: Space Marine -miehiston Thunderhawkit (J213, s.235) ---
    (re.compile(r"^Chaos"), re.compile(r"^(?:ORDNANCE|Marine crew may be)$"),
     re.compile(r"^Thunderhawk Gunships \(Chaos Space Marine crew\)$", re.I),
     dict(desc="The ship's launch bays carry Thunderhawk Gunships, and then only Thunderhawks: it may not launch "
               "any other attack craft. Only a ship with a Chaos Space Marine crew. (Fleets p. 235)")),
    # --- Bakka: Adeptus Mechanicus -alusten Fleet Defence Turrets (J217, s.50) ---
    (re.compile(r"Bakka"), re.compile(r"^Adeptus Mechanicus$"),
     re.compile(r"^Fleet Defence Turrets \(instead of a Mechanicus Gift\)$", re.I),
     dict(desc="Instead of a Mechanicus Gift: two of the ship's turrets protect it or one other vessel within "
               "15 cm each ordnance phase, adding +2 to that ship's turret strength (not to bomber attack rolls "
               "when defending another vessel). (Fleets p. 50)")),
]
_ROW_EFFECT_LOG = []
# Saattajaversio kapitaalin rivista (s.370: "Escorts get +1 Turret";
# Looted Lances "Range is 15 cm for escorts"). Hulkin kopiot tehdaan ennen
# tata, joten saattajaversiosta ei synny hulkkikopiota.
ESC_SPLITS = [
    (_CLANZ, _GUB, "Extra Turrets", "Extra Turrets (escorts: +1 turret)",
     dict(mod=dict(tu=1), cond=dict(esc=1, nmno="hulk", noup=r"^maniac turrets"),
          desc="Escorts get +1 Turret. The cost is for the whole tiddla skwadron.")),
    (_CLANZ, _GUB, "Looted Lances", "Looted Lances (escorts: 15 cm)",
     dict(swp=dict(f=r"heavy gunz", nmf=r"heavy gunz(?: battery)?", nm="lance battery", rg="15 cm", st="2"),
          cond=dict(esc=1, nmno="hulk", has="heavy gunz"),
          desc="Any heavy gunz batteries on the escorts are replaced with a Strength-2 lance battery. Range is 15 cm for escorts. The cost is for the whole tiddla skwadron.")),
    # s.371 Klaws: "(Not for escorts except the Grunt at +5 points per escort.)"
    # Listan ainoa saattajakohtaisesti hinnoiteltu Gubbin, joten per="hull"
    # eika koko skwadronin kiintea hinta (tulkintapaatos T31, 14.9.2026).
    (_CLANZ, _GUB, "Klaws", "Klaws (Grunt: +5 per escort)",
     dict(p=5, per="hull", cond=dict(esc=1, nm="grunt"),
          desc="Grunt assault ships only, +5 points per escort. Once per turn on base contact roll 2D6; each 4+ is one hit ignoring shields (not holofields). Brace works. Two hits latch on: neither ship moves if the target is the same class or smaller, both shoot at half effect, and it attacks again each End phase.")),
]
_ESC_SPLIT_HITS = [0]
_DEATHSKULLZ_HITS = [0]
_BIO_EACH_HITS = [0]


def sec_group(list_name, sec_title):
    for lrx, srx, name in SEC_GROUPS:
        if lrx.search(str(list_name or "")) and srx.search(str(sec_title or "")):
            return name
    return None


# --------------------------------------------------------- proosapaivitykset
#
# (listan nimi, osion otsikko, lahdelause, rivit)
#
#   lause  = regex jonka TAYTYY loytya osion saantotekstista; sen ryhmat
#            voi kayttaa hinnassa muodossa "$1"
#   rivit  = lista dicteja: l=nimi, p=hinta ("$1" = lauseesta), muut liput
#
# Kaikki hinnat luetaan lahdelauseesta silloin kun kirja kirjoittaa ne
# siihen. Kasin kirjoitettu luku on vain siella missa lause ei sisalla sita.

# Rungot joilla xenotech on jo omana optionaan: Heavy Transport (s.182,
# +10 yksi refit) ja Xenos Vessel -variantit (s.184-188).
_XENO_OWN = r"heavy transport|xenos vessel|fra.al raider|nekulli whip|pthuxutl"
# Stryxis Caravan Vessel on liittolainen (s.196 "cannot ally with any fleet
# that contains Eldar vessels"). s.175 myy taulukon "each Rogue Trader vessel"
# -alukselle ja s.176 rajaa: "can only be used by Rogue Trader cruisers and
# escorts, not by other reserves or allied vessels in the fleet" (pistokoe 19, J36).
_XENO_NOT = _XENO_OWN + "|stryxis caravan"

EXTRA = [
    # ---- Chaos: Warmasterin lisa-re-roll ja pakollinen Mark ----------------
    dict(lst=r"Chaos", sec=r"^Chaos Warmaster",
         sent=r"Warmaster may be given an extra re-roll at a cost of \+?(\d+)\s*points",
         rows=[dict(l="One extra re-roll", p="$1", a=1)]),
    # dflt eika req: rivi on valittuna kun alus lisataan, mutta sen saa
    # poistaa. Syy on kirjassa: jumalan oma battle barge kantaa Markin jo
    # hinnassaan - "This ship bears the Mark of Nurgle as part of its point
    # cost; it does not have to be paid for separately by the ship's
    # commander" (s.262, ja sama s.258/260/264) - ja lukittu rivi veloitti
    # sen toisen kerran. Vaatimus itse ei katoa: se on nyt laivastotason
    # saanto (mark_paid), joka nakee kumpi tilanne on kasilla.
    dict(lst=r"Chaos", sec=r"^Chaos Warmaster",
         sent=r"The Warmaster must take the (Mark of \w+)",
         rows=[dict(l="The $1", p="@The $1", a=1, dflt=1)]),

    # ---- Chaos: Lordin re-roll (kirjassa vain leipatekstissa) -------------
    dict(lst=r"Chaos", sec=r"^Chaos Lords?$",
         sent=r"A Lord may be given a re-roll[^.]*?(?:for|at) \+?(\d+)\s*points",
         rows=[dict(l="One re-roll (his own ship or squadron only)", p="$1", a=1)]),

    # ---- Chaos: Space Marine -miehisto ------------------------------------
    # "Any capital ship can be designated" - ei escorteille; Daemonshipilla
    # ei voi olla CSM-miehistoa (s.227, 237, 241, 245, 249).
    dict(lst=r"Chaos", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"capital ship can be designated as having (?:a|an)\s*(.*?)\s*Chaos Space Marine crew at \+?(\d+)\s*points",
         rows=[dict(l="$1 Chaos Space Marine crew", p="$2", a=1,
                    # s.260: Wage of Sin "always counts as being crewed by
                    # Emperor's Children Chaos Space Marines (included it its
                    # cost)" - ei myyda uudelleen (pistokoe 8 rivi 39).
                    # s.288: "Hulks cannot take any upgrade that improves
                    # Boarding Value" (miehisto +2 boarding) ja "It may not
                    # take any Chaos Marks" (pistokoe 12 rivi 73).
                    # Chaos Space Hulk saa miehiston (T21): s.287 "including the
                    # Warmaster's base leadership, having Chaos Space Marines
                    # embarked"; miehiston +2 on nopan muunnin, ei boarding value.
                    cond=dict(cap=1, noup=r"^daemonship:", nmno=r"^wage of sin|^slaverer"))]),
    dict(lst=r"Chaos", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"For \+?(\d+)\s*points, battleships and grand cruisers[^.]*?may include Chosen Terminators",
         # Lause itse rajaa: "battleships and grand cruisers ... may include".
         # Ilman ehtoa rivi tarjottiin myos Chaos Space Hulkille (Defence),
         # jolle s.288 lisaksi kieltaa boarding-arvoa parantavat paivitykset.
         # "... with Chaos Space Marine Warmasters, Lords or crews may include
         # Chosen Terminators" (s.235-249): miehisto on ehto. Warmasterin ja
         # Lordin sidosta alukseen ei mallinneta rivin ehdoissa (pistokoe 7
         # rivit 13, 29, 31, 46, 50, 90).
         rows=[dict(l="Chosen Terminators (battleship / grand cruiser)", p="$1", a=1,
                    cond=dict(ty="battleship|grand cruiser", up=r"chaos space marine crew")),
               # s.260: Wage of Sinin miehisto sisaltyy hintaan, joten se on
               # "battleship ... with Chaos Space Marine ... crews" ilman riviakin.
               # Nimen alku eroaa: annotate poistaa saman nimen ja hinnan
               # kaksoiskappaleet (sulkeet pois nimesta), joten "Chosen
               # Terminators (...)" +10 katosi ensimmaisen rivin toistona.
               dict(l="Wage of Sin: Chosen Terminators (crew included)", p="$1", a=1,
                    cond=dict(nm=r"^wage of sin"))]),

    # ---- Chaos: Space Marine -miehiston Thunderhawkit (J213, S0512) -------
    # s.235: "A ship with a Chaos Space Marine crew may be equipped with
    # Thunderhawk Gunships but if so it may only carry Thunderhawks and may
    # not launch any other attack craft." Hintaa ei ole, joten rivi on 0 pts.
    # Jumalalistoilla poimija katkaisi lauseen osion otsikoksi ("Marine crew
    # may be"), Tzeentchilla lause loppuu kesken - siksi kaksi osionimea ja
    # lauseen keskiosa hakuna. Incursion-listalla lausetta ei ole.
    dict(lst=r"Chaos", sec=r"^(?:ORDNANCE|Marine crew may be)$",
         sent=r"equipped with Thunderhawk Gunships but if so",
         rows=[dict(l="Thunderhawk Gunships (Chaos Space Marine crew)", p="0", a=1,
                    cond=dict(up=r"chaos space marine crew", has="launch bay"),
                    x="The ship then carries only Thunderhawks and launches no other attack craft.")]),

    # ---- Chaos: Mark jumallistan aluksille -------------------------------
    # Jumallistoilla Markin saa vain Warmaster (pakollinen, oma rivi), Lord
    # (oma rivi), CSM-miehistoinen alus ("A ship with a ... Chaos Space
    # Marine crew may have a Mark of X", s.236/240/244/248) ja Daemonship
    # (Nurgle/Khorne/Slaanesh: sisaltyy hintaan; Tzeentch: "paid for
    # separately", s.237). Hinta luetaan Warmasterin Mark-rivilta (@).
    # Nurglen Mark antaa +1 Damage Point (s.240).
    dict(lst=r"Tzeentch", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Tzeentch)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # s.258 Scion of Prospero: Mark "as part of its point cost" (pistokoe 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^scion of prospero"))]),
    dict(lst=r"Nurgle", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Nurgle)",
         rows=[dict(l="The $1", p="@The $1", a=1, mod=dict(hp=1),
                    # s.262 Terminus Est: Mark "as part of its point cost" (pistokoe 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^terminus est"))]),
    dict(lst=r"Khorne", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Khorne)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # s.264 Slaverer: Mark "as part of its point cost" (pistokoe 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^slaverer"))]),
    dict(lst=r"Slaanesh", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Slaanesh)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # s.260 Wage of Sin: Mark "as part of its point cost" (pistokoe 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^wage of sin"))]),
    dict(lst=r"Tzeentch", sec=r"^DAEMONSHIPS$",
         sent=r"Daemonships in a Sorcerous Fleet may only take the (Mark of Tzeentch), paid for separately",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    cond=dict(cap=1, up=r"^daemonship:"))]),

    # ---- Orkit: Dakka Dakka ----------------------------------------------
    # s.367: capital shipille +2 tornia, escortille +1 tornia per alus -
    # rivi kuuluu vain omalle alusluokalleen ja muuttaa tornit.
    # Capital ship = battleship tai cruiser (Rulebook s.42: "battleships and
    # cruisers are often grouped together under the general heading of capital
    # ships"). Rok (s.392 "Defence/8") ja Ork hulk (s.389 "Defence/40") eivat
    # ole kumpaakaan eivatka escorteja: ei Dakka Dakkaa (kayttaja 12.10.2026,
    # J189). Ehto cap=1 tarkoittaa domainissa vain "ei escort", joten tyyppi
    # nimetaan erikseen. Sama boarding torpedoes -riveilla alempana (s.359:
    # "Any capital ship in the Ork fleet list armed with torpedoes"; Rokilla
    # on torpedot, mutta se ei ole capital ship - hulkilla on oma +15:n rivi).
    dict(lst=r"Ork", sec=r"DAKKA DAKKA",
         sent=r"capital ships can add \+2 turrets to their ships for \+?(\d+)\s*points",
         rows=[dict(l="Dakka Dakka: +2 turrets", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser"), mod=dict(tu=2))]),
    dict(lst=r"Ork", sec=r"DAKKA DAKKA",
         sent=r"escorts may add \+1 turret for \+?(\d+)\s*points per escort",
         rows=[dict(l="Dakka Dakka: +1 turret (every escort in the squadron)",
                    p="$1", a=1, per="hull", cond=dict(esc=1), mod=dict(tu=1))]),

    # ---- Ordnance-lisaostot ----------------------------------------------
    # Ei orkeille: heilla sama osto tulee jo faktion yhteisista
    # saannoista nimella "Torpedo-bommas" (kirjan oma sana). Kahdella eri
    # nimella sama rivi jai kaksoiskappaleiden karsinnalta huomaamatta ja
    # nakyi Clanz-listalla kahdesti samalla hinnalla.
    dict(lst=r"^(?!Orks|Demiurg)", sec=r"^ORDNANCE$",
         sent=r"torpedo[\s-]*bom[bm](?:er|ma|a)s? for \+?(\d+)\s*points per launch bay",
         rows=[dict(l="Torpedo bombers", p="$1", a=1, per="bay",
                    cond=dict(has="launch bay"),
                    x="Per launch bay strength.")]),
    # s.487: "Demiurg ships utilize highly automated versions of ... They
    # do not have access to boarding torpedoes but may use torpedo bombers
    # for +10 points per launch bay." Liittolaiset (Tau, Rogue Trader,
    # Kroot) eivat saa - pistokoe 6 rivi 90 tarjosi rivin Emissarylle.
    dict(lst=r"Demiurg", sec=r"^ORDNANCE$",
         sent=r"do not have access to boarding torpedoes but may use torpedo bombers for \+?(\d+)\s*points per launch bay",
         rows=[dict(l="Torpedo bombers", p="$1", a=1, per="bay",
                    cond=dict(has="launch bay", nm="commerce vessel"),
                    x="Demiurg vessels only. Per launch bay strength.")]),
    dict(lst=r"Ork", sec=r"^ORDNANCE$",
         sent=r"capital ships that use torpedoes may use boarding torpedoes for \+?(\d+)\s*points",
         # Lause itse rajaa: "capital ships that use torpedoes". Ilman ehtoa
         # rivi tarjottiin Onslaught-escortille (pistokoe 6 rivi 71).
         rows=[dict(l="Boarding torpedoes", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser", has="torpedo", nmno="hulk"))]),
    dict(lst=r"Bakka", sec=r"^ORDNANCE$",
         sent=r"Emperor class battleship may carry Shark assault boats at an additional cost of \+?(\d+)\s*points",
         # Lause rajaa itse: "An Emperor class battleship may carry Shark assault
         # boats" - rivi tarjottiin Mercurylle ja Victorylle (pistokoe 7 rivit 25, 39).
         rows=[dict(l="Shark assault boats (Emperor class only)", p="$1", a=1,
                    cond=dict(nm="emperor"))]),
    dict(lst=r"Space Marines", sec=r"^ORDNANCE$",
         sent=r"may be equipped with an Honour Guard for \+?(\d+)\s*points per ship",
         # s.99: "Any battle barge or strike cruiser in the fleet may be
         # equipped with an Honour Guard" - ei escorteille (pistokoe 6 rivi 13).
         rows=[dict(l="Honour Guard", p="$1", a=1,
                    cond=dict(nm="battle barge|strike cruiser"))]),

    # ---- Bakka: +1 turret --------------------------------------------------
    dict(lst=r"Bakka", sec=r"^Imperial Navy$",
         sent=r"\+1 turret\.+\s*\+?(\d+)\s*points",
         # s.50: "Any capital ship of Battlefleet Bakka can add this upgrade."
         # s.50: "Reserve vessels may not be given this upgrade" - Jovian on
         # Bakka-listan RESERVES-rivi (J11 systemaattinen haku).
         # J213: lainattu alus on Bakan reservi, joten isannan rivia ei
         # tarjota sille (nohost); Bakka-alus muualla reservina vie oman
         # rivinsa mukanaan, koska se on sen oman listan rivi.
         # J217 s.50: rivi on "Imperial Navy" -otsikon alla; Bakkan
         # Adeptus Mechanicus -alukset ottavat Fleet Defence Turrets -rivin
         # (oma otsikkonsa), joten Mechanicus-alukselle tata ei tarjota.
         rows=[dict(l="+1 turret (Battlefleet Bakka refit)", p="$1", a=1,
                    cond=dict(cap=1, nmno=r"jovian", nohost=1, nomech=1), mod=dict(tu=1))]),

    # ---- Bakka: Adeptus Mechanicus -alusten Fleet Defence Turrets (J217) ----
    # s.50: "When used with Battlefleet Bakka, Adeptus Mechanicus capital ships
    # may take the Fleet Defence Turrets refit instead of rolling randomly on
    # the Mechanicus Gifts table." Lahja on ilmainen, joten vaihto on 0 pts.
    dict(lst=r"Bakka", sec=r"^Adeptus Mechanicus$",
         sent=r"may take the Fleet Defence Turrets refit instead of rolling randomly",
         rows=[dict(l="Fleet Defence Turrets (instead of a Mechanicus Gift)", p="0", a=1,
                    cond=dict(cap=1, mech=1),
                    x="Two turrets on a ship are exchanged for fleet defence turrets capable of protecting itself "
                      "or any one other vessel within 15 cm each ordnance phase, adding +2 to the turret strength "
                      "of the ship it is defending (this does not alter bomber attack rolls when used to defend "
                      "another vessel).")]),

    # ---- Rogue Trader -kalusto --------------------------------------------
    dict(lst=r"Rogue Traders", sec=r"POWER RAM",
         sent=r"Power Ram may be taken by any Rogue Trader capital ship with a 6\+ prow for \+?(\d+)\s*points",
         # Lause rajaa itse: capital ship, 6+ keula, ei Nova Cannon. Ilman
         # ehtoa rivi tarjottiin escorteille ja 5+ keulille (pistokoe 6, 12
         # rivia). Demiurg- ja Kroot-liittolaiset eivat ole "Rogue Trader
         # capital ship" (s.176) eivatka "Imperial capital ship" (s.32).
         rows=[dict(l="Imperial Power Ram (6+ prow, not with a Nova Cannon)",
                    p="$1", a=1,
                    # FAQ 2026 *Power ram* (kayttajan paatos 20.10.2026: FAQ on
                    # kolmas auktoriteetti): "only Imperial Navy, Rogue Trader and
                    # Adeptus Mechanicus ships ... not available for Strike
                    # Cruisers". Pirates-listan Space Marine Strike Cruiser
                    # (s.178) rajataan samoin kuin Armageddonissa.
                    cond=dict(cap=1, prow="6", no="nova cannon",
                              nmno="commerce vessel|warsphere|strike cruiser|battle barge"))]),
    dict(lst=r"Rogue Traders", sec=r"THE BEST MONEY CAN BUY",
         sent=r"roll randomly against the Xenotech System table below for \+?(\d+)\s*points per cruiser or \+?(\d+)\s*points per escort",
         # Kaksi hintaa, kaksi rivia: aiemmin escortille tarjottiin cruiserin
         # 15 (pistokoe 6 rivi 74). Heavy Transport (s.182, oma +10 optio)
         # ja Xenos Vessel -rungot (s.184-188, xenotech sisaltyy) eivat saa
         # listan riveja paalle.
         rows=[dict(l="Xenotech System, rolled randomly (cruiser)", p="$1", a=1,
                    cond=dict(cap=1, nmno=_XENO_NOT)),
               dict(l="Xenotech System, rolled randomly (escort, per ship)", p="$2", a=1,
                    # s.192 Fast Clipper: "Instead of taking a refit normally" -
                    # otettu Fast Clipper korvaa Xenotech-refitin (J16).
                    per="hull", cond=dict(esc=1, nmno=_XENO_OWN, offopt=r"^Fast Clipper"))]),
    dict(lst=r"Rogue Traders", sec=r"THE BEST MONEY CAN BUY",
         sent=r"For an additional \+?(\d+)\s*points per ship, the player can select the desired technology",
         rows=[dict(l="Choose the Xenotech System instead of rolling", p="$1", a=1,
                    # "For an additional +5 points per ship": valinta on lisa heiton
                    # paalle, ei korvaava ostos (pistokoe 19 kierros 2, J60).
                    per="hull", cond=dict(nmno=_XENO_NOT, offopt=r"^Fast Clipper",
                                          up=r"^Xenotech System, rolled randomly"))]),
    # F15 (pistokoe 6 rivi 88): Exploration-lista s.176 "The Xenotech Systems
    # refits listed on [s.175] can only be used by Rogue Trader cruisers and
    # escorts, not by other reserves or allied vessels" ja "may start by
    # taking one refit from the Xenotech list for the appropriate point
    # cost" - hinnat ovat s.175:lla (15 / 5 per escort / +5 valinta).
    dict(lst=r"Exploration", sec=r"The Best Money Can Buy",
         sent=r"Xenotech Systems refits listed on .*? can only be used by Rogue Trader cruisers and escorts",
         rows=[dict(l="Xenotech System, rolled randomly (cruiser)", p="15", a=1,
                    cond=dict(cap=1, nmno=_XENO_NOT + "|commerce vessel|warsphere"),
                    x="Rogue Trader cruisers only; price from the Rogue Traders list (Fleets p. 175)."),
               dict(l="Xenotech System, rolled randomly (escort, per ship)", p="5", a=1,
                    per="hull", cond=dict(esc=1, nmno=_XENO_OWN, offopt=r"^Fast Clipper"),
                    x="Rogue Trader escorts only; price from the Rogue Traders list (Fleets p. 175)."),
               dict(l="Choose the Xenotech System instead of rolling", p="5", a=1,
                    per="hull", cond=dict(nmno=_XENO_NOT + "|commerce vessel|warsphere",
                                          offopt=r"^Fast Clipper",
                                          up=r"^Xenotech System, rolled randomly"),
                    x="Price from the Rogue Traders list (Fleets p. 175).")]),

    # ---- Inkvisiittorit ----------------------------------------------------
    dict(lst=r"Inquisition", sec=r"^Inquisitor Lord$",
         sent=r"A second re-roll can be purchased for \+?(\d+)\s*points",
         rows=[dict(l="One extra re-roll", p="$1", a=1)]),
    # Nama kaksi ovat Grey Knights -listan sivulta 144. Ennen 7.9.2026
    # Grey Knights oli sulautettu Inkvisitioon, joten lst-kuvio oli
    # "Inquisition"; listojen erottamisen jalkeen kohde on Grey Knights.
    dict(lst=r"Inquisition|Grey Knights", sec=r"^FLEET COMMANDER$",
         sent=r"may purchase up to two more re-rolls for \+?(\d+)\s*points each",
         rows=[dict(l="One extra re-roll", p="$1", a=1),
               dict(l="Two extra re-rolls", p="$1*2", a=1)]),
    dict(lst=r"Inquisition|Grey Knights", sec=r"^FLEET COMMANDER$",
         sent=r"Ordo Malleus Inquisitor Lord \(Ld 10\)\s*\.+\s*\+?(\d+)\s*pts",
         rows=[dict(l="Ordo Malleus Inquisitor Lord (Ld 10)", p="$1", a=1, k="cmd")]),

    # ---- Kaappari- ja eldarkomentajat --------------------------------------
    dict(lst=r"Pirates and Wolf Packs", sec=r"^Pirate Captains$",
         sent=r"may purchase up to two more re-rolls for \+?(\d+)\s*points each",
         rows=[dict(l="One extra re-roll", p="$1", a=1),
               dict(l="Two extra re-rolls", p="$1*2", a=1)]),
    dict(lst=r"Iyanden", sec=r"^RESERVES AND ALLIES$",
         sent=r"a second or third re-roll can be purchased at \+?(\d+)\s*points each",
         rows=[dict(l="One extra re-roll", p="$1", a=1),
               dict(l="Two extra re-rolls", p="$1*2", a=1)]),
    dict(lst=r"Iyanden", sec=r"^RESERVES AND ALLIES$",
         sent=r"He must be embarked aboard the Flame of Asuryan if it is present, in which case his cost is (\d+)\s*points",
         rows=[dict(l="Embarked aboard the Flame of Asuryan", p="-25", a=1,
                    x="His cost becomes $1 points instead of 150.")]),

    # ---- AdMech: pakolliset ilmaiset profiilimuutokset --------------------
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"All Mechanicus capital ships add \+1 to a given vessel.s original turret value",
         rows=[dict(l="Mechanicus turret refit (+1 turret)", p="0", req=1,
                    cond=dict(cap=1), mod=dict(tu=1),
                    x="Included in the point cost.")]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"Every Mechanicus cruiser \(not light cruiser\) is equipped with a single 60\s*cm range dorsal lance battery firing left/front/right",
         rows=[dict(l="Mechanicus dorsal lance battery", p="0", req=1,
                    cond=dict(ty="cruiser", nmno="light"),
                    add=["Dorsal lance battery", "60 cm", "1",
                         "Left/front/right"],
                    x="Included in the point cost.")]),

    # ---- Power Ram: kirja kirjoittaa taman FLEET RULES -lohkoon, ei -------
    #      omaan osioonsa, joten se jai aiemmin kokonaan poimimatta.
    dict(lst=r"Imperial Navy", src=r"Gothic Sector", sec=r"^FLEET RULES",
         sent=r"Power Ram may be taken by any Imperial capital ship with a 6\+ prow for \+?(\d+)\s*points",
         # FAQ 2026 *Power ram*: "only Imperial Navy, Rogue Trader and Adeptus
         # Mechanicus ships meeting the prow requirements may take the power
         # ram ... not available for Strike Cruisers in the Battlefleet
         # Armageddon fleet list." Space Marine -rungot (Armageddonin Strike
         # Cruiser ja Battle barge, liiteosion Grey Knights Strike Cruiser)
         # rajataan nimella. Inquisitorial Cruiser ja Blackship ovat
         # Imperiumin risteilijoita (s.138), joten ne saavat rivin
         # (FAQ2026_tarkistus.md kohta 1).
         rows=[dict(l="Imperial Power Ram", p="$1", a=1,
                    cond=dict(cap=1, prow="6", no="nova cannon", nmno="strike cruiser|battle barge"),
                    x="Any Imperial Navy, Rogue Trader or Mechanicus capital ship with a 6+ prow, "
                      "unless it has a Nova Cannon. Not Space Marine strike cruisers or battle barges (FAQ 2026).")]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"Power Ram may be taken by any Mechanicus capital ship with a 6\+ prow for \+?(\d+)\s*points",
         # FAQ 2026 *Power ram*: kuten Imperial Navyn rivi ylla.
         rows=[dict(l="Imperial Power Ram", p="$1", a=1,
                    cond=dict(cap=1, prow="6", no="nova cannon", nmno="strike cruiser|battle barge"),
                    x="Any Imperial Navy, Rogue Trader or Mechanicus capital ship with a 6+ prow, "
                      "unless it has a Nova Cannon. Not Space Marine strike cruisers or battle barges (FAQ 2026).")]),

    # ---- AdMech: Weapons of the Adeptus Mechanicus (Fleets s. 121) --------
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"cruisers \(not light cruisers\) with armour 6\+ prows can replace their prow torpedoes with a Nova Cannon for \+?(\d+)\s*points",
         # 30.9.2026: a hull with its own nova option (Lunar, Tyrant) buys it
         # there - the same purchase (noopt); the Power Ram is "any capital
         # ship with a 6+ prow, unless it has a Nova Cannon" (Fleets p. 118),
         # so a taken ram closes this row (noup) as the nova closes the ram
         rows=[dict(l="Nova Cannon instead of prow torpedoes", p="$1", a=1,
                    cond=dict(ty="cruiser", nmno="light", prow="6",
                              has="prow torpedo", noopt="nova cannon",
                              noup="Power Ram"),
                    swp=dict(f="prow torpedo",
                             t=["Prow nova cannon", "30 - 150 cm", "1", "Front"]),
                    x="Any cruiser with a 6+ prow, even classes that do not "
                      "normally offer it (such as the Gothic).")]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"Mechanicus Retribution battleship can make this trade for \+?(\d+)\s*points",
         rows=[dict(l="Nova Cannon instead of prow torpedoes (Retribution)",
                    p="$1", a=1,
                    cond=dict(nm="retribution", has="prow torpedo",
                              noup="Power Ram"),
                    swp=dict(f="prow torpedo",
                             t=["Prow nova cannon", "30 - 150 cm", "1", "Front"]))]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"cruisers that would normally be equipped with 30\s*cm Weapon Batteries can incorporate plasma-boosted batteries that increase their range to 45\s*cm for \+?(\d+)\s*points",
         rows=[dict(l="Plasma-boosted batteries", p="$1", a=1,
                    cond=dict(ty="cruiser", has="weapons batter@30",
                              noopt="30 cm range weapons batteries with 45"),
                    swp=dict(f="weapons batter", onlyrg="30", rg="45 cm"),
                    x="Weapon battery range 30 cm becomes 45 cm.")]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"They however may each purchase \+1 turret for \+?(\d+)\s*points",
         rows=[dict(l="+1 turret (escort squadron)", p="$1", a=1, per="hull",
                    cond=dict(esc=1), mod=dict(tu=1),
                    x="If taken, every escort in the squadron takes it.")]),
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"Endeavour and\s+Endurance light cruisers may replace their prow torpedoes with a single 30\s*cm range dorsal lance battery firing left/front/right for no cost",
         rows=[dict(l="Dorsal lance instead of prow torpedoes", p="0",
                    cond=dict(nm="endeavour|endurance", has="prow torpedo"),
                    swp=dict(f="prow torpedo",
                             t=["Dorsal lance battery", "30 cm", "1",
                                "Left/front/right"]))]),

    # ---- Inkvisitio ------------------------------------------------------
    dict(lst=r"Inquisition", sec=r"ORDO XENOS",
         sent=r"Alternatively, the refit may be selected for \+?(\d+)\s*points",
         rows=[dict(l="Choose the Xenotech refit instead of rolling",
                    p="$1", a=1)]),
    dict(lst=r"Inquisition", sec=r"ORDNANCE AND UPGRADES",
         sent=r"ship embarking an Inquisitor is equipped with launch bays, it must replace its attack craft with Thunderhawks, with its launch bay strength divided in half",
         rows=[dict(l="Embarks the Inquisitor: Thunderhawks, launch bays halved",
                    p="0", # s.139: "If an Imperial Navy or Adeptus Mechanicus ship embarking an
                    # Inquisitor is equipped with launch bays..." - ei Grey Knightsin
                    # aluksille; nopeutta ei anneta, joten Thunderhawk 20 cm (s.95).
                    # Inquisitorial cruiser (s.150) ei ole Imperial Navyn eika
                    # Mechanicuksen alus; sen Thunderhawk-bayt ovat profiilissa
                    # taydella vahvuudella (pistokoe 8 rivi 48).
                    cond=dict(has="launch bay", nmno="grey knights|inquisitorial"),
                    swp=dict(f="launch bay", halfst=1,
                             rg="Thunderhawk: 20 cm"),
                    x="Only the ship the Inquisitor is aboard.")]),

    # ---- Dark Eldar ------------------------------------------------------
    dict(lst=r"Dark Eldar", sec=r"^FLEET RULES",
         sent=r"Dark Eldar ships armed with torpedoes may use leech torpedoes at no extra cost",
         rows=[dict(l="Leech torpedoes", p="0",
                    cond=dict(has="torpedo"),
                    x="Loaded with a specific Reload Ordnance roll.")]),

    # ---- Tau: Kor'O'Mesmen aluksen refit --------------------------------
    # Kor'O'Mesme on valittavissa vain Commerce Protection -listalla,
    # joten hanen aluksensa refit kuuluu sinne eika Merchant Fleetiin.
    dict(lst=r"Commerce Protection", src=r"Tau", sec=r"^FLEET RULES",
         sent=r"Improved Logic Engines:\s*\+?(\d+)\s*pts",
         # s.453: "His ship can be refitted" - Kor'O'Mesme johtaa Custodiania
         # (s.456). Ilman ehtoa rivi tarjottiin jokaiselle Tau-alukselle
         # (pistokoe 6 rivit 19, 48, 49, 63, 66, 79).
         rows=[dict(l="Improved Logic Engines", p="$1", a=1,
                    cond=dict(nm="custodian"),
                    x="Only the vessel carrying Kor'O'Mesme.")]),

    # ---- Orkit: ordnance hinnoitellaan launch bay -voimakkuudella ---------
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"Torpedo-bommas may be taken by any ship equipped with launch bays for \+?(\d+)\s*points per launch bay strength",
         rows=[dict(l="Torpedo-bommas", p="$1", a=1, per="bay",
                    cond=dict(has="launch bay"),
                    x="Per launch bay strength.")]),
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"capital ship in the Ork fleet list armed with torpedoes can use boarding torpedoes for \+?(\d+)\s*points",
         rows=[dict(l="Boarding torpedoes", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser", has="torpedo", nmno="hulk"))]),
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"A Space Hulk may use boarding torpedoes for \+?(\d+)\s*points",
         rows=[dict(l="Boarding torpedoes (Space Hulk)", p="$1", a=1,
                    cond=dict(nm="hulk"))]),

    # Da Ork Clanz: "Ork Warlord....Free" tuli aiemmin tanne, koska
    # listapoimija pudotti rivin - sanamuotoinen hinta ilman "pts"-paatetta
    # ei kelvannut sen hintakuviolle. Nyt rivi jasentyy natiivisti (k=cmd,
    # p=0), joten injektiota ei tarvita.
]

# ------------------------------------------------------------- hinnastot
#
# (kohdelistat, lahdelista, otsikkolause, rivihahmo, osion nimi)
#
# Rivihahmon viimeinen kaappausryhma on hinta, sita edeltava nimi.

TABLES = [
    dict(lst=r"Tyranids", src=r"Vanguard", into="BIO-ENHANCEMENTS",
         sent=r"If a degree of randomness is desired the following refits "
              r"can be rolled against 2D6",
         row=r"(\d{1,2})[:.]?\s+([A-Z][\w'\- ]{3,32}?)\s*\.{2,}\s*\+?(\d+)\s*pts(\s+each)?",
         nt="Bio-enhancement, Fleets pg. 426-427.",
         # Kirjan omat lauseet s.426 sellaisinaan - parafraasi nakyi
         # pelaajalle kirjan saantona (check_pages.py, 14.9.2026).
         text=["No hive ship may ever have more than three different special refits, "
                     "no cruiser more than two and no escort more than one.",
                     "With the exception of reinforced carapace and extra spore cysts, "
                     "no single bio-enhancement may be granted more than once.",
                     "These refits can only be used in one-off games if both players agree."]),
]

# Gubbins-hinnasto on painettu Waaagh!-listan sivuille (367-371), ja
# Clanz-lista viittaa siihen: "A Warlord may choose for his own ship or
# escort skwadron one upgrade from the Gubbins list". Waaagh!-lista on jo
# jasentanyt rivit kunnolla, joten ne kopioidaan sielta sellaisenaan
# eika jasenneta proosasta uudestaan - muuten sama hinta olisi kahdessa
# paikassa ja voisi eriytya.
GUBBIN_NT = "Gubbin, Fleets pg. 367-371."
# s.372 sanatarkasti. Aiempi teksti sanoi lisaksi "each Gubbin only once",
# jota kirja ei sano - se on rivien oma mx-raja, ei kirjan lause.
GUBBIN_TEXT = ("A Warlord may choose for his own ship or escort skwadron one upgrade "
               "from the Gubbins list for every re-roll he has at its listed cost.")
GUBBIN_SECS = ("GUBBINS", "MORE GUBBINS")
# Saman Clanz-lohkon osiot joissa ei ole hintoja lainkaan. Nekin kuuluvat
# vain Clanz-listalle (Fleets s. 368: "only with its dedicated Clanz fleet
# list"), joten ne siirtyvat sinne tekstiosioina.
ORK_CLANZ_TEXT_SECS = ("MOB RULE", "YOUNG GUNZ")


# Klaanipaivitykset saavat oman osionsa: kirjassa ne ovat Clanz-listan
# saantosivuilla, eivat missaan valmiissa osiossa.
CLANS = [("Goffs", 20, "Black"), ("Evil Sunz", 20, "Red"),
         ("Bad Moonz", 30, "Yellow"), ("Deathskullz", 30, "Blue"),
         ("Blood Axes", 0, "Green"), ("Snakebites", 0, "Brown")]


def _sentences(text):
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if x.strip()]


def _fill(tpl, m):
    """"$1" -> ensimmainen kaappausryhma, "$1*2" -> se kerrottuna kahdella."""
    s = str(tpl)
    mult = 1
    mm = re.match(r"^(.*?)\*(\d+)$", s)
    if mm:
        s, mult = mm.group(1), int(mm.group(2))
    s = re.sub(r"\$(\d)", lambda g: str(m.group(int(g.group(1)))), s)
    return s, mult


def _page_at(pmap, pos):
    """Sivu, jolla liimatun tekstin merkki pos on (lists.py page_map)."""
    pg = None
    for off, p in pmap or []:
        if off > pos:
            break
        pg = p
    return pg


def _joined(raws_l, pages_l):
    """Listan kaikkien osioiden teksti yhtena ja sen sivurajat."""
    out, base = [], 0
    for raw, pm in zip(raws_l, pages_l):
        out += [[base + off, p] for off, p in pm or []]
        base += len(raw) + 1
    return " ".join(raws_l), out


def annotate(lists_out, raws, pages=None):
    """Taydentaa listat paikan paalla.

    raws[li][si] = osion alkuperainen saantoteksti, pages[li][si] sen
    sivurajat [[merkki, sivu], ...]. Proosasta tehty rivi saa lauseensa
    sivun (src_page, J165). Palauttaa (lisatty, ohitettu, varoitukset).
    """
    added, skipped, warn = 0, 0, []
    if pages is None:
        pages = [[[] for _ in r] for r in raws]

    # --- 1. proosariveista oikeita rivaja ---------------------------------
    for li, Lx in enumerate(lists_out):
        for rule in EXTRA:
            if rule.get("src"):
                continue                 # kasitellaan jaettuna vaiheessa 1b
            if not re.search(rule["lst"], Lx["nm"], re.I):
                continue
            sec_hit = sent_hit = priced = False
            for si, sec in enumerate(Lx["secs"]):
                if not re.search(rule["sec"], sec["t"]):
                    continue
                sec_hit = True
                blob = raws[li][si]
                if re.search(r"\d\s*(?:points|pts)", blob, re.I):
                    priced = True
                m = re.search(rule["sent"], blob, re.I)
                if not m:
                    continue
                sent_hit = True
                src = next((s for s in _sentences(blob)
                            if re.search(rule["sent"], s, re.I)), m.group(0))
                for row in rule["rows"]:
                    lab, _ = _fill(row["l"], m)
                    lab = re.sub(r"\s{2,}", " ", lab).strip()
                    lab = lab[0].upper() + lab[1:] if lab else lab
                    if any(str(e["l"]).lower() == lab.lower() for e in sec["ents"]):
                        continue                    # kirjassa jo omana rivinaan
                    ptxt, mult = _fill(row["p"], m)
                    if ptxt.startswith("@"):        # hinta haetaan toiselta rivilta
                        want, _ = _fill(ptxt[1:], m)
                        p = next((e["p"] for s2 in Lx["secs"] for e in s2["ents"]
                                  if str(e["l"]).lower() == want.lower()
                                  and e.get("p") is not None), None)
                    else:
                        p = int(ptxt) * mult
                    note = "The book prints this only in the section text: “%s”" % src
                    if row.get("x"):
                        note = _fill(row["x"], m)[0] + " " + note
                    e = dict(l=lab, r=None, p=p, a=row.get("a", 0),
                             u=0 if row.get("k") == "cmd" else 1,
                             mx=None, nt=note, prose=1,
                             src_page=_page_at(pages[li][si], m.start()))
                    if row.get("req"):
                        e["req"] = 1
                    if row.get("dflt"):
                        e["dflt"] = 1
                    if row.get("per"):
                        e["per"] = row["per"]
                    if row.get("var"):
                        e["var"] = 1
                    for k in ("cond", "swp", "add", "mod"):
                        if row.get(k):
                            e[k] = row[k]
                    sec["ents"].append(e)
                    added += 1
            if sec_hit and not sent_hit and priced:
                skipped += 1
                warn.append("%s / %s: osio on, mutta lahdelause ei tasmaa "
                            "-> ei lisatty (tarkista kirjan sanamuoto)"
                            % (Lx["nm"], rule["sec"]))

    # --- 1b. faktion yhteiset saannot kaikkiin sen listoihin ---------------
    # Lahdelause etsitaan siita listasta jonka saantosivuilla se on, ja
    # rivit lisataan jokaiseen kohdelistaan omaan osioonsa.
    for rule in EXTRA:
        if not rule.get("src"):
            continue
        m = src = src_pg = None
        for li, Lx in enumerate(lists_out):
            if not re.search(rule["src"], Lx["nm"], re.I):
                continue
            blob, pmap = _joined(raws[li], pages[li])
            m = re.search(rule["sent"], blob, re.I)
            if m:
                src = next((x for x in _sentences(blob)
                            if re.search(rule["sent"], x, re.I)), m.group(0))
                src_pg = _page_at(pmap, m.start())
                break
        if not m:
            skipped += 1
            warn.append("jaettu saanto %r: lahdelause ei loydy listasta %r"
                        % (rule["rows"][0]["l"], rule["src"]))
            continue
        for Lx in lists_out:
            if not re.search(rule["lst"], Lx["nm"], re.I):
                continue
            title = rule.get("into", "FLEET UPGRADES")
            sec = next((x for x in Lx["secs"] if x["t"] == title), None)
            if sec is None:
                sec = dict(t=title, rules=[], ents=[], text=[], notes=[
                    "Priced upgrades the book states in this faction's "
                    "shared fleet rules rather than as list entries."])
                Lx["secs"].append(sec)
            for row in rule["rows"]:
                lab, _ = _fill(row["l"], m)
                lab = re.sub(r"\s{2,}", " ", lab).strip()
                if any(str(e["l"]).lower() == lab.lower()
                       for s2 in Lx["secs"] for e in s2["ents"]):
                    continue                       # jo listalla omana rivinaan
                ptxt, mult = _fill(row["p"], m)
                p = int(ptxt) * mult
                note = "The book states this in the shared fleet rules: \u201c%s\u201d" % src
                if row.get("x"):
                    note = _fill(row["x"], m)[0] + " " + note
                e = dict(l=lab, r=None, p=p, a=row.get("a", 0), u=1,
                         mx=None, nt=note, prose=1, src_page=src_pg)
                for k in ("per", "cond", "swp", "add", "mod", "req"):
                    if row.get(k):
                        e[k] = row[k]
                sec["ents"].append(e)
                added += 1

    # --- 1c. hinnastotaulukot omiksi osioikseen ---------------------------
    for tab in TABLES:
        blob = pmap = None
        for li, Lx in enumerate(lists_out):
            if not re.search(tab["src"], Lx["nm"], re.I):
                continue
            b, pm = _joined(raws[li], pages[li])
            if re.search(tab["sent"], b, re.I):
                blob, pmap = b, pm
                break
        if blob is None:
            skipped += 1
            warn.append("hinnasto %r: otsikkolause ei loydy" % tab["into"])
            continue
        rows = []
        for m in re.finditer(tab["row"], blob):
            g = list(m.groups())
            price = int(g[-2] if g[-1] is not None and not str(g[-1]).isdigit()
                        else g[-1] if str(g[-1] or "").isdigit() else g[-2])
            name = g[-3] if len(g) > 2 else g[0]
            each = bool(g[-1]) and not str(g[-1]).isdigit()
            name = re.sub(r"\s+", " ", str(name)).strip()
            if any(name.lower() == r["l"].lower() for r in rows):
                continue
            rows.append(dict(l=name + (" (each)" if each else ""), p=price,
                             pg=_page_at(pmap, m.start())))
        if not rows:
            skipped += 1
            warn.append("hinnasto %r: yhtaan rivia ei jasentynyt" % tab["into"])
            continue
        for Lx in lists_out:
            if not re.search(tab["lst"], Lx["nm"], re.I):
                continue
            sec = next((x for x in Lx["secs"] if x["t"] == tab["into"]), None)
            if sec is None:
                sec = dict(t=tab["into"], rules=[], ents=[], text=list(tab.get("text") or []),
                           notes=[tab["nt"]])
                Lx["secs"].append(sec)
            for r in rows:
                if any(str(e["l"]).lower() == r["l"].lower()
                       for s2 in Lx["secs"] for e in s2["ents"]):
                    continue
                sec["ents"].append(dict(l=r["l"], r=None, p=r["p"], a=1, u=1,
                                        mx=None, nt=tab["nt"], prose=1,
                                        src_page=r["pg"]))
                added += 1

    # --- 1d. Gubbins Waaagh!-listalta Clanz-listalle -----------------------
    src = next((Lx for Lx in lists_out if "Waaagh" in Lx["nm"]), None)
    dst = next((Lx for Lx in lists_out if "Da Ork Clanz" in Lx["nm"]), None)
    if src and dst:
        have = {str(e["l"]).lower() for s in dst["secs"] for e in s["ents"]}
        rows = []
        for s in src["secs"]:
            if s["t"] not in GUBBIN_SECS:
                continue
            for e in s["ents"]:
                if str(e["l"]).lower() in have:
                    continue
                have.add(str(e["l"]).lower())
                r = dict(e)
                r["nt"] = GUBBIN_NT
                r["prose"] = 1
                rows.append(r)
        # Myos saantoteksti siirtyy: jokaisen Gubbinin kuvaus on
        # kirjassa hinnaston seassa, eika se nay muualla sovelluksessa.
        gub_text = [t for sx in src["secs"] if sx["t"] in GUBBIN_SECS
                    for t in sx.get("text", [])]
        if rows:
            dst["secs"].append(dict(t="GUBBINS", rules=[], ents=rows,
                                    text=[GUBBIN_TEXT] + gub_text, notes=[GUBBIN_NT]))
            added += len(rows)
        else:
            warn.append("Gubbins-rivaja ei loytynyt Waaagh!-listalta")

        # MOB RULE ja YOUNG GUNZ ovat samaa Clanz-lohkoa eivatka ne ole
        # hinnoiteltuja, joten ne siirtyvat pelkkina tekstiosioina.
        for t in ORK_CLANZ_TEXT_SECS:
            sx = next((x for x in src["secs"] if x["t"] == t), None)
            if sx is None or not sx.get("text"):
                warn.append("Clanz-tekstiosiota %r ei loytynyt "
                            "Waaagh!-listalta" % t)
                continue
            if any(x["t"] == t for x in dst["secs"]):
                continue
            dst["secs"].append(dict(t=t, rules=[], ents=[],
                                    text=list(sx["text"])))

    # --- 2. Ork-klaanit omaksi osiokseen -----------------------------------
    # Klaanien nimet ja hinnat ovat samoilla Waaagh!-sivuilla kuin
    # Gubbins-hinnasto, mutta klaanipaivitykset kuuluvat Clanz-listaan.
    # Etsitaan siis Waaagh!-listan tekstista ja kirjoitetaan Clanziin.
    clan_blob = " ".join(b for i, Lx in enumerate(lists_out)
                         if "Waaagh" in Lx["nm"] for b in raws[i])
    _wi = next((i for i, Lx in enumerate(lists_out) if "Waaagh" in Lx["nm"]), None)
    clan_pm = _joined(raws[_wi], pages[_wi])[1] if _wi is not None else []
    for li, Lx in enumerate(lists_out):
        if "Da Ork Clanz" not in Lx["nm"]:
            continue
        blob = " ".join(raws[li]) + " " + clan_blob
        rows = []
        for name, pts, col in CLANS:
            if not re.search(re.escape(name), blob, re.I):
                continue
            # Klaanin hinta on Waaagh!-listan sivuilla (s.367-371).
            _cm = re.search(re.escape(name), clan_blob, re.I)
            rows.append(dict(
                l="Clan: %s (%s)" % (name, col), r=None, p=pts, a=1, u=1,
                mx=None, prose=1,
                src_page=_page_at(clan_pm, _cm.start()) if _cm else None,
                nt="Clan upgrade, Fleets pg. 367–371. Every capital ship in "
                   "the skwadron pays separately; for tiddla skwadrons the cost "
                   "is for the whole skwadron. The skwadron must show clan colours."))
        if rows:
            # Kirjan omat klaanikuvaukset ("All Evil Sunz ships gain +5 cm
            # speed") ovat Waaagh!-listan sivuilla. Ne kertovat mita
            # kustakin klaanista saa, joten ne tulevat mukaan.
            clan_text = [t for Sx in lists_out if "Waaagh" in Sx["nm"]
                         for sx in Sx["secs"] if sx["t"] == "CLAN UPGRADES"
                         for t in sx.get("text", [])]
            # Kasin kirjoitettu johdanto poistettiin: kirjan oma lause
            # "A Warlord and his skwadrons may only be from one clan..."
            # tulee nyt clan_textin mukana, ja kaksi lahes samaa lausetta
            # perakkain on juuri sita toistoa josta palautteessa
            # huomautettiin.
            Lx["secs"].append(dict(
                t="CLAN UPGRADES", rules=[], ents=rows, text=clan_text))
            added += len(rows)

    # --- 3. kaksoiskappaleet pois ------------------------------------------
    for Lx in lists_out:
        for sec in Lx["secs"]:
            keep, seen = [], []
            for e in sec["ents"]:
                if e.get("r"):
                    # Alusrivi aloittaa oman vaihtoehtolistansa, joten
                    # muisti nollataan. Ilman tata tyranidien ESCORTS-osion
                    # kolme alusta sulautuivat yhdeksi listaksi ja Escort
                    # drone seka Kraken menettivat "Feeder tentacles +5",
                    # koska Vanguard drone shipilla oli jo samanniminen ja
                    # -hintainen rivi. Kiinnitys toimii samoin: paivitys
                    # kuuluu edeltavalle alukselle.
                    keep.append(e)
                    seen = []
                    continue
                lab = re.sub(r"\s*\(.*?\)\s*$", "", str(e["l"])).strip().lower()
                dup = next((k for k in seen if (k[0] == lab or k[0].startswith(lab)
                                                or lab.startswith(k[0]))
                            and k[1] == e.get("p")), None)
                if dup:
                    continue
                seen.append((lab, e.get("p")))
                keep.append(e)
            sec["ents"] = keep

    # --- 4. luokittelu, ryhmat ja kiinnityskohteet -------------------------
    for Lx in lists_out:
        for si, sec in enumerate(Lx["secs"]):
            for e in sec["ents"]:
                k = e.get("k") or entry_kind(e)
                e["k"] = k
                if k == "up":
                    e["u"] = 1
                    g = group_of(e["l"])
                    if not g:
                        g = sec_group(Lx["nm"], sec["t"])
                        if g:
                            _SEC_GROUP_HITS[0] += 1
                    if g:
                        e["grp"] = g
                    if g == "mark" and any(_MULTI_MARK.search(t)
                                           for t in sec.get("text") or []):
                        del e["grp"]
                        _MULTI_MARK_HITS[0] += 1
                    if not e.get("cond"):
                        for lrx, srx, nrx, cond in ROW_CONDS:
                            if (lrx.search(Lx["nm"]) and srx.search(sec["t"].strip())
                                    and nrx.search(str(e["l"]).strip())):
                                e["cond"] = dict(cond)
                                _ROW_COND_HITS[0] += 1
                                _ROW_COND_LOG.append((Lx["nm"], e["l"]))
                                break
                    for lrx, srx, nrx, fx in ROW_EFFECTS:
                        if (lrx.search(Lx["nm"]) and srx.search(sec["t"].strip())
                                and nrx.search(str(e["l"]).strip())):
                            for k, v in fx.items():
                                if k == "cond":
                                    c0 = dict(e.get("cond") or {})
                                    c0.update(v)
                                    e["cond"] = c0
                                else:
                                    e[k] = v
                            _ROW_EFFECT_LOG.append((Lx["nm"], e["l"]))
                            break
                else:
                    e.pop("u", None)

        # Hulkin Gubbins (pistokoe 7 rivi 22): alkuperainen rivi ei ole
        # hulkin, sallituista tuplahintainen kopio vain hulkille.
        if re.search(r"Da Ork Clanz", Lx["nm"]):
            for sec in Lx["secs"]:
                if sec["t"].strip().upper() != "GUBBINS":
                    continue
                copies = []
                for e in sec["ents"]:
                    if e.get("k") != "up":
                        continue
                    c = dict(e.get("cond") or {})
                    c["nmno"] = "hulk"
                    e["cond"] = c
                    if _HULK_GUBBIN_NO.search(str(e["l"])):
                        continue
                    h = dict(e)
                    flat = bool(_HULK_GUBBIN_FLAT.search(str(e["l"])))
                    h["l"] = str(e["l"]) + (" (Space Hulk)" if flat else " (Space Hulk: double cost)")
                    h["p"] = (e.get("p") or 0) * (1 if flat else 2)
                    h["cond"] = dict({k2: v2 for k2, v2 in c.items()
                                      if k2 not in ("cap", "esc", "nmno")}, nm="hulk")
                    h.pop("grp", None)
                    h["nt"] = ((("Fleets p. 371: More Gubbins can be taken by any number of capital "
                                 "ships in the fleet, so a Space Hulk pays the listed cost; the double "
                                 "cost on p. 372 covers the list of Gubbins. ")
                                if flat else
                                ("Fleets p. 372: a Space Hulk takes Gubbins for double the "
                                 "listed cost; no upgrade that improves boarding value or speed. "))
                               + str(e.get("nt") or "")).strip()
                    copies.append(h)
                    _HULK_GUBBIN_HITS[0] += 1
                sec["ents"].extend(copies)
                for lrx, srx, base, lab, fx in ESC_SPLITS:
                    if not (lrx.search(Lx["nm"]) and srx.search(sec["t"].strip())):
                        continue
                    src = [e for e in sec["ents"] if e.get("k") == "up" and e["l"] == base]
                    assert len(src) == 1, (base, len(src))
                    h = dict(src[0])
                    h["l"] = lab
                    h.pop("grp", None)
                    h.update(fx)
                    sec["ents"].append(h)
                    _ESC_SPLIT_HITS[0] += 1
                # Deathskullz (s.369): "Deathskullz capital ships and/or tiddla
                # skwadrons have 'looted' upgrades (torpedoes and/or lances) for
                # no additional cost." Jokaisesta Looted-rivista (myos saattaja-
                # ja hulkkiversio) ilmainen kopio Deathskullzille; maksullinen
                # rivi ei ole tarjolla klaanin kanssa.
                free = []
                for e in sec["ents"]:
                    if e.get("k") != "up" or not str(e["l"]).startswith("Looted "):
                        continue
                    c0 = dict(e.get("cond") or {})
                    h = dict(e)
                    h["l"] = str(e["l"]) + " (Deathskullz: free)"
                    h["p"] = 0
                    h["cond"] = dict(c0, up=r"^clan: deathskullz")
                    h["desc"] = (str(e.get("desc") or "") +
                                 " Deathskullz take it for no additional cost (Fleets p. 369).").strip()
                    h.pop("grp", None)
                    e["cond"] = dict(c0, noup=r"^clan: deathskullz")
                    free.append(h)
                    _DEATHSKULLZ_HITS[0] += 1
                sec["ents"].extend(free)

        # Waaagh! (J224): hulkin Warlord maksaa Extra Power Fieldsista +50
        # (s.390: "Extra Powerfields costs +50 pts instead of +25."). Warlordin
        # paivitykset ovat WARLORD-osiossa komentajalla eika alus vaikuta
        # rivin hintaan, joten hulkkihinta on oma rivinsa samassa
        # poissulkevassa ryhmassa. Rivi listan peraan, jotta osion muiden
        # rivien indeksit eivat siirry. resolveFleet vertaa otettua rivia
        # Warlordin sijoitukseen (build_data.py L.hulk_pf, J215).
        if Lx["nm"] == "Orks — Waaagh!":
            for sec in Lx["secs"]:
                if sec["t"].strip().upper() != "WARLORD":
                    continue
                src = [e for e in sec["ents"] if e.get("k") == "up" and e["l"] == "Extra Power Fields"]
                assert len(src) == 1, ("Waaagh! Extra Power Fields", len(src))
                h = dict(src[0])
                h["l"] = "Extra Power Fields (Space Hulk)"
                h["p"] = 50
                h["src_page"] = 390
                h["desc"] = ("A Warlord aboard a space hulk: Extra Powerfields costs +50 pts instead of +25 "
                             "(Fleets p. 390).")
                sec["ents"].append(h)
                _HULK_PF_HITS[0] += 1

        # Tyranid bio-enhancements "each" (s.426): Reinforced Carapace enintaan
        # +4 Hits hive shipille ja +3 cruiserille, Extra Spore Cysts enintaan
        # kaksi. Kerrannaiset omina riveinaan samassa poissulkevassa ryhmassa.
        if re.search(r"^Tyranids", Lx["nm"]):
            for sec in Lx["secs"]:
                if sec["t"].strip().upper() != "BIO-ENHANCEMENTS":
                    continue
                extra = []
                for e in sec["ents"]:
                    lab = str(e["l"])
                    if e.get("k") != "up":
                        continue
                    if lab.startswith("Reinforced Carapace"):
                        grp, key, top, unit = "bio_carapace", "hp", 4, "Hit"
                    elif lab.startswith("Extra Spore Cysts"):
                        grp, key, top, unit = "bio_spores", "tu", 2, "spore cyst"
                    else:
                        continue
                    e["grp"] = grp
                    for k in range(2, top + 1):
                        h = dict(e)
                        h["l"] = "%s \u00d7%d (+%d %ss)" % (lab.replace(" (each)", ""), k, k, unit)
                        h["p"] = (e.get("p") or 0) * k
                        h["mod"] = {key: k}
                        c0 = dict(e.get("cond") or {})
                        if key == "hp" and k == 4:
                            c0["nm"] = "hive ship"
                        h["cond"] = c0
                        extra.append(h)
                        _BIO_EACH_HITS[0] += 1
                sec["ents"].extend(extra)

        for si, sec in enumerate(Lx["secs"]):
            units = [i for i, e in enumerate(sec["ents"]) if e["k"] != "up"]
            ups = [i for i, e in enumerate(sec["ents"]) if e["k"] == "up"]
            if not ups:
                continue
            if not units:
                continue                     # irrallinen: kiinnittyy mihin vain
            interleaved = any(u < max(units) for u in ups)
            for i in ups:
                if interleaved:
                    owner = max([x for x in units if x < i], default=None)
                    if owner is None:
                        continue
                    sec["ents"][i]["at"] = [[si, owner]]
                else:
                    sec["ents"][i]["at"] = [[si, x] for x in units]

        # "One prow weapon" -tyyppinen osio kuuluu edeltavan osion alukselle.
        # Kirja kirjoittaa aseosion otsikoksi seka "One prow weapon"
        # etta "Up to Three Port/Starboard Weapons"; molemmat
        # kuuluvat edellisen osion alukselle.
        WEAPON_SEC = re.compile(r"^(?:one|up\s+to\s+\w+)\b.*\bweapons?$",
                                re.I)
        for si, sec in enumerate(Lx["secs"]):
            if not WEAPON_SEC.match(sec["t"]):
                continue
            if any(e["k"] != "up" for e in sec["ents"]) or not sec["ents"]:
                continue
            tgt = []
            for sj in range(si - 1, -1, -1):
                units = [ej for ej, e in enumerate(Lx["secs"][sj]["ents"])
                         if e["k"] != "up"]
                if units:
                    tgt = [[sj, ej] for ej in units]
                    break
            if tgt:
                for e in sec["ents"]:
                    e["at"] = tgt

        # "Valitse tasan yksi ase." Kirja sanoo sen joko osion otsikossa
        # ("One prow weapon") tai leipatekstissa ("A Kraken must be armed
        # with one weapon chosen from the following list"). Ryhma tulee
        # kiinnityskohteesta eika osiosta: Hive-listan ESCORTS-osiossa on
        # kolme alusta perakkain, eika Krakenin ase saa sammuttaa Escort
        # dronen asetta. "Up to Three Port/Starboard Weapons" jaa ulos,
        # koska siina kirja sallii useamman.
        ONE_WEAPON_SEC = re.compile(r"^one\b.*\bweapons?$", re.I)
        ONE_WEAPON_TXT = re.compile(r"must be armed with one weapon chosen",
                                    re.I)
        for si, sec in enumerate(Lx["secs"]):
            if not (ONE_WEAPON_SEC.match(sec["t"])
                    or any(ONE_WEAPON_TXT.search(t) for t in sec.get("text", []))):
                continue
            for e in sec["ents"]:
                if e.get("k") != "up" or e.get("grp"):
                    continue
                tgt = e.get("at") or []
                e["grp"] = "wpn_%d_%s" % (si, "_".join(
                    "%d.%d" % (a, b) for a, b in tgt) or "own")
                _ONE_WEAPON_HITS[0] += 1

        # Hinnasto joka on painettu pelkkina alusluokkina, koska osion
        # otsikko kertoo mita ostetaan. Rivi kiinnitetaan siihen osioon
        # jonka otsikko on sama luokka monikossa, ja nimetaan uudelleen
        # jotta se kertoo itsestaan myos irrallaan.
        for si, sec in enumerate(Lx["secs"]):
            if sec["t"].strip().upper() not in HULL_PRICE_SECS:
                continue
            for e in sec["ents"]:
                # Mark-rivi samassa osiossa (Tzeentch s.237) ei ole hinnasto.
                if e.get("k") != "up" or e.get("at") or e.get("grp") == "mark":
                    continue
                want = str(e["l"]).strip().lower() + "s"
                tgt = []
                for sj, s2 in enumerate(Lx["secs"]):
                    if s2["t"].strip().lower() != want:
                        continue
                    tgt += [[sj, ej] for ej, e2 in enumerate(s2["ents"])
                            if e2.get("k") != "up"]
                if not tgt:
                    warn.append("%s / %s: riville %r ei loydy osiota %r"
                                % (Lx["nm"], sec["t"], e["l"], want))
                    continue
                e["at"] = tgt
                e["l"] = "Daemonship: " + str(e["l"]).strip()
                # Nimi osuu GROUPS-taulun daemon-ryhmaan, mutta ryhmitys
                # on jo ajettu - asetetaan sama tulos kasin.
                e["grp"] = group_of(e["l"]) or e.get("grp")
                # "A Daemonship may not have a Chaos Space Marine crew"
                # (s.227, 237, 241, 245, 249).
                e["cond"] = dict(noup=r"chaos space marine crew")
                # "(not the Terminus Est or flagship)" s.241, "(not the Wage
                # of Sin or the flagship)" s.249, "Except for the flagship or
                # the Scion of Prospero" s.237: nimetty alus ei voi olla
                # Daemonship. Lippulaiva on laivastotason asia.
                blob0 = " ".join(sec.get("text") or [])
                mn = (re.search(r"\(not the ([^()]+?) or (?:the )?flagship\)", blob0, re.I)
                      or re.search(r"Except for the flagship or the ([^()]+?)\s*\(if included\)", blob0, re.I))
                if mn:
                    e["cond"]["nmno"] = re.escape(mn.group(1).strip())
                    _NAMED_EXCL_HITS[0] += 1
                # Nurgle/Khorne/Slaanesh: "All Daemonships ... must take the
                # Mark of X, which is already included in the cost to upgrade
                # them to Daemonships" (s.241, 245, 249). Markin saanto
                # tulostuu Daemonship-rivista (domain.js), ja Nurglen Mark
                # antaa +1 Damage Point (s.240).
                blob = " ".join(sec.get("text") or [])
                mi = re.search(r"must\s+take\s+the\s+Mark\s+of\s+(\w+),\s+which\s+is\s+already\s+included",
                               blob, re.I)
                if mi:
                    e["inc"] = "Mark of " + mi.group(1)
                    if mi.group(1).lower() == "nurgle":
                        e["mod"] = dict(hp=1)
                    _MARK_INC_HITS[0] += 1
                _HULL_PRICE_HITS[0] += 1

        # Armageddonin re-roll-osiot nimeavat komentajansa otsikossaan.
        for si, sec in enumerate(Lx["secs"]):
            m = re.match(r"^(.*?)\s+Re-rolls$", sec["t"], re.I)
            if not m or any(e["k"] != "up" for e in sec["ents"]):
                continue
            who = m.group(1).strip().lower()
            tgt = []
            for sj, s2 in enumerate(Lx["secs"]):
                for ej, e2 in enumerate(s2["ents"]):
                    if e2["k"] == "up":
                        continue
                    lab = str(e2["l"]).lower()
                    if who in lab or lab.startswith(who.split()[0]):
                        tgt.append([sj, ej])
            if tgt:
                for e in sec["ents"]:
                    e["at"] = tgt

    return added, skipped, warn
