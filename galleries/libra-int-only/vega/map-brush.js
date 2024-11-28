
var spec = {
  "signals": [
    { "name": "type", "value": "mercator" },
    { "name": "scale", "value": 150 },
    { "name": "rotate0", "value": 0 },
    { "name": "rotate1", "value": 0 },
    { "name": "rotate2", "value": 0 },
    { "name": "center0", "value": 0 },
    { "name": "center1", "value": 0 },
    { "name": "translate0", "update": "width / 2" },
    { "name": "translate1", "update": "height / 2" },
    { "name": "graticuleDash", "value": 0 },
    { "name": "borderWidth", "value": 1 },
    { "name": "background", "value": "#ffffff" },
    { "name": "invert", "value": false },
    { "name": "brushing", "init": false,
      "on": [
        {"events": "@bg:pointerdown", "update": "true"},
        {"events": "@bg:pointerup", "update": "false"}
      ]
    },
    {
      "name": "brush",
      "value": {"x1": 0, "y1": 0, "x2": 0, "y2": 0},
      "on": [
        {"events": "@bg:pointerdown", "update": "{x1: x(), y1: y(), x2: x(), y2: y()}"},
        {"events": "@bg:pointermove", "update": "brushing ? {x1: brush.x1, y1: brush.y1, x2: x(), y2: y()} : brush"}
      ]
    }
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
      "transform": [
        {
          "type": "formula",
          "expr": "geoBounds('projection', datum)",
          "as": "bbox"
        }
      ]
    },
  ],
  "marks": [
    {
      "encode": {
        "update": {
          "width": {"signal": "width"},
          "height": {"signal": "height"}
        }
      }
    },
    {
      "encode": {
        "update": {
          "strokeDash": {"signal": "[+graticuleDash, +graticuleDash]"},
          "stroke": {"signal": "invert ? '#444' : '#ddd'"},
        }
      },
    },
    {
      "encode": {
        "update": {
          "strokeWidth": {"signal": "+borderWidth"},
          "stroke": {"signal": "invert ? '#777' : '#bbb'"},
          "fill": [
            {"test": "inrange(datum.bbox[0][0], [brush.x1, brush.x2]) && inrange(datum.bbox[1][0], [brush.x1, brush.x2]) && inrange(datum.bbox[0][1], [brush.y1, brush.y2]) && inrange(datum.bbox[1][1], [brush.y1, brush.y2])", "value": "firebrick"},
            {"signal": "invert ? '#fff' : '#000'"}],
        }
      },
    },
    {
      "type": "rect",
      "interactive": false,
      "encode": {
        "update": {
          "x": {"signal": "brush.x1"},
          "y": {"signal": "brush.y1"},
          "x2": {"signal": "brush.x2"},
          "y2": {"signal": "brush.y2"},
          "stroke": {"value": "red"},
          "strokeWidth": {"value": 1},
          "fill": {"value": "#000"},
          "fillOpacity": {"value": 0.3}
        }
      }
    }
  ]
}
