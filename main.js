const cityColors = {
  "柏市": "#2f80ed",
  "松戸市": "#27ae60",
  "流山市": "#f2994a",
};

const memorialHall = {
  name: "廣池千九郎記念館",
  lat: 35.833084493185424,
  lng: 139.95417347477317,
};

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true,
}).setView([memorialHall.lat, memorialHall.lng], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const getCityName = (feature) =>
  feature?.properties?.N03_004 ||
  feature?.properties?.name ||
  feature?.properties?.NAME ||
  "市区町村";

const cityStyle = (feature) => {
  const name = getCityName(feature);
  const color = cityColors[name] || "#60707a";
  return {
    color,
    weight: 2,
    opacity: 0.95,
    fillColor: color,
    fillOpacity: 0.24,
  };
};

const reitakuStyle = {
  color: "#d81b3a",
  weight: 4,
  opacity: 1,
  fillColor: "#d81b3a",
  fillOpacity: 0.08,
};

const schoolStyle = {
  radius: 5,
  color: "#172026",
  weight: 1,
  opacity: 1,
  fillColor: "#ffd43b",
  fillOpacity: 0.92,
};

const loadGeoJson = async (urls) => {
  const candidates = Array.isArray(urls) ? urls : [urls];
  const tried = [];

  for (const url of candidates) {
    tried.push(url);
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }
  }

  throw new Error(`GeoJSONを読み込めませんでした: ${tried.join(", ")}`);
};

const loadOptionalText = async (urls) => {
  const candidates = Array.isArray(urls) ? urls : [urls];

  for (const url of candidates) {
    const response = await fetch(url);
    if (response.ok) {
      return {
        url,
        text: await response.text(),
      };
    }
  }

  return null;
};

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map((header) => header.trim());

  return lines
    .map((line) => {
      const values = line.split(",").map((value) => value.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    })
    .filter((row) => Object.values(row).some(Boolean));
};

const schoolsFromCsv = (text) => {
  const rows = parseCsv(text);
  return rows
    .map((row) => {
      const lat = Number(row.lat || row.latitude || row.Latitude || row["緯度"]);
      const lng = Number(row.lng || row.lon || row.longitude || row.Longitude || row["経度"]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        type: "Feature",
        properties: {
          name: row.name || row.Name || row["学校名"] || "学校",
          category: row.category || row.type || row["種別"] || "",
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      };
    })
    .filter(Boolean);
};

const schoolsFromGeoJson = (geojson) => {
  if (geojson.type === "FeatureCollection") return geojson.features || [];
  if (geojson.type === "Feature") return [geojson];
  return [];
};

const featureLatLng = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry || geometry.type !== "Point") return null;

  const [lng, lat] = geometry.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return L.latLng(lat, lng);
};

const getSchoolName = (feature) =>
  feature?.properties?.name ||
  feature?.properties?.Name ||
  feature?.properties?.["学校名"] ||
  "学校";

const getSchoolCategory = (feature) =>
  feature?.properties?.category ||
  feature?.properties?.type ||
  feature?.properties?.["種別"] ||
  "";

const addCityLayer = (geojson) =>
  L.geoJSON(geojson, {
    style: cityStyle,
    onEachFeature: (feature, layer) => {
      const name = getCityName(feature);
      layer.bindPopup(`<strong>${name}</strong>`);
    },
  }).addTo(map);

const addCityLabels = (cityLayer) => {
  const boundsByCity = {};
  const labelLayer = L.layerGroup();

  cityLayer.eachLayer((layer) => {
    const name = getCityName(layer.feature);
    if (!layer.getBounds) return;

    if (!boundsByCity[name]) {
      boundsByCity[name] = layer.getBounds();
      return;
    }

    boundsByCity[name].extend(layer.getBounds());
  });

  Object.entries(boundsByCity).forEach(([name, bounds]) => {
    L.marker(bounds.getCenter(), {
      interactive: false,
      icon: L.divIcon({
        className: "city-label",
        html: name,
        iconSize: null,
      }),
    }).addTo(labelLayer);
  });

  const syncLabels = () => {
    if (map.getZoom() >= 12 && !map.hasLayer(labelLayer)) {
      labelLayer.addTo(map);
    }
    if (map.getZoom() < 12 && map.hasLayer(labelLayer)) {
      map.removeLayer(labelLayer);
    }
  };

  map.on("zoomend", syncLabels);
  syncLabels();
};

const addReitakuLayer = (geojson) =>
  L.geoJSON(geojson, {
    style: reitakuStyle,
    pointToLayer: (_feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        ...reitakuStyle,
      }),
    onEachFeature: (_feature, layer) => {
      layer.bindPopup("<strong>麗澤大学</strong>");
    },
  }).addTo(map);

