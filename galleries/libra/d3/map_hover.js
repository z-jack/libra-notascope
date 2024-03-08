// Load the county data and create the map
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json"),
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json")
]).then(([counties, states]) => {
  const width = 960;
  const height = 600;

  const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const path = d3.geoPath();

  const map = svg.append("g");

  map.append("g")
    .selectAll("path")
    .data(topojson.feature(states, states.objects.states).features)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("d", path);

  const county = map.append("g")
    .selectAll("path")
    .data(topojson.feature(counties, counties.objects.counties).features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip);

  const tooltip = d3.select("#tooltip");

  function showTooltip(event, d) {
    d3.select(this).classed("hovered", true);
    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`)
      .html(`<b>${d.properties.NAME}, ${d.properties.STATE_NAME}</b>`);
  }

  function hideTooltip() {
    d3.selectAll(".county").classed("hovered", false);
    tooltip.html("");
  }
});