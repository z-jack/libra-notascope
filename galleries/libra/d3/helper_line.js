// Create a helper line function
function helperLine(selection) {
  const line = selection.selectAll("path.helper-line")
    .data([null])
    .join("path")
    .attr("class", "helper-line");

  function updateLine(event) {
    const [xm, ym] = d3.pointer(event);
    line.attr("d", `M${xm},${ym} L${xm},0 L0,${ym}`);
  }

  selection.on("mousemove", updateLine)
    .on("mouseleave", () => line.attr("d", null));

  updateLine({ target: selection.node() });
}

// Create a simple chart with a helper line
const width = 600;
const height = 400;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const chartArea = svg.append("g")
  .attr("transform", `translate(50, 50)`);

chartArea.append("rect")
  .attr("width", width - 100)
  .attr("height", height - 100)
  .attr("fill", "none")
  .attr("stroke", "black");

// Call the helper line function on the chart area
chartArea.call(helperLine);