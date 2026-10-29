# -*- coding: utf-8 -*-
"""Stage 5 of the data pipeline (extractor/build_data.py): section guard.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import FIXES, L, _nkey, collections, copy, json, re, sentences
from .rule_detectors import HEAD_IS_SQUADRON, LORE_SECTIONS, RULEY, SECN, _HEAD_SQ_USED, apply_entry_adds, apply_entry_limits, apply_rule_picks, detect, keep_text, resolve_sections, strip_price_rows
from .ships import p
from .weapon_menu import _sh
# --------------------------------------------------- the section index guard
# A section index is a silent reference: if the section moves or goes, the index
# still points somewhere - at the wrong section. Bastion Fleets' battleship ratio
# broke exactly here. So every reference carries the section's NAME, and the name
# is checked again after every move. The name also stays in the data,
# so that domain.js can compare it before counting.
#
# The forms of a reference:
#   top-level list        sec / allow_sec / per_sec  = [3, 4]   -> "<key>_sn"
#   pick dictionary       {"sec": 3, "re": ...}                 -> "sn"
#   upgrade section       {"up_sec": 7, ...}                    -> "up_sn"
_SEC_LIST_KEYS = ("sec", "allow_sec", "per_sec")
_SEC_COUNT = [0, 0]        # [references, checked again]


def _sec_names_walk(node, titles, where, stamp_new):
    if isinstance(node, list):
        for x in node:
            _sec_names_walk(x, titles, where, stamp_new)
        return
    if not isinstance(node, dict):
        return
    for k in list(node):
        v = node[k]
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            _sec_names_one(node, k + "_sn", [_sec_title(titles, i, where, k) for i in v],
                           where, k, stamp_new)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            _sec_names_one(node, "sn" if k == "sec" else "up_sn",
                           _sec_title(titles, v, where, k), where, k, stamp_new)
        elif isinstance(v, (list, dict)) and not k.endswith("_sn") and k != "sn":
            _sec_names_walk(v, titles, where, stamp_new)


def _sec_title(titles, i, where, k):
    assert 0 <= i < len(titles), ("%s: %s points to section %d, there are %d sections"
                                  % (where, k, i, len(titles)))
    return titles[i]


def _sec_names_one(node, namekey, now, where, k, stamp_new):
    # One reference = one index, in list form too (sec=[3, 4] is two).
    n = len(now) if isinstance(now, list) else 1
    was = node.get(namekey)
    if was is None:
        if stamp_new:
            node[namekey] = now
            _SEC_COUNT[0] += n
        return
    assert was == now, (
        "%s: %s points to section %r, it should be %r - the section moved or "
        "went away without the index being fixed" % (where, k, now, was))
    _SEC_COUNT[1] += n


def stamp_section_names(secs, where, stamp_new=True):
    """Stamps and checks the section references of one list's rules."""
    titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec.get("rules") or []:
            _sec_names_walk(r, titles, "%s / %s" % (where, sec["t"]), stamp_new)


def check_section_names(lists, where, stamp_new=True):
    for Lz in lists:
        stamp_section_names(Lz["secs"], "%s: %s" % (where, Lz["nm"]), stamp_new)


def count_section_refs(node, acc):
    """References in total and the named ones among them - the same count as
    tools/test.js reports, so the numbers cannot drift apart."""
    if isinstance(node, list):
        for x in node:
            count_section_refs(x, acc)
        return acc
    if not isinstance(node, dict):
        return acc
    for k, v in node.items():
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            acc[0] += len(v)
            if isinstance(node.get(k + "_sn"), list) and len(node[k + "_sn"]) == len(v):
                acc[1] += len(v)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            acc[0] += 1
            if node.get("sn" if k == "sec" else "up_sn") is not None:
                acc[1] += 1
        elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
            count_section_refs(v, acc)
    return acc


