
var spec = {

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

  "marks": [
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
          "fill": {"signal": "invert ? '#fff' : '#000'"},
        },
        "hover": {
          "strokeWidth": {"signal": "+borderWidth + 1"},
          "stroke": {"value": "firebrick"},
          "zindex": {"value": 1}
        }
      },
    }
  ]
}
