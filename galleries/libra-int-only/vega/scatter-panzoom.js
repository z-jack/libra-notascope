
var spec = {

  "signals": [
    {
      "name": "margin",
      "value": 20
    },
    {
      "name": "hover",
      "on": [
        { "events": "*:pointerover", "encode": "hover" },
        { "events": "*:pointerout", "encode": "leave" },
        { "events": "*:pointerdown", "encode": "select" },
        { "events": "*:pointerup", "encode": "release" }
      ]
    },
    {
      "name": "xoffset",
      "update": "-(height + padding.bottom)"
    },
    {
      "name": "yoffset",
      "update": "-(width + padding.left)"
    },
    { "name": "xrange", "update": "[0, width]" },
    { "name": "yrange", "update": "[height, 0]" },

    {
      "name": "down", "value": null,
      "on": [
        { "events": "touchend", "update": "null" },
        { "events": "pointerdown, touchstart", "update": "xy()" }
      ]
    },
    {
      "name": "xcur", "value": null,
      "on": [
        {
          "events": "pointerdown, touchstart, touchend",
          "update": "slice(xdom)"
        }
      ]
    },
    {
      "name": "ycur", "value": null,
      "on": [
        {
          "events": "pointerdown, touchstart, touchend",
          "update": "slice(ydom)"
        }
      ]
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
          "update": "down ? [down[0]-x(), y()-down[1]] : [0,0]"
        }
      ]
    },

    {
      "name": "anchor", "value": [0, 0],
      "on": [
        {
          "events": "wheel",
          "update": "[invert('xscale', x()), invert('yscale', y())]"
        },
        {
          "events": { "type": "touchstart", "filter": "event.touches.length===2" },
          "update": "[(xdom[0] + xdom[1]) / 2, (ydom[0] + ydom[1]) / 2]"
        }
      ]
    },
    {
      "name": "zoom", "value": 1,
      "on": [
        {
          "events": "wheel!",
          "force": true,
          "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
        },
        {
          "events": { "signal": "dist2" },
          "force": true,
          "update": "dist1 / dist2"
        }
      ]
    },
    {
      "name": "dist1", "value": 0,
      "on": [
        {
          "events": { "type": "touchstart", "filter": "event.touches.length===2" },
          "update": "pinchDistance(event)"
        },
        {
          "events": { "signal": "dist2" },
          "update": "dist2"
        }
      ]
    },
    {
      "name": "dist2", "value": 0,
      "on": [{
        "events": { "type": "touchmove", "consume": true, "filter": "event.touches.length===2" },
        "update": "pinchDistance(event)"
      }]
    },

    {
      "name": "xdom", "update": "slice(xext)",
      "on": [
        {
          "events": { "signal": "delta" },
          "update": "[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width]"
        },
        {
          "events": { "signal": "zoom" },
          "update": "[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom]"
        }
      ]
    },
    {
      "name": "ydom", "update": "slice(yext)",
      "on": [
        {
          "events": { "signal": "delta" },
          "update": "[ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]"
        },
        {
          "events": { "signal": "zoom" },
          "update": "[anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]"
        }
      ]
    },
    {
      "name": "size",
      "update": "clamp(2000 / span(xdom), 1, 100)"
    }
  ],

  "data": [
    {
      "transform": [
        { "type": "extent", "field": "x", "signal": "xext" },
        { "type": "extent", "field": "y", "signal": "yext" }
      ]
    }
  ],

  "scales": [
    {
      "domain": { "signal": "xdom" },
      "range": { "signal": "xrange" }
    },
    {
      "domain": { "signal": "ydom" },
      "range": { "signal": "yrange" }
    }
  ],

  "axes": [
    {
      "offset": { "signal": "xoffset" }
    },
    {
      "offset": { "signal": "yoffset" }
    }
  ],

  "marks": [
    {
      "encode": {
        "update": {
          "size": { "signal": "size" }
        },
        "hover": { "fill": { "value": "firebrick" } },
        "leave": { "fill": { "value": "steelblue" } },
        "select": { "size": { "signal": "size", "mult": 5 } },
        "release": { "size": { "signal": "size" } }
      }
    }
  ]
}