const addDistanceRings = () => {
  L.circle([memorialHall.lat, memorialHall.lng], {
    radius: 5000,
    color: "#7c3aed",
    weight: 2,
    opacity: 0.85,
    fillColor: "#7c3aed",
    fillOpacity: 0.04,
  })
    .bindPopup("廣池千九郎記念館から5km")
    .addTo(map);

  L.circle([memorialHall.lat, memorialHall.lng], {
    radius: 10000,
    color: "#0f766e",
    weight: 2,
    opacity: 0.85,
    fillColor: "#0f766e",
    fillOpacity: 0.035,
  })
    .bindPopup("廣池千九郎記念館から10km")
    .addTo(map);

  L.circleMarker([memorialHall.lat, memorialHall.lng], {
    radius: 8,
    color: "#fff",
    weight: 2,
    fillColor: "#d81b3a",
    fillOpacity: 1,
  })
    .bindPopup(`<strong>${memorialHall.name}</strong><br>集計の中心点`)
    .addTo(map);
};

const addSchoolLayer = (features) => {
  let count5km = 0;
  let count10km = 0;
  const center = L.latLng(memorialHall.lat, memorialHall.lng);

  const validFeatures = features.filter((feature) => {
    const latLng = featureLatLng(feature);
    if (!latLng) return false;

    const distance = center.distanceTo(latLng);
    feature.properties = {
      ...(feature.properties || {}),
      distanceKm: distance / 1000,
    };

    if (distance <= 5000) count5km += 1;
    if (distance <= 10000) count10km += 1;
    return distance <= 10000;
  });

  L.geoJSON(
    {
      type: "FeatureCollection",
      features: validFeatures,
    },
    {
      pointToLayer: (_feature, latlng) => L.circleMarker(latlng, schoolStyle),
      onEachFeature: (feature, layer) => {
        const name = getSchoolName(feature);
        const category = getSchoolCategory(feature);
        const distance = feature.properties.distanceKm.toFixed(2);
        const categoryLine = category ? `${category}<br>` : "";
        layer.bindPopup(`<strong>${name}</strong><br>${categoryLine}${distance}km`);
      },
    },
  ).addTo(map);

  document.getElementById("count-5km").textContent = String(count5km);
  document.getElementById("count-10km").textContent = String(count10km);
  document.getElementById("school-status").textContent =
    `10km圏内に表示中: ${validFeatures.length}校`;
};

const loadSchools = async () => {
  const loaded = await loadOptionalText([
    "./data/schools.geojson",
    "./schools.geojson",
    "./data/schools.csv",
    "./schools.csv",
  ]);

  if (!loaded) {
    document.getElementById("school-status").textContent =
      "schools.geojson または schools.csv を追加すると集計します";
    return;
  }

  if (loaded.url.endsWith(".csv")) {
    addSchoolLayer(schoolsFromCsv(loaded.text));
    return;
  }

  addSchoolLayer(schoolsFromGeoJson(JSON.parse(loaded.text)));
};

const fitToLayers = (layers) => {
  const group = L.featureGroup(layers);
  map.fitBounds(group.getBounds(), {
    padding: [28, 28],
    maxZoom: 15,
  });
};

const fitToReitaku = (reitakuLayer, fallbackLayers) => {
  if (reitakuLayer.getBounds && reitakuLayer.getBounds().isValid()) {
    map.fitBounds(reitakuLayer.getBounds(), {
      padding: [120, 120],
      maxZoom: 15,
    });
    return;
  }

  fitToLayers(fallbackLayers);
};

const fitToStudyArea = () => {
  const bounds = L.circle([memorialHall.lat, memorialHall.lng], {
    radius: 10000,
  }).getBounds();

  map.fitBounds(bounds, {
    padding: [28, 28],
  });
};

const init = async () => {
  try {
    const [cities, reitaku] = await Promise.all([
      loadGeoJson([
        "./data/kashiwa_matudo_nagareyama.geojson",
        "./data/kashiwa_matsudo_nagareyama.geojson",
        "./kashiwa_matudo_nagareyama.geojson",
        "./kashiwa_matsudo_nagareyama.geojson",
      ]),
      loadGeoJson(["./data/reitaku.geojson", "./reitaku.geojson"]),
    ]);

    const cityLayer = addCityLayer(cities);
    addCityLabels(cityLayer);
    const reitakuLayer = addReitakuLayer(reitaku);
    addDistanceRings();
    await loadSchools();
    fitToStudyArea();
  } catch (error) {
    const message = document.createElement("div");
    message.className = "load-error";
    message.textContent =
      "GeoJSONを読み込めませんでした。dataフォルダ内のファイル名と配置を確認してください。";
    document.body.appendChild(message);
    console.error(error);
  }
};

init();
