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
    .on("click", clicked);

  let selectedCounty = null;

  function clicked(event, d) {
    if (selectedCounty) selectedCounty.classed("selected", false);
    selectedCounty = d3.select(this).classed("selected", true);
  }
});