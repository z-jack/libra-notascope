
    svg.selectAll(".country")
      .data(countries.features)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", "#000")
      .attr("stroke", "#bbb")
      .attr("stroke-width", 1)
      .on("mousedown", function(d) {
        d3.select(this).attr("fill", "firebrick");
      })
      .on("mouseup", function(d) {
        d3.select(this).attr("fill", "#000");
      });
  
  