// global constants
globalThis.MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 380 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;

async function loadData() {
  globalThis.data = await d3.json("./data/flare-2.json");

  globalThis.dataRoot = d3
    .hierarchy(globalThis.data)
    .sum(function (d) {
      return d.value;
    })
    .sort((a, b) => b.height - a.height || b.value - a.value);

  globalThis.dataRoot.children.map((node, index) => (node.groupId = index));

  d3.treemap().size([globalThis.WIDTH, globalThis.HEIGHT]).padding(0.5)(
    globalThis.dataRoot
  );

  globalThis.data_detail_level1 = [globalThis.dataRoot].flatMap(
    (node) => node.children || [node]
  );
  globalThis.data_detail_level2 = globalThis.data_detail_level1.flatMap(
    (node) => node.children || [node]
  );
  globalThis.data_detail_level3 = globalThis.data_detail_level2.flatMap(
    (node) => node.children || [node]
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

  // Draw the treemap
  g.selectAll(".block")
    .data(globalThis.data_detail_level1)
    .join("g")
    .attr("class", "block")
    .call((g) =>
      g
        .append("rect")
        .attr("fill", "blue")
        .attr("x", function (d) {
          return d.x0;
        })
        .attr("y", function (d) {
          return d.y0;
        })
        .attr("width", function (d) {
          return d.x1 - d.x0;
        })
        .attr("height", function (d) {
          return d.y1 - d.y0;
        })
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", function (d) {
          return d.x0 + 5;
        }) // +10 to adjust position (more right)
        .attr("y", function (d) {
          return d.y0 + 20;
        }) // +20 to adjust position (lower)
        .text(function (d) {
          return d.data.name;
        })
        .attr("font-size", "15px")
        .attr("fill", "white")
    );

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: "red",
      deepClone: true,
    },
  });
}

main();
