
  // Initialize Main Transformer
  const mainTransformer = Libra.GraphicalTransformer.initialize(
    "MainTransformer",
    {
      layer,
      sharedVar: {
        result: { scaleY: globalThis.y, data: globalThis.data },
      },
      redraw({ transformer }) {
        const { scaleY, data } = transformer.getSharedVar("result");
        renderMainVisualization(scaleY, data);
      },
    }
  );

  // Initialize Service
  const normalizationService = Libra.Service.initialize(
    "NormalizationService",
    {
      constructor: Libra.Service.AnalysisService,
      transformers: [mainTransformer],
      sharedVar: { point: 0 },
      evaluate({ point }) {
        const date = globalThis.x.invert(point);
        const data = JSON.parse(JSON.stringify(globalThis.data));
        data.forEach(([_, items]) => {
          if (items.length > 0) {
            items.forEach(({ date }, i) => {
              items[i].date = new Date(date);
            });
            let leftItemIndex = 0;
            let rightItemIndex = 0;
            for (let i = 1; i < items.length; ++i) {
              const item = items[i];
              if (date <= item.date) {
                leftItemIndex = i - 1;
                rightItemIndex = i;
                break;
              }
            }
            const leftItem = items[leftItemIndex];
            const rightItem = items[rightItemIndex];
            const a =
              leftItem.date === rightItem.date
                ? 1
                : (date - leftItem.date) / (rightItem.date - leftItem.date);
            let baseValue = leftItem.value * a + rightItem.value * (1 - a);
            items.forEach(({ value }, i) => {
              items[i].k = value / baseValue;
            });
          }
        });

        const scaleY = globalThis.y.copy();
        scaleY.domain(
          d3.extent(
            data.flatMap((d) => d[1]),
            (d) => d.k
          )
        );

        return { scaleY, data };
      },
    }
  );

  // Attach HelperLineInstrument to the main layer
  const helperLineInstrument = Libra.Instrument.initialize(
    "HelperLineInstrument",
    {
      layers: [layer],
      services: [normalizationService],
      sharedVar: {
        orientation: ["vertical"],
        style: {
          stroke: "black",
        },
      },
    }
  );

  helperLineInstrument.on("hover", function ({ instrument }) {
    const barX = instrument.getSharedVar("x") - globalThis.MARGIN.left;
    instrument.services.setSharedVar("point", barX);
  });