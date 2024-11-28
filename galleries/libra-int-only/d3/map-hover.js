
    svg.selectAll(".country")
      .data(countries.features)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", "#000")
      .attr("stroke", "#bbb")
      .attr("stroke-width", 1)
      .on("mouseover", function(d) {
        d3.select(this).attr("stroke", "firebrick").attr("stroke-width", 2);
      })
      .on("mouseout", function(d) {
        d3.select(this).attr("stroke", "#bbb").attr("stroke-width", 1);
      });
  
  