/* Rebuild geometry.geojson, map.svg, and questions.json from countries.json
   and Natural Earth 1:10m (world-atlas 2.0.2 countries-10m.json).
   Usage: node build-geometry.mjs /path/to/countries-10m.json
   Does not modify countries.json. */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pack = JSON.parse(readFileSync(join(here, 'countries.json'), 'utf8'));
const srcPath = process.argv[2] || '/tmp/mapdata/countries-10m.json';
const topo = JSON.parse(readFileSync(srcPath, 'utf8'));

const EXTRA_MIN = 0.05;
const PALESTINE_MIN = 0.02;
const CONTEXT_MIN = 0.04;
const CONTEXT_KEEP = 3;

function decodeArcs(topology) {
  const tr = topology.transform;
  return topology.arcs.map(function (arc) {
    let x = 0, y = 0;
    return arc.map(function (d) {
      x += d[0];
      y += d[1];
      return [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]];
    });
  });
}

const arcs = decodeArcs(topo);

function stitch(indexes) {
  const pts = [];
  indexes.forEach(function (idx) {
    const rev = idx < 0;
    const arc = arcs[rev ? ~idx : idx];
    const seq = rev ? arc.slice().reverse() : arc;
    const start = pts.length ? 1 : 0;
    for (let k = start; k < seq.length; k++) pts.push(seq[k]);
  });
  return pts;
}

function decodeGeometry(g) {
  if (g.type === 'Polygon') {
    return { type: 'Polygon', coordinates: g.arcs.map(stitch) };
  }
  if (g.type === 'MultiPolygon') {
    return { type: 'MultiPolygon', coordinates: g.arcs.map(function (poly) { return poly.map(stitch); }) };
  }
  return null;
}

function polysOf(geometry) {
  if (!geometry) return [];
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a / 2);
}

function ringContains(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][1], yj = ring[j][1];
    if ((yi > y) !== (yj > y)) {
      const xi = ring[i][0], xj = ring[j][0];
      if (x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function bbox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  ring.forEach(function (p) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  });
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}

function douglasPeucker(points, eps) {
  const n = points.length;
  if (n < 3) return points.map(function (p) { return p.slice(); });
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const eps2 = eps * eps;
  while (stack.length) {
    const pair = stack.pop();
    const a = pair[0], b = pair[1];
    let max = 0, idx = -1;
    const ax = points[a][0], ay = points[a][1], bx = points[b][0], by = points[b][1];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      let d2;
      if (!len2) {
        const ex = points[i][0] - ax, ey = points[i][1] - ay;
        d2 = ex * ex + ey * ey;
      } else {
        let t = ((points[i][0] - ax) * dx + (points[i][1] - ay) * dy) / len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const px = ax + t * dx, py = ay + t * dy;
        const ex = points[i][0] - px, ey = points[i][1] - py;
        d2 = ex * ex + ey * ey;
      }
      if (d2 > max) { max = d2; idx = i; }
    }
    if (max > eps2 && idx !== -1) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i].slice());
  return out;
}

function closeRing(ring) {
  if (!ring.length) return ring;
  const a = ring[0], b = ring[ring.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) ring.push(a.slice());
  return ring;
}

function simplifyRing(ring, eps) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  if (open.length < 4) return null;
  const simple = douglasPeucker(open, eps);
  if (simple.length < 4) return null;
  return closeRing(simple);
}

function clipRing(ring, box) {
  const edges = [
    { inside: function (p) { return p[0] >= box.minX; }, cut: function (a, b) { const t = (box.minX - a[0]) / (b[0] - a[0]); return [box.minX, a[1] + t * (b[1] - a[1])]; } },
    { inside: function (p) { return p[0] <= box.maxX; }, cut: function (a, b) { const t = (box.maxX - a[0]) / (b[0] - a[0]); return [box.maxX, a[1] + t * (b[1] - a[1])]; } },
    { inside: function (p) { return p[1] >= box.minY; }, cut: function (a, b) { const t = (box.minY - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), box.minY]; } },
    { inside: function (p) { return p[1] <= box.maxY; }, cut: function (a, b) { const t = (box.maxY - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), box.maxY]; } }
  ];
  let output = ring.slice(0, ring.length && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? -1 : ring.length);
  edges.forEach(function (edge) {
    if (!output.length) return;
    const input = output;
    output = [];
    let prev = input[input.length - 1];
    input.forEach(function (cur) {
      const cin = edge.inside(cur), pin = edge.inside(prev);
      if (cin) {
        if (!pin) output.push(edge.cut(prev, cur));
        output.push(cur);
      } else if (pin) output.push(edge.cut(prev, cur));
      prev = cur;
    });
  });
  return closeRing(output);
}

