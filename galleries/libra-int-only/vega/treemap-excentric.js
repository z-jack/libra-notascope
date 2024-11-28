
var spec = {
  
    "signals": [
      {
        "name": "layout", "value": "squarify"
      },
      {
        "name": "aspectRatio", "value": 1.6
      },
      {
        "name": "cursorY",
        "update": "0",
        "on": [
          {
            "events": "pointermove",
            "update": "clamp(y(), 0, height)"
          }
        ]
      },
      {
        "name": "cursorX",
        "update": "0",
        "on": [
          {
            "events": "pointermove",
            "update": "clamp(x(), 0, width)"
          }
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
      },
      {
        "name": "selected",
        "source": "leaves",
        "transform": [
          {
            "type": "filter",
            "expr": "(datum.x0<=(cursorX+10) && datum.x1>=(cursorX-10)) && (datum.y0<=(cursorY+10) && datum.y1>=(cursorY-10))"
          },
          {
            "type": "window",
            "ops": ["row_number"],
            "as": ["index"]
          }
        ]
      }
    ],
  
    "marks": [
      {
        "encode": {
          "update": {
            "x": { "signal": "(datum.x0 + datum.x1) * 0.5" },
            "y": { "signal": "(datum.y0 + datum.y1) * 0.5" },
            "x2": { "signal": "cursorX + 30" },
            "y2": { "signal": "cursorY + datum.index * 15" },
          },
        }
      },
      {
        "encode": {
          "update": {
            "x": { "signal": "0.5 * (datum.x0 + datum.x1)" },
            "y": { "signal": "0.5 * (datum.y0 + datum.y1)" }
          }
        }
      },
      {
        "encode": {
          "update": {
            "x": { "signal": "cursorX + 30" },
            "y": { "signal": "cursorY + datum.index * 15" },
          }
        }
      },
      {
        encode: {
          update: {
            x: { "signal": "cursorX" },
            y: { "signal": "cursorY" },
          },
        },
      }
    ]
  }
  