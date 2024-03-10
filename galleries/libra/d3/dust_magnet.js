// global constants
const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
const WIDTH = 800 - MARGIN.left - MARGIN.right;
const HEIGHT = 600 - MARGIN.top - MARGIN.bottom;

// global variables
let data = [];
let magnet = [];
let properties = [];
let svg;

async function loadData() {
 data = await d3.json("./data/cars.json");

 const datum = data[0];
 for (const property in datum) {
   const value = datum[property];
   if (typeof value === "number") {
     properties.push(property);
     // initialize 3 magnets
     if (magnet.length < 3) {
       magnet.push({
         x:
           WIDTH / 2 -
           Math.pow(-1, magnet.length) * (WIDTH / 2 - 100),
         y:
           HEIGHT / 2 -
           Math.pow(-1, Math.floor(magnet.length / 2)) * (HEIGHT / 2 - 100),
         property,
       });
     }
   }
 }

 data = data.slice(0, 50).map((d) => ({
   ...d,
   x: WIDTH / 2,
   y: HEIGHT / 2,
 }));
}

function renderStaticVisualization() {
 // append the svg object to the body of the page
 svg = d3
   .select("#LibraPlayground")
   .append("svg")
   .attr("width", WIDTH + MARGIN.left + MARGIN.right)
   .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)
   .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
   .append("g")
   .attr(
     "transform",
     "translate(" + MARGIN.left + "," + MARGIN.top + ")"
   );
}

function renderDust() {
 svg
   .selectAll("circle")
   .data(data)
   .join("circle")
   .attr("cx", (d) => d.x)
   .attr("cy", (d) => d.y)
   .attr("stroke", "#000")
   .attr("fill", "#B9B9B9")
   .attr("r", 10);
}

function renderMagnet() {
 const magnets = svg.selectAll("g").data(magnet);

 const magnetsEnter = magnets
   .enter()
   .append("g")
   .call((g) =>
     g
       .append("rect")
       .attr("width", 50)
       .attr("height", 50)
       .attr("fill", "orange")
   )
   .call((g) =>
     g
       .append("text")
       .attr("text-anchor", "middle")
       .text((d) => d.property)
   );

 magnets
   .merge(magnetsEnter)
   .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
   .select("text")
   .attr("x", 25)
   .attr("y", 35);

 magnets.exit().remove();
}

function mountInteraction() {
 const drag = d3
   .drag()
   .on("start", () => {
     d3.select(this).raise();
   })
   .on("drag", (event, d) => {
     d.x += event.dx;
     d.y += event.dy;
     renderMagnet();
     updateDustPositions();
   });

 svg.select(".dust").on("click", () => {
   const [x, y] = d3.mouse(this);
   magnet.push({
     x: x - 25,
     y: y - 25,
     property: properties[magnet.length % properties.length],
   });
   renderMagnet();
   updateDustPositions();
 });

 svg.select(".magnet").selectAll("g").call(drag);

 function updateDustPositions() {
   for (const magnet of magnet) {
     const extent = d3.extent(data.map((datum) => datum[magnet.property]));
     for (const dust of data) {
       let x = dust.x;
       let y = dust.y;
       let dx = magnet.x;
       let dy = magnet.y;
       x += ((dx - x) * dust[magnet.property]) / 100 / extent[1];
       y += ((dy - y) * dust[magnet.property]) / 100 / extent[1];

       dust.x = x;
       dust.y = y;
     }
   }
   renderDust();
 }
}

async function main() {
 await loadData();
 renderStaticVisualization();
 renderDust();
 renderMagnet();
 mountInteraction();
}

main();