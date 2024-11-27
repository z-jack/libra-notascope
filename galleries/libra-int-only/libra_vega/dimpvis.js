// global constants
globalThis.START_YEAR = 1980;

// global variables
globalThis.data = [];
globalThis.year = globalThis.START_YEAR;
globalThis.vegaSpec = {};
globalThis.vegaView = null;

// shared scales
globalThis.x = null;
globalThis.y = null;

async function loadData() {
  //Read the data
  globalThis.data = await d3.json("./data/gapminder.json");
  globalThis.interpolatedData = globalThis.data.filter(
    (x) => x.year === globalThis.year
  );

  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description:
      "An interactive scatter plot of global health statistics by country and year.",
    width: 800,
    height: 600,
    padding: 5,

    data: [
      {
        name: "gapminder",
        values: globalThis.data,
      },
      {
        name: "interpolatedData",
        values: globalThis.interpolatedData,
      },
      {
        name: "year",
        values: [globalThis.year],
      },
      {
        name: "clusters",
        values: [
          { id: 0, name: "South Asia" },
          { id: 1, name: "Europe & Central Asia" },
          { id: 2, name: "Sub-Saharan Africa" },
          { id: 3, name: "America" },
          { id: 4, name: "East Asia & Pacific" },
          { id: 5, name: "Middle East & North Africa" },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "linear",
        nice: true,
        domain: { data: "gapminder", field: "fertility" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        nice: true,
        zero: false,
        domain: { data: "gapminder", field: "life_expect" },
        range: "height",
      },
      {
        name: "color",
        type: "ordinal",
        domain: { data: "gapminder", field: "cluster" },
        range: "category",
      },
      {
        name: "label",
        type: "ordinal",
        domain: { data: "clusters", field: "id" },
        range: { data: "clusters", field: "name" },
      },
    ],

    axes: [
      {
        title: "Fertility",
        orient: "bottom",
        scale: "x",
        grid: true,
        tickCount: 5,
      },
      {
        title: "Life Expectancy",
        orient: "left",
        scale: "y",
        grid: true,
        tickCount: 5,
      },
    ],

    legends: [
      {
        fill: "color",
        title: "Region",
        orient: "right",
        encode: {
          symbols: {
            enter: {
              fillOpacity: { value: 0.5 },
            },
          },
          labels: {
            update: {
              text: { scale: "label", field: "value" },
            },
          },
        },
      },
    ],

    marks: [
      {
        type: "text",
        encode: {
          update: {
            text: { signal: "data('year')[0].data" },
            x: { value: 300 },
            y: { value: 300 },
            fill: { value: "grey" },
            fillOpacity: { value: 0.25 },
            fontSize: { value: 100 },
          },
        },
      },
      {
        name: "point",
        type: "symbol",
        from: { data: "interpolatedData" },
        encode: {
          enter: {
            fill: { scale: "color", field: "cluster" },
            size: { value: 150 },
          },
          update: {
            x: { scale: "x", field: "fertility" },
            y: { scale: "y", field: "life_expect" },
            fillOpacity: { value: 0.5 },
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
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization() {
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "point",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  // Register TraceTransformer
  Libra.GraphicalTransformer.register("TraceTransformer", {
    redraw: function ({ layer }) {
      const data = this.getSharedVar("result");
      if (data) {
        // Draw the trace
        const transientLayer = layer.getLayerFromQueue("transientLayer");
        d3.select(transientLayer.getGraphic()).selectAll("*").remove();
        d3.select(transientLayer.getGraphic())
          .append("g")
          .attr("class", "trace")
          .attr(
            "transform",
            `translate(${layer._offset.x}, ${layer._offset.y})`
          )
          .call((g) => {
            g.append("path")
              .attr(
                "d",
                d3.line(
                  (d) => globalThis.x(d.fertility),
                  (d) => globalThis.y(d.life_expect)
                )(data)
              )
              .attr("fill", "none")
              .attr("stroke", "#bbb")
              .attr("stroke-width", 3)
              .attr("stroke-opacity", 0.5);
          })
          .call((g) => {
            g.selectAll("text")
              .data(data)
              .enter()
              .append("text")
              .attr("fill", "#555")
              .attr("fill-opacity", 0.6)
              .attr("font-size", 12)
              .attr("x", (d) => globalThis.x(d.fertility))
              .attr("y", (d) => globalThis.y(d.life_expect))
              .text((d) => d.year);
          });
      }
    },
  });

  Libra.GraphicalTransformer.register("MainTransformer", {
    async redraw({ transformer }) {
      const result = transformer.getSharedVar("result");
      if (result) {
        globalThis.interpolatedData = result;
        globalThis.vegaView.data("interpolatedData", result);
        globalThis.vegaView.data("year", result[0].year);
        await globalThis.vegaView.runAsync(); // Wait for rendering to avoid memory
      }
    },
  });

  const useTraceTransformerFlow = {
    find: "SelectionService",
    flow: [
      {
        comp: "FilterService",
        sharedVar: {
          data: globalThis.data,
          fields: ["country"],
        },
      },
      {
        comp: "TraceTransformer",
      },
    ],
  };

  const useCountryFlow = {
    find: "SelectionService",
    flow: [
      {
        comp: "TextTransformer",
        layer: layer.getLayerFromQueue("countryLayer"),
        sharedVar: {
          field: "country",
          position: (d) =>
            globalThis.interpolatedData
              .filter((dd) => dd.country == d.country)
              .map((d) => ({
                x: globalThis.x(d.fertility),
                y: globalThis.y(d.life_expect),
              }))[0],
        },
      },
    ],
  };

  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    remove: [{ find: "SelectionTransformer" }],
    insert: [useTraceTransformerFlow, useCountryFlow],
  });

  Libra.Interaction.build({
    inherit: "DragInstrument",
    layers: [layer],
    remove: [{ find: "SelectionTransformer" }],
    insert: [
      useTraceTransformerFlow,
      useCountryFlow,
      {
        find: "SelectionService",
        flow: [
          {
            comp: "NearestPointService",
            sharedVar: { layer: layer.getLayerFromQueue("transientLayer") },
            evaluate(options) {
              const { layer, offsetx, offsety } = options;
              const point = [offsetx, offsety];
              if (layer && offsetx && offsety) {
                const year = d3
                  .select(layer.getGraphic())
                  .select(".trace")
                  .selectAll("text")
                  .data();
                const trace = d3
                  .select(layer.getGraphic())
                  .select("path")
                  .attr("d");
                const poly = trace
                  .slice(1)
                  .split("L")
                  .map((pStr) => pStr.split(",").map((num) => parseFloat(num)));
                return {
                  data: year,
                  interpolatedNum: interpolateNNPointFromPoly(
                    [point[0] - layer._offset.x, point[1] - layer._offset.y],
                    poly
                  ),
                };
              }
              return null;
            },
          },
          {
            comp: "InterpolationService",
            sharedVar: {
              data: globalThis.data,
              field: "year",
              formula: {
                year: (d) => Math.floor(d.year / 5) * 5, // Year divisible by 5
              },
            },
          },
          {
            comp: "MainTransformer",
          },
        ],
      },
    ],
  });
}

function interpolateNNPointFromPoly(point, polyline) {
  // Find the squared distance between two points
  function distanceSquared(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
  }

  // Find the closest point on a polyline from a given point
  let minDistance = Number.MAX_VALUE;
  let interpolationFactor = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    let lineStart = polyline[i];
    let lineEnd = polyline[i + 1];
    let lineLengthSquared = distanceSquared(lineStart, lineEnd);
    let u =
      ((point[0] - lineStart[0]) * (lineEnd[0] - lineStart[0]) +
        (point[1] - lineStart[1]) * (lineEnd[1] - lineStart[1])) /
      lineLengthSquared;
    let closest = null;
    if (u < 0) {
      closest = lineStart;
    } else if (u > 1) {
      closest = lineEnd;
    } else {
      closest = [
        lineStart[0] + u * (lineEnd[0] - lineStart[0]),
        lineStart[1] + u * (lineEnd[1] - lineStart[1]),
      ];
    }
    let distance = distanceSquared(point, closest);
    if (distance < minDistance) {
      minDistance = distance;
      if (u < 0) {
        interpolationFactor = i;
      } else if (u > 1) {
        interpolationFactor = i + 1;
      } else {
        interpolationFactor = i + u;
      }
    }
  }
  return interpolationFactor;
}

main();
