/** This file creates and coordinates a scatterplot and a slider according to the provided dataset
 * */

//Add a main svg which all visualization elements will be appended to
d3.select("#scatter").append("svg").attr("id", "mainSvg").on("click", function () {
  scatterplot.clearHintPath();
  scatterplot.clearPointLabels();
});
var screenWidth = window.innerWidth - 50;
var screenHeight = window.innerHeight - 50;
window.onload = function () {
  d3.select("#mainSvg").attr("width", screenWidth).attr("height", screenHeight);
  d3.select("#hintPathFormDiv").style("margin-left", (screenWidth * 0.6 + 90) + "px");
}

d3.select("#hintPathForm").selectAll("input").on("change", function change() {
  scatterplot.hintPathType = this.value;
});

//Create a new scatterplot visualization
var scatterplot = new Scatterplot(screenWidth * 0.6, screenHeight * 0.6, 50);

scatterplot.init();
//setHintPathType(scatterplot,1);

//Define the click interaction of the hint labels to invoke fast switching among views
scatterplot.clickHintLabelFunction = function (d) {
  d3.event.stopPropagation(); //Prevents the event from propagating down to the SVG
  scatterplot.animatePoints(scatterplot.draggedPoint, scatterplot.currentView, d.id);
  changeView(scatterplot, d.id);
  slider.updateSlider(d.id);
};

scatterplot.render(dataset, labels, xLabel, yLabel, title); //Draw the scatterplot, dataset is an array created in a separate js file containing the json data,
// and labels is an array representing the different views of the dataset

//Define the dragging interaction of the scatterplot points, which will continuously update the scatterplot
var dragPoint = d3.behavior.drag()
  .origin(function (d) { //Set the starting point of the drag interaction
    return { x: d.nodes[scatterplot.currentView][0], y: d.nodes[scatterplot.currentView][1] };
  }).on("dragstart", function (d) {
    scatterplot.clearHintPath();
    scatterplot.draggedPoint = d.id;
    scatterplot.previousDragAngle = 0; //To be safe, re-set this
    scatterplot.selectPoint(d);
  }).on("drag", function (d) {
    if (scatterplot.hintPathType != 1) {
      slider.animateTick(scatterplot.interpValue, scatterplot.currentView, scatterplot.nextView);
    }
    scatterplot.updateDraggedPoint(d.id, d3.event.x, d3.event.y, d.nodes);
  }).on("dragend", function (d) { //In this event, mouse coordinates are undefined, need to use the saved
    //coordinates of the scatterplot object
    scatterplot.snapToView(d.id, d.nodes);
    slider.updateSlider(scatterplot.currentView);
  });

//Apply the dragging function to all points of the scatterplot, making them all draggable
scatterplot.svg.selectAll(".displayPoints").call(dragPoint);

//Create a new slider widget as an alternative for switching views of the scatterplot visualization
var sliderSpacing = scatterplot.width / labels.length;
var slider = new Slider(35, screenHeight * 0.8, labels, "", "#666", sliderSpacing);
slider.init();
slider.render();

//Define the dragging interaction of the slider which will update the view of the scatterplot
slider.dragEvent = d3.behavior.drag()
  .on("dragstart", function () {
    scatterplot.clearHintPath();
  })
  .on("drag", function () {
    slider.updateDraggedSlider(d3.event.x);
    scatterplot.interpolatePoints(-1, slider.interpValue, slider.currentTick, slider.nextTick);
  })
  .on("dragend", function () {
    slider.snapToTick();
    changeView(scatterplot, slider.currentTick);
    scatterplot.redrawView(slider.currentTick);
  });

//Apply the dragging event to the slider's movable tick
slider.widget.select("#slidingTick").call(slider.dragEvent);

/** Constructor for a slider widget
 * x: the left margin
 * y: the right margin
 * id: id of the div tag to append the svg container
 * labels: an array of labels corresponding to a tick along the slider
 * description: a title for the slider
 * colour: the colour of the slider
 * spacing: spacing between ticks (in pixels)
 */
//TODO: Get rid of magic numbers and find a way to automatically compute them (e.g., positioning of slider and title relative to width)
function Slider(x, y, labels, description, colour, spacing) {
  // Save the position, size and display properties
  this.xpos = x;
  this.ypos = y;
  this.mouseX = -1;
  this.numTicks = labels.length;
  this.title = description;
  this.tickLabels = labels;
  this.displayColour = colour;
  this.tickSpacing = spacing;
  this.sliderOffset = x + (description.length * 20); //Font size of title is 20px
  this.width = this.sliderOffset + this.numTicks * this.tickSpacing;
  this.height = 50;
  this.tickYPos = 35; //Amount to translate the draggable tick by in the y coordinate
  this.anchorYPos = 12; //Amount to translate the anchor which follows the draggable tick when it is not placed on the main slider
  this.sliderHeight = 10; //Thickness of the main slider line

  this.currentTick = 0; //Start the slider always at the first tick
  this.nextTick = 1;  //The next tick is after the current one
  this.interpValue = 0; //Amount of distance travelled between ticks, used to interpolate other visualizations
  this.widget = null;  // Reference to the main widget
  this.sliderPos = this.sliderOffset; //The starting horizontal position of the slider tick (at the first tick)
  this.timeDirection = 1 //Direction travelling along time line (1 if forward, -1 if backwards)

  //Generate an array of x locations for each tick
  this.tickPositions = []; //All x locations of the ticks on the slider
  for (var i = 0; i < this.numTicks; i++) {
    if (i == 0) {
      this.tickPositions[i] = this.sliderOffset;
    } else {
      this.tickPositions[i] = this.tickPositions[i - 1] + this.tickSpacing;
    }
  }
}
/** Append a blank svg and g container to the div tag indicated by "id", this is where the widget
*  will be drawn.
* */
Slider.prototype.init = function () {
  this.widget = d3.select("#mainSvg").append("g").attr("id", "gSlider")
    .attr("width", this.width).attr("height", this.height)
    .attr("transform", "translate(" + this.xpos + "," + this.ypos + ")");
}
/** Render the widget onto the svg
*  Note: no data set is required because it was automatically generated in the constructor
* */
Slider.prototype.render = function () {
  var ref = this;

  //Add the title beside the slider
  this.widget.append("text").text(this.title).attr("class", "slider")
    .attr("x", 0).attr("y", 20).attr("fill", this.displayColour)
    .style("font-family", "sans-serif").style("font-size", "20px");

  //Prepare the data for drawing the slider ticks
  this.widget.selectAll("rect")
    .data(this.tickPositions.map(function (d, i) { return { id: i, value: d, label: ref.tickLabels[i] }; }))
    .enter().append("g").attr("class", "slider");

  //Draw the ticks
  this.widget.selectAll("g").append("svg:rect")
    .attr("x", function (d) { return d.value; })
    //.attr("y", function (d,i){return ((i==0)||(i==ref.numTicks-1))?(10-ref.sliderHeight/2):10})
    .attr("y", function (d, i) { return (10 - ref.sliderHeight / 2) })
    .attr("width", 2)//.attr("height", function (d,i){return ((i==0)||(i==ref.numTicks-1))?(12+ref.sliderHeight):12})
    .attr("height", function (d, i) { return (12 + ref.sliderHeight) })
    .style("fill", ref.displayColour)
    .attr("class", "ticks");

  //Draw the labels for each tick
  this.widget.selectAll("g").append("svg:text")
    .text(function (d) { return d.label; })
    .attr("x", function (d) { return d.value }).attr("y", 0)
    .style("font-family", "sans-serif").style("font-size", "14px")
    .style("fill", function (d, i) {
      if (ref.tickLabels.length > 25) { //Only display every 5 labels to reduce clutter
        if (i % 5 == 0) return ref.displayColour;
        else return "none";
      }
      return ref.displayColour;
    })
    .attr("text-anchor", "middle").attr("class", "tickLabels");

  //Draw a long line through all ticks
  this.widget.append("rect").attr("class", "slider")
    .attr("x", ref.sliderOffset).attr("y", 10)
    .attr("width", ref.tickPositions[ref.numTicks - 1] - ref.sliderOffset)
    .attr("height", ref.sliderHeight)
    .attr("fill", ref.displayColour);

  //Draw the draggable slider tick
  /**this.widget.append("rect")
      .attr("transform", function(d) { return "translate(" +ref.sliderPos + "," + ref.tickYPos + ")"; })
    .attr("rx",4).attr("ry",4) //For curved edges on the rectangle
    .attr("width", 10).attr("height", 20)
    .attr("stroke", "white").attr("fill", ref.displayColour)
    .style("cursor", "pointer").attr("id","slidingTick");*/

  //Draw a triangle draggable tick
  this.widget.append("path").attr("d", d3.svg.symbol().type("triangle-up").size(180))
    .attr("transform", "translate(" + ref.sliderPos + "," + ref.tickYPos + ")")
    .attr("fill", ref.displayColour).style("stroke", "white")
    .style("cursor", "pointer").attr("id", "slidingTick").attr("class", "slider");
  //Draw an anchor to attach the triangle with the main slider bar
  this.widget.append("rect").attr("transform", "translate(" + (ref.sliderPos + 1) + "," + ref.anchorYPos + ")")
    .attr("stroke", "none").style("fill", "#bdbdbd").attr("width", 1).attr("height", (ref.sliderHeight - 4))
    .style("cursor", "pointer").attr("id", "anchor").attr("class", "slider");
}
/** Re-draws the dragged tick by translating it according to the x-coordinate of the mouse
*  mouseX: The x-coordinate of the mouse, received from the drag event
* */
Slider.prototype.updateDraggedSlider = function (mouseX) {
  var ref = this;
  this.mouseX = mouseX; //Save the mouse position
  var translateX;

  var current = ref.tickPositions[ref.currentTick];
  var next = ref.tickPositions[ref.nextTick];
  if (ref.currentTick == 0) { //First tick
    if (mouseX <= current) {//Out of bounds: Passed first tick
      translateX = current;
    } else if (mouseX >= next) {
      ref.currentTick = ref.nextTick;
      ref.nextTick++;
      ref.interpValue = (ref.timeDirection == -1) ? 1 : 0;
      translateX = mouseX;
    } else {
      ref.setInterpolation(mouseX, current, next);
      translateX = mouseX;
    }
  } else if (ref.nextTick == (ref.numTicks - 1)) { //Last tick
    if (mouseX >= next) {  //Out of bounds: Passed last tick
      translateX = next;
    } else if (mouseX <= current) {
      ref.nextTick = ref.currentTick;
      ref.currentTick--;
      ref.interpValue = (ref.timeDirection == -1) ? 1 : 0;
      translateX = mouseX;
    } else {
      ref.setInterpolation(mouseX, current, next);
      translateX = mouseX;
    }
  } else { //A tick in between the end ticks
    if (mouseX <= current) { //Passed current
      ref.nextTick = ref.currentTick;
      ref.currentTick--;
      ref.interpValue = (ref.timeDirection == -1) ? 1 : 0;
    } else if (mouseX >= next) { //Passed next
      ref.currentTick = ref.nextTick;
      ref.nextTick++;
      ref.interpValue = (ref.timeDirection == -1) ? 1 : 0;
    } else {
      ref.setInterpolation(mouseX, current, next);
    }
    translateX = mouseX;
  }

  this.widget.select("#slidingTick").attr("transform", "translate(" + translateX + "," + ref.tickYPos + ")");
  this.widget.select("#anchor").attr("width", translateX - ref.sliderOffset);
  //this.widget.select("#anchor").attr("transform", "translate(" + translateX + "," + ref.anchorYPos + ")");
}
/** Determines how far the slider has travelled between two ticks (current and next) and sets
* the interpolation value accordingly (as percentage travelled)
* current,next: the tick indices
* mouseX: x-coordinate of mouse
* */
Slider.prototype.setInterpolation = function (mouseX, current, next) {
  var totalDistance = Math.abs(next - current);
  var distanceTravelled = Math.abs(mouseX - current);
  var newInterp = distanceTravelled / totalDistance;

  this.timeDirection = (newInterp > this.interpValue) ? 1 : (newInterp < this.interpValue) ? -1 : this.interpValue;
  this.interpValue = newInterp;
}
/** Updates the location of the draggable tick to the new view
* */
Slider.prototype.updateSlider = function (newView) {
  var ref = this;
  //Update the view tracker variables
  if (newView == ref.numTicks) {  //Last point of path
    ref.nextTick = newView;
    ref.currentTick = newView - 1;
  } else { //A point somewhere in the middle
    ref.currentTick = newView;
    ref.nextTick = newView + 1;
  }
  //Redraw the draggable tick at the new view
  this.widget.select("#slidingTick")
    //.attr("x",function (){return ref.tickPositions[newView];});
    .attr("transform", function () { return "translate(" + ref.tickPositions[newView] + "," + ref.tickYPos + ")"; });
  this.widget.select("#anchor").attr("width", this.tickPositions[newView] - this.sliderOffset);
}
/** Snaps the draggable tick to the nearest tick on the slider after the mouse is
*  released
* */
Slider.prototype.snapToTick = function () {
  var ref = this;
  this.widget.select("#slidingTick")
    //.attr("x",function (){
    .attr("transform", function () {
      var current = ref.tickPositions[ref.currentTick];
      var next = ref.tickPositions[ref.nextTick];
      var currentDist = Math.abs(current - ref.mouseX);
      var nextDist = Math.abs(next - ref.mouseX);
      if (currentDist > nextDist) {
        ref.currentTick = ref.nextTick;
        ref.nextTick++;
        ref.widget.select("#anchor").attr("width", next - ref.sliderOffset);
        return "translate(" + next + "," + ref.tickYPos + ")";
        //return (next-5);
      }
      ref.widget.select("#anchor").attr("width", current - ref.sliderOffset);
      return "translate(" + current + "," + ref.tickYPos + ")";
      //return (current-5);
    });

}
/** The tick is drawn according the to the provided interpolation amount,
*  and interpolation occurs between current and next view
*  Note: This function can be used to update the slider as another visualization
*  object is dragged (e.g., scatterplot point)
* */
Slider.prototype.animateTick = function (interpAmount, currentView, nextView) {
  var ref = this;
  if (interpAmount != 0) {
    this.widget.select("#slidingTick")
      .attr("transform", function () {
        var current = ref.tickPositions[currentView];
        var next = ref.tickPositions[nextView];
        var interpX = d3.interpolate(current, next)(interpAmount);
        ref.widget.select("#anchor").attr("width", interpX - ref.sliderOffset)
        return "translate(" + interpX + "," + ref.tickYPos + ")";
      });
  }
}

