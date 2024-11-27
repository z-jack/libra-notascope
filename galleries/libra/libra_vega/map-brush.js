// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A configurable map of countries of the world.",
    "width": 900,
    "height": 500,
    "autosize": "none",
  
    "signals": [
      {
        "name": "type",
        "value": "mercator"
      },
      { "name": "scale", "value": 150},
      { "name": "rotate0", "value": 0},
      { "name": "rotate1", "value": 0},
      { "name": "rotate2", "value": 0},
      { "name": "center0", "value": 0},
      { "name": "center1", "value": 0},
      { "name": "translate0", "update": "width / 2" },
      { "name": "translate1", "update": "height / 2" },
  
      { "name": "graticuleDash", "value": 0},
      { "name": "borderWidth", "value": 1},
      { "name": "background", "value": "#ffffff"},
      { "name": "invert", "value": false}
    ],
  
    "projections": [
      {
        "name": "projection",
        "type": {"signal": "type"},
        "scale": {"signal": "scale"},
        "rotate": [
          {"signal": "rotate0"},
          {"signal": "rotate1"},
          {"signal": "rotate2"}
        ],
        "center": [
          {"signal": "center0"},
          {"signal": "center1"}
        ],
        "translate": [
          {"signal": "translate0"},
          {"signal": "translate1"}
        ]
      }
    ],
  
    "data": [
      {
        "name": "world",
        "url": "data/world-110m.json",
        "format": {
          "type": "topojson",
          "feature": "countries"
        }
      },
      {
        "name": "graticule",
        "transform": [
          { "type": "graticule" }
        ]
      }
    ],
  
    "marks": [
      {
        "type": "shape",
        "from": {"data": "graticule"},
        "encode": {
          "update": {
            "strokeWidth": {"value": 1},
            "strokeDash": {"signal": "[+graticuleDash, +graticuleDash]"},
            "stroke": {"signal": "invert ? '#444' : '#ddd'"},
            "fill": {"value": null}
          }
        },
        "transform": [
          { "type": "geoshape", "projection": "projection" }
        ]
      },
      {
        name:"marks",
        "type": "shape",
        "from": {"data": "world"},
        "encode": {
          "update": {
            "strokeWidth": {"signal": "+borderWidth"},
            "stroke": {"signal": "invert ? '#777' : '#bbb'"},
            "fill": {"signal": "invert ? '#fff' : '#000'"},
            "zindex": {"value": 0}
          }
        },
        "transform": [
          { "type": "geoshape", "projection": "projection" }
        ]
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
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { fill: "red" },
    },
  });
}

main();
