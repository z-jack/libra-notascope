
  const brushTransformer = Libra.GraphicalTransformer.initialize(
    "BrushTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        result: [],
      },
      redraw({ transformer }) {
        const circles = transformer.layer.selectChildren("circle");
        const selected = transformer.getSharedVar("result");
        circles.classed("hidden", (d) => !selected.includes(d));
      },
    }
  );

  Libra.Interaction.build({
    inherit: "BrushInstrument",
    layers: [mainLayer],
    remove: [brushTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "BrushService",
            sharedVar: {
              padding: globalThis.MARGIN.left,
              size: globalThis.size,
              x: globalThis.x,
              y: globalThis.y,
              columns: globalThis.columns,
            },
            evaluate({
              padding,
              size,
              x,
              y,
              columns,
              brushSelection,
              brushTarget,
            }) {
              const [i, j] = d3.brush().ticks(brushTarget.datum());
              let selected = [];
              if (brushSelection) {
                const [[x0, y0], [x1, y1]] = brushSelection;
                selected = globalThis.data.filter(
                  (d) =>
                    x0 < x[i](d[columns[i]]) &&
                    x1 > x[i](d[columns[i]]) &&
                    y0 < y[j](d[columns[j]]) &&
                    y1 > y[j](d[columns[j]])
                );
              }
              return selected;
            },
          },
          brushTransformer,
        ],
      },
    ],
  });