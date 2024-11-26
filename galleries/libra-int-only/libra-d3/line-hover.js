
  // Attach HoverInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    sharedVar: {
      highlightAttrValues: {
        stroke: 'red',
        fill: 'none',
        'stroke-width': 5
      }
    },
  });