function roundRing(ring) {
  return ring.map(function (p) { return [Math.round(p[0] * 10000) / 10000, Math.round(p[1] * 10000) / 10000]; });
}

function interiorPoint(ring) {
  let cx = 0, cy = 0, n = 0;
  const limit = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.length - 1 : ring.length;
  for (let i = 0; i < limit; i++) { cx += ring[i][0]; cy += ring[i][1]; n++; }
  cx /= n; cy /= n;
  if (ringContains(ring, cx, cy)) return [cx, cy];
  const b = bbox(ring);
  let best = null, bestD = -1;
  for (let r = 0; r < 28; r++) {
    for (let c = 0; c < 28; c++) {
      const x = b.minX + (c + 0.5) / 28 * (b.maxX - b.minX);
      const y = b.minY + (r + 0.5) / 28 * (b.maxY - b.minY);
      if (!ringContains(ring, x, y)) continue;
      let d = Infinity;
      for (let i = 0; i < ring.length - 1; i++) {
        const ax = ring[i][0], ay = ring[i][1], bx = ring[i + 1][0], by = ring[i + 1][1];
        const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
        let t = ((x - ax) * dx + (y - ay) * dy) / len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const ex = x - (ax + t * dx), ey = y - (ay + t * dy);
        const dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < d) d = dist;
      }
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
  }
  return best || [cx, cy];
}

function arcKeys(indexes, into) {
  if (!indexes || !indexes.length) return;
  if (typeof indexes[0] === 'number') {
    indexes.forEach(function (a) { into.add(a < 0 ? ~a : a); });
  } else indexes.forEach(function (x) { arcKeys(x, into); });
}

const geoms = topo.objects.countries.geometries;
const byIso = new Map();
const byName = new Map();
const arcOwners = new Map();
geoms.forEach(function (g) {
  const geometry = decodeGeometry(g);
  const rec = { id: g.id, name: g.properties && g.properties.name, geometry: geometry, arcs: new Set() };
  if (g.arcs) arcKeys(g.arcs, rec.arcs);
  if (g.id != null) byIso.set(String(g.id).padStart(3, '0'), rec);
  if (rec.name) {
    if (!byName.has(rec.name)) byName.set(rec.name, []);
    byName.get(rec.name).push(rec);
  }
  rec.arcs.forEach(function (a) {
    if (!arcOwners.has(a)) arcOwners.set(a, new Set());
    if (g.id != null) arcOwners.get(a).add(String(g.id).padStart(3, '0'));
  });
});

function neighborIsos(iso) {
  const rec = byIso.get(iso);
  const out = new Set();
  if (!rec) return out;
  rec.arcs.forEach(function (a) {
    const owners = arcOwners.get(a);
    if (!owners) return;
    owners.forEach(function (id) { if (id !== iso) out.add(id); });
  });
  return out;
}

const idByIso = new Map();
pack.countries.forEach(function (c) { idByIso.set(String(c.isoN3).padStart(3, '0'), c.id); });

const groupColor = {};
pack.groups.forEach(function (g) { groupColor[g.id] = g.color; });

function roleFor(id, ring) {
  const p = interiorPoint(ring);
  const lon = p[0], lat = p[1];
  if (id === 'palestine') return lon < 34.7 ? 'gaza' : 'west-bank';
  if (id === 'oman' && lat < 21.5 && lon > 58) return 'masirah';
  if (id === 'oman') return lat > 25.3 ? 'musandam' : 'mainland';
  if (id === 'azerbaijan') return lon < 46.6 && lat < 40.3 ? 'nakhchivan' : 'mainland';
  if (id === 'yemen') return lat < 13.3 && lon > 52 ? 'socotra' : 'mainland';
  if (id === 'turkey') return lon < 30.5 && lat > 39.8 ? 'european' : 'mainland';
  if (id === 'iran' && lat < 28 && lon > 54 && lon < 57.2) return 'qeshm';
  return 'mainland';
}

