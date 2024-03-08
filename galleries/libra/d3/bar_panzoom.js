// Set up SVG and margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Create SVG element
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set up scales
var xScale = d3.scaleBand().range([0, width]).padding(0.1),
    yScale = d3.scaleLinear().range([height, 0]);

// Define the axes
var xAxis = d3.axisBottom(xScale),
    yAxis = d3.axisLeft(yScale).ticks(10);

// Set up the zoom behavior
var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", zoomed);

// Apply the zoom behavior to the SVG
svg.call(zoom);

// Load data and create the bar chart
d3.csv("data.csv").then(function(data) {
    // Process data and update scales
    xScale.domain(data.map(function(d) { return d.name; }));
    yScale.domain([0, d3.max(data, function(d) { return +d.value; })]);

    // Draw the bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d.name); })
        .attr("width", xScale.bandwidth())
        .attr("y", function(d) { return yScale(+d.value); })
        .attr("height", function(d) { return height - yScale(+d.value); });

    // Draw the axes
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
});

// The zoom function
function zoomed() {
    // Create new scale ojects based on event
    var new_xScale = d3.event.transform.rescaleX(xScale);
    var new_yScale = d3.event.transform.rescaleY(yScale);

    // Update axes
    svg.select(".x.axis").call(xAxis.scale(new_xScale));
    svg.select(".y.axis").call(yAxis.scale(new_yScale));

    // Update bars
    svg.selectAll(".bar")
        .attr("x", function(d) { return new_xScale(d.name); })
        .attr("width", new_xScale.bandwidth())
        .attr("y", function(d) { return new_yScale(+d.value); })
        .attr("height", function(d) { return height - new_yScale(+d.value); });
}
