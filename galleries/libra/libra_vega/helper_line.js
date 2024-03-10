// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic bar chart example.",
    width: 400,
    height: 200,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/bar_data.json",
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
        type: "band",
        domain: { data: "source", field: "x" },
        range: "width",
        padding: 0.1,
      },
      {
        name: "y",
        type: "linear",
        domain: { data: "source", field: "y" },
        nice: true,
        range: "height",
      },
    ],

    axes: [
      {
        scale: "x",
        orient: "bottom",
        title: "X-Axis",
      },
      {
        scale: "y",
        orient: "left",
        title: "Y-Axis",
      },
    ],

    marks: [
      {
        name: "marks",
        type: "rect",
        from: { data: "source" },
        encode: {
          update: {
            x: { scale: "x", field: "x" },
            width: { scale: "x", band: 1 },
            y: { scale: "y", field: "y" },
            y2: { scale: "y", value: 0 },
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
          (layer) => ({
            comp: "DrawLineTransformer",
            layer: layer.getLayerFromQueue("LensLayer"),
            sharedVar: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 0,
            },
            redraw({ layer, transformer }) {
              const root = d3.select(layer.getGraphic());
              root.selectAll("*").remove();

              const x1 = transformer.getSharedVar("x1");
              const y1 = transformer.getSharedVar("y1");
              const x2 = transformer.getSharedVar("x2");
              const y2 = transformer.getSharedVar("y2");

              root
                .append("line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke", "red")
                .attr("stroke-width", 2);
            },
          }),
        ],
      },
    ],
  });
}

main();