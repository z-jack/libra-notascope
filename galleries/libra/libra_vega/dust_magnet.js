// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A dust magnet visualization example.",
    width: 400,
    height: 400,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/dust_data.json",
        transform: [
          {
            type: "filter",
            expr: "datum['x'] != null && datum['y'] != null",
          },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "linear",
        domain: { data: "source", field: "x" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        domain: { data: "source", field: "y" },
        range: "height",
      },
    ],

    marks: [
      {
        name: "marks",
        type: "symbol",
        from: { data: "source" },
        encode: {
          update: {
            x: { scale: "x", field: "x" },
            y: { scale: "y", field: "y" },
            shape: { value: "circle" },
            fill: { value: "steelblue" },
          },
        },
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
    inherit: "DustMagnetInstrument",
    layers: [layer],
    sharedVar: {
      maxDistance: 100,
      maxForce: 0.1,
      forceDecayRate: 0.8,
    },
  });
}

main();