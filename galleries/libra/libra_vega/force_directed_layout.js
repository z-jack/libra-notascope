// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A node-link diagram with force-directed layout, depicting character co-occurrence in the novel Les Misérables.",
    "width": 600,
    "height": 600,
    "padding": 0,
    "autosize": "none",
    "signals": [
      { "name": "cx", "update": "width / 2" },
      { "name": "cy", "update": "height / 2" },
      {
        "name": "nodeRadius",
        "value": 8,
        "bind": { "input": "range", "min": 1, "max": 50, "step": 1 }
      },
      {
        "name": "nodeCharge",
        "value": -30,
        "bind": { "input": "range", "min": -100, "max": 10, "step": 1 }
      },
      {
        "name": "linkDistance",
        "value": 30,
        "bind": { "input": "range", "min": 5, "max": 100, "step": 1 }
      },

      {
        "description": "Graph node most recently interacted with.",
        "name": "node",
        "value": null
      }
    ],
    "data": [
      {
        "name": "node-data",
        "url": "data/miserables2.json",
        "format": { "type": "json", "property": "nodes" }
      },
      {
        "name": "link-data",
        "url": "data/miserables2.json",
        "format": { "type": "json", "property": "links" }
      }
    ],
    "scales": [
      {
        "name": "color",
        "type": "ordinal",
        "domain": { "data": "node-data", "field": "group" },
        "range": { "scheme": "category20c" }
      }
    ],
    "marks": [
      {
        "name": "nodes",
        "type": "symbol",
        "zindex": 1,
        "from": { "data": "node-data" },

        "encode": {
          "enter": {
            "x": { "value": 300 },
            "y": { "value": 300 },
            "fill": { "scale": "color", "field": "group" },
            "stroke": { "value": "white" }
          },
          "update": {
            "size": { "signal": "2 * nodeRadius * nodeRadius" },
            "cursor": { "value": "pointer" }
          }
        },

      },
      {
        "name": "links",
        "type": "path",
        "from": { "data": "link-data" },
        "interactive": false,
        "encode": {
          "update": { "stroke": { "value": "#ccc" }, "strokeWidth": { "value": 0.5 } },
        },


      }
    ],
    "config": {}
  };
}

async function renderStaticVisualization() {
  // render vega spec on screen
  await vega(document.getElementById("LibraPlayground"), globalThis.vegaSpec);
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
  const [nodeLayer, linkLayer] = renderMainVisualization();
  mountInteraction(nodeLayer, linkLayer);
}

function renderMainVisualization() {
  //   Create the main layer
  const nodeLayer = Libra.Layer.initialize("VegaLayer", {
    name: "nodeLayer",
    group: "nodes",
    container: document.querySelector("#LibraPlayground svg"),
  });
  Array.from(nodeLayer._graphic.children).forEach(n => {
    n.__data__.datum.forceX = 0;
    n.__data__.datum.forceY = 0;
    n.__data__.datum.velocityX = 0;
    n.__data__.datum.velocityY = 0;
  })

  const linkLayer = Libra.Layer.initialize("VegaLayer", {
    name: "linkLayer",
    group: "links",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return [nodeLayer, linkLayer];
}

function mountInteraction(nodeLayer, linkLayer) {

  globalThis.simulationParam = {
    nodeMassive: 1,
    dampingCoefficient: 0.97,
    coulombConstant: 1000,
    nodeMinDis: 10,
    springConstant: 1000,
    restLength: 100,
    oneFrameDuration: 0.001,
    frameNum: 1000,
    frameRemain: this.frameNum,
  }

  Libra.GraphicalTransformer.register("nodeLinkTransformer", {
    layer: [nodeLayer, linkLayer],
    // transient: true,
    redraw: function ({ layer, transformer }) {
      cancelAnimationFrame(globalThis.tickUpdate);
      globalThis.simulationParam.frameRemain = globalThis.simulationParam.frameNum;
      function drawFrame() {

        drawNodes(nodeLayer);
        drawLinks(linkLayer, nodeLayer);
        Array.from(nodeLayer._graphic.children).forEach(n => {
          n.__data__.datum.forceX = 0;
          n.__data__.datum.forceY = 0;
        })
        repulsionSimulation(Array.from(nodeLayer._graphic.children));
        springSimulation(Array.from(linkLayer._graphic.children));
        updateLocationByForce(nodeLayer);
        drawNodes(nodeLayer);
        drawLinks(linkLayer, nodeLayer);

        if (globalThis.simulationParam.frameRemain > 0) {
          globalThis.tickUpdate = requestAnimationFrame(drawFrame)
          globalThis.simulationParam.frameRemain--;
        }
      }

      globalThis.tickUpdate = requestAnimationFrame(drawFrame)

    },
  });


  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "DragInstrument",
    layers: [nodeLayer],
    remove: [{ find: "SelectionTransformer" }],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "nodeDragService",
            evaluate({
              result, offsetx, offsety
            }) {
              if (result.length) {
                console.log(offsetx);
                result[0].__data__.x = offsetx
                result[0].__data__.y = offsety
              }
            },
          },
          {
            comp: "nodeLinkTransformer"
          }
        ],
      }
    ],
  });
}

