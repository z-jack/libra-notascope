var spec = {
  "signals": [
    {
      "name": "cursor",
      "value": '',
      "on": [
        {"events": "mousedown", "update": "datum.dataID"},
        {"events": "mouseup", "update": "''"}
      ]
    }
  ],
  "marks": [
    {
      "encode": {
        "update": {
          "stroke": [
            {
              "test": "datum.marked === true", // 检查 marked 是否为 true
              "value": "red" // 如果为 true，则使用红色
            },
            {"value": "steelblue"} // 否则使用 steelblue
          ]
        }
      }
    },
    {
      "encode": {
        "update": {
          "stroke": [
            {
              "test": "datum.marked === true", // 检查 marked 是否为 true
              "value": "red" // 如果为 true，则使用红色
            },
            {"value": "steelblue"} // 否则使用 steelblue
          ]
        }
      }
    }
  ]
};
