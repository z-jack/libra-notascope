// Static Visualization

// global constants
globalThis.MARGIN = { top: 30, right: 70, bottom: 40, left: 60 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 380 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;
globalThis.FIELD_X = "Horsepower";
globalThis.FIELD_Y = "Miles_per_Gallon";
globalThis.FIELD_COLOR = "Origin";

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.color = null;

async function loadData() {
 globalThis.data = (await d3.json("./data/cars.json")).filter(
   (d) => !!(d["Horsepower"] && d["Miles_per_Gallon"])
 );
}

function renderStaticVisualization() {
 // append the svg object to the body of the page
 const svg = d3
   .select("#LibraPlayground")
   .append("svg")
   .attr(
     "width",
     globalThis.WIDTH + globalThis.MARGIN.left + globalThis.MARGIN.right
   )
   .attr(
     "height",
     globalThis.HEIGHT + globalThis.MARGIN.top + globalThis.MARGIN.bottom
   )
   .attr("viewbox", `0 0 ${globalThis.WIDTH} ${globalThis.HEIGHT}`)
   .append("g")
   .attr(
     "transform",
     "translate(" + globalThis.MARGIN.left + "," + globalThis.MARGIN.top + ")"
   );

 const extentX = [0, d3.max(globalThis.data, (d) => d[globalThis.FIELD_X])];
 const extentY = [0, d3.max(globalThis.data, (d) => d[globalThis.FIELD_Y])];

 // Add X axis
 globalThis.x = d3
   .scaleLinear()
   .domain(extentX)
   .range([0, globalThis.WIDTH])
   .nice()
   .clamp(true);
 svg
   .append("g")
   .attr("transform", "translate(0," + globalThis.HEIGHT + ")")
   .call(d3.axisBottom(globalThis.x))
   .append("text")
   .text(globalThis.FIELD_X)
   .attr("fill", "black")
   .attr("text-anchor", "middle")
   .attr("font-size", "12px")
   .attr("font-weight", "bold")
   .attr("x", globalThis.WIDTH / 2)
   .attr("y", 30);

 // Add Y axis
 globalThis.y = d3
   .scaleLinear()
   .domain(extentY)
   .nice()
   .range([globalThis.HEIGHT, 0])
   .clamp(true);
 svg
   .append("g")
   .call(d3.axisLeft(globalThis.y))
   .append("text")
   .text(globalThis.FIELD_Y)
   .attr("fill", "black")
   .attr("text-anchor", "middle")
   .attr("font-size", "12px")
   .attr("font-weight", "bold")
   .attr("writing-mode", "tb")
   .style(
     "transform",
     `translate(${-globalThis.MARGIN.left / 2}px,${
       globalThis.HEIGHT / 2
     }px) rotate(180deg)`
   );

 // Add Legend
 globalThis.color = d3
   .scaleOrdinal()
   .domain(
     new Set(globalThis.data.map((d) => d[globalThis.FIELD_COLOR])).values()
   )
   .range(d3.schemeTableau10);
 svg
   .append("g")
   .call((g) =>
     g
       .append("text")
       .text(globalThis.FIELD_COLOR)
       .attr("fill", "black")
       .attr("text-anchor", "middle")
       .attr("font-size", "12px")
       .attr("font-weight", "bold")
       .attr("x", globalThis.WIDTH + globalThis.MARGIN.right / 2)
       .attr("y", -globalThis.MARGIN.top / 2)
   )
   .call((g) =>
     g
       .append("g")
       .selectAll("g")
       .data(
         new Set(
           globalThis.data.map((d) => d[globalThis.FIELD_COLOR])
         ).values()
       )
       .join("g")
       .call((g) => {
         g.append("circle")
           .attr("fill-opacity", "0")
           .attr("stroke-width", 2)
           .attr("stroke", (d) => globalThis.color(d))
           .attr("cx", globalThis.WIDTH + 10)
           .attr("cy", (_, i) => i * 20)
           .attr("r", 5);
       })
       .call((g) => {
         g.append("text")
           .text((d) => d)
           .attr("font-size", "12px")
           .attr("x", globalThis.WIDTH + 20)
           .attr("y", (_, i) => i * 20 + 5);
       })
   );
}

// Interaction

// import static visualization and global variables
const VIS = require("./staticVisualization");
// register excentricLabelingInstrument
require("./excentricLabelingInstrument");

async function main() {
 await VIS.loadData();
 VIS.renderStaticVisualization();
 const mainLayer = renderMainVisualization();
 mountInteraction(mainLayer);
}

function renderMainVisualization() {
 // Find the SVG element on page
 const svg = d3.select("#LibraPlayground svg");

 // Create the main layer
 const mainLayer = svg
   .append("g")
   .attr("class", "mainLayer")
   .attr(
     "transform",
     `translate(${globalThis.MARGIN.left}, ${globalThis.MARGIN.top})`
   );

 // Draw points code from the input static visualization
 mainLayer
   .selectAll("circle")
   .data(globalThis.data)
   .join("circle")
   .attr("class", "mark")
   .attr("fill", "none")
   .attr("stroke-width", 1)
   .attr("stroke", (d) => globalThis.color(d[globalThis.FIELD_COLOR]))
   .attr("cx", (d) => globalThis.x(d[globalThis.FIELD_X]))
   .attr("cy", (d) => globalThis.y(d[globalThis.FIELD_Y]))
   .attr("r", 5);

 return mainLayer;
}

function mountInteraction(layer) {
 const excentricLabelingInstrument = new ExcentricLabelingInstrument(layer.node(), {
   labelAccessor: (circleElem) => d3.select(circleElem).datum()["Name"],
   colorAccessor: (circleElem) =>
     globalThis.color(d3.select(circleElem).datum()[globalThis.FIELD_COLOR]),
 });
 excentricLabelingInstrument.mount();
}

class ExcentricLabelingInstrument {
 constructor(container, options) {
   this.container = container;
   this.options = {
     r: 20,
     stroke: "green",
     strokeWidth: 2,
     countLabelDistance: 20,
     fontSize: 12,
     countLabelWidth: 40,
     maxLabelsNum: 10,
     ...options,
   };
   this.svg = d3.select(container).select("svg");
   this.labelLayer = this.svg.append("g").attr("class", "labelLayer");
   this.lensLayer = this.svg.append("g").attr("class", "lensLayer");
   this.circleSelection = d3.selectAll(".mark");
 }

 mount() {
   this.circleSelection
     .on("mouseover", this.handleMouseOver.bind(this))
     .on("mouseout", this.handleMouseOut.bind(this));
 }

 handleMouseOver(event, d) {
   const [layerX, layerY] = d3.pointer(event, this.container);
   const circles = this.circleSelection.nodes();
   const rawInfos = this.getRawInfos(circles);
   const result = this.computeExcentricLabeling(rawInfos, layerX, layerY);
   this.renderExcentricLabeling(result);
   this.renderLens(layerX, layerY, circles.length);
 }

 handleMouseOut() {
   this.labelLayer.selectAll("*").remove();
   this.lensLayer.selectAll("*").remove();
 }

 getRawInfos(objs) {
   const rootBBox = this.svg.node().getBoundingClientRect();
   const layerBBox = this.container.getBoundingClientRect();

   return objs.map((obj) => {
     const bbox = obj.getBoundingClientRect();
     const x = bbox.x + bbox.width / 2 - rootBBox.x - layerBBox.left;
     const y = bbox.y + bbox.height / 2 - rootBBox.y - layerBBox.top;
     const labelName = this.options.labelAccessor(obj);
     const color = this.options.colorAccessor(obj);
     return {
       x,
       y,
       labelWidth: 0,
       labelHeight: 0,
       color,
       labelName,
     };
   });
 }

 computeSizeOfLabels(rawInfos) {
   const tempGroup = this.labelLayer.append("g").attr("opacity", 0);
   rawInfos.forEach((rawInfo) => {
     const text = tempGroup
       .append("text")
       .text(rawInfo.labelName)
       .node();
     const labelBBox = text.getBBox();
     rawInfo.labelWidth = labelBBox.width;
     rawInfo.labelHeight = labelBBox.height;
   });
   tempGroup.remove();
 }

 computeExcentricLabeling(rawInfos, layerX, layerY) {
   this.computeSizeOfLabels(rawInfos);
   const compute = excentricLabeling()
     .radius(this.options.r)
     .horizontallyCoherent(true)
     .maxLabelsNum(this.options.maxLabelsNum);
   return compute(rawInfos, layerX, layerY);
 }

 renderExcentricLabeling(result) {
   this.labelLayer.selectAll("*").remove();

   const lineGroup = this.labelLayer.append("g").attr("class", "excentricLabelingLine");
   const lineGenerator = d3.line().x((d) => d.x).y((d) => d.y);
   lineGroup
     .selectAll("path")
     .data(result)
     .join("path")
     .attr("fill", "none")
     .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
     .attr("d", (layoutInfo) => lineGenerator(layoutInfo.controlPoints));

   const bboxGroup = this.labelLayer.append("g").attr("class", "excentricLabelingBBox");
   bboxGroup
     .selectAll("rect")
     .data(result)
     .join("rect")
     .attr("class", "labelBBox")
     .attr("fill", "none")
     .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
     .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
     .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
     .attr("width", (layoutInfo) => layoutInfo.labelBBox.width)
     .attr("height", (layoutInfo) => layoutInfo.labelBBox.height);

   const textGroup = this.labelLayer.append("g").attr("class", "excentricLabelingText");
   textGroup
     .selectAll("text")
     .data(result)
     .join("text")
     .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
     .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
     .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
     .attr("dominant-baseline", "hanging")
     .text((layoutInfo) => layoutInfo.rawInfo.labelName);
 }

 renderLens(x, y, count) {
   this.lensLayer.selectAll("*").remove();

   const group = this.lensLayer
     .append("g")
     .attr("transform", `translate(${x}, ${y})`);

   group
     .append("circle")
     .attr("class", "lensCircle")
     .attr("cx", 0)
     .attr("r", this.options.r)
     .attr("fill", "none")
     .attr("stroke", this.options.stroke)
     .attr("stroke-width", this.options.strokeWidth);

   const countLabel = group
     .append("text")
     .attr("y", -(this.options.countLabelDistance + this.options.r))
     .attr("font-size", this.options.fontSize)
     .attr("text-anchor", "middle")
     .attr("fill", this.options.stroke)
     .text(count);

   const countLabelBBox = countLabel.node().getBBox();
   group
     .append("rect")
     .attr("class", "lensLabelBorder")
     .attr("stroke", this.options.stroke)
     .attr("stroke-width", this.options.strokeWidth)
     .attr("fill", "none")
     .attr("x", -this.options.countLabelWidth / 2)
     .attr("y", countLabelBBox.y)
     .attr("width", this.options.countLabelWidth)
     .attr("height", countLabelBBox.height);

   group
     .append("line")
     .attr("stroke", this.options.stroke)
     .attr("stroke-width", this.options.strokeWidth)
     .attr("y1", -this.options.r)
     .attr("y2", countLabelBBox.y + countLabelBBox.height);
 }
}

main();