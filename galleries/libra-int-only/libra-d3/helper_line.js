
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "LineTransformer",
            sharedVar: {
              orientation: ["horizontal"],
              scaleY: globalThis.y,
            },
          },
        ],
      },
    ],
    sharedVar: {
      tooltip: {
        prefix: "Frequency: ",
      },
    },
  });