/** Constructor for a scatterplot visualization
 * w: width of the graph
 * h: height of the graph
 * p: a padding value, to format the axes
*/
function Scatterplot(w, h, p) {
  // Position and size attributes for drawing the svg
  this.padding = p;
  this.width = w;
  this.height = h;
  this.pointRadius = 8;
  this.loopRadius = 40;
  this.xLabel = "";
  this.yLabel = "";
  this.graphTitle = "";
  this.hintPathType = 0;

  this.loopCurrent = 0;
  this.loopNext = 1;

  // Create a variable to reference the main svg
  this.svg = null;
  this.numPoints = -1; //Set this later

  //Variables to track dragged point location within the hint path, all assigned values when the dataset is provided (in render())
  this.currentView = 0;
  this.nextView = 1;
  this.lastView = -1;  //The index of the last view of the dataset
  this.mouseX = -1; //Keep track of mouse coordinates for the dragend event
  this.mouseY = -1;
  this.interpValue = 0; //Stores the current interpolation value (percentage travelled) when a point is dragged between two views
  this.labels = []; //Stores the labels of the hint path
  this.ambiguousPoints = [];  //Keeps track of any points which are ambiguous when the hint path is rendered, by assigning the point a flag
  this.loops = []; //Stores points to draw for interaction loops (if any)
  this.timeDirection = 1; //Tracks the direction travelling over time

  //Save some angle values
  this.halfPi = Math.PI / 2;
  this.threePi_two = Math.PI * 3 / 2;
  this.twoPi = Math.PI * 2;
  this.pi = Math.PI;

  //Variables to track interaction events
  this.draggedPoint = -1;
  this.isAmbiguous = 0;  //Whether or not the point being dragged has at least one ambiguous case, set to 0 if none, and 1 otherwise

  //Event functions, declared later in this file or in the init file (if visualization is
  // interacting with another visualization) after the object has been instantiated
  this.placeholder = function () { };
  this.clickHintLabelFunction = this.placeholder;
  this.hintPathGenerator = d3.svg.line().interpolate("linear");

  this.clickedPoints = []; //Keeps track of which points to show labels for

  this.pointColour = "00A2E8";
  this.hintPathColour = "#aec7e8";

  this.hintPathPoints_flashlight = []; //For the flashlight hint path only, for keeping track of points currently visible on the hint path
}
/** Append a blank svg and g container to the div tag indicated by "id", this is where the visualization
*  will be drawn. Also, add a blur filter for the hint path effect.
* */
Scatterplot.prototype.init = function () {

  this.svg = d3.select("#mainSvg")
    .append("g").attr("id", "gScatterplot")
    .attr("transform", "translate(" + this.padding + "," + this.padding + ")");

  //Add the blur filter used for the hint path to the SVG so other elements can call it
  this.svg.append("svg:defs").append("svg:filter")
    .attr("id", "blur").append("svg:feGaussianBlur")
    .attr("stdDeviation", 2);

  //Add the blur filter for interaction loops
  this.svg.append("svg:defs").append("svg:filter")
    .attr("id", "blurLoop").append("svg:feGaussianBlur")
    .attr("stdDeviation", 1);

  //Add the blur filter for the partial hint path
  this.svg.append("svg:defs").append("svg:filter")
    .attr("id", "blur2").append("svg:feGaussianBlur")
    .attr("stdDeviation", 2);

  //Add the blur filter for the flashlight hint path
  this.svg.append("svg:defs").append("svg:filter")
    .attr("id", "blurFlashlight").append("svg:feGaussianBlur")
    .attr("stdDeviation", 2);
}
/** Render the visualization onto the svg
* data: The dataset to be visualized
* labels: A list of labels for the hint path, indicating all the different views of the visualization
*
* Data MUST be provided in the following array format:
* n is the number of views (or number of labels on the hint path)
* Object{"points":{[x,y],[x,y]...n},
*        "label":"name of data point" (optional)
*       }
*       ..... number of data points
* */
Scatterplot.prototype.render = function (data, labels, xLabel, yLabel, title) {
  var ref = this; //Reference variable
  //Save the parameters in global variables
  this.labels = labels;
  this.lastView = labels.length - 1;
  this.numPoints = data.length;
  this.xLabel = xLabel;
  this.yLabel = yLabel;
  this.graphTitle = title;

  //Find the max and min values of the points, used to scale the axes and the dataset
  var max_x = d3.max(data.map(function (d) { return d3.max(d.points.map(function (a) { return a[0]; })); }));
  var max_y = d3.max(data.map(function (d) { return d3.max(d.points.map(function (a) { return a[1]; })); }));
  var min_y = d3.min(data.map(function (d) { return d3.min(d.points.map(function (a) { return a[1]; })); }));

  //Create the scales by mapping the x,y to the svg size
  var xScale = d3.scale.linear().domain([0, max_x]).range([0, ref.width]);
  var yScale = d3.scale.linear().domain([min_y, max_y]).range([ref.height, 0]);
  //var yScale =  d3.scale.linear().domain([min_y, 50000000,max_y]).range([ref.height,ref.height/2,0]); //polylinear scale for the internet user dataset

  //Call the function which draws the axes
  this.drawAxes(xScale, yScale);

  // Set up the data for drawing the points according to the values in the data set
  this.svg.selectAll("circle")
    .data(data.map(function (d, i) {
      //Re-scale the points such that they are drawn within the svg container
      var scaledPoints = [];
      var interpolatedYears = [];
      for (var j = 0; j < d.points.length; j++) {
        //Check for missing data, interpolate based on surrounding points
        if (d.points[j][0] == "missing" || d.points[j][1] == "missing") {
          var newPoint = ref.interpolateMissingPoint(d.points, j);
          interpolatedYears.push(1);
          scaledPoints[j] = [xScale(newPoint.x) + ref.padding, yScale(newPoint.y)];
        } else {
          interpolatedYears.push(0);
          scaledPoints[j] = [xScale(d.points[j][0]) + ref.padding, yScale(d.points[j][1])];
        }
      }
      return { nodes: scaledPoints, id: i, label: d.label, interpYears: interpolatedYears };
    }))
    .enter().append("g")
    .attr("class", "gDisplayPoints").attr("id", function (d) { return "gDisplayPoints" + d.id });

  //Draw the data points
  this.svg.selectAll(".gDisplayPoints").append("svg:circle")
    .attr("cx", function (d) { return d.nodes[ref.currentView][0]; })
    .attr("cy", function (d) { return d.nodes[ref.currentView][1]; })
    .attr("r", this.pointRadius).attr("class", "displayPoints")
    .attr("id", function (d) { return "displayPoints" + d.id; })
    /** .attr("title", function (d) {return d.label;})*/
    .style("fill-opacity", 1).style("stroke", "#FFF").style("stroke-width", 1)
    .style("fill", this.pointColour).style("fill-opacity", 1);

  //Append an empty g element to contain the hint path
  this.svg.append("g").attr("id", "hintPath");
}
/**Interpolates the value for a year with missing data by using surrounding points
* points: the array of all points over time
* year: the year index of the missing data
* */
Scatterplot.prototype.interpolateMissingPoint = function (points, year) {
  var interpolator;
  if (year > 0 && year < points.length - 1) { //Not the first or last year
    interpolator = d3.interpolate({ x: points[year - 1][0], y: points[year - 1][1] },
      { x: points[year + 1][0], y: points[year + 1][1] });
  } else {
    interpolator = d3.interpolate({ x: 0, y: 0 },  //TODO:deal with end points, this is just a placeholder
      { x: 1, y: 1 });
  }
  return interpolator(0.5);
}
/** Draws the axes  and the graph title on the SVG
*  xScale: a function defining the scale of the x-axis
*  yScale: a function defining the scale of the y-axis
* */
Scatterplot.prototype.drawAxes = function (xScale, yScale) {

  //Define functions to create the axes
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
    .tickSize(-this.height, 0, 0);
  var yAxis = d3.svg.axis().scale(yScale).orient("left")
    .tickSize(-this.width, 0, 0);

  // Add the title of the graph
  this.svg.append("text").attr("id", "graphTitle")
    .attr("class", "axis").text(this.graphTitle)
    .attr("x", 1).attr("y", -15);

  // Add the x-axis
  this.svg.append("g").attr("class", "axis")
    .attr("transform", "translate(" + this.padding + "," + this.height + ")")
    .call(xAxis).selectAll("line").style("fill", "none").style("stroke", "#BDBDBD");

  // Add the y-axis
  this.svg.append("g").attr("class", "axis")
    .attr("transform", "translate(" + this.padding + ",0)")
    .call(yAxis).selectAll("line").style("fill", "none").style("stroke", "#BDBDBD");

  // Add an x-axis label
  this.svg.append("text").attr("class", "axisLabel")
    .attr("x", this.width)
    .attr("y", this.height + this.padding - 10)
    .text(this.xLabel);

  // Add a y-axis label
  this.svg.append("text").attr("class", "axisLabel")
    .attr("x", -15).attr("transform", "rotate(-90)")
    .text(this.yLabel);
}
/** Appends an anchor to the svg, if there isn't already one
* */
Scatterplot.prototype.appendAnchor = function () {
  if (this.svg.select("#anchor").empty()) {
    this.svg.select("#hintPath").append("circle")
      .attr("id", "anchor").attr("r", this.pointRadius).style("stroke", "none")
      .style("fill", "none");
  }
}
/** Re-draws the anchor, based on the dragging along the loop
* interp: amount along the loop to draw the anchor at
* groupNumber: to select the id of the loop
* */
Scatterplot.prototype.redrawAnchor = function (interp, groupNumber) {
  var loopPath = d3.select("#loop" + groupNumber).node();
  var totalLength = loopPath.getTotalLength();
  var newPoint = loopPath.getPointAtLength(totalLength * interp);
  this.svg.select("#anchor").attr("cx", newPoint.x).attr("cy", newPoint.y).style("stroke", "#c7c7c7");
}
/**Hides the circle anchor by removing it's stroke colour
* */
Scatterplot.prototype.hideAnchor = function () {
  this.svg.select("#anchor").style("stroke", "none");
}
/** Removes an anchor from the svg, if one is appended
* */
Scatterplot.prototype.removeAnchor = function () {
  if (!this.svg.select("#anchor").empty()) {
    this.svg.select("#anchor").remove();
  }
}
/** Re-draws the dragged point by projecting it onto the the line segment according to
*  the minimum distance.  As the point is dragged, the views are updated and the rest
*  of the points are animated
*  id: The id of the dragged point, for selecting by id
*  mousex,y: the mouse coordinates
*  nodes: the points along the hint path
* */
Scatterplot.prototype.updateDraggedPoint = function (id, mouseX, mouseY, nodes) {
  if (this.hintPathType == 1) {
    this.updateDraggedPoint_flashlight(id, mouseX, mouseY, nodes);
    return;
  }
  var pt1_x = nodes[this.currentView][0];
  var pt2_x = nodes[this.nextView][0];
  var pt1_y = nodes[this.currentView][1];
  var pt2_y = nodes[this.nextView][1];
  var newPoint = [];

  if (this.isAmbiguous == 1) { //Ambiguous cases exist on the hint path

    var currentPointInfo = this.ambiguousPoints[this.currentView];
    var nextPointInfo = this.ambiguousPoints[this.nextView];

    if (currentPointInfo[0] == 1 && nextPointInfo[0] == 0) { //Approaching loop from left side of hint path (not on loop yet)
      this.loopCurrent = 3;
      this.loopNext = 4;
      newPoint = this.dragAlongPath(id, pt1_x, pt1_y, pt2_x, pt2_y);
    } else if (currentPointInfo[0] == 0 && nextPointInfo[0] == 1) { //Approaching loop from right side on hint path (not on loop yet)
      this.loopCurrent = 0;
      this.loopNext = 1;
      newPoint = this.dragAlongPath(id, pt1_x, pt1_y, pt2_x, pt2_y);
    } else if (currentPointInfo[0] == 1 && nextPointInfo[0] == 1) { //In middle of stationary point sequence
      this.dragAlongLoop(id, currentPointInfo[1], mouseX, mouseY);
      return;
    } else {
      newPoint = this.dragAlongPath(id, pt1_x, pt1_y, pt2_x, pt2_y);
    }
  } else { //No ambiguous cases exist
    newPoint = this.dragAlongPath(id, pt1_x, pt1_y, pt2_x, pt2_y);
  }

  var draggedPoint = this.svg.select("#displayPoints" + id);

  if (this.hintPathType == 3) { //Combined hint path mode
    //Find the distance from mouse to the point along the path
    var distance = findPixelDistance(this.mouseX, this.mouseY, newPoint[0], newPoint[1]);
    if (distance > 100) {
      this.hintPathType = 1;
    }
    draggedPoint.style("fill-opacity", 1 - Math.abs(findPixelDistance(this.mouseX, this.mouseY, newPoint[0], newPoint[1]) / 100));
  }

  //Re-draw the dragged point
  draggedPoint.attr("cx", newPoint[0]).attr("cy", newPoint[1]);
  this.animatePointLabel(id, newPoint[0], newPoint[1]);

  //Save the mouse coordinates
  this.mouseX = mouseX;
  this.mouseY = mouseY;
}
/** Re-draws the dragged point according to the mouse position, changing the hint path
* display according to the flashlight design
*  id: The id of the dragged point, for selecting by id
*  mousex,y: the mouse coordinates
*  nodes: the points along the hint path
* */
Scatterplot.prototype.updateDraggedPoint_flashlight = function (id, mouseX, mouseY, nodes) {
  //TODO: ambiguity?
  if (this.hintPathType == 3) { //Check if near the time line hint path, if using combined hint path mode

  }

  this.drawHintPath_flashlight([mouseX, mouseY], nodes);
  //Re-draw the dragged point
  this.svg.select("#displayPoints" + id).attr("cx", mouseX).attr("cy", mouseY);
  this.animatePointLabel(id, mouseX, mouseY);

  //Save the mouse coordinates
  this.mouseX = mouseX;
  this.mouseY = mouseY;
}
/** Calculates the new position of the dragged point
* id: of the dragged point
* pt1, pt2: the boundary points (of current and next view)
* @return the coordinates of the newPoint as an array [x,y]
* */
Scatterplot.prototype.dragAlongPath = function (id, pt1_x, pt1_y, pt2_x, pt2_y) {

  //Get the two points of the line segment currently dragged along
  var minDist = this.minDistancePoint(this.mouseX, this.mouseY, pt1_x, pt1_y, pt2_x, pt2_y);
  var newPoint = []; //The new point to draw on the line
  var t = minDist[2]; //To test whether or not the dragged point will pass pt1 or pt2

  //Update the position of the dragged point
  if (t < 0) { //Passed current
    this.moveBackward();
    newPoint = [pt1_x, pt1_y];
  } else if (t > 1) { //Passed next
    this.moveForward();
    newPoint = [pt2_x, pt2_y];
  } else { //Some in between the views (pt1 and pt2)
    this.interpolatePoints(id, t, this.currentView, this.nextView);
    this.interpolateLabelColour(t);
    newPoint = [minDist[0], minDist[1]];
    //Save the values
    this.timeDirection = this.findTimeDirection(t);
    this.interpValue = t; //Save the interpolation amount
    if (this.hintPathType == 2) {
      redrawPartialHintPath_line(this, this.ambiguousPoints);
    }
  }
  return newPoint;
}
/** Sets the time direction based on the interpolation amount, currently not needed for the interaction
*  But can be used to log events.
* @return: the new direction travelling in time
* */
Scatterplot.prototype.findTimeDirection = function (interpAmount) {
  var direction = (interpAmount > this.interpValue) ? 1 : (interpAmount < this.interpValue) ? -1 : this.timeDirection;

  if (this.timeDirection != direction) { //Switched directions
    console.log("switched directions " + direction + " currentInterp " + this.interpValue + " newInterp " + interpAmount + " " + this.currentView + " " + this.nextView);
  }
  return direction;
}
/** Updates the view variables to move the visualization forward
* (passing the next view)
* */
Scatterplot.prototype.moveForward = function () {
  if (this.nextView < this.lastView) { //Avoid index out of bounds
    this.currentView = this.nextView;
    this.nextView++;
    this.timeDirection = 1;
    this.interpValue = 0;
  }
}
/** Updates the view variables to move the visualization backward
* (passing the current view)
* */
Scatterplot.prototype.moveBackward = function () {
  if (this.currentView > 0) { //Avoid index out of bounds
    this.nextView = this.currentView;
    this.currentView--;
    this.timeDirection = -1;
    this.interpValue = 1;
  }
}
/**Interpolates the label transparency between start and end view, this fading effect is used for
* distinguishing how close the user is from transitioning views the stationary ambiguous cases.
* interp: the interpolation amount (amount travelled across start to end)
* */
Scatterplot.prototype.interpolateLabelColour = function (interp) {
  var ref = this;
  this.svg.selectAll(".hintLabels").attr("fill-opacity", function (d) {
    if (d.id == ref.currentView) { //Dark to light
      return d3.interpolate(1, 0.5)(interp);
    } else if (d.id == ref.nextView) { //Light to dark
      return d3.interpolate(0.5, 1)(interp);
    }
    return 0.5;
  });
}
Scatterplot.prototype.dragAlongLoop = function (id, groupNumber, mouseX, mouseY) {

  var loopData = this.svg.select("#loop" + groupNumber).data().map(function (d) { return [d.cx, d.cy, d.orientationAngle, d.points2, d.years] });

  //var loopGenerator = d3.svg.line().interpolate("linear"); 
  //this.svg.select("#hintPath").append("path").attr("d",loopGenerator(loopData[0][3])).style("fill","none").style("stroke","#FFF");


  //d.points[0] = stationary point
  //d.points[1] = to the left of the stationary pt (forward path)
  //d.points[2..] = etc.. keep going counter clockwise
  // this.svg.append("circle").attr("cx",loopData[0][3][3][0]).attr("cy",loopData[0][3][3][1]).attr("r",10).style("fill","red");
  var loopPoints = loopData[0][3];
  var pt1_x = loopPoints[this.loopCurrent][0];
  var pt1_y = loopPoints[this.loopCurrent][1];
  var pt2_x = loopPoints[this.loopNext][0];
  var pt2_y = loopPoints[this.loopNext][1];

  var minDist = this.minDistancePoint(mouseX, mouseY, pt1_x, pt1_y, pt2_x, pt2_y);
  var newPoint = []; //The new point to draw on the line
  var t = minDist[2]; //To test whether or not the dragged point will pass pt1 or pt2

  var angles = this.calculateMouseAngle(minDist[0], minDist[1], loopData[0][2], loopData[0][0], loopData[0][1]);
  var loopInterp = this.convertMouseToLoop_interp(angles[2]);

  //Get the loop's boundary years
  var startYear = loopData[0][4][0];
  var endYear = loopData[0][4][loopData[0][4].length - 1];

  if (t < 0) { //Passed current on loop
    this.loopNext = this.loopCurrent;
    this.loopCurrent--;
    if (this.loopCurrent < 0) { //Check if the view was passed
      if (this.currentView > startYear) { //In the middle of the loop (2 is the border view)
        this.moveBackward();
        this.loopCurrent = 3;
        this.loopNext = 4;
      } else { //Move back to the full hint path
        this.loopCurrent = 0;
        this.loopNext = 1;
        this.moveBackward();
      }
    }
    //console.log("backward"+this.loopCurrent+" "+this.loopNext+" views"+this.currentView+" "+this.nextView);
  } else if (t > 1) { //Passed next on the loop
    this.loopCurrent = this.loopNext;
    this.loopNext++;
    if (this.loopCurrent > 3) { //Check if the view was passed
      if (this.nextView < endYear) { //Not at the border view
        this.loopCurrent = 0;
        this.loopNext = 1;
        this.moveForward();
      } else {
        this.loopCurrent = 3;
        this.loopNext = 4;
        this.moveForward();
      }
    }
    //console.log("forward"+this.loopCurrent+" "+this.loopNext+" views"+this.currentView+" "+this.nextView);
  } else { //Some in between the views (pt1 and pt2), redraw the anchor and the view
    //this.svg.select("#anchor").attr("cx",minDist[0]).attr("cy",minDist[1]).style("stroke","#c7c7c7");       
    this.interpAmount = angles[2];
    this.timeDirection = this.findTimeDirection(this.interpAmount, id);
    this.interpolatePoints(id, this.interpAmount, this.currentView, this.nextView);
    this.interpolateLabelColour(this.interpAmount);
    if (this.hintPathType == 2) {
      redrawPartialHintPath_line(this, this.ambiguousPoints, this.id);
    }
  }
  this.redrawAnchor(loopInterp, groupNumber);
}
/**Finds the angle of the mouse w.r.t the center of the loop
* @return [angle,positiveAngle,interpAmount]
* */
Scatterplot.prototype.calculateMouseAngle = function (mouseX, mouseY, orientationAngle, loopCx, loopCy) {

  var newAngle;
  var subtractOne = 0; //For adjusting the interpolation value

  if (orientationAngle < this.halfPi && orientationAngle >= 0) { //Between 0 (inclusive) and 90
    newAngle = Math.atan2(mouseY - loopCy, loopCx - mouseX) + orientationAngle; //0/360 deg
  } else if (orientationAngle < this.twoPi && orientationAngle >= this.threePi_two) { //Between 360/0 and 270 (inclusive)
    subtractOne = 1;
    newAngle = Math.atan2(loopCx - mouseX, mouseY - loopCy) - (orientationAngle - this.threePi_two);  //270 deg
  } else if (orientationAngle < this.threePi_two && orientationAngle >= this.pi) { //Between 270 and 180 (inclusive)
    newAngle = Math.atan2(loopCy - mouseY, mouseX - loopCx) + (orientationAngle - this.pi); //180 deg
  } else {
    subtractOne = 1;
    newAngle = Math.atan2(mouseX - loopCx, loopCy - mouseY) - (orientationAngle - this.halfPi); // 90 deg
  }

  var positiveAngle = (newAngle < 0) ? ((this.pi - newAngle * (-1)) + this.pi) : newAngle;

  var interpAmount = (subtractOne == 1) ? (1 - positiveAngle / this.twoPi) : (positiveAngle / this.twoPi);

  return [newAngle, positiveAngle, interpAmount];
}
/** Adjusts the interpolation value of the mouse angle (1/0 mark is at the stationary point) to draw correctly on
*  the loop (where 0.5 is at the stationary point)
* */
Scatterplot.prototype.convertMouseToLoop_interp = function (mouseInterp) {
  return (mouseInterp >= 0 && mouseInterp < 0.5) ? (mouseInterp + 0.5) : (mouseInterp - 0.5);
}
/**"Animates" the rest of the points while one is being dragged
* Uses the 't' parameter, which represents approximately how far along a line segment
* the dragged point has travelled.  The positions of the rest of the points are interpolated
* based on this t parameter and re-drawn at this interpolated position
* id: The id of the dragged point
* interpAmount: The t parameter, or amount to interpolate by
* startView,endView: Define the range to interpolate across
* */
Scatterplot.prototype.interpolatePoints = function (id, interpAmount, startView, endView) {
  var ref = this;
  this.svg.selectAll(".displayPoints").filter(function (d) { return d.id != id; })
    .each(function (d) {
      var interpolator = d3.interpolate({ x: d.nodes[startView][0], y: d.nodes[startView][1] },
        { x: d.nodes[endView][0], y: d.nodes[endView][1] }); //Function to linearly interpolate between points at current and next view
      var newPoint = interpolator(interpAmount);
      //Update the position of the point according to the interpolated point position
      d3.select(this).attr("cx", newPoint.x).attr("cy", newPoint.y);

      //Update the labels (if visible)
      if (ref.clickedPoints.indexOf(d.id) != -1) ref.animatePointLabel(d.id, newPoint.x, newPoint.y);
    })
}
/**Re-draws a point label according to the specified position (new position of the point) by
* updating its x and y attributes
* @param id of the point label
* @param x,y, new position of the label
* */
Scatterplot.prototype.animatePointLabel = function (id, x, y) {
  var ref = this;
  this.svg.select("#pointLabel" + id).attr("x", x).attr("y", y - ref.pointRadius);
}
/** Snaps to the nearest view once a dragged point is released
*  Nearest view is the closest position (either current or next) to the
*  most recent position of the dragged point. View tracking variables are
*  updated according to which view is "snapped" to.
*  id: The id of the dragged point
*  points: All points along the hint path
* */
Scatterplot.prototype.snapToView = function (id, points) {
  if (this.hintPathType == 1) { //Snapping is different for flashlight hint path
    this.snapToView_flashlight(id, points);
    return;
  }
  var distanceCurrent, distanceNext;
  if (this.ambiguousPoints[this.currentView][0] == 1 && this.ambiguousPoints[this.nextView][0] == 1) { //Current and next are stationary points
    distanceCurrent = this.interpValue;
    distanceNext = 0.5;
  } else { //Non-ambiguous point
    //Calculate the distances from the dragged point to both current and next
    distanceCurrent = this.calculateDistance(this.mouseX, this.mouseY, points[this.currentView][0], points[this.currentView][1]);
    distanceNext = this.calculateDistance(this.mouseX, this.mouseY, points[this.nextView][0], points[this.nextView][1]);
  }

  //Based on the smaller distance, update the scatter plot to that view
  if (distanceCurrent > distanceNext && this.nextView <= this.lastView) { //Snapping to next view
    this.currentView = this.nextView;
    this.nextView = this.nextView + 1;
  }

  //Redraw the view
  this.redrawView(this.currentView);
}
/** Snaps to the nearest view once a dragged point is released
*  Nearest view is the closest position
*  id: The id of the dragged point
*  points: All points along the hint path
* */
Scatterplot.prototype.snapToView_flashlight = function (id, points) {
  var minDist = Number.MAX_VALUE;
  var viewToSnapTo = -1;
  var currentPointIndex = -1;
  //TODO: might want to save the current positions visible on the hint path to avoid re-calculating all distances
  for (var i = 0; i < this.hintPathPoints_flashlight.length; i++) {
    currentPointIndex = this.hintPathPoints_flashlight[i];
    var currentDist = this.calculateDistance(points[currentPointIndex][0], points[currentPointIndex][1], this.mouseX, this.mouseY);
    if (currentDist < minDist) {
      minDist = currentDist;
      viewToSnapTo = currentPointIndex;
    }
  }
  if (viewToSnapTo < this.lastView) {
    this.currentView = viewToSnapTo;
    this.nextView = this.currentView + 1;
  }
  this.drawHintPath_flashlight(points[viewToSnapTo], points);
  this.redrawView(viewToSnapTo);
}
/** Animates all points in the scatterplot along their hint paths from
*  startView to endView, this function is called when "fast-forwarding"
*  is invoked (by clicking a year label on the hint path)
*  id: of the dragged point (if any)
*  startView, endView: animation goes from start to end view
*  Resources: http://bl.ocks.org/mbostock/1125997
*            http://bost.ocks.org/mike/transition/
* */
Scatterplot.prototype.animatePoints = function (id, startView, endView) {

  if (this.hintPathType == 1) { //Go directly to the year, when using flashlight path
    this.redrawView(endView);
    return;
  }

  if (startView == endView) return;
  var ref = this;
  //Determine the travel direction (e.g., forward or backward in time)
  var direction = 1;
  if (startView > endView) direction = -1;

  //Define some counter variables to keep track of the views passed during the transition
  var totalObjects = this.numPoints;
  var objectCounter = -1;
  var animateView = startView; //Indicates when to switch the views (after all points are finished transitioning)

  //Apply multiple transitions to each display point by chaining them
  this.svg.selectAll(".displayPoints").each(animate());

  //Recursively invoke this function to chain transitions, a new transition is added once
  //the current one is finished
  function animate() {
    objectCounter++;
    if (objectCounter == totalObjects) {
      animateView = animateView + direction;
      objectCounter = 0;
    }

    //Ensure the animateView index is not out of bounds
    if (direction == 1 && animateView >= endView) { return };
    if (direction == -1 && animateView <= endView) { return };

    return function (d) {
      //Re-draw each point at the current view in the animation sequence
      d3.select(this).transition(400).ease("linear")
        .attr("cx", d.nodes[animateView][0])
        .attr("cy", d.nodes[animateView][1])
        .each("end", animate());
      ref.animatePointLabel(d.id, d.nodes[animateView][0], d.nodes[animateView][1]);
      //Re-colour the labels along the hint path (if a path is visible)
      if (d.id == id) {
        d3.selectAll(".hintLabels").attr("fill-opacity", function (b) { return ((b.id == animateView) ? 1 : 0.5) });
      }
    };
  }
}
/** Redraws the scatterplot's point labels at the specified view
*  view: the view to draw
* */
Scatterplot.prototype.redrawPointLabels = function (view) {
  var ref = this;
  this.svg.selectAll(".pointLabels").filter(function (d) { return (ref.clickedPoints.indexOf(d.id) != -1) })
    .attr("x", function (d) { return d.nodes[view][0]; })
    .attr("y", function (d) { return d.nodes[view][1] - ref.pointRadius; });
}
/** Redraws the scatterplot at a specified view
*  view: the view to draw
*  NOTE: view tracking variables are not updated by this function
* */
Scatterplot.prototype.redrawView = function (view) {
  /**if (this.hintPathType==2){ //Partial hint path
      hideSmallHintPath(this);
  }*/
  if (this.hintPathType == 0) { //Trajectory
    this.hideAnchor();
    //Re-colour the hint path labels
    this.svg.selectAll(".hintLabels").attr("fill-opacity", function (d) { return ((d.id == view) ? 1 : 0.5) });
    this.svg.selectAll(".displayPoints")/**.transition().duration(300)*/
      .attr("cx", function (d) { return d.nodes[view][0]; })
      .attr("cy", function (d) { return d.nodes[view][1]; });

  } else if (this.hintPathType == 1) { //Flashlight
    this.svg.selectAll(".displayPoints").transition().duration(300)
      .attr("cx", function (d) { return d.nodes[view][0]; })
      .attr("cy", function (d) { return d.nodes[view][1]; });
  }
  this.redrawPointLabels(view);
}
/** Called each time a new point is dragged.  Searches for ambiguous regions, and draws the hint path
*  */
Scatterplot.prototype.selectPoint = function (point) {
  //In case next view went out of bounds (from snapping to view), re-adjust the view variables
  var drawingView = adjustView(this);

  //First check for ambiguous cases in the hint path of the dragged point, then draw loops (if any)
  this.checkAmbiguous(point.id, point.nodes);

  if (this.isAmbiguous == 1) {
    this.appendAnchor();
  }

  if (this.hintPathType == 0) { //Trajectory path
    this.drawHintPath(drawingView, point.nodes, point.interpYears);
  } else if (this.hintPathType == 1) { //Flashlight path
    this.drawHintPath_flashlight(point.nodes[drawingView], point.nodes);
  } else if (this.hintPathType == 2) { //Partial hint path used in evaluation
    drawPartialHintPath_line(this, 0, point.nodes);
    redrawPartialHintPath_line(this, this.ambiguousPoints);
  } else if (this.hintPathType == 3) { //Combined
    this.drawHintPath(drawingView, point.nodes, point.interpYears);
  }

  if (this.clickedPoints.indexOf(point.id) == -1) {
    this.clickedPoints.push(point.id);
    this.drawPointLabel(point.id);
  }
  var ref = this;
  //Fade out the other points using a transition
  this.svg.selectAll(".displayPoints").filter(function (d) { return (ref.clickedPoints.indexOf(d.id) == -1) })
    .transition().duration(300).style("fill-opacity", 0.3);//.style("stroke-opacity",0.3);
}
/** Draws a label at the top of the selected point
* */
//TODO: draw a line from the corner of the label to the point
Scatterplot.prototype.drawPointLabel = function (id) {
  var ref = this;
  //Add labels to the points
  var gElement = this.svg.select("#gDisplayPoints" + id);
  gElement.append("text")
    .attr("x", function (d) { return d.nodes[ref.currentView][0]; })
    .attr("y", function (d) { return d.nodes[ref.currentView][1] - ref.pointRadius; })
    .attr("class", "pointLabels").attr("id", function (d) { return "pointLabel" + d.id })
    .text(function (d) { return d.label; });

  /**var bbox =  this.svg.select("#pointLabel"+id).node().getBBox();
  var padding = 2;

  gElement.append("rect").attr("x", bbox.x-padding).attr("y", bbox.y-padding)
      .attr("height",bbox.height+padding*2).attr("width",bbox.width+padding*2)
      .attr("rx",5).attr("ry",5)
      .attr("class","pointLabels").style("fill","#EDEDED").style("fill-opacity",0.3)
      .style("stroke","#EDEDED").style("stroke-opacity",1);*/
}
/** Displays a trajectory hint path by appending its svg components to the main svg
*  view: view to draw at
*  points: all points along the hint path
*  interpPts: points that have been interpolated (missing data)
* */
Scatterplot.prototype.drawHintPath = function (view, points, interpPts) {
  var ref = this;
  //Draw the hint path labels, reposition any which are in a stationary sequence
  var adjustedPoints = this.placeLabels(points);

  this.svg.select("#hintPath").selectAll("text")
    .data(adjustedPoints.map(function (d, i) {
      return { x: d[0] + ref.pointRadius, y: d[1] + ref.pointRadius, id: i }
    })).enter().append("svg:text")
    .text(function (d, i) {
      if (interpPts[i] == 1) return "";  //Don't show the labels of interpolated years
      return ref.labels[d.id];
    }).attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y; })
    .attr("class", "hintLabels")
    .attr("fill-opacity", function (d) { return ((d.id == view) ? 1 : 0.5) })
    .attr("id", function (d) { return "hintLabels" + d.id })
    .style("font-family", "sans-serif").style("font-size", "10px").style("text-anchor", "middle")
    .style("fill", "#666").on("click", this.clickHintLabelFunction);

  //Render the hint path line
  this.svg.select("#hintPath").append("svg:path")
    .attr("d", this.hintPathGenerator(points))
    .attr("id", "path").attr("filter", "url(#blur)")
    .style("fill", "none").style("stroke-width", 1.5).style("stroke", this.pointColour);
}
/** Re-draws a flashlight style hint path as the point is dragged
*  currentPosition: position of the dragged point
*  points: all points along the hint path
* */
Scatterplot.prototype.drawHintPath_flashlight = function (currentPosition, points) {
  this.svg.select("#hintPath").selectAll(".hintLabels").remove();
  this.svg.select("#hintPath").selectAll("path").remove();
  this.hintPathPoints_flashlight = [];

  //TODO: ambiguity?
  //var currentPosition = points[view];
  var distances = [];
  for (var i = 0; i < points.length; i++) { //Grab the closest n points to the current position
    distances.push([this.calculateDistance(currentPosition[0], currentPosition[1], points[i][0], points[i][1]), i]);
  }
  distances.sort(function (a, b) { return a[0] - b[0] }); //Sort ascending
  var maxDistance = distances[4][0]; //For scaling the transparency

  var pathPoints = [];
  var ref = this;
  for (var i = 0; i < 4; i++) { //Start at 1, we know the zero distance will be the first element in the sorted array
    pathPoints.push(points[distances[i][1]]);
    var pointIndex = distances[i][1];
    this.svg.select("#hintPath").append("svg:path")
      .attr("d", this.hintPathGenerator([points[pointIndex], currentPosition]))
      .attr("id", "path").attr("filter", "url(#blurFlashlight)").attr("opacity", Math.abs(1 - distances[i][0] / maxDistance))
      .style("fill", "none").style("stroke-width", 1).style("stroke", this.pointColour);
    this.hintPathPoints_flashlight.push(pointIndex);
  }

  //Draw the hint path labels
  this.svg.select("#hintPath").selectAll("text").data(pathPoints.map(function (d, i) {
    return { x: d[0], y: d[1], id: ref.hintPathPoints_flashlight[i], id2: i }
  })).enter().append("text").text(function (d) { return ref.labels[d.id] }).attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y; }).attr("class", "hintLabels")
    .attr("fill-opacity", function (d) { return Math.abs(1 - distances[d.id2][0] / maxDistance) })
    .attr("id", function (d) { return "hintLabels" + d.id })
    .style("font-family", "sans-serif").style("font-size", "10px").style("text-anchor", "middle")
    .style("fill", "#666").on("click", this.clickHintLabelFunction);
}
/**This function places labels in ambiguous cases such that they do not overlap
* points: a 2D array of positions of each label [x,y]...
* */
Scatterplot.prototype.placeLabels = function (points) {
  if (this.isAmbiguous == 0) { return points } //No ambiguous cases, don't need to adjust the points

  var ref = this;
  var offset = -1;
  var indexCounter = -1;
  var x = 0;
  var y = 0;
  var adjustedPoints = points.map(function (d, i) {
    if (ref.ambiguousPoints[i][0] == 1 /**|| ref.ambiguousPoints[i][0] == 2*/) {
      if (ref.ambiguousPoints[i][1] != offset) {
        indexCounter = -1;
        offset = ref.ambiguousPoints[i][1];
        x = d[0];
        y = d[1];
      }
      indexCounter++;
      return [x + 25 * indexCounter, y - 10];
    }
    return [d[0], d[1]];
  });
  return adjustedPoints;
}
/**This function places labels in ambiguous cases for a flashlight hint path, aligned vertically and equally spaced
* points: a 2D array of positions of each label [x,y]...
* */
Scatterplot.prototype.placeLabels_flashlight = function (points) {
  if (this.isAmbiguous == 0) { return points } //No ambiguous cases, don't need to adjust the points

  var ref = this;
  var offset = -1;
  var indexCounter = -1;
  var x = 0;
  var y = 0;
  var adjustedPoints = points.map(function (d, i) {
    if (ref.ambiguousPoints[i][0] == 1 /**|| ref.ambiguousPoints[i][0] == 2*/) {
      if (ref.ambiguousPoints[i][1] != offset) {
        indexCounter = -1;
        offset = ref.ambiguousPoints[i][1];
        x = d[0];
        y = d[1];
      }
      indexCounter++;
      return [x, y + 25 * indexCounter];
    }
    return [d[0], d[1]];
  });
  return adjustedPoints;
}
/** Draws interaction loops as svg paths onto the hint path (if point has stationary cases)
*  id: of the dragged point
* */
Scatterplot.prototype.drawLoops = function (id, points) {
  //Create a function for drawing a loop around a stationary point, as an interaction path
  var loopGenerator = d3.svg.line().tension(0).interpolate("basis-closed"); //Closed B-spline
  var ref = this;

  //Draw all loops at their respective stationary points
  this.svg.select("#hintPath").selectAll(".loops")
    .data(points.map(function (d, i) {
      var loopPoints = [];
      loopPoints = ref.calculateLoopPoints(d[0], d[1], d[2]);
      var x = d[0] + (ref.loopRadius / 2) * Math.cos(d[2]);
      var y = d[1] + (ref.loopRadius / 2) * Math.sin(d[2]);
      var repeatedYears = [];
      for (var j = 0; j < ref.ambiguousPoints.length; j++) {
        if (ref.ambiguousPoints[j][0] == 1 && ref.ambiguousPoints[j][1] == i) {
          repeatedYears.push(j);
        }
      }
      return { points: loopPoints[0], id: i, orientationAngle: d[2], cx: x, cy: y, points2: loopPoints[1], years: repeatedYears };
    }))
    .enter().append("path").attr("class", "loops")
    .attr("d", function (d) { return loopGenerator(d.points); })
    .attr("id", function (d, i) { return "loop" + i; })
    .style("fill", "none").style("stroke", "#666").style("stroke-dasharray", "3,3")
    .attr("filter", "url(#blurLoop)");
}
/** Clears the hint path by removing it, also re-sets the transparency of the faded out points and the isAmbiguous flag */
Scatterplot.prototype.clearHintPath = function () {
  this.isAmbiguous = 0;
  this.removeAnchor();

  //Remove the hint path svg elements
  this.svg.select("#hintPath").selectAll("text").remove();
  this.svg.select("#hintPath").selectAll("path").remove();
  this.svg.select("#hintPath").selectAll("circle").remove();

  //Re-set the transparency of faded out points
  this.svg.selectAll(".displayPoints").style("fill-opacity", 1);
}
/**Clears the point labels when the background is clicked
* */
Scatterplot.prototype.clearPointLabels = function () {
  this.svg.selectAll(".pointLabels").remove();
  this.clickedPoints = [];
}
/** Calculates the distance between two points
* (x1,y1) is the first point
* (x2,y2) is the second point
* @return the distance, avoiding the square root
* */
Scatterplot.prototype.calculateDistance = function (x1, y1, x2, y2) {
  var term1 = x1 - x2;
  var term2 = y1 - y2;
  return (term1 * term1) + (term2 * term2);
}
/** Finds the minimum distance between a point at (x,y), with respect
* to a line segment defined by points (pt1_x,pt1_y) and (pt2_x,pt2_y)
* Code based on: http://stackoverflow.com/questions/849211/shortest
* -distance-between-a-point-and-a-line-segment
* Formulas can be found at: http://paulbourke.net/geometry/pointlineplane/
* @return the point on the line at the minimum distance and the t parameter, as an array: [x,y,t]
* */
Scatterplot.prototype.minDistancePoint = function (x, y, pt1_x, pt1_y, pt2_x, pt2_y) {

  var distance = this.calculateDistance(pt1_x, pt1_y, pt2_x, pt2_y);
  //Two points of the line segment are the same
  if (distance == 0) return [pt1_x, pt1_y, 0];

  var t = ((x - pt1_x) * (pt2_x - pt1_x) + (y - pt1_y) * (pt2_y - pt1_y)) / distance;
  if (t < 0) return [pt1_x, pt1_y, t]; //Point projection goes beyond pt1
  if (t > 1) return [pt2_x, pt2_y, t]; //Point projection goes beyond pt2

  //Otherwise, point projection lies on the line somewhere
  var minX = pt1_x + t * (pt2_x - pt1_x);
  var minY = pt1_y + t * (pt2_y - pt1_y);
  return [minX, minY, t];
}
/** Computes the points to lie along an interaction loop
* Note: this function is only called in findLoops()
* x,y: Define the center point of the loop (sort of)
* angle: the angle to orient the loop at
* @return an array of all loop points and the year index in the format: [[x,y], etc.]
* */
Scatterplot.prototype.calculateLoopPoints = function (x, y, angle) {
  var drawingPoints = [];
  var loopWidth = Math.PI / 5; //Change this value to expand/shrink the width of the loop

  //The first point of the path should be the original point, as a reference for drawing the loop
  drawingPoints.push([x, y]);

  //Generate some polar coordinates to complete the round part of the loop
  drawingPoints.push([(x + this.loopRadius * Math.cos(angle + loopWidth)), (y + this.loopRadius * Math.sin(angle + loopWidth))]);
  drawingPoints.push([(x + this.loopRadius * Math.cos(angle)), (y + this.loopRadius * Math.sin(angle))]);
  drawingPoints.push([(x + this.loopRadius * Math.cos(angle - loopWidth)), (y + this.loopRadius * Math.sin(angle - loopWidth))]);

  //The last point of the path should be the original point, as a reference for drawing the loop
  drawingPoints.push([x, y]);

  //Hack here!!!- another set of points for handling dragging around loops
  var loopPoints = [];
  loopWidth = Math.PI / 7; //Change this value to expand/shrink the width of the loop
  var adjustedRadius = this.loopRadius - 10;
  //The first point of the path should be the original point, as a reference for drawing the loop
  loopPoints.push([x, y]);

  //TODO: automatically assign dragging direction to loops
  //Generate some polar coordinates to complete the round part of the loop
  //HACK: use this when dragging segways to the left
  /**loopPoints.push([(x + adjustedRadius*Math.cos(angle+loopWidth)),(y+ adjustedRadius*Math.sin(angle+loopWidth))]);
  loopPoints.push([(x + adjustedRadius*Math.cos(angle)),(y+ adjustedRadius*Math.sin(angle))]);
  loopPoints.push([(x + adjustedRadius*Math.cos(angle-loopWidth)),(y+ adjustedRadius*Math.sin(angle-loopWidth))]);*/

  //HACK: use this point order when dragging segways right
  loopPoints.push([(x + adjustedRadius * Math.cos(angle - loopWidth)), (y + adjustedRadius * Math.sin(angle - loopWidth))]);
  loopPoints.push([(x + adjustedRadius * Math.cos(angle)), (y + adjustedRadius * Math.sin(angle))]);
  loopPoints.push([(x + adjustedRadius * Math.cos(angle + loopWidth)), (y + adjustedRadius * Math.sin(angle + loopWidth))]);

  //The last point of the path should be the original point, as a reference for drawing the loop
  loopPoints.push([x, y]);

  return [drawingPoints, loopPoints];
}
/** Search for ambiguous cases in a list of points.  Ambiguous cases are tagged as '1' and non-ambiguous are '0'.
*  If ambiguous cases are found, draws loops.
*  This function populates the following global array:
*  this.ambiguousPoints:[[type,group]..total number of points on hint path], Group is an index indicating
*  which group stationary points the point belongs to.
*
*  id: of the dragged point
*  points: an array of points to search within for ambiguity
* */
Scatterplot.prototype.checkAmbiguous = function (id, points) {
  var j, currentPoint;
  var repeatedPoints = [];
  var foundIndex = -1;
  var groupNum = 0;

  //Clear and re-set the global arrays
  this.ambiguousPoints = [];
  //this.closePoints = [];
  for (j = 0; j <= this.lastView; j++) {
    this.ambiguousPoints[j] = [0];
    //this.closePoints[j] = [0];
  }
  var savedIndex = -1;
  //Populate the stationary and revisiting points array
  //Search for points that match in the x and y values (called "stationary points")
  for (j = 0; j <= this.lastView; j++) {
    currentPoint = points[j];
    for (var k = 0; k <= this.lastView; k++) {
      if (j != k) {
        var distance = findPixelDistance(points[k][0], points[k][1], currentPoint[0], currentPoint[1]);
        if ((points[k][0] == currentPoint[0] && points[k][1] == currentPoint[1]) || (distance <= 10)) { //A repeated point is found
          if (Math.abs(k - j) == 1) { //Stationary point
            this.isAmbiguous = 1;
            if (Math.abs(savedIndex - j) > 1 && savedIndex != -1) {
              groupNum++;
            }
            this.ambiguousPoints[j] = [1, groupNum];
            savedIndex = j;
          }/**else{ //Found a revisiting point
                       if (this.ambiguousPoints[j][0] ==0){ //Don't want to overwrite a stationary point
                           this.ambiguousPoints[j] = [2,groupNum];
                       }
                   }*/
        }
      }
    }
  }   //Draw the interaction loop(s) (if any)
  if (this.isAmbiguous == 1) {
    //TODO: automatically orient the loops such that they blend with the path
    var currentGroupNum = -1;
    for (var i = 0; i < this.ambiguousPoints.length; i++) {
      if (this.ambiguousPoints[i].length > 1) {
        if (this.ambiguousPoints[i][1] != currentGroupNum) {
          repeatedPoints.push([points[i][0], points[i][1], Math.PI * 3 / 2]);
        }
        currentGroupNum = this.ambiguousPoints[i][1];
      }
    }
    this.drawLoops(id, repeatedPoints);
  }
}
/** Search for x,y in a 2D array with the format: [[x,y]..number of points]
*  x,y: the point to search for
*  array: the array to search within
*  @return -1 if no match is found, or the index of the found match
* */
Scatterplot.prototype.findInArray = function (x, y, array) {
  if (array.length == 0) return -1;
  for (var j = 0; j < array.length; j++) {
    if (array[j][0] == x && array[j][1] == y) {
      return j;
    }
  }
  return -1;
}

