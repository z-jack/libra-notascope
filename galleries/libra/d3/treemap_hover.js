// Load the data
d3.json("https://cdn.jsdelivr.net/npm/vega-datasets@2/data/flare.json").then(function(data) {
  // Define dimensions
  const width = 960;
  const height = 600;

  // Create a treemap layout
  const treemap = d3.treemap()
    .size([width, height])
    .paddingInner(1);

  // Create the root node
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  // Calculate the treemap layout
  treemap(root);

  // Create the SVG container
  const svg = d3.select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font", "10px sans-serif");

  // Add a group for the treemap nodes
  const nodes = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Add rectangles for each node
  const rects = nodes.append("rect")
    .attr("id", d => "node-" + d.data.id)
    .attr("class", "node")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .style("fill", d => d.children ? null : d.parent.data.color)
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip);

  const tooltip = d3.select("#tooltip");

  function showTooltip(event, d) {
    d3.select(this).classed("hovered", true);
    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`)
      .html(`<b>${d.data.name}</b><br>Value: ${d.value}`);
  }

  function hideTooltip() {
    d3.selectAll(".node").classed("hovered", false);
    tooltip.html("");
  }
});