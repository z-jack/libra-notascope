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

  // Create the semantic zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

  function zoomed({transform, source}) {
    // If the event source is not the zoom behavior, reset the zoom transform
    if (!source) {
      zoom.transform(svg, d3.zoomIdentity);
      return;
    }

    // Otherwise, apply the zoom transform
    cell.attr("transform", transform);
  }

  // Apply the semantic zoom behavior to the SVG container
  svg.call(zoom)
    .on("dblclick.zoom", null); // Disable double-click to zoom

  // Handle single clicks to zoom into the clicked cell
  cell.on("click", clicked);

  function clicked(event, d) {
    const [x0, y0, x1, y1] = [d.x0, d.y0, d.x1, d.y1];
    const scale = Math.min(width / (x1 - x0), height / (y1 - y0)) * 0.9;
    const translate = [(width - scale * (x1 + x0)) / 2, (height - scale * (y1 + y0)) / 2];

    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }
});