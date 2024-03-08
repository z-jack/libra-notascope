// global constants
globalThis.MARGIN = { top: 30, right: 70, bottom: 40, left: 60 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 380 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;
globalThis.FIELD_X = "x";
globalThis.FIELD_Y = "y";
globalThis.FIELD_COLOR = "Origin";

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.color = null;

const loadName = window.location.search.split('file=')[1].split('&')[0];

async function loadData() {
  globalThis.data = (await d3.json("./data/" + loadName)).filter(
    (d) => !!(d["x"] && d["y"])
  );
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

  const extentX = [0, d3.max(globalThis.data, (d) => d[globalThis.FIELD_X])];
  const extentY = [0, d3.max(globalThis.data, (d) => d[globalThis.FIELD_Y])];

  // Add X axis
  globalThis.x = d3
    .scaleLinear()
    .domain(extentX)
    .range([0, globalThis.WIDTH])
    .nice()
    .clamp(true);
  svg
    .append("g")
    .attr("transform", "translate(0," + globalThis.HEIGHT + ")")
    .call(d3.axisBottom(globalThis.x))
    .append("text")
    .text(globalThis.FIELD_X)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("x", globalThis.WIDTH / 2)
    .attr("y", 30);

  // Add Y axis
  globalThis.y = d3
    .scaleLinear()
    .domain(extentY)
    .nice()
    .range([globalThis.HEIGHT, 0])
    .clamp(true);
  svg
    .append("g")
    .call(d3.axisLeft(globalThis.y))
    .append("text")
    .text(globalThis.FIELD_Y)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("writing-mode", "tb")
    .style(
      "transform",
      `translate(${-globalThis.MARGIN.left / 2}px,${globalThis.HEIGHT / 2
      }px) rotate(180deg)`
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
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
    container: svg.node(),
  });
  const g = d3.select(mainLayer.getGraphic());

  // Draw points code from the input static visualization
  g.selectAll("circle")
    .data(globalThis.data)
    .join("circle")
    .attr("class", "mark")
    .attr("fill", "white")
    .attr("stroke-width", 1)
    .attr("stroke", "gray")
    .attr("cx", (d) => globalThis.x(d[globalThis.FIELD_X]))
    .attr("cy", (d) => globalThis.y(d[globalThis.FIELD_Y]))
    .attr("r", 5);

  return mainLayer;
}

function mountInteraction(layer) {
  // Attach HoverInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: (d) => 'red',
    },
  });
}

main();
