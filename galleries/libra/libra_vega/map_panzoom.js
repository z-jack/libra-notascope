// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic map visualization example.",
    width: 800,
    height: 500,
    padding: 5,

    data: [
      {
        name: "map",
        url: "data/map_data.json",
        format: {
          type: "topojson",
          feature: "counties",
        },
      },
    ],

    projections: [
      {
        name: "projection",
        type: "albersUsa",
        scale: 1200,
        translate: [480, 250],
      },
    ],

    marks: [
      {
        name: "marks",
        type: "shape",
        from: { data: "map" },
        encode: {
          update: {
            fill: { value: "#ddd" },
            stroke: { value: "#fff" },
            path: { field: "path" },
          },
        },
        transform: [{ type: "geoshape", projection: "projection" }],
      },
    ],
  };
}

async function renderStaticVisualization() {
  await vega(document.getElementById("LibraPlayground"), globalThis.vegaSpec);
}

module.exports = {
  loadData,
  renderStaticVisualization,
};

// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  await VIS.renderStaticVisualization();
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization() {
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "PanInstrument",
    layers: [layer],
    sharedVar: {
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });

  Libra.Interaction.build({
    inherit: "GeometricZoomInstrument",
    layers: [layer],
    sharedVar: {
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });
}

main();