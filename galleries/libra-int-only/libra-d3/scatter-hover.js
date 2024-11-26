
  // Attach HoverInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: (d) => globalThis.color(d[globalThis.FIELD_COLOR]),
    },
  });