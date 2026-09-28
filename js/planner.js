// Keralam Travels - Trip Budget Planner
// 100% client-side. No network calls, no external pricing API.
(function () {
  var STYLE_BASE = { budget: 2500, comfort: 5500, luxury: 12000 };
  var STYLE_LABEL = { budget: 'Budget', comfort: 'Comfort', luxury: 'Luxury' };

  var DEST_META = {
    munnar:    { label: 'Munnar',           activities: ['Walk through a working tea estate and watch the plucking round', 'Sunset stop at Top Station or Echo Point', 'Short spice-garden walk with a local guide', 'Optional early trek toward Kolukkumalai for sunrise'] },
    alleppey:  { label: 'Alleppey (Backwaters)', activities: ['Overnight or day cruise on a converted houseboat', 'Village walk along the canal bunds', 'Toddy-shop lunch with fresh fish curry', 'Canoe ride through the narrow backwater channels'] },
    kochi:     { label: 'Kochi',            activities: ['Fort Kochi walking loop past the Chinese fishing nets', 'Evening Kathakali or Kalaripayattu show', 'Mattancherry Palace and the Jew Town spice lanes', 'Sunset at Marine Drive'] },
    kumarakom: { label: 'Kumarakom',         activities: ['Bird sanctuary walk at dawn', 'Backwater houseboat cruise on Vembanad Lake', 'Ayurvedic massage session at a lakeside resort', 'Village cycling tour'] },
    thekkady:  { label: 'Thekkady (Periyar)', activities: ['Periyar Lake boat safari', 'Spice plantation tour with tasting', 'Optional bamboo rafting or jungle trek', 'Evening Kalaripayattu or Kathakali show'] },
    wayanad:   { label: 'Wayanad',          activities: ['Chembra Peak or Banasura Sagar viewpoint hike', 'Edakkal Caves and rock-art walk', 'Wildlife safari at Muthanga or Tholpetty', 'Coffee and spice plantation walk'] },
    varkala:   { label: 'Varkala',          activities: ['Cliffside beach walk at sunrise', 'Free swimming session at the main beach', 'Ayurvedic massage at a clifftop centre', 'Sunset at Papanasam beach'] },
    kovalam:   { label: 'Kovalam',          activities: ['Lighthouse Beach morning walk', 'Surfing or bodyboarding lesson', 'Ayurvedic spa session', 'Sunset at Hawa Beach'] }
  };

  function seasonMultiplier(month) {
    var m = parseInt(month, 10);
    if (m === 12 || m === 1) return 1.25;
    if (m === 6 || m === 7 || m === 8) return 0.85;
    return 1.0;
  }
  function seasonLabel(month) {
    var mult = seasonMultiplier(month);
    if (mult > 1) return 'Peak season (Dec-Jan): +25% on stays';
    if (mult < 1) return 'Monsoon season (Jun-Aug): -15%, fewer crowds, some houseboat routes limited';
    return 'Regular season: standard pricing';
  }

  var ADDON_DEFS = {
    houseboat: { label: 'Houseboat cruise (1 night, per cabin for 2)', calc: function (t) { return Math.ceil(t / 2) * 9000; } },
    kathakali: { label: 'Kathakali show (per person)', calc: function (t) { return t * 500; } },
    massage:   { label: 'Ayurvedic massage (per person)', calc: function (t) { return t * 1800; } },
    cab:       { label: 'Airport cab (per 4 travelers, one way)', calc: function (t) { return Math.ceil(t / 4) * 1800; } }
  };

  function fmtINR(n) {
    n = Math.round(n);
    return '\u20B9' + n.toLocaleString('en-IN');
  }

  function distributeDays(destCount, totalDays) {
    var base = Math.floor(totalDays / destCount);
    var rem = totalDays % destCount;
    var out = [];
    for (var i = 0; i < destCount; i++) out.push(base + (i < rem ? 1 : 0));
    return out;
  }

  function buildPlan(state) {
    var dests = state.destinations.length ? state.destinations : ['alleppey'];
    var days = state.days;
    var travelers = state.travelers;
    var style = state.style;
    var perDayPerPerson = STYLE_BASE[style] * seasonMultiplier(state.month);
    var totalPersonDays = days * travelers;

    var stay = perDayPerPerson * 0.45 * totalPersonDays;
    var food = perDayPerPerson * 0.25 * totalPersonDays;
    var local = perDayPerPerson * 0.15 * totalPersonDays;
    var activities = perDayPerPerson * 0.15 * totalPersonDays;

    var addonsCost = 0;
    var addonLines = [];
    Object.keys(state.addons).forEach(function (key) {
      if (state.addons[key] && ADDON_DEFS[key]) {
        var cost = ADDON_DEFS[key].calc(travelers);
        addonsCost += cost;
        addonLines.push({ label: ADDON_DEFS[key].label, cost: cost });
      }
    });

    var grandTotal = stay + food + local + activities + addonsCost;
    var perPersonPerDay = grandTotal / totalPersonDays;

    var split = distributeDays(dests.length, days);
    var dayPlans = [];
    var dayCounter = 1;
    dests.forEach(function (destKey, idx) {
      var meta = DEST_META[destKey];
      var nDays = split[idx];
      for (var d = 0; d < nDays; d++) {
        var acts = meta.activities.slice(d % meta.activities.length ? 0 : 0);
        var bullets = [meta.activities[d % meta.activities.length], meta.activities[(d + 1) % meta.activities.length]];
        dayPlans.push({ day: dayCounter, destination: meta.label, bullets: bullets });
        dayCounter++;
      }
    });

    return {
      dayPlans: dayPlans,
      breakdown: [
        ['Stay', stay],
        ['Food', food],
        ['Local travel', local],
        ['Activities', activities],
        ['Add-ons', addonsCost]
      ],
      addonLines: addonLines,
      grandTotal: grandTotal,
      perPersonPerDay: perPersonPerDay,
      seasonNote: seasonLabel(state.month),
      state: state
    };
  }

  function planText(plan) {
    var s = plan.state;
    var lines = [];
    lines.push('Keralam Travels - Trip Budget Plan');
    lines.push('Destinations: ' + s.destinations.map(function (d) { return DEST_META[d].label; }).join(', '));
    lines.push('Duration: ' + s.days + ' days, ' + s.travelers + ' traveler(s), ' + STYLE_LABEL[s.style] + ' style');
    lines.push('');
    lines.push('DAY-BY-DAY');
    plan.dayPlans.forEach(function (dp) {
      lines.push('Day ' + dp.day + ' - ' + dp.destination);
      dp.bullets.forEach(function (b) { lines.push('  - ' + b); });
    });
    lines.push('');
    lines.push('COST BREAKDOWN');
    plan.breakdown.forEach(function (row) { lines.push(row[0] + ': ' + fmtINR(row[1])); });
    lines.push('Grand total: ' + fmtINR(plan.grandTotal));
    lines.push('Per person, per day: ' + fmtINR(plan.perPersonPerDay));
    lines.push('');
    lines.push('Planned at keralamtravels.in/planner');
    return lines.join('\n');
  }

  function renderPlan(root, plan) {
    var out = root.querySelector('[data-plan-output]');
    if (!out) return;
    out.hidden = false;

    var daysHtml = plan.dayPlans.map(function (dp) {
      return '<div class="result-day"><h4>Day ' + dp.day + ' \u2014 ' + dp.destination + '</h4><ul>' +
        dp.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></div>';
    }).join('');

    var rowsHtml = plan.breakdown.map(function (row) {
      return '<tr><td>' + row[0] + '</td><td>' + fmtINR(row[1]) + '</td></tr>';
    }).join('');

    out.querySelector('[data-days]').innerHTML = daysHtml;
    out.querySelector('[data-cost-rows]').innerHTML = rowsHtml;
    out.querySelector('[data-grand-total]').textContent = fmtINR(plan.grandTotal);
    out.querySelector('[data-per-day]').textContent = fmtINR(plan.perPersonPerDay) + ' per person, per day';
    out.querySelector('[data-season-note]').textContent = plan.seasonNote;

    var summary = plan.state.destinations.map(function (d) { return DEST_META[d].label; }).join(' + ') +
      ' \u00b7 ' + plan.state.days + ' days \u00b7 ' + plan.state.travelers + ' traveler(s) \u00b7 ' + STYLE_LABEL[plan.state.style];
    out.querySelector('[data-plan-summary]').textContent = summary;

    root._planText = planText(plan);
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initPlanner(root) {
    var destChips = root.querySelectorAll('[data-dest-chip]');
    var daysSlider = root.querySelector('[data-days-slider]');
    var daysValueEl = root.querySelector('[data-days-value]');
    var travelerValueEl = root.querySelector('[data-traveler-value]');
    var travelerMinus = root.querySelector('[data-traveler-minus]');
    var travelerPlus = root.querySelector('[data-traveler-plus]');
    var styleCards = root.querySelectorAll('[data-style-card]');
    var monthSelect = root.querySelector('[data-month]');
    var addonInputs = root.querySelectorAll('[data-addon]');
    var buildBtn = root.querySelector('[data-build-plan]');

    var state = {
      destinations: [],
      days: 5,
      travelers: 2,
      style: 'comfort',
      month: String(new Date().getMonth() + 1),
      addons: {}
    };

    destChips.forEach(function (chip) {
      if (chip.classList.contains('active')) state.destinations.push(chip.getAttribute('data-dest-chip'));
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-dest-chip');
        var idx = state.destinations.indexOf(key);
        if (idx > -1) { state.destinations.splice(idx, 1); chip.classList.remove('active'); }
        else { state.destinations.push(key); chip.classList.add('active'); }
      });
    });

    if (daysSlider) {
      state.days = parseInt(daysSlider.value, 10);
      daysValueEl.textContent = state.days;
      daysSlider.addEventListener('input', function () {
        state.days = parseInt(daysSlider.value, 10);
        daysValueEl.textContent = state.days;
      });
    }

    if (travelerMinus && travelerPlus) {
      travelerValueEl.textContent = state.travelers;
      travelerMinus.addEventListener('click', function () {
        state.travelers = Math.max(1, state.travelers - 1);
        travelerValueEl.textContent = state.travelers;
      });
      travelerPlus.addEventListener('click', function () {
        state.travelers = Math.min(20, state.travelers + 1);
        travelerValueEl.textContent = state.travelers;
      });
    }

    styleCards.forEach(function (card) {
      if (card.classList.contains('active')) state.style = card.getAttribute('data-style-card');
      card.addEventListener('click', function () {
        styleCards.forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state.style = card.getAttribute('data-style-card');
      });
    });

    if (monthSelect) {
      state.month = monthSelect.value;
      monthSelect.addEventListener('change', function () { state.month = monthSelect.value; });
    }

    addonInputs.forEach(function (input) {
      state.addons[input.getAttribute('data-addon')] = input.checked;
      input.addEventListener('change', function () {
        state.addons[input.getAttribute('data-addon')] = input.checked;
      });
    });

    function run() {
      if (!state.destinations.length) {
        var firstChip = destChips[0];
        if (firstChip) { firstChip.classList.add('active'); state.destinations.push(firstChip.getAttribute('data-dest-chip')); }
      }
      var plan = buildPlan(state);
      renderPlan(root, plan);
    }

    if (buildBtn) buildBtn.addEventListener('click', run);

    // Actions: copy / download / whatsapp
    var copyBtn = root.querySelector('[data-copy-plan]');
    var downloadBtn = root.querySelector('[data-download-plan]');
    var waBtn = root.querySelector('[data-whatsapp-plan]');

    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (!root._planText) return;
      navigator.clipboard.writeText(root._planText).then(function () {
        var orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = orig; }, 1600);
      });
    });

    if (downloadBtn) downloadBtn.addEventListener('click', function () {
      if (!root._planText) return;
      var blob = new Blob([root._planText], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'keralam-travels-plan.txt';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    if (waBtn) waBtn.addEventListener('click', function () {
      if (!root._planText) return;
      var msg = encodeURIComponent(root._planText);
      window.open('https://wa.me/?text=' + msg, '_blank');
    });

    // auto-build once on load for compact planner with sensible defaults
    if (root.hasAttribute('data-autobuild')) run();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-planner]').forEach(initPlanner);
  });
})();
