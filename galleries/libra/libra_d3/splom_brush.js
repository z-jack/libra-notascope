// global constants
globalThis.MARGIN = { top: 28, right: 28, bottom: 28, left: 28 };
globalThis.WIDTH = 928;
globalThis.HEIGHT = 928;

// global variables
globalThis.data = [];
globalThis.columns = [];
globalThis.size = null;
globalThis.x = [];
globalThis.y = [];
globalThis.color = null;

async function loadData() {
  globalThis.data = await d3.csv("./data/md100.csv");
  globalThis.columns = globalThis.data.columns.filter(
    (d) => typeof globalThis.data[0][d] === "number"
  );
  globalThis.size =
    (globalThis.WIDTH -
      (globalThis.columns.length + 1) * globalThis.MARGIN.left) /
    globalThis.columns.length +
    globalThis.MARGIN.left;

  globalThis.x = globalThis.columns.map((c) =>
    d3
      .scaleLinear()
      .domain(d3.extent(globalThis.data, (d) => d[c]))
      .rangeRound([globalThis.MARGIN.left / 2, globalThis.size - globalThis.MARGIN.left / 2])
  );

  globalThis.y = globalThis.x.map((x) =>
    x.copy().range([globalThis.size - globalThis.MARGIN.left / 2, globalThis.MARGIN.left / 2])
  );

  globalThis.color = d3
    .scaleOrdinal()
    .domain(globalThis.data.map((d) => d.species))
    .range(d3.schemeCategory10);
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT)
    .attr("viewBox", [-globalThis.MARGIN.left, 0, globalThis.WIDTH, globalThis.HEIGHT]);

  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${globalThis.MARGIN.left},${globalThis.MARGIN.top})`
    );
}

module.exports = {
  loadData,
  renderStaticVisualization,
};

// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  VIS.renderStaticVisualization();
  const [mainLayer, axesLayer] = renderMainVisualization();
  mountInteraction(mainLayer, axesLayer);
}

function renderMainVisualization() {
  // append the svg object to the body of the page
  const svg = d3.select("#LibraPlayground svg");

  // create layer
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
    container: svg.node(),
  });
  const axesLayer = mainLayer.getLayerFromQueue("axesLayer");
  d3.select(mainLayer.getGraphic()).attr("class", "mark");
  d3.select(axesLayer.getGraphic()).attr("class", "axes");

  mainLayer.setLayersOrder({
    axesLayer: 0,
    mainLayer: 1,
  });

  renderAxes(axesLayer);
  renderScatters(mainLayer);

  return [mainLayer, axesLayer];
}

function renderAxes(axesLayer) {
  const axisx = d3
    .axisBottom()
    .ticks(6)
    .tickSize(globalThis.size * globalThis.columns.length);
  const xAxis = d3
    .select(axesLayer.getGraphic())
    .selectAll("g")
    .data(globalThis.x)
    .join("g")
    .attr("transform", (d, i) => `translate(${i * globalThis.size},0)`)
    .each(function (d) {
      return d3.select(this).call(axisx.scale(d));
    })
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

  const axisy = d3
    .axisLeft()
    .ticks(6)
    .tickSize(-globalThis.size * globalThis.columns.length);
  const yAxis = d3
    .select(axesLayer.getGraphic())
    .selectAll("g")
    .data(globalThis.y)
    .join("g")
    .attr("transform", (d, i) => `translate(0,${i * globalThis.size})`)
    .each(function (d) {
      return d3.select(this).call(axisy.scale(d));
    })
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

  d3.select(axesLayer.getGraphic())
    .selectAll("text")
    .data(globalThis.columns)
    .join("text")
    .attr("transform", (d, i) => `translate(${i * globalThis.size},${i * globalThis.size})`)
    .attr("x", globalThis.MARGIN.left)
    .attr("y", globalThis.MARGIN.left)
    .attr("dy", ".71em")
    .style("font", "bold 10px sans-serif")
    .style("pointer-events", "none")
    .text((d) => d);
}

function renderScatters(layer) {
  const cell = d3
    .select(layer.getGraphic())
    .selectAll("g")
    .data(d3.cross(d3.range(globalThis.columns.length), d3.range(globalThis.columns.length)))
    .join("g")
    .attr("transform", ([i, j]) => `translate(${i * globalThis.size},${j * globalThis.size})`);

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", globalThis.MARGIN.left / 2 + 0.5)
    .attr("y", globalThis.MARGIN.left / 2 + 0.5)
    .attr("width", globalThis.size - globalThis.MARGIN.left)
    .attr("height", globalThis.size - globalThis.MARGIN.left);

  cell
    .selectAll("circle")
    .data(
      (d) =>
        globalThis.data.filter(
          (d) =>
            !isNaN(d[globalThis.columns[d[0]]]) && !isNaN(d[globalThis.columns[d[1]]])
        ),
      (d) => `${d[globalThis.columns[d[0]]]}|${d[globalThis.columns[d[1]]]}`
    )
    .join("circle")
    .attr("cx", (d) => globalThis.x[d[0]](d[globalThis.columns[d[0]]]))
    .attr("cy", (d) => globalThis.y[d[1]](d[globalThis.columns[d[1]]]))
    .attr("r", 3.5)
    .attr("fill-opacity", 0.7)
    .attr("fill", (d) => globalThis.color(d.species));
}

function mountInteraction(mainLayer, axesLayer) {
  const brushTransformer = Libra.GraphicalTransformer.initialize(
    "BrushTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        result: [],
      },
      redraw({ transformer }) {
        const circles = transformer.layer.selectChildren("circle");
        const selected = transformer.getSharedVar("result");
        circles.classed("hidden", (d) => !selected.includes(d));
      },
    }
  );

  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [mainLayer],
    remove: [brushTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "BrushService",
            sharedVar: {
              padding: globalThis.MARGIN.left,
              size: globalThis.size,
              x: globalThis.x,
              y: globalThis.y,
              columns: globalThis.columns,
            },
            evaluate({
              padding,
              size,
              x,
              y,
              columns,
              brushSelection,
              brushTarget,
            }) {
              const [i, j] = d3.brush().ticks(brushTarget.datum());
              let selected = [];
              if (brushSelection) {
                const [[x0, y0], [x1, y1]] = brushSelection;
                selected = globalThis.data.filter(
                  (d) =>
                    x0 < x[i](d[columns[i]]) &&
                    x1 > x[i](d[columns[i]]) &&
                    y0 < y[j](d[columns[j]]) &&
                    y1 > y[j](d[columns[j]])
                );
              }
              return selected;
            },
          },
          brushTransformer,
        ],
      },
    ],
  });
}

main();