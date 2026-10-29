# -*- coding: utf-8 -*-
"""Stage 4 of the data pipeline (extractor/build_data.py): rule detectors.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import NUM, n, re, sing
# ------------------------------------------------------- RULE DETECTORS
# The denominator may name two types: "for every three cruisers or
# battlecruisers". A lazy group stopped at the first word and "or
# battlecruisers" disappeared silently, so the check counted too
# small a denominator and marked a legal fleet illegal.
# The longer alternative is tried first, because a lazy group would
# otherwise settle for the shorter hit.
_TYPE = r"[\w\- ’']+?"
_TYPES = r"(?:" + _TYPE + r"\s+or\s+" + _TYPE + r"|" + _TYPE + r")"
# The number word is optional: "for every cruiser" means one. Before,
# this was (\w+)?, which grabbed the start of the type in place of the number word -
# "for every cruiser" parsed as ("cruise", "r"), n("cruise") was
# empty and the whole rule disappeared. Only real number words are allowed, and
# the list comes from the same NUM table n() uses.
_COUNT = (r"(?:(\d[\d,]*|" +
          "|".join(sorted(NUM, key=len, reverse=True)) + r")\s+)?")
# The end is anchored to the end of the sentence, not to any space.
# Without the anchor a lazy group settled for the first word gap and
# "cruisers or heavy cruisers" was cut to "cruisers or heavy",
# which no section matches - and the whole rule fell back to text.
RATIO_A = re.compile(
    r"(?:may\s+)?include\s+(?:up\s+to\s+)?(\w+)\s+([\w\- ’']+?)\s+(?:in\s+(?:your|the)\s+fleet\s+)?"
    # "for each" is the same as "for every": the tyranids'
    # "up to 2 capital ships for each hive ship in the fleet".
    r"for\s+(?:every|each)\s+" + _COUNT + r"(" + _TYPES + r")"
    r"(?:\s+(?:included\s+)?in\s+(?:the|your|their)\s+fleet)?"
    r"(?=\s*[,.]|\s*$)", re.I)
RATIO_B = re.compile(
    r"for\s+every\s+(\w+)\s+([\w\- ’']+?)\s+(?:included\s+)?in\s+your\s+fleet,?\s+"
    r"you\s+may\s+(?:include|pick|take)\s+(\w+)", re.I)
PER_PTS_MAX = re.compile(
    r"max(?:imum)?\s+of\s+(\w+)\s+([\w\- ’']+?)\s+per\s+([\d,]+)\s*points", re.I)
PER_PTS = re.compile(
    # "include up to one X": without the optional "up to" part
    # the leftmost hit would be "include" and the number word would become
    # "up". "for every FULL 1,000 points" needs its own word.
    r"(?:max\.?(?:imum)?\s+of\s+|(?:include\s+)?up\s+to\s+|include\s+)"
    r"(\w+)\s+([\w\- ’']+?)\s+"
    r"(?:in\s+(?:your|the)\s+fleet\s+)?(?:per|for\s+every)\s+"
    # "full" is not just a filler word: it tells the rounding direction.
    # "for every FULL 1,000 points" means 0-999 = none,
    # whereas "per 500 points, or part" means 1-500 = one.
    r"(?P<full>full\s+)?([\d,]+)\s*points", re.I)
CAP = re.compile(r"include\s+up\s+to\s+(\w+)\s+([\w\- ’']+?)\s+in\s+(?:your|the)\s+fleet", re.I)
# The book also writes a cap without "up to": "Your fleet may include
# no more than twelve cruisers." (Demiurg, p.487). The end
# is anchored to a comma, a full stop or the word fleet, so that a lazy
# group does not swallow the end of the sentence into the type.
CAP2 = re.compile(r"(?:include|have|take)\s+no\s+more\s+than\s+(\w+)\s+([\w\- ’']+?)"
                  r"(?=\s*[,.]|\s+in\s+(?:your|the)\s+fleet|\s*$)", re.I)
# A required commander. The book writes this in two ways, and
# before, only the latter was recognised: 13 lists of 16 were left without
# the check. The difference is real and not just wording - "over 750" means
# more than 750, "750 or more" means from 750 up - so
# the comparison is recorded too.
# "above" is the same as "over": the Grey Knights list writes
# "If the fleet is above 750 points an Inquisitor Lord must lead the fleet".
# Three wordings for the same thing: "worth over 750", "is above 750",
# "has more than 750 points of ships". All mean strictly over.
MAND_GT = re.compile(r"(?:worth\s+(?:over|above|more\s+than|greater\s+than)|"
                     r"is\s+(?:above|greater\s+than|more\s+than)|"
                     r"has\s+more\s+than)\s+"
                     r"([\d,]+)\s*(?:pts|points)", re.I)
MAND_GE = re.compile(r"(?:worth|of)\s+([\d,]+)\s*(?:pts|points)\s+or\s+more", re.I)
# Without this condition the rule would also hit the sentence "If your fleets is worth
# more than 750 pts it must include at least one Explorer" - there the requirement
# concerns one ship class, not the whole section, and a section-level check does not match
# it. So a wording that refers to leading is required.
MAND_LEADS = re.compile(r"(?:to\s+lead\s+it|lead\s+the\s+fleet|"
                        r"must\s+lead\s+(?:it|the\s+fleet)|"
                        r"include\s+an?\s+(?:commander|admiral|archmagos)|"
                        r"(?:commander|admiral)\s+must\s+be\s+included)", re.I)
SQD = re.compile(r"squadrons?\s+of\s+(\d+)\s*[–-]\s*(\d+)", re.I)
SECN = re.compile(r"^(\d+)\s*[–-]\s*(\d+)\s+([\w’' ]+?),?\s+chosen", re.I)
HAS_QUALIFIER = re.compile(r"for\s+every|\bper\s+[\d,]+\s*points|\bper\s+\w+\s+points", re.I)


def detect(sent):
    """Returns a rule dict or None. Strict: uncertain ones stay text."""
    m = PER_PTS_MAX.search(sent)
    if m and n(m.group(1)):
        return dict(kind="per_points", each=n(m.group(1)),
                    what=m.group(2).strip().lower(),
                    per=int(m.group(3).replace(",", "")))
    m = PER_PTS.search(sent)
    if m and n(m.group(1)):
        # Group 3 is now a named full group, so the number is in group 4.
        r = dict(kind="per_points", each=n(m.group(1)),
                 what=m.group(2).strip().lower(),
                 per=int(m.group(4).replace(",", "")))
        if m.group("full"):
            r["full"] = 1
        # p.374 Clanz: "one Warlord for every 500 points, or part, that the
        # fleet is worth - no more, no less" is an exact count, not just an upper limit (J38).
        if re.search(r"no\s+more,?\s+no\s+less", sent, re.I):
            r["exact"] = 1
        return r
    m = RATIO_A.search(sent)
    if m and n(m.group(1)) and (n(m.group(3)) or m.group(3) is None):
        per = n(m.group(3)) if m.group(3) else 1
        if per:
            return dict(kind="ratio", allow=n(m.group(1)),
                        allow_type=m.group(2).strip().lower(),
                        per=per, per_type=m.group(4).strip().lower())
    m = RATIO_B.search(sent)
    if m and n(m.group(1)) and n(m.group(3)):
        return dict(kind="ratio", allow=n(m.group(3)), allow_type="@section",
                    per=n(m.group(1)), per_type=m.group(2).strip().lower())
    if "must" in sent.lower():
        m = MAND_GE.search(sent)
        over = False
        if not m:
            m = MAND_GT.search(sent)
            over = True
        if m:
            # The guard is resolved only when tied to a section, because only
            # then is it known which section it is about. If the sentence speaks of
            # leading, no guard is needed at all.
            return dict(kind="mandatory_at",
                        points=int(m.group(1).replace(",", "")), over=over,
                        needs_guard=not bool(MAND_LEADS.search(sent)))
    m = SQD.search(sent)
    if m:
        return dict(kind="squadron", min=int(m.group(1)), max=int(m.group(2)))
    # CAP only last, and only if the sentence has NO ratio or points limit
    m = CAP.search(sent) or CAP2.search(sent)
    if m and n(m.group(1)) and not HAS_QUALIFIER.search(sent):
        return dict(kind="cap", max=n(m.group(1)), what=m.group(2).strip().lower())
    return None


def resolve_sections(phrase, sec_titles, own):
    """'cruisers or heavy cruisers' -> [section index, ...]. Empty = not resolved."""
    if phrase in ("@section", "vessel from this section", "vessel from the list below"):
        return [own]
    parts = re.split(r"\s+or\s+|\s+and\s+|,\s*", phrase)
    norm = [sing(t) for t in sec_titles]
    idx = []
    for p in parts:
        p = sing(p)
        if not p:
            continue
        # an exact hit first: 'cruiser' must NOT hit a 'battlecruiser' section
        hit = norm.index(p) if p in norm else None
        if hit is None and len(p) > 5:
            cand = [i for i, t in enumerate(norm) if t.endswith(" " + p) or t == p]
            hit = cand[0] if len(cand) == 1 else None
        if hit is None:
            return []
        if hit not in idx:
            idx.append(hit)
    return idx


# Detecting a sentence to let through. The second line was added on 7.9.2026:
# the original word list knew permissions and bans but not mechanical
# effects, so 72 valid sentences went unshown - the Mechanicus
# Gifts effects, the inquisitors' bonuses, the Ork Gubbins, the tyranids'
# refits and counting rules ("Warspheres do not count against cruiser
# limits"). The word "can" was added on 7.9.2026, but only together with a
# fleet-building verb - on its own it is as common in narrative as
# in rules ("battlefleets can vary massively").
# Sentences the sentence filter would drop but that must show: a row's
# own description ("+1 modifier on boarding") or a rule without a rule word.
# Each must hit at least once, or the run fails (item 8).
KEEP_TEXT = [
    # p.316: "gives the vessel a re-roll which may be used on itself, another
    # capital ship in the same squadron or an escort squadron within 15 cm" -
    # the sentence is also a 0-3 count rule, and without this it disappeared
    # from the commander card (spot check 7 row 76).
    dict(list_has="Eldar \u2014 Iyanden Craftworld", has="gives the vessel a re-roll"),

    dict(list_has="Orks \u2014 Cyclops Cluster", has="+1 modifier on boarding"),
    dict(list_has="Orks \u2014 Waaagh!", has="+1 modifier on boarding"),
]
def keep_text(name, title, sent):
    for fx in KEEP_TEXT:
        if fx["list_has"] in name and fx["has"] in sent and (
                not fx.get("sec") or fx["sec"].strip().lower() == title.strip().lower()):
            fx["_used"] = fx.get("_used", 0) + 1
            return True
    return False

RULEY = re.compile(r"\b(may|must|cannot|can not|no more|only|per|each|at least|up to|"
                   r"instead|counts? as|not be|never)\b"
                   r"|\bdo(?:es)?\s+not\s+count\b|\bcounts?\s+(?:toward|against)\b"
                   r"|\bno\s+restrictions?\b|\b(?:is|are)\s+reduced\b"
                   r"|\breduced\s+(?:to|by)\b|\badds?\s+\+?\d|\+\d+\s+to\s+\w"
                   # "increased by +1" is a rule just as "reduced by" is.
                   r"|\bincreased?\s+(?:by|to)\b"
                   # Three sentences in the whole book, all rules.
                   # The most important is the reading of tyranid pricing:
                   # "the points cost indicated provides you with one
                   # port weapon and one starboard weapon".
                   r"|\bpermitted\b|\bprovides?\s+you\s+with\b"
                   # The commanders' sentences (P1-8e): "Admirals get one Fleet
                   # Commander re-roll included in their points cost",
                   # "improves its Leadership to the value shown" - the number of
                   # re-rolls and the Ld are the commander card's content, not narrative.
                   r"|\bre-?rolls?\b|\bleadership\b"
                   # The book uses the word "can" in the same sense as
                   # "may". A bare \bcan\b would bring 45 sentences of which 17 are
                   # narrative ("battlefleets can vary massively"), so
                   # a fleet-building verb is also required: this way there
                   # are 28 sentences and three narrative ones. Among them e.g.
                   # "Any race can be used to provide auxiliary vessels
                   # except Orks, Dark Eldar, Necrons and Tyranids" and
                   # the ORDNANCE sentence of every Chaos list.
                   r"|\bcan\s+(?:also\s+|only\s+|still\s+|now\s+|not\s+)?"
                   r"(?:be\s+)?(?:include|take|taken|takes|use|used|uses|"
                   r"have|has|purchase|purchased|choose|chosen|select|"
                   r"selected|replace|replaced|replaces|carry|carried|add|"
                   r"added|upgrade|upgraded|equip|equipped|field|fielded|"
                   r"act|acts|double|assign|assigned|combine|combined|"
                   r"buy|bought)\b"
                   # "gains a +1 bonus" is the same rule as "gains +1".
                   r"|\bgains?\s+(?:an?\s+)?\+?\d"
                   r"|\breceives?\s+(?:one|two|an?|\+?\d)|\bignores?\b"
                   # A sentence that names a points price is always a rule: it says
                   # what something costs. Without this 32 sentences went unshown,
                   # e.g. "+35 points for its Space Marine crew",
                   # "A second re-roll can be purchased for +25 points" and
                   # the tyranid bio-refit descriptions with their prices.
                   r"|[+-]?\d[\d,]*\s*(?:pts|points)\b"
                   # A ban and an exception are rule language just as a permission is.
                   # These bring 74 sentences, of which about ten are
                   # narrative - an accepted trade-off, because among them are
                   # e.g. every faction's attack rating, the Necrons'
                   # reactive hull exceptions and the tyranids' deviating
                   # critical hits, which were missing entirely.
                   r"|\bdo(?:es)?\s+not\b|\bdon'?t\b"
                   r"|\bwill\s+(?:not|never|always)\b"
                   # The book writes attack rating in three ways:
                   # "attack rating", "attack (initiative) rating" and
                   # "attack or initiative rating". A minus
                   # modifier is as mechanical as a plus.
                   r"|\battack\s+(?:\S+\s+){0,2}rating\b"
                   r"|[+-]\d+\s+(?:leadership|ld)\b|leadership\s+modifier"
                   # A distance and a die are as mechanical as a price: a sentence
                   # that says "15 cm" or "roll a D6" is a rule. These
                   # brought 74 sentences, practically all valid -
                   # the attack craft speed tables, Slaanesh's -2
                   # leadership within 15 cm, the craftworlds'
                   # gravity wells, the Daemonship's placement.
                   r"|\d+\s*cm\b|\b\d?D[36]\b", re.I)


# --- a pick finer than a section ---------------------------------------------
# resolve_sections works only at section precision, and that is almost always enough.
# Bastion Fleets, however, prints battleships, battlecruisers and grand
# cruisers under the same heading, so "one battleship for every three
# cruisers" counted the whole section: two grand cruisers were read
# as two battleships and a legal fleet was marked illegal.
#
# The pick narrows the section by the ship's name. These are hand-written
# exceptions and not conclusions of the parser: the parser
# should stay strict, so that an uncertain sentence stays text and does not turn
# into a wrong check. Each entry must hit exactly once, which is
# checked at the end of the run.
# Spot check 18 (a book inventory): the large ships of the Chaos lists and the p.290 sentences.
_CHAOS_CAP = [dict(sec="Planet Killer"), dict(sec="Chaos Space Hulk"), dict(sec="Battleships"),
              dict(sec="Grand Cruisers"), dict(sec="Heavy Cruisers"), dict(sec="Cruisers")]
_CHAOS_HULK_LISTS = (("Chaos \u2014 Incursion", False), ("Chaos \u2014 Black Crusade", True),
                     ("Chaos \u2014 Tzeentch", True), ("Chaos \u2014 Nurgle", True),
                     ("Chaos \u2014 Khorne", True), ("Chaos \u2014 Slaanesh", True))
_HULK_WITH = ("It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone "
              "Fortress or ships that must be used as flagships such as the Terminus Est.")
_HULK_BS = "A Chaos fleet including a Space Hulk may have no more than two other battleships."

RULE_PICKS = [
    # Only battleships in the numerator. Cruisers AND
    # battlecruisers in the denominator, as the sentence says; grand cruisers are left out,
    # which the book states separately in the next sentence.
    # The sentence does not parse by machine, because Bastion Fleets has no
    # Battlecruisers section of its own: all three types are under the heading
    # "Battleships". resolve_sections therefore does not find the denominator's
    # other half, and the sentence stays text. The rule is built here.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battleship in your fleet for every three cruisers",
         src="You may include up to one battleship in your fleet for every "
             "three cruisers or battlecruisers.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=3, per_type="cruisers or battlecruisers",
                   allow_pick=[dict(sec="Battleships", re="battleship")],
                   per_pick=[dict(sec="Cruisers"),
                             dict(sec="Battleships", re="battlecruiser")])),
    # The other half of the same section. This stayed text, because in the book
    # the subheading is stuck to the start of the sentence and so the sentence did not parse.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battlecruiser or grand cruiser in your fleet "
                   "for every two cruisers",
         src="You may include up to one battlecruiser or grand cruiser "
             "in your fleet for every two cruisers.",
         rule=dict(kind="ratio", allow=1,
                   allow_type="battlecruiser or grand cruiser",
                   # The section heading is "Battleships", which is the wrong heading
                   # for this rule. The book's own subheading is right.
                   label="Battlecruisers & Grand Cruisers",
                   per=2, per_type="cruisers",
                   allow_pick=[dict(sec="Battleships",
                                    re="battlecruiser|grand cruiser")],
                   per_pick=[dict(sec="Cruisers")])),

    # Chaos Incursion is the only list where the commander is required without
    # a points limit. The book's sentence rules out the limit explicitly ("even if it
    # is worth 750 points or less"), so the general patterns cannot
    # recognise it. A points limit of 0 means "always".
    # --- Demiurg ---------------------------------------------------------
    dict(list_has="Demiurg", sec="Battleships",
         from_text="one battleship for every two cruiser-class vessels",
         src="Your fleet may include one battleship for every two "
             "cruiser-class vessels in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=2, per_type="cruiser-class vessels",
                   allow_pick=[dict(sec="Battleships")],
                   per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Demiurg", sec="Kroot Vessels",
         from_text="one Kroot Warsphere in the fleet for every 750 points",
         src="The fleet may have one Kroot Warsphere in the fleet for every "
             "750 points in the fleet or portion thereof.",
         rule=dict(kind="per_points", each=1, per=750,
                   what="Kroot Warsphere",
                   pick=[dict(sec="Kroot Vessels")])),

    # --- Chaos: the named battleships (fleet spot check 10.9.) --------------
    # Abaddon: v0.40 removed his Black Crusade section; races.py (J162) builds
    # his section from his own page (p.241).
    # p.247, 249, 251, 253: "A fleet 1,000 points or more may include the X
    # as one of its battleships, subject to normal restrictions." The sentence stayed
    # text on all four lists (the Planet Killer's equivalent was already
    # a rule).
    dict(list_has="Chaos — Tzeentch", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Scion of Prospero",
         src="A fleet 1,000 points or more may include the Scion of Prospero as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Scion of Prospero",
                   pick=[dict(sec="Battleships", re="^scion of prospero")])),
    dict(list_has="Chaos — Nurgle", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Terminus Est",
         src="A fleet 1,000 points or more may include the Terminus Est as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Terminus Est",
                   pick=[dict(sec="Battleships", re="^terminus est")])),
    dict(list_has="Chaos — Khorne", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Slaverer",
         src="A fleet 1,000 points or more may include the Slaverer as one of its "
             "battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Slaverer",
                   pick=[dict(sec="Battleships", re="^slaverer")])),
    dict(list_has="Chaos — Slaanesh", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Wage of Sin",
         src="A fleet 1,000 points or more may include the Wage of Sin as one of "
             "its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Wage of Sin",
                   pick=[dict(sec="Battleships", re="^wage of sin")])),

    # --- Squadrons (fleet spot check S2 10.9.) ------------------------------
    # p.455 "Defenders are fielded in squadrons of 2–6 ships." The rule is in
    # the SQUADRONS section, which has no ship at all, so it measured
    # nothing. pick names the class: Messengers may act alone.
    dict(list_has="Tau — Merchant Fleet", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    dict(list_has="Tau — Commerce Protection", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    # p.184 "A single squadron of 2-6 Rogue Trader escorts and auxiliary
    # vessels may accompany each Rogue Trader capital ship in a fleet, in any
    # mix desired. Separately, ... cargo ships ... these squadrons can only
    # contain cargo ships". The size is the parser's squadron rule; the number per
    # ship is added as a ratio. Nate Montes: the Siluria "as a cruiser",
    # the Havoc "an escort". It counts SQUADRONS (units, the list's explicit
    # escort squadrons, esq): one per capital ship. It counted six escorts per
    # ship, so one cruiser with two squadrons of three was green (27.10.2026).
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="ESCORTS",
         match_src="A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship",
         add=[dict(kind="ratio", allow=1, per=1, units=True, label="Rogue Trader escort squadrons per capital ship",
                   allow_type="squadron of Rogue Trader escorts and auxiliary vessels",
                   per_type="Rogue Trader capital ships",
                   allow_pick=[dict(sec="ESCORTS", re="^(?!armed cargo)"),
                               dict(sec="NOTES FROM NATE MONTES", re="^havoc")],
                   per_pick=[dict(sec="CAPITAL SHIPS"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])]),

    # --- Eldar Hero and Prince Yriel (fleet spot check S5 10.9.) -----------
    # p.314/315: "Your fleet may be led by an Eldar Hero, in place of its
    # normal fleet commander." The Hero fills the required Pirate Prince and is not
    # beside him (the same model as Abaddon p.244).
    # Each Corsair list as its own row: every fix hits exactly once.
    *[dict(list_has=nm, sec="Eldar Hero",
           from_text="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander",
           keep_text=True,
           src="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander.",
           rule=dict(kind="cap", max=1, label="Fleet commander (Pirate Prince or Eldar Hero)",
                     pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    *[dict(list_has=nm, sec="Pirate Prince",
           match_src="If the fleet is worth over 750 points a Pirate Prince must be included",
           set=dict(pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    # p.316 the same Hero sentence in Iyanden: the Hero fills the required
    # Autarch. Prince Yriel (p.313) is added to both in profile_types.py (J161).
    dict(list_has="Iyanden", sec="Autarch",
         match_src="If the fleet is worth over 750 points, an Autarch must be included",
         set=dict(pick=[dict(sec="Autarch"), dict(sec="Eldar Hero")])),

    # --- Tau -------------------------------------------------------------
    # Four rules that name a SHIP CLASS where the engine
    # expects a section heading. All four therefore stayed plain
    # text, although they are among the lists' most central limits.
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Cruisers",
         from_text="one Hero class starship for every Merchant or Explorer",
         src="It may also include up to one Hero class starship for every "
             "Merchant or Explorer in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Hero class starship",
                   per=1, per_type="Merchants or Explorers",
                   label="Hero class starships",
                   allow_pick=[dict(sec="Cruisers", re="^hero")],
                   per_pick=[dict(sec="Cruisers", re="^merchant"),
                             dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Battleships",
         from_text="it must include at least one Explorer",
         # The book reads 'your fleets', and it is left so:
         # the sentence shown is the book's own.
         src="If your fleets is worth more than 750 pts it must include at "
             "least one Explorer.",
         rule=dict(kind="mandatory_at", points=750, over=True,
                   label="Explorer class starships",
                   pick=[dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    # p.369 (spot check 19, J47): "Each Ork hulk must be assigned an Ork Warlord
    # to command it." Each hulk needs its own Warlord: at least as many Warlords
    # as hulks. Tying a ship to a commander is not modelled
    # (J8), but the count does not need it.
    dict(list_has="Orks \u2014 Waaagh!", sec="SPACE HULKS",
         from_text="Each Ork hulk must be assigned an Ork Warlord",
         src="Each Ork hulk must be assigned an Ork Warlord to command it.",
         keep_text=True,
         rule=dict(kind="compare", op=">=", label="Warlords for Ork hulks (one each)",
                   a_pick=[dict(sec="WARLORD")], b_pick=[dict(sec="SPACE HULKS")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),

    # The tyranid skwadron sizes. The book writes them in their own
    # SQUADRONS section, which has no ship at all, so tied to its own
    # section the rule would measure nothing. Also the book
    # writes the range as words ("6 to 12"), not with a dash, which the pattern
    # alone expects.
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="SQUADRONS",
         from_text="squadrons of 6 to 12 models",
         src="Vanguard drone ships and Kraken may be deployed in squadrons "
             "of 6 to 12 models. You may combine the two types in a single "
             "squadron if you wish.",
         rule=dict(kind="squadron", min=6, max=12,
                   secs=["VANGUARD DRONE SHIPS", "KRAKEN"])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="SQUADRONS",
         from_text="squadrons of 1 to 12 vessels",
         src="Tyranid Escorts come as squadrons of 1 to 12 vessels, while "
             "all other types are individuals and may not deploy in "
             "squadrons.",
         rule=dict(kind="squadron", min=1, max=12, secs=["ESCORTS"])),
    # The Necron tombship ratio. The machine cannot parse this, because
    # the denominator is a SHIP's name and not a section heading: the section is "Cruisers"
    # and it has both the Scythe and the Shroud class, so "for every
    # Scythe class harvest ship" matches no section. Also the sentence
    # ends with the words "it contains", which a lazy type group would swallow
    # into the name. The rule is built here, as for Bastion Fleets.
    dict(list_has="Necrons", sec="Tombships",
         from_text="one tombship for every Scythe class harvest ship",
         src="Your fleet may include up to one tombship for every Scythe "
             "class harvest ship it contains.",
         rule=dict(kind="ratio", allow=1, allow_type="tombship",
                   per=1, per_type="Scythe class harvest ships",
                   allow_pick=[dict(sec="Tombships")],
                   per_pick=[dict(sec="Cruisers", re="scythe")])),
    dict(list_has="Chaos \u2014 Incursion", sec="FLEET COMMANDER",
         from_text="You must include a Chaos Warmaster in your fleet",
         src="You must include a Chaos Warmaster in your fleet, even if it "
             "is worth 750 points or less.",
         rule=dict(kind="mandatory_at", points=0, over=False)),
    # ================= item 8 (9.9.2026): rules read from the book that ==========
    # the parser does not recognise but the engine can now enforce. Every
    # sentence is in reference/NN_*.json with the status enforced and a page.
    # --- a permission tied to a points limit (allowed_at) ---
    dict(list_has="Black Crusade", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Tzeentch", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Nurgle", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Khorne", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Slaanesh", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Fortress-Monastery",
         from_text="worth at least 2,000 points, it may include one Fortress-Monastery",
         src="If your fleet is worth at least 2,000 points, it may include one Fortress-Monastery.",
         rule=dict(kind="allowed_at", points=2000, label="Fortress-Monastery", pick=[dict(sec="Fortress-Monastery")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Emperor's Inquisition", sec="Inquisitor Lord",
         from_text="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord",
         src="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord.",
         rule=dict(kind="allowed_at", points=750, label="Inquisitor Lord", pick=[dict(sec="Inquisitor Lord")])),
    dict(list_has="Bakka Sector", sec="Admiral",
         from_text="Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath",
         src="An Imperial Bakka Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath, who must always be placed on a battleship, though it not necessarily be the most expensive one present.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1500, label="Lord Admiral Rath", pick=[dict(sec="Admiral", re="rath")])),
    # v0.40 p.154: the Battle barge row is followed by its condition. The
    # Ordo Malleus Inquisitor Lord is now a row of the 0-1 Inquisitor Lord
    # section (an alternative to the Ld 9 Lord, not a +100 pts add-on).
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="Can only be included, if the rest of the fleet is at least worth 1000 points",
         src="Can only be included, if the rest of the fleet is at least worth 1000 points and an Ordo Malleus Inquisitor Lord leads the fleet.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, basis="remainder", label="Grey Knights Battle barge",
                   pick=[dict(sec="CAPITAL SHIPS", re="battlebarge|battle barge")],
                   cond_pick=[dict(sec="Inquisitor Lord", re="ordo malleus")], cond_min=1)),
    # v0.40 p.154: the commander is required in FLEET COMMANDER, but the
    # rows are in the next section, 0-1 Inquisitor Lord.
    dict(list_has="Grey Knights", sec="FLEET COMMANDER",
         match_src="you must include a Fleet Commander to lead the fleet",
         set=dict(label="Inquisitor Lord", pick=[dict(sec="Inquisitor Lord")])),
    # --- a count tied to a points limit for one row (per_points + pick) ---
    dict(list_has="Space Marines \u2014 Codex", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Armageddon Sector", sec="RESERVES",
         from_text="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points",
         src="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points (or portion thereof) in the fleet.",
         rule=dict(kind="per_points", each=2, per=500, what="Endurance and Defiant class light cruisers", label="Endurance & Defiant light cruisers", pick=[dict(sec="Cruisers", re="endurance|defiant")])),
    dict(list_has="Emperor's Inquisition", sec="CAPITAL SHIPS",
         from_text="up to one Grey Knights Strike Cruiser may be taken for every 500 points",
         src="If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                   cond_pick=[dict(sec="Inquisitor Lord")], cond_min=1)),
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="For every 500 points of the fleet, or part thereof, one Grey Knights Strike Cruiser may be included",
         src="For every 500 points of the fleet, or part thereof, one Grey Knights Strike Cruiser may be included in the fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")])),
    dict(list_has="Pirates and Wolf Packs", sec="Pirate Captains",
         from_text="A Pirate Captain may be embarked on a cruiser for every 500 points",
         src="A Pirate Captain may be embarked on a cruiser for every 500 points or portion thereof in a fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Pirate Captain", label="Pirate Captains", pick=[dict(sec="Pirate Captains")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Battleships",
         from_text="up to one Custodian per FULL 750 points of Tau vessels",
         src="Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. Allied vessels don't count toward this total.",
         keep_text=True,
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Custodian", label="Custodian class starships",
                   pick=[dict(sec="Battleships", re="custodian")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Rogue Traders",
         from_text="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships",
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet.",
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Rogue Trader cruiser", label="Rogue Trader cruisers",
                   pick=[dict(sec="Rogue Traders", re="rogue trader cruiser|dauntless|endeavour")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    # --- comparing two groups (compare) ---
    dict(list_has="Bastion Fleets", sec="ORDNANCE",
         from_text="combined numbers of Endurance and Defiant class vessels may not exceed",
         src="The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels may not exceed the number of Endeavour class light cruisers in the fleet.",
         keep_text=True,
         rule=dict(kind="compare", op="<=", label="Endurance & Defiant vs Endeavour",
                   a_pick=[dict(sec="Cruisers", re="endurance|defiant")], b_pick=[dict(sec="Cruisers", re="endeavour")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="There cannot be more Stronghold than Bastion vessels",
         src="There cannot be more Stronghold than Bastion vessels in the fleet.",
         rule=dict(kind="compare", op="<=", label="Stronghold vs Bastion",
                   a_pick=[dict(sec="Demiurg Vessels", re="stronghold")], b_pick=[dict(sec="Demiurg Vessels", re="bastion")])),
    dict(list_has="Demiurg", sec="Cruisers",
         from_text="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined",
         src="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined.",
         rule=dict(kind="compare", op=">", label="Demiurg Commerce Vessels vs other cruisers",
                   a_pick=[dict(sec="Cruisers", re="bastion|citadel")], b_pick=[dict(sec="Cruisers", re="^(?!bastion|citadel)")])),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="CAPITAL SHIPS",
         from_text="at least half of which must be Rogue Trader Cruisers",
         src="Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, following the basic profile for this ship.",
         keep_text=True,
         rules=[dict(kind="cap", max=12, what="capital ships", label="Capital ships (incl. Demiurg)",
                     pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")]),
                dict(kind="compare", op=">=", a_mult=2, label="Rogue Trader cruisers & Endeavours: at least half",
                     a_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser|endeavour")],
                     b_pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")])]),
    # --- a minimum ratio (min_ratio) ---
    dict(list_has="Dark Eldar", sec="ESCORTS",
         from_text="must contain at least three escorts for every capital ship",
         src="However, Dark Eldar fleets must contain at least three escorts for every capital ship taken.",
         rule=dict(kind="min_ratio", min=3, label="Escorts per capital ship",
                   allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="Cruisers")])),
    # v0.40 p.431: the six escort drones (next rule) plus "between 0 and 12
    # additional escort class ships (of any kind) for each hive ship" - at
    # most 18 per hive ship, as p.430 says ("purchase 6-18 escort ships").
    # v0.36 said "between 6 and 12 escort class ships".
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="between 0 and 12 additional escort class ships",
         src="You may include between 0 and 12 additional escort class ships (of any kind) for each hive ship.",
         rules=[dict(kind="ratio", allow=18, allow_type="escort class ships", per=1, per_type="hive ship",
                     label="Escorts per hive ship (six escort drones + up to 12 more)",
                     allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="HIVE SHIPS")])]),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="at least six escort drones for every hive ship",
         src="The fleet must have at least six escort drones for every hive ship in the fleet.",
         keep_text=True,
         rule=dict(kind="min_ratio", min=6, label="Escort drones per hive ship",
                   allow_pick=[dict(sec="ESCORTS", re="escort drone")], per_pick=[dict(sec="HIVE SHIPS")])),
    # --- conditional limits ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="If no hive ships are chosen, only Kraken and Vanguard drone ships",
         src="If no hive ships are chosen, only Kraken and Vanguard drone ships may be included in the fleet.",
         rule=dict(kind="conditional_cap", label="Without a hive ship: only Kraken & Vanguard",
                   pick=[dict(sec="ESCORTS", re="^(?!kraken|vanguard)"), dict(sec="CAPITAL SHIPS")],
                   cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1, max_unmet=0, max_met=None)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Kroot",
         from_text="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers",
         src="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers in the fleet.",
         rule=dict(kind="conditional_cap", label="Kroot Warsphere",
                   pick=[dict(sec="The Kroot")], cond_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")], cond_min=3,
                   max_unmet=0, max_met=1)),
    dict(list_has="Da Ork Clanz", sec="Space Hulks",
         from_text="An Ork fleet with at least three Warlords may include one Space Hulk",
         src="An Ork fleet with at least three Warlords may include one Space Hulk.",
         rule=dict(kind="conditional_cap", label="Space Hulk",
                   pick=[dict(sec="Space Hulks")], cond_pick=[dict(sec="WARLORD")], cond_min=3, max_unmet=0, max_met=1)),
    # --- Spot check 18 (a book inventory) blocks CH and IN -------------------
    # J24 p.249/251/253: the Daemonship share on the god lists. The base is all large
    # ships; those listed in brackets (the named barge, for Khorne the battleships)
    # cannot take the upgrade, and that is already in the rows' conditions. Tying to
    # the flagship is not modelled (J8).
    *[dict(list_has=nm, sec="DAEMONSHIPS", from_text=ft, keep_text=True, src=src,
           rule=dict(kind="upgrade_ratio", per=per, allow=1, label=lab, up_sec="DAEMONSHIPS",
                     up_re="^daemonship", per_pick=_CHAOS_CAP))
      for nm, ft, src, per, lab in (
          ("Chaos \u2014 Nurgle", "Up to a third of the capital ships",
           "Up to a third of the capital ships (not the Terminus Est or flagship) in a Plaguefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           3, "Daemonships (up to a third of the capital ships)"),
          ("Chaos \u2014 Khorne", "Up to a quarter of the capital ships",
           "Up to a quarter of the capital ships (not battleships or the flagship) in a Berzerker Fleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           4, "Daemonships (up to a quarter of the capital ships)"),
          ("Chaos \u2014 Slaanesh", "Up to half of the capital ships",
           "Up to half of the capital ships (not the Wage of Sin or the flagship) in a Pleasurefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           2, "Daemonships (up to half of the capital ships)"))],
    # J25 p.245: "The Planet Killer also counts as a battleship when working
    # out how many heavy cruisers and cruisers the fleet requires." J26 p.290:
    # Space Hulk "counts as a battleship for purposes of taking another so in
    # order to take a second battleship, the fleet must already have six
    # cruisers" - but "there is no minimum point requirement or ship
    # prerequisite for fielding a Chaos Space Hulk" (at_least).
    *[dict(list_has=nm, sec="Battleships",
           match_src="You may include up to one battleship in your fleet for every three cruisers or heavy cruisers",
           set=dict(allow_pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else [])
                    + [dict(sec="Chaos Space Hulk")],
                    at_least=dict(cond_pick=[dict(sec="Chaos Space Hulk")], count=1)))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J26 p.290: exclusions and at most two other battleships. The list
    # says only "See it's profile for restrictions"; the rule is in the profile.
    *[dict(list_has=nm, sec="Chaos Space Hulk", match_src="You may include up to one Space Hulk in the fleet",
           add=[dict(kind="conditional_cap", label="Chaos Space Hulk: not with the Planet Killer or a mandatory flagship",
                     pick=[dict(sec="Chaos Space Hulk")],
                     cond_pick=([dict(sec="Planet Killer")] if pk else [])
                     + [dict(sec="Battleships", re="^(terminus est|wage of sin|scion of prospero)")],
                     cond_min=1, max_unmet=None, max_met=0, src=_HULK_WITH)]
               # J52 p.251: "Bezerker Fleets led by a Space Hulk may have more than two
               # battleships, but other restrictions remain unchanged."
               + ([] if "Khorne" in nm else [
                   dict(kind="conditional_cap", label="Battleships with a Chaos Space Hulk",
                        pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else []),
                        cond_pick=[dict(sec="Chaos Space Hulk")], cond_min=1, max_unmet=None, max_met=2,
                        src=_HULK_BS)]))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J27 p.49: "An Emperor class battleship can only be taken as reserves
    # unless Admiral Rath leads the fleet." p.50: "one reserve battleship for
    # every three Bakka battleships in the fleet"; "one reserve cruiser,
    # battlecruiser or grand cruiser for every three Bakka cruisers". p.14:
    # "Reserves are still subject to the restrictions on minimum and maximum
    # numbers of certain types of vessels" -> the Jovian into the battlecruiser ratio.
    dict(list_has="Bakka", sec="Battleships",
         from_text="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads",
         src="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads the fleet.",
         rule=dict(kind="requires", label="Emperor class battleship as reserve (three Bakka battleships or Rath)",
                   if_pick=[dict(sec="Battleships", re="^emperor")],
                   then_pick=[dict(sec="Battleships", re="^(?!emperor)")], min=3,
                   unless_pick=[dict(sec="Admiral", re="rath")])),
    dict(list_has="Bakka", sec="RESERVES",
         from_text="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser",
         keep_text=True,
         src="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser, battlecruiser "
             "or grand cruiser for every three Bakka cruisers in the fleet, one reserve battleship for every three "
             "Bakka battleships in the fleet, etc.",
         rule=dict(kind="ratio", allow=1, per=3, label="Reserve cruisers, battlecruisers and grand cruisers",
                   allow_pick=[dict(sec="RESERVES")], per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Bakka", sec="Battlecruisers",
         match_src="You may include up to one battlecruiser in your fleet for every two cruisers",
         set=dict(allow_pick=[dict(sec="Battlecruisers"), dict(sec="RESERVES", re="jovian")])),
    # J28 p.161: "Up to half of the Grey Knights strike cruisers in a fleet
    # may replace their launch bays with one of the refits listed below, in
    # any mix desired." The sentence is in the profile; the rule goes beside the list's GK row.
    *[dict(list_has=nm, sec="CAPITAL SHIPS", match_src=ms,
           add=[dict(kind="option_ratio", per=2, allow=1,
                     label="Grey Knights strike cruisers with launch bays replaced (up to half)",
                     pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                     opt_re="replace (its )?launch bays",
                     src="Up to half of the Grey Knights strike cruisers in a fleet may replace their launch "
                         "bays with one of the refits listed below, in any mix desired.")])
      for nm, ms in (("Grey Knights", "one Grey Knights Strike Cruiser may be included in the fleet"),
                     ("The Emperor's Inquisition", "up to one Grey Knights Strike Cruiser may be taken"))],
    # J32 p.375: "However, no more than one of each of the named Ork
    # battleships may be in the fleet, no more than one 'Uge ship may be taken
    # in the fleet for every two kroozers, and a Space Hulk may only be taken
    # by a fleet of no less than 1500 points." The limit of the named ones (0-1) is already in
    # the rows' mx; the sentence stays visible (keep_text).
    dict(list_has="Da Ork Clanz", sec="USING SKWADRONS",
         from_text="no more than one \u2018Uge ship may be taken in the fleet for every two kroozers",
         keep_text=True,
         src="However, no more than one of each of the named Ork battleships may be in the fleet, no more than "
             "one \u2018Uge ship may be taken in the fleet for every two kroozers, and a Space Hulk may only be "
             "taken by a fleet of no less than 1500 points.",
         rules=[dict(kind="ratio", allow=1, per=2, label="'Uge ships (one per two kroozers)",
                     allow_pick=[dict(sec="\u2018Uge ship skwadron")], per_pick=[dict(sec="Big ship skwadron")]),
                dict(kind="allowed_at", points=1500, over=False, label="Space Hulk (1,500 pts or more)",
                     pick=[dict(sec="Space Hulks")])]),
    # p.184: "If a fleet has more than one Rogue Trader cruiser or also
    # includes more than one squadron of transports, a Veteran Rogue Trader
    # must be assigned to a Rogue Trader cruiser." The Siluria counts "as a
    # cruiser" (Nate Montes, p.184); the transport squadrons are Heavy Transports and
    # cargo ships ("any number of cargo ships of any type (whether or not the
    # scenario requires transports)"). Spot check 18 (J23).
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="If a fleet has more than one Rogue Trader cruiser",
         src="If a fleet has more than one Rogue Trader cruiser or also includes more than one squadron of transports, a Veteran Rogue Trader must be assigned to a Rogue Trader cruiser.",
         rules=[dict(kind="requires", label="Veteran Rogue Trader required (two or more Rogue Trader cruisers)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"), dict(sec="NOTES FROM NATE MONTES", re="^siluria")],
                     if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1),
                dict(kind="requires", label="Veteran Rogue Trader required (two or more transport squadrons)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="transport"), dict(sec="ESCORTS", re="cargo")],
                     if_units=True, if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1)]),
    # J213 p.184: "A Veteran Rogue Trader may lead each Rogue Trader cruiser in
    # a fleet." The section heading cap (2) let two Veterans through for one
    # cruiser (docs/check-yourself S0345). Cruisers as above:
    # the cruisers of the CAPITAL SHIPS section and the Siluria "as a cruiser".
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may lead each Rogue Trader cruiser",
         src="A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.",
         keep_text=True,
         rule=dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=1,
                   per_type="Rogue Trader cruisers", label="Veteran Rogue Traders (one per Rogue Trader cruiser)",
                   allow_pick=[dict(sec="Veteran Rogue Traders")],
                   per_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Commander",
         from_text="If the fleet includes a Custodian, a Kor",
         src="If the fleet includes a Custodian, a Kor\u2019O must lead it.",
         rule=dict(kind="requires", label="Custodian needs a Kor\u2019O",
                   if_pick=[dict(sec="Battleships", re="custodian")], then_pick=[dict(sec="Commander", re="kor.o\\b|kor.o.mesme")], min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="The fleet must include at least one squadron of escort-sized cargo ships",
         src="The fleet must include at least one squadron of escort-sized cargo ships of any type (whether or not the scenario requires transports), in a squadron of 2 to 6 ships.",
         keep_text=True,
         rule=dict(kind="mandatory_at", points=0, over=False, label="Cargo ship squadron",
                   pick=[dict(sec="TRANSPORTS", re="cargo|freighter|q-ship|escort carrier"), dict(sec="ESCORTS", re="cargo vessel")])),
    # --- pisteosuudet ---
    dict(list_has="Pirates and Wolf Packs", sec="BRIGANDS",
         from_text="Up to 10% of a pirate fleet may be made up of alien escorts",
         src="Up to 10% of a pirate fleet may be made up of alien escorts from any race except Tyranids, Necrons or vessels that require support from a capital ship of their race.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="total", label="Alien escorts (10 % of the fleet)",
                   pick=[dict(sec="ESCORTS", re="xenos")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ORDNANCE",
         from_text="Up to 10 % of the fleet",
         src="Up to 10 % of the fleet\u2019s points allowance may be spent on Ordnance markers as long as at least one hive ship is chosen.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="limit", label="Ordnance markers (10 % of the allowance)",
                   pick=[dict(sec="ORDNANCE")], cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="No more than 1/3 of the fleet",
         src="No more than 1/3 of the fleet\u2019s total transport value can be made up of heavy transports.",
         keep_text=True,
         rule=dict(kind="points_share", frac=0.3334, of="pick", label="Heavy transports (1/3 of transport value)",
                   pick=[dict(sec="TRANSPORTS", re="heavy transport")], of_pick=[dict(sec="TRANSPORTS")])),
    # --- a tiered limit ---
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    # --- upgrades in proportion to ships ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship",
         src="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet.",
         rule=dict(kind="upgrade_ratio", per=1, allow=1, label="Hive Mind Influence re-rolls",
                   up_sec="FLEET COMMANDER", up_re="hive mind influence", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Imperative can be purchased per two hive ships",
         src="A maximum of one Hive Mind Imperative can be purchased per two hive ships in the fleet, though a single Hive Mind Imperative may be purchased as long as the fleet contains at least one hive ship.",
         rule=dict(kind="upgrade_ratio", per=2, allow=1, min_one=True, label="Hive Mind Imperatives",
                   up_sec="FLEET COMMANDER", up_re="hive mind imperative", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET RULES (pg. 423\u2013428)", late=True, keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rules=[dict(kind="unit_upgrade_max", max=3, label="Refits per hive ship", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="HIVE SHIPS")]),
                dict(kind="unit_upgrade_max", max=2, label="Refits per cruiser", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="CAPITAL SHIPS")]),
                dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="ESCORTS")])]),
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="FLEET RULES (pg. 423\u2013428)", keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rule=dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS",
                   unit_pick=[dict(sec="VANGUARD DRONE SHIPS"), dict(sec="KRAKEN")])),
    # --- ratios the parser does not recognise ---
    dict(list_has="Rogue Traders \u2014 Exploration", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers",
         src="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. At least one Veteran Rogue Trader must be assigned to a Rogue Trader cruiser in the fleet.",
         keep_text=True,
         rules=[dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=2, per_type="Rogue Trader cruisers", min_one=True, label="Veteran Rogue Traders",
                     allow_pick=[dict(sec="Veteran Rogue Traders")], per_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")]),
                dict(kind="mandatory_at", points=0, over=False, label="Veteran Rogue Trader", pick=[dict(sec="Veteran Rogue Traders")])]),
    dict(list_has="Demiurg", sec="ESCORTS",
         from_text="For every three Demiurg capital ships in the fleet, it may include one squadron",
         src="For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts.",
         rule=dict(kind="ratio", allow=1, allow_type="squadron of Tau or Rogue Trader escorts", per=3, per_type="Demiurg capital ships", units=True, label="Tau & Rogue Trader escort squadrons",
                   allow_pick=[dict(sec="Tau Escorts"), dict(sec="Rogue Trader Escorts")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers", re="bastion|citadel")])),
    # Iyanden: the Autarch's Dragonship flagship does not count towards the ratio.
    dict(list_has="Iyanden", sec="Dragonships",
         match_src='Your fleet may include up to one Dragonship for every two Wr', set=dict(exempt=dict(cond_pick=[dict(sec="Autarch", re="autarch")], cond_min=1, count=1))),
]


def pick_secs(picks, sec_titles, where):
    """[{sec:'Cruisers', re:'...'}] -> [{sec:3, re:'...'}]."""
    out = []
    for p in picks:
        want = p["sec"].strip().lower()
        hit = [i for i, t in enumerate(sec_titles) if t.strip().lower() == want]
        assert len(hit) == 1, ("%s: section %r not found exactly once, "
                               "sections: %s" % (where, p["sec"], sec_titles))
        # The requested section name is kept for the guard: the section index may
        # move later, and a wrong but existing index does not
        # show anywhere.
        q = dict(sec=hit[0], _t=p["sec"].strip().lower())
        if p.get("re"):
            q["re"] = p["re"]
        out.append(q)
    return out


# --- cleaning the text to show ------------------------------------------
# Three separate defects, all from the same cause: the FLEET RULES
# block picks a whole page range from the book, and among the rules there
# is also narrative and price tables.
#
# A sentence-level filter is NOT made. I tried it: the words "only" and "never"
# tell narrative from rules badly, and most of the 326 candidates
# were genuine rules - Warp Translation, the necrons' critical hits,
# the tyranids' refits. A wrong drop is worse than a visible needless sentence,
# so only what can be established for certain is weeded out.

# 1) Wholly narrative sections. These are read sentence by sentence.
#    Each must hit exactly once, or the run fails.
LORE_SECTIONS = [
    # Bakka's "FLEET RULES (pg. 42-47)" no longer exists: those pages
    # belong to Armageddon's page range, and rules_pages no longer picks
    # the previous list's pages. The same narrative is now removed from Armageddon's
    # own sections below.
    dict(list_has="Emperor's Inquisition", sec="FLEET RULES (pg. 142–147)"),
    dict(list_has="Rogue Traders", sec="FLEET RULES (pg. 178–183)"),
    dict(list_has="Armageddon Sector", sec="THE FIRST TYRANNIC WAR"),
    dict(list_has="Armageddon Sector", sec="LORD ADMIRAL ZACCARIUS RATH"),
    dict(list_has="Armageddon Sector", sec="THE FORGE WORLD OF BAKKA"),
    dict(list_has="Armageddon Sector", sec="SEGMENTUM TEMPESTUS"),
    dict(list_has="Dominion", sec="SPACE MARINE DOMINION FLEETS"),
]

# 1b) Sections that do not belong to this list at all.
#
#     The book's pages 370-373 are the ORK CLANZ rules. They fall in
#     the Waaagh! list's page range (366-371) only because the Clanz list
#     starts on page 374. Page 370 says so directly:
#     "The Ork Clanz rules can be used in addition to the normal Ork
#     rules, but only with its dedicated Clanz fleet list."
#     Without this removal the Waaagh! list offered 14 Gubbins upgrades and
#     six clan benefits the book does not allow on that list.
#
#     The removal runs only AFTER upgrades.annotate, because
#     the Gubbins price list and the clans' prices are copied to the Clanz list
#     from these same sections.
# 1c) Lists where a section heading's count limit is the size of a SKWADRON, not
#     the fleet's total. Da Ork Clanz describes every section as
#     a skwadron's pattern ("1-2 Kroozers", "3-10 Escorts", "1-4 Roks"),
#     and page 375 says: "There is no restriction for what kinds or how
#     many of what type of skwadrons are in the fleet." So a fleet may
#     have several Rok skwadrons, but a section counter made from the heading number
#     gave an error from the fifth Rok on.
#
#     The app does not model skwadrons of capital ships - a count exists
#     only for escorts - so the skwadron size cannot be enforced. It is
#     stated as text.
HEAD_IS_SQUADRON = ["Orks \u2014 Da Ork Clanz"]
_HEAD_SQ_USED = [0]

DROP_SECS = [
    dict(list_has="Waaagh!", sec="ORK CLANZ"),
    dict(list_has="Waaagh!", sec="USING ORK CLANZ"),
    dict(list_has="Waaagh!", sec="MUSTERIN' DA CLANZ"),
    dict(list_has="Waaagh!", sec="CLAN UPGRADES"),
    dict(list_has="Waaagh!", sec="MOB RULE"),
    dict(list_has="Waaagh!", sec="YOUNG GUNZ"),
    dict(list_has="Waaagh!", sec="GUBBINS"),
    dict(list_has="Waaagh!", sec="MORE GUBBINS"),
]

# 2) Price table rows. On the book's list page a row has the form
#    "Despoiler class battleship (pg 268).............400 pts", and
#    in extraction these stick to the front of the next rule sentence. The rows
#    are already their own choosable rows, so here they are just
#    noise. The same content in two forms is exactly the confusion
#    the feedback pointed out.
# The row's name part may be at most six words. Without this limit the pattern
# would eat a genuine sentence: "Torture class cruisers may choose one of the
# following for the points shown: 1-2 Impaler Assault Modules.....+20 pts"
# would lose its start, which is itself the rule.
_LEAD = r"(?:\(?\d+\s*[-–]\s*\d+\)?\s+|\d+[:.]\s+)?"     # "0-1 ", "6: "
_NAME = r"(?:[^.\s]+[ \t]+){0,5}[^.\s]*?"                # <= 6 words
_COST = r"(?:\+?\d[\d,]*\s*(?:pts|points)(?:\s*each)?|Free)"

# "Veteran Captain (Ld +1).........+50 pts", "Shokk-Attack Lance.....Free"
PRICE_ROW = re.compile(r"^\s*" + _LEAD + r"(?:" + _NAME + r"\.{2,}\s*)?"
                       + _COST + r"\b[\s.]*", re.I)
# "Grey Knights Strike Cruiser (pg 161)......vvv" - the price may be missing or
# corrupted, but the page reference still identifies the row.
PRICE_HEAD = re.compile(r"^\s*" + _LEAD + _NAME +
                        r"\(pg\.?\s*\d+\)\.{2,}\s*(?:v+|" + _COST +
                        r")?[\s.]*", re.I)


def strip_price_rows(t):
    """Removes price table rows from the start of a sentence. Returns None if
    nothing but prices is left of the sentence.

    Only a sentence that held a price row may drop entirely. Without this
    condition a short but valid sentence disappeared: "Re-rolls: 1 per turn." is
    Abaddon's number of re-rolls, not noise."""
    orig = t
    prev = None
    while prev != t:
        prev = t
        t = PRICE_HEAD.sub("", t)
        t = PRICE_ROW.sub("", t)
    t = t.strip()
    if t == orig.strip():
        return orig
    # A bare subheading or nothing left -> not shown.
    if len(t) < 25 or not re.search(r"[a-z]{3}\s+[a-z]{3}", t):
        return None
    return t


