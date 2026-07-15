const cityColors = {
  "柏市": "#2f80ed",
  "松戸市": "#27ae60",
  "流山市": "#f2994a",
};

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true,
}).setView([35.833, 139.955], 13);

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
    fitToReitaku(reitakuLayer, [cityLayer, reitakuLayer]);
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
