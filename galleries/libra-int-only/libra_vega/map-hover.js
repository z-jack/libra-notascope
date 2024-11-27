
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: { fill: "red" },
    },
  });
