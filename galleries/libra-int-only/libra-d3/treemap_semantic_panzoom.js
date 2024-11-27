
  Libra.Interaction.build({
    inherit: "PanInstrument",
    layers: [layer],
    sharedVar: {
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });

  Libra.Interaction.build({
    inherit: "SemanticZoomInstrument",
    layers: [layer],
    sharedVar: {
      scaleLevels: {
        0: { data: globalThis.data_detail_level1 },
        3: { data: globalThis.data_detail_level2 },
        6: { data: globalThis.data_detail_level3 },
      },
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });