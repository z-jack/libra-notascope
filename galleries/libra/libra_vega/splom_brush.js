// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A scatter plot matrix (SPLOM) visualization example.",
    width: 600,
    height: 600,
    padding: 20,

    data: [
      {
        name: "source",
        url: "data/splom_data.json",
        transform: [
          {
            type: "filter",
            expr: "datum['x'] != null && datum['y'] != null && datum['z'] != null",
          },
        ],
      },
    ],

    signals: [
      {
        name: "columns",
        value: ["x", "y", "z"],
      },
    ],

    marks: [
      {
        name: "splom",
        type: "rect",
        from: {
          facet: {
            data: "source",
            name: "splom",
            groupby: ["x", "y"],
            layout: {
              columns: { signal: "columns.length" },
              padding: 10,
              bounds: "full",
            },
          },
        },
        encode: {
          update: {
            x: { field: "x.value" },
            x2: { field: "x2.value" },
            y: { field: "y.value" },
            y2: { field: "y2.value" },
            fill: { value: "transparent" },
            stroke: { value: "#ddd" },
            strokeWidth: { value: 1 },
          },
        },
      },
      {
        name: "points",
        type: "symbol",
        from: { facet: { data: "splom", name: "points" } },
        encode: {
          update: {
            x: { field: "x.value" },
            y: { field: "y.value" },
            size: { value: 10 },
            fill: { value: "steelblue" },
            stroke: { value: "white" },
            strokeWidth: { value: 0.5 },
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
    group: "points",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { stroke: "red", strokeWidth: 2 },
    },
  });
}

main();