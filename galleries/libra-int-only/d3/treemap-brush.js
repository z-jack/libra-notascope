
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("start brush end", brushed);
  
  svg.append("g")
    .attr("class", "brush")
    .call(brush);
  
  let selectedBars = [];
  
  function brushed(event) {
    const selection = event.selection;
    selectedBars = [];
    if (selection) {
      bars.classed("selected", function (d) {
        console.log(d);
        const isSelected =
          (d.x0 < selection[1][0] && d.x1 > selection[0][0]) &&
          (d.y0 < selection[1][1] && d.y1 > selection[0][1]);
        if (isSelected) {
          d3.select(this)
            .attr("fill", "red")
            .attr("opacity", 1);
        } else {
          d3.select(this)
            .attr("fill", "steelblue")
            .attr("opacity", 0.7);
        }
        return isSelected;
      });
    } else {
      bars.attr("fill", "steelblue")
        .attr("opacity", 0.7);
    }
  }
  