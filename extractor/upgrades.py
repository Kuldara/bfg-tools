# -*- coding: utf-8 -*-
"""Separates a fleet list's rows into UNITS and UPGRADES.

Background: the book's list section "0-1 Admiral" contains both the commander
choices and their re-roll rows. Before, every row was counted as a unit,
so one admiral + one re-roll looked like two admirals and
the section limit complained. A re-roll is not a unit but the commander's extra purchase,
exactly as a nova cannon is a ship's extra purchase.

This module does three things:

  1. classifies the rows  (unit / commander / upgrade)
  2. counts for every upgrade the TARGETS it can be attached to
  3. adds the upgrades the book writes only in the body text
     (e.g. the Khorne Warmaster's required Mark, Dakka Dakka)

Item 3 checks itself: every addition requires that its source sentence
really is in that section's rule text. If the book's wording
changes, the addition is not made and the run says so - nothing is invented.
"""
import re

# ---------------------------------------------------------------- classification

# "(Ld 8)", "(Ld +2)", "(+1 Ld)", "(Ld10)" -- the mark of a commander
CMD_LD = re.compile(r"\((?:Ld\s*\+?\d+|\+\d+\s*Ld)\)", re.I)

# Commanders whose row the book writes no Ld value for.
CMD_NAMES = re.compile(
    r"^(?:ork\s+warlord|lord\s+admiral\s+rath|prince\s+yriel|abaddon"
    r"|space\s+marine\s+captain|\d[-–]\d\s+farseers?|farseers?"
    r"|ordo\s+\w+\s+inquisitor\s+lord|inquisitor\s+lord"
    r"|veteran\s+rogue\s+trader|pirate\s+captain|master\s+of\s+the\s+fleet)\b", re.I)

# Rows that look like a commander but are extra purchases.
NOT_CMD = re.compile(r"re-roll|\bmark\b|honour\s+guard|terminator", re.I)


def entry_kind(e):
    """'unit' = a hull of its own on the list, 'cmd' = a commander, 'up' = an extra purchase."""
    if e.get("r"):
        return "unit"
    lab = str(e.get("l") or "")
    if NOT_CMD.search(lab):
        return "up"
    if CMD_LD.search(lab) or CMD_NAMES.match(lab.strip()):
        return "cmd"
    return "up"


# Mutually exclusive groups: only one of these per target.
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


# Per-section exclusive groups. GROUPS infers the group from the row's
# NAME, but the orks' Warlord upgrades are mutually exclusive
# only in the WARLORD section: the book says on pages 367 and 368 "may include up
# to one of the upgrades shown below at the additional cost indicated".
# Rows of exactly the same name are also in the Clanz list's GUBBINS section,
# where the limit is another (one upgrade per Warlord re-roll), so
# a name-based group would be wrong there.
SEC_GROUPS = [
    (re.compile(r"^Orks"), re.compile(r"^WARLORD$"), "warlord_up"),
]
_SEC_GROUP_HITS = [0]
_ONE_WEAPON_HITS = [0]
# Sections where the price list is ship classes only.
HULL_PRICE_SECS = ("DAEMON SHIPS", "DAEMONSHIPS")
_HULL_PRICE_HITS = [0]
# Daemonship rows whose price includes the Mark (Nurgle 4, Khorne 3,
# Slaanesh 4 = 11; build_data.py requires the number).
_MARK_INC_HITS = [0]
# Daemonship rows from which a named ship is excluded (Nurgle 4 Terminus
# Est, Slaanesh 4 Wage of Sin, Tzeentch 4 Scion of Prospero = 12).
_NAMED_EXCL_HITS = [0]


