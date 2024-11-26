
        const path = svg.selectAll(".line")
        .data(data)
        .enter().append("path")
          .attr("class", "line")
          .attr("d", d => line(d))
          .attr("stroke", "black")
          .attr("stroke-width", "2")
          .attr("fill", "none")
          .on("mousedown", function(event, d) {
            d3.select(this)
                .attr("stroke", "red")
        })
        .on("mouseup", function(event, d) {
            d3.select(this)
                .attr("stroke", "black")
        });;
    