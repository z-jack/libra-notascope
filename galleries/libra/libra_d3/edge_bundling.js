// global constants
globalThis.MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
globalThis.WIDTH = 954;
globalThis.HEIGHT = 954;

// global variables
globalThis.data = [];
globalThis.root = null;

// shared scales
globalThis.tree = null;
globalThis.line = null;

async function loadData() {
  globalThis.data = await d3.json("./data/flare.json");
  globalThis.root = hierarchy(globalThis.data);
  globalThis.root = bilink(d3.hierarchy(globalThis.root).sort((a, b) =>
    d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name)
  ));
  globalThis.tree = d3
    .cluster()
    .size([2 * Math.PI, globalThis.WIDTH / 2 - 100]);
  globalThis.line = d3
    .lineRadial()
    .curve(d3.curveBundle.beta(0.85))
    .radius((d) => d.y)
    .angle((d) => d.x);
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT)
    .attr("viewBox", [-globalThis.WIDTH / 2, -globalThis.HEIGHT / 2, globalThis.WIDTH, globalThis.HEIGHT])
    .style("max-width: 100%; height: auto; font: 10px sans-serif;");

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
  const [mainLayer, linkLayer] = renderMainVisualization();
  mountInteraction(mainLayer, linkLayer);
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
  const linkLayer = mainLayer.getLayerFromQueue("linkLayer");
  d3.select(mainLayer.getGraphic()).attr("class", "node");
  d3.select(linkLayer.getGraphic()).attr("class", "link");

  mainLayer.setLayersOrder({
    linkLayer: 0,
    mainLayer: 1,
  });

  renderNodes();
  renderLinks();

  return [mainLayer, linkLayer];
}

function renderNodes() {
  const root = globalThis.tree(globalThis.root);
  const node = d3
    .select("#LibraPlayground svg .node")
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
    .call((g) =>
      g
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.x < Math.PI ? 6 : -6))
        .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
        .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
        .text((d) => d.data.name)
        .each(function (d) {
          d.text = this;
        })
    )
    .call((g) =>
      g
        .selectAll("text")
        .append("title")
        .text((d) => `${id(d)}\n${d.outgoing.length} outgoing\n${d.incoming.length} incoming`)
    );

  return node;
}

function renderLinks() {
  const root = globalThis.tree(globalThis.root);
  const link = d3
    .select("#LibraPlayground svg .link")
    .selectAll("path")
    .data(root.leaves().flatMap((leaf) => leaf.outgoing))
    .join("path")
    .attr("stroke", "#ccc")
    .attr("fill", "none")
    .attr("d", ([i, o]) => globalThis.line(i.path(o)))
    .each(function (d) {
      d.path = this;
    });

  return link;
}

function mountInteraction(mainLayer, linkLayer) {
  Libra.GraphicalTransformer.register("NodeTransformer", {
    redraw: function ({ layer }) {
      const nodes = layer.selectChildren("g");
      nodes.call((g) =>
        g
          .selectAll("text")
          .attr("font-weight", null)
          .attr("fill", null)
      );
    },
  });

  Libra.GraphicalTransformer.register("LinkTransformer", {
    redraw: function ({ layer }) {
      const links = layer.selectChildren("path");
      links.attr("stroke", "#ccc");
    },
  });

  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: mainLayer,
    }
  );

  const linkTransformer = Libra.GraphicalTransformer.initialize(
    "LinkTransformer",
    {
      layer: linkLayer,
    }
  );

  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [mainLayer],
    remove: [nodeTransformer, linkTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "NodeHighlightService",
            sharedVar: {
              highlightColor: "#f00",
              incomingColor: "#00f",
              outgoingColor: "#00f",
            },
            evaluate({ result, highlightColor, incomingColor, outgoingColor }) {
              if (result && result.length) {
                const datum = d3.select(result[0]).datum();
                d3.select(datum.text)
                  .attr("font-weight", "bold")
                  .attr("fill", highlightColor);
                d3.selectAll(datum.incoming.map((d) => d.path)).attr(
                  "stroke",
                  incomingColor
                );
                d3.selectAll(
                  datum.incoming.map(([d]) => d.text)
                ).attr("fill", incomingColor).attr("font-weight", "bold");
                d3.selectAll(datum.outgoing.map((d) => d.path)).attr(
                  "stroke",
                  outgoingColor
                );
                d3.selectAll(
                  datum.outgoing.map(([, d]) => d.text)
                ).attr("fill", outgoingColor).attr("font-weight", "bold");
              }
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