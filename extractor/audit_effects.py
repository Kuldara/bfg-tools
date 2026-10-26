# -*- coding: utf-8 -*-
"""Which of a ship's options promise a profile change without a model?

An option that changes only the total but not the profile is the worst class of defect
in this project: the card looks plausible and is wrong. This happened to
the Dominator's cheaper armament, the Hammer's turret upgrade and the
Warsphere's hull changes before effect fields were added for them.

This tool does NOT decide a rule. It builds a check queue: it reads every
option's text, sees whether it promises a stat or weapon change, and asks whether
the option has a matching structured effect. A person makes the decision from the book,
and the result is recorded in reference/options.json (see reference/README.md).

Effect fields:
    mod   stat change          {"tu": 1}          turrets +1
    swp   weapon row change    {"f": ..., "rg": ...}
    sw    alternative weapon row
    aws   weapon row choice from a group (grp/gmax)
    qty   repeatable option    {"max": 3}

Run:  python audit_effects.py            summary + queue
      python audit_effects.py -v         the whole queue
      python audit_effects.py --json     machine-readable (used by tools/test.js)

Returns 1 if the queue has rows that are not acknowledged as checked
in reference/options.json.
"""
import json, io, re, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))

VERBOSE = "-v" in sys.argv
AS_JSON = "--json" in sys.argv

# Words that in the book mean a change to the SHIP'S PROFILE.
STAT_WORDS = re.compile(
    r"\b(turret|shield|hit ?points?|\bHP\b|armour|armor|speed|turn rate|may turn)\b", re.I)
WEAPON_WORDS = re.compile(
    r"\b(lance|weapons? batter|torpedo|launch bay|nova cannon|range|firepower"
    r"|strength|prow|dorsal|broadside)\b", re.I)

STAT_FIELDS = ("mod", "set")
WEAPON_FIELDS = ("sw", "swp", "aws")
ANY_FIELDS = STAT_FIELDS + WEAPON_FIELDS + ("qty",)

# Acknowledged: the option has been read from the book and found either modelled or
# such that it does not change the profile. The file may be missing.
ACK = {}
ACK_INVALID = []
EFFECT_KEYS = {"mod", "set", "swp", "sw", "add", "del", "qty"}
ackfile = os.path.join(HERE, "..", "reference", "options.json")


def ack_error(row):
    """The same contract as reference/options.schema.json, checked by hand
    (there is no jsonschema library). A row that does not meet the contract acknowledges
    nothing - that would be a way to silence the queue without the book."""
    if not isinstance(row, dict):
        return "not an object"
    for k in ("ship", "text", "page", "effect", "why", "verified"):
        if k not in row:
            return "missing field %r" % k
    if not isinstance(row["ship"], str) or len(row["ship"]) < 3:
        return "ship is not valid"
    if not isinstance(row["text"], str) or len(row["text"]) < 8:
        return "text is not valid"
    if not isinstance(row["page"], int) or not 1 <= row["page"] <= 600:
        return "page is not a page number"
    if row["verified"] is not True:
        return "verified is not true"
    if not isinstance(row["why"], str) or len(row["why"]) < 15:
        return "why is missing or too short"
    eff = row["effect"]
    if eff is not None:
        if not isinstance(eff, dict) or not eff:
            return "effect is neither an object nor null"
        bad = set(eff) - EFFECT_KEYS
        if bad:
            return "effect: unknown key %s" % sorted(bad)
    # modelled_by: the effect is already in the data in this field; the words the audit
    # finds are not a separate change. Allowed values = the data's fields.
    mb = row.get("modelled_by")
    if mb is not None and mb not in ("sw", "aws", "mod", "set", "swp", "add", "qty"):
        return "modelled_by: unknown field %r" % mb
    return None


if os.path.exists(ackfile):
    for row in json.load(io.open(ackfile, encoding="utf-8")).get("options", []):
        err = ack_error(row)
        if err:
            ACK_INVALID.append((row.get("ship", "?") if isinstance(row, dict) else "?", err))
            continue
        ACK.setdefault(row["ship"], []).append(row)


def acked(ship, text):
    """An acknowledgement hits when its text is the START of the option's text. The option text can
    be long; it is enough that the recorded start matches the book exactly
    (at least 8 characters, see the schema)."""
    for row in ACK.get(ship, []):
        if text.startswith(row["text"]):
            return row
    return None


