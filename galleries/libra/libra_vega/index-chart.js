// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description:
      "An interactive line chart of stock prices, with returns shown relative to a selected date.",
    width: 650,
    height: 300,
    padding: 5,
    autosize: { type: "fit", contains: "padding" },

    signals: [
      {
        name: "currentDate",
        value: "Jan 1 2005",
      },
      {
        name: "indexDate",
        update: "time(currentDate)",
      },
      {
        name: "maxDate",
        update: "time('Mar 1 2010')",
      },
    ],

    data: [
      {
        name: "stocks",
        url: "data/stocks.csv",
        format: { type: "csv", parse: { price: "number", date: "date" } },
      },
      {
        name: "index",
        source: "stocks",
        transform: [
          {
            type: "filter",
            expr: "month(datum.date) == month(indexDate) && year(datum.date) == year(indexDate)",
          },
        ],
      },
      {
        name: "indexed_stocks",
        source: "stocks",
        transform: [
          {
            type: "lookup",
            from: "index",
            key: "symbol",
            fields: ["symbol"],
            as: ["index"],
            default: { price: 0 },
          },
          {
            type: "formula",
            as: "indexed_price",
            expr: "datum.index.price > 0 ? (datum.price - datum.index.price)/datum.index.price : 0",
          },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "time",
        domain: { data: "stocks", field: "date" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        domain: { data: "indexed_stocks", field: "indexed_price" },
        nice: true,
        zero: true,
        range: "height",
      },
      {
        name: "color",
        type: "ordinal",
        range: "category",
        domain: { data: "stocks", field: "symbol" },
      },
    ],

    axes: [{ orient: "left", scale: "y", grid: true, format: "%" }],

    marks: [
      {
        type: "group",
        from: {
          facet: {
            name: "series",
            data: "indexed_stocks",
            groupby: "symbol",
          },
        },
        data: [
          {
            name: "label",
            source: "series",
            transform: [{ type: "filter", expr: "datum.date == maxDate" }],
          },
        ],
        marks: [
          {
            type: "line",
            from: { data: "series" },
            encode: {
              update: {
                x: { scale: "x", field: "date" },
                y: { scale: "y", field: "indexed_price" },
                stroke: { scale: "color", field: "symbol" },
                strokeWidth: { value: 2 },
              },
            },
          },
          {
            type: "text",
            from: { data: "label" },
            encode: {
              update: {
                x: { scale: "x", field: "date", offset: 2 },
                y: { scale: "y", field: "indexed_price" },
                fill: { scale: "color", field: "symbol" },
                text: { field: "symbol" },
                baseline: { value: "middle" },
              },
            },
          },
        ],
      },
      {
        name: "marks",
        type: "rule",
        encode: {
          update: {
            x: { field: { group: "x" } },
            x2: { field: { group: "width" } },
            y: { value: 0.5, offset: { scale: "y", value: 0, round: true } },
            stroke: { value: "black" },
            strokeWidth: { value: 1 },
          },
        },
      },
      {
        type: "rule",
        encode: {
          update: {
            x: { scale: "x", signal: "indexDate", offset: 0.5 },
            y: { value: 0 },
            y2: { field: { group: "height" } },
            stroke: { value: "firebrick" },
          },
        },
      },
      {
        type: "text",
        encode: {
          update: {
            x: { scale: "x", signal: "indexDate" },
            y2: { field: { group: "height" }, offset: 15 },
            align: { value: "center" },
            text: { signal: "timeFormat(indexDate, '%b %Y')" },
            fill: { value: "firebrick" },
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
  const [mainLayer, mainTransformer] = renderMainVisualization();
  mountInteraction(mainLayer, mainTransformer);
}

function renderMainVisualization() {
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  // Initialize Main Transformer
  const mainTransformer = Libra.GraphicalTransformer.register(
    "MainTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        result: new Date(2004, 0, 1),
      },
      async redraw({ transformer }) {
        const date = transformer.getSharedVar("result");
        globalThis.vegaView.signal("currentDate", date.toString());
        await globalThis.vegaView.runAsync();
      },
    }
  );

  return [mainLayer, mainTransformer];
}

function mountInteraction(layer, transformer) {
  Libra.Service.register("ReverseScaleService", {
    sharedVar: {
      scaleX: globalThis.x,
    },
    evaluate({ event, scaleX }) {
      if (!event) return new Date(2004, 0, 1);
      const x = scaleX.invert(event.x);
      return x;
    },
  });

  // Attach HoverInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          { comp: "ReverseScaleService" },
          {
            comp: "MainTransformer",
          },
        ],
      },
    ],
  });
}

main();
