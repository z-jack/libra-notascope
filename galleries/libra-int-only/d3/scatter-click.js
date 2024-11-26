
    // Add hover functionality
    dots.on("mousedown", function (event, d) {
        d3.select(this)
            .attr("fill", "red")
            .attr("opacity", 1);
    })
        .on("mouseup", function (event, d) {
            d3.select(this)
                .attr("fill", "steelblue")
                .attr("opacity", 0.7);
        });