def classify(sh, o):
    """Return (needs_stat, needs_weapon)."""
    t = o.get("t", "")
    need_stat = bool(STAT_WORDS.search(t)) and not any(f in o for f in STAT_FIELDS)
    need_wep = bool(WEAPON_WORDS.search(t)) and not any(f in o for f in WEAPON_FIELDS)
    return need_stat, need_wep


total = modelled = 0
queue = []
by_field = collections.Counter()
seen_keys = set()

for pg, sh in sorted(D["ships"].items(), key=lambda kv: str(kv[0])):
    for o in (sh.get("ol") or []):
        total += 1
        for f in ANY_FIELDS:
            if f in o:
                by_field[f] += 1
        if any(f in o for f in ANY_FIELDS):
            modelled += 1
        need_stat, need_wep = classify(sh, o)
        if not (need_stat or need_wep):
            continue
        key = (sh.get("nm", ""), o.get("t", "")[:120])
        if key in seen_keys:      # the same ship with several page variants
            continue
        seen_keys.add(key)
        ack = acked(sh.get("nm", ""), o.get("t", ""))
        queue.append(dict(
            page=str(sh.get("pg") or pg), ship=sh.get("nm", ""),
            text=o.get("t", ""), cost=o.get("c"),
            needs="stats+weapons" if (need_stat and need_wep)
                  else ("stats" if need_stat else "weapons"),
            acked=ack is not None,
            note=(ack or {}).get("why", "")))

open_q = [q for q in queue if not q["acked"]]

# An acknowledgement is a record of reading the book also when the option is already
# implemented and no longer in the queue. An acknowledgement that hits NO
# option is a typo - and it must be reported, otherwise it stays silent.
all_texts = {}
for pg, sh in D["ships"].items():
    for o in (sh.get("ol") or []):
        all_texts.setdefault(sh.get("nm", ""), []).append(o.get("t", ""))
ack_implemented, ack_orphans = 0, []
for ship, rows in ACK.items():
    for row in rows:
        hits = [t for t in all_texts.get(ship, []) if t.startswith(row["text"])]
        if not hits:
            ack_orphans.append((ship, row["text"][:50]))
        elif not any(q["ship"] == ship and q["text"].startswith(row["text"]) for q in queue):
            ack_implemented += 1

if AS_JSON:
    print(json.dumps(dict(total=total, modelled=modelled,
                          fields=dict(by_field), queue_total=len(queue),
                          queue_open=len(open_q),
                          invalid_acks=len(ACK_INVALID) + len(ack_orphans),
                          acks_implemented=ack_implemented,
                          ack_orphans=[s + ": " + t for s, t in ack_orphans],
                          queue=queue),
                     ensure_ascii=False, indent=1))
    sys.exit(1 if (open_q or ACK_INVALID or ack_orphans) else 0)

if ACK_INVALID:
    print("REJECTED ACKNOWLEDGEMENTS in reference/options.json: %d" % len(ACK_INVALID))
    print("  (they acknowledge nothing; contract: reference/options.schema.json)")
    for ship, err in ACK_INVALID[:10]:
        print("   %-34s %s" % (ship[:34], err))
    print()
if ack_orphans:
    print("ACKNOWLEDGEMENTS THAT HIT NO OPTION: %d  (a typo?)"
          % len(ack_orphans))
    for ship, t in ack_orphans[:10]:
        print("   %-34s %s" % (ship[:34], t))
    print()

print("Ships' own options           %4d" % total)
print("  with a structured effect    %4d   %s"
      % (modelled, " ".join("%s=%d" % kv for kv in sorted(by_field.items()))))
print()
print("CHECK QUEUE: the text promises a profile change, there is no model")
print("  unique rows                  %4d" % len(queue))
print("  acknowledged in reference/options.json %2d" % (len(queue) - len(open_q)))
print("  open                         %4d" % len(open_q))
print("  acknowledged AND implemented %4d   (a record of reading the book, no longer in the queue)"
      % ack_implemented)
print()
kinds = collections.Counter(q["needs"] for q in open_q)
for k, n in sorted(kinds.items()):
    print("   %-16s %3d" % (k, n))
print()
show = open_q if VERBOSE else open_q[:14]
for q in show:
    print("  p.%-5s %-30s %5s  %s"
          % (q["page"], q["ship"][:30],
             "" if q["cost"] is None else q["cost"], q["text"][:64]))
if not VERBOSE and len(open_q) > len(show):
    print("  ... and %d more (-v shows all)" % (len(open_q) - len(show)))
print()
print("open: %d" % len(open_q))
sys.exit(1 if open_q else 0)