function sourceRecords(country) {
  if (country.mergeNames) {
    const list = [];
    country.mergeNames.forEach(function (name) {
      (byName.get(name) || []).forEach(function (rec) { list.push(rec); });
    });
    return list;
  }
  const iso = String(country.isoN3).padStart(3, '0');
  const rec = byIso.get(iso);
  if (!rec) throw new Error('Missing Natural Earth geometry for ' + country.id + ' iso ' + iso);
  return [rec];
}

const quizBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
pack.countries.filter(function (c) { return c.quiz; }).forEach(function (c) {
  sourceRecords(c).forEach(function (rec) {
    polysOf(rec.geometry).forEach(function (poly) {
      bbox(poly[0]);
      poly[0].forEach(function (p) {
        if (p[0] < quizBounds.minX) quizBounds.minX = p[0];
        if (p[1] < quizBounds.minY) quizBounds.minY = p[1];
        if (p[0] > quizBounds.maxX) quizBounds.maxX = p[0];
        if (p[1] > quizBounds.maxY) quizBounds.maxY = p[1];
      });
    });
  });
});
const clipBox = {
  minX: Math.min(24, quizBounds.minX - 1),
  minY: Math.min(11, quizBounds.minY - 1),
  maxX: Math.max(89, quizBounds.maxX + 1),
  maxY: Math.max(56.5, quizBounds.maxY + 1)
};

function collectParts(country) {
  const parts = [];
  sourceRecords(country).forEach(function (rec) {
    polysOf(rec.geometry).forEach(function (poly) {
      let ring = poly[0].map(function (p) { return p.slice(); });
      if (!country.quiz) ring = clipRing(ring, clipBox);
      if (!ring || ring.length < 4) return;
      const area = ringArea(ring);
      parts.push({ ring: ring, area: area });
    });
  });
  parts.sort(function (a, b) { return b.area - a.area; });
  if (!parts.length) return [];
  const min = country.quiz ? (country.id === 'palestine' ? PALESTINE_MIN : EXTRA_MIN) : (country.small ? 0.02 : CONTEXT_MIN);
  let kept = parts.filter(function (p, i) { return i === 0 || p.area >= min; });
  if (!country.quiz) kept = kept.slice(0, CONTEXT_KEEP);
  return kept;
}

const draft = [];
pack.countries.forEach(function (country) {
  const kept = collectParts(country);
  if (!kept.length) {
    console.log('drop empty context', country.id);
    return;
  }
  draft.push({ country: country, parts: kept });
});

/* Drop a non-mainland speck whose interior sits inside a different country. */
const mainlandRings = [];
draft.forEach(function (item) {
  if (!item.parts.length) return;
  mainlandRings.push({ id: item.country.id, ring: item.parts[0].ring });
});
draft.forEach(function (item) {
  item.parts = item.parts.filter(function (part, index) {
    if (index === 0) return true;
    const pt = interiorPoint(part.ring);
    for (let i = 0; i < mainlandRings.length; i++) {
      if (mainlandRings[i].id === item.country.id) continue;
      if (ringContains(mainlandRings[i].ring, pt[0], pt[1])) {
        console.log('drop enclave', item.country.id, 'area', part.area.toFixed(4), 'inside', mainlandRings[i].id);
        return false;
      }
    }
    return true;
  });
});

function epsFor(part) {
  const b = bbox(part.ring);
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY);
  if (span < 4 || part.area < 1) return 0.012;
  if (part.area > 40) return 0.04;
  return 0.025;
}

