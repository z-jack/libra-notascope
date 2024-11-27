
  // Attach ClickInstrument to the main layer
  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [layer],
    sharedVar: {
      highlightColor: (d) => globalThis.color(d[globalThis.FIELD_COLOR]),
    },
  });