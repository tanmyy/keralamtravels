// Keralam Travels - 3-question trip quiz ("Find your route")
document.addEventListener('DOMContentLoaded', function () {
  var root = document.querySelector('[data-quiz]');
  if (!root) return;
  var body = root.querySelector('[data-quiz-body]');
  if (!body) return;

  var QUESTIONS = [
    { key: 'month', q: 'When are you traveling?', opts: [
      { v: 'peak', t: 'Dec - Jan', s: 'Peak season' },
      { v: 'warm', t: 'Feb - May', s: 'Hot months' },
      { v: 'monsoon', t: 'Jun - Sep', s: 'Monsoon' },
      { v: 'pleasant', t: 'Oct - Nov', s: 'Post-monsoon' }
    ]},
    { key: 'who', q: 'Who is traveling?', opts: [
      { v: 'couple', t: 'Couple' },
      { v: 'family', t: 'Family with kids' },
      { v: 'friends', t: 'Group of friends' },
      { v: 'solo', t: 'Solo' }
    ]},
    { key: 'pace', q: 'What pace do you like?', opts: [
      { v: 'packed', t: 'Packed', s: 'See it all' },
      { v: 'balanced', t: 'Balanced', s: 'A bit of both' },
      { v: 'slow', t: 'Slow', s: 'Unwind' }
    ]}
  ];

  var ROUTES = {
    classic: { name: 'Munnar to Alleppey classic', days: '5 to 6 days', url: '/itineraries/munnar-alleppey-5-day.html',
      blurb: "Tea hills then backwaters. The first-timer route that covers Kerala's two signatures without rushed driving." },
    wayanad: { name: 'Wayanad for trekkers', days: '4 to 5 days', url: '/itineraries/wayanad-trek-4-day.html',
      blurb: 'Trails, caves, and a dawn safari. Built for travelers who would rather climb than lounge.' },
    kochi: { name: 'Kochi and Kovalam', days: '4 days', url: '/itineraries/kochi-kovalam-4-day.html',
      blurb: 'Culture first, beach after. Short transfers and easy days, the most relaxed route on this site.' },
    kumarakom: { name: 'Kumarakom slow backwaters', days: '3 days', url: '/itineraries/kumarakom-backwaters-3-day.html',
      blurb: 'Three slow days on Lake Vembanad. Dawn birds, a day cruise, village cycling, and a massage.' }
  };

  var SEASONS = {
    peak: 'December and January are peak season. Houseboats and Munnar stays sell out weeks ahead, and the planner applies a 1.25x seasonal bump for these months.',
    warm: 'February to May is hot outside the hills. This route leans on cooler air and slower afternoons, so keep backwater plans lazy.',
    monsoon: 'June to September brings rain and roughly 15% lower prices. Some houseboat routes cut sailings in heavy rain, so keep a buffer day in the plan.',
    pleasant: 'October and November are the sweet spot: post-monsoon green, pre-peak prices, and full houseboat sailings.'
  };

  var WHO_LABEL = { couple: 'a couple', family: 'a family with kids', friends: 'a group of friends', solo: 'a solo traveler' };
  var PACE_LABEL = { packed: 'a packed pace', balanced: 'a balanced pace', slow: 'a slow pace' };
  var MONTH_LABEL = { peak: 'peak season (Dec-Jan)', warm: 'the hot months (Feb-May)', monsoon: 'monsoon (Jun-Sep)', pleasant: 'post-monsoon (Oct-Nov)' };

  var answers = {};
  var step = 0;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pickRoute(a) {
    var r = 'classic';
    var shifted = false;
    if (a.pace === 'slow') r = 'kumarakom';
    else if (a.who === 'family') r = 'kochi';
    else if (a.pace === 'packed') r = 'wayanad';
    if (a.month === 'monsoon' && r === 'wayanad') { r = 'classic'; shifted = true; }
    return { key: r, shifted: shifted };
  }

  function renderQuestion() {
    var q = QUESTIONS[step];
    var html = '<div class="quiz-meta"><span>Question ' + (step + 1) + ' of ' + QUESTIONS.length + '</span>';
    if (step > 0) html += '<button type="button" class="quiz-back" data-quiz-back>&larr; Back</button>';
    html += '</div><h3 style="margin:6px 0 4px">' + esc(q.q) + '</h3><div class="quiz-opts">';
    q.opts.forEach(function (o) {
      html += '<button type="button" class="quiz-opt" data-quiz-opt="' + esc(o.v) + '"><strong>' + esc(o.t) + '</strong>' +
        (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>';
    });
    html += '</div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-quiz-opt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        answers[q.key] = btn.getAttribute('data-quiz-opt');
        step++;
        if (step < QUESTIONS.length) renderQuestion();
        else renderResult();
      });
    });
    var back = body.querySelector('[data-quiz-back]');
    if (back) back.addEventListener('click', function () { step--; renderQuestion(); });
  }

  function renderResult() {
    var pick = pickRoute(answers);
    var r = ROUTES[pick.key];
    var why = 'Picked for ' + WHO_LABEL[answers.who] + ' traveling at ' + PACE_LABEL[answers.pace] + ' in ' + MONTH_LABEL[answers.month] + '.';
    var html = '<span class="badge">Your route</span>' +
      '<h3 style="margin:12px 0 4px">' + esc(r.name) + '</h3>' +
      '<p style="color:var(--ink-soft);font-size:.92rem;margin:0 0 10px">' + esc(r.days) + ' &middot; ' + esc(r.blurb) + '</p>' +
      '<p style="font-size:.92rem">' + esc(why) + '</p>' +
      '<p class="per-day-note">' + esc(SEASONS[answers.month]) + '</p>';
    if (pick.shifted) {
      html += '<p class="per-day-note">Heads up: we moved you off the Wayanad trek. Trails can close on short notice in heavy rain, so the hills-plus-backwaters classic is the safer monsoon pick.</p>';
    }
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px">' +
      '<a class="btn btn-amber btn-sm" href="' + esc(r.url) + '">See the day-by-day plan</a>' +
      '<a class="btn btn-outline btn-sm" href="/planner.html">Price this route</a>' +
      '<button type="button" class="btn btn-outline btn-sm" data-quiz-restart>Retake</button></div>';
    body.innerHTML = html;
    body.querySelector('[data-quiz-restart]').addEventListener('click', function () {
      answers = {}; step = 0; renderQuestion();
    });
    if (root.scrollIntoView) { try { root.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }
  }

  renderQuestion();
});
