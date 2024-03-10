// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic treemap visualization example.",
    width: 800,
    height: 600,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/treemap_data.json",
        transform: [
          {
            type: "stratify",
            key: "id",
            parentKey: "parent",
          },
          {
            type: "pack",
            field: "size",
            sort: { field: "value" },
          },
        ],
      },
    ],

    scales: [
      {
        name: "color",
        type: "linear",
        domain: { data: "source", field: "value" },
        range: { scheme: "yelloworangebrown" },
      },
    ],

    marks: [
      {
        name: "marks",
        type: "rect",
        from: { data: "source" },
        encode: {
          update: {
            x: { field: "x" },
            y: { field: "y" },
            width: { field: "r" },
            height: { field: "r" },
            fill: { scale: "color", field: "value" },
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
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { stroke: "red", strokeWidth: 2 },
    },
  });
}

main();