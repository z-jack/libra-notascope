// global constants
globalThis.MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
globalThis.WIDTH = 928;
globalThis.HEIGHT = 928;

// global variables
globalThis.data = null;
globalThis.root = null;
globalThis.focus = null;
globalThis.view = null;

// shared scales
globalThis.color = d3
  .scaleLinear()
  .domain([0, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);

async function loadData() {
  globalThis.data = await d3.json("./data/flare-2.json");
  globalThis.root = d3
    .pack()
    .size([globalThis.WIDTH, globalThis.HEIGHT])
    .padding(3)(
    d3.hierarchy(globalThis.data).sum((d) => d.value).sort((a, b) => b.value - a.value)
  );
  globalThis.focus = globalThis.root;
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr("viewBox", `-${globalThis.WIDTH / 2} -${globalThis.HEIGHT / 2} ${globalThis.WIDTH} ${globalThis.HEIGHT}`)
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT)
    .style("max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${globalThis.color(0)}; cursor: pointer;");

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
  const [mainLayer, labelLayer] = renderMainVisualization();
  mountInteraction(mainLayer, labelLayer);
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
  const labelLayer = mainLayer.getLayerFromQueue("labelLayer");
  d3.select(mainLayer.getGraphic()).attr("class", "node");
  d3.select(labelLayer.getGraphic()).attr("class", "label");

  mainLayer.setLayersOrder({
    mainLayer: 0,
    labelLayer: 1,
  });

  renderNodes(mainLayer);
  renderLabels(labelLayer);

  return [mainLayer, labelLayer];
}

function renderNodes(layer) {
  const node = d3
    .select(layer.getGraphic())
    .selectAll("circle")
    .data(globalThis.root.descendants().slice(1))
    .join("circle")
    .attr("fill", (d) => (d.children ? globalThis.color(d.depth) : "white"))
    .attr("pointer-events", (d) => (!d.children ? "none" : null))
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#000");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);
    })
    .on("click", (event, d) => {
      if (globalThis.focus !== d) {
        zoom(event, d);
        event.stopPropagation();
      }
    });

  return node;
}

function renderLabels(layer) {
  const label = d3
    .select(layer.getGraphic())
    .selectAll("text")
    .data(globalThis.root.descendants())
    .join("text")
    .style("font", "10px sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("fill-opacity", (d) => (d.parent === globalThis.root ? 1 : 0))
    .style("display", (d) => (d.parent === globalThis.root ? "inline" : "none"))
    .text((d) => d.data.name);

  return label;
}

function mountInteraction(mainLayer, labelLayer) {
  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        focus: globalThis.focus,
        view: globalThis.view,
      },
      redraw({ transformer }) {
        const focus = transformer.getSharedVar("focus");
        const view = transformer.getSharedVar("view");
        const k = globalThis.WIDTH / view[2];
        const nodes = transformer.layer.selectChildren("circle");
        nodes
          .attr("transform", (d) => `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`)
          .attr("r", (d) => d.r * k);
      },
    }
  );

  const labelTransformer = Libra.GraphicalTransformer.initialize(
    "LabelTransformer",
    {
      layer: labelLayer,
      sharedVar: {
        focus: globalThis.focus,
        view: globalThis.view,
      },
      redraw({ transformer }) {
        const focus = transformer.getSharedVar("focus");
        const view = transformer.getSharedVar("view");
        const k = globalThis.WIDTH / view[2];
        const labels = transformer.layer.selectChildren("text");
        labels
          .attr("transform", (d) => `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`)
          .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
          .style("display", (d) => (d.parent === focus ? "inline" : "none"));
      },
    }
  );

  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [mainLayer],
    remove: [nodeTransformer, labelTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "ZoomService",
            sharedVar: {
              duration: 750,
            },
            evaluate({ result, duration }) {
              const focus0 = globalThis.focus;
              globalThis.focus = result[0].__data__;
              const view = [globalThis.focus.x, globalThis.focus.y, globalThis.focus.r * 2];
              const transition = d3
                .transition()
                .duration(duration)
                .tween("zoom", (d) => {
                  const i = d3.interpolateZoom(globalThis.view, view);
                  return (t) => {
                    globalThis.view = i(t);
                  };
                });
              return { focus0, focus: globalThis.focus, view, transition };
            },
          },
          {
            comp: "ZoomTransformer",
            sharedVar: {
              duration: 750,
            },
            evaluate({ focus0, focus, view, transition }) {
              nodeTransformer.setSharedVar("focus", focus);
              nodeTransformer.setSharedVar("view", view);
              labelTransformer.setSharedVar("focus", focus);
              labelTransformer.setSharedVar("view", view);

              const labels = labelLayer.selectChildren("text");
              labels
                .filter(function (d) {
                  return d.parent === focus || this.style.display === "inline";
                })
                .transition(transition)
                .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
                .on("start", function (d) {
                  if (d.parent === focus) this.style.display = "inline";
                })
                .on("end", function (d) {
                  if (d.parent !== focus) this.style.display = "none";
                });
            },
          },
          nodeTransformer,
          labelTransformer,
        ],
      },
    ],
  });
}

main();