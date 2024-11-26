
  // Add brush
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("start brush end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

/**
 * 判断线段是否与矩形相交
 * @param {number} x1 线段起点x坐标
 * @param {number} y1 线段起点y坐标
 * @param {number} x2 线段终点x坐标
 * @param {number} y2 线段终点y坐标
 * @param {number} rx1 矩形左上角x坐标
 * @param {number} ry1 矩形左上角y坐标
 * @param {number} rx2 矩形右下角x坐标
 * @param {number} ry2 矩形右下角y坐标
 * @returns {boolean} 线段与矩形是否相交
 */
function isLineIntersectRect(x1, y1, x2, y2, rx1, ry1, rx2, ry2) {
  // 计算矩形的宽度和高度
  const rw = rx2 - rx1;
  const rh = ry2 - ry1;

  // 判断线段的两个端点是否都在矩形外部
  if (
    (x1 < rx1 && x2 < rx1) ||
    (x1 > rx2 && x2 > rx2) ||
    (y1 < ry1 && y2 < ry1) ||
    (y1 > ry2 && y2 > ry2)
  ) {
    return false;
  }

  // 判断矩形的四个顶点是否都在线段同一侧
  const d1 = direction(x1, y1, x2, y2, rx1, ry1);
  const d2 = direction(x1, y1, x2, y2, rx2, ry1);
  const d3 = direction(x1, y1, x2, y2, rx2, ry2);
  const d4 = direction(x1, y1, x2, y2, rx1, ry2);

  if ((d1 > 0 && d2 > 0 && d3 > 0 && d4 > 0) || (d1 < 0 && d2 < 0 && d3 < 0 && d4 < 0)) {
    return false;
  }

  return true;
}

/**
 * 计算点Q到线段P1P2的有向距离
 * @param {number} x1 线段起点x坐标
 * @param {number} y1 线段起点y坐标
 * @param {number} x2 线段终点x坐标
 * @param {number} y2 线段终点y坐标
 * @param {number} x 点Q的x坐标
 * @param {number} y 点Q的y坐标
 * @returns {number} 点Q到线段P1P2的有向距离
 */
function direction(x1, y1, x2, y2, x, y) {
  return (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
}


  function polylineIntersectsRect(polyline, rectX1, rectY1, rectX2, rectY2) {
    for (let i = 0; i < polyline.length - 1; i++) {
      const x1 = x(polyline[i].x);
      const y1 = y(polyline[i].y);
      const x2 = x(polyline[i + 1].x);
      const y2 = y(polyline[i + 1].y);


      if (isLineIntersectRect(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY2)) {
        return true;
      }
    }

    return false;
  }

  let selectedLines = [];

  function brushed(event) {
    const selection = event.selection;
    selectedLines = [];

    if (selection) {
      path.classed("selected", function (d) {
        console.log(d, selection);
        const isSelected = polylineIntersectsRect(d, selection[0][0], selection[0][1], selection[1][0], selection[1][1]);
        if (isSelected) {
          d3.select(this)
            .attr("stroke", "red")
            .attr("opacity", 1);
        } else {
          d3.select(this).attr("stroke", "steelblue")
            .attr("opacity", 0.7);
        }
        return isSelected;
      });
    } else {
      path.attr("stroke", "steelblue")
        .attr("opacity", 0.7);
    }

    // Output selected points to console
    // console.log("Selected points:", selectedLines);
  }