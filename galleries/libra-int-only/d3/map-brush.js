  
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("start brush end", brushed);
  
    svg.append("g")
      .attr("class", "brush")
      .call(brush);
  
    let selected = [];
  
    function brushed(event) {
      const selection = event.selection;
      selected = [];
      if (selection) {
        paths.classed("selected", function (d) {
          const bound = d3.select(this).node().getBBox();
          console.log(bound);
          const isSelected =
            (bound.x < selection[1][0] && bound.x + bound.width > selection[0][0]) &&
            (bound.y < selection[1][1] && bound.y + bound.height > selection[0][1]);
          if (isSelected) {
            d3.select(this)
              .attr("fill", "red")
          } else {
            d3.select(this)
              .attr("fill", "#000")
          }
          return isSelected;
        });
      } else {
        paths.attr("fill", "#000")
      }
      // Output selected bars to console
      // console.log("Selected bars:", selectedBars);
    }