
  Libra.Service.register("ReverseScaleService", {
    sharedVar: {
      scaleX: globalThis.x,
    },
    evaluate({ event, scaleX }) {
      if (!event) return new Date(2004, 0, 1);
      const x = scaleX.invert(event.x);
      return x;
    },
  });

  // Attach HoverInstrument to the main layer
  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [layer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          { comp: "ReverseScaleService" },
          {
            comp: "MainTransformer",
          },
        ],
      },
    ],
  });