main();

function updateLocationByForce(layer, duration = globalThis.simulationParam.oneFrameDuration) {
  const massive = globalThis.simulationParam.nodeMassive;
  const damp = globalThis.simulationParam.dampingCoefficient;

  Array.from(layer._graphic.children).forEach(d => {
    //F=ma
    d.__data__.datum.accelerationX = d.__data__.datum.forceX / massive;
    d.__data__.datum.accelerationY = d.__data__.datum.forceY / massive;
    //damp velocity
    d.__data__.datum.velocityX *= damp;
    d.__data__.datum.velocityY *= damp;
    //v=v0+at
    d.__data__.datum.velocityX += d.__data__.datum.accelerationX * duration;
    d.__data__.datum.velocityY += d.__data__.datum.accelerationY * duration;
    //d=vt
    d.__data__.x += d.__data__.datum.velocityX * duration;
    d.__data__.y += d.__data__.datum.velocityY * duration;

  })
}

function drawNodes(layer) {
  Array.from(layer._graphic.children).forEach(n => {
    n.setAttribute("transform", `translate(${n.__data__.x},${n.__data__.y})`)
  })
}
function drawLinks(linkLayer, nodeLayer) {
  Array.from(linkLayer._graphic.children).forEach(l => {
    if (!l.getAttribute("d")) {
      const source = l.__data__.datum.source;
      const target = l.__data__.datum.target;
      Array.from(nodeLayer._graphic.children).forEach(n => {
        if (n.__data__.datum.index == source) {
          l.__data__.datum.sourceNode = n;
        } else if (n.__data__.datum.index == target) {
          l.__data__.datum.targetNode = n;
        }
      })
    }
    const source = l.__data__.datum.sourceNode;
    const target = l.__data__.datum.targetNode;
    l.setAttribute("d", `M${source.__data__.x} ${source.__data__.y} L${target.__data__.x} ${target.__data__.y}`)
  })
}

function repulsionSimulation(nodeList) {
  nodeList.forEach((node, nodeIndex) => {
    nodeList.forEach((otherNode, otherNodeIndex) => {
      if (otherNodeIndex > nodeIndex) {
        const force = calculateRepulsionForce(
          {
            x: node.__data__.x,
            y: node.__data__.y,
          },
          {
            x: otherNode.__data__.x,
            y: otherNode.__data__.y
          }
        );

        node.__data__.datum.forceX -= force.x;
        node.__data__.datum.forceY -= force.y;

        otherNode.__data__.datum.forceX += force.x;
        otherNode.__data__.datum.forceY += force.y;
      }
    })
  })
}

function springSimulation(linkList) {
  linkList.forEach(link => {
    const force = calculateSpringForce(
      {
        x: link.__data__.datum.sourceNode.__data__.x,
        y: link.__data__.datum.sourceNode.__data__.y,
      },
      {
        x: link.__data__.datum.targetNode.__data__.x,
        y: link.__data__.datum.targetNode.__data__.y,
      }
    )

    link.__data__.datum.sourceNode.__data__.datum.forceX -= force.x
    link.__data__.datum.sourceNode.__data__.datum.forceY -= force.y

    link.__data__.datum.targetNode.__data__.datum.forceX += force.x
    link.__data__.datum.targetNode.__data__.datum.forceY += force.y
  })
}

// console.log(calculateRepulsionForce({x:0,y:0},{x:1,y:1}));
function calculateRepulsionForce(node1, node2) {
  const k = globalThis.simulationParam.coulombConstant;
  const distanceX = node2.x - node1.x;
  const distanceY = node2.y - node1.y;
  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  if (distance == 0) {
    return { x: Math.random(), y: Math.random() }
  }

  const minDistance = globalThis.simulationParam.nodeMinDis;

  if (distance < minDistance) {
    const overlap = minDistance - distance;
    const repulsionForce = k * Math.pow(overlap, 2);

    const forceX = repulsionForce * (distanceX / distance);
    const forceY = repulsionForce * (distanceY / distance);

    return { x: forceX, y: forceY };
  } else {
    const repulsionForce = k / Math.pow(distance, 2);

    const forceX = repulsionForce * (distanceX / distance);
    const forceY = repulsionForce * (distanceY / distance);

    return { x: forceX, y: forceY };
  }

}

// console.log(calculateSpringForce({x:0,y:0},{x:100,y:100}));
function calculateSpringForce(node1, node2) {
  const springConstant = globalThis.simulationParam.springConstant;
  const restLength = globalThis.simulationParam.restLength;
  const x1 = node1.x;
  const y1 = node1.y;
  const x2 = node2.x;
  const y2 = node2.y;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance == 0) {
    return { x: 0, y: 0 }
  }
  const force = -springConstant * (distance - restLength);
  const forceHorizontal = force * (dx / distance);
  const forceVertical = force * (dy / distance);

  return { x: forceHorizontal, y: forceVertical };
}