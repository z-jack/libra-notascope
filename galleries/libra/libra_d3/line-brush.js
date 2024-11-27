// global constants
globalThis.MARGIN = { top: 20, right: 20, bottom: 30, left: 30 };
globalThis.WIDTH = 728;
globalThis.HEIGHT = 500;

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.groups = null;

async function loadData() {
  globalThis.data = (await d3.csv("./data/bls-metro-unemployment.csv", d3.autoType))
}

function renderStaticVisualization() {
  // Create the positional scales.
  globalThis.x = d3.scaleUtc()
    .domain(d3.extent(globalThis.data, d => d.date))
    .range([globalThis.MARGIN.left, globalThis.WIDTH - globalThis.MARGIN.right]);

  globalThis.y = d3.scaleLinear()
    .domain([0, d3.max(globalThis.data, d => d.unemployment)]).nice()
    .range([globalThis.HEIGHT - globalThis.MARGIN.bottom, globalThis.MARGIN.top]);

  // Create the SVG container.
  const svg = d3.select('#LibraPlayground').append("svg")
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT)
    .attr("viewBox", [0, 0, globalThis.WIDTH, globalThis.HEIGHT]);

  // Add the horizontal axis.
  svg.append("g")
    .attr("transform", `translate(0,${globalThis.HEIGHT - globalThis.MARGIN.bottom})`)
    .call(d3.axisBottom(globalThis.x).ticks(globalThis.WIDTH / 80).tickSizeOuter(0));

  // Add the vertical axis.
  svg.append("g")
    .attr("transform", `translate(${globalThis.MARGIN.left},0)`)
    .call(d3.axisLeft(globalThis.y))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", globalThis.WIDTH - globalThis.MARGIN.left - globalThis.MARGIN.right)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -globalThis.MARGIN.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ Unemployment (%)"));


  // Compute the points in pixel space as [x, y, z], where z is the name of the series.
  const points = globalThis.data.map((d) => [globalThis.x(d.date), globalThis.y(d.unemployment), d.division]);

  // Group the points by series.
  globalThis.groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2]);
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
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization() {
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    container: svg.node(),
  });
  const g = d3.select(mainLayer.getGraphic());

  // Draw lines code from the input static visualization
  g
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(globalThis.groups.values())
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("d", d3.line());

  return mainLayer;
}

function mountInteraction(layer) {
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: {
        stroke: 'red',
        fill: 'none',
        'stroke-width': 5
      }
    },
  });
}

main();
