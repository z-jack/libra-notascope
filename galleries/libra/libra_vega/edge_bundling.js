// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A network diagram of software dependencies, with edges grouped via hierarchical edge bundling.",
    "padding": 5,
    "width": 720,
    "height": 720,
    "autosize": "none",
    "signals": [
      {
        "name": "tension",
        "value": 0.85,
        "bind": {"input": "range", "min": 0, "max": 1, "step": 0.01}
      },
      {
        "name": "radius",
        "value": 280,
        "bind": {"input": "range", "min": 20, "max": 400}
      },
      {
        "name": "extent",
        "value": 360,
        "bind": {"input": "range", "min": 0, "max": 360, "step": 1}
      },
      {
        "name": "rotate",
        "value": 0,
        "bind": {"input": "range", "min": 0, "max": 360, "step": 1}
      },
      {
        "name": "textSize",
        "value": 8,
        "bind": {"input": "range", "min": 2, "max": 20, "step": 1}
      },
      {
        "name": "textOffset",
        "value": 2,
        "bind": {"input": "range", "min": 0, "max": 10, "step": 1}
      },
      {
        "name": "layout",
        "value": "cluster",
        "bind": {"input": "radio", "options": ["tidy", "cluster"]}
      },
      {"name": "colorIn", "value": "firebrick"},
      {"name": "colorOut", "value": "forestgreen"},
      {"name": "originX", "update": "width / 2"},
      {"name": "originY", "update": "height / 2"},
      {
        "name": "active",
        "value": null,
        "on": [
          {"events": "text:mouseover", "update": "datum.id"},
          {"events": "mouseover[!event.item]", "update": "null"}
        ]
      }
    ],
    "data": [
      {
        "name": "tree",
        "url": "data/flare.json",
        "transform": [
          {"type": "stratify", "key": "id", "parentKey": "parent"},
          {
            "type": "tree",
            "method": {"signal": "layout"},
            "size": [1, 1],
            "as": ["alpha", "beta", "depth", "children"]
          },
          {
            "type": "formula",
            "expr": "(rotate + extent * datum.alpha + 270) % 360",
            "as": "angle"
          },
          {
            "type": "formula",
            "expr": "inrange(datum.angle, [90, 270])",
            "as": "leftside"
          },
          {
            "type": "formula",
            "expr": "originX + radius * datum.beta * cos(PI * datum.angle / 180)",
            "as": "x"
          },
          {
            "type": "formula",
            "expr": "originY + radius * datum.beta * sin(PI * datum.angle / 180)",
            "as": "y"
          }
        ]
      },
      {
        "name": "leaves",
        "source": "tree",
        "transform": [{"type": "filter", "expr": "!datum.children"}]
      },
      {
        "name": "dependencies",
        "url": "data/flare-dependencies.json",
        "transform": [
          {
            "type": "formula",
            "expr": "treePath('tree', datum.source, datum.target)",
            "as": "treepath",
            "initonly": true
          }
        ]
      },
      {
        "name": "selected",
        "source": "dependencies",
        "transform": [
          {
            "type": "filter",
            "expr": "datum.source === active || datum.target === active"
          }
        ]
      }
    ],
    "marks": [
      {
        name: "texts",
        "type": "text",
        "from": {"data": "leaves"},
        "encode": {
          "enter": {"text": {"field": "name"}, "baseline": {"value": "middle"}},
          "update": {
            "x": {"field": "x"},
            "y": {"field": "y"},
            "dx": {"signal": "textOffset * (datum.leftside ? -1 : 1)"},
            "angle": {
              "signal": "datum.leftside ? datum.angle - 180 : datum.angle"
            },
            "align": {"signal": "datum.leftside ? 'right' : 'left'"},
            "fontSize": {"signal": "textSize"},
            "fontWeight": [
              {"value": null}
            ]
          }
        }
      },
      {
        "type": "group",
        name:"curves",
        "from": {
          "facet": {"name": "path", "data": "dependencies", "field": "treepath"}
        },
        "marks": [
          {
            "type": "line",
            "interactive": false,
            "from": {"data": "path"},
            "encode": {
              "enter": {
                "interpolate": {"value": "bundle"},
                "strokeWidth": {"value": 1.5}
              },
              "update": {
                "stroke": [
                 
                  {"value": "steelblue"}
                ],
                "strokeOpacity": [
                 
                  {"value": 0.2}
                ],
                "tension": {"signal": "tension"},
                "x": {"field": "x"},
                "y": {"field": "y"}
              }
            }
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "color",
        "type": "ordinal",
        "domain": ["depends on", "imported by"],
        "range": [{"signal": "colorIn"}, {"signal": "colorOut"}]
      }
    ],
    "legends": [
      {
        "stroke": "color",
        "orient": "bottom-right",
        "title": "Dependencies",
        "symbolType": "stroke"
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
  const [mainLayer, curveLayer] = renderMainVisualization();
  console.log(mainLayer);
  console.log(curveLayer);
  mountInteraction(mainLayer, curveLayer);
}

function renderMainVisualization() {
  // Create the main layer
  const mainLayer = Libra.Layer.initialize("VegaLayer", {
    name: "mainLayer",
    group: "texts",
    container: document.querySelector("#LibraPlayground svg"),
  });
  const curveLayer = Libra.Layer.initialize("VegaLayer", {
    name: "curveLayer",
    group: "curves",
    container: document.querySelector("#LibraPlayground svg"),
  });
  return [mainLayer, curveLayer];
}

function mountInteraction(textLayer, curveLayer) {

  Libra.GraphicalTransformer.register("renderTransformer", {
    layer: curveLayer,
    // transient: true,
    redraw: function ({ layer, transformer }) {
      const result = transformer.getSharedVar("result");
      console.log(result);
      if (result) {
        result.greenCurve.forEach(c => {
          c.children[1].firstChild.firstChild.setAttribute('stroke', 'green')
          c.children[1].firstChild.firstChild.setAttribute('stroke-opacity', '1')
        })
        result.redCurve.forEach(c => {
          c.children[1].firstChild.firstChild.setAttribute('stroke', 'red')
          c.children[1].firstChild.firstChild.setAttribute('stroke-opacity', '1')
        })
        result.greenText.forEach(c => {
          c.setAttribute('fill', 'green')
        })
        result.redText.forEach(c => {
          c.setAttribute('fill', 'red')
        })
      }

    },
  });


  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [textLayer],
    remove: [{ find: "SelectionTransformer" }],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "hierarchyAnalyseService",
            evaluate({
              result,
            }) {
              if (result.length) {
                let analyseResult = {
                  greenText: [],
                  redText: [],
                  greenCurve: [],
                  redCurve: [],
                  onHover: result[0],
                }

                Array.from(curveLayer._graphic.children).forEach(d => {
                  if (d.__data__.datum.source == result[0].__data__.datum.id) {
                    analyseResult.greenCurve.push(d)
                    Array.from(textLayer._graphic.children).forEach(t => {
                      if (t.__data__.datum.id == d.__data__.datum.target) {
                        console.log(t.__data__.datum.id + "==" + d.__data__.datum.target);
                        analyseResult.greenText.push(t)
                      }
                    })
                  }
                  else if (d.__data__.datum.target == result[0].__data__.datum.id) {
                    analyseResult.redCurve.push(d)
                    Array.from(textLayer._graphic.children).forEach(t => {
                      if (t.__data__.datum.id == d.__data__.datum.source) {
                        console.log(t.__data__.datum.id + "==" + d.__data__.datum.source);
                        analyseResult.redText.push(t)
                      }
                    })
                  }
                })
                return analyseResult;
              }
            },
          },
          {
            comp: "renderTransformer"
          }
        ],
      }
    ],
  });
}

main();
