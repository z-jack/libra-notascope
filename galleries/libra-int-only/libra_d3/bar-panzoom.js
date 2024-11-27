
  Libra.Interaction.build({
    inherit: "PanInstrument",
    layers: [layer],
    sharedVar: {
      scaleX: globalThis.x,
    },
  });

  Libra.Interaction.build({
    inherit: "GeometricZoomInstrument",
    layers: [layer],
    sharedVar: {
      scaleX: globalThis.x,
    },
  });