# The book's own rows whose sentence limits the target, but the row parses
# without a condition. (list, section, row name, condition.) Spot check 6 found each:
# the Forces of Chaos rows were offered to escorts and to ships without a Mark
# (p.246: "capital ships ... that have the Mark of Tzeentch", p.248 "Any
# capital ships with the Mark of Nurgle", p.250 "Any ships with the Mark
# of Khorne", p.252 "Any ships with the Mark of Slaanesh"; Strand of
# Fortune p.246 "Any ship led by a Lord of Tzeentch"), the Grey Knights rows
# to escorts (p.155 "Any Grey Knights capital ship", "one Grey Knights
# vessel may take Grey Knight Terminators" - the teleport attack is a capital
# ship's ability). The Nurgle, Khorne and Slaanesh Daemonship includes the Mark.
ROW_CONDS = [
    # p.486: "These re-rolls can only be used for Demiurg vessels and not
    # with other starships they may take as allies" - the row was offered to a Tau
    # Orca (Codex 10.9.). The purchase is recorded on a Demiurg ship.
    (re.compile(r"^Demiurg"), re.compile(r"^Re-rolls$"),
     re.compile(r"re-roll", re.I), dict(nm="commerce vessel")),
    # p.372-373 Gubbins: "(Not for escorts.)" Extra Power Fields, Maniac
    # Turrets, Mad Meks, Mega-Armoured Boarding Parties, Prow Ram, Tellyporta,
    # Klaws (except the Grunt with its own option), Shokk-Attack Lance; "More
    # Gubbins ... can only be added to capital ships" (Assault Karrier).
    # The Clanz list offered all of them to a tiddla skwadron (spot check 7 rows 16, 36).
    (re.compile(r"Da Ork Clanz"), re.compile(r"^GUBBINS$"),
     re.compile(r"^(?:Extra Power Fields|Maniac Turrets|Mad Meks|Mega-Armoured Boarding Parties"
                r"|Prow Ram|Tellyporta|Klaws|Shokk-Attack Lance|Assault Karrier)$", re.I),
     dict(cap=1)),
    (re.compile(r"^Grey Knights$"), re.compile(r"^ORDNANCE$"),
     re.compile(r"^Grey Knights Terminators$", re.I), dict(cap=1)),
    # p.155 "Any Grey Knights capital ship in the fleet may embark an Honour
    # Guard": the Blackship (p.158 "not crewed by Space Marines") and the Inquisitorial
    # Cruiser are not Grey Knights ships (spot check 9 row 6).
    (re.compile(r"^Grey Knights$"), re.compile(r"^ORDNANCE$"),
     re.compile(r"^Grey Knights Honour Guard$", re.I), dict(cap=1, nmno=r"blackship|inquisitorial")),
    # v0.40 p.246: "Up to two capital ships (including the flagship) can have
    # daemonic entities and warp beasts swirl about its hull, including
    # daemonships." - no Mark of Tzeentch needed any more.
    (re.compile(r"Tzeentch"), re.compile(r"^FORCES OF CHAOS$"),
     re.compile(r"^Warp Beasts$", re.I), dict(cap=1)),
    # p.246 "Any ship led by a Lord of Tzeentch (and not the Warmaster!)" and
    # p.247 "A Daemonship may not be commanded by a Warmaster or a Chaos Lord"
    # (spot check 11 rows 60, 61, 69).
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
# Da Ork Clanz p.374: "Space Hulks so led can take upgrades from the list of
# Gubbins for double the listed cost. Upgrades that increase its boarding
# value or speed may not be taken." Soopa Boostas (+5 cm) is left out; the others
# get a hulk copy of their own at double price (p.392: "Extra Powerfields costs +50 pts
# instead of +25"). Mega-Armoured Boarding Parties is a die modifier, not
# boarding value - p.392: "Mega-armoured Boarding Parties is unchanged"
# (spot check 19 round 3, T15: the earlier ban was a reading error).
_HULK_GUBBIN_NO = re.compile(r"^(?:Soopa Boostas)$", re.I)
# p.373 MORE GUBBINS is a list of its own with its own permission: "The following gubbins
# can be taken by any number of capital ships in the fleet." p.374's doubling
# concerns "upgrades from the list of Gubbins", i.e. p.372-373's GUBBINS list,
# so a hulk pays the list price for these (interpretation decision T31, 14.9.2026).
_HULK_GUBBIN_FLAT = re.compile(r"^(?:Klaws|Shokk-Attack Lance|Assault Karrier)$", re.I)
_HULK_GUBBIN_HITS = [0]
# The Waaagh! list's hulk Warlord (p.392, J224): its own +50 row, see phase 4.
_HULK_PF_HITS = [0]
# Sections where the Marks do not exclude each other: p.242 "they may be given
# up to four Marks of Chaos as shown below (no Mark may be taken more than
# once)". GROUPS gives the group "mark" by name; here it is undone.
_MULTI_MARK = re.compile(r"up to four Marks of Chaos", re.I)
_MULTI_MARK_HITS = [0]


# List upgrade effects and card descriptions (work queue J1, Codex 10.9.).
# (list, section, row name, fields). The fields are written on the row; "cond"
# is merged with an existing condition. desc = the book's sentence, which prints
# in the card's upgrade box when the book's section has no sentence of the row's own.
# Every sentence is from the book (the page in a comment); this is a hand-read table.
_CLANZ = re.compile(r"Da Ork Clanz")
_GUB = re.compile(r"^GUBBINS$")
_CLAN = re.compile(r"^CLAN UPGRADES$")
_TYR = re.compile(r"^Tyranids")
_BIO = re.compile(r"^BIO-ENHANCEMENTS$")
ROW_EFFECTS = [
    # --- Da Ork Clanz: Gubbins (p.372-373) ---
    (_CLANZ, _GUB, re.compile(r"^Soopa Boostas$", re.I),
     dict(mod=dict(sp=5), desc="The ship gains +5 cm speed, and it rolls 4D6 cm when on All Ahead Full special orders.")),
    (_CLANZ, _GUB, re.compile(r"^Extra Power Fields$", re.I),
     dict(mod=dict(sh=1), desc="The ship's shield value is increased by +1. If this would take it to 3 or more shields, don't forget to mount it on a 60 mm base!")),
    (_CLANZ, _GUB, re.compile(r"^Extra Turrets$", re.I),
     dict(mod=dict(tu=2), cond=dict(cap=1, noup=r"^maniac turrets"),
          desc="The ship gains +2 Turrets. This cannot be combined with Maniac Turrets.")),
    (_CLANZ, _GUB, re.compile(r"^Maniac Turrets$", re.I),
     # p.372 "The ship's turret value is replaced by D3 turrets", in plainer words (user 27.10.2026)
     dict(set=dict(tu="D3"), cond=dict(noup=r"^extra turrets"),
          desc="Turrets: roll a D3 (1-3) instead of the ship's printed turret value. Not with Extra Turrets.")),
    (_CLANZ, _GUB, re.compile(r"^Looted Lances$", re.I),
     dict(swp=dict(f=r"heavy gunz", nmf=r"heavy gunz(?: battery)?", nm="lance battery", rg="30 cm", st="2"),
          cond=dict(cap=1, has="heavy gunz"),
          desc="Any heavy gunz batteries on the ship are replaced with a Strength-2 lance battery. Range is 30 cm for capital ships.")),
    (_CLANZ, _GUB, re.compile(r"^Looted Torpedoes$", re.I),
     # An effect only with torpedoes: the Slamblasta (p.380) has no torpedoes,
     # so the row cost 20 pts without an effect (spot check 8 row 37).
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
    # p.373 "It takes boarding torpedoes for free, but it may only use assault
    # boats": no torpedo-bommas or orbital mines beside it (each excludes the
    # other, the later choice wins), and the boarding torpedoes rows give way
    # to it (their noup below; frees words the notice). ChatGPT audit RAW-06,
    # 27.10.2026: a Terror with a Karrier still paid +5 for them.
    (_CLANZ, _GUB, re.compile(r"^Assault Karrier$", re.I),
     dict(cond=dict(has=["launch bay", "torpedo"], noup=r"^torpedo[\s-]*bom|^orbital mines$"),
          frees=r"^boarding torpedoes",
          desc="Takes boarding torpedoes for free but may only use assault boats. It may launch +1 assault boat marker each time it launches attack craft (even if crippled or braced, but not both).")),
    # --- Da Ork Clanz: clans (p.371) ---
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
    (_CLANZ, _CLAN, re.compile(r"^Imperial Navy refit, rolled randomly", re.I),
     dict(desc="Blood Axe Warlord's ship only (p. 371). Roll a D6: 1-2 ship, 3-4 engine, 5-6 weapons refit, "
               "then a D6 on that table (Rulebook pp. 156, 158-159). Rolled: ________")),
    (_CLANZ, _CLAN, re.compile(r"^Clan: Snakebites", re.I),
     dict(cond=dict(ty=r"escort|defence"),
          desc="Snakebite capital ship skwadrons can only be space hulks or roks. Snakebite skwadrons gain a +1 bonus to Command checks when attempting to Brace for Impact.")),
    # --- Tyranids: bio-enhancements (p.426-427) ---
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
    # --- Demiurg: fleet re-rolls (p.486) ---
    (re.compile(r"^Demiurg"), re.compile(r"^Re-rolls$"), re.compile(r"re-roll", re.I),
     dict(desc="Demiurg fleet re-rolls, bought for the fleet as a whole and not as Fleet Commander re-rolls: the fleet gets one re-roll plus these. They can only be used for Demiurg vessels, not allied ships. Buy them once for the fleet.")),
    # --- rule texts for rows that had no sentence in the book (J1) ---
    (re.compile(r""), re.compile(r""), re.compile(r"^Torpedo bombers$", re.I),
     dict(desc="Torpedo bombers are an additional attack craft type (bombers are not replaced): 20 cm, count as bombers for interception. From the Ordnance phase after launch a squadron may become a Strength-2 torpedo salvo, removed at the end of that phase; a wave may combine salvoes. Cost per launch bay Strength. (Fleets p. 22)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Shark assault boats", re.I),
     dict(desc="The Emperor's launch bays may also launch Shark assault boats (30 cm). (Fleets pp. 49, 53)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Xenotech System, rolled randomly", re.I),
     dict(desc="Roll D6 on the Xenotech Systems table and note the result: 1 Long Range Sensors +1 base Ld (max 10); 2 Targeting Matrix: targets within 30 cm count as closing, no right shift beyond 30 cm; 3 Advanced Shielding +1 shield; 4 Ship Defense Grid +1 turret; 5 Advanced Drive +5 cm speed and +1D6 on All Ahead Full; 6 Gravitic Thrusters double the maximum turn. (Fleets p. 185)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Choose the Xenotech System", re.I),
     dict(desc="Pay +5 per ship to select the Xenotech System instead of rolling for it. (Fleets p. 185)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Leech torpedoes$", re.I),
     dict(desc="Leech torpedoes at no extra cost, loaded with a specific Reload Ordnance roll (or start loaded by noting it on the ship sheet). A hit causes one automatic critical instead of damage: Speed -10 cm and no All Ahead Full until repaired. (Fleets p. 349)")),
    (re.compile(r"^Orks"), re.compile(r""), re.compile(r"^Torpedo-bommas$", re.I),
     dict(desc="Torpedo-bommas: 20 cm bombers with no fighter ability. From the turn after launch each marker may become a Strength-2 torpedo salvo; an additional attack craft type. Cost per launch bay strength. (Fleets p. 361)")),
    (re.compile(r"^Orks"), re.compile(r""), re.compile(r"^Boarding torpedoes( \(Space Hulk\))?$", re.I),
     dict(desc="Its torpedoes may be boarding torpedoes: a Hit & Run attack instead of torpedo damage when they hit. (Fleets p. 360, Rulebook p. 78)")),
    (re.compile(r""), re.compile(r""), re.compile(r"^Improved Logic Engines$", re.I),
     dict(desc="Kor'O'Mesme's vessel ignores the Leadership effects of being in contact with Blast Markers. (Fleets p. 453)")),
    (re.compile(r"Crusade"), re.compile(r"^Fortress-Monastery$"), re.compile(r"re-roll", re.I),
     dict(desc="The fortress-monastery's own re-rolls, usable for its own command checks only. If the Master of the Fleet is assigned to it, they are added to his and may be used by the entire fleet. (Fleets p. 98)")),
    (re.compile(r"^Necrons"), re.compile(r"^Re-rolls$"), re.compile(r"re-roll", re.I),
     dict(desc="Necron fleet re-rolls, bought for the fleet as a whole and not as Fleet Commander re-rolls: the fleet gets one re-roll plus these. Buy them once for the fleet. (Fleets p. 406)")),
    (re.compile(r"^Tyranids"), re.compile(r"^FLEET COMMANDER$"), re.compile(r"^Hive Mind Influence re-roll$", re.I),
     dict(desc="Works like a normal fleet commander re-roll. At most one per hive ship in the fleet. (Fleets p. 430)")),
    (re.compile(r"^Tyranids"), re.compile(r"^FLEET COMMANDER$"), re.compile(r"^Hive Mind Imperative$", re.I),
     dict(desc="A Command check or Leadership test is passed automatically; decide before the dice are rolled. At most one per two hive ships, or one with at least one hive ship. (Fleets p. 430)")),
    (re.compile(r"^Tyranids"), re.compile(r"^HIVE SHIPS$"), re.compile(r"^Increase to Ld 9$", re.I),
     dict(desc="The hive ship has Leadership 9 instead of 8. (Fleets p. 430)")),
    # --- Chaos: Thunderhawks of a Space Marine crew (J213, p.245) ---
    (re.compile(r"^Chaos"), re.compile(r"^(?:ORDNANCE|Marine crew may be)$"),
     re.compile(r"^Thunderhawk Gunships \(Chaos Space Marine crew\)$", re.I),
     dict(desc="The ship's launch bays carry Thunderhawk Gunships, and then only Thunderhawks: it may not launch "
               "any other attack craft. Only a ship with a Chaos Space Marine crew. (Fleets p. 245)")),
    # --- Bakka: Fleet Defence Turrets of the Adeptus Mechanicus ships (J217, p.50) ---
    (re.compile(r"Bakka"), re.compile(r"^Adeptus Mechanicus$"),
     re.compile(r"^Fleet Defence Turrets \(instead of a Mechanicus Gift\)$", re.I),
     dict(desc="Instead of a Mechanicus Gift: two of the ship's turrets protect it or one other vessel within "
               "15 cm each ordnance phase, adding +2 to that ship's turret strength (not to bomber attack rolls "
               "when defending another vessel). (Fleets p. 50)")),
]
_ROW_EFFECT_LOG = []
# An escort version of a capital row (p.372: "Escorts get +1 Turret";
# Looted Lances "Range is 15 cm for escorts"). The hulk copies are made before
# this, so no hulk copy is born from the escort version.
ESC_SPLITS = [
    (_CLANZ, _GUB, "Extra Turrets", "Extra Turrets (escorts: +1 turret)",
     dict(mod=dict(tu=1), cond=dict(esc=1, nmno="hulk", noup=r"^maniac turrets"),
          desc="Escorts get +1 Turret. The cost is for the whole tiddla skwadron.")),
    (_CLANZ, _GUB, "Looted Lances", "Looted Lances (escorts: 15 cm)",
     dict(swp=dict(f=r"heavy gunz", nmf=r"heavy gunz(?: battery)?", nm="lance battery", rg="15 cm", st="2"),
          cond=dict(esc=1, nmno="hulk", has="heavy gunz"),
          desc="Any heavy gunz batteries on the escorts are replaced with a Strength-2 lance battery. Range is 15 cm for escorts. The cost is for the whole tiddla skwadron.")),
    # p.373 Klaws: "(Not for escorts except the Grunt at +5 points per escort.)"
    # The list's only Gubbin priced per escort, so per="hull"
    # and not a fixed price for the whole skwadron (interpretation decision T31, 14.9.2026).
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


# --------------------------------------------------------- prose upgrades
#
# (list name, section heading, source sentence, rows)
#
#   sentence = a regex that MUST be found in the section's rule text; its groups
#              can be used in the price in the form "$1"
#   rows     = a list of dicts: l=name, p=price ("$1" = from the sentence), other flags
#
# Every price is read from the source sentence when the book writes it
# there. A hand-written number is only where the sentence does not contain it.

# Hulls that already have xenotech as their own option: the Heavy Transport (p.192,
# +10 one refit) and the Xenos Vessel variants (p.194-198).
_XENO_OWN = r"heavy transport|xenos vessel|fra.al raider|nekulli whip|pthuxutl"
# The Stryxis Caravan Vessel is an ally (p.206 "cannot ally with any fleet
# that contains Eldar vessels"). p.185 sells the table to "each Rogue Trader vessel",
# and p.186 limits it: "can only be used by Rogue Trader cruisers and
# escorts, not by other reserves or allied vessels in the fleet" (spot check 19, J36).
_XENO_NOT = _XENO_OWN + "|stryxis caravan"

EXTRA = [
    # ---- Chaos: the Warmaster's extra re-roll and required Mark -------------
    dict(lst=r"Chaos", sec=r"^Chaos Warmaster",
         sent=r"Warmaster may be given an extra re-roll at a cost of \+?(\d+)\s*points",
         rows=[dict(l="One extra re-roll", p="$1", a=1)]),
    # dflt and not req: the row is chosen when the ship is added, but it may be
    # removed. The reason is in the book: the god's own battle barge carries the Mark in its
    # price already - "This ship bears the Mark of Nurgle as part of its point
    # cost; it does not have to be paid for separately by the ship's
    # commander" (p.264, and the same p.260/262/266) - and a locked row charged for
    # it a second time. The requirement itself does not go away: it is now a fleet-level
    # rule (mark_paid), which sees which situation is at hand.
    dict(lst=r"Chaos", sec=r"^Chaos Warmaster",
         sent=r"The Warmaster must take the (Mark of \w+)",
         rows=[dict(l="The $1", p="@The $1", a=1, dflt=1)]),

    # ---- Chaos: the Lord's re-roll (in the book only in the body text) ------
    dict(lst=r"Chaos", sec=r"^Chaos Lords?$",
         sent=r"A Lord may be given a re-roll[^.]*?(?:for|at) \+?(\d+)\s*points",
         rows=[dict(l="One re-roll (his own ship or squadron only)", p="$1", a=1)]),

    # ---- Chaos: a Space Marine crew --------------------------------------
    # "Any capital ship can be designated" - not for escorts; a Daemonship
    # cannot have a CSM crew (p.237, 247, 249, 251, 253).
    dict(lst=r"Chaos", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"capital ship can be designated as having (?:a|an)\s*(.*?)\s*Chaos Space Marine crew at \+?(\d+)\s*points",
         rows=[dict(l="$1 Chaos Space Marine crew", p="$2", a=1,
                    # p.262: the Wage of Sin "always counts as being crewed by
                    # Emperor's Children Chaos Space Marines (included it its
                    # cost)" - not sold again (spot check 8 row 39).
                    # p.290: "Hulks cannot take any upgrade that improves
                    # Boarding Value" (the crew +2 boarding) and "It may not
                    # take any Chaos Marks" (spot check 12 row 73).
                    # The Chaos Space Hulk gets the crew (T21): p.289 "including the
                    # Warmaster's base leadership, having Chaos Space Marines
                    # embarked"; the crew's +2 is a die modifier, not boarding value.
                    cond=dict(cap=1, noup=r"^daemonship:", nmno=r"^wage of sin|^slaverer"))]),
    dict(lst=r"Chaos", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"For \+?(\d+)\s*points, battleships and grand cruisers[^.]*?may include Chosen Terminators",
         # The sentence limits itself: "battleships and grand cruisers ... may include".
         # Without the condition the row was also offered to the Chaos Space Hulk (Defence),
         # which p.290 also forbids upgrades that improve boarding value.
         # "... with Chaos Space Marine Warmasters, Lords or crews may include
         # Chosen Terminators" (p.245-253): the crew is a condition. The binding of the Warmaster and
         # the Lord to a ship is not modelled in the row's conditions (spot check 7
         # rows 13, 29, 31, 46, 50, 90).
         rows=[dict(l="Chosen Terminators (battleship / grand cruiser)", p="$1", a=1,
                    cond=dict(ty="battleship|grand cruiser", up=r"chaos space marine crew")),
               # p.262: the Wage of Sin's crew is included in the price, so it is a
               # "battleship ... with Chaos Space Marine ... crews" even without the row.
               # The start of the name differs: annotate removes duplicates of the same
               # name and price (brackets off the name), so "Chosen
               # Terminators (...)" +10 disappeared as a repeat of the first row.
               dict(l="Wage of Sin: Chosen Terminators (crew included)", p="$1", a=1,
                    cond=dict(nm=r"^wage of sin"))]),

    # ---- Chaos: Thunderhawks of a Space Marine crew (J213, S0512) ---------
    # p.245: "A ship with a Chaos Space Marine crew may be equipped with
    # Thunderhawk Gunships but if so it may only carry Thunderhawks and may
    # not launch any other attack craft." There is no price, so the row is 0 pts.
    # On the god lists the extractor cut the sentence into a section heading ("Marine crew
    # may be"), on Tzeentch the sentence ends mid-way - hence two section names and
    # the middle of the sentence as the search. The Incursion list does not have the sentence.
    dict(lst=r"Chaos", sec=r"^(?:ORDNANCE|Marine crew may be)$",
         sent=r"equipped with Thunderhawk Gunships but if so",
         rows=[dict(l="Thunderhawk Gunships (Chaos Space Marine crew)", p="0", a=1,
                    cond=dict(up=r"chaos space marine crew", has="launch bay"),
                    x="The ship then carries only Thunderhawks and launches no other attack craft.")]),

    # ---- Chaos: a Mark for the god list's ships ---------------------------
    # On the god lists a Mark goes only to the Warmaster (required, its own row), the Lord
    # (its own row), a CSM-crewed ship ("A ship with a ... Chaos Space
    # Marine crew may have a Mark of X", p.246/248/250/252) and a Daemonship
    # (Nurgle/Khorne/Slaanesh: included in the price; Tzeentch: "paid for
    # separately", p.247). The price is read from the Warmaster's Mark row (@).
    # Nurgle's Mark gives +1 Damage Point (p.248).
    dict(lst=r"Tzeentch", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Tzeentch)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # p.260 Scion of Prospero: the Mark "as part of its point cost" (spot check 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^scion of prospero"))]),
    dict(lst=r"Nurgle", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Nurgle)",
         rows=[dict(l="The $1", p="@The $1", a=1, mod=dict(hp=1),
                    # p.264 Terminus Est: the Mark "as part of its point cost" (spot check 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^terminus est"))]),
    dict(lst=r"Khorne", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Khorne)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # p.266 Slaverer: the Mark "as part of its point cost" (spot check 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^slaverer"))]),
    dict(lst=r"Slaanesh", sec=r"CHAOS SPACE MARINE CREWS",
         sent=r"A ship with (?:a|an) [^.]*?Chaos Space Marine crew may have a (Mark of Slaanesh)",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    # p.262 Wage of Sin: the Mark "as part of its point cost" (spot check 9).
                    cond=dict(cap=1, up=r"chaos space marine crew", nmno=r"^wage of sin"))]),
    dict(lst=r"Tzeentch", sec=r"^DAEMONSHIPS$",
         sent=r"Daemonships in a Sorcerous Fleet may only take the (Mark of Tzeentch), paid for separately",
         rows=[dict(l="The $1", p="@The $1", a=1,
                    cond=dict(cap=1, up=r"^daemonship:"))]),

    # ---- Orks: Dakka Dakka -----------------------------------------------
    # p.369: +2 turrets for a capital ship, +1 turret per ship for an escort -
    # the row belongs only to its own ship class and changes the turrets.
    # Capital ship = battleship or cruiser (Rulebook p.42: "battleships and
    # cruisers are often grouped together under the general heading of capital
    # ships"). A Rok (p.394 "Defence/8") and an Ork hulk (p.391 "Defence/40") are
    # neither, nor escorts: no Dakka Dakka (user 12.10.2026,
    # J189). The condition cap=1 means in the domain only "not an escort", so the type
    # is named separately. The same for the boarding torpedoes rows below (p.361:
    # "Any capital ship in the Ork fleet list armed with torpedoes"; a Rok has
    # torpedoes, but it is not a capital ship - the hulk has its own +15 row).
    dict(lst=r"Ork", sec=r"DAKKA DAKKA",
         sent=r"capital ships can add \+2 turrets to their ships for \+?(\d+)\s*points",
         rows=[dict(l="Dakka Dakka: +2 turrets", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser"), mod=dict(tu=2))]),
    dict(lst=r"Ork", sec=r"DAKKA DAKKA",
         sent=r"escorts may add \+1 turret for \+?(\d+)\s*points per escort",
         rows=[dict(l="Dakka Dakka: +1 turret (every escort in the squadron)",
                    p="$1", a=1, per="hull", cond=dict(esc=1), mod=dict(tu=1))]),

    # ---- Ordnance extra purchases -----------------------------------------
    # Not for orks: for them the same purchase already comes from the faction's shared
    # rules under the name "Torpedo-bommas" (the book's own word). Under two different
    # names the same row went unnoticed by the duplicate weeding and
    # showed twice at the same price on the Clanz list.
    dict(lst=r"^(?!Orks|Demiurg)", sec=r"^ORDNANCE$",
         sent=r"torpedo[\s-]*bom[bm](?:er|ma|a)s? for \+?(\d+)\s*points per launch bay",
         rows=[dict(l="Torpedo bombers", p="$1", a=1, per="bay",
                    cond=dict(has="launch bay"),
                    x="Per launch bay strength.")]),
    # p.487: "Demiurg ships utilize highly automated versions of ... They
    # do not have access to boarding torpedoes but may use torpedo bombers
    # for +10 points per launch bay." The allies (Tau, Rogue Trader,
    # Kroot) do not get it - spot check 6 row 90 offered the row to the Emissary.
    dict(lst=r"Demiurg", sec=r"^ORDNANCE$",
         sent=r"do not have access to boarding torpedoes but may use torpedo bombers for \+?(\d+)\s*points per launch bay",
         rows=[dict(l="Torpedo bombers", p="$1", a=1, per="bay",
                    cond=dict(has="launch bay", nm="commerce vessel"),
                    x="Demiurg vessels only. Per launch bay strength.")]),
    dict(lst=r"Ork", sec=r"^ORDNANCE$",
         sent=r"capital ships that use torpedoes may use boarding torpedoes for \+?(\d+)\s*points",
         # The sentence limits itself: "capital ships that use torpedoes". Without the condition
         # the row was offered to the Onslaught escort (spot check 6 row 71).
         # noup: Da Ork Clanz p.373, an Assault Karrier "takes boarding torpedoes for free" (RAW-06).
         rows=[dict(l="Boarding torpedoes", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser", has="torpedo", nmno="hulk", noup=r"^assault karrier"))]),
    dict(lst=r"Bakka", sec=r"^ORDNANCE$",
         sent=r"Emperor class battleship may carry Shark assault boats at an additional cost of \+?(\d+)\s*points",
         # The sentence limits itself: "An Emperor class battleship may carry Shark assault
         # boats" - the row was offered to the Mercury and the Victory (spot check 7 rows 25, 39).
         rows=[dict(l="Shark assault boats (Emperor class only)", p="$1", a=1,
                    cond=dict(nm="emperor"))]),
    dict(lst=r"Space Marines", sec=r"^ORDNANCE$",
         sent=r"may be equipped with an Honour Guard for \+?(\d+)\s*points per ship",
         # p.99: "Any battle barge or strike cruiser in the fleet may be
         # equipped with an Honour Guard" - not for escorts (spot check 6 row 13).
         rows=[dict(l="Honour Guard", p="$1", a=1,
                    cond=dict(nm="battle barge|strike cruiser"))]),

    # ---- Bakka: +1 turret --------------------------------------------------
    dict(lst=r"Bakka", sec=r"^Imperial Navy$",
         sent=r"\+1 turret\.+\s*\+?(\d+)\s*points",
         # p.50: "Any capital ship of Battlefleet Bakka can add this upgrade."
         # p.50: "Reserve vessels may not be given this upgrade" - the Jovian is
         # the Bakka list's RESERVES row (J11 systematic search).
         # J213: a borrowed ship is Bakka's reserve, so the host's row is not
         # offered to it (nohost); a Bakka ship elsewhere as a reserve takes its own
         # row along, because it is its own list's row.
         # J217 p.50: the row is under the "Imperial Navy" heading; Bakka's
         # Adeptus Mechanicus ships take the Fleet Defence Turrets row
         # (a heading of its own), so this is not offered to a Mechanicus ship.
         rows=[dict(l="+1 turret (Battlefleet Bakka refit)", p="$1", a=1,
                    cond=dict(cap=1, nmno=r"jovian", nohost=1, nomech=1), mod=dict(tu=1))]),

    # ---- Bakka: Fleet Defence Turrets of the Adeptus Mechanicus ships (J217) ----
    # p.50: "When used with Battlefleet Bakka, Adeptus Mechanicus capital ships
    # may take the Fleet Defence Turrets refit instead of rolling randomly on
    # the Mechanicus Gifts table." The gift is free, so the swap is 0 pts.
    dict(lst=r"Bakka", sec=r"^Adeptus Mechanicus$",
         sent=r"may take the Fleet Defence Turrets refit instead of rolling randomly",
         rows=[dict(l="Fleet Defence Turrets (instead of a Mechanicus Gift)", p="0", a=1,
                    cond=dict(cap=1, mech=1),
                    x="Two turrets on a ship are exchanged for fleet defence turrets capable of protecting itself "
                      "or any one other vessel within 15 cm each ordnance phase, adding +2 to the turret strength "
                      "of the ship it is defending (this does not alter bomber attack rolls when used to defend "
                      "another vessel).")]),

    # ---- Rogue Trader equipment -------------------------------------------
    dict(lst=r"Rogue Traders", sec=r"POWER RAM",
         sent=r"Power Ram may be taken by any Rogue Trader capital ship with a 6\+ prow for \+?(\d+)\s*points",
         # The sentence limits itself: a capital ship, a 6+ prow, no Nova Cannon. Without
         # the condition the row was offered to escorts and 5+ prows (spot check 6, 12
         # rows). Demiurg and Kroot allies are not a "Rogue Trader
         # capital ship" (p.186) nor an "Imperial capital ship" (p.32).
         rows=[dict(l="Imperial Power Ram (6+ prow, not with a Nova Cannon)",
                    p="$1", a=1,
                    # FAQ 2026 *Power ram* (the user's decision 20.10.2026: the FAQ is
                    # the third authority): "only Imperial Navy, Rogue Trader and
                    # Adeptus Mechanicus ships ... not available for Strike
                    # Cruisers". The Pirates list's Space Marine Strike Cruiser
                    # (p.188) is excluded as in Armageddon.
                    cond=dict(cap=1, prow="6", no="nova cannon",
                              nmno="commerce vessel|warsphere|strike cruiser|battle barge"))]),
    dict(lst=r"Rogue Traders", sec=r"THE BEST MONEY CAN BUY",
         sent=r"roll randomly against the Xenotech System table below for \+?(\d+)\s*points per cruiser or \+?(\d+)\s*points per escort",
         # Two prices, two rows: before, an escort was offered the cruiser's
         # 15 (spot check 6 row 74). The Heavy Transport (p.192, its own +10 option)
         # and the Xenos Vessel hulls (p.194-198, xenotech included) do not get
         # the list's rows on top.
         rows=[dict(l="Xenotech System, rolled randomly (cruiser)", p="$1", a=1,
                    cond=dict(cap=1, nmno=_XENO_NOT)),
               dict(l="Xenotech System, rolled randomly (escort, per ship)", p="$2", a=1,
                    # p.202 Fast Clipper: "Instead of taking a refit normally" -
                    # a taken Fast Clipper replaces the Xenotech refit (J16).
                    per="hull", cond=dict(esc=1, nmno=_XENO_OWN, offopt=r"^Fast Clipper"))]),
    dict(lst=r"Rogue Traders", sec=r"THE BEST MONEY CAN BUY",
         sent=r"For an additional \+?(\d+)\s*points per ship, the player can select the desired technology",
         rows=[dict(l="Choose the Xenotech System instead of rolling", p="$1", a=1,
                    # "For an additional +5 points per ship": the choice is on top of the
                    # roll, not a replacing purchase (spot check 19 round 2, J60).
                    per="hull", cond=dict(nmno=_XENO_NOT, offopt=r"^Fast Clipper",
                                          up=r"^Xenotech System, rolled randomly"))]),
    # F15 (spot check 6 row 88): the Exploration list p.186 "The Xenotech Systems
    # refits listed on [p.185] can only be used by Rogue Trader cruisers and
    # escorts, not by other reserves or allied vessels" and "may start by
    # taking one refit from the Xenotech list for the appropriate point
    # cost" - the prices are on p.185 (15 / 5 per escort / +5 choice).
    dict(lst=r"Exploration", sec=r"The Best Money Can Buy",
         sent=r"Xenotech Systems refits listed on .*? can only be used by Rogue Trader cruisers and escorts",
         rows=[dict(l="Xenotech System, rolled randomly (cruiser)", p="15", a=1,
                    cond=dict(cap=1, nmno=_XENO_NOT + "|commerce vessel|warsphere"),
                    x="Rogue Trader cruisers only; price from the Rogue Traders list (Fleets p. 185)."),
               dict(l="Xenotech System, rolled randomly (escort, per ship)", p="5", a=1,
                    per="hull", cond=dict(esc=1, nmno=_XENO_OWN, offopt=r"^Fast Clipper"),
                    x="Rogue Trader escorts only; price from the Rogue Traders list (Fleets p. 185)."),
               dict(l="Choose the Xenotech System instead of rolling", p="5", a=1,
                    per="hull", cond=dict(nmno=_XENO_NOT + "|commerce vessel|warsphere",
                                          offopt=r"^Fast Clipper",
                                          up=r"^Xenotech System, rolled randomly"),
                    x="Price from the Rogue Traders list (Fleets p. 185).")]),

    # ---- Inkvisiittorit ----------------------------------------------------
    # v0.40: the Grey Knights list (p.154) has the same 0-1 Inquisitor Lord
    # section as the Inquisition (p.148), with the Ordo Malleus Lord (Ld 10,
    # 100 pts) as a row of its own; v0.36's FLEET COMMANDER rows ("may
    # purchase up to two more re-rolls", "Ordo Malleus ... +100 pts") are gone.
    dict(lst=r"Inquisition|Grey Knights", sec=r"^Inquisitor Lord$",
         sent=r"A second re-roll can be purchased for \+?(\d+)\s*points",
         rows=[dict(l="One extra re-roll", p="$1", a=1)]),

    # ---- Pirate and eldar commanders ---------------------------------------
    dict(lst=r"Pirates and Wolf Packs", sec=r"^Pirate Captains$",
         sent=r"may purchase up to two more re-rolls for \+?(\d+)\s*points each",
         rows=[dict(l="One extra re-roll", p="$1", a=1),
               dict(l="Two extra re-rolls", p="$1*2", a=1)]),
    # Prince Yriel's re-rolls and the Flame of Asuryan discount: his own page
    # (p.313) since v0.40, built in profile_types.py (J161).

    # ---- AdMech (v0.40) ------------------------------------------------------
    # v0.40 p.125: the list's capital ships are the Adeptus Mechanicus
    # profiles on p.126-137, and "These extra rules, where applicable, are
    # already included in the profiles on the following pages, i.e. increased
    # turrets and the dorsal lance." The profiles also carry the Mechanicus
    # options themselves (plasma-boosters, nova cannon, the light cruisers'
    # dorsal lance and prow armour, the power ram), so the list-level rows of
    # v0.36 (+1 turret, dorsal lance, nova cannon, Retribution nova, plasma
    # batteries, light cruiser dorsal lance) are gone: they would count twice.
    # The escorts are still the Imperial Navy profiles (p.121: "Mechanicus
    # escorts do not have the +1 turret as part of their point cost").
    #
    # Power ram: v0.40 removed the fleet-wide rule ("Power Ram may be taken by
    # any Imperial capital ship with a 6+ prow", FAQ 2026 *Power ram*) and
    # prints it as an option of each ship that may take it. The new book wins
    # over the FAQ (CLAUDE.md), so the ram is a profile option now.
    dict(lst=r"Mechanicus", src=r"Mechanicus", sec=r"^FLEET RULES",
         sent=r"They however may each purchase \+1 turret for \+?(\d+)\s*points",
         rows=[dict(l="+1 turret (escort squadron)", p="$1", a=1, per="hull",
                    cond=dict(esc=1), mod=dict(tu=1),
                    x="If taken, every escort in the squadron takes it.")]),


    # ---- Inquisition ------------------------------------------------------
    dict(lst=r"Inquisition", sec=r"ORDO XENOS",
         sent=r"Alternatively, the refit may be selected for \+?(\d+)\s*points",
         rows=[dict(l="Choose the Xenotech refit instead of rolling",
                    p="$1", a=1)]),
    dict(lst=r"Inquisition", sec=r"ORDNANCE AND UPGRADES",
         sent=r"ship embarking an Inquisitor is equipped with launch bays, it must replace its attack craft with Thunderhawks, with its launch bay strength divided in half",
         rows=[dict(l="Embarks the Inquisitor: Thunderhawks, launch bays halved",
                    p="0", # p.149: "If an Imperial Navy or Adeptus Mechanicus ship embarking an
                    # Inquisitor is equipped with launch bays..." - not for Grey Knights
                    # ships; no speed is given, so the Thunderhawk is 20 cm (p.95).
                    # The Inquisitorial cruiser (p.160) is neither an Imperial Navy nor a
                    # Mechanicus ship; its Thunderhawk bays are in the profile
                    # at full strength (spot check 8 row 48).
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

    # ---- Tau: Kor'O'Mesme's ship refit ------------------------------------
    # Kor'O'Mesme can be chosen only on the Commerce Protection list,
    # so his ship's refit belongs there and not to the Merchant Fleet.
    dict(lst=r"Commerce Protection", src=r"Tau", sec=r"^FLEET RULES",
         sent=r"Improved Logic Engines:\s*\+?(\d+)\s*pts",
         # p.453: "His ship can be refitted" - Kor'O'Mesme leads the Custodian
         # (p.456). Without the condition the row was offered to every Tau ship
         # (spot check 6 rows 19, 48, 49, 63, 66, 79).
         rows=[dict(l="Improved Logic Engines", p="$1", a=1,
                    cond=dict(nm="custodian"),
                    x="Only the vessel carrying Kor'O'Mesme.")]),

    # ---- Orks: ordnance is priced by launch bay strength ------------------
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"Torpedo-bommas may be taken by any ship equipped with launch bays for \+?(\d+)\s*points per launch bay strength",
         rows=[dict(l="Torpedo-bommas", p="$1", a=1, per="bay",
                    # Da Ork Clanz p.373: an Assault Karrier "may only use assault boats"
                    cond=dict(has="launch bay", noup=r"^assault karrier"),
                    x="Per launch bay strength.")]),
    # Da Ork Clanz p.373: an Assault Karrier "takes boarding torpedoes for
    # free", so the paid rows give way to it (RAW-06; the Waaagh! list has no Karrier)
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"capital ship in the Ork fleet list armed with torpedoes can use boarding torpedoes for \+?(\d+)\s*points",
         rows=[dict(l="Boarding torpedoes", p="$1", a=1,
                    cond=dict(cap=1, ty=r"battleship|cruiser", has="torpedo", nmno="hulk", noup=r"^assault karrier"))]),
    dict(lst=r"Ork", src=r"Cyclops", sec=r"^FLEET RULES",
         sent=r"A Space Hulk may use boarding torpedoes for \+?(\d+)\s*points",
         rows=[dict(l="Boarding torpedoes (Space Hulk)", p="$1", a=1,
                    cond=dict(nm="hulk", noup=r"^assault karrier"))]),

    # Da Ork Clanz: "Ork Warlord....Free" used to come here, because
    # the list extractor dropped the row - a price in words without "pts"
    # did not fit its price pattern. Now the row parses natively (k=cmd,
    # p=0), so no injection is needed.
]

# ------------------------------------------------------------- price lists
#
# (target lists, source list, heading sentence, row pattern, section name)
#
# The row pattern's last capture group is the price, the one before it the name.

TABLES = [
    dict(lst=r"Tyranids", src=r"Vanguard", into="BIO-ENHANCEMENTS",
         sent=r"If a degree of randomness is desired the following refits "
              r"can be rolled against 2D6",
         row=r"(\d{1,2})[:.]?\s+([A-Z][\w'\- ]{3,32}?)\s*\.{2,}\s*\+?(\d+)\s*pts(\s+each)?",
         nt="Bio-enhancement, Fleets pg. 426-427.",
         # The book's own sentences on p.426 as they are - a paraphrase showed
         # to the player as the book's rule (check_pages.py, 14.9.2026).
         text=["No hive ship may ever have more than three different special refits, "
                     "no cruiser more than two and no escort more than one.",
                     "With the exception of reinforced carapace and extra spore cysts, "
                     "no single bio-enhancement may be granted more than once.",
                     "These refits can only be used in one-off games if both players agree."]),
]

# The Gubbins price list is printed on the Waaagh! list's pages (367-371), and
# the Clanz list refers to it: "A Warlord may choose for his own ship or
# escort skwadron one upgrade from the Gubbins list". The Waaagh! list has already
# parsed the rows properly, so they are copied from there as they are
# and not parsed from prose again - otherwise the same price would be in two
# places and could diverge.
GUBBIN_NT = "Gubbin, Fleets pg. 369-373."
# p.374 word for word. The earlier text also said "each Gubbin only once",
# which the book does not say - that is the rows' own mx limit, not a sentence of the book.
GUBBIN_TEXT = ("A Warlord may choose for his own ship or escort skwadron one upgrade "
               "from the Gubbins list for every re-roll he has at its listed cost.")
GUBBIN_SECS = ("GUBBINS", "MORE GUBBINS")
# Sections of the same Clanz block that have no prices at all. They too belong
# only to the Clanz list (Fleets p.370: "only with its dedicated Clanz fleet
# list"), so they move there as text sections.
ORK_CLANZ_TEXT_SECS = ("MOB RULE", "YOUNG GUNZ")


# The clan upgrades get a section of their own: in the book they are on the Clanz list's
# rule pages, not in any ready section.
CLANS = [("Goffs", 20, "Black"), ("Evil Sunz", 20, "Red"),
         ("Bad Moonz", 30, "Yellow"), ("Deathskullz", 30, "Blue"),
         ("Blood Axes", 0, "Green"), ("Snakebites", 0, "Brown")]


def _sentences(text):
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if x.strip()]


def _fill(tpl, m):
    """"$1" -> the first capture group, "$1*2" -> it multiplied by two."""
    s = str(tpl)
    mult = 1
    mm = re.match(r"^(.*?)\*(\d+)$", s)
    if mm:
        s, mult = mm.group(1), int(mm.group(2))
    s = re.sub(r"\$(\d)", lambda g: str(m.group(int(g.group(1)))), s)
    return s, mult


def _page_at(pmap, pos):
    """The page on which char pos of the joined text is (lists.py page_map)."""
    pg = None
    for off, p in pmap or []:
        if off > pos:
            break
        pg = p
    return pg


def _joined(raws_l, pages_l):
    """The text of all the list's sections as one, and its page boundaries."""
    out, base = [], 0
    for raw, pm in zip(raws_l, pages_l):
        out += [[base + off, p] for off, p in pm or []]
        base += len(raw) + 1
    return " ".join(raws_l), out


def annotate(lists_out, raws, pages=None):
    """Completes the lists in place.

    raws[li][si] = the section's original rule text, pages[li][si] its
    page boundaries [[char, page], ...]. A row made from prose gets its sentence's
    page (src_page, J165). Returns (added, skipped, warnings).
    """
    added, skipped, warn = 0, 0, []
    if pages is None:
        pages = [[[] for _ in r] for r in raws]

    # --- 1. real rows from prose rows ------------------------------------
    for li, Lx in enumerate(lists_out):
        for rule in EXTRA:
            if rule.get("src"):
                continue                 # handled as shared in phase 1b
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
                        continue                    # already a row of its own in the book
                    ptxt, mult = _fill(row["p"], m)
                    if ptxt.startswith("@"):        # the price is fetched from another row
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
                warn.append("%s / %s: the section exists, but the source sentence does not match "
                            "-> not added (check the book's wording)"
                            % (Lx["nm"], rule["sec"]))

    # --- 1b. the faction's shared rules into all its lists ----------------
    # The source sentence is searched in the list on whose rule pages it is, and
    # the rows are added to every target list in a section of their own.
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
            warn.append("shared rule %r: the source sentence is not found in list %r"
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
                    continue                       # already on the list as a row of its own
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

    # --- 1c. price tables as sections of their own ------------------------
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
            warn.append("price list %r: the heading sentence is not found" % tab["into"])
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
            warn.append("price list %r: no row parsed" % tab["into"])
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

    # --- 1d. Gubbins from the Waaagh! list to the Clanz list ---------------
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
        # The rule text moves too: every Gubbin's description is
        # among the price list in the book, and it is not shown elsewhere in the app.
        gub_text = [t for sx in src["secs"] if sx["t"] in GUBBIN_SECS
                    for t in sx.get("text", [])]
        if rows:
            dst["secs"].append(dict(t="GUBBINS", rules=[], ents=rows,
                                    text=[GUBBIN_TEXT] + gub_text, notes=[GUBBIN_NT]))
            added += len(rows)
        else:
            warn.append("no Gubbins rows found on the Waaagh! list")

        # MOB RULE and YOUNG GUNZ are in the same Clanz block and are not
        # priced, so they move as plain text sections.
        for t in ORK_CLANZ_TEXT_SECS:
            sx = next((x for x in src["secs"] if x["t"] == t), None)
            if sx is None or not sx.get("text"):
                warn.append("Clanz text section %r not found"
                            "on the Waaagh! list" % t)
                continue
            if any(x["t"] == t for x in dst["secs"]):
                continue
            dst["secs"].append(dict(t=t, rules=[], ents=[],
                                    text=list(sx["text"])))

    # --- 2. Ork clans as a section of their own -----------------------------
    # The clans' names and prices are on the same Waaagh! pages as the
    # Gubbins price list, but the clan upgrades belong to the Clanz list.
    # So search the Waaagh! list's text and write into Clanz.
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
            # The clan's price is on the Waaagh! list's pages (p.369-373).
            _cm = re.search(re.escape(name), clan_blob, re.I)
            rows.append(dict(
                l="Clan: %s (%s)" % (name, col), r=None, p=pts, a=1, u=1,
                mx=None, prose=1,
                src_page=_page_at(clan_pm, _cm.start()) if _cm else None,
                # Ruling T58 (user 26.10.2026): every Rok pays too - p. 371
                # counts Rok skwadrons among the capital ship skwadrons
                # (Snakebites), and only a tiddla skwadron pays once.
                nt="Clan upgrade, Fleets pg. 369–373. Every capital ship in "
                   "the skwadron pays separately, and so does every Rok; for "
                   "tiddla skwadrons the cost is for the whole skwadron. The "
                   "skwadron must show clan colours."))
        # The Blood Axe Warlord's ship's Imperial Navy refit (p.371: "The
        # Warlord's ship may take one refit from the Imperial Navy refit table
        # (rolled randomly) for +20 points."): a row of its own (user
        # 29.10.2026), so that it can be bought and printed - it was only the
        # clan's text. Priced from the sentence. The fleet check keeps it to a
        # Blood Axe Warlord's own ship (fleet-specials.js, clanz.refit), the
        # fleet pane shows it only there (warlords.js clanzHiddenUps); the
        # table it is rolled on is ruling T61.
        _rm = re.search(r"The Warlord.s ship may take one refit from the Imperial Navy refit table "
                        r"\(rolled randomly\) for \+?(\d+)\s*points", clan_blob, re.I)
        assert _rm, "Blood Axes: the Imperial Navy refit sentence (p.371) was not found"
        rows.append(dict(
            l="Imperial Navy refit, rolled randomly (Blood Axe Warlord's ship)", r=None,
            p=int(_rm.group(1)), a=1, u=1, mx=None, prose=1, cond=dict(cap=1),
            src_page=_page_at(clan_pm, _rm.start()),
            nt="The book prints this only in the Blood Axes text: \u201c%s.\u201d" % _rm.group(0)))
        if rows:
            # The book's own clan descriptions ("All Evil Sunz ships gain +5 cm
            # speed") are on the Waaagh! list's pages. They tell what
            # each clan gives, so they come along.
            clan_text = [t for Sx in lists_out if "Waaagh" in Sx["nm"]
                         for sx in Sx["secs"] if sx["t"] == "CLAN UPGRADES"
                         for t in sx.get("text", [])]
            # The hand-written introduction was removed: the book's own sentence
            # "A Warlord and his skwadrons may only be from one clan..."
            # now comes with clan_text, and two almost identical sentences
            # in a row is exactly the repetition the feedback
            # pointed out.
            Lx["secs"].append(dict(
                t="CLAN UPGRADES", rules=[], ents=rows, text=clan_text))
            added += len(rows)

    # --- 3. duplicates out ---------------------------------------------------
    for Lx in lists_out:
        for sec in Lx["secs"]:
            keep, seen = [], []
            for e in sec["ents"]:
                if e.get("r"):
                    # A ship row starts its own list of alternatives, so
                    # the memory is reset. Without this the three ships of the
                    # tyranids' ESCORTS section merged into one list and the Escort
                    # drone and the Kraken lost "Feeder tentacles +5",
                    # because the Vanguard drone ship already had a row of the same name
                    # and price. Attachment works the same way: an upgrade
                    # belongs to the preceding ship.
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

    # --- 4. classification, groups and attachment targets ------------------
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

        # The hulk's Gubbins (spot check 7 row 22): the original row is not
        # the hulk's; of the allowed ones a double-priced copy only for the hulk.
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
                    h["nt"] = ((("Fleets p. 373: More Gubbins can be taken by any number of capital "
                                 "ships in the fleet, so a Space Hulk pays the listed cost; the double "
                                 "cost on p. 374 covers the list of Gubbins. ")
                                if flat else
                                ("Fleets p. 374: a Space Hulk takes Gubbins for double the "
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
                # Deathskullz (p.371): "Deathskullz capital ships and/or tiddla
                # skwadrons have 'looted' upgrades (torpedoes and/or lances) for
                # no additional cost." From every Looted row (also the escort
                # and hulk versions) a free copy for the Deathskullz; the paid
                # row is not offered with the clan.
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
                                 " Deathskullz take it for no additional cost (Fleets p. 371).").strip()
                    h.pop("grp", None)
                    e["cond"] = dict(c0, noup=r"^clan: deathskullz")
                    free.append(h)
                    _DEATHSKULLZ_HITS[0] += 1
                sec["ents"].extend(free)

        # Waaagh! (J224): a hulk Warlord pays +50 for Extra Power Fields
        # (p.392: "Extra Powerfields costs +50 pts instead of +25."). The Warlord's
        # upgrades are in the WARLORD section on the commander, and the ship does not affect
        # the row's price, so the hulk price is a row of its own in the same
        # exclusive group. The row goes to the end of the list, so that the other
        # rows' indices in the section do not shift. resolveFleet compares the taken row
        # to the Warlord's placement (build_data.py L.hulk_pf, J215).
        if Lx["nm"] == "Orks — Waaagh!":
            for sec in Lx["secs"]:
                if sec["t"].strip().upper() != "WARLORD":
                    continue
                src = [e for e in sec["ents"] if e.get("k") == "up" and e["l"] == "Extra Power Fields"]
                assert len(src) == 1, ("Waaagh! Extra Power Fields", len(src))
                h = dict(src[0])
                h["l"] = "Extra Power Fields (Space Hulk)"
                h["p"] = 50
                h["src_page"] = 392
                h["desc"] = ("A Warlord aboard a space hulk: Extra Powerfields costs +50 pts instead of +25 "
                             "(Fleets p. 392).")
                sec["ents"].append(h)
                _HULK_PF_HITS[0] += 1

        # Tyranid bio-enhancements "each" (p.426): Reinforced Carapace at most
        # +4 Hits for a hive ship and +3 for a cruiser, Extra Spore Cysts at most
        # two. The multiples as rows of their own in the same exclusive group.
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
                continue                     # free-standing: attaches to anything
            interleaved = any(u < max(units) for u in ups)
            for i in ups:
                if interleaved:
                    owner = max([x for x in units if x < i], default=None)
                    if owner is None:
                        continue
                    sec["ents"][i]["at"] = [[si, owner]]
                else:
                    sec["ents"][i]["at"] = [[si, x] for x in units]

        # A "One prow weapon" type section belongs to the preceding section's ship.
        # The book writes as a weapon section heading both "One prow weapon"
        # and "Up to Three Port/Starboard Weapons"; both
        # belong to the previous section's ship.
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

        # "Choose exactly one weapon." The book says it either in the section heading
        # ("One prow weapon") or in the body text ("A Kraken must be armed
        # with one weapon chosen from the following list"). The group comes from
        # the attachment target and not from the section: the Hive list's ESCORTS section has
        # three ships in a row, and the Kraken's weapon must not switch off the Escort
        # drone's weapon. "Up to Three Port/Starboard Weapons" is left out,
        # because there the book allows several.
        ONE_WEAPON_SEC = re.compile(r"^one\b.*\bweapons?$", re.I)
        ONE_WEAPON_TXT = re.compile(r"must be armed with one weapon chosen",
                                    re.I)
        # v0.40 p.431 prints each "must be armed with one weapon chosen from the
        # following list:" as a lead-in of its own, which the text cleaning drops,
        # so the Hive Fleet's ESCORTS section is named.
        for si, sec in enumerate(Lx["secs"]):
            if not (ONE_WEAPON_SEC.match(sec["t"])
                    or any(ONE_WEAPON_TXT.search(t) for t in sec.get("text", []))
                    or (Lx["nm"] == "Tyranids \u2014 Hive Fleet" and sec["t"] == "ESCORTS")):
                continue
            for e in sec["ents"]:
                if e.get("k") != "up" or e.get("grp"):
                    continue
                tgt = e.get("at") or []
                e["grp"] = "wpn_%d_%s" % (si, "_".join(
                    "%d.%d" % (a, b) for a, b in tgt) or "own")
                _ONE_WEAPON_HITS[0] += 1

        # A price list printed as ship classes only, because the section
        # heading tells what is bought. The row is attached to the section
        # whose heading is the same class in plural, and renamed
        # so that it tells about itself also on its own.
        for si, sec in enumerate(Lx["secs"]):
            if sec["t"].strip().upper() not in HULL_PRICE_SECS:
                continue
            for e in sec["ents"]:
                # A Mark row in the same section (Tzeentch p.247) is not a price list.
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
                    warn.append("%s / %s: row %r finds no section %r"
                                % (Lx["nm"], sec["t"], e["l"], want))
                    continue
                e["at"] = tgt
                e["l"] = "Daemonship: " + str(e["l"]).strip()
                # The name hits the GROUPS table's daemon group, but the grouping
                # has already run - set the same result by hand.
                e["grp"] = group_of(e["l"]) or e.get("grp")
                # "A Daemonship may not have a Chaos Space Marine crew"
                # (p.237, 247, 249, 251, 253).
                e["cond"] = dict(noup=r"chaos space marine crew")
                # "(not the Terminus Est or flagship)" p.249, "(not the Wage
                # of Sin or the flagship)" p.253, "Except for the flagship or
                # the Scion of Prospero" p.247: the named ship cannot be a
                # Daemonship. The flagship is a fleet-level matter.
                blob0 = " ".join(sec.get("text") or [])
                mn = (re.search(r"\(not the ([^()]+?) or (?:the )?flagship\)", blob0, re.I)
                      or re.search(r"Except for the flagship or the ([^()]+?)\s*\(if included\)", blob0, re.I))
                if mn:
                    e["cond"]["nmno"] = re.escape(mn.group(1).strip())
                    _NAMED_EXCL_HITS[0] += 1
                # Nurgle/Khorne/Slaanesh: "All Daemonships ... must take the
                # Mark of X, which is already included in the cost to upgrade
                # them to Daemonships" (p.249, 251, 253). The Mark's rule
                # prints from the Daemonship row (domain.js), and Nurgle's Mark
                # gives +1 Damage Point (p.248).
                blob = " ".join(sec.get("text") or [])
                mi = re.search(r"must\s+take\s+the\s+Mark\s+of\s+(\w+),\s+which\s+is\s+already\s+included",
                               blob, re.I)
                if mi:
                    e["inc"] = "Mark of " + mi.group(1)
                    if mi.group(1).lower() == "nurgle":
                        e["mod"] = dict(hp=1)
                    _MARK_INC_HITS[0] += 1
                _HULL_PRICE_HITS[0] += 1

        # Armageddon's re-roll sections name their commander in their heading.
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
