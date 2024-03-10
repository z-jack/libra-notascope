d3.json('flare.json').then(data => {
  // Specify the chart's dimensions
  const width = 954;
  const height = 600;

  // Create the treemap layout
  const treemap = d3.treemap()
    .size([width, height])
    .padding(1)
    .round(true);

  // Compute the treemap layout
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  // Create the treemap using the computed layout
  treemap(root);

  // Create the SVG container
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("font", "10px sans-serif");

  // Create the treemap cells
  const cell = svg.selectAll("rect")
    .data(root.leaves())
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => `hsl(${Math.random() * 360}, 70%, 80%)`); // Placeholder color

  // Create the text labels
  cell.append("title")
    .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${d.value}`);

  // Create the zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

  // Apply the zoom behavior to the SVG container
  svg.call(zoom);

  function zoomed({transform}) {
    cell.attr("transform", transform);
  }
});