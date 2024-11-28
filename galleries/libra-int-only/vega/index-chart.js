
var spec = {
    "signals": [
      {
        "name": "indexDate",
        "update": "time('Jan 1 2005')",
        "on": [
          {
            "events": "pointermove",
            "update": "invert('x', clamp(x(), 0, width))"
          }
        ]
      },
      {
        "name": "maxDate",
        "update": "time('Mar 1 2010')"
      }
    ],
  
    "data": [
      {
        "name": "index",
        "source": "stocks",
        "transform": [
          {
            "type": "filter",
            "expr": "month(datum.date) == month(indexDate) && year(datum.date) == year(indexDate)"
          }
        ]
      },
      {
        "name": "indexed_stocks",
        "source": "stocks",
        "transform": [
          {
            "type": "lookup", "from": "index", "key": "symbol",
            "fields": ["symbol"], "as": ["index"], "default": {"price": 0}
          },
          {
            "type": "formula",
            "as": "indexed_price",
            "expr": "datum.index.price > 0 ? (datum.price - datum.index.price)/datum.index.price : 0"
          }
        ]
      }
    ],

    "marks": [
      {
        "type": "group",
        "data": [
          {
            "name": "label",
            "source": "series",
            "transform": [
              { "type": "filter", "expr": "datum.date == maxDate" }
            ]
          }
        ],
      },
      {
        "type": "rule",
        "encode": {
          "update": {
            "x": {"scale": "x", "signal": "indexDate", "offset": 0.5},
          }
        }
      },
      {
        "type": "text",
        "encode": {
          "update": {
            "x": {"scale": "x", "signal": "indexDate"},
            "text": {"signal": "timeFormat(indexDate, '%b %Y')"},
          }
        }
      }
    ]
  }