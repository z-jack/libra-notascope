
  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      svg.selectAll("circle")
        .attr("transform", transform);
        // 更新x轴
        xAxisGroup.call(d3.axisBottom(xScale).scale(event.transform.rescaleX(xScale)));

        // 更新y轴  
        yAxisGroup.call(d3.axisLeft(yScale).scale(event.transform.rescaleY(yScale)));
    });

  // Apply zoom behavior to the SVG container
  svg.call(zoom);