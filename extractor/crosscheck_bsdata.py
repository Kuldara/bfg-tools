# -*- coding: utf-8 -*-
"""Cross-checks our own data against the BSData/battlefleetgothic catalogues.

    python crosscheck_bsdata.py            # uses the cache, downloads if empty
    python crosscheck_bsdata.py --refresh  # fetches fresh files from GitHub

WHY THIS IS USEFUL

audit.py compares our data back with the source PDF. It proves the extraction
matches the PDF, but not that the PDF was read right where
the table geometry is awkward. BSData is a SECOND, fully independent
hand-entered source for the same ships, so it reveals exactly the places
where our way of reading could have gone wrong.

WHAT THIS IS NOT

BSData follows the original BFG compendium (2010 + FAQ), our data
the Remastered WiP. Prices and some values differ ON PURPOSE, and the
difference is not an error. This cannot overrule the source PDF - it only tells where
the two sources differ, so they can be looked at by hand.

Source: https://github.com/BSData/battlefleetgothic (community maintained,
BattleScribe's datafile repo). The files are fetched into the cache
bsdata_cache/, which is not needed to run the apps - only for this.
"""
import io, json, os, re, sys, glob, collections
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = books.BSDATA
RAW = "https://raw.githubusercontent.com/BSData/battlefleetgothic/master/"
FILES = ["Adeptus_Mechanicus.cat", "Battlefleet_Gothic.gst", "Chaos.cat",
         "Dark Eldar.cat", "Eldar.cat", "Imperial Heresy Era.cat",
         "Imperium.cat", "Inquisition.cat", "Necron.cat", "Orks.cat",
         "Pirates and Wolf Packs.cat", "Space Marines.cat", "Tau.cat",
         "Tyranid.cat"]


