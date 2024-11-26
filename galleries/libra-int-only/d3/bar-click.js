
    // Add bars for each data point
    const bars = svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.y); })
        .attr("height", function(d) { return height - y(d.y); })
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .on("mousedown", function(event, d) {
            d3.select(this)
                .attr("fill", "red")
                .attr("opacity", 1);
        })
        .on("mouseup", function(event, d) {
            d3.select(this)
                .attr("fill", "steelblue")
                .attr("opacity", 0.7);
        });