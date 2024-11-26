
  // Attach BrushInstrument to the main layer
  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: (d) => globalThis.color(d[globalThis.FIELD_COLOR]),
    },
  });