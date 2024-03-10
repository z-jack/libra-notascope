// global constants
globalThis.MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
globalThis.WIDTH = 928;
globalThis.HEIGHT = 600;

// global variables
globalThis.data = null;
globalThis.links = [];
globalThis.nodes = [];
globalThis.simulation = null;

// shared scales
globalThis.color = d3.scaleOrdinal(d3.schemeCategory10);

async function loadData() {
  globalThis.data = await d3.json("./data/miserables.json");
  globalThis.links = globalThis.data.links.map(d => ({ ...d }));
  globalThis.nodes = globalThis.data.nodes.map(d => ({ ...d }));

  globalThis.simulation = d3
    .forceSimulation(globalThis.nodes)
    .force("link", d3.forceLink(globalThis.links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(globalThis.WIDTH / 2, globalThis.HEIGHT / 2))
    .on("tick", ticked);
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT)
    .attr("viewBox", [0, 0, globalThis.WIDTH, globalThis.HEIGHT])
    .style("max-width: 100%; height: auto;");

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
  const [linkLayer, nodeLayer] = renderMainVisualization();
  mountInteraction(linkLayer, nodeLayer);
}

function renderMainVisualization() {
  // append the svg object to the body of the page
  const svg = d3.select("#LibraPlayground svg");

  // create layer
  const linkLayer = Libra.Layer.initialize("D3Layer", {
    name: "linkLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
    container: svg.node(),
  });
  const nodeLayer = linkLayer.getLayerFromQueue("nodeLayer");
  d3.select(linkLayer.getGraphic()).attr("class", "link");
  d3.select(nodeLayer.getGraphic()).attr("class", "node");

  linkLayer.setLayersOrder({
    linkLayer: 0,
    nodeLayer: 1,
  });

  renderLinks();
  renderNodes();

  return [linkLayer, nodeLayer];
}

function renderLinks() {
  const link = d3
    .select("#LibraPlayground svg .link")
    .selectAll("line")
    .data(globalThis.links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  return link;
}

function renderNodes() {
  const node = d3
    .select("#LibraPlayground svg .node")
    .selectAll("circle")
    .data(globalThis.nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", d => globalThis.color(d.group))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .call(g =>
      g
        .append("title")
        .text(d => d.id)
    );

  return node;
}

function ticked() {
  d3.select("#LibraPlayground svg .link")
    .selectAll("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  d3.select("#LibraPlayground svg .node")
    .selectAll("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
}

function mountInteraction(linkLayer, nodeLayer) {
  Libra.GraphicalTransformer.register("LinkTransformer", {
    redraw: function ({ layer }) {
      const links = layer.selectChildren("line");
      links.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    },
  });

  Libra.GraphicalTransformer.register("NodeTransformer", {
    redraw: function ({ layer }) {
      const nodes = layer.selectChildren("circle");
      nodes.attr("cx", d => d.x)
        .attr("cy", d => d.y);
    },
  });

  const linkTransformer = Libra.GraphicalTransformer.initialize(
    "LinkTransformer",
    {
      layer: linkLayer,
    }
  );

  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: nodeLayer,
    }
  );

  Libra.Interaction.build({
    inherit: "DragInstrument",
    layers: [nodeLayer],
    remove: [nodeTransformer, linkTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "DragService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ result, simulation }) {
              if (result && result.length) {
                const datum = d3.select(result[0]).datum();
                if (!simulation.alphaTarget()) {
                  simulation.alphaTarget(0.3).restart();
                }
                datum.fx = datum.x;
                datum.fy = datum.y;
              }
            },
          },
          {
            comp: "DraggedService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ offsetx, offsety, simulation }) {
              const node = simulation.find(null, offsetx, offsety);
              if (node) {
                node.fx = offsetx;
                node.fy = offsety;
              }
            },
          },
          {
            comp: "DragEndedService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ simulation }) {
              if (!simulation.alphaTarget()) {
                simulation.alphaTarget(0);
              }
              simulation.nodes().forEach(d => {
                d.fx = null;
                d.fy = null;
              });
            },
          },
          nodeTransformer,
          linkTransformer,
        ],
      },
    ],
  });
}

main();