def apply_rule_picks(name, title, sec_titles, rules, text):
    """Returns (rules, text) after the fixes."""
    for fx in RULE_PICKS:
        if fx["list_has"] not in name or fx.get("late"):
            continue
        # list_is: "Rogue Traders" is also the start of two other lists' names.
        if fx.get("list_is") and fx["list_is"] != name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        where = "%s / %s" % (name, title)
        if "match_src" in fx:
            hit = [r for r in rules if fx["match_src"] in r.get("src", "")]
            assert len(hit) == 1, ("%s: the source sentence %r hit %d rules"
                                   % (where, fx["match_src"], len(hit)))
            patch = dict(fx.get("set") or {})
            for k in list(patch):
                if k == "pick" or k.endswith("_pick"):
                    patch[k] = pick_secs(patch[k], sec_titles, where)
            if "exempt" in patch and "cond_pick" in patch["exempt"]:
                patch["exempt"] = dict(patch["exempt"], cond_pick=pick_secs(patch["exempt"]["cond_pick"], sec_titles, where))
            if "at_least" in patch:
                patch["at_least"] = dict(patch["at_least"], cond_pick=pick_secs(patch["at_least"]["cond_pick"], sec_titles, where))
            hit[0].update(patch)
            # add: a second rule from the same sentence. p.184 RT escorts: the size
            # 2-6 is the parser's squadron rule, the count per ship a ratio.
            for rule in fx.get("add", []):
                # Its own src, when the rule is on the profile page and not in the list's sentence (p.290).
                r = dict(rule, src=rule.get("src") or hit[0]["src"], ok=True)
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        r[k] = pick_secs(r[k], sec_titles, where)
                if "allow_pick" not in r:
                    r["sec"] = list(hit[0].get("sec") or [])
                rules = rules + [r]
        else:
            hit = [t for t in text if fx["from_text"] in t]
            assert len(hit) == 1, ("%s: the text sentence %r hit %d times"
                                   % (where, fx["from_text"], len(hit)))
            if not fx.get("keep_text"):
                text = [t for t in text if t not in hit]
            new_rules = []
            for rule in (fx.get("rules") or [fx["rule"]]):
              r = dict(rule, src=fx["src"], ok=True)
              # "pick" is the same structure as allow_pick/per_pick, but
              # for points limits and requirements: a section plus a name filter.
              # Item 8: every *_pick key (a_pick, b_pick, cond_pick,
              # of_pick, if_pick, then_pick, unit_pick) is resolved the same way.
              for k in list(r):
                  if k == "pick" or k.endswith("_pick"):
                      r[k] = pick_secs(r[k], sec_titles, where)
              if "exempt" in r and "cond_pick" in r["exempt"]:
                  r["exempt"] = dict(r["exempt"], cond_pick=pick_secs(r["exempt"]["cond_pick"], sec_titles, where))
              if "at_least" in r:
                  r["at_least"] = dict(r["at_least"], cond_pick=pick_secs(r["at_least"]["cond_pick"], sec_titles, where))
              # up_sec (the upgrade section) is resolved only after upgrades.annotate
              # has created the sections (BIO-ENHANCEMENTS is born there): see the end.
              new_rules.append(r)
            for r in new_rules:
              if "secs" in r:
                # A rule may concern sections other than the one the sentence
                # is in. The tyranids' SQUADRONS section has no ship at all,
                # so a skwadron rule tied to its own section would measure
                # nothing.
                want = [x.strip().lower() for x in r.pop("secs")]
                r["sec"] = [i for i, t in enumerate(sec_titles)
                            if t.strip().lower() in want]
                assert len(r["sec"]) == len(want), (
                    "%s: sections %r not found (sections: %s)"
                    % (where, want, sec_titles))
              elif "allow_pick" not in r:
                # Rules other than ratios are tied to their own section.
                idx = [i for i, t in enumerate(sec_titles)
                       if t.strip().lower() == title.strip().lower()]
                assert len(idx) == 1, ("%s: section not found exactly once"
                                       % where)
                r["sec"] = idx
              rules = rules + [r]
        fx["_used"] = fx.get("_used", 0) + 1
    return rules, text

# --- list rows added by hand ---------------------------------------------
# A row the book mentions but whose price is unreadable as a misprint,
# so the parser cannot pick it. Each addition must
# hit exactly once and its source sentence must be found in the section's
# rule text - otherwise no price is invented but the run fails.
ENTRY_ADDS = [

]


# A per-row count limit the book writes as a sentence and not in front of the
# row. The book usually marks the limit in the form "0-1 Name.....500 pts",
# and it is picked by machine. The Necron Sepulchre is an exception: the row
# is just "Sepulchre.....+50 pts" and the limit is in the previous sentence.
# The source sentence must be found in the section's text, or the run fails.
ENTRY_LIMITS = [
    dict(list_has="Necrons", sec="Tombships", entry="Sepulchre", mx=1,
         src=r"A single tombship may be upgraded to carry a Sepulchre"),
    # Three Chaos upgrades for which the book gives an exact count.
    # "Including the flagship" means the flagship is counted
    # in, not that it would be required - so the limit is fleet-level.
    dict(list_has="Chaos \u2014 Tzeentch", sec="FORCES OF CHAOS",
         entry="Warp Beasts", mx=2,
         src=r"Up to two capital ships \(including the flagship\)"),
    dict(list_has="Chaos \u2014 Nurgle", sec="FORCES OF CHAOS",
         entry="Ark of Pestilence", mx=3,
         src=r"Up to three capital ships with the Mark of Nurgle"),
    dict(list_has="Chaos \u2014 Slaanesh", sec="FORCES OF CHAOS",
         entry="Siren\u2019s Summon", mx=2,
         src=r"Up to two capital ships with the Mark of Slaanesh"),
    # p.486: the Demiurg re-rolls are bought for the fleet once ("purchased by
    # the fleet as a whole") - each row at most once in the fleet.
    # fxg: the rows are alternatives of the same purchase - "The fleet gets one re-roll
    # and can purchase extra re-rolls at the cost shown": One or Two, not
    # both for different ships (three are not sold). Spot check 19, J41.
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # The Necrons likewise: "purchased by the fleet as a whole" (p.406).
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # J77 p.155: "The vessel embarking the Inquisitor Lord or one Grey Knights
    # vessel may board a Grey Knights terminator boarding party." - one ship in the fleet.
    dict(list_has="Grey Knights", sec="ORDNANCE",
         entry="Grey Knights Terminators", mx=1,
         src=r"The vessel embarking the Inquisitor Lord or one Grey Knights vessel may board a Grey Knights terminator boarding party"),
    # Rogue Traders Exploration p.187: "no more than one Stronghold may be taken"
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Demiurg",
         entry="Stronghold Commerce Vessel", mx=1,
         src=r"no more than one Stronghold may be taken"),
]


def apply_entry_limits(name, title, raw, ents):
    for fx in ENTRY_LIMITS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: the source sentence %r is not in the section's text"
            % (name, title, fx["src"]))
        hit = [e for e in ents if str(e.get("l", "")).lower()
               == fx["entry"].strip().lower()]
        assert len(hit) == 1, ("%s / %s: row %r found %d times"
                               % (name, title, fx["entry"], len(hit)))
        hit[0]["mx"] = fx["mx"]
        if fx.get("fxg"):
            hit[0]["fxg"] = fx["fxg"]
        fx["_used"] = fx.get("_used", 0) + 1


def apply_entry_adds(name, title, raw, ents):
    for fx in ENTRY_ADDS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: the source sentence %r is not in the section's text"
            % (name, title, fx["src"]))
        lab = fx["entry"]["l"].lower()
        if any(str(e.get("l", "")).lower() == lab for e in ents):
            continue
        ents.append(dict(fx["entry"]))
        fx["_used"] = fx.get("_used", 0) + 1
