/* Draw and hit-test the Middle East and Central Asia study map.
   Coordinates in geometry.geojson are WGS84 degrees.
   The drawing projection is equirectangular with a 36 degree standard parallel:
   x = longitude * cos(36 deg), y = latitude. SVG y is flipped.
   Pass a FeatureCollection. No network and no framework. */
(function (root, factory) {
  root.MECAMap = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var PHI0 = 36 * Math.PI / 180;
  var COS = Math.cos(PHI0);
  var SEA = '#c5e4f3';
  var CONTEXT = '#d9d6cf';
  var STROKE = '#3e3a34';

  function project(lon, lat) {
    return [lon * COS, lat];
  }

  function unproject(x, y) {
    return [x / COS, y];
  }

  function eachRing(geometry, fn) {
    if (!geometry) return;
    var polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    for (var p = 0; p < polys.length; p++) fn(polys[p][0], p);
  }

  function ringArea(ring) {
    var a = 0;
    for (var i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    return Math.abs(a / 2);
  }

  function ringContains(ring, x, y) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var yi = ring[i][1], yj = ring[j][1];
      if ((yi > y) !== (yj > y)) {
        var xj = ring[j][0], xi = ring[i][0];
        if (x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  }

  function contains(geometry, lon, lat) {
    var hit = false;
    eachRing(geometry, function (ring) {
      if (ringContains(ring, lon, lat)) hit = true;
    });
    return hit;
  }

  function featureArea(feature) {
    if (feature.properties && typeof feature.properties.area === 'number') return feature.properties.area;
    var a = 0;
    eachRing(feature.geometry, function (ring) { a += ringArea(ring); });
    return a;
  }

  function boundsOf(features) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    features.forEach(function (f) {
      eachRing(f.geometry, function (ring) {
        for (var i = 0; i < ring.length; i++) {
          var p = project(ring[i][0], ring[i][1]);
          if (p[0] < minX) minX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] > maxY) maxY = p[1];
        }
      });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function pathFromRing(ring, originX, originY, scale) {
    var d = '';
    for (var i = 0; i < ring.length; i++) {
      var p = project(ring[i][0], ring[i][1]);
      var x = (p[0] - originX) * scale;
      var y = (originY - p[1]) * scale;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
  }

  function pathFromGeometry(geometry, originX, originY, scale) {
    var d = '';
    eachRing(geometry, function (ring) { d += pathFromRing(ring, originX, originY, scale); });
    return d;
  }

  function edgeDistance(geometry, lon, lat) {
    var best = Infinity;
    eachRing(geometry, function (ring) {
      for (var i = 0; i < ring.length - 1; i++) {
        var ax = ring[i][0], ay = ring[i][1], bx = ring[i + 1][0], by = ring[i + 1][1];
        var dx = bx - ax, dy = by - ay;
        var len2 = dx * dx + dy * dy || 1;
        var t = ((lon - ax) * dx + (lat - ay) * dy) / len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        var px = ax + t * dx, py = ay + t * dy;
        var ex = (lon - px) * COS, ey = lat - py;
        var d = Math.sqrt(ex * ex + ey * ey);
        if (d < best) best = d;
      }
    });
    return best;
  }

  /* Smallest country that contains the point wins, so Gaza beats a sloppy overlap. */
  function hitTest(fc, lon, lat, opt) {
    opt = opt || {};
    var hits = [];
    var features = fc.features || [];
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      if (opt.quizOnly && !(f.properties && f.properties.quiz)) continue;
      if (opt.ignoreContext && f.properties && f.properties.quiz === false && opt.quizOnly) continue;
      if (contains(f.geometry, lon, lat)) hits.push(f);
    }
    if (!hits.length) return null;
    hits.sort(function (a, b) { return featureArea(a) - featureArea(b); });
    return hits[0];
  }

  /* slopPx is used only when the point is not inside any country.
     It can only select a country marked small, and never steals an interior hit. */
  function hitTestScreen(fc, lon, lat, pxPerUnit, slopPx, opt) {
    var direct = hitTest(fc, lon, lat, opt);
    if (direct) return direct;
    if (!slopPx || !pxPerUnit) return null;
    var maxDeg = slopPx / pxPerUnit;
    var best = null;
    var bestD = maxDeg;
    var features = fc.features || [];
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      if (!(f.properties && f.properties.small)) continue;
      if (opt && opt.quizOnly && !f.properties.quiz) continue;
      var d = edgeDistance(f.geometry, lon, lat);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }

  function clientToLonLat(svg, clientX, clientY) {
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var p = pt.matrixTransform(ctm.inverse());
    var vb = svg.viewBox.baseVal;
    var originX = +svg.getAttribute('data-origin-x');
    var originY = +svg.getAttribute('data-origin-y');
    var scale = +svg.getAttribute('data-scale');
    var x = originX + p.x / scale;
    var y = originY - p.y / scale;
    return unproject(x, y);
  }

  function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('meca-map-style')) return;
    var style = document.createElement('style');
    style.id = 'meca-map-style';
    style.textContent = [
      '.meca-map{position:relative;width:100%;background:#c5e4f3;border-radius:16px;overflow:hidden;touch-action:none}',
      '.meca-map svg{display:block;width:100%;height:auto;max-height:72vh}',
      '.meca-country{cursor:pointer}',
      '.meca-country.quiz:hover,.meca-country.quiz:focus{filter:brightness(1.08)}',
      '.meca-label,.meca-sea,.meca-part,.meca-leader{pointer-events:none;user-select:none}',
      '.meca-sea{font-style:italic;font-weight:600;fill:#1d4e6e}',
      '.meca-part{font-size:10px;fill:#3e3a34}',
      '.meca-leader{stroke:#3e3a34;stroke-width:0.7}',
      '.meca-hit{stroke:#1c1915;stroke-width:2.5}',
      '.meca-selected{stroke:#5b3df5;stroke-width:3}'
    ].join('');
    document.head.appendChild(style);
  }

  function render(container, fc, options) {
    if (typeof document === 'undefined') throw new Error('MECAMap.render needs a browser document');
    options = options || {};
    ensureStyle();
    var features = (fc.features || []).slice();
    if (options.quizOnly) features = features.filter(function (f) { return f.properties && f.properties.quiz; });
    var bounds = boundsOf(features);
    var pad = 0.6;
    var minX = bounds.minX - pad, maxX = bounds.maxX + pad, minY = bounds.minY - pad, maxY = bounds.maxY + pad;
    var width = options.width || 1200;
    var scale = width / (maxX - minX);
    var height = (maxY - minY) * scale;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width.toFixed(1) + ' ' + height.toFixed(1));
    svg.setAttribute('data-origin-x', String(minX));
    svg.setAttribute('data-origin-y', String(maxY));
    svg.setAttribute('data-scale', String(scale));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Map of the Middle East and Central Asia');

    var sea = document.createElementNS(svg.namespaceURI, 'rect');
    sea.setAttribute('width', String(width));
    sea.setAttribute('height', String(height));
    sea.setAttribute('fill', (fc.meta && fc.meta.colors && fc.meta.colors.sea) || SEA);
    svg.appendChild(sea);

    var ordered = features.slice().sort(function (a, b) {
      var aq = a.properties && a.properties.quiz ? 1 : 0;
      var bq = b.properties && b.properties.quiz ? 1 : 0;
      if (aq !== bq) return aq - bq;
      return featureArea(b) - featureArea(a);
    });

    ordered.forEach(function (f) {
      var props = f.properties || {};
      var path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', pathFromGeometry(f.geometry, minX, maxY, scale));
      path.setAttribute('fill', props.quiz ? (props.color || '#e2a84b') : CONTEXT);
      path.setAttribute('stroke', STROKE);
      path.setAttribute('stroke-width', props.small ? '1.1' : '0.8');
      path.setAttribute('class', 'meca-country' + (props.quiz ? ' quiz' : ' context'));
      path.setAttribute('data-id', props.id || f.id || '');
      if (props.name) path.setAttribute('data-name', props.name);
      svg.appendChild(path);
    });

    if (options.labels !== false) {
      ordered.forEach(function (f) {
        var props = f.properties || {};
        if (!props.quiz && !props.labelOnMap) return;
        if (!props.labelPoint) return;
        var main = (props.parts || []).slice().sort(function (a, b) { return b.area - a.area; })[0];
        if (main && main.labelPoint) addLeader(svg, props.labelPoint, main.labelPoint, minX, maxY, scale);
        addLabel(svg, props.labelPoint, props.labelText || props.name, minX, maxY, scale, props.small ? 11 : 13, '#1c1915', props.labelAnchor, 'meca-label');
        (props.partLabels || []).forEach(function (lab) {
          var part = (props.parts || []).filter(function (p) { return p.role === lab.role; })[0];
          if (part) addLeader(svg, [lab.lon, lab.lat], part.labelPoint, minX, maxY, scale);
          addLabel(svg, [lab.lon, lab.lat], lab.text, minX, maxY, scale, 10, '#3e3a34', lab.anchor || 'middle', 'meca-part');
        });
      });
      (fc.seas || []).forEach(function (sea) {
        addLabel(svg, [sea.lon, sea.lat], sea.name, minX, maxY, scale, 12, '#1d4e6e', 'middle', 'meca-sea');
      });
    }

    var wrap = document.createElement('div');
    wrap.className = 'meca-map';
    wrap.appendChild(svg);
    container.appendChild(wrap);

    return {
      svg: svg,
      wrap: wrap,
      scale: scale,
      hit: function (clientX, clientY, slopPx) {
        var ll = clientToLonLat(svg, clientX, clientY);
        if (!ll) return null;
        return hitTestScreen(fc, ll[0], ll[1], scale * (svg.getBoundingClientRect().width / width), slopPx == null ? 18 : slopPx, options);
      },
      lonLat: function (clientX, clientY) { return clientToLonLat(svg, clientX, clientY); }
    };
  }

  function xy(lonLat, originX, originY, scale) {
    var p = project(lonLat[0], lonLat[1]);
    return [(p[0] - originX) * scale, (originY - p[1]) * scale];
  }

  function addLeader(svg, fromLonLat, toLonLat, originX, originY, scale) {
    var a = xy(fromLonLat, originX, originY, scale);
    var b = xy(toLonLat, originX, originY, scale);
    var dx = a[0] - b[0], dy = a[1] - b[1];
    if (dx * dx + dy * dy < 18 * 18) return;
    var line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', b[0].toFixed(1));
    line.setAttribute('y1', b[1].toFixed(1));
    line.setAttribute('x2', a[0].toFixed(1));
    line.setAttribute('y2', a[1].toFixed(1));
    line.setAttribute('class', 'meca-leader');
    svg.appendChild(line);
  }

  function addLabel(svg, lonLat, text, originX, originY, scale, size, fill, anchor, className) {
    var p = xy(lonLat, originX, originY, scale);
    var t = document.createElementNS(svg.namespaceURI, 'text');
    t.setAttribute('x', p[0].toFixed(1));
    t.setAttribute('y', p[1].toFixed(1));
    t.setAttribute('text-anchor', anchor || 'middle');
    t.setAttribute('font-family', 'Trebuchet MS, Segoe UI, sans-serif');
    t.setAttribute('font-size', String(size));
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', fill);
    t.setAttribute('stroke', '#f7f4ee');
    t.setAttribute('stroke-width', '3');
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('class', className || 'meca-label');
    t.textContent = text;
    svg.appendChild(t);
  }

  /* Pointer pan, wheel zoom, and pinch. Call the returned destroy() on teardown. */
  function attachPanZoom(wrap) {
    var svg = wrap.querySelector('svg');
    var vb = svg.viewBox.baseVal;
    var base = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
    var pointers = new Map();
    var drag = null;
    var pinch = null;

    function apply(x, y, w, h) {
      var minW = base.w / 12;
      if (w < minW) { h *= minW / w; w = minW; }
      if (w > base.w * 1.2) { x = base.x; y = base.y; w = base.w; h = base.h; }
      vb.x = x; vb.y = y; vb.width = w; vb.height = h;
    }

    function onDown(e) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      wrap.setPointerCapture(e.pointerId);
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, vb: { x: vb.x, y: vb.y, w: vb.width, h: vb.height } };
      else drag = null;
    }
    function onMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var rect = svg.getBoundingClientRect();
      if (pointers.size >= 2) {
        var pts = Array.from(pointers.values());
        var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        if (!pinch) pinch = { dist: dist, vb: { x: vb.x, y: vb.y, w: vb.width, h: vb.height }, mid: mid };
        var factor = pinch.dist / dist;
        var cx = pinch.vb.x + ((pinch.mid.x - rect.left) / rect.width) * pinch.vb.w;
        var cy = pinch.vb.y + ((pinch.mid.y - rect.top) / rect.height) * pinch.vb.h;
        var w = pinch.vb.w * factor, h = pinch.vb.h * factor;
        apply(cx - ((mid.x - rect.left) / rect.width) * w, cy - ((mid.y - rect.top) / rect.height) * h, w, h);
        return;
      }
      pinch = null;
      if (!drag) return;
      var mx = (e.clientX - drag.x) / rect.width * drag.vb.w;
      var my = (e.clientY - drag.y) / rect.height * drag.vb.h;
      apply(drag.vb.x - mx, drag.vb.y - my, drag.vb.w, drag.vb.h);
    }
    function onUp(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) drag = null;
    }
    function onWheel(e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var factor = e.deltaY > 0 ? 1.12 : 0.89;
      var cx = vb.x + ((e.clientX - rect.left) / rect.width) * vb.width;
      var cy = vb.y + ((e.clientY - rect.top) / rect.height) * vb.height;
      var w = vb.width * factor, h = vb.height * factor;
      apply(cx - ((e.clientX - rect.left) / rect.width) * w, cy - ((e.clientY - rect.top) / rect.height) * h, w, h);
    }
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return {
      reset: function () { apply(base.x, base.y, base.w, base.h); },
      destroy: function () {
        wrap.removeEventListener('pointerdown', onDown);
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerup', onUp);
        wrap.removeEventListener('pointercancel', onUp);
        wrap.removeEventListener('wheel', onWheel);
      }
    };
  }

  return {
    PHI0_DEGREES: 36,
    project: project,
    unproject: unproject,
    contains: contains,
    boundsOf: boundsOf,
    pathFromGeometry: pathFromGeometry,
    hitTest: hitTest,
    hitTestScreen: hitTestScreen,
    render: render,
    attachPanZoom: attachPanZoom
  };
});

export default globalThis.MECAMap
