// global variables
globalThis.data = [];
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.data = await d3.csv(
    "./data/bls-metro-unemployment.csv",
    d3.autoType
  );
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic line chart example.",
    width: 500,
    height: 300,
    padding: 5,

    data: [
      {
        name: "table",
        values: globalThis.data,
      },
    ],

    signals: [
      {
        name: "xDom",
        init: "extent(pluck(data('table'), 'date'))",
      },
      {
        name: "yDom",
        init: "extent(pluck(data('table'), 'unemployment'))",
      },
    ],

    scales: [
      {
        name: "x",
        type: "time",
        range: "width",
        domain: { signal: "xDom" },
      },
      {
        name: "y",
        type: "linear",
        range: "height",
        zero: false,
        domain: { signal: "yDom" },
      },
    ],

    axes: [
      { orient: "bottom", scale: "x" },
      { orient: "left", scale: "y" },
    ],

    marks: [
      {
        name: "marks",
        type: "group",
        from: {
          facet: {
            name: "series",
            data: "table",
            groupby: "division",
          },
        },
        marks: [
          {
            type: "line",
            from: { data: "series" },
            encode: {
              update: {
                x: { scale: "x", field: "date" },
                y: { scale: "y", field: "unemployment" },
                stroke: { value: "steelblue" },
                strokeWidth: { value: 1 },
              },
            },
          },
        ],
      },
    ],
  };
}

async function renderStaticVisualization() {
  // render vega spec on screen
  const { view } = await vega(
    document.getElementById("LibraPlayground"),
    globalThis.vegaSpec
  );
  globalThis.vegaView = view;
  globalThis.x = view.scale("x");
  globalThis.y = view.scale("y");
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
  const [mainLayer, transformer] = renderMainVisualization();
  mountInteraction(mainLayer, transformer);
}

function renderMainVisualization() {
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  Libra.GraphicalTransformer.register("DrawAxesAndMarks", {
    sharedVar: {
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
    async redraw({ transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      globalThis.vegaView.signal("xDom", scaleX.domain());
      globalThis.vegaView.signal("yDom", scaleY.domain());
      await globalThis.vegaView.runAsync();
    },
  });

  const transformer = Libra.GraphicalTransformer.initialize(
    "DrawAxesAndMarks",
    {
      layer: mainLayer,
    }
  );

  return [mainLayer, transformer];
}

function mountInteraction(layer, transformer) {
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
