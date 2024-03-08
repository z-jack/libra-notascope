// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description:
      "A basic scatter plot example depicting automobile statistics.",
    width: 200,
    height: 200,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/cars.json",
        transform: [
          {
            type: "filter",
            expr: "datum['Horsepower'] != null && datum['Miles_per_Gallon'] != null && datum['Acceleration'] != null",
          },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "linear",
        round: true,
        nice: true,
        zero: true,
        domain: { data: "source", field: "Horsepower" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        round: true,
        nice: true,
        zero: true,
        domain: { data: "source", field: "Miles_per_Gallon" },
        range: "height",
      },
      {
        name: "size",
        type: "linear",
        round: true,
        nice: false,
        zero: true,
        domain: { data: "source", field: "Acceleration" },
        range: [4, 361],
      },
    ],

    axes: [
      {
        scale: "x",
        grid: true,
        domain: false,
        orient: "bottom",
        tickCount: 5,
        title: "Horsepower",
      },
      {
        scale: "y",
        grid: true,
        domain: false,
        orient: "left",
        titlePadding: 5,
        title: "Miles_per_Gallon",
      },
    ],

    legends: [
      {
        size: "size",
        title: "Acceleration",
        format: "s",
        symbolStrokeColor: "#4682b4",
        symbolStrokeWidth: 2,
        symbolOpacity: 0.5,
        symbolType: "circle",
      },
    ],

    marks: [
      {
        name: "marks",
        type: "symbol",
        from: { data: "source" },
        encode: {
          update: {
            x: { scale: "x", field: "Horsepower" },
            y: { scale: "y", field: "Miles_per_Gallon" },
            size: { scale: "size", field: "Acceleration" },
            shape: { value: "circle" },
            strokeWidth: { value: 2 },
            opacity: { value: 0.5 },
            stroke: { value: "#4682b4" },
            fill: { value: "transparent" },
          },
        },
      },
    ],
  };
}

async function renderStaticVisualization() {
  // render vega spec on screen
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
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  // Attach ClickInstrument to the main layer
  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { stroke: "red" },
    },
  });
}

main();
