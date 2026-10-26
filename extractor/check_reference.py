# -*- coding: utf-8 -*-
"""Compares the hand-read references with the generated bfg_data.json.

The references are in the folder reference/, one file per fleet list.
They have been read from the book by hand; this script checks that the app still
matches them. See reference/README.md.

The return value is 1 if there are findings, so this can be attached to a release pipeline.

Run in this folder:  python check_reference.py
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REFDIR = os.path.join(HERE, "..", "reference")


def norm(s):
    """Comparison form: lower case, punctuation and spaces removed.

    The book's dash can be - or an en dash, and the extraction drops full stops,
    so an exact string comparison would give false findings."""
    s = (s or "").lower()
    s = s.replace("–", "-").replace("—", "-").replace("’", "'")
    return re.sub(r"[^a-z0-9]+", "", s)


def load_refs():
    if not os.path.isdir(REFDIR):
        return []
    out = []
    for fn in sorted(os.listdir(REFDIR)):
        # Only the list references NN_name.json. The folder also has other
        # hand-read truth (golden_cases.json, options.json), with
        # its own schema and its own checker.
        if not re.match(r"\d\d_.*\.json$", fn):
            continue
        p = os.path.join(REFDIR, fn)
        out.append((fn, json.load(io.open(p, encoding="utf-8"))))
    return out


def find_list(data, name):
    for L in data["lists"]:
        if L["nm"] == name:
            return L
    return None


def rule_params_ok(ref, r, out, where):
    """Compares the parameters the reference expects with the rule found."""
    k = ref.get("kind")
    if k and r["kind"] != k:
        out.append("%s: the type is %r, the reference expects %r"
                   % (where, r["kind"], k))
        return
    if k == "section_count":
        for f in ("min", "max"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s is %r, the reference expects %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "squadron":
        for f in ("min", "max"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s is %r, the reference expects %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "ratio":
        for f in ("allow", "per"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s is %r, the reference expects %r"
                           % (where, f, r.get(f), ref[f]))
        want = ref.get("per_types")
        if want:
            got = [x.strip() for x in re.split(r"\s+or\s+",
                                               r.get("per_type", "")) if x.strip()]
            if len(got) != len(want):
                out.append("%s: the denominator covers %d types (%s), "
                           "the reference expects %d (%s)"
                           % (where, len(got), ", ".join(got) or "-",
                              len(want), ", ".join(want)))
    elif k == "cap":
        if "max" in ref and r.get("max") != ref["max"]:
            out.append("%s: max is %r, the reference expects %r"
                       % (where, r.get("max"), ref["max"]))
    elif k == "per_points":
        for f in ("each", "per"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s is %r, the reference expects %r"
                           % (where, f, r.get(f), ref[f]))
    elif k in ("allowed_at", "conditional_cap", "requires", "min_ratio", "compare",
               "points_share", "tiers", "upgrade_ratio", "unit_upgrade_max"):
        # Item 8: new rule types. A reference can name parameters
        # that it must match in the data.
        for f in ("points", "basis", "op", "min", "max", "pct", "frac", "per", "allow",
                  "cond_min", "max_met", "max_unmet", "a_mult", "of"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s is %r, the reference expects %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "mandatory_at":
        if "points" in ref and r.get("points") != ref["points"]:
            out.append("%s: points is %r, the reference expects %r"
                       % (where, r.get("points"), ref["points"]))
        # "over 750" and "750 or more" differ exactly at 750.
        if "over" in ref and bool(r.get("over")) != bool(ref["over"]):
            out.append("%s: the comparison is %s, the reference expects %s"
                       % (where, "over" if r.get("over") else "at least",
                          "over" if ref["over"] else "at least"))



_FLEET_IDS = []


def fleet_case_ids():
    """The ids of the fleet-level golden cases (read once)."""
    if not _FLEET_IDS:
        fp = os.path.join(REFDIR, "golden_fleet_cases.json")
        if os.path.exists(fp):
            _FLEET_IDS.extend(c["id"] for c in json.load(
                io.open(fp, encoding="utf-8")).get("cases", []))
    return _FLEET_IDS


def check_general(ref, data, out):
    """The book's general chapter (scope: general): rules that do not belong to one
    list but to all of them. The file has no list field, so enforcement is
    searched in all lists' rules.

    enforced requires evidence: enforced_by list_rules + src_has (the list's own
    sentence that implements the general rule) or rule_kind + kind. gap requires
    a task - without it a 'known gap' is a mere word."""
    rules = [r for L in data["lists"] for s in L["secs"] for r in s["rules"]]
    keys = [norm(r.get("src", "")) for r in rules]
    # A general rule enforced in the engine does not show in the data's rules at all:
    # it is code. A named fleet-level golden case, whose expectation
    # is read from the book, is valid evidence.
    fleet_ids = set(fleet_case_ids())
    title = ref.get("title") or "yleiset"
    for ref_r in ref.get("rules", []):
        where = "%s / %s" % (title[:24], ref_r["key"][:48])
        st = ref_r["status"]
        found = any(norm(ref_r["key"]) in k for k in keys)
        if st == "enforced":
            by = ref_r.get("enforced_by")
            if by == "list_rules":
                need = norm(ref_r.get("src_has", ""))
                if not need:
                    out.append("%s: enforced_by list_rules without a src_has field" % where)
                elif not any(need in k for k in keys):
                    out.append("REGRESSION %s: list rule %r is not found on any "
                               "list" % (where, ref_r.get("src_has")))
            elif by == "fleet_golden":
                ids = ref_r.get("goldens") or []
                if not ids:
                    out.append("%s: enforced_by fleet_golden without a goldens field"
                               % where)
                else:
                    gone = [i for i in ids if i not in fleet_ids]
                    if gone:
                        out.append("REGRESSION %s: fleet case %s is not "
                                   "in golden_fleet_cases.json" % (where, gone))
            elif by == "rule_kind":
                if not any(r.get("kind") == ref_r.get("kind") for r in rules):
                    out.append("REGRESSION %s: rule kind %r is not in the data"
                               % (where, ref_r.get("kind")))
            elif not found:
                out.append("REGRESSION %s: should be enforced, not found "
                           "among the rules" % where)
        elif st == "gap":
            if not ref_r.get("task"):
                out.append("%s: gap without a task" % where)
            if found:
                out.append("OUT OF DATE %s: the reference says 'gap', but the sentence "
                           "is enforced after all - update the reference" % where)
        elif st in ("manual", "not_shown", "out_of_scope"):
            if not ref_r.get("why"):
                out.append("%s: %s without a reason" % (where, st))
        else:
            out.append("%s: unknown status %r" % (where, st))


def check_list(ref, data, out):
    name = ref["list"]
    L = find_list(data, name)
    if L is None:
        out.append("%s: the list is not found in bfg_data.json" % name)
        return
    rules = [r for s in L["secs"] for r in s["rules"]]
    texts = [t for s in L["secs"] for t in s["text"]]
    rule_keys = [(norm(r.get("src", "")), r) for r in rules]
    text_keys = [norm(t) for t in texts]

    for ref_r in ref.get("rules", []):
        key = norm(ref_r["key"])
        where = "%s / %s" % (name, ref_r["key"][:48])
        hits = [r for k, r in rule_keys if key in k]
        in_text = any(key in t for t in text_keys)
        st = ref_r["status"]
        if st == "enforced" and ref_r.get("enforced_by") == "hull_choice":
            # Enforced by STRUCTURE, not by a fleet rule: the row offers only
            # the valid hulls (hc=1, hulls[]). It is checked that the mechanism
            # is in the built data - otherwise "enforced" would be a mere word.
            ents = [e for s in L["secs"] for e in s.get("ents", [])]
            if not any(e.get("hc") == 1 and e.get("hulls") for e in ents):
                out.append("REGRESSION %s: should be a hull choice (hc=1, hulls), "
                           "the list has no such row" % where)
        elif st == "enforced" and ref_r.get("enforced_by") == "entry_max":
            # Enforced as a row limit (mx), not as a fleet rule.
            ents = [e for s in L["secs"] for e in s.get("ents", [])]
            e = next((e for e in ents if e.get("l") == ref_r.get("entry")), None)
            if e is None or e.get("mx") != ref_r.get("mx"):
                out.append("REGRESSION %s: row %r's limit should be mx=%r"
                           % (where, ref_r.get("entry"), ref_r.get("mx")))
        elif st == "enforced" and ref_r.get("enforced_by") == "rule_field":
            # Enforced by another rule's field (Iyanden's Dragonship exception
            # is the ratio's exempt field).
            hit2 = [r for k, r in rule_keys if norm(ref_r.get("rule_src_has", "")) in k]
            if not hit2 or not any(ref_r.get("field") in r for r in hit2):
                out.append("REGRESSION %s: rule %r lacks the field %r"
                           % (where, ref_r.get("rule_src_has"), ref_r.get("field")))
        elif st == "enforced" and ref_r.get("enforced_by") == "fleet_golden":
            # Enforced in the ENGINE (e.g. a named reserve permission), not as the list's
            # rule row. A named fleet case is valid evidence.
            ids = ref_r.get("goldens") or []
            if not ids:
                out.append("%s: enforced_by fleet_golden without a goldens field" % where)
            else:
                gone = [i for i in ids if i not in fleet_case_ids()]
                if gone:
                    out.append("REGRESSION %s: fleet case %s is not "
                               "in golden_fleet_cases.json" % (where, gone))
        elif st == "enforced" and ref_r.get("enforced_by") == "structure":
            # The structure prevents the violation (e.g. an upgrade row is chosen once).
            if not ref_r.get("why"):
                out.append("%s: enforced_by structure without a reason" % where)
        elif st == "enforced":
            if not hits:
                out.append("REGRESSION %s: should be enforced, is not "
                           "among the rules" % where)
            else:
                rule_params_ok(ref_r, hits[0], out, where)
        elif st == "gap":
            if hits:
                out.append("OUT OF DATE %s: the reference says 'gap', but "
                           "the rule is now enforced after all - update the reference"
                           % where)
            elif not in_text:
                out.append("%s: a known gap, but the sentence does not even show "
                           "as text" % where)
        elif st == "manual":
            if not (in_text or hits):
                out.append("%s: the sentence is not shown to the player and is not a rule"
                           % where)
        elif st == "not_shown":
            # In the book, the app does not show it. Recorded on purpose.
            # If it appears, the reference is out of date.
            if in_text or hits:
                out.append("OUT OF DATE %s: the reference says 'not_shown', "
                           "but the sentence shows now - update the reference"
                           % where)
        elif st == "out_of_scope":
            # Item 8: decided out of scope with a reason -
            # narrative, resting on another list or profile, or
            # a structure v1 does not model. Not enforced; visibility does not decide.
            if not ref_r.get("why"):
                out.append("%s: out_of_scope without a reason" % where)
        else:
            out.append("%s: unknown status %r" % (where, st))

    # The same name can occur many times at different prices: for example
    # "One re-roll" costs 25 for the Pirate Prince and 50 for the Eldar Hero.
    # So behind the name is a list, and the price picks the right row.
    have = {}
    for s in L["secs"]:
        for e in s["ents"]:
            have.setdefault(norm(e["l"]), []).append((s["t"], e))
    for ref_e in ref.get("entries", []):
        cands = [e for t, e in have.get(norm(ref_e["name"]), [])
                 # The same name and price can be in many sections: the tyranids'
                 # "Pyro-acid battery 15" is both in the hive ship's
                 # port/starboard list and in the Kraken's weapon list.
                 if "sec" not in ref_e or norm(t) == norm(ref_e["sec"])]
        if not cands:
            out.append("%s: list row %r is missing%s"
                       % (name, ref_e["name"],
                          (" from section %r" % ref_e["sec"]) if "sec" in ref_e
                          else ""))
            continue
        want = ref_e.get("pts")
        e = next((c for c in cands if c.get("p") == want), None) if want is not None             else cands[0]
        if e is None:
            out.append("%s: %r price is %s, the reference expects %r"
                       % (name, ref_e["name"],
                          " or ".join(str(c.get("p")) for c in cands), want))
            continue
        if "mx" in ref_e and e.get("mx") != ref_e["mx"]:
            out.append("%s: %r row limit is %r, the reference expects %r"
                       % (name, ref_e["name"], e.get("mx"), ref_e["mx"]))
        # An exclusive group. The book's "up to one of the upgrades shown
        # below" is implemented by the rows sharing the same grp id:
        # the browser switches the others off when one is chosen.
        if "grp" in ref_e:
            # true = "some group is enough". An id derived from the section's and
            # the attachment target's indexes is not worth recording
            # as it is, because it changes when sections are added.
            if ref_e["grp"] is True:
                if not e.get("grp"):
                    out.append("%s: %r is not in an exclusive group"
                               % (name, ref_e["name"]))
            elif e.get("grp") != ref_e["grp"]:
                out.append("%s: %r exclusive group is %r, the reference "
                           "expects %r"
                           % (name, ref_e["name"], e.get("grp"),
                              ref_e["grp"]))
        if ref_e.get("page") is not None:
            got = str(e.get("r") or "")
            if not got.startswith(str(ref_e["page"])):
                out.append("%s: %r profile page is %r, the reference expects %r"
                           % (name, ref_e["name"], e.get("r"), ref_e["page"]))
    for ref_e in ref.get("extra_entries", []):
        if norm(ref_e["name"]) not in have:
            out.append("%s: added row %r is missing" % (name, ref_e["name"]))


def check_sentence_groups(data, out):
    """J212: every sentence of a section has a group (sec.cls), and the group comes
    from the hand classification (reference/check_yourself.json) or from the src of
    a rule in the same section. A new sentence without a class shows to the player in the "Not checked"
    group; it is a known gap that is classified by hand."""
    path = os.path.join(HERE, "..", "reference", "check_yourself.json")
    cy = json.load(io.open(path, encoding="utf-8"))
    key = lambda t: re.sub(r"[^a-z0-9']+", " ", (t or "").replace("’", "'")
                           .replace("‘", "'").lower()).strip()
    known = set(key(e["text"]) for e in cy["sentences"])
    for L in data["lists"]:
        for s in L["secs"]:
            txt, cls = s.get("text") or [], s.get("cls")
            if cls is None or len(cls) != len(txt):
                out.append("%s / %s: the section's sentences lack a group (cls)" % (L["nm"], s["t"]))
                continue
            srcs = [r.get("src") for r in s.get("rules") or []]
            for t in txt:
                if t not in srcs and key(t) not in known:
                    out.append("%s / %s: unclassified sentence: %s" % (L["nm"], s["t"], t[:60]))


def main():
    data = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"),
                             encoding="utf-8"))
    out0 = []
    check_sentence_groups(data, out0)
    refs = load_refs()
    if not refs:
        print("the reference/ folder has no files")
        return 0
    out = out0
    n_rules = n_ent = 0
    n_general = 0
    for fn, ref in refs:
        n_rules += len(ref.get("rules", []))
        n_ent += len(ref.get("entries", [])) + len(ref.get("extra_entries", []))
        if ref.get("scope") == "general":
            n_general += 1
            check_general(ref, data, out)
        else:
            check_list(ref, data, out)

    done = {r["list"] for _, r in refs if r.get("scope") != "general"}
    todo = [L["nm"] for L in data["lists"] if L["nm"] not in done]

    print("reference files %d / %d lists%s"
          % (len(refs) - n_general, len(data["lists"]),
             (" + %d general chapters" % n_general) if n_general else ""))
    print("rules checked %d, list rows %d" % (n_rules, n_ent))
    if todo:
        print("not yet referenced (%d): %s"
              % (len(todo), ", ".join(t[:28] for t in todo)))
    print()
    for line in out:
        print("  " + line)
    print("findings: %d" % len(out))
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main())
