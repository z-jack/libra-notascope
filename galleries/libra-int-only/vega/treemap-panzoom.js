var spec = {
    "signals": [
      {
        // "name": "tx", "update": "width / 2"
        "name": "tx", "update": "0"
      },
      {
        // "name": "ty", "update": "height / 2"
        "name": "ty", "update": "0"
      },
      {
        "name": "zoom", "value": 1,
        "on": [
          {
            "events": "wheel!",
            "update": "clamp(zoom * pow(1.001, -event.deltaY), 0.1, 10)"
          }
        ]
      },
      {
        "name": "down", "value": null,
        "on": [{ "events": "touchend", "update": "null" },
        { "events": "pointerdown, touchstart", "update": "xy()" }]
      },
      {
        "name": "delta", "value": [0, 0],
        "on": [
          {
            "events": [
              {
                "source": "window", "type": "pointermove", "consume": true,
                "between": [{ "type": "pointerdown" }, { "source": "window", "type": "pointerup" }]
              },
              {
                "type": "touchmove", "consume": true,
                "filter": "event.touches.length === 1"
              }
            ],
            "update": "down ? [x() - down[0], y() - down[1]] : [0, 0]"
          }
        ]
      },
      {
        "name": "xoffset", "value": 0,
        "on": [{ "events": { "signal": "delta" }, "update": "delta[0]" }]
      },
      {
        "name": "yoffset", "value": 0,
        "on": [{ "events": { "signal": "delta" }, "update": "delta[1]" }]
      },
      {
        "name": "layout", "value": "squarify"
      },
      {
        "name": "aspectRatio", "value": 1.6
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
            "sort": { "field": "value" },
            "round": true,
            "method": { "signal": "layout" },
            "ratio": { "signal": "aspectRatio" },
            "size": [{ "signal": "width" }, { "signal": "height" }]
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
            "x": { "signal": "((datum.x0 + xoffset) * zoom) + tx" },
            "y": { "signal": "((datum.y0 + yoffset) * zoom) + ty" },
            "x2": { "signal": "((datum.x1 + xoffset) * zoom) + tx" },
            "y2": { "signal": "((datum.y1 + yoffset) * zoom) + ty" }
          }
        }
      },
      {
        "encode": {
          "update": {
            "x": { "signal": "((datum.x0 + xoffset) * zoom) + tx" },
            "y": { "signal": "((datum.y0 + yoffset) * zoom) + ty" },
            "x2": { "signal": "((datum.x1 + xoffset) * zoom) + tx" },
            "y2": { "signal": "((datum.y1 + yoffset) * zoom) + ty" },
          },
          "hover": {
            "fill": { "value": "red" }
          }
        }
      },
      {
        "encode": {
          "update": {
            "x": { "signal": "(((datum.x0 + datum.x1) / 2 + xoffset) * zoom) + tx" },
            "y": { "signal": "(((datum.y0 + datum.y1) / 2 + yoffset) * zoom) + ty" }
          }
        }
      }
    ]
  }
  
  