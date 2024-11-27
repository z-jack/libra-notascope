
  Libra.GraphicalTransformer.register("NodeTransformer", {
    redraw: function ({ layer }) {
      const nodes = layer.selectChildren("g");
      nodes.call((g) =>
        g
          .selectAll("text")
          .attr("font-weight", null)
          .attr("fill", null)
      );
    },
  });

  Libra.GraphicalTransformer.register("LinkTransformer", {
    redraw: function ({ layer }) {
      const links = layer.selectChildren("path");
      links.attr("stroke", "#ccc");
    },
  });

  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: mainLayer,
    }
  );

  const linkTransformer = Libra.GraphicalTransformer.initialize(
    "LinkTransformer",
    {
      layer: linkLayer,
    }
  );

  Libra.Interaction.build({
    inherit: "HoverInstrument",
    layers: [mainLayer],
    remove: [nodeTransformer, linkTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "NodeHighlightService",
            sharedVar: {
              highlightColor: "#f00",
              incomingColor: "#00f",
              outgoingColor: "#00f",
            },
            evaluate({ result, highlightColor, incomingColor, outgoingColor }) {
              if (result && result.length) {
                const datum = d3.select(result[0]).datum();
                d3.select(datum.text)
                  .attr("font-weight", "bold")
                  .attr("fill", highlightColor);
                d3.selectAll(datum.incoming.map((d) => d.path)).attr(
                  "stroke",
                  incomingColor
                );
                d3.selectAll(
                  datum.incoming.map(([d]) => d.text)
                ).attr("fill", incomingColor).attr("font-weight", "bold");
                d3.selectAll(datum.outgoing.map((d) => d.path)).attr(
                  "stroke",
                  outgoingColor
                );
                d3.selectAll(
                  datum.outgoing.map(([, d]) => d.text)
                ).attr("fill", outgoingColor).attr("font-weight", "bold");
              }
            },
          },
          nodeTransformer,
          linkTransformer,
        ],
      },
    ],
  });