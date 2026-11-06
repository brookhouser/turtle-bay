Copied into turtle-bay from brookhouser/sam-science-game commit `d686a6e` on branch `cursor/middle-east-central-asia-381e`. The attribution below is unchanged.

# Middle East and Central Asia map data

Reusable study-map data for Sam's 7th grade geography quiz on **Friday, November 13, 2026**. The quiz list is 22 countries. This folder is meant to move into the family hub (`brookhouser/turtle-bay`).

It is not a game page. It is not linked from the science-game home page. It is not published.

## Files

| File | What it is |
| --- | --- |
| `countries.json` | The 22 quiz countries, plus grey context neighbors. Regions, memory hooks, land borders, seas, spelling aliases, and label positions. |
| `geometry.geojson` | Country shapes in WGS84 longitude and latitude. Quiz countries and clipped neighbors. |
| `map.svg` | A static map. Quiz countries are colored by region. Neighbors are grey. Palestine is labeled, with the West Bank and Gaza marked. |
| `map-render.js` | Browser and Node helper. Projects the GeoJSON, draws an SVG, hit-tests taps, and can pan and zoom. Exposes `MECAMap` (browser) or `module.exports`. |
| `questions.json` | Question bank: tap the country, multiple choice, typed name, learn cards, a 10-minute blank-map practice spec, and a missed-item spec. |
| `questions.js` | `gradeTyped(countries, countryId, input)` with the spelling rules below. |
| `build-geometry.mjs` | Rebuilds `geometry.geojson`, `map.svg`, and `questions.json` from `countries.json` and Natural Earth. Does not edit `countries.json`. |

## The 22 countries

Arabian Peninsula: Yemen, Oman, Saudi Arabia, Qatar, United Arab Emirates, Kuwait.

Levant: Jordan, Israel, Palestine, Lebanon, Syria.

Turkey, Iraq, and Iran.

Caucasus: Azerbaijan, Armenia, Georgia.

The -stans: Kyrgyzstan, Turkmenistan, Tajikistan, Uzbekistan, Kazakhstan. "Stan" means land.

Grey countries (Egypt, Bahrain, Afghanistan, and others) are on the map for context. They are not quiz answers. Bahrain is the island next to Qatar. Afghanistan ends in -stan and is not on this list.

Palestine is one quiz answer. The shape is two pieces: the West Bank and the Gaza Strip. Both pieces count as Palestine. The lines are Natural Earth's admin-0 lines, drawn so the quiz list can be practiced. They are not a statement about sovereignty.

## Map source and license

**Source:** Natural Earth, Admin 0 country boundaries, 1:10 million, version 4.1.0.

**License:** Public domain. Natural Earth's terms say the vector data may be used in any manner, including modifying it and sharing it electronically. No permission is needed. https://www.naturalearthdata.com/about/terms-of-use/

The file that was read is the TopoJSON redistribution `countries-10m.json` from [world-atlas 2.0.2](https://github.com/topojson/world-atlas/tree/v2.0.2), which documents that file as Natural Earth 4.1.0. The world-atlas project code is ISC (Copyright 2013-2019 Michael Bostock). This folder does not include that code. `build-geometry.mjs` has its own decoder.

The SVG description includes the short credit "Made with Natural Earth."

Download used to build this: `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json`

Rebuild:

```bash
node build-geometry.mjs /path/to/countries-10m.json
```

The script checks that every quiz country's land-neighbor list matches shared Natural Earth borders, that a point inside each kept piece hits that country, and that the spelling grader accepts and rejects the cases named below.

## Drawing

`geometry.geojson` is not projected. `map.svg` and `map-render.js` use an equirectangular projection with a standard parallel of 36 degrees:

`x = longitude * cos(36°)`, `y = latitude`. SVG y is flipped.

Zoom boxes for the full map, the peninsula, the Gulf, the Levant, the Caucasus, the -stans, and Turkey are `meta.views` in `countries.json` (copied onto the GeoJSON). Qatar, Kuwait, the UAE, Lebanon, Israel, Palestine, and Armenia are marked `small: true`.

`MECAMap.hitTest` returns the smallest country that contains the point, so a tap inside Gaza is Palestine even if a simplified border overlaps a neighbor. `hitTestScreen` can add a few pixels of slop for `small` countries, and only when the point is not already inside a country.

## Question bank

Each quiz country has four items: `click`, `name-choice`, `name-typed`, and `learn`. Learn cards use the memory hook, the region, and the neighbors.

`sets.timedBlankMap` is a blank-map practice of all 22 names with a 10-minute timer and no word bank. That timer is practice, not the length of the class quiz. `sets.missedReview` is the spec for practicing only missed countries.

Typed answers go through `gradeTyped`:

- Lowercase, strip accents and apostrophes, turn `&` into "and", drop a leading "the".
- `U.A.E.` and `UAE` both match the United Arab Emirates. `Saudi` matches Saudi Arabia. `Türkiye` matches Turkey.
- One edit is allowed for names up to 6 letters, two edits for longer names, and only when this country is strictly closer than every other quiz country.
- Iraq and Iran never fuzzy-match each other.
- For Palestine, "West Bank and Gaza" is accepted. "Gaza" alone or "West Bank" alone is not.

## Known issues

- There is no playable game here: no click-through modes, no missed-item screen, no timer UI, and no tower defense. Those were stopped when this moved to the family hub.
- Borders were simplified one country at a time (about 0.012 degrees on small pieces, about 0.04 degrees on the largest countries), then rounded to 4 decimal degrees. Neighbors can have a hairline gap or a slight overlap.
- Interior lakes are filled so a tap in the middle of a country still hits it. Tiny Fergana Valley enclaves are not split out.
- Pieces smaller than about 0.05 square degrees were dropped, except Gaza. Pieces that are kept besides the mainland: Socotra (Yemen), Musandam and Masirah (Oman), Nakhchivan (Azerbaijan), European Turkey, Qeshm (Iran), and a small northern piece of Kuwait.
- Cyprus is context only. Natural Earth splits it into Cyprus, N. Cyprus, and a U.N. buffer zone. Those pieces are drawn as one grey island so the neighbor is one shape. That is a display merge, not a claim.
- Russia, China, and the other context countries are clipped to the map window (about 24°E–89°E, 11°N–56.5°N).
- At the full map scale, Levant labels sit close together. The Levant, Gulf, and Caucasus views are there for a zoomed map. Leader lines connect a few labels that sit outside the country.
- The static SVG was opened in headless Chrome and checked by eye. `map-render.js` was not mounted on a page. Hit tests and the spelling checks ran in Node as part of `build-geometry.mjs`.
