// global constants
globalThis.MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
globalThis.WIDTH = 1000 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 400 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;

async function loadData() {
  const nc = await d3.json("./data/ncmap_pop_density_topojson.json");
  globalThis.data = topojson.feature(nc, nc.objects.ncmap).features;
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
    .attr("viewbox", `0 0 ${globalThis.WIDTH} ${globalThis.HEIGHT}`)
    .append("g")
    .attr(
      "transform",
      "translate(" + globalThis.MARGIN.left + "," + globalThis.MARGIN.top + ")"
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
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
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
  g = d3.select(mainLayer.getGraphic());

  // Draw the map
  const path = d3.geoPath();

  g.selectAll(".counties")
    .data(globalThis.data)
    .join("g")
    .attr("class", "counties")
    .attr("transform", `translate(${0}, ${0}) scale(${1 - 0})`)
    .call((g) =>
      g
        .append("path")
        .attr("d", path)
        .attr("fill", "#b7dbff")
        .append("title")
        .text("counties")
    )
    .call((g) =>
      g
        .append("text")
        .text((d) => d.properties.county)
        .attr("transform", function (d) {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]},${centroid[1]})`;
        })
        .style("pointer-events", "none")
        .attr("font-size", 8)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("class", "county-names")
    );

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: "red",
      deepClone: true,
    },
  });
}

main();