lists_out = []
raw_rules = []
raw_pages = []          # J165: the page bounds of the section text, the same indexes as raw_rules
_SHARED = [None]        # the FLEET RULES block seen last
_PICKS_OK = [0]         # pick references checked
_OWN_HITS = [0]         # sentences that have an owner row
_OWN_REOWNED = [0]      # moved by the priced row
_INHERITED = []         # the lists that inherit it
stat = collections.Counter()
for Lx in L:
    titles = [s["title"] for s in Lx["sections"]]
    secs = []
    raw_here = []
    pg_here = []
    for si, s in enumerate(Lx["sections"]):
        raw_here.append(" ".join(s["rules"]))
        pg_here.append(s.get("pg") or [])
        rules, text, notes = [], [], []
        for para in s["rules"]:
            m = SECN.match(para)
            if m:
                # concerns one skwadron, not the whole fleet -> shown only
                _head = para.split(".")[0].rstrip()
                # The heading row ends with a colon ("1-2 Kroozers,
                # chosen from the following list:"), and a full stop after it
                # gave ":." twice on the Da Ork Clanz list.
                text.append(_head if _head.endswith(":") else _head + ".")
            for sent in sentences(para):
                r = detect(sent)
                if not r:
                    if (RULEY.search(sent) and len(sent) < 500) or keep_text(Lx["name"], s["title"], sent):
                        text.append(sent)
                    continue
                # A sentence may be both an enforced rule and card text:
                # Farseers p.316 is a 0-3 count AND a re-roll usage rule,
                # which without this disappeared from the commander card (spot check 7 row 76).
                if keep_text(Lx["name"], s["title"], sent):
                    text.append(sent)
                r["src"] = sent
                r["ok"] = not s["title"].startswith("FLEET RULES")
                if r["kind"] == "ratio":
                    a = resolve_sections(r["allow_type"], titles, si)
                    b = resolve_sections(r["per_type"], titles, si)
                    if not a or not b or set(a) & set(b):
                        r["ok"] = False
                    else:
                        r["allow_sec"], r["per_sec"] = a, b
                elif r["kind"] == "cap":
                    a = resolve_sections(r["what"], titles, si)
                    if not a:
                        r["ok"] = False
                    else:
                        r["sec"] = a
                elif r["kind"] == "per_points":
                    a = resolve_sections(r["what"], titles, si)
                    if a:
                        r["sec"] = a
                    else:
                        r["ok"] = False
                elif r["kind"] in ("mandatory_at", "squadron", "section_count"):
                    r["sec"] = [si]
                    if r.get("needs_guard"):
                        # The sentence must speak of this section, otherwise
                        # section-level counting would measure the wrong thing.
                        tt = {w for w in re.findall(r"[a-z]+", s["title"].lower())
                              if len(w) > 3 and w not in ("your", "fleet", "with")}
                        sw = set(re.findall(r"[a-z]+", sent.lower()))
                        if not (tt & sw):
                            r["ok"] = False
                    r.pop("needs_guard", None)
                if r["ok"]:
                    rules.append(r)
                else:
                    text.append(sent)
        # the same rule may repeat in a paragraph -> clean the duplicates
        seen, uniq = set(), []
        for r in rules:
            k = json.dumps({x: v for x, v in r.items() if x != "src"}, sort_keys=True)
            if k in seen:
                continue
            seen.add(k)
            uniq.append(r)
        rules = uniq


        text = list(dict.fromkeys(text))
        rules, text = apply_rule_picks(Lx["name"], s["title"], titles,
                                       rules, text)

        # Wholly narrative sections out.
        for fx in LORE_SECTIONS:
            if fx["list_has"] in Lx["name"] and s["title"] == fx["sec"]:
                fx["_used"] = fx.get("_used", 0) + 1
                text = []

        # Price table rows off the start of sentences.
        text = [x for x in (strip_price_rows(t) for t in text) if x]

        ents = []
        for e in s["entries"]:
            fx = FIXES.get((Lx["name"], e["label"]))
            if fx:
                e = dict(e)
                e.update(fx)
            ents.append(dict(l=e["label"], r=e.get("ref"), p=e.get("pts"),
                         src_page=e.get("src_page"),
                             a=1 if e.get("add") else 0,
                             u=1 if e.get("upgrade") else 0,
                             mx=e.get("max"), nt=e.get("note")))
        # the heading's own count limit, e.g. "0-12 Cruisers"
        if s.get("hi") is not None:
            if any(k in Lx["name"] for k in HEAD_IS_SQUADRON):
                _HEAD_SQ_USED[0] += 1
                text.append(
                    "There is no restriction for what kinds or how many of what "
                    "type of skwadrons are in the fleet as long as no Warlord may "
                    "have more than one \u2019Uge Ship, which counts as a skwadron "
                    "by itself.")
                notes.append(
                    "Skwadron size, not a fleet total: the book prints "
                    "\u201c%s\u201d as the size of one skwadron (pg. 374)."
                    % (s.get("head", "") or s["title"]))
            else:
                rules.append(dict(kind="section_count", min=s["lo"], max=s["hi"],
                                  src=s.get("head", ""), sec=[si], ok=True, hdr=1))
        # The same upper limit from both the heading and the body text gives two
        # identical check rows. They are merged: what remains is
        # the section counter, but the source sentence is the book's full
        # sentence, because it says more than the bare heading.
        caps = [r for r in rules if r["kind"] == "cap"]
        heads = [r for r in rules if r["kind"] == "section_count"]
        if (len(caps) == 1 and len(heads) == 1
                and caps[0].get("max") == heads[0].get("max")):
            heads[0]["src"] = caps[0].get("src") or heads[0].get("src")
            rules = [r for r in rules if r is not caps[0]]

        for r in rules:
            stat[r["kind"]] += 1
        stat["text"] += len(text)
        apply_entry_adds(Lx["name"], s["title"],
                         " ".join(s["rules"]), ents)
        apply_entry_limits(Lx["name"], s["title"],
                           " ".join(s["rules"]), ents)
        # Whose row's description each sentence is. A name and not an index: indexes
        # move when duplicates are weeded out and rows are added.
        own = None
        desc = s.get("desc") or {}
        if desc:
            dkeys = [(lab, _nkey(dt)) for lab, dt in desc.items()]
            own = []
            for t in text:
                k = _nkey(t)
                own.append(next((lab for lab, dt in dkeys
                                 if k and dt and k in dt), None))
            if not any(own):
                own = None
            else:
                _OWN_HITS[0] += sum(1 for x in own if x)
        sec_out = dict(t=s["title"], rules=rules, text=text, notes=notes, ents=ents)
        if own:
            sec_out["own"] = own
        secs.append(sec_out)
    # The same sentence twice in the same list. The FLEET RULES block picks the whole
    # page range, so it repeats what is already under its own heading -
    # for example the Tau list's SQUADRONS sentences were in both. The more precise
    # place wins, i.e. the duplicate is removed from the FLEET RULES block.
    # own runs parallel to text, so both must be weeded
    # at the same time - otherwise the owners shift to the wrong sentences.
    def _trim(x, wanted):
        own = x.get("own")
        if own is None:
            x["text"] = wanted
            return
        pairs = [(t, o) for t, o in zip(x["text"], own) if t in wanted]
        x["text"] = [t for t, _ in pairs]
        x["own"] = [o for _, o in pairs]
        if not any(x["own"]):
            x.pop("own", None)

    fr = [i for i, x in enumerate(secs) if x["t"].startswith("FLEET RULES")]
    if fr:
        i = fr[0]
        elsewhere = {t for j, x in enumerate(secs) if j != i for t in x["text"]}
        _trim(secs[i], [t for t in secs[i]["text"] if t not in elsewhere])
    # The rest of the repeats: the same sentence in two other sections, the first stays.
    seen = set()
    for x in secs:
        keep = []
        for t in x["text"]:
            if t in seen:
                continue
            seen.add(t)
            keep.append(t)
        _trim(x, keep)

    # A faction's shared rules are in the book once, before the faction's
    # first list. The following lists of the same faction would be left without them,
    # although the rules concern them: 20 lists of 32 were without. The block is
    # inherited from the previous list - the lists are in page order and
    # each faction's first gets its own block, so the previous one is
    # always of the same faction.
    if secs and secs[0]["t"].startswith("FLEET RULES"):
        _SHARED[0] = secs[0]
    elif _SHARED[0] is not None:
        _sh = copy.deepcopy(_SHARED[0])
        # Item 8: inheritance brings visible text, not rules. A rule's
        # section indexes (pick, unit_pick, up_sec) are the SOURCE LIST's, and
        # an enforced rule is recorded per list (RULE_PICKS late).
        _sh["rules"] = []
        secs.insert(0, _sh)
        # raws is indexed by section: it is kept the same length. An empty
        # item, so that inheritance fires no prose rule again
        # but only adds visible text.
        raw_here.insert(0, "")
        pg_here.insert(0, [])
        _INHERITED.append(Lx["name"])
        # The section indexes move by one. Attachment targets (at) are not
        # counted yet, so only the rules' fields need the move.
        # NOTE: a section index is also inside the pick lists' dicts, and
        # forgetting them broke Bastion Fleets' battleship ratio
        # silently - the index still pointed at an existing but wrong
        # section, so not a single checker complained.
        for sec in secs[1:]:
            for r in sec["rules"]:
                for k in ("sec", "allow_sec", "per_sec"):
                    if k in r:
                        r[k] = [i + 1 for i in r[k]]
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        for p in r.get(k) or []:
                            p["sec"] += 1
                if r.get("exempt"):
                    for p in r["exempt"].get("cond_pick") or []:
                        p["sec"] += 1
                # at_least (spot check 18, J26): the same nested pick as exempt.
                if r.get("at_least"):
                    for p in r["at_least"].get("cond_pick") or []:
                        p["sec"] += 1

    # Guard: every pick must point to the section that was requested in the
    # RULE_PICKS table. Runs only when the section list is
    # final, i.e. after all the moves.
    _titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec["rules"]:
            groups = [(k, r.get(k) or []) for k in list(r) if k == "pick" or k.endswith("_pick")]
            if r.get("exempt"):
                groups.append(("exempt.cond_pick", r["exempt"].get("cond_pick") or []))
            if r.get("at_least"):
                groups.append(("at_least.cond_pick", r["at_least"].get("cond_pick") or []))
            for k, picks in groups:
                for p in picks:
                    want = p.pop("_t", None)
                    if want is None:
                        continue
                    assert _titles[p["sec"]] == want, (
                        "%s / %s: %s points to section %r, it should be %r"
                        % (Lx["name"], sec["t"], k, _titles[p["sec"]], want))
                    _PICKS_OK[0] += 1

    # The names of the section indexes are kept now that this list's sections are
    # in their final order. Later phases (removing foreign sections,
    # late rule fixes) are checked against these.
    stamp_section_names(secs, Lx["name"])

    lists_out.append(dict(nm=Lx["name"], pg=Lx["start"], secs=secs))
    raw_rules.append(raw_here)
    raw_pages.append(pg_here)
