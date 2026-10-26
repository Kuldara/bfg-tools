import { canvas, current, draw, selected, setCurrent, setSelected, view } from "./chart.js";
import { KIND, RULES } from "../../../packages/battlezone/core.js";
import { resetEvents } from "./events.js";

export const $ = function (id) { return document.getElementById(id); };

export function renderLegend() {
  const items = [
    ['ast', 'Asteroid field'], ['gas', 'Gas & dust'], ['pln', 'Planet'],
    ['moon', 'Moon'], ['rift', 'Warp rift'], ['sun', 'Sunward edge']
  ];
  $('legend').innerHTML = items.map(function (i) {
    return '<span style="color:var(--' + i[0] + ')"><i></i><span style="color:var(--ink-2)">' +
      i[1] + '</span></span>';
  }).join('') +
  '<span style="color:var(--ink-3)">dashed circle = gravity well · numbers = area</span>';
}

export function render(result) {
  setCurrent(result);
  const m = result.meta;

  $('seedEcho').textContent = 'seed ' + m.seed;

  $('zoneDie').textContent = m.zoneDie ? 'D6 ' + m.zoneDie : 'set';
  $('zoneName').textContent = m.zone.name;
  $('zoneNote').textContent = m.zone.blurb + ' (p. ' + m.zone.page + ')';

  $('sunDie').textContent = 'D6 ' + m.sunDie;
  $('sunName').textContent = m.sunEdge + ' edge';

  const chips = [];
  const c = m.counters;
  if (c.asteroid) chips.push(['Asteroid fields', c.asteroid]);
  if (c.gas)      chips.push(['Gas & dust', c.gas]);
  if (c.planet)   chips.push(['Planets', c.planet]);
  if (c.moon)     chips.push(['Moons', c.moon]);
  if (c.rift)     chips.push(['Warp rifts', c.rift]);
  if (m.events.flare)     chips.push(['Solar flares', m.events.flare]);
  if (m.events.radiation) chips.push(['Radiation bursts', m.events.radiation]);
  chips.push(['Areas', m.cols + ' × ' + m.rows]);
  $('tally').innerHTML = chips.map(function (x) {
    return '<b><s>' + x[1] + '</s> ' + x[0] + '</b>';
  }).join('');

  const pieces = result.terrain.filter(function (t) { return t.kind !== 'ring'; });
  $('pieceCount').textContent = pieces.length + (pieces.length === 1 ? ' piece' : ' pieces');

  $('manifest').innerHTML = pieces.length ? pieces.map(function (t) {
    let spec = t.dims;
    if (t.kind === 'planet' || t.kind === 'moon') spec += ' · gravity well ' + t.gravity + ' cm';
    spec += ' · at ' + Math.round(t.x) + ', ' + Math.round(t.y) + ' cm';
    let rings = '';
    if (t.rings) {
      rings = t.rings.map(function (r, i) {
        return '<span class="ring">ring ' + (i + 1) + ': ' +
          (r.kind === 'gas' ? 'gas and dust' : 'asteroids') + ', ' + r.wide +
          ' cm wide, ' + r.gap + ' cm out</span>';
      }).join('');
    }
    const label = t.kind === 'planet'
      ? t.size.charAt(0).toUpperCase() + t.size.slice(1) + ' planet'
      : (t.kind === 'moon' ? 'Moon of ' + t.of : t.name);
    return '<div class="mrow' + (selected === t ? ' sel' : '') + '" data-id="' + t.id + '">' +
      '<span class="mid" style="color:var(--' + KIND[t.kind].colour + ')">' + t.id + '</span>' +
      '<span><span class="mname">' + label + '</span>' +
      '<span class="mspec">' + spec + rings + '</span></span>' +
      '<button type="button" class="qm" data-help="' + t.id + '" aria-pressed="' +
        (selected === t) + '" aria-label="What a ' + label.toLowerCase() +
        ' does in play">?</button></div>';
  }).join('')
    : '<div class="mrow" style="grid-template-columns:1fr"><span class="mspec">' +
      'Empty void. Every area rolled under the threshold — legal, and rarer than it feels.' +
      '</span></div>';

  for (const b of $('manifest').querySelectorAll('button[data-help]')) {
    b.onclick = function (e) {
      const id = e.currentTarget.dataset.help;
      const piece = current.terrain.find(function (t) { return t.id === id; });
      showRules(selected === piece ? null : piece);
    };
  }

  $('log').innerHTML = result.log.map(function (l) {
    return '<div class="' + l.cls + '">' + l.text + '</div>';
  }).join('');

  showRules(null);          // a fresh map explains its battlezone, and draws
  resetEvents(true);
}

/* ══════════════════════════════════════════════════ THE RULES PANEL
   One panel, one subject. With nothing selected it explains the battlezone
   that was rolled, because that is the thing on screen a reader is least
   likely to know — a Flare Region changes your gunnery before a shot is
   fired. Selecting a template swaps it for that template's rules. */

export function ruleHtml(r) {
  return (r.lede ? '<p class="lede">' + r.lede + '</p>' : '') +
    r.groups.map(function (g) {
      return '<p class="grp">' + g.head + ' <span class="cite">' + g.cite + '</span></p><ul>' +
        (g.raw || g.items.map(function (i) { return '<li>' + i + '</li>'; }).join('')) + '</ul>';
    }).join('');
}

export function zoneRules(m) {
  const sunward = m.zone.n <= 3;
  const produces = m.zone.rows.map(function (row, i) {
    return '<li><b>' + (i + 1) + '</b> — ' + row.text + '</li>';
  }).join('');
  return {
    title: m.zone.name,
    page: 'p. ' + m.zone.page,
    lede: m.zone.blurb + ' This is the one generator every populated area was rolled on, ' +
      'picked once for the whole battlefield.',
    groups: [
      { head: 'What this zone can produce', cite: 'p. ' + m.zone.page, items: [], raw: produces },
      sunward
        ? { head: 'Fighting sunward applies here', cite: 'p. 114', items: [
            'The star is close enough to matter. Any firing toward the <b>' + m.sunEdge +
              ' edge</b> doubles the range column shifts.',
            'At <b>15 cm or under</b>, two shifts <b>left</b> instead of one — the target is silhouetted.',
            'At <b>over 30 cm</b>, two shifts <b>right</b> instead of one — the photosphere blinds sensors.',
            'Judge it with the bearing compass laid over the firing ship, arrows parallel to that edge.'
          ] }
        : { head: 'Fighting sunward does not apply here', cite: 'p. 114', items: [
            'In the Primary Biosphere, Outer Reaches and Deep Space the light from the distant ' +
              'star has no effect on combat. The sunward edge still decides how the bands were laid out.'
          ] }
    ]
  };
}

export function showRules(piece) {
  setSelected(piece || null);
  const m = current.meta;
  let r;
  if (selected) {
    r = RULES[selected.kind];
    if (selected.kind === 'planet') {
      r = Object.assign({}, r, {
        title: selected.size.charAt(0).toUpperCase() + selected.size.slice(1) +
          ' planet — ' + selected.id
      });
    } else {
      r = Object.assign({}, r, { title: r.title + ' — ' + selected.id });
    }
  } else {
    r = zoneRules(m);
  }
  $('rulesTitle').textContent = r.title;
  $('rulesPage').textContent = r.page;
  $('rules').innerHTML = ruleHtml(r);

  for (const b of document.querySelectorAll('.manifest button[data-help]')) {
    const on = !!selected && b.dataset.help === selected.id;
    b.setAttribute('aria-pressed', String(on));
    b.parentElement.classList.toggle('sel', on);
  }
  $('zoneHelp').setAttribute('aria-pressed', String(!selected));
  draw();
}

export function showFixedRules(key) {
  setSelected(null);
  const r = RULES[key];
  $('rulesTitle').textContent = r.title;
  $('rulesPage').textContent = r.page;
  $('rules').innerHTML = ruleHtml(r);
  for (const b of document.querySelectorAll('.manifest button[data-help]')) {
    b.setAttribute('aria-pressed', 'false');
    b.parentElement.classList.remove('sel');
  }
  $('zoneHelp').setAttribute('aria-pressed', 'false');
  draw();
}

/* a click on the map picks the smallest template under the finger */
canvas.addEventListener('click', function (e) {
  if (!current || !view) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left - view.ox) / view.s;
  const y = (e.clientY - r.top - view.oy) / view.s;
  let best = null, bestArea = Infinity;
  for (const t of current.terrain) {
    if (t.kind === 'ring') continue;
    const a = -(t.angle || 0), dx = x - t.x, dy = y - t.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    const pad = 6 / view.s;                       // a forgiving target on a phone
    const rx = t.rx + pad, ry = t.ry + pad;
    if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) {
      const area = t.rx * t.ry;
      if (area < bestArea) { best = t; bestArea = area; }
    }
  }
  showRules(best === selected ? null : best);
});

/* ═════════════════════════════════════════════════ START-OF-TURN EVENTS
   Solar flares and radiation bursts are not templates — the generator hands
   you a count, and you roll that many D6 at the start of every turn. These
   rolls are the players' own, live at the table, so they do not come from
   the map seed. */