/**
 * This file contains functions which can be used across all prototypes,
 * mostly shared across barchart, heatmap and piechart (since they are very similar)
 *
 * All functions must be passed a variable containing a reference to the object (this)
 * in order to access object variables and/or functions
 */
//TODO: move functions related to user study to a separate file
/**Clears the visualization elements appended to the SVG (used when the dataset is changed
 * objectClass: is the class name e.g., ".bars", assigned to all data objects associated with the
 * visualization
 * */
function clearVis(objectClass) {
  if (!d3.selectAll(objectClass).empty()) {
    d3.selectAll(objectClass).remove();
    d3.selectAll(".axisLabel").remove();
    d3.selectAll(".axis").remove();
    d3.select("#hintPath").remove();
    d3.select("#legend").remove();
  }
}
/**Checks if a mobile device is being used, called when the page loads
 * @return true if mobile, false otherwise
 * This code is from: http://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-handheld-device-in-jquery
 * */
function checkDevice() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return true;
  }
  return false;
}
/**Changes some display properties of the hint path, such as increasing the stroke width and
 * making the colour lighter.  To make the hint path look nicer in it's non-blurred form
 * */
function drawMobileHintPath(objectRef) {
  objectRef.svg.select("#path").style("stroke-opacity", 0.5).style("stroke-width", 4);
  objectRef.svg.select("#underlayer").style("stroke-width", 5);
}
/**Resolves the user's coordinates depending on whether there is touch or mouse interaction
 * */
