// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "An index chart example.",
    width: 400,
    height: 200,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/index_data.json",
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
        title: "Date",
      },
      {
        scale: "y",
        orient: "left",
        title: "Value",
      },
    ],

    marks: [
      {
        name: "marks",
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
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "AggregateService",
            resultAlias: "result",
            sharedVar: {
              ops: ["index", "value"],
            },
          },
          (layer) => ({
            comp: "DrawTextTransformer",
            layer: layer.getLayerFromQueue("LensLayer"),
            sharedVar: {
              x: 0,
              y: 0,
              index: 0,
              value: 0,
            },
            redraw({ layer, transformer }) {
              const root = d3.select(layer.getGraphic());
              root.selectAll("*").remove();

              const x = transformer.getSharedVar("x");
              const y = transformer.getSharedVar("y");
              const index = transformer.getSharedVar("index");
              const value = transformer.getSharedVar("value");

              root
                .append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .text(`Index: ${index}, Value: ${value.toFixed(2)}`);
            },
          }),
        ],
      },
    ],
  });
}

main();