
  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      //   svg.selectAll("rect")
      //     .attr("transform", transform);
      //   svg.selectAll(".x-axis")
      //     .attr("transform", transform);
      const originalRangeX = [marginLeft, width - marginRight];
      const newRangeX = originalRangeX.map(v => (v + transform.x) * transform.k);

      const originalRangeY = [height - marginBottom, marginTop];
      rangeYextent = marginTop - height + marginBottom;
      const newRangeY = [height - marginBottom, height - marginBottom + transform.k * rangeYextent];
      x.range(newRangeX);
      y.range(newRangeY);

      svg.selectAll("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("height", d => y(0) - y(d.y))
        .attr("width", x.bandwidth());
      xAxisGroup.call(d3.axisBottom(x));
      yAxisGroup.call(d3.axisLeft(y));
      // yAxisGroup.call(d3.axisLeft(y).scale(transform.rescaleY(y)));
    });
  svg.call(zoom);