const features = [];
draft.forEach(function (item) {
  const country = item.country;
  const coordinates = [];
  const partMeta = [];
  let area = 0;
  item.parts.forEach(function (part) {
    const simple = simplifyRing(part.ring, epsFor(part));
    if (!simple) return;
    const rounded = roundRing(simple);
    const a = ringArea(rounded);
    if (a < 0.008 && country.id !== 'palestine') return;
    coordinates.push([rounded]);
    area += a;
    const ip = interiorPoint(rounded);
    partMeta.push({
      role: roleFor(country.id, rounded),
      area: Math.round(a * 10000) / 10000,
      labelPoint: [Math.round(ip[0] * 1000) / 1000, Math.round(ip[1] * 1000) / 1000]
    });
  });
  if (!coordinates.length) return;
  const main = partMeta.slice().sort(function (a, b) { return b.area - a.area; })[0];
  const label = country.label;
  const props = {
    id: country.id,
    name: country.name,
    quiz: !!country.quiz,
    region: country.region,
    color: country.quiz ? groupColor[country.region] : pack.meta.colors.context,
    small: !!country.small,
    labelOnMap: country.quiz || !!country.labelOnMap,
    isoN3: country.isoN3,
    isoA3: country.isoA3,
    area: Math.round(area * 1000) / 1000,
    parts: partMeta,
    labelPoint: label ? [label.lon, label.lat] : main.labelPoint,
    labelText: label && label.text ? label.text : country.name,
    labelAnchor: label && label.anchor ? label.anchor : 'middle',
    suggestedView: country.suggestedView || (country.quiz ? 'full' : null),
    partLabels: country.partLabels || []
  };
  features.push({
    type: 'Feature',
    id: country.id,
    properties: props,
    geometry: coordinates.length === 1
      ? { type: 'Polygon', coordinates: coordinates[0] }
      : { type: 'MultiPolygon', coordinates: coordinates }
  });
});

/* Neighbor check against shared Natural Earth arcs. */
const problems = [];
pack.countries.filter(function (c) { return c.quiz; }).forEach(function (c) {
  const iso = String(c.isoN3).padStart(3, '0');
  const got = neighborIsos(iso);
  const gotIds = [];
  got.forEach(function (n) { if (idByIso.has(n)) gotIds.push(idByIso.get(n)); });
  gotIds.sort();
  const expect = (c.borders || []).slice().sort();
  const missing = expect.filter(function (id) { return gotIds.indexOf(id) < 0; });
  const extra = gotIds.filter(function (id) { return expect.indexOf(id) < 0; });
  if (missing.length || extra.length) problems.push(c.id + ' missing [' + missing.join(',') + '] extra [' + extra.join(',') + '] topo [' + gotIds.join(',') + ']');
});
if (problems.length) {
  console.error(problems.join('\n'));
  throw new Error('Border list does not match Natural Earth shared arcs');
}

const fc = {
  type: 'FeatureCollection',
  name: 'middle-east-central-asia',
  source: 'Natural Earth Admin 0 countries, 1:10m, version 4.1.0, public domain. Read from world-atlas 2.0.2 countries-10m.json.',
  license: 'Public domain. Natural Earth. https://www.naturalearthdata.com/about/terms-of-use/',
  crs: 'WGS84 longitude and latitude. Not projected.',
  processing: {
    extraPartMinAreaDeg2: EXTRA_MIN,
    palestineMinAreaDeg2: PALESTINE_MIN,
    holes: 'Interior lakes and tiny enclaves are filled so each country is one solid shape.',
    enclaves: 'Fergana Valley enclaves smaller than the area cutoff, or sitting inside another country, are not drawn separately.',
    simplifyDegrees: 'About 0.012 for small parts and about 0.04 for the largest countries. Borders are simplified separately, so hairline gaps or overlaps are possible.',
    cyprus: 'Context only. Natural Earth pieces named Cyprus, N. Cyprus, and Cyprus U.N. Buffer Zone are drawn as one island.',
    clip: clipBox
  },
  meta: pack.meta,
  groups: pack.groups,
  seas: pack.seas,
  features: features
};

writeFileSync(join(here, 'geometry.geojson'), JSON.stringify(fc));