function getUserCoords(objectRef) {
  if (d3.touches(objectRef).length > 0) {
    return [d3.touches(objectRef)[0][0], d3.touches(objectRef)[0][1]];
  }
  return [d3.event.x, d3.event.y];
}
//////////////////////Updating important object variables//////////////////////

/** Updates the view variables to move the visualization forward
 * (passing the next view), also sets the direction travelling in time
 * draggingDirection: set to 1/-1 (physical dragging direction of user)
 *                    set to 0, if unknown
 * */
function moveForward(objectRef, draggingDirection) {

  if (objectRef.nextView < objectRef.lastView) { //Avoid index out of bounds
    objectRef.currentView = objectRef.nextView;
    objectRef.nextView++;
    //objectRef.timeDirection = 1;
  } else if (draggingDirection != 0) {
    if (draggingDirection != objectRef.previousDragDirection) { //Flip the direction when at the end of the hint path
      objectRef.timeDirection = (objectRef.timeDirection == 1) ? -1 : 1;
    }
  }
}
/**Finds the pixel distance from the user's point to the dragged data object's point
 * @return the pixel distance (calculated with the euclidean distance formula)
 * */
function findPixelDistance(userX, userY, objectX, objectY) {
  var term1 = userX - objectX;
  var term2 = userY - objectY;
  return Math.sqrt((term1 * term1) + (term2 * term2));
}
/** Updates the view tracking variables when the view is being changed by an external
 * visualization (e.g., slider)
 * */
