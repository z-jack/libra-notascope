
  
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      svg.selectAll("rect")
        .attr("transform", transform);
      svg.selectAll("text")
        .attr("transform", transform);
  
    });
  
  // Apply zoom behavior to the SVG container
  svg.call(zoom);