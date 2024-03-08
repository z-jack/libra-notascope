d3.json("./data/test100.json").then(function (data) {

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 260 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;


  // Create SVG element
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  // .append("g")
  // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.x)])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.y)])
    .range([height, 0]);

  // Add x-axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  // Add y-axis
  svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale));
  // Create circles for the scatter plot
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", 5)
    .attr("fill", "steelblue");

  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      svg.selectAll("circle")
        .attr("transform", transform);
    });

  // Apply zoom behavior to the SVG container
  svg.call(zoom);
});