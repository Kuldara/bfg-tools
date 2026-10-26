# -*- coding: utf-8 -*-
"""Coverage report: which priced thing in the book is NOT selectable.

    python coverage.py           # only the uncovered ones
    python coverage.py --all     # the covered ones too, for checking

WHAT THIS DOES

Goes through every list's WHOLE rule text sentence by sentence and picks the
sentences that have a points price. Then it looks whether the list has a row
that matches the sentence - either by price and name or by name alone.
The sentences left over are the ones the player cannot choose
in the builder.

WHY

The book writes some upgrades as rows and some in the body text.
The ones left in the body text are found only by reading, and exactly those are forgotten.
This makes it a mechanical check that can be run again
whenever the source updates.

WHAT THIS IS NOT

This does not decide what is an error. Many findings are plain text on purpose:
fleet size limits, scenario purchases, campaign rules.
The report is a list to review, not a list of errors.
"""
import io, json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SHOW_ALL = "--all" in sys.argv

RAW = json.load(io.open(os.path.join(HERE, "lists_raw.json"), encoding="utf-8"))
DATA = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))

COST = re.compile(r"\+?(\d+)\s*(?:points|pts)\b", re.I)
ABBR = [(r"\bmax\.", "max"), (r"\bpg\.", "pg"), (r"\bapprox\.", "approx"),
        (r"\bi\.e\.", "ie"), (r"\be\.g\.", "eg"), (r"\bNo\.", "No"),
        (r"\bMk\.", "Mk"), (r"\bSt\.", "St")]

# Sentences that are NOT purchasable upgrades.
NOISE = re.compile(
    r"\bper\s+[\d,]{3,}\s*points"              # "one Warlord per 500 points"
    r"|fleet\s+(?:is\s+)?(?:of|worth)\s+[\d,]{3,}"
    r"|worth\s+(?:at\s+least\s+|over\s+|more\s+than\s+)?[\d,]{3,}\s*(?:points|pts)"
    r"|[\d,]{3,}\s*(?:points|pts)\s+(?:or\s+)?(?:more|greater|less|and\s+above)"
    r"|victory\s+points|renown|\bD6\s*x\s*\d+\s*points"
    r"|battle\s+will\s+be|scenario|campaign"
    # number limits tied to fleet size, not purchasable upgrades
    r"|for\s+every\s+(?:full\s+)?[\d,]{3,}\s*points"
    r"|per\s+FULL\s+[\d,]{3,}\s*points"
    r"|[\d,]{3,}\s*points\s+of\s+(?:ships|\w+\s+vessels)"
    r"|(?:if|while|between)\b[^.]*\b[\d,]{3,}\s*(?:points|pts)\b"
    r"|\bat\s+least\s+[\d,]{3,}"
    r"|\bworth\s+up\s+to\s+[\d,]{3,}", re.I)

# Reviewed cases: checked by hand, nothing to add. The key is from
# the start of the sentence, the value is the reason. This way the report does not need to sort
# the same thing again on every run.
REVIEWED = {
    "Battleship...":
        "the neighbouring list's daemonship prices leaked across the page break; "
        "every cult list has its own DAEMONSHIPS section",
    "Cruiser...":
        "the same page-break leak as above",
    "185 pts The Kroot":
        "page 177 of the Rogue Traders - Exploration list leaked into the Pirates "
        "list's rule texts; the ships are on the Exploration list",
    "145 pts":
        "the same leak: the Kroot Warsphere is on the Exploration list",
    "Improved Logic Engines":
        "Kor'O'Mesme's ship refit; he can be chosen only on the Commerce "
        "Protection list, where the row is",
    "The enemy Xenos fleet adds":
        "an addition the opponent gets, not a purchasable upgrade; the Ordo Xenos "
        "inquisitor's drawback",
    "KOR’O VASH’YA":
        "Kor'O'Mesme can be chosen on the Commerce Protection list; "
        "he is not in the Merchant Fleet's commander section",
}

