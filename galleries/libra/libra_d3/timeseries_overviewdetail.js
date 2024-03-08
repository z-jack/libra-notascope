// global constants
globalThis.MARGIN = { top: 30, right: 10, bottom: 50, left: 70 };
globalThis.WIDTH = 764 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 532 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;

async function loadData() {
  globalThis.data = (await d3.json("./data/stocks/stocks2.json")).map((d) => ({
    date: d3.timeParse("%b %d %Y")(d.date),
    price: +d.price,
  }));
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr(
      "width",
      globalThis.WIDTH + globalThis.MARGIN.left + globalThis.MARGIN.right
    )
    .attr(
      "height",
      globalThis.HEIGHT + globalThis.MARGIN.top + globalThis.MARGIN.bottom
    )
    .attr(
      "viewbox",
      `0 0 ${globalThis.WIDTH + globalThis.MARGIN.left + globalThis.MARGIN.right
      } ${globalThis.HEIGHT + globalThis.MARGIN.top + globalThis.MARGIN.bottom}`
    )
    .append("g")
    .attr(
      "transform",
      "translate(" + globalThis.MARGIN.left + "," + globalThis.MARGIN.top + ")"
    );

  // Add X axis
  globalThis.x = d3
    .scaleUtc()
    .domain(d3.extent(globalThis.data, (d) => d.date))
    .range([0, globalThis.WIDTH]);

  // Add Y axis
  globalThis.yOverview = d3
    .scaleLinear()
    .domain([0, d3.max(globalThis.data, (d) => d.price)])
    .range([globalThis.HEIGHT * 0.3, 0]);

  globalThis.yDetail = d3
    .scaleLinear()
    .domain([0, d3.max(globalThis.data, (d) => d.price)])
    .range([globalThis.HEIGHT * 0.6, 0]);
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
  const [overviewLayer, detailLayer] = renderMainVisualization();
  mountInteraction(overviewLayer, detailLayer);
}

function renderMainVisualization() {
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  const overviewLayer = Libra.Layer.initialize("D3Layer", {
    name: "overviewLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT * 0.3,
    offset: {
      x: globalThis.MARGIN.left,
      y: globalThis.MARGIN.top + globalThis.HEIGHT * 0.7,
    },
    container: svg.node(),
  });
  g = d3.select(overviewLayer.getGraphic()).attr("class", "overview");

  const detailLayer = Libra.Layer.initialize("D3Layer", {
    name: "detailLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT * 0.6,
    offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
    container: svg.node(),
  });
  d3.select(detailLayer.getGraphic()).attr("class", "detail");

  g.append("g")
    .call(d3.axisBottom(globalThis.x))
    .attr("transform", "translate(0," + globalThis.HEIGHT * 0.3 + ")");
  g.append("g").call(d3.axisLeft(globalThis.yOverview));
  g.append("g")
    .append("path")
    .attr("fill", "steelblue")
    .attr(
      "d",
      d3
        .area()
        .x((d) => globalThis.x(d.date))
        .y0(globalThis.yOverview(0))
        .y1((d) => globalThis.yOverview(d.price))(globalThis.data)
    );

  renderDetailView();

  return [overviewLayer, detailLayer];
}

function renderDetailView(scaleX = globalThis.x) {
  const g = d3.select(".detail");
  g.selectChildren().remove();

  g.append("g")
    .call(d3.axisBottom(scaleX))
    .attr("transform", "translate(0," + globalThis.HEIGHT * 0.6 + ")");
  g.append("g").call(d3.axisLeft(globalThis.yDetail));
  g.append("g")
    .append("path")
    .attr("fill", "steelblue")
    .attr(
      "d",
      d3
        .area()
        .x((d) => scaleX(d.date))
        .y0(globalThis.yDetail(0))
        .y1((d) => globalThis.yDetail(d.price))(globalThis.data)
    );
}

function mountInteraction(overviewLayer, detailLayer) {
  // Initialize Detail Transformer
  const detailTransformer = Libra.GraphicalTransformer.initialize(
    "DetailTransformer",
    {
      layer: detailLayer,
      sharedVar: {
        result: globalThis.x,
      },
      redraw({ transformer }) {
        const scaleX = transformer.getSharedVar("result");
        renderDetailView(scaleX);
      },
    }
  );

  // Attach BrushInstrument to the overview layer
  Libra.Interaction.build({
    inherit: "BrushXInstrument",
    layers: [overviewLayer],
    insert: [
      {
        find: "SelectionService",
        flow: [{ comp: "ScaleService" }, detailTransformer],
      },
    ],
    sharedVar: { scaleX: globalThis.x },
  });
}

main();
