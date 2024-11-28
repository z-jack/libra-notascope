
  // Create zoom behavior
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  const zoom = d3.zoom()
  .scaleExtent([0.1, 10])
  .on("zoom", (event) => {
    const { transform } = event;
    drawTreemap(globalThis.dataSet[clamp(Math.floor(transform.k),0,2)])
    svg.selectAll("rect")
      .attr("transform", transform);
    svg.selectAll("text")
      .attr("transform", transform);

  });

  // Apply zoom behavior to the SVG container
  svg.call(zoom);