/* SVG */
const COS = Math.cos(36 * Math.PI / 180);
function project(lon, lat) { return [lon * COS, lat]; }
const quizFeatures = features.filter(function (f) { return f.properties.quiz; });
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
features.forEach(function (f) {
  polysOf(f.geometry).forEach(function (poly) {
    poly[0].forEach(function (p) {
      const q = project(p[0], p[1]);
      if (q[0] < minX) minX = q[0];
      if (q[1] < minY) minY = q[1];
      if (q[0] > maxX) maxX = q[0];
      if (q[1] > maxY) maxY = q[1];
    });
  });
});
const pad = 0.7;
minX -= pad; minY -= pad; maxX += pad; maxY += pad;
const VB_W = 1200;
const scale = VB_W / (maxX - minX);
const VB_H = (maxY - minY) * scale;
function sx(lon, lat) {
  const q = project(lon, lat);
  return [(q[0] - minX) * scale, (maxY - q[1]) * scale];
}
function pathD(geometry) {
  let d = '';
  polysOf(geometry).forEach(function (poly) {
    poly[0].forEach(function (p, i) {
      const xy = sx(p[0], p[1]);
      d += (i ? 'L' : 'M') + xy[0].toFixed(1) + ' ' + xy[1].toFixed(1);
    });
    d += 'Z';
  });
  return d;
}
function xml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ordered = features.slice().sort(function (a, b) {
  const aq = a.properties.quiz ? 1 : 0, bq = b.properties.quiz ? 1 : 0;
  if (aq !== bq) return aq - bq;
  return b.properties.area - a.properties.area;
});

let body = '';
ordered.forEach(function (f) {
  const p = f.properties;
  body += '<path class="' + (p.quiz ? 'quiz' : 'context') + (p.small ? ' small' : '') + '" data-id="' + p.id + '" data-name="' + xml(p.name) + '" fill="' + p.color + '" d="' + pathD(f.geometry) + '"/>\n';
});

function leader(fromLonLat, toLonLat) {
  const a = sx(fromLonLat[0], fromLonLat[1]);
  const b = sx(toLonLat[0], toLonLat[1]);
  const dx = a[0] - b[0], dy = a[1] - b[1];
  if (dx * dx + dy * dy < 18 * 18) return '';
  return '<line x1="' + b[0].toFixed(1) + '" y1="' + b[1].toFixed(1) + '" x2="' + a[0].toFixed(1) + '" y2="' + a[1].toFixed(1) + '" class="leader"/>';
}

ordered.forEach(function (f) {
  const p = f.properties;
  if (!p.labelOnMap) return;
  const main = p.parts.slice().sort(function (a, b) { return b.area - a.area; })[0];
  body += leader(p.labelPoint, main.labelPoint);
  const xy = sx(p.labelPoint[0], p.labelPoint[1]);
  const size = p.quiz ? (p.small ? 13 : 15) : 12;
  body += '<text class="label' + (p.quiz ? '' : ' context') + '" x="' + xy[0].toFixed(1) + '" y="' + xy[1].toFixed(1) + '" text-anchor="' + p.labelAnchor + '" font-size="' + size + '">' + xml(p.labelText) + '</text>\n';
});

const countryById = {};
pack.countries.forEach(function (c) { countryById[c.id] = c; });
features.forEach(function (f) {
  const spec = countryById[f.properties.id];
  if (!spec || !spec.partLabels) return;
  spec.partLabels.forEach(function (lab) {
    const part = f.properties.parts.filter(function (p) { return p.role === lab.role; })[0];
    if (!part) return;
    body += leader([lab.lon, lab.lat], part.labelPoint);
    const xy = sx(lab.lon, lab.lat);
    body += '<text class="part" x="' + xy[0].toFixed(1) + '" y="' + xy[1].toFixed(1) + '" text-anchor="' + (lab.anchor || 'middle') + '">' + xml(lab.text) + '</text>\n';
  });
});

const seaWarnings = [];
pack.seas.forEach(function (sea) {
  let inside = null;
  features.forEach(function (f) {
    polysOf(f.geometry).forEach(function (poly) {
      if (ringContains(poly[0], sea.lon, sea.lat)) inside = f.properties.id;
    });
  });
  if (inside) seaWarnings.push(sea.name + ' falls inside ' + inside);
  const xy = sx(sea.lon, sea.lat);
  body += '<text class="sea" x="' + xy[0].toFixed(1) + '" y="' + xy[1].toFixed(1) + '">' + xml(sea.name) + '</text>\n';
});
if (seaWarnings.length) console.log('SEA WARNINGS\n' + seaWarnings.join('\n'));

const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + VB_W.toFixed(1) + ' ' + VB_H.toFixed(1) + '" role="img" aria-label="Middle East and Central Asia study map">\n' +
  '<title>Middle East and Central Asia</title>\n' +
  '<desc>Made with Natural Earth. Admin 0 countries, 1:10m, version 4.1.0, public domain. Quiz countries are colored by region. Neighbors are grey and are not on the quiz. Palestine is the West Bank and Gaza.</desc>\n' +
  '<rect width="100%" height="100%" fill="' + pack.meta.colors.sea + '"/>\n' +
  '<g fill="none" stroke="' + pack.meta.colors.stroke + '" stroke-width="0.8" stroke-linejoin="round">\n' + body + '</g>\n' +
  '<style><![CDATA[\n' +
  '.label,.part,.sea{fill:#1c1915;stroke:#f7f4ee;stroke-width:3px;paint-order:stroke;font-family:Trebuchet MS,Segoe UI,sans-serif;font-weight:700}\n' +
  '.label{font-size:15px}.label.context{fill:#5c564c;font-size:12px;font-weight:600}\n' +
  '.part{font-size:10px;fill:#3e3a34}\n' +
  '.sea{fill:#1d4e6e;stroke:#e7f5fb;font-size:12px;font-style:italic;font-weight:600}\n' +
  '.leader{stroke:#3e3a34;stroke-width:0.7;fill:none}\n' +
  ']]></style>\n' +
  '</svg>\n';
writeFileSync(join(here, 'map.svg'), svg);

/* Questions */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffle(list, seed) {
  const rng = mulberry32(hash(seed));
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
const quiz = pack.countries.filter(function (c) { return c.quiz; });
const items = [];
quiz.forEach(function (c) {
  const tap = c.partsNote ? c.name + ' (West Bank and Gaza)' : c.name;
  items.push({
    id: 'click-' + c.id,
    mode: 'click',
    prompt: 'Tap ' + tap + '.',
    answerId: c.id,
    answer: c.name,
    suggestedView: c.suggestedView,
    small: !!c.small
  });
  const same = quiz.filter(function (o) { return o.id !== c.id && o.region === c.region; });
  const border = quiz.filter(function (o) { return c.borders.indexOf(o.id) >= 0; });
  const rest = quiz.filter(function (o) { return o.id !== c.id; });
  const pool = [];
  [same, border, rest].forEach(function (list) {
    list.forEach(function (o) { if (pool.indexOf(o) < 0) pool.push(o); });
  });
  const distractors = shuffle(pool, 'd:' + c.id).slice(0, 3);
  const choices = shuffle([c].concat(distractors), 'c:' + c.id).map(function (o) {
    return { id: o.id, name: o.name, correct: o.id === c.id };
  });
  items.push({
    id: 'choice-' + c.id,
    mode: 'name-choice',
    prompt: 'What country is highlighted?',
    highlight: c.id,
    answerId: c.id,
    answer: c.name,
    choices: choices,
    suggestedView: c.suggestedView
  });
  items.push({
    id: 'typed-' + c.id,
    mode: 'name-typed',
    prompt: 'Type the name of the highlighted country.',
    highlight: c.id,
    answerId: c.id,
    answer: c.name,
    accept: [c.name].concat(c.aliases || [], c.shortName ? [c.shortName] : []),
    rejectAlone: c.rejectAlone || [],
    suggestedView: c.suggestedView,
    spelling: 'Use gradeTyped in questions.js. Short names allow 1 edit. Longer names allow 2. The closest quiz name has to be this country, so Iran and Iraq never match each other.'
  });
  items.push({
    id: 'learn-' + c.id,
    mode: 'learn',
    prompt: c.name,
    answerId: c.id,
    region: c.region,
    regionName: (pack.groups.filter(function (g) { return g.id === c.region; })[0] || {}).name,
    hook: c.hook,
    borders: c.borders,
    seas: c.seas,
    partsNote: c.partsNote || null,
    partNotes: c.partNotes || null,
    suggestedView: c.suggestedView
  });
});

const questions = {
  quizDate: pack.meta.quizDate,
  title: pack.meta.title,
  note: 'Question bank for the 22-country map quiz. There is no game page in this folder.',
  spelling: {
    normalize: 'Lowercase, strip accents and apostrophes, turn & into and, drop a leading the.',
    maxEditDistance: { upTo6Letters: 1, longer: 2 },
    rule: 'Accept the edit only when this country is strictly closer than every other quiz country.'
  },
  items: items,
  sets: {
    timedBlankMap: {
      id: 'timed-blank-map',
      mode: 'timed-test',
      prompt: 'Blank map of all 22 countries. No word bank. A practice timer, not the official class period.',
      minutes: 10,
      countryIds: quiz.map(function (c) { return c.id; }),
      grading: 'Same spelling tolerance as name-typed.'
    },
    missedReview: {
      id: 'missed-review',
      mode: 'missed-review',
      prompt: 'Practice only the countries that were missed.',
      sourceModes: ['click', 'name-choice', 'name-typed', 'timed-test']
    }
  }
};
writeFileSync(join(here, 'questions.json'), JSON.stringify(questions, null, 2) + '\n');

/* Checks */
const MECA = require('./map-render.js');
const Q = require('./questions.js');
const byId = {};
features.forEach(function (f) { byId[f.id] = f; });

quiz.forEach(function (c) {
  const f = byId[c.id];
  if (!f) throw new Error('missing feature ' + c.id);
  f.properties.parts.forEach(function (part) {
    const hit = MECA.hitTest(fc, part.labelPoint[0], part.labelPoint[1], { quizOnly: true });
    if (!hit || hit.id !== c.id) throw new Error('hit ' + c.id + ' ' + part.role + ' -> ' + (hit && hit.id));
  });
});

function expectRole(id, role) {
  const f = byId[id];
  if (!f.properties.parts.some(function (p) { return p.role === role; })) throw new Error(id + ' missing part ' + role);
}
expectRole('palestine', 'gaza');
expectRole('palestine', 'west-bank');
expectRole('oman', 'musandam');
expectRole('yemen', 'socotra');
expectRole('azerbaijan', 'nakhchivan');
expectRole('turkey', 'european');

const water = MECA.hitTest(fc, 50.2, 27.4);
if (water) console.log('note: sample gulf point hit', water.id);
const cases = [
  ['yemen', 'Yemen', true],
  ['yemen', 'yeman', true],
  ['iran', 'Iraq', false],
  ['iraq', 'Iran', false],
  ['iran', 'iraan', true],
  ['iran', 'ira', false],
  ['united-arab-emirates', 'UAE', true],
  ['united-arab-emirates', 'U.A.E.', true],
  ['saudi-arabia', 'saudi', true],
  ['palestine', 'gaza', false],
  ['palestine', 'west bank', false],
  ['palestine', 'West Bank and Gaza', true],
  ['palestine', 'palistine', true],
  ['kyrgyzstan', 'kyrgystan', true],
  ['kazakhstan', 'kazakstan', true],
  ['turkey', 'Türkiye', true],
  ['oman', '', false],
  ['yemen', 'Oman', false]
];
cases.forEach(function (row) {
  const g = Q.gradeTyped(pack.countries, row[0], row[1]);
  if (!!g.ok !== row[2]) throw new Error('grade ' + JSON.stringify(row) + ' -> ' + JSON.stringify(g));
});

const quizN = features.filter(function (f) { return f.properties.quiz; }).length;
if (quizN !== 22) throw new Error('quiz count ' + quizN);
const choiceN = items.filter(function (it) { return it.mode === 'name-choice'; });
choiceN.forEach(function (it) {
  if (it.choices.length !== 4) throw new Error('choices ' + it.id);
  if (it.choices.filter(function (ch) { return ch.correct; }).length !== 1) throw new Error('correct flag ' + it.id);
});

console.log('features', features.length, 'quiz', quizN);
features.filter(function (f) { return f.properties.quiz; }).forEach(function (f) {
  const pts = polysOf(f.geometry).reduce(function (n, poly) { return n + poly[0].length; }, 0);
  console.log(f.id, 'parts', f.properties.parts.map(function (p) { return p.role + ':' + p.area; }).join(', '), 'pts', pts);
});
console.log('geojson bytes', JSON.stringify(fc).length, 'svg bytes', svg.length, 'questions', items.length);
console.log('clip', JSON.stringify(clipBox));
console.log('ok');
