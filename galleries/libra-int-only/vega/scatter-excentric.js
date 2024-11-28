
var spec = {
  "signals": [
    {
      "name": "cursorY",
      "update": "0",
      "on": [
        {
          "events": "pointermove",
          "update": "invert('y', clamp(y(), 0, height))"
        }
      ]
    },
    {
      "name": "cursorX",
      "update": "0",
      "on": [
        {
          "events": "pointermove",
          "update": "invert('x', clamp(x(), 0, width))"
        }
      ]
    }
  ],
  data: [
    {
      transform: [
        {
          type: "filter",
          expr: "datum['Horsepower'] != null && datum['Miles_per_Gallon'] != null && datum['Acceleration'] != null",
        }
      ],
    },
    {
      "name": "selected",
      "source": "source",
      "transform": [
        {
          "type": "filter",
          "expr": "sqrt(pow(scale('x', datum['Horsepower']) - scale('x', cursorX), 2) + pow(scale('y', datum['Miles_per_Gallon']) - scale('y', cursorY), 2)) <= 25"
        },
        {
          "type": "window",
          "ops": ["row_number"],
          "as": ["index"]
        }
      ]
    }
  ],

  marks: [
    {
      encode: {
        update: {
          x: { "scale": "x", "signal": "cursorX" },
          y: { "scale": "y", "signal": "cursorY" },
        },
      },
    },
    {
      "encode": {
        "update": {
          "x": {"signal": "scale('x', cursorX) + 40"},
          "y": {"signal": "scale('y', cursorY) + datum.index * 10", "offset": -2}
        }
      }
    },
  ],
};
