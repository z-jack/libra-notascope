// Load the data
d3.json("https://cdn.jsdelivr.net/npm/vega-datasets@2/data/movies.json").then(function(data) {
  // Define dimensions and margins
  const width = 600;
  const height = 500;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  // Create scales
  const x = d3.scaleLinear().range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

  // Create SVG and main group
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  // Define domain ranges
  x.domain(d3.extent(data, d => d.Rotten_Tomatoes_Rating));
  y.domain(d3.extent(data, d => d.IMDB_Rating));

  // Add x-axis
  g.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(10));

  // Add y-axis
  g.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(10));

  // Add dots
  const dots = g.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 5)
    .attr("cx", d => x(d.Rotten_Tomatoes_Rating))
    .attr("cy", d => y(d.IMDB_Rating))
    .on("click", clicked);

  let selectedDot = null;

  function clicked(event, d) {
    if (selectedDot) selectedDot.classed("selected", false);
    selectedDot = d3.select(this).classed("selected", true);
  }
});