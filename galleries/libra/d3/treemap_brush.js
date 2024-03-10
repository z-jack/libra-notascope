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
  nodes.append("rect")
    .attr("id", d => "node-" + d.data.id)
    .attr("class", "node")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .style("fill", d => d.children ? null : d.parent.data.color);

  // Add brush
  const brush = d3.brush()
    .on("start brush end", brushed);

  svg.call(brush);

  function brushed(event) {
    const selection = event.selection;
    nodes.select("rect")
      .classed("selected", d => selection && d.x0 >= selection[0][0] && d.x1 <= selection[1][0] && d.y0 >= selection[0][1] && d.y1 <= selection[1][1]);
  }
});