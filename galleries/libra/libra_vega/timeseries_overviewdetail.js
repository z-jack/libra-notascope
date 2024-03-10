// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A time series visualization with overview and detail views.",
    width: 800,
    height: 400,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/timeseries_data.json",
        transform: [
          {
            type: "filter",
            expr: "datum['date'] != null && datum['value'] != null",
          },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "time",
        domain: { data: "source", field: "date" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        domain: { data: "source", field: "value" },
        nice: true,
        range: "height",
      },
    ],

    axes: [
      {
        scale: "x",
        orient: "bottom",
        title: "Time",
      },
      {
        scale: "y",
        orient: "left",
        title: "Value",
      },
    ],

    marks: [
      {
        name: "main",
        type: "line",
        from: { data: "source" },
        encode: {
          update: {
            x: { scale: "x", field: "date" },
            y: { scale: "y", field: "value" },
            stroke: { value: "steelblue" },
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
    group: "main",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "OverviewInstrument",
    layers: [layer],
    sharedVar: {
      overviewHeight: 100,
      overviewBrushColor: "red",
    },
  });
}

main();