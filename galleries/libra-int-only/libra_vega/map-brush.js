
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { fill: "red" },
    },
  });
