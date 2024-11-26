
  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      graphGroup.attr("transform", transform);
      // 更新x轴
      xAxisGroup.call(d3.axisBottom(x).scale(event.transform.rescaleX(x)));

      // 更新y轴  
      yAxisGroup.call(d3.axisLeft(y).scale(event.transform.rescaleY(y)));
    });

  // Apply zoom behavior to the SVG container
  svg.call(zoom);