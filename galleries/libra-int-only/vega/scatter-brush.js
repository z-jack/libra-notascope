var spec = {


  "marks": [
    {
      "encode": {
        "update": {
          "fill": [
            {
              "test": "inrange(scale('x', datum.x), [brush.x, brush.x2]) && inrange(scale('y', datum.y), [brush.y, brush.y2])",
              "value": "red",
            },
            {
              "value": "transparent"
            }
          ],
        }
      }
    },
    {
      "encode": {
        "update": {
          "x": { "signal": "brush.x" },
          "y": { "signal": "brush.y" },
          "x2": { "signal": "brush.x2" },
          "y2": { "signal": "brush.y2" }
        }
      }
    }
  ],

  "signals": [
    {
      "name": "brush",
      "value": {},
      "on": [
        { "events": { "type": "mousedown" }, "update": "{x: x(event.clientX), y: y(event.clientY), x2: x(event.clientX), y2: y(event.clientY), down: true}" },
        { "events": { "type": "mousemove" }, "update": "brush.down ? {x: brush.x, y: brush.y, x2: x(event.clientX), y2: y(event.clientY), down:true} : brush" },
        { "events": { "type": "mouseup" }, "update": "brush.down ? {x: brush.x, y: brush.y, x2: x(event.clientX), y2: y(event.clientY), down: false} : brush" }
      ]
    }
  ]
};

