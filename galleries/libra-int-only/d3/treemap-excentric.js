
  svg.on("mousemove", function (event) {
    const mouseX = event.offsetX - globalThis.MARGIN.left;
    const mouseY = event.offsetY - globalThis.MARGIN.top;

    selectCircle.attr("cx", mouseX)
      .attr("cy", mouseY);

    const selectedRectsLeft = d3.selectAll("rect")
      .data(globalThis.data)
      .filter(d => (rectCircleIntersecting(
        { x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0 },
        { x: mouseX, y: mouseY, radius: 20 }
      )) && (d.x0 + d.x1) / 2 <= mouseX);

    const selectedRectsRight = d3.selectAll("rect")
      .data(globalThis.data)
      .filter(d => (rectCircleIntersecting(
        { x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0 },
        { x: mouseX, y: mouseY, radius: 20 }
      )) && (d.x0 + d.x1) / 2 > mouseX);

    selectText.attr("x", mouseX)
      .attr("y", mouseY - 20)
      .text(selectedRectsLeft.size() + selectedRectsRight.size());

    const textsLeft = detailTextLeft.selectAll("text")
      .data(selectedRectsLeft.data());

    textsLeft.enter()
      .append("text")
      .merge(textsLeft)
      // .attr("x", mouseX)
      .attr("y", (d, i) => mouseY + 10 * (i - 0.5 * selectedRectsLeft.size()))
      .text(d => d.data.name)
      .each(function (d) {
        const width = this.getBBox().width;
        d3.select(this)
          .attr("x", mouseX - 30 - (width / 2))
      });

    textsLeft.exit().remove();

    const textsRight = detailTextRight.selectAll("text")
      .data(selectedRectsRight.data());

    textsRight.enter()
      .append("text")
      .merge(textsRight)
      // .attr("x", mouseX)
      .attr("y", (d, i) => mouseY + 10 * (i - 0.5 * selectedRectsRight.size()))
      .text(d => d.data.name)
      .each(function (d) {
        const width = this.getBBox().width;
        d3.select(this)
          .attr("x", mouseX + 30 + (width / 2))
      });

    textsRight.exit().remove();

    ////lines
    const line = d3.line()
      .x(d => d.x)
      .y(d => d.y);

    const linesLeft = detailLineLeft.selectAll("path")
      .data(selectedRectsLeft.data().sort(d => d.y1 + d.y0).map((d, i) => [
        {
          x: (d.x1 + d.x0)/2,
          y: (d.y1 + d.y0)/2
        },
        {
          x: mouseX - 30,
          y: mouseY + 10 * (i - 0.5 * selectedRectsLeft.size())
        }
      ]));

    linesLeft.enter()
      .append("path")
      .merge(linesLeft)
      // .attr("x", mouseX)
      .attr("d", d => {
        console.log(line(d));
        return line(d)
      });

    linesLeft.exit().remove();

    const linesRight = detailLineRight.selectAll("path")
      .data(selectedRectsRight.data().sort(d => d.y1 + d.y0).map((d, i) => [
        {
          x: (d.x1 + d.x0)/2,
          y: (d.y1 + d.y0)/2
        },
        {
          x: mouseX + 30,
          y: mouseY + 10 * (i - 0.5 * selectedRectsRight.size())
        }
      ]));

    linesRight.enter()
      .append("path")
      .merge(linesRight)
      // .attr("x", mouseX)
      .attr("d", d => {
        console.log(line(d));
        return line(d)
      });

    linesRight.exit().remove();
  });