function changeView(objectRef, newView) {
  if (newView == 0) {
    objectRef.currentView = newView
    objectRef.nextView = newView + 1;
  } else if (newView == objectRef.lastView) {
    objectRef.nextView = newView;
    objectRef.currentView = newView - 1;
  } else {
    objectRef.currentView = newView;
    objectRef.nextView = newView + 1;
  }
}
/**Adjusts the view variables in case they have gone out of bounds
 * @return the view to draw the visualization at */
function adjustView(objectRef) {
  if (objectRef.nextView > objectRef.lastView) {
    objectRef.nextView--;
    objectRef.currentView--;
    objectRef.interpValue = 0;
    return objectRef.nextView;
  } else if (objectRef.nextView == objectRef.lastView) {
    return objectRef.nextView;
  }
  return objectRef.currentView;
}
/** Updates the view variables to move the visualization backward
 * (passing the current view), also sets the direction travelling
 *  over time
 * draggingDirection: set to 1/-1 (physical dragging direction of user)
 *                    set to 0, if unknown
 * */
function moveBackward(objectRef, draggingDirection) {
  if (objectRef.currentView > 0) { //Avoid index out of bounds
    objectRef.nextView = objectRef.currentView;
    objectRef.currentView--;
    objectRef.interpValue = 0;
    //objectRef.timeDirection = -1;
  } else if (draggingDirection != 0) {
    if (draggingDirection != objectRef.previousDragDirection) { //Flip the direction when at the end of the hint path
      objectRef.timeDirection = (objectRef.timeDirection == 1) ? -1 : 1;
    }
  }
}
/** Checks if the mouse is in bounds defined by a and b, updates the interpolation amount
 *  mouse: the mouse position
 *  @return start,end: boundary values are returned if the given
 *                     mouse position is equal to or has crossed it
 *          mouse: The mouse value, if in bounds
 * */
