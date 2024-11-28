
  svg.on("mousemove", function (event) {
    const mouseX = event.offsetX - globalThis.MARGIN.left;
    const mouseY = event.offsetY - globalThis.MARGIN.top;

    selectCircle.attr("cx", mouseX)
      .attr("cy", mouseY);

    const selectedCirclesLeft = d3.selectAll("circle")
      .data(globalThis.data)
      .filter(d => (Math.sqrt((globalThis.x(d[globalThis.FIELD_X]) - mouseX) ** 2 + (globalThis.y(d[globalThis.FIELD_Y]) - mouseY) ** 2) < 20) && globalThis.x(d[globalThis.FIELD_X]) <= mouseX);

    const selectedCirclesRight = d3.selectAll("circle")
      .data(globalThis.data)
      .filter(d => (Math.sqrt((globalThis.x(d[globalThis.FIELD_X]) - mouseX) ** 2 + (globalThis.y(d[globalThis.FIELD_Y]) - mouseY) ** 2) < 20) && globalThis.x(d[globalThis.FIELD_X]) > mouseX);

    selectText.attr("x", mouseX)
      .attr("y", mouseY - 20)
      .text(selectedCirclesLeft.size() + selectedCirclesRight.size());

    const textsLeft = detailTextLeft.selectAll("text")
      .data(selectedCirclesLeft.data());

    textsLeft.enter()
      .append("text")
      .merge(textsLeft)
      // .attr("x", mouseX)
      .attr("y", (d, i) => mouseY + 10 * (i - 0.5 * selectedCirclesLeft.size()))
      .text(d => d.Name)
      .each(function (d) {
        const width = this.getBBox().width;
        d3.select(this)
          .attr("x", mouseX - 30 - (width / 2))
      });

    textsLeft.exit().remove();

    const textsRight = detailTextRight.selectAll("text")
      .data(selectedCirclesRight.data());

    textsRight.enter()
      .append("text")
      .merge(textsRight)
      // .attr("x", mouseX)
      .attr("y", (d, i) => mouseY + 10 * (i - 0.5 * selectedCirclesRight.size()))
      .text(d => d.Name)
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
      .data(selectedCirclesLeft.data().sort(d=>globalThis.y(d[globalThis.FIELD_Y])).map((d, i) => [
        {
          x: globalThis.x(d[globalThis.FIELD_X]),
          y: globalThis.y(d[globalThis.FIELD_Y])
        },
        {
          x: mouseX - 30,
          y: mouseY + 10 * (i - 0.5 * selectedCirclesLeft.size())
        }
      ]));

    linesLeft.enter()
      .append("path")
      .merge(linesLeft)
      // .attr("x", mouseX)
      .attr("d", d => {
        console.log(line(d));
        return line(d)});

    linesLeft.exit().remove();

    const linesRight = detailLineRight.selectAll("path")
    .data(selectedCirclesRight.data().sort(d=>globalThis.y(d[globalThis.FIELD_Y])).map((d, i) => [
      {
        x: globalThis.x(d[globalThis.FIELD_X]),
        y: globalThis.y(d[globalThis.FIELD_Y])
      },
      {
        x: mouseX + 30,
        y: mouseY + 10 * (i - 0.5 * selectedCirclesRight.size())
      }
    ]));

  linesRight.enter()
    .append("path")
    .merge(linesRight)
    // .attr("x", mouseX)
    .attr("d", d => {
      console.log(line(d));
      return line(d)});

  linesRight.exit().remove();
  });
