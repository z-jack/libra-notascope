var spec = {
  "signals": [
    {
      "name": "clickedDatum",
      "value": null,
      "desc": "Stores the clicked datum, or null if nothing is clicked."
    }
  ],
  "marks": [
    {
      "encode": {
        "update": {
          "fill": [
            {
              "test": "clickedDatum && clickedDatum.datum === datum",
              "value": "firebrick"
            },
            {"value": "transparent"}
          ],
          "fillOpacity": [
            {
              "test": "clickedDatum && clickedDatum.datum === datum",
              "value": 1
            },
            {"value": 0.5}
          ]
        },
        "hover": {
          "cursor": {"value": "pointer"}
        }
      }
    }
  ],
  "handlers": [
    {
      "events": {"click": {"consume": true}},
      "update": "clickedDatum = invert('marks', datum)"
    }
  ]
};
