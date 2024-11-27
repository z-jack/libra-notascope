// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description:
      "A basic scatter plot example depicting automobile statistics.",
    width: 300,
    height: 300,
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

    signals: [
      {
        name: "xDom",
        init: "extent(pluck(data('source'), 'Horsepower'))",
      },
      {
        name: "yDom",
        init: "extent(pluck(data('source'), 'Miles_per_Gallon'))",
      },
    ],

    scales: [
      {
        name: "x",
        type: "linear",
        zero: false,
        domain: { signal: "xDom" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        zero: false,
        domain: { signal: "yDom" },
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
        clip: true,
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
