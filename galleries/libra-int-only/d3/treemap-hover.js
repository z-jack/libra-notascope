
  const padding = 2;
  // Append the treemap rectangles
  svg.selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
    .attr("x", d => d.x0 + padding)
    .attr("y", d => d.y0 + padding)
    .attr("width", d => d.x1 - d.x0 - 2 * padding)
    .attr("height", d => d.y1 - d.y0 - 2 * padding)
    .attr("fill", "steelblue") 
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("fill", "red")
        .attr("opacity", 1);
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);
    });