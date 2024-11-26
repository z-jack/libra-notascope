
  // Create zoom behavior
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      drawNode(globalThis.dataSet[clamp(Math.floor(transform.k*2),0,6)])
      svg.selectAll(".mark")
        .attr("transform", transform);
      // 更新x轴
      xAxisGroup.call(d3.axisBottom(globalThis.x).scale(event.transform.rescaleX(globalThis.x)));

      // 更新y轴  
      yAxisGroup.call(d3.axisLeft(globalThis.y).scale(event.transform.rescaleY(globalThis.y)));
    });

  // Apply zoom behavior to the SVG container
  svg.call(zoom);
