// Setup SVG and margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Setup scales and axes
var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x),
    yAxis = d3.axisLeft(y).ticks(10);

// Define hover functions
function handleMouseOver(d, i) {
  // Highlight the bar
  d3.select(this)
    .attr('opacity', 0.7);
  
  // Optionally, display additional information about the bar
  // For example, display a tooltip or update an info panel
  // This is a placeholder to customize
  console.log("Hovered on bar with data: ", d);
}

function handleMouseOut(d, i) {
  // Remove highlight from the bar
  d3.select(this)
    .attr('opacity', 1);

  // Optionally, hide the additional information displayed during hover
}

// Load data and create the bar chart
d3.csv("data.csv", type, function(error, data) {
  if (error) throw error;

  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Value");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.name); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);
});

function type(d) {
  d.value = +d.value; // coerce to number
  return d;
}
