// global constants
globalThis.FIELD_X = "Horsepower";
globalThis.FIELD_Y = "Miles_per_Gallon";
globalThis.FIELD_COLOR = "Origin";

// global variables
globalThis.vegaSpec = {};
globalThis.data = [];
globalThis.data_detail_level2 = [];
globalThis.data_detail_level1 = [];
globalThis.data_detail_level0 = [];

async function loadData() {
  const binX = (i) =>
    d3
      .bin()
      .value((d) => d[globalThis.FIELD_X])
      .thresholds(i);
  const binY = (i) =>
    d3
      .bin()
      .value((d) => d[globalThis.FIELD_Y])
      .thresholds(i);

  const binXY = (data, i) => binX(i)(data).map(binY(i));
  const mergeXY = (xList) =>
    xList.flatMap((yList) =>
      yList.flatMap((xyList) => {
        const collection = {};
        xyList.forEach((datum) => {
          if (!collection[datum[globalThis.FIELD_COLOR]]) {
            collection[datum[globalThis.FIELD_COLOR]] = [];
          }
          collection[datum[globalThis.FIELD_COLOR]].push(datum);
        });
        return Object.values(collection).map((arr) =>
          arr.reduce(
            (p, c, _, a) => ({
              [globalThis.FIELD_X]:
                p[globalThis.FIELD_X] + c[globalThis.FIELD_X] / a.length,
              [globalThis.FIELD_Y]:
                p[globalThis.FIELD_Y] + c[globalThis.FIELD_Y] / a.length,
              [globalThis.FIELD_COLOR]: c[globalThis.FIELD_COLOR],
              count: p.count + c.count,
            }),
            {
              [globalThis.FIELD_X]: 0,
              [globalThis.FIELD_Y]: 0,
              count: 0,
            }
          )
        );
      })
    );

  globalThis.data = (await d3.json("./data/cars.json")).filter(
    (d) => !!(d["Horsepower"] && d["Miles_per_Gallon"])
  );
  globalThis.data_detail_level0 = globalThis.data.map((x) => ({
    ...x,
    count: 1,
  }));
  globalThis.data_detail_level1 = mergeXY(
    binXY(globalThis.data_detail_level0, 10)
  );
  globalThis.data_detail_level2 = mergeXY(
    binXY(globalThis.data_detail_level1, 8)
  );
  globalThis.data_detail_level3 = mergeXY(
    binXY(globalThis.data_detail_level2, 6)
  );
  globalThis.data_detail_level4 = mergeXY(
    binXY(globalThis.data_detail_level3, 4)
  );
  globalThis.data_detail_level5 = mergeXY(
    binXY(globalThis.data_detail_level4, 2)
  );
  globalThis.data_detail_level6 = mergeXY(
    binXY(globalThis.data_detail_level5, 1)
  );

  console.log(globalThis);

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
        values: globalThis.data_detail_level1,
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
        domain: [1, 200],
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
        title: "count",
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
            size: { scale: "size", field: "count" },
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
      data: globalThis.data_detail_level1,
    },
    async redraw({ transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const data = transformer.getSharedVar("data");
      globalThis.vegaView.signal("xDom", scaleX.domain());
      globalThis.vegaView.signal("yDom", scaleY.domain());
      globalThis.vegaView.data("source", data);
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
    inherit: "SemanticZoomInstrument",
    layers: [layer],
    sharedVar: {
      scaleLevels: {
        3: { data: globalThis.data_detail_level0 },
        0: { data: globalThis.data_detail_level1 },
        "-3": { data: globalThis.data_detail_level2 },
        "-6": { data: globalThis.data_detail_level3 },
        "-9": { data: globalThis.data_detail_level4 },
        "-12": { data: globalThis.data_detail_level5 },
        "-15": { data: globalThis.data_detail_level6 },
      },
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });
}

main();