def fetch(force=False):
    import urllib.request, urllib.parse
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    for f in FILES:
        dst = os.path.join(CACHE, f)
        if os.path.exists(dst) and not force:
            continue
        url = RAW + urllib.parse.quote(f)
        sys.stdout.write("  fetching %s ... " % f)
        sys.stdout.flush()
        with urllib.request.urlopen(url, timeout=60) as r:
            data = r.read()
        io.open(dst, "wb").write(data)
        print("%d kt" % (len(data) // 1024))


# ------------------------------------------------------------------ XML helpers
NS = re.compile(r"^\{[^}]*\}")


def tag(e):
    return NS.sub("", e.tag)


def kids(e, name):
    return [c for c in e if tag(c) == name]


def own_profiles(e):
    """Only this entry's own profiles; e.iter() would mix the parent and the child."""
    out = []
    for h in kids(e, "profiles"):
        out += kids(h, "profile")
    return out


def chars(p):
    d = {}
    for h in kids(p, "characteristics"):
        for ch in h:
            d[ch.get("name")] = (ch.text or "").strip()
    return d


def walk(e, out=None):
    out = [] if out is None else out
    out.append(e)
    for c in e:
        walk(c, out)
    return out


def cost_of(e):
    for h in kids(e, "costs"):
        for x in h:
            if (x.get("name") or "").strip().lower() in ("pts", "points"):
                try:
                    return int(float(x.get("value")))
                except (TypeError, ValueError):
                    return None
    return None


def clean(n):
    n = re.sub(r"\s*Profile$", "", str(n or "").strip(), flags=re.I)
    return re.sub(r"\s+", " ", n)


# --------------------------------------------------------------- reading BSData
def read_bsdata():
    """{name: [variant, ...]} and {normalised choice: {prices}}."""
    ships, picks = {}, collections.defaultdict(set)
    for path in sorted(glob.glob(os.path.join(CACHE, "*.cat")) +
                       glob.glob(os.path.join(CACHE, "*.gst"))):
        root = ET.parse(path).getroot()
        for e in walk(root):
            if tag(e) not in ("selectionEntry", "sharedSelectionEntry"):
                continue
            c = cost_of(e)
            pn = pick_key(e.get("name"))
            if pn and c is not None:
                picks[pn].add(c)

            unit, arms = None, []
            for p in own_profiles(e):
                tn = p.get("typeName") or ""
                if tn == "Unit" and unit is None:
                    unit = (p.get("name"), chars(p))
                elif tn == "Armament":
                    arms.append((p.get("name"), chars(p)))
            if unit and not arms:
                # optional weapons are often in child entries
                for ch in walk(e)[1:]:
                    if tag(ch) not in ("selectionEntry", "sharedSelectionEntry"):
                        continue
                    if any((p.get("typeName") or "") == "Unit"
                           for p in own_profiles(ch)):
                        continue                 # a ship of its own, not this one's weapon
                    for p in own_profiles(ch):
                        if (p.get("typeName") or "") == "Armament":
                            arms.append((p.get("name"), chars(p)))
            if not unit:
                continue
            rec = dict(st=unit[1], pts=c, src=os.path.basename(path),
                       aw=[[clean(a[0]), a[1].get("Range/Speed", ""),
                            a[1].get("Firepower/Str", ""),
                            a[1].get("Fire Arc", "")] for a in arms])
            bucket = ships.setdefault(clean(unit[0]).lower(), [])
            twin = next((v for v in bucket
                         if v["st"] == rec["st"] and v["aw"] == rec["aw"]), None)
            if twin is None:
                bucket.append(rec)
            elif twin["pts"] is None:
                twin["pts"] = rec["pts"]
    return ships, picks


# ------------------------------------------------------------- normalisoinnit
STOP = {"class", "the", "of", "and", "a", "an", "ship", "vessel", "craft",
        "battleship", "cruiser", "escort", "destroyer", "frigate", "raider",
        "heavy", "light", "grand", "attack", "assault", "gunship", "ramship",
        "carrier", "transport", "star", "starship", "hulk", "rok", "kroozer",
        "battlekroozer", "battlecruiser", "monastery", "defence", "platform",
        "profile", "configuration"}


def name_key(n):
    # A name in brackets is exactly the distinguishing part, not something to remove.
    # The apostrophe is removed entirely: the sources have both ' and U+2019,
    # and without this "Or'es El'leath" and "Or’Es El’Leath" would be
    # different names.
    n = str(n or "").lower().replace("’", "").replace("'", "")
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    return frozenset(w for w in n.split() if len(w) > 2 and w not in STOP)


def pick_key(t):
    """An extra purchase's name made comparable: 'One extra re-roll' = 'One Re-roll'."""
    t = re.sub(r"\(.*?\)", " ", str(t or "").lower())
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\bextra\b|\badditional\b|\bthe\b", " ", t)
    t = re.sub(r"\bre rolls?\b|\brerolls\b", "reroll", t)
    return re.sub(r"\s+", " ", t).strip()


# The same ship under a different name. Every pair has been checked by hand by comparing
# the whole stats line; in all of these it matches.
ALIAS = {
    "103": "seditio opprimere",
    "258": "scion",
    "260": "wage",
    "262": "terminus",
    "264": "slaverer",
    "329": "flame of asuryan",
    "383": "ork lite kroozer",
    "405": "necron cairn class tombship",
    "435": "tyranid kraken",
    "436": "tyranid vanguard drone ship",
    "491": "nicassar dhow",
    "492": "nicassar caravan",
    "493": "nicassar rig",
    "494": "kroot warsphere",
}

# Names that resemble each other but are a DIFFERENT ship. Without this they
# would produce mere noise.
NOT_SAME = {
    "104": "Space Marine Battle Barge != Chaos Battle Barge",
    "126": "Omnissiah's Victory is the book's named unique ship, "
           "BSData's 'Ark Mechanicus' the generic profile of the same class",
    "180": "Rogue Trader Cruiser != Rogue Trader Cargo Vessel",
    "192": "Armed Cargo Vessel != Cargo Transport (4/6 fields the same, "
           "but speed and turning differ - a different ship or a different version)",
    "476": "Il'Emaar (Courier) != Merchant (Il'Fannor)",
    "507": "Space Station != Haven Space Station",
}

NUM = re.compile(r"-?\d+")
NONE = {"none", "n/a", "-", "–", "—", ""}


def num(v):
    v = str(v or "").strip().lower()
    if v in NONE:
        return None
    m = NUM.search(v)
    return m.group(0) if m else None


def armour(v):
    # A note in brackets ("5+ (6+ Deflector)") is not an armour value.
    v = re.sub(r"\(.*?\)", " ", str(v or "").lower())
    got = re.findall(r"\d\+", v)
    return "/".join(sorted(set(got))) if got else None


FIELDS = [("hp", "Hits", num), ("sp", "Speed", num), ("tn", "Turns", num),
          ("sh", "Shields", num), ("ar", "Armour", armour),
          ("tu", "Turrets", num)]

POS = ["port", "starboard", "prow", "dorsal", "keel", "forward", "aft"]
FAMILY = [("nova", r"nova"), ("torpedo", r"torpedo|launcha"),
          ("launch", r"launch\s*bay"), ("lance", r"lance|phantom"),
          ("bombard", r"bombard"), ("battery", r"weapons?\s*batter|gunz|gun\b"),
          ("claw", r"claw|tentacle"), ("plasma", r"plasma|pyro|spine"),
          ("cannon", r"cannon"), ("missile", r"missile|railgun|ion")]


def weapon_key(name, ship_words):
    n = str(name or "").lower()
    for w in ship_words:
        n = re.sub(r"\b%s\b" % re.escape(w), " ", n)
    pos = next((p for p in POS if re.search(r"\b%s\b" % p, n)), "")
    fam = next((f for f, rx in FAMILY if re.search(rx, n)), "")
    return (pos, fam) if fam else None


# ------------------------------------------------------------------- comparison
def main():
    if "--refresh" in sys.argv or not os.path.isdir(CACHE):
        print("BSData files:")
        fetch("--refresh" in sys.argv)
        print()

    bs_ships, bs_picks = read_bsdata()
    mine = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"),
                             encoding="utf-8"))

    index, label = collections.defaultdict(list), {}
    for nm, variants in bs_ships.items():
        k = name_key(nm)
        if k:
            index[k] += variants
            label.setdefault(k, nm)

    st = collections.Counter()
    diffs, pts_diff, arm_missing, arm_extra, partial, missing, rejected = \
        [], [], [], [], [], [], []

    for key, sh in sorted(mine["ships"].items(), key=lambda x: str(x[0])):
        alias = ALIAS.get(str(key))
        cands = bs_ships.get(alias) if alias else index.get(name_key(sh["nm"]))
        if not cands:
            if str(key) in NOT_SAME:
                rejected.append((sh["pg"], sh["nm"], NOT_SAME[str(key)]))
                continue
            k = name_key(sh["nm"])
            # A shorter BSData name is valid if it has at least two
            # distinguishing words: "Explorer (Gal'leath)" matches our
            # configuration row. The other direction is not accepted, because
            # then the extra word would be on BSData's side and could
            # mean a different ship ("Chaos Battle Barge").
            hit = [(bk, v) for bk, v in index.items()
                   if len(bk) >= 2 and bk <= k]
            if len(hit) == 1:
                cands = hit[0][1]
                st["short"] += 1
            else:
                loose = [(bk, v) for bk, v in index.items()
                         if bk and (bk <= k or k <= bk)]
                if len(loose) == 1:
                    partial.append((sh["pg"], sh["nm"], label.get(loose[0][0])))
                else:
                    missing.append(sh["nm"])
                continue
        st["ships"] += 1
        if alias:
            st["alias"] += 1

        for mk, bk, f in FIELDS:
            want = f(sh.get(mk))
            if want is None:
                continue
            theirs = {f(v["st"].get(bk)) for v in cands}
            theirs.discard(None)
            if not theirs:
                continue
            st["fields"] += 1
            if want in theirs:
                st["same"] += 1
            else:
                diffs.append((sh["pg"], sh["nm"], bk, sh.get(mk), sorted(theirs)))

        costs = {v["pts"] for v in cands if v["pts"] is not None}
        if costs and sh.get("bp") is not None:
            st["pts"] += 1
            if sh["bp"] in costs:
                st["pts_same"] += 1
            else:
                pts_diff.append((sh["pg"], sh["nm"], sh["bp"], sorted(costs)))

        words = [w for w in re.sub(r"[^a-z ]", " ", sh["nm"].lower()).split()
                 if len(w) > 2]
        per_variant = []
        for v in cands:
            got = {weapon_key(a[0], words) for a in v["aw"]}
            got.discard(None)
            if got:
                per_variant.append(got)
        ours = {weapon_key(a[0], words) for a in sh["aw"]}
        ours.discard(None)
        if per_variant and ours:
            union = set().union(*per_variant)
            # a missing row is worth marking only if it is in ALL
            # variants: a single variant is often a different hull
            common = set.intersection(*per_variant)
            # The location qualifier is sometimes missing from one source ("Railgun
            # Battery" vs "Port Railgun battery"). Then only the weapon type is
            # compared, so that the naming style does not look like a missing weapon.
            our_fam = {f for _, f in ours}
            their_fam = {f for _, f in union}

            def covered(x, other, fams):
                return x in other or (not x[0] and x[1] in fams)

            arm_extra += [(sh["pg"], sh["nm"], x) for x in sorted(ours)
                          if not covered(x, union, their_fam)]
            arm_missing += [(sh["pg"], sh["nm"], x) for x in sorted(common)
                            if not covered(x, ours, our_fam)]

    # extra purchases and commanders
    up = collections.Counter()
    up_diff = []
    for L in mine["lists"]:
        for sec in L["secs"]:
            for e in sec["ents"]:
                if e.get("k") not in ("cmd", "up") or e.get("p") is None:
                    continue
                costs = bs_picks.get(pick_key(e["l"]))
                if not costs:
                    up["nohit"] += 1
                    continue
                up["checked"] += 1
                if e["p"] in costs:
                    up["same"] += 1
                else:
                    up_diff.append((L["nm"], sec["t"], e["l"], e["p"],
                                    sorted(costs), bool(e.get("prose"))))

    # ------------------------------------------------------------- report
    w = "=" * 84
    print(w)
    print("CROSS-CHECK: our data vs. BSData/battlefleetgothic")
    print(w)
    print("Ships compared: %d / %d  (same name %d, BSData's shorter name %d, "
          "name pair checked by hand %d)"
          % (st["ships"], len(mine["ships"]),
             st["ships"] - st["alias"] - st["short"], st["short"], st["alias"]))
    print("Not compared: different ship %d, partial hit %d, no hit %d"
          % (len(rejected), len(partial), len(missing)))
    print("Stat fields (Hits/Speed/Turns/Shields/Armour/Turrets): "
          "%d compared, SAME %d (%.1f %%), differ %d"
          % (st["fields"], st["same"],
             100.0 * st["same"] / max(1, st["fields"]), len(diffs)))
    print("Ship point prices: %d compared, same %d, differ %d"
          % (st["pts"], st["pts_same"], len(pts_diff)))
    print("Commanders and extra purchases: %d compared, same %d (%.0f %%), differ %d "
          "(no counterpart %d)"
          % (up["checked"], up["same"],
             100.0 * up["same"] / max(1, up["checked"]), len(up_diff),
             up["nohit"]))

    def block(title, rows, fmt):
        print()
        print(w)
        print("%s  (%d)" % (title, len(rows)))
        print(w)
        for r in rows:
            print("  " + fmt(r))

    block("1) STAT DIFFERENCES - look these up by hand in the source PDF", diffs,
          lambda r: "p.%-5s %-34s %-8s ours %-12s BSData %s"
          % (r[0], r[1].title()[:34], r[2], repr(r[3])[:12],
             "/".join(map(str, r[4]))))
    block("2) WEAPON ROW MISSING FROM OURS (all BSData variants have it)",
          arm_missing,
          lambda r: "p.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], " ".join(x for x in r[2] if x)))
    block("3) WEAPON ROW ONLY IN OURS (a Remastered addition or a swap option)",
          arm_extra,
          lambda r: "p.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], " ".join(x for x in r[2] if x)))
    block("4) SHIP POINT DIFFERENCES (different rules version)", pts_diff,
          lambda r: "p.%-5s %-36s ours %-6s BSData %s"
          % (r[0], r[1].title()[:36], r[2], "/".join(map(str, r[3]))))

    seen, uniq = set(), []
    for r in up_diff:
        k = (pick_key(r[2]), r[3], tuple(r[4]))
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    block("5) EXTRA PURCHASE POINT DIFFERENCES (different rules version)", uniq,
          lambda r: "%-26s %-22s %-26s ours %-5s BSData %-11s%s"
          % (r[0][:26], r[1][:22], r[2][:26], r[3],
             "/".join(map(str, r[4]))[:11], "  <- from prose" if r[5] else ""))
    block("6a) SIMILAR NAME, DIFFERENT SHIP - left uncompared on purpose",
          rejected, lambda r: "p.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], r[2]))
    block("6b) PARTIAL NAME HIT - not compared", partial,
          lambda r: "p.%-5s %-36s ~ %s"
          % (r[0], r[1].title()[:36], (r[2] or "").title()))
    block("7) UNKNOWN TO BSDATA - the Remastered book's own or differently named",
          [(n,) for n in missing], lambda r: r[0].title())

    print()
    print("Reminder: the differences are not errors. BSData is a different rules version; "
          "the source is always the PDF.")


if __name__ == "__main__":
    main()
