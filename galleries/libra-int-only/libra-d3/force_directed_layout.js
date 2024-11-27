
  Libra.GraphicalTransformer.register("LinkTransformer", {
    redraw: function ({ layer }) {
      const links = layer.selectChildren("line");
      links.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    },
  });

  Libra.GraphicalTransformer.register("NodeTransformer", {
    redraw: function ({ layer }) {
      const nodes = layer.selectChildren("circle");
      nodes.attr("cx", d => d.x)
        .attr("cy", d => d.y);
    },
  });

  const linkTransformer = Libra.GraphicalTransformer.initialize(
    "LinkTransformer",
    {
      layer: linkLayer,
    }
  );

  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: nodeLayer,
    }
  );

  Libra.Interaction.build({
    inherit: "DragInstrument",
    layers: [nodeLayer],
    remove: [nodeTransformer, linkTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "DragService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ result, simulation }) {
              if (result && result.length) {
                const datum = d3.select(result[0]).datum();
                if (!simulation.alphaTarget()) {
                  simulation.alphaTarget(0.3).restart();
                }
                datum.fx = datum.x;
                datum.fy = datum.y;
              }
            },
          },
          {
            comp: "DraggedService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ offsetx, offsety, simulation }) {
              const node = simulation.find(null, offsetx, offsety);
              if (node) {
                node.fx = offsetx;
                node.fy = offsety;
              }
            },
          },
          {
            comp: "DragEndedService",
            sharedVar: {
              simulation: globalThis.simulation,
            },
            evaluate({ simulation }) {
              if (!simulation.alphaTarget()) {
                simulation.alphaTarget(0);
              }
              simulation.nodes().forEach(d => {
                d.fx = null;
                d.fy = null;
              });
            },
          },
          nodeTransformer,
          linkTransformer,
        ],
      },
    ],
  });