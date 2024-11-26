
  // Attach ClickInstrument to the main layer
  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: {
        stroke: "red",
        fill: "none",
        "stroke-width": 5,
      },
    },
  });
