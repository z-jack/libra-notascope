
  const nodeTransformer = Libra.GraphicalTransformer.initialize(
    "NodeTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        focus: globalThis.focus,
        view: globalThis.view,
      },
      redraw({ transformer }) {
        const focus = transformer.getSharedVar("focus");
        const view = transformer.getSharedVar("view");
        const k = globalThis.WIDTH / view[2];
        const nodes = transformer.layer.selectChildren("circle");
        nodes
          .attr("transform", (d) => `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`)
          .attr("r", (d) => d.r * k);
      },
    }
  );

  const labelTransformer = Libra.GraphicalTransformer.initialize(
    "LabelTransformer",
    {
      layer: labelLayer,
      sharedVar: {
        focus: globalThis.focus,
        view: globalThis.view,
      },
      redraw({ transformer }) {
        const focus = transformer.getSharedVar("focus");
        const view = transformer.getSharedVar("view");
        const k = globalThis.WIDTH / view[2];
        const labels = transformer.layer.selectChildren("text");
        labels
          .attr("transform", (d) => `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`)
          .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
          .style("display", (d) => (d.parent === focus ? "inline" : "none"));
      },
    }
  );

  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [mainLayer],
    remove: [nodeTransformer, labelTransformer],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "ZoomService",
            sharedVar: {
              duration: 750,
            },
            evaluate({ result, duration }) {
              const focus0 = globalThis.focus;
              globalThis.focus = result[0].__data__;
              const view = [globalThis.focus.x, globalThis.focus.y, globalThis.focus.r * 2];
              const transition = d3
                .transition()
                .duration(duration)
                .tween("zoom", (d) => {
                  const i = d3.interpolateZoom(globalThis.view, view);
                  return (t) => {
                    globalThis.view = i(t);
                  };
                });
              return { focus0, focus: globalThis.focus, view, transition };
            },
          },
          {
            comp: "ZoomTransformer",
            sharedVar: {
              duration: 750,
            },
            evaluate({ focus0, focus, view, transition }) {
              nodeTransformer.setSharedVar("focus", focus);
              nodeTransformer.setSharedVar("view", view);
              labelTransformer.setSharedVar("focus", focus);
              labelTransformer.setSharedVar("view", view);

              const labels = labelLayer.selectChildren("text");
              labels
                .filter(function (d) {
                  return d.parent === focus || this.style.display === "inline";
                })
                .transition(transition)
                .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
                .on("start", function (d) {
                  if (d.parent === focus) this.style.display = "inline";
                })
                .on("end", function (d) {
                  if (d.parent !== focus) this.style.display = "none";
                });
            },
          },
          nodeTransformer,
          labelTransformer,
        ],
      },
    ],
  });