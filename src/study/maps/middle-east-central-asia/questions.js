/* Spelling check for the Middle East and Central Asia quiz list.
   No DOM. Pass the countries array from countries.json.
   Iran and Iraq never fuzzy-match each other: a typed name has to be closer
   to the correct country than to any other quiz country. */
(function (root, factory) {
  root.MECAQuestions = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var SHORT = 6;

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/['’.]/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^the /, '');
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = new Array(b.length + 1);
    var cur = new Array(b.length + 1);
    var i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        var del = prev[j] + 1;
        var ins = cur[j - 1] + 1;
        var sub = prev[j - 1] + cost;
        cur[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
      }
      var swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[b.length];
  }

  function formsOf(country) {
    var list = [country.name].concat(country.aliases || []);
    if (country.shortName) list.push(country.shortName);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var n = normalize(list[i]);
      if (n && out.indexOf(n) < 0) out.push(n);
    }
    return out;
  }

  function bestDistance(typed, country) {
    var forms = formsOf(country);
    var best = Infinity;
    for (var i = 0; i < forms.length; i++) {
      if (forms[i] === typed) return 0;
      var d = levenshtein(typed, forms[i]);
      if (d < best) best = d;
    }
    return best;
  }

  function gradeTyped(countries, correctId, input) {
    var typed = normalize(input);
    var correct = null;
    var i;
    for (i = 0; i < countries.length; i++) if (countries[i].id === correctId) correct = countries[i];
    if (!correct) return { ok: false, reason: 'unknown-country' };
    if (!typed) return { ok: false, reason: 'empty', correctId: correctId };

    if (correct.rejectAlone) {
      for (i = 0; i < correct.rejectAlone.length; i++) {
        if (normalize(correct.rejectAlone[i]) === typed) {
          return {
            ok: false,
            reason: 'partial',
            correctId: correctId,
            hint: correct.partialHint || correct.partsNote || ''
          };
        }
      }
    }

    var ranked = [];
    for (i = 0; i < countries.length; i++) {
      if (!countries[i].quiz) continue;
      ranked.push({ id: countries[i].id, distance: bestDistance(typed, countries[i]) });
    }
    ranked.sort(function (a, b) { return a.distance - b.distance || (a.id < b.id ? -1 : 1); });
    var top = ranked[0];
    var second = ranked[1];
    var mine = null;
    for (i = 0; i < ranked.length; i++) if (ranked[i].id === correctId) mine = ranked[i];
    var limit = typed.length <= SHORT ? 1 : 2;

    if (mine && mine.distance === 0) {
      return { ok: true, match: 'exact', distance: 0, correctId: correctId };
    }
    if (!top || top.id !== correctId) {
      var hint = '';
      if (correct.confusableWith && top && correct.confusableWith.indexOf(top.id) >= 0) hint = correct.confusableHint || '';
      return { ok: false, reason: 'other', closestId: top && top.id, distance: top && top.distance, correctId: correctId, hint: hint };
    }
    if (mine.distance > limit) {
      return { ok: false, reason: 'spelling', distance: mine.distance, correctId: correctId };
    }
    if (second && second.distance <= mine.distance) {
      return { ok: false, reason: 'ambiguous', closestId: second.id, distance: mine.distance, correctId: correctId };
    }
    return { ok: true, match: 'close', distance: mine.distance, correctId: correctId };
  }

  return { normalize: normalize, levenshtein: levenshtein, gradeTyped: gradeTyped };
});

export default globalThis.MECAQuestions
