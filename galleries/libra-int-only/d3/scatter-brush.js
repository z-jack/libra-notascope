
    // Add brush
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    let selectedPoints = [];

    function brushed(event) {
        const selection = event.selection;
        selectedPoints = [];

        if (selection) {
            dots.classed("selected", function (d) {
                const isSelected = selection[0][0] <= x(d.x) && x(d.x) <= selection[1][0] &&
                    selection[0][1] <= y(d.y) && y(d.y) <= selection[1][1];
                if (isSelected) {
                    d3.select(this)
                        .attr("fill", "red")
                        .attr("opacity", 1);
                } else {
                    d3.select(this).attr("fill", "steelblue")
                        .attr("opacity", 0.7);
                }
                return isSelected;
            });
        } else {
            dots.attr("fill", "steelblue")
                .attr("opacity", 0.7);
        }

        // Output selected points to console
        // console.log("Selected points:", selectedPoints);
    }