

  const dustTransformer = Libra.GraphicalTransformer.initialize(
    "DustTransformer",
    {
      layer: dustLayer,
      sharedVar: { result: globalThis.data },
      redraw({ transformer }) {
        const dusts = transformer.getSharedVar("result");
        renderDust(dusts);
      },
    }
  );

  const magnetTransformer = Libra.GraphicalTransformer.initialize(
    "MagnetTransformer",
    {
      layer: magnetLayer,
      sharedVar: { result: globalThis.magnet },
      redraw({ transformer }) {
        const magnets = transformer.getSharedVar("result");
        renderMagnet(magnets);
      },
    }
  );

  const commonInsertFlows = [
    {
      find: "SelectionService",
      flow: [
        {
          comp: "MagnetPositionService",
          name: "MagnetPositionService",
          sharedVar: {
            magnets: globalThis.magnet,
          },
          evaluate({ magnets, offsetx, offsety, result }) {
            if (result && result.length) {
              const datum = d3.select(result[0]).datum();
              datum.x = offsetx - 25;
              datum.y = offsety - 25;
            } else if (offsetx && offsety) {
              magnets.push({
                x: offsetx - 25,
                y: offsety - 25,
                property:
                  globalThis.properties[
                    magnets.length % globalThis.properties.length
                  ],
              });
            }
            return magnets;
          },
        },
        magnetTransformer,
      ],
    },
    {
      find: "MagnetPositionService",
      flow: [
        {
          comp: "DustLayoutService",
          name: "DustLayoutService",
          sharedVar: { result: globalThis.magnet, dusts: globalThis.data },
          evaluate({ result: magnets, dusts, self }) {
            cancelAnimationFrame(globalThis.tickUpdate);

            const copyDusts = JSON.parse(JSON.stringify(dusts));

            for (const magnet of magnets) {
              const extent = d3.extent(
                copyDusts.map((datum) => datum[magnet.property])
              );
              for (const dust of copyDusts) {
                let x = dust.x;
                let y = dust.y;
                let dx = magnet.x;
                let dy = magnet.y;
                x += ((dx - x) * dust[magnet.property]) / 100 / extent[1];
                y += ((dy - y) * dust[magnet.property]) / 100 / extent[1];

                dust.x = x;
                dust.y = y;
              }
            }

            globalThis.tickUpdate = requestAnimationFrame(() =>
              self.setSharedVar("dusts", copyDusts)
            );
            return copyDusts;
          },
        },
        dustTransformer,
      ],
    },
  ];

  Libra.Interaction.build({
    inherit: "DragInstrument",
    layers: [
      { layer: magnetLayer, options: { pointerEvents: "visiblePainted" } }, // Block the underlying layer events
    ],
    remove: [
      {
        find: "SelectionTransformer", // Don't render the selected mark
      },
    ],
    insert: commonInsertFlows,
  });

  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [bgLayer],
    insert: commonInsertFlows,
  });

  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [dustLayer],
    sharedVar: {
      highlightColor: "greenyellow",
    },
  });


