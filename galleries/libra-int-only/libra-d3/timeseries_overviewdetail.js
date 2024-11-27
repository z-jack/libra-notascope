

  const detailTransformer = Libra.GraphicalTransformer.initialize(
    "DetailTransformer",
    {
      layer: detailLayer,
      sharedVar: {
        result: globalThis.x,
      },
      redraw({ transformer }) {
        const scaleX = transformer.getSharedVar("result");
        renderDetailView(scaleX);
      },
    }
  );


  Libra.Interaction.build({
    inherit: "BrushXInstrument",
    layers: [overviewLayer],
    insert: [
      {
        find: "SelectionService",
        flow: [{ comp: "ScaleService" }, detailTransformer],
      },
    ],
    sharedVar: { scaleX: globalThis.x },
  });