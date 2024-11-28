
var spec = {
  
    "signals": [
      {
        "name": "layout", "value": "squarify"
      },
      {
        "name": "aspectRatio", "value": 1.6
      },
      {
        "name": "brush",
        "value": {},
        "on": [
          { "events": { "type": "mousedown" }, "update": "{x: x(event.clientX), y: y(event.clientY), x2: x(event.clientX), y2: y(event.clientY), down: true}" },
          { "events": { "type": "mousemove" }, "update": "brush.down ? {x: brush.x, y: brush.y, x2: x(event.clientX), y2: y(event.clientY), down:true} : brush" },
          { "events": { "type": "mouseup" }, "update": "brush.down ? {x: brush.x, y: brush.y, x2: x(event.clientX), y2: y(event.clientY), down: false} : brush" }
        ]
      }
    ],
  
    "data": [
      {
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
  
    "marks": [
      {
        "encode": {
          "update": {
            "fill": [
              {
                "test": "inrange(datum.x0, [brush.x, brush.x2]) && inrange(datum.y0, [brush.y, brush.y2])",
                "value": "red"
              },
              {"value": "transparent"}
            ]
          }
        }
      },
      {
        "encode": {
          "update": {
            "x": {"signal": "0.5 * (datum.x0 + datum.x1)"},
            "y": {"signal": "0.5 * (datum.y0 + datum.y1)"}
          }
        }
      },
      {
        "encode": {
          "update": {
            "x": {"signal": "brush.x"},
            "y": {"signal": "brush.y"},
            "x2": {"signal": "brush.x2"},
            "y2": {"signal": "brush.y2"}
          }
        }
      }
    ]
  }