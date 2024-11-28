
var spec = {
  
    "signals": [
      {
        "name": "layout", "value": "squarify"
      },
      {
        "name": "aspectRatio", "value": 1.6
      },
      {
        "name": "cursor",
        "value": '',
        "on": [
          {"events": "mousedown", "update": "datum.id"},
          {"events": "mouseup", "update": "''"}
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
          },
          {
            "type": "window",
            "ops": ["row_number"],
            "as": ["id"]
          },
          {
            "type": "formula",
            "expr": "datum.id == cursor",
            "as": "marked"
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
                "test": "datum.marked === true", 
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
      }
    ]
  }