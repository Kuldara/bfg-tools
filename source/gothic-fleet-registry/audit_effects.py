# -*- coding: utf-8 -*-
"""Mitka aluksen optiot lupaavat profiilimuutosta ilman mallia?

Optio, joka muuttaa vain summaa mutta ei profiilia, on pahin vikaluokka
tassa projektissa: kortti nayttaa uskottavalta ja on vaara. Nain kavi
Dominatorin halvemmalle aseistukselle, Hammerin tornipaivitykselle ja
Warspheren runkomuutoksille ennen kuin niille lisattiin vaikutuskentat.

Tama tyokalu EI paata saantoa. Se tekee tarkistusjonon: lukee jokaisen
option tekstin, katsoo lupaako se statsi- tai asemuutosta, ja kysyy onko
optiolla vastaava rakenteinen vaikutus. Paatoksen tekee ihminen kirjasta,
ja tulos kirjataan referenssi/optiot.json:iin (ks. docs/RULES_TRUTH.md).

Vaikutuskentat:
    mod   statsimuutos      {"tu": 1}          torneja +1
    swp   aserivin muutos   {"f": ..., "rg": ...}
    sw    vaihtoehtoinen aserivi
    aws   aserivin valinta ryhmasta (grp/gmax)
    qty   toistettava optio {"max": 3}

Aja:  python audit_effects.py            yhteenveto + jono
      python audit_effects.py -v         koko jono
      python audit_effects.py --json     koneluettava (acceptance.py kayttaa)

Palauttaa 1, jos jonossa on rivaja joita ei ole kuitattu tarkistetuiksi
tiedostossa referenssi/optiot.json.
"""
import json, io, re, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))

VERBOSE = "-v" in sys.argv
AS_JSON = "--json" in sys.argv

# Sanat, jotka kirjassa tarkoittavat muutosta ALUKSEN PROFIILIIN.
STAT_WORDS = re.compile(
    r"\b(turret|shield|hit ?points?|\bHP\b|armour|armor|speed|turn rate|may turn)\b", re.I)
WEAPON_WORDS = re.compile(
    r"\b(lance|weapons? batter|torpedo|launch bay|nova cannon|range|firepower"
    r"|strength|prow|dorsal|broadside)\b", re.I)

STAT_FIELDS = ("mod", "set")
WEAPON_FIELDS = ("sw", "swp", "aws")
ANY_FIELDS = STAT_FIELDS + WEAPON_FIELDS + ("qty",)

# Kuitatut: optio on luettu kirjasta ja todettu joko mallinnetuksi tai
# sellaiseksi, ettei se muuta profiilia. Tiedosto saa puuttua.
ACK = {}
ACK_INVALID = []
EFFECT_KEYS = {"mod", "set", "swp", "sw", "add", "del", "qty"}
ackfile = os.path.join(HERE, "referenssi", "optiot.json")


def ack_error(row):
    """Sama sopimus kuin referenssi/optiot.schema.json, tarkistettuna kasin
    (jsonschema-kirjastoa ei ole). Rivi, joka ei tayta sopimusta, EI kuittaa
    mitaan - se olisi tapa vaientaa jono ilman kirjaa."""
    if not isinstance(row, dict):
        return "ei olio"
    for k in ("ship", "text", "page", "effect", "why", "verified"):
        if k not in row:
            return "puuttuu kentta %r" % k
    if not isinstance(row["ship"], str) or len(row["ship"]) < 3:
        return "ship ei kelpaa"
    if not isinstance(row["text"], str) or len(row["text"]) < 8:
        return "text ei kelpaa"
    if not isinstance(row["page"], int) or not 1 <= row["page"] <= 600:
        return "page ei ole sivunumero"
    if row["verified"] is not True:
        return "verified ei ole true"
    if not isinstance(row["why"], str) or len(row["why"]) < 15:
        return "why puuttuu tai on liian lyhyt"
    eff = row["effect"]
    if eff is not None:
        if not isinstance(eff, dict) or not eff:
            return "effect ei ole olio eika null"
        bad = set(eff) - EFFECT_KEYS
        if bad:
            return "effect: tuntematon avain %s" % sorted(bad)
    # modelled_by: vaikutus on jo datassa talla kentalla; auditin loytamat
    # sanat eivat ole erillinen muutos. Sallitut arvot = datan kentat.
    mb = row.get("modelled_by")
    if mb is not None and mb not in ("sw", "aws", "mod", "set", "swp", "add", "qty"):
        return "modelled_by: tuntematon kentta %r" % mb
    return None


if os.path.exists(ackfile):
    for row in json.load(io.open(ackfile, encoding="utf-8")).get("options", []):
        err = ack_error(row)
        if err:
            ACK_INVALID.append((row.get("ship", "?") if isinstance(row, dict) else "?", err))
            continue
        ACK.setdefault(row["ship"], []).append(row)


def acked(ship, text):
    """Kuittaus osuu, kun sen teksti on option tekstin ALKU. Optioteksti voi
    olla pitka; riittaa etta kirjattu alku on tasmalleen kirjan mukainen
    (vahintaan 8 merkkia, ks. skeema)."""
    for row in ACK.get(ship, []):
        if text.startswith(row["text"]):
            return row
    return None


def classify(sh, o):
    """Palauta (tarvitseeko_statsin, tarvitseeko_aseen)."""
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
        if key in seen_keys:      # sama alus usealla sivuvariantilla
            continue
        seen_keys.add(key)
        ack = acked(sh.get("nm", ""), o.get("t", ""))
        queue.append(dict(
            page=str(sh.get("pg") or pg), ship=sh.get("nm", ""),
            text=o.get("t", ""), cost=o.get("c"),
            needs="statsit+aseet" if (need_stat and need_wep)
                  else ("statsit" if need_stat else "aseet"),
            acked=ack is not None,
            note=(ack or {}).get("why", "")))

open_q = [q for q in queue if not q["acked"]]

# Kuittaus on kirjan lukemisen tallenne myos silloin, kun optio on jo
# toteutettu eika ole enaa jonossa. Kuittaus, joka ei osu YHTEENKAAN
# optioon, on kirjoitusvirhe - ja se on kerrottava, muuten se vaikenee.
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
    print("HYLATTYJA KUITTAUKSIA referenssi/optiot.json:ssa: %d" % len(ACK_INVALID))
    print("  (eivat kuittaa mitaan; sopimus: referenssi/optiot.schema.json)")
    for ship, err in ACK_INVALID[:10]:
        print("   %-34s %s" % (ship[:34], err))
    print()
if ack_orphans:
    print("KUITTAUKSIA, JOTKA EIVAT OSU YHTEENKAAN OPTIOON: %d  (kirjoitusvirhe?)"
          % len(ack_orphans))
    for ship, t in ack_orphans[:10]:
        print("   %-34s %s" % (ship[:34], t))
    print()

print("Aluksen omia optioita          %4d" % total)
print("  joilla rakenteinen vaikutus  %4d   %s"
      % (modelled, " ".join("%s=%d" % kv for kv in sorted(by_field.items()))))
print()
print("TARKISTUSJONO: teksti lupaa profiilimuutosta, mallia ei ole")
print("  uniikkeja rivaja              %4d" % len(queue))
print("  kuitattu referenssi/optiot.json %2d" % (len(queue) - len(open_q)))
print("  avoinna                       %4d" % len(open_q))
print("  kuitattu JA toteutettu        %4d   (kirjan lukemisen tallenne, ei enaa jonossa)"
      % ack_implemented)
print()
kinds = collections.Counter(q["needs"] for q in open_q)
for k, n in sorted(kinds.items()):
    print("   %-16s %3d" % (k, n))
print()
show = open_q if VERBOSE else open_q[:14]
for q in show:
    print("  s.%-5s %-30s %5s  %s"
          % (q["page"], q["ship"][:30],
             "" if q["cost"] is None else q["cost"], q["text"][:64]))
if not VERBOSE and len(open_q) > len(show):
    print("  ... ja %d muuta (-v nayttaa kaikki)" % (len(open_q) - len(show)))
print()
print("avoimia: %d" % len(open_q))
sys.exit(1 if open_q else 0)
