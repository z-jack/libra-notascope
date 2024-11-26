
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
        3: { data: globalThis.data_detail_level0 },
        0: { data: globalThis.data_detail_level1 },
        "-3": { data: globalThis.data_detail_level2 },
        "-6": { data: globalThis.data_detail_level3 },
        "-9": { data: globalThis.data_detail_level4 },
        "-12": { data: globalThis.data_detail_level5 },
        "-15": { data: globalThis.data_detail_level6 },
      },
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });
