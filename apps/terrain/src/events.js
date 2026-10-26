import { current } from "./chart.js";
import { EVENT_RULES } from "../../../packages/battlezone/core.js";
import { $ } from "./rules.js";

export let ev = { turn: 1, flareSpent: false, rolls: {} };

export function d6() { return 1 + Math.floor(Math.random() * 6); }

export function renderEvents() {
  const m = current.meta, e = m.events;
  const any = e.flare || e.radiation;
  $('eventsCard').hidden = !any;
  if (!any) return;
  $('turnNo').textContent = 'turn ' + ev.turn;

  const parts = [];
  for (const key of ['flare', 'radiation']) {
    const n = e[key];
    if (!n) continue;
    const R = EVENT_RULES[key];
    const spent = key === 'flare' && ev.flareSpent;
    const roll = ev.rolls[key];

    let out = '';
    if (spent && !roll) {
      out = '<div class="evout quiet">Already happened this game. Stop rolling for it.</div>';
    } else if (roll) {
      out = '<div class="evroll">' + roll.dice.map(function (d) {
        return '<span class="pip' + (d >= R.trigger ? ' hit' : '') + '">' + d + '</span>';
      }).join('') + '</div>';
      if (roll.hit) {
        let body = '<span class="big">' + R.name + '</span>';
        if (key === 'radiation') {
          body += '<div style="margin-top:4px">Interference level <b>D6 = ' + roll.level +
            '</b> → every ship on the table is at <b>−' + roll.level +
            ' Leadership</b> for the rest of this turn.</div>';
        }
        body += '<ul>' + R.effects.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
        if (key === 'radiation' && roll.hits > 1) {
          body += '<p class="evhow">' + roll.hits + ' dice came up ' + R.triggerText +
            ', but only one burst happens in a turn.</p>';
        }
        out += '<div class="evout">' + body + '</div>';
      } else {
        out += '<div class="evout quiet">No ' + R.name.toLowerCase() + ' this turn.</div>';
      }
    }

    parts.push(
      // dim a spent flare only once its result has been cleared — the turn it
      // fires is the turn its effects most need to be legible
      '<div class="ev' + (spent && !roll ? ' spent' : '') + '">' +
        '<div class="evhead"><span class="evname">' + R.name + ' × ' + n + '</span>' +
          '<span class="cite">' + R.page + '</span></div>' +
        '<p class="evhow">' + R.how + '</p>' +
        '<div class="evroll">' +
          '<button type="button" data-ev="' + key + '"' + (spent ? ' disabled' : '') + '>Roll ' +
            n + 'D6</button>' +
          '<span class="evhow">' + R.triggerText + ' triggers</span>' +
        '</div>' + out +
      '</div>');
  }
  $('events').innerHTML = parts.join('');

  for (const b of $('events').querySelectorAll('button[data-ev]')) {
    b.onclick = function (e2) {
      const key = e2.currentTarget.dataset.ev;
      const R = EVENT_RULES[key];
      const n = current.meta.events[key];
      const dice = [];
      for (let i = 0; i < n; i++) dice.push(d6());
      const hits = dice.filter(function (d) { return d >= R.trigger; }).length;
      const roll = { dice: dice, hits: hits, hit: hits > 0 };
      if (roll.hit && key === 'radiation') roll.level = d6();
      if (roll.hit && key === 'flare') ev.flareSpent = true;
      ev.rolls[key] = roll;
      renderEvents();
    };
  }
}

export function resetEvents(newGame) {
  ev.rolls = {};
  if (newGame) { ev.turn = 1; ev.flareSpent = false; }
  renderEvents();
}

/* ════════════════════════════════════════════════════════════════ CONTROLS */
