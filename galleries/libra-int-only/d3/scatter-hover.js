
    // Add hover functionality
    dots.on("mouseover", function (event, d) {
        d3.select(this)
            .attr("fill", "red")
            .attr("opacity", 1);
    })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .attr("fill", "steelblue")
                .attr("opacity", 0.7);
        });