
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: {
        stroke: 'red',
        fill: 'none',
        'stroke-width': 5
      }
    },
  });