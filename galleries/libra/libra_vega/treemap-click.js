// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "An example of treemap layout for hierarchical data.",
    "width": 960,
    "height": 500,
    "padding": 2.5,
    "autosize": "none",
  
    "signals": [
      {
        "name": "layout", "value": "squarify"
      },
      {
        "name": "aspectRatio", "value": 1.6
      }
    ],
  
    "data": [
      {
        "name": "tree",
        "url": "data/flare.json",
        "transform": [
          {
            "type": "stratify",
            "key": "id",
            "parentKey": "parent"
          },
          {
            "type": "treemap",
            "field": "size",
            "sort": {"field": "value"},
            "round": true,
            "method": {"signal": "layout"},
            "ratio": {"signal": "aspectRatio"},
            "size": [{"signal": "width"}, {"signal": "height"}]
          }
        ]
      },
      {
        "name": "nodes",
        "source": "tree",
        "transform": [{ "type": "filter", "expr": "datum.children" }]
      },
      {
        "name": "leaves",
        "source": "tree",
        "transform": [{ "type": "filter", "expr": "!datum.children" }]
      }
    ],
  
    "scales": [
      {
        "name": "color",
        "type": "ordinal",
        "domain": {"data": "nodes", "field": "name"},
        "range": [
          "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#e6550d",
          "#fd8d3c", "#fdae6b", "#fdd0a2", "#31a354", "#74c476",
          "#a1d99b", "#c7e9c0", "#756bb1", "#9e9ac8", "#bcbddc",
          "#dadaeb", "#636363", "#969696", "#bdbdbd", "#d9d9d9"
        ]
      },
      {
        "name": "size",
        "type": "ordinal",
        "domain": [0, 1, 2, 3],
        "range": [256, 28, 20, 14]
      },
      {
        "name": "opacity",
        "type": "ordinal",
        "domain": [0, 1, 2, 3],
        "range": [0.15, 0.5, 0.8, 1.0]
      }
    ],
  
    "marks": [
      {
        "type": "rect",
        "from": {"data": "nodes"},
        "interactive": false,
        "encode": {
          "enter": {
            "fill": {"scale": "color", "field": "name"}
          },
          "update": {
            "x": {"field": "x0"},
            "y": {"field": "y0"},
            "x2": {"field": "x1"},
            "y2": {"field": "y1"}
          }
        }
      },
      {
        name:'marks',
        "type": "rect",
        "from": {"data": "leaves"},
        "encode": {
          "enter": {
            "stroke": {"value": "#fff"}
          },
          "update": {
            "x": {"field": "x0"},
            "y": {"field": "y0"},
            "x2": {"field": "x1"},
            "y2": {"field": "y1"},
            "fill": {"value": "transparent"}
          }
        }
      },
      {
        "type": "text",
        "from": {"data": "nodes"},
        "interactive": false,
        "encode": {
          "enter": {
            "font": {"value": "Helvetica Neue, Arial"},
            "align": {"value": "center"},
            "baseline": {"value": "middle"},
            "fill": {"value": "#000"},
            "text": {"field": "name"},
            "fontSize": {"scale": "size", "field": "depth"},
            "fillOpacity": {"scale": "opacity", "field": "depth"}
          },
          "update": {
            "x": {"signal": "0.5 * (datum.x0 + datum.x1)"},
            "y": {"signal": "0.5 * (datum.y0 + datum.y1)"}
          }
        }
      }
    ]
  }
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
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization() {
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "marks",
    container: document.querySelector("#LibraPlayground svg"),
  });

  return mainLayer;
}

function mountInteraction(layer) {
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { fill: "red" },
    },
  });
}

main();