function checkBounds(objectRef, a, b, mouse) {
  //Resolve the boundaries for comparison, start is lower value, end is higher
  var start, end;
  if (a > b) {
    end = a;
    start = b;
  } else {
    start = a;
    end = b;
  }

  //Check if the mouse is between start and end values
  if (mouse <= start) {
    return start;
  } else if (mouse >= end) {
    return end;
  }
  return mouse;
}
/** Calculates the interpolation amount  (percentage travelled) of the mouse, between views.
 *   Uses the interpolation amount to find the direction travelling over time and saves it
 *   in the global variable (interpValue). Also, updates the direction travelling over time (
 *   if there is a change in dragging direction)
 *
 *   a,b: position of boundary values (mouse is currently in between)
 *   mouse: position of the mouse
 *   draggingDirection: physical dragging direction of the user
 *   ambiguity: a flag, = 1, ambiguous case
 *                      = 0, normal case
 */
function findInterpolation(objectRef, a, b, mouse, ambiguity, draggingDirection) {
  var distanceTravelled, currentInterpValue;
  var total = Math.abs(b - a);
  //Calculate the new interpolation amount
  if (ambiguity == 0) {
    distanceTravelled = Math.abs(mouse - a);
    currentInterpValue = distanceTravelled / total;
  } else {
    if (objectRef.passedMiddle == 0) { //Needs to be re-mapped to lie between [0,0.5] (towards the peak/trough)
      distanceTravelled = Math.abs(mouse - a);
      currentInterpValue = distanceTravelled / (total * 2);
    } else { //Needs to be re-mapped to lie between [0.5,1] (passed the peak/trough)
      distanceTravelled = Math.abs(mouse - b);
      currentInterpValue = (distanceTravelled + total) / (total * 2);
    }
  }
  //Set the direction travelling over time (1: forward, -1: backward)
  if (draggingDirection != objectRef.previousDragDirection) {
    objectRef.timeDirection = (objectRef.timeDirection == -1) ? 1 : -1;
  }
  //objectRef.timeDirection = (currentInterpValue > objectRef.interpValue)? 1 : (currentInterpValue < objectRef.interpValue)?-1 : objectRef.timeDirection;

  //Save the current interpolation value
  objectRef.interpValue = currentInterpValue;
}
/**Infers the time direction when user arrives at areas on the hint path where interaction is ambiguous (e.g., peaks)
 * Inference is based on previous direction travelling over time.  The views are updated (forward or backward)
 * whenever the dragging direction changes.
 * draggingDirection: physical dragging direction of the user
 * atCurrent: the view which user is currently at or passing (=0 if at next view, =1 if at current)
 * */
function inferTimeDirection(objectRef, draggingDirection, atCurrent) {

  if (objectRef.previousDragDirection != draggingDirection) {
    if (atCurrent == 0 && objectRef.timeDirection == 1) {
      moveForward(objectRef, draggingDirection);
    } else if (atCurrent == 1 && objectRef.timeDirection == -1) {
      moveBackward(objectRef, draggingDirection);
    }
  }
}

/**Updates variables for dragging along the sine wave:
 *  pathDirection: vertical direction of the approaching portion of the sine wave (e.g., at next view)
 *  value: of the stationary object
 *  passedMiddle: a flag to determine how to calculate the interpolation (0: interp is between 0 and <0.5,
 *  1: interp is between 0.5 and < 1)
 * */
function setSineWaveVariables(objectRef, pathDirection, value, passedMiddle) {
  objectRef.passedMiddle = passedMiddle;
  objectRef.pathDirection = pathDirection;
  objectRef.peakValue = (pathDirection == 1) ? (value - objectRef.amplitude) : (objectRef.amplitude + value);
}
//////////////////////Indicators along the hint path//////////////////////

/** Appends a progress indicator to the svg (with id "progress"), if there isn't already one
 *  data: 2d array of points for drawing the entire hint path line
 * */
function appendProgress(objectRef, data) {

  if (objectRef.svg.select("#progress").empty()) {
    //Add the blur filter to the SVG so other elements can call it
    objectRef.svg.append("svg:defs").append("svg:filter")
      .attr("id", "blurProgress")
      .append("svg:feGaussianBlur")
      .attr("stdDeviation", 3);

    objectRef.svg.select("#hintPath").append("path").datum(data)
      .attr("id", "progress").attr("filter", "url(#blurProgress)");
  }
}


/** Re-draws a progress indicator using the stroke dash interpolation example by mike bobstock:
 * http://bl.ocks.org/mbostock/5649592
 * interpAmount: how far travelled between views
 * translateAmount: to animate the progress path with the hint path
 * type: of progress path (small segments or entire path)
 * */
function drawProgress(objectRef, interpAmount, translateAmount, type) {
  var myRef = objectRef;

  if (!objectRef.svg.select("#progress").empty()) {

    //Create the interpolation function and get the total length of the path
    var length = d3.select("#progress").node().getTotalLength();
    var interpStr = d3.interpolateString("0," + length, length + "," + length);
    //Make some adjustments according to the type of progress path selected
    if (type == 0 && interpAmount == 0) { //Small progress paths, at the point of transitioning views
      this.svg.select("#progress").attr("d", function (d) { return myRef.hintPathGenerator([d[myRef.currentView], d[myRef.nextView]]) });
    } else if (type == 1) { //Large progress path, adjust the interpolation
      interpAmount = (objectRef.currentView - 1) / objectRef.lastView + interpAmount / objectRef.lastView;
    }

    //Re-colour the progress path
    this.svg.select("#progress").attr("stroke-dasharray", interpStr(interpAmount))
      .attr("transform", "translate(" + (-translateAmount) + ")");
  }
}
/** Sets the type of hint path to be drawn
 *  Type: Full hint path = 0, partial hint path (removed labels) = 1
 * */
function setHintPathType(objectRef, type) {
  objectRef.hintPathType = type;
}

//////////////////////Indicators along a sine wave (interaction path)//////////////////////

/** Appends an anchor to the svg (with id 'anchor), if there isn't already one
 *  x,y: starting position of the anchor
 *  type: of anchor 0 - inner elastic, 1 - outer elastic, 2 - circle, 3 - circle and elastic
 * */
function appendAnchor(objectRef, x, y, type) {
  var myRef = objectRef;
  if (objectRef.svg.select("#anchor").empty()) {
    if (type == 0 || type == 1) { //Inner or outer elastic
      objectRef.svg.select("#hintPath").append("path").datum([[x, y]]).style("stroke", "none")
        .attr("d", myRef.hintPathGenerator).attr("id", "anchor");
    } else if (type == 2) { //Circle
      objectRef.svg.select("#hintPath").append("circle").attr("cx", x).attr("cy", y).attr("r", 4).style("stroke", "none").attr("id", "anchor");
    } else if (type == 3) { //Circle + elastic
      objectRef.svg.select("#hintPath").append("g").attr("id", "anchor");
      objectRef.svg.select("#anchor").append("circle").attr("cx", x).attr("cy", y).attr("r", 4).style("stroke", "none");
      objectRef.svg.select("#anchor").append("path").datum([[x, y]]).style("stroke", "none")
        .attr("d", objectRef.hintPathGenerator);
    }
  }
}

/** Re-draws the anchor, depends on the type of anchor (see function above for the scheme)
 * objY = y-value of the data object
 * mouseX, mouseY: mouse coordinates during dragging
 * newY = newY lies along the sine wave somewhere
 * */
function redrawAnchor(objectRef, objY, mouseX, mouseY, newY, type) {
  var myRef = objectRef;
  if (type == 0) { //Outer elastic
    objectRef.svg.select("#anchor").attr("d", function (d) { return myRef.hintPathGenerator([[mouseX, mouseY], [d[0][0], newY]]); })
      .style("stroke", "#c7c7c7");
  } else if (type == 1) { //Inner Elastic
    objectRef.svg.select("#anchor").attr("d", function (d) { return myRef.hintPathGenerator([[d[0][0], objY], [d[0][0], newY]]); })
      .style("stroke", "#c7c7c7");
  } else if (type == 2) { //Circle
    objectRef.svg.select("#anchor").attr("cy", newY).style("stroke", "#c7c7c7");
  } else if (type == 3) { //Circle and elastic
    objectRef.svg.select("#anchor").select("path").attr("d", function (d) { return myRef.hintPathGenerator([[d[0][0], objY], [d[0][0], newY]]); })
      .style("stroke", "#c7c7c7");
    objectRef.svg.select("#anchor").select("circle").attr("cy", newY).style("stroke", "#c7c7c7");
  }
}

/**Hides an anchor by removing it's colour
 * */
function hideAnchor(objectRef, type) {
  if (type == 0 || type == 1 || type == 2) {
    objectRef.svg.select("#anchor").style("stroke", "none");
  } else if (type == 3) {
    objectRef.svg.select("#anchor").select("circle").style("stroke", "none");
    objectRef.svg.select("#anchor").select("path").style("stroke", "none");
  }
}
/** Removes an anchor from the svg
 * */
function removeAnchor(objectRef) {
  if (!objectRef.svg.select("#anchor").empty()) {
    objectRef.svg.select("#anchor").remove();
  }
}
/**Draws a colour scale showing what is assigned to each colour
 * colours: the different colours to map the values to
 * labels: the labels to identify each colour
 * x,y: left and top margins of the scale
 * w,h: of the colour blocks in the legend
 * spacing: between the colour blocks (optional, but must be 1 if none is desired)
 * */
function drawColourLegend(objectRef, colours, labels, x, y, w, h, spacing) {

  //Prepare the data for drawing the scale
  objectRef.svg.selectAll(".legend").data(colours.map(function (d, i) {
    var yCoord = i * h * spacing + y;
    return { colour: d, id: i, label: labels[i], y: yCoord };
  })).enter().append("g").attr("class", "legend");

  //Draw the colours as rectangles
  objectRef.svg.selectAll(".legend").append("rect")
    .attr("x", x).attr("y", function (d) { return d.y })
    .attr("width", w).attr("height", h)
    .style("fill", function (d) { return d.colour });

  //Draw the labels for each colour
  objectRef.svg.selectAll(".legend").append("text").attr("x", x + w + 5)
    .attr("y", function (d) { return (d.y + h / 2 * spacing) })
    .style("fill", "#666")
    .text(function (d) { return d.label })
}
/** Search for ambiguous cases in a list of values along the hint path.  Ambiguous objects are tagged as 1, this is stored in
 *  ambiguousObjs
 *
 *  To alleviate interaction in regions where the heights are very similar (within valueThreshold), we also consider
 *  these objects to be stationary in value.
 * */
function checkAmbiguous(objectRef, values, valueThreshold) {
  var j, currentObj;
  var ambiguousObjs = [];
  var length = values.length;
  objectRef.isAmbiguous = 0;

  for (j = 0; j <= length; j++) {
    ambiguousObjs[j] = [0];
  }

  //Search for values that match
  for (j = 0; j < length; j++) {
    currentObj = values[j];
    for (var k = 0; k < length; k++) {
      if (j != k && Math.abs(values[k] - currentObj) <= valueThreshold) { //A repeated (or almost repeated) value is found
        if (Math.abs(k - j) == 1) { //Stationary value
          objectRef.isAmbiguous = 1;
          ambiguousObjs[j] = [1];
        }

      }
    }
  }
  if (objectRef.isAmbiguous == 1) {
    //Generate points for drawing an interaction path
    return findInteractionPaths(ambiguousObjs, values, valueThreshold);
  }
  return [ambiguousObjs, []];
}
/** Creates an array containing all data for drawing a sine wave:
 * interactionPaths[] = [[points for the sine wave]..number of paths]
 * */
function findInteractionPaths(ambiguousObjs, values, valueThreshold) {
  var indices = [];
  var pathNumber = 0;
  var firstPath = false;
  var length = values.length;
  var interactionPaths = [];

  for (var j = 0; j < length; j++) {
    if (ambiguousObjs[j][0] == 1) {
      if (j != 0 && (ambiguousObjs[j - 1][0] != 1 ||
        (ambiguousObjs[j - 1][0] == 1 && Math.abs(values[j] - values[j - 1]) > valueThreshold))) { //Starting a new path
        if (!firstPath) {
          firstPath = true;
        } else {
          interactionPaths.push(indices);
          indices = [];
          pathNumber++;
        }
      }
      ambiguousObjs[j].push(pathNumber);
      indices.push(j);
    }
  }
  interactionPaths.push(indices);

  return [ambiguousObjs, interactionPaths];
}
/**Highlights data object(s) with the specified id in the highlightColour from the class of data objects
 * Used for completing the tasks in the user evaluation
 * id2 and newColour2 are optional, if N/A then set it as -1
 * */
function highlightDataObject(id1, id2, className, origColour, newColour1, newColour2) {
  d3.selectAll(className).style("fill", function (d) {
    return (d.id == id1) ? newColour1 : (d.id == id2) ? newColour2 : origColour;
  });
}
/**Function which shows info (year labels, middle ticks) on the slider widget */
function showSliderInfo(sliderRef) {
  sliderRef.widget.selectAll(".tickLabels").style("fill", sliderRef.displayColour);
}
/**Function which hides info (year labels, middle ticks) on the slider widget.
 * This is used during the user evaluation to remove information about time */
function hideSliderInfo(sliderRef) {
  //Hide the tick labels
  sliderRef.widget.selectAll(".tickLabels").style("fill", "none");
  //Hide all ticks except the end ones
  /** sliderRef.widget.selectAll(".ticks")
       .style("fill",function(d,i){return ((i==0)||(i==sliderRef.numTicks-1))?sliderRef.displayColour:"none"});*/

}