# Words shared by a row's name and the sentence: recognises "already a row".
STOP = {"the", "a", "an", "of", "for", "and", "or", "to", "in", "at", "may",
        "can", "be", "is", "are", "with", "any", "all", "one", "two", "three",
        "each", "per", "points", "pts", "cost", "additional", "extra", "this",
        "that", "their", "its", "his", "have", "has", "take", "taken", "ship",
        "ships", "vessel", "vessels", "fleet", "point", "add", "given",
        "purchase", "purchased", "include", "included", "must", "not", "if",
        "they", "them", "you", "your", "from", "by", "as", "on", "no"}


def toks(t):
    t = re.sub(r"[^a-z0-9' ]", " ", str(t or "").lower())
    return {w for w in t.split() if len(w) > 2 and w not in STOP}


def sentences(t):
    for pat, rep in ABBR:
        t = re.sub(pat, rep, t)
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", t) if x.strip()]


def split_leaders(s):
    """Dotted leader rows are a matter of their own, even when they are in the same sentence.

    "Soopa Boostas.....+25 pts The ship gains +5 cm speed" is one sentence
    but two things. Cut at the price after the dotted leader.
    """
    out, last = [], 0
    for m in re.finditer(r"\.{2,}\s*\+?\d+\s*(?:pts|points)\b", s):
        out.append(s[last:m.end()])
        last = m.end()
    tail = s[last:].strip()
    if tail:
        out.append(tail)
    return out or [s]


weak = 0
rows = collections.defaultdict(list)
for lst in RAW:
    name = lst["name"]
    own = [e for L in DATA["lists"] if L["nm"] == name
           for s in L["secs"] for e in s["ents"]]
    own_costs = {e["p"] for e in own if e.get("p") is not None}
    own_toks = [(toks(e["l"]), e.get("p")) for e in own]

    seen = set()
    for sec in lst["sections"]:
        for para in sec["rules"]:
            for sent in sentences(para):
                for piece in split_leaders(sent):
                    if not COST.search(piece) or NOISE.search(piece):
                        continue
                    if re.search(r"\(pg\s*\.?\s*\d+\)", piece):
                        continue          # a ship row, already on the list
                    if len(piece) > 300:
                        piece = piece[:300]
                    key = re.sub(r"\s+", " ", piece)[:120]
                    if key in seen:
                        continue
                    seen.add(key)
                    costs = {int(c) for c in COST.findall(piece)}
                    st = toks(piece)
                    hit = None
                    for lt, p in own_toks:
                        if not lt:
                            continue
                        shared = lt & st
                        # One shared word is not enough. Bakka's "Fleet Defence
                        # Turret +5 points" matched the row "+1 turret
                        # (Battlefleet Bakka refit) 5 pts" this way: the same price and
                        # the word "turret", but a different upgrade. From a row with several words
                        # two shared words are required.
                        need = 2 if len(lt) >= 2 else 1
                        if p in costs and len(shared) >= need:
                            hit = "price+name"
                            break
                        if len(shared) >= 2 and len(shared) >= len(lt) - 1:
                            hit = "name"
                            break
                    if hit is None and costs & own_costs:
                        hit = "price only"
                    if hit is None:
                        for pre, why in REVIEWED.items():
                            if piece.lstrip().startswith(pre):
                                hit = "reviewed: " + why
                                break
                    rows[name].append((hit, sec["title"], piece))

tot = miss = 0
for name in [l["name"] for l in RAW]:
    items = rows.get(name) or []
    tot += len(items)
    show = [x for x in items if SHOW_ALL or x[0] is None]
    miss += sum(1 for x in items if x[0] is None)
    # "price only" means that the list had some row of the same price
    # but the name did not match. It is a weak hit: Bakka's "Fleet
    # Defence Turret +5 points" would look covered because the list has
    # another five-point upgrade. The number is shown separately, so that
    # a weak hit does not hide among the strong ones.
    weak += sum(1 for x in items if x[0] == "price only")
    if not show:
        continue
    print("=" * 100)
    print(name)
    print("=" * 100)
    for hit, sect, piece in show:
        mark = "NOT COVERED " if hit is None else "[%s] " % hit
        print("  %-12s %-22s %s" % (mark, sect[:22], re.sub(r"\s+", " ", piece)[:260]))
    print()

print("priced sentences %d, of them not covered %d"
      % (tot, miss))
print("of these covered by price only: %d "
      "(the name did not match - check by eye: "
      "python coverage.py --all)" % weak)
