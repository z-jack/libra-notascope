


/** Updates the view variables to move the visualization forward
 * (passing the next view), also sets the direction travelling in time
 * draggingDirection: set to 1/-1 (physical dragging direction of user)
 *                    set to 0, if unknown
 * */
function moveForward(objectRef,draggingDirection){

    if (objectRef.nextView < objectRef.lastView){ 
        objectRef.currentView = objectRef.nextView;
        objectRef.nextView++;
        
    }else if (draggingDirection !=0){
        if (draggingDirection != objectRef.previousDragDirection){ 
            objectRef.timeDirection = (objectRef.timeDirection==1)?-1:1;
        }
    }
}
/**Finds the pixel distance from the user's point to the dragged data object's point
 * @return the pixel distance (calculated with the euclidean distance formula)
 * */
function findPixelDistance (userX,userY,objectX,objectY){
    var term1 = userX - objectX;
    var term2 = userY - objectY;
    return Math.sqrt((term1*term1)+(term2*term2));
}
/** Updates the view tracking variables when the view is being changed by an external
 * visualization (e.g., slider)
 * */
function changeView (objectRef,newView){
    if (newView ==0){
        objectRef.currentView = newView
        objectRef.nextView = newView+1;
    }else if (newView == objectRef.lastView){
        objectRef.nextView = newView;
        objectRef.currentView = newView -1;
    }else {
        objectRef.currentView = newView;
        objectRef.nextView = newView + 1;
    }
}
/**Adjusts the view variables in case they have gone out of bounds
 * @return the view to draw the visualization at */
function adjustView (objectRef){
    if (objectRef.nextView > objectRef.lastView){
        objectRef.nextView--;
        objectRef.currentView--;
        objectRef.interpValue = 0;
        return objectRef.nextView;
    }else if (objectRef.nextView == objectRef.lastView){
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
function moveBackward (objectRef,draggingDirection){
    if (objectRef.currentView > 0){ 
        objectRef.nextView = objectRef.currentView;
        objectRef.currentView--;
        objectRef.interpValue = 0;
        
    }else if (draggingDirection !=0){
        if (draggingDirection != objectRef.previousDragDirection){ 
            objectRef.timeDirection = (objectRef.timeDirection==1)?-1:1;
        }
    }
}
/** Checks if the mouse is in bounds defined by a and b, updates the interpolation amount
 *  mouse: the mouse position
 *  @return start,end: boundary values are returned if the given
 *                     mouse position is equal to or has crossed it
 *          mouse: The mouse value, if in bounds
 * */
function checkBounds (objectRef,a,b,mouse){
    
    var start,end;
    if (a>b){
        end = a;
        start =b;
    }else{
        start = a;
        end = b;
    }

    
    if (mouse <= start) {
        return start;
    }else if (mouse >= end) {
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
function findInterpolation (objectRef,a,b,mouse,ambiguity,draggingDirection){
    var distanceTravelled, currentInterpValue;
    var total = Math.abs(b - a);
    
    if (ambiguity == 0){
        distanceTravelled = Math.abs(mouse-a);
        currentInterpValue = distanceTravelled/total;
    }else{
        if (objectRef.passedMiddle ==0 ){ 
            distanceTravelled = Math.abs(mouse - a);
            currentInterpValue = distanceTravelled/(total*2);
        }else{ 
            distanceTravelled = Math.abs(mouse - b);
            currentInterpValue = (distanceTravelled+total)/(total*2);
        }
    }
    
    if (draggingDirection != objectRef.previousDragDirection){
        objectRef.timeDirection = (objectRef.timeDirection==-1) ? 1:-1;
    }
    

    
    objectRef.interpValue = currentInterpValue;
}
/**Infers the time direction when user arrives at areas on the hint path where interaction is ambiguous (e.g., peaks)
 * Inference is based on previous direction travelling over time.  The views are updated (forward or backward)
 * whenever the dragging direction changes.
 * draggingDirection: physical dragging direction of the user
 * atCurrent: the view which user is currently at or passing (=0 if at next view, =1 if at current)
 * */
function inferTimeDirection (objectRef,draggingDirection,atCurrent){

    if (objectRef.previousDragDirection != draggingDirection){
        if (atCurrent==0 && objectRef.timeDirection ==1){
            moveForward(objectRef,draggingDirection);
        }else if (atCurrent ==1 && objectRef.timeDirection ==-1){
            moveBackward(objectRef,draggingDirection);
        }
    }
}

/**Updates variables for dragging along the sine wave:
 *  pathDirection: vertical direction of the approaching portion of the sine wave (e.g., at next view)
 *  value: of the stationary object
 *  passedMiddle: a flag to determine how to calculate the interpolation (0: interp is between 0 and <0.5,
 *  1: interp is between 0.5 and < 1)
 * */
function setSineWaveVariables (objectRef,pathDirection,value,passedMiddle){
    objectRef.passedMiddle = passedMiddle;
    objectRef.pathDirection = pathDirection;
    objectRef.peakValue = (pathDirection==1)?(value-objectRef.amplitude):(objectRef.amplitude+value);
}


/** Appends a progress indicator to the svg (with id "progress"), if there isn't already one
 *  data: 2d array of points for drawing the entire hint path line
 * */
function appendProgress (objectRef,data){

    if (objectRef.svg.select("#progress").empty()){
        
        objectRef.svg.append("svg:defs").append("svg:filter")
            .attr("id", "blurProgress")
            .append("svg:feGaussianBlur")
            .attr("stdDeviation", 3);

        objectRef.svg.select("#hintPath").append("path").datum(data)
            .attr("id","progress").attr("filter", "url(#blurProgress)");
    }
}


/** Re-draws a progress indicator using the stroke dash interpolation example by mike bobstock:
 * http:
 * interpAmount: how far travelled between views
 * translateAmount: to animate the progress path with the hint path
 * type: of progress path (small segments or entire path)
 * */
function drawProgress (objectRef,interpAmount,translateAmount,type){
    var myRef = objectRef;

    if (!objectRef.svg.select("#progress").empty()){

        
        var length = d3.select("#progress").node().getTotalLength();
        var interpStr = d3.interpolateString("0," + length, length + "," + length);
        
        if (type == 0 && interpAmount==0){ 
            this.svg.select("#progress").attr("d", function (d) {return myRef.hintPathGenerator([d[myRef.currentView],d[myRef.nextView]])});
        }else if (type==1){ 
            interpAmount = (objectRef.currentView-1)/objectRef.lastView + interpAmount/objectRef.lastView;
        }

        
        this.svg.select("#progress").attr("stroke-dasharray",interpStr(interpAmount))
            .attr("transform","translate(" + (-translateAmount) + ")");
    }
}
/** Sets the type of hint path to be drawn
 *  Type: Full hint path = 0, partial hint path (removed labels) = 1
 * */
function setHintPathType (objectRef,type){
    objectRef.hintPathType = type;
}



/** Appends an anchor to the svg (with id 'anchor), if there isn't already one
 *  x,y: starting position of the anchor
 *  type: of anchor 0 - inner elastic, 1 - outer elastic, 2 - circle, 3 - circle and elastic
 * */
function appendAnchor (objectRef,x,y,type){
    var myRef = objectRef;
    if (objectRef.svg.select("#anchor").empty()){
        if (type ==0 || type ==1){ 
            objectRef.svg.select("#hintPath").append("path").datum([[x,y]]).style("stroke","none")
                .attr("d", myRef.hintPathGenerator).attr("id","anchor");
        }else if (type == 2){ 
            objectRef.svg.select("#hintPath").append("circle").attr("cx", x).attr("cy", y).attr("r",4).style("stroke","none").attr("id","anchor");
        }else if (type==3){ 
            objectRef.svg.select("#hintPath").append("g").attr("id","anchor");
            objectRef.svg.select("#anchor").append("circle").attr("cx", x).attr("cy", y).attr("r",4).style("stroke","none");
            objectRef.svg.select("#anchor").append("path").datum([[x,y]]).style("stroke","none")
                .attr("d", objectRef.hintPathGenerator);
        }
    }
}

/** Re-draws the anchor, depends on the type of anchor (see function above for the scheme)
 * objY = y-value of the data object
 * mouseX, mouseY: mouse coordinates during dragging
 * newY = newY lies along the sine wave somewhere
 * */
function redrawAnchor (objectRef,objY,mouseX,mouseY,newY,type){
    var myRef = objectRef;
    if (type ==0){ 
        objectRef.svg.select("#anchor").attr("d",function (d) {return myRef.hintPathGenerator([[mouseX,mouseY],[d[0][0],newY]]);})
            .style("stroke","#c7c7c7");
    }else if (type == 1){ 
        objectRef.svg.select("#anchor").attr("d",function (d) {return myRef.hintPathGenerator([[d[0][0],objY],[d[0][0],newY]]);})
            .style("stroke","#c7c7c7");
    }else if (type ==2){ 
        objectRef.svg.select("#anchor").attr("cy",newY).style("stroke","#c7c7c7");
    }else if (type==3){ 
        objectRef.svg.select("#anchor").select("path").attr("d",function (d) {return myRef.hintPathGenerator([[d[0][0],objY],[d[0][0],newY]]);})
            .style("stroke","#c7c7c7");
        objectRef.svg.select("#anchor").select("circle").attr("cy",newY).style("stroke","#c7c7c7");
    }
}

/**Hides an anchor by removing it's colour
 * */
function hideAnchor (objectRef,type){
    if (type == 0 || type == 1 || type ==2){
        objectRef.svg.select("#anchor").style("stroke","none");
    }else if (type ==3){
        objectRef.svg.select("#anchor").select("circle").style("stroke","none");
        objectRef.svg.select("#anchor").select("path").style("stroke","none");
    }
}
/** Removes an anchor from the svg
 * */
function removeAnchor (objectRef){
    if (!objectRef.svg.select("#anchor").empty()){
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
function drawColourLegend (objectRef,colours,labels,x,y,w,h,spacing){

    
    objectRef.svg.selectAll(".legend").data(colours.map(function (d,i) {
        var yCoord = i*h*spacing + y ;
        return {colour:d,id:i,label:labels[i],y:yCoord};
    })).enter().append("g").attr("class","legend");

    
    objectRef.svg.selectAll(".legend").append("rect")
        .attr("x", x).attr("y",function(d){return d.y})
        .attr("width",w).attr("height",h)
        .style("fill",function (d){return d.colour});

    
    objectRef.svg.selectAll(".legend").append("text").attr("x",x+w+5)
        .attr("y",function(d){return (d.y + h/2*spacing)})
		.style("fill","#666")
        .text(function (d){return d.label})
}
/** Search for ambiguous cases in a list of values along the hint path.  Ambiguous objects are tagged as 1, this is stored in
 *  ambiguousObjs
 *
 *  To alleviate interaction in regions where the heights are very similar (within valueThreshold), we also consider
 *  these objects to be stationary in value.
 * */
function checkAmbiguous(objectRef,values,valueThreshold){
    var j, currentObj;
    var ambiguousObjs = [];
    var length = values.length;
    objectRef.isAmbiguous = 0;

    for (j=0;j<=length;j++){
        ambiguousObjs[j] = [0];
    }

    
    for (j=0;j<length;j++){
        currentObj = values[j];
        for (var k=0;k<length;k++){
            if (j!=k && Math.abs(values[k] - currentObj)<= valueThreshold){ 
                    if (Math.abs(k-j)==1){ 
                        objectRef.isAmbiguous = 1;
                        ambiguousObjs[j] = [1];
                    }

            }
        }
    }
    if (objectRef.isAmbiguous ==1){
        
        return findInteractionPaths(ambiguousObjs,values,valueThreshold);
    }
    return [ambiguousObjs,[]];
}
/** Creates an array containing all data for drawing a sine wave:
 * interactionPaths[] = [[points for the sine wave]..number of paths]
 * */
function findInteractionPaths(ambiguousObjs,values,valueThreshold){
    var indices = [];
    var pathNumber = 0;
    var firstPath = false;
    var length = values.length;
    var interactionPaths = [];

    for (var j=0; j< length;j++){
        if (ambiguousObjs[j][0]==1){
            if (j!=0 && (ambiguousObjs[j-1][0]!=1||
                (ambiguousObjs[j-1][0]==1 && Math.abs(values[j]-values[j-1])>valueThreshold))){ 
                if (!firstPath){
                    firstPath = true;
                }else{
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

    return [ambiguousObjs,interactionPaths];
}
/**Highlights data object(s) with the specified id in the highlightColour from the class of data objects
 * Used for completing the tasks in the user evaluation
 * id2 and newColour2 are optional, if N/A then set it as -1
 * */
function highlightDataObject (id1,id2,className,origColour,newColour1,newColour2){
    d3.selectAll(className).style("fill", function (d){
        return (d.id==id1)?newColour1:(d.id==id2)?newColour2:origColour;
    });
}
/**Function which shows info (year labels, middle ticks) on the slider widget */
function showSliderInfo(sliderRef){
    sliderRef.widget.selectAll(".tickLabels").style("fill",sliderRef.displayColour);
}
/**Function which hides info (year labels, middle ticks) on the slider widget.
 * This is used during the user evaluation to remove information about time */
function hideSliderInfo(sliderRef){
   
    sliderRef.widget.selectAll(".tickLabels").style("fill","none");
   
   /** sliderRef.widget.selectAll(".ticks")
        .style("fill",function(d,i){return ((i==0)||(i==sliderRef.numTicks-1))?sliderRef.displayColour:"none"});*/

}

/** Draws partial hint paths for each visualization
 *  Will be used in the user study
 * */

 
 var lineWidth= 12;
 var lineThickness = 2;
 var pathColour = "#EDEDED";
     
 
 
 var tickColour = "#EDEDED";
 var forwardPathLength = 0;
 var backwardPathLength = 0;
 var interpolateStroke = function (length,amount){
     return  d3.interpolateString("0," + length, length + "," + length)(amount);
 }
 
  /** Displays small hint path by appending its svg components to the main svg
  *  translate: amount the path should be translated by in order to align with the
  *  dragged data object
  *  pathData: an array of points to appear along the entire hint path
  * */
 function drawPartialHintPath_line (objectRef,translate,pathData){
 
       
       
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","path").style("stroke",pathColour)
         .attr("d", function (d) {
             return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                 objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         });
 
      
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","forwardPath");
 
     
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","backwardPath").style("stroke","none");
 
     
     objectRef.svg.select("#hintPath").append("path").datum(pathData).attr("id","backwardMarker")
         .attr("transform","translate("+(-translate)+")").style("stroke","none").style("stroke-width",lineThickness);
     objectRef.svg.select("#hintPath").append("path").datum(pathData).attr("id","forwardMarker")
         .attr("transform","translate("+(-translate)+")").style("stroke","none").style("stroke-width",lineThickness);
     objectRef.svg.select("#hintPath").append("path").datum(pathData).attr("id","currentMarker")
         .attr("transform","translate("+(-translate)+")").style("stroke","none").style("stroke-width",lineThickness);
 
     if (objectRef.nextView != objectRef.lastView){ 
         objectRef.svg.select("#nextPath").attr("d", function (d) {
             return objectRef.hintPathGenerator([d[objectRef.nextView],d[objectRef.nextView+1]]);
             
         });
     }
 
     
     if (objectRef.isAmbiguous ==1){
         objectRef.svg.select("#hintPath").selectAll(".interactionPath").style("stroke","none");
     }
 }
 /**Redraws the shortened hint path, where the full path segment is always displayed between next and current view.
  * Depending on the time direction, the next path segment the user is approaching is partially visible.
  * Currently, the entire interaction path is displayed, because setting the stroke-dasharray property won't work
  * */
 
 function redrawPartialHintPath_line (objectRef,ambiguousObjects){
 
     
     
     if (objectRef.timeDirection == 1){ 
 
         if (ambiguousObjects.length > 0){
             if (ambiguousObjects[objectRef.nextView][0]==1){
                 objectRef.svg.select("#interactionPath"+ambiguousObjects[objectRef.nextView][1]).style("stroke",pathColour);
                 return;
             }else{
                 objectRef.svg.selectAll(".interactionPath").style("stroke","none");
             }
         }
         
         objectRef.svg.select("#backwardPath").style("stroke","none");
         objectRef.svg.select("#backwardMarker").style("stroke","none");
 
         
         forwardPathLength = d3.select("#forwardPath").node().getTotalLength();
 
         
         objectRef.svg.select("#path").attr("d", function (d) {
             return objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         });
         objectRef.svg.select("#currentMarker").attr("d", function (d) {
             return objectRef.hintPathGenerator([[d[objectRef.nextView][0]-lineWidth,d[objectRef.nextView][1]],
                 [d[objectRef.nextView][0]+lineWidth,d[objectRef.nextView][1]]]);
         }).style("stroke",tickColour).style("stroke-width",lineThickness);
 
         if (objectRef.nextView < objectRef.lastView){
             objectRef.svg.select("#forwardPath").attr("stroke-dasharray",interpolateStroke(forwardPathLength,objectRef.interpValue)).style("stroke",pathColour)
                 .attr("d", function (d) {
                     return objectRef.hintPathGenerator([d[objectRef.nextView],d[objectRef.nextView+1]]);
                 }).attr("filter", "url(#blur2)");
             if (objectRef.interpValue > 0.95){
                 objectRef.svg.select("#forwardMarker").style("stroke",tickColour).style("stroke-width",lineThickness)
                     .attr("d", function (d) {
                         return objectRef.hintPathGenerator([[d[objectRef.nextView+1][0]-lineWidth,d[objectRef.nextView+1][1]],
                             [d[objectRef.nextView+1][0]+lineWidth,d[objectRef.nextView+1][1]]]);
                     });
             }
         }
 
     }else{ 
         if (ambiguousObjects.length > 0){
             if (ambiguousObjects[objectRef.currentView][0]==1){
                 objectRef.svg.select("#interactionPath"+ambiguousObjects[objectRef.currentView][1]).style("stroke",pathColour);
                 return;
             }else{
                 objectRef.svg.selectAll(".interactionPath").style("stroke","none");
             }
         }
         
         objectRef.svg.select("#forwardPath").style("stroke","none");
         objectRef.svg.select("#forwardMarker").style("stroke","none");
 
         
        backwardPathLength = d3.select("#backwardPath").node().getTotalLength();
 
         
         objectRef.svg.select("#path").attr("d", function (d) {
             return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                 objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         }).attr("filter", "url(#blur2)");
 
         objectRef.svg.select("#currentMarker").attr("d", function (d) {
             return objectRef.hintPathGenerator([[d[objectRef.currentView][0]-lineWidth,d[objectRef.currentView][1]],
                 [d[objectRef.currentView][0]+lineWidth,d[objectRef.currentView][1]]]);
         }).style("stroke",tickColour).style("stroke-width",lineThickness);
 
         if (objectRef.currentView > 0){
             objectRef.svg.select("#backwardPath").attr("stroke-dasharray",interpolateStroke(backwardPathLength,(1-objectRef.interpValue)))
                 .style("stroke",pathColour).attr("d", function (d) {
                     return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                         objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.currentView-1]]);
                 }).attr("filter", "url(#blur2)");
             if (objectRef.interpValue < 0.05){
                 objectRef.svg.select("#backwardMarker").style("stroke",tickColour).style("stroke-width",lineThickness)
                     .attr("d", function (d) {
                         return objectRef.hintPathGenerator([[d[objectRef.currentView-1][0]-lineWidth,d[objectRef.currentView-1][1]],
                             [d[objectRef.currentView-1][0]+lineWidth,d[objectRef.currentView-1][1]]]);
                     });
             }
         }
 
     }
 }
 /**Hides the small hint path whenever the user stops dragging */
 function hidePartialHintPath (objectRef){
     objectRef.svg.select("#hintPath").selectAll("path").style("stroke","none");
 }
 
 
 var radius = 10;
 var radiusThickness = 1;
 var circleColour = "#BDBDBD";
 
 /** Displays small hint path by appending its svg components to the main svg
  *  translate: amount the path should be translated by in order to align with the
  *  dragged data object
  *  pathData: an array of points to appear along the entire hint path
  * */
 function drawPartialHintPath_line (objectRef,translate,pathData){
 
     
     
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","path").style("stroke",pathColour)
         .attr("d", function (d) {
             return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                 objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         });
 
     
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","forwardPath");
 
     
     objectRef.svg.select("#hintPath").append("path").datum(pathData)
         .attr("transform","translate("+(-translate)+")").attr("id","backwardPath").style("stroke","none");
 
     
     objectRef.svg.select("#hintPath").append("circle").datum(pathData).attr("id","backwardMarker")
         .style("stroke","none").style("fill","none").style("stroke-width",radiusThickness)
         .attr("cx",0).attr("cy",0).attr("r",radius);
     objectRef.svg.select("#hintPath").append("circle").datum(pathData).attr("id","forwardMarker")
         .style("stroke","none").style("fill","none").attr("cx",0).attr("cy",0).attr("r",radius).style("stroke-width",radiusThickness);
     objectRef.svg.select("#hintPath").append("circle").datum(pathData).attr("id","currentMarker")
        .style("stroke","none").style("fill","none").style("stroke-width",radiusThickness).attr("cx",0).attr("cy",0).attr("r",radius);
 
     if (objectRef.nextView != objectRef.lastView){ 
         objectRef.svg.select("#nextPath").attr("d", function (d) {
             return objectRef.hintPathGenerator([d[objectRef.nextView],d[objectRef.nextView+1]]);
             
         });
     }
 
     
     if (objectRef.isAmbiguous ==1){
         objectRef.svg.select("#hintPath").selectAll(".interactionPath").style("stroke","none");
     }
 }
 /**Redraws the shortened hint path, where the full path segment is always displayed between next and current view.
  * Depending on the time direction, the next path segment the user is approaching is partially visible.
  * Currently, the entire interaction path is displayed, because setting the stroke-dasharray property won't work
  * */
 function redrawPartialHintPath_line (objectRef,ambiguousObjects){
 
     
     
     if (objectRef.timeDirection == 1){ 
 
         if (ambiguousObjects.length > 0){
             if (ambiguousObjects[objectRef.nextView][0]==1){
                 objectRef.svg.select("#interactionPath"+ambiguousObjects[objectRef.nextView][1]).style("stroke",pathColour);
                 return;
             }else{
                 objectRef.svg.selectAll(".interactionPath").style("stroke","none");
             }
         }
         
         objectRef.svg.select("#backwardPath").style("stroke","none");
         objectRef.svg.select("#backwardMarker").style("stroke","none");
 
         
         forwardPathLength = d3.select("#forwardPath").node().getTotalLength();
 
         
         objectRef.svg.select("#path").attr("d", function (d) {
             return objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         });
 
         objectRef.svg.select("#currentMarker").attr("cx", function (d) {return d[objectRef.nextView][0];})
             .attr("cy", function (d) {return d[objectRef.nextView][1];}).style("stroke",circleColour);
 
         if (objectRef.nextView < objectRef.lastView){
             objectRef.svg.select("#forwardPath").attr("stroke-dasharray",interpolateStroke(forwardPathLength,objectRef.interpValue)).style("stroke",pathColour)
                 .attr("d", function (d) {
                     return objectRef.hintPathGenerator([d[objectRef.nextView],d[objectRef.nextView+1]]);
                 }).attr("filter", "url(#blur2)");
             if (objectRef.interpValue > 0.95){
                 objectRef.svg.select("#forwardMarker").attr("cx", function (d) {return d[objectRef.nextView+1][0];})
                     .attr("cy", function (d) {return d[objectRef.nextView+1][1];}).style("stroke",circleColour);
             }
         }
 
     }else{ 
         if (ambiguousObjects.length > 0){
             if (ambiguousObjects[objectRef.currentView][0]==1){
                 objectRef.svg.select("#interactionPath"+ambiguousObjects[objectRef.currentView][1]).style("stroke",pathColour);
                 return;
             }else{
                 objectRef.svg.selectAll(".interactionPath").style("stroke","none");
             }
         }
         
         objectRef.svg.select("#forwardPath").style("stroke","none");
         objectRef.svg.select("#forwardMarker").style("stroke","none");
 
         
         backwardPathLength = d3.select("#backwardPath").node().getTotalLength();
 
         
         objectRef.svg.select("#path").attr("d", function (d) {
             return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                 objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.nextView]]);
         }).attr("filter", "url(#blur2)");
 
         objectRef.svg.select("#currentMarker").attr("cx", function (d) {return d[objectRef.currentView][0];})
             .attr("cy", function (d) {return d[objectRef.currentView][1];}).style("stroke",circleColour);
 
         if (objectRef.currentView > 0){
             objectRef.svg.select("#backwardPath").attr("stroke-dasharray",interpolateStroke(backwardPathLength,(1-objectRef.interpValue)))
                 .style("stroke",pathColour).attr("d", function (d) {
                     return (typeof(objectRef.hintPathGenerator) === "undefined")?d[objectRef.currentView]:
                         objectRef.hintPathGenerator([d[objectRef.currentView],d[objectRef.currentView-1]]);
                 }).attr("filter", "url(#blur2)");
             if (objectRef.interpValue < 0.05){
                 objectRef.svg.select("#backwardMarker").attr("cx", function (d) {return d[objectRef.currentView-1][0];})
                     .attr("cy", function (d) {return d[objectRef.currentView-1][1];}).style("stroke",circleColour);
             }
         }
 
     }
 }

 /** Constructor for a scatterplot visualization
 * w: width of the graph
 * h: height of the graph
 * p: a padding value, to format the axes
*/
function Scatterplot(w, h,p) {
    
    this.padding = p;
    this.width = w;
    this.height = h;
    this.pointRadius = 8;
    this.loopRadius = 40;
    this.xLabel ="";
    this.yLabel = "";
    this.graphTitle = "";
    this.hintPathType = 0;   
    
    this.loopCurrent = 0;
    this.loopNext = 1;
 
    
    this.svg = null;
    this.numPoints = -1; 
 
    
    this.currentView = 0;
    this.nextView = 1;
    this.lastView = -1;  
    this.mouseX = -1; 
    this.mouseY = -1;
    this.interpValue = 0; 
    this.labels = []; 
    this.ambiguousPoints = [];  
    this.loops = []; 
    this.timeDirection = 1; 
 
    
    this.halfPi = Math.PI/2;
    this.threePi_two = Math.PI*3/2;
    this.twoPi = Math.PI*2;
    this.pi = Math.PI;
 
    
    this.draggedPoint = -1;
    this.isAmbiguous = 0;  
 
    
    
    this.placeholder = function() {};
    this.clickHintLabelFunction = this.placeholder;
    this.hintPathGenerator =  d3.line().curve(d3.curveLinear);
 
    this.clickedPoints = []; 
       
    this.pointColour = "00A2E8";
    this.hintPathColour = "#aec7e8";
 
    this.hintPathPoints_flashlight = []; 
 }
  /** Append a blank svg and g container to the div tag indicated by "id", this is where the visualization
  *  will be drawn. Also, add a blur filter for the hint path effect.
  * */
 Scatterplot.prototype.init = function() {
 
     this.svg = d3.select("#mainSvg")
         .append("g").attr("id","gScatterplot")
         .attr("transform", "translate(" + this.padding + "," + this.padding + ")");
 
     
     this.svg.append("svg:defs").append("svg:filter")
         .attr("id", "blur").append("svg:feGaussianBlur")
         .attr("stdDeviation", 2);
 
     
     this.svg.append("svg:defs").append("svg:filter")
         .attr("id", "blurLoop").append("svg:feGaussianBlur")
         .attr("stdDeviation", 1);
 
     
     this.svg.append("svg:defs").append("svg:filter")
         .attr("id", "blur2").append("svg:feGaussianBlur")
         .attr("stdDeviation", 2);
 
     
     this.svg.append("svg:defs").append("svg:filter")
         .attr("id", "blurFlashlight").append("svg:feGaussianBlur")
         .attr("stdDeviation", 2);
 }
 /**Interpolates the value for a year with missing data by using surrounding points
  * points: the array of all points over time
  * year: the year index of the missing data
  * */
 Scatterplot.prototype.interpolateMissingPoint = function (points,year){
     var interpolator;
     if (year>0 && year < points.length-1){ 
        interpolator = d3.interpolate({x:points[year-1][0],y:points[year-1][1]},
             {x:points[year+1][0],y:points[year+1][1]});
     }else{
         interpolator = d3.interpolate({x:0,y:0},  
             {x:1,y:1});
     }
     return interpolator(0.5);
 }
 /** Appends an anchor to the svg, if there isn't already one
  * */
 Scatterplot.prototype.appendAnchor = function (){
     if (this.svg.select("#anchor").empty()){
         this.svg.select("#hintPath").append("circle")
          .attr("id","anchor").attr("r",this.pointRadius).style("stroke","none")
          .style("fill","none");
     }
 }
 /** Re-draws the anchor, based on the dragging along the loop
  * interp: amount along the loop to draw the anchor at
  * groupNumber: to select the id of the loop
  * */
 Scatterplot.prototype.redrawAnchor = function (interp,groupNumber){
     var loopPath = d3.select("#loop"+groupNumber).node();
     var totalLength = loopPath.getTotalLength();
     var newPoint = loopPath.getPointAtLength(totalLength*interp);
     this.svg.select("#anchor").attr("cx",newPoint.x).attr("cy",newPoint.y).style("stroke","#c7c7c7");
 }
 /**Hides the circle anchor by removing it's stroke colour
  * */
 Scatterplot.prototype.hideAnchor = function (){
     this.svg.select("#anchor").style("stroke","none");
 }
 /** Removes an anchor from the svg, if one is appended
  * */
 Scatterplot.prototype.removeAnchor = function (){
     if (!this.svg.select("#anchor").empty()){
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
 Scatterplot.prototype.updateDraggedPoint = function(id, mouseX, mouseY, nodes) {
    if (this.hintPathType == 1) {
        this.updateDraggedPoint_flashlight(id, mouseX, mouseY, nodes);
        return;
    }

    var closestPoint = this.findClosestPointOnPath(mouseX, mouseY, nodes);
    var newPoint = [closestPoint.x, closestPoint.y];
    var view = closestPoint.view;
    var interpAmount = closestPoint.interpAmount;

    var draggedPoint = this.svg.select("#displayPoints" + id);
    draggedPoint.attr("cx", newPoint[0]).attr("cy", newPoint[1]);
    this.animatePointLabel(id, newPoint[0], newPoint[1]);

    
    if (view < this.currentView) {
        this.nextView = this.currentView;
        this.currentView = view;
        this.interpValue = 1 - interpAmount;
    } else if (view >= this.nextView) {
        this.currentView = this.nextView;
        this.nextView = view + 1;
        this.interpValue = interpAmount;
    } else {
        this.currentView = view;
        this.nextView = view + 1;
        this.interpValue = interpAmount;
    }

    
    this.interpolatePoints(id, this.interpValue, this.currentView, this.nextView);

    
    this.mouseX = mouseX;
    this.mouseY = mouseY;
}
Scatterplot.prototype.findClosestPointOnPath = function(mouseX, mouseY, nodes) {
    var closestDistance = Infinity;
    var closestPoint = null;
    var closestView = -1;
    var interpAmount = 0;

    for (var i = 0; i < nodes.length - 1; i++) {
        var pt1 = nodes[i];
        var pt2 = nodes[i + 1];
        var closestPointOnSegment = this.findClosestPointOnSegment(mouseX, mouseY, pt1[0], pt1[1], pt2[0], pt2[1]);

        var distance = this.calculateDistance(mouseX, mouseY, closestPointOnSegment.x, closestPointOnSegment.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = closestPointOnSegment;
            closestView = i;
            interpAmount = closestPointOnSegment.t;
        }
    }

    return {
        x: closestPoint.x,
        y: closestPoint.y,
        view: closestView,
        interpAmount: interpAmount
    };
}
Scatterplot.prototype.findClosestPointOnSegment = function(x, y, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return {
        x: x1 + t * dx,
        y: y1 + t * dy,
        t: t
    };
}
 /** Re-draws the dragged point according to the mouse position, changing the hint path
  * display according to the flashlight design
  *  id: The id of the dragged point, for selecting by id
  *  mousex,y: the mouse coordinates
  *  nodes: the points along the hint path
  * */
 Scatterplot.prototype.updateDraggedPoint_flashlight = function(id,mouseX,mouseY,nodes){
   
     if (this.hintPathType==3){ 
 
     }
 
     this.drawHintPath_flashlight([mouseX,mouseY],nodes);
     
     this.svg.select("#displayPoints"+id).attr("cx",mouseX).attr("cy",mouseY);
     this.animatePointLabel(id,mouseX,mouseY);
 
     
     this.mouseX = mouseX;
     this.mouseY = mouseY;
 }
 /** Calculates the new position of the dragged point
  * id: of the dragged point
  * pt1, pt2: the boundary points (of current and next view)
  * @return the coordinates of the newPoint as an array [x,y]
  * */
 Scatterplot.prototype.dragAlongPath = function(id,pt1_x,pt1_y,pt2_x,pt2_y){
 
     
     var minDist = this.minDistancePoint(this.mouseX,this.mouseY,pt1_x,pt1_y,pt2_x,pt2_y);
     var newPoint = []; 
     var t = minDist[2]; 
 
     
     if (t<0){ 
         this.moveBackward();
         newPoint = [pt1_x,pt1_y];
     }else if (t>1){ 
         this.moveForward();
         newPoint= [pt2_x,pt2_y];
     }else{ 
         this.interpolatePoints(id,t,this.currentView,this.nextView);
         this.interpolateLabelColour(t);
         newPoint= [minDist[0],minDist[1]];
         
         this.timeDirection = this.findTimeDirection(t);
         this.interpValue = t; 
         if (this.hintPathType ==2){
           redrawPartialHintPath_line(this,this.ambiguousPoints);
         }
     }
     return newPoint;
 }
 /** Sets the time direction based on the interpolation amount, currently not needed for the interaction
  *  But can be used to log events.
  * @return: the new direction travelling in time
  * */
 Scatterplot.prototype.findTimeDirection = function (interpAmount){
     var direction = (interpAmount > this.interpValue)? 1 : (interpAmount < this.interpValue)?-1 : this.timeDirection;
 
     if (this.timeDirection != direction){ 
         console.log("switched directions "+direction+" currentInterp "+this.interpValue+" newInterp "+interpAmount+" "+this.currentView+" "+this.nextView);
     }
     return direction;
 }
 /** Updates the view variables to move the visualization forward
  * (passing the next view)
  * */
 Scatterplot.prototype.moveForward = function (){
     if (this.nextView < this.lastView){ 
         this.currentView = this.nextView;
         this.nextView++;
         this.timeDirection = 1;
         this.interpValue = 0;
     }
 }
 /** Updates the view variables to move the visualization backward
  * (passing the current view)
  * */
 Scatterplot.prototype.moveBackward = function (){
     if (this.currentView > 0){ 
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
 Scatterplot.prototype.interpolateLabelColour = function (interp){
     var ref = this;
     this.svg.selectAll(".hintLabels").attr("fill-opacity",function (d) {
             if (d.id ==ref.currentView){ 
                 return d3.interpolate(1,0.5)(interp);
             }else if (d.id == ref.nextView){ 
                 return d3.interpolate(0.5,1)(interp);
             }
             return 0.5;
         });
 }
 Scatterplot.prototype.dragAlongLoop = function (id,groupNumber,mouseX,mouseY){
 
     var loopData = this.svg.select("#loop"+groupNumber).data().map(function (d) {return [d.cx, d.cy,d.orientationAngle,d.points2,d.years]});   
     
     
     
 
 
     
     
     
    
     var loopPoints = loopData[0][3];
     var pt1_x = loopPoints[this.loopCurrent][0];
     var pt1_y = loopPoints[this.loopCurrent][1];
     var pt2_x = loopPoints[this.loopNext][0];
     var pt2_y = loopPoints[this.loopNext][1];
 
      var minDist = this.minDistancePoint(mouseX,mouseY,pt1_x,pt1_y,pt2_x,pt2_y);
      var newPoint = []; 
      var t = minDist[2]; 
 
       var angles = this.calculateMouseAngle(minDist[0],minDist[1],loopData[0][2],loopData[0][0],loopData[0][1]);
       var loopInterp = this.convertMouseToLoop_interp(angles[2]);
     
     
     var startYear = loopData[0][4][0];	
     var endYear = loopData[0][4][loopData[0][4].length-1];
     
     if (t<0){ 
         this.loopNext = this.loopCurrent;
         this.loopCurrent--;
         if (this.loopCurrent < 0){ 
            if(this.currentView > startYear){ 
                 this.moveBackward();
                 this.loopCurrent = 3;
                 this.loopNext = 4;
            }else{ 
                this.loopCurrent = 0;
                this.loopNext = 1;
                this.moveBackward();
            }
         }
         
     }else if (t>1){ 
        this.loopCurrent = this.loopNext;
        this.loopNext++;
        if (this.loopCurrent > 3){ 
             if (this.nextView < endYear){ 
                this.loopCurrent = 0;
                this.loopNext = 1;
                this.moveForward();
             }else{
                 this.loopCurrent = 3;
                 this.loopNext = 4;
                 this.moveForward();
             }
         }
         
     }else{ 
         
         this.interpAmount = angles[2];
         this.timeDirection = this.findTimeDirection(this.interpAmount,id);
         this.interpolatePoints(id,this.interpAmount,this.currentView,this.nextView);
         this.interpolateLabelColour(this.interpAmount);
         if (this.hintPathType ==2){
             redrawPartialHintPath_line(this,this.ambiguousPoints,this.id);
         }
     }	
     this.redrawAnchor(loopInterp,groupNumber);
 }
 /**Finds the angle of the mouse w.r.t the center of the loop
  * @return [angle,positiveAngle,interpAmount]
  * */
 Scatterplot.prototype.calculateMouseAngle = function (mouseX,mouseY,orientationAngle,loopCx,loopCy){
 
     var newAngle;
     var subtractOne = 0; 
 
     if (orientationAngle < this.halfPi && orientationAngle >= 0){ 
         newAngle = Math.atan2(mouseY - loopCy, loopCx - mouseX) + orientationAngle; 
     }else if (orientationAngle < this.twoPi && orientationAngle >= this.threePi_two){ 
         subtractOne = 1;
         newAngle = Math.atan2(loopCx - mouseX,mouseY - loopCy) - (orientationAngle - this.threePi_two);  
     }else if (orientationAngle < this.threePi_two && orientationAngle >= this.pi){ 
         newAngle =  Math.atan2(loopCy - mouseY, mouseX - loopCx) + (orientationAngle- this.pi); 
     }else{
         subtractOne = 1;
         newAngle = Math.atan2(mouseX - loopCx, loopCy - mouseY) -(orientationAngle - this.halfPi); 
     }
 
     var positiveAngle = (newAngle < 0)?((this.pi - newAngle*(-1))+this.pi):newAngle;
 
     var interpAmount = (subtractOne ==1)? (1-positiveAngle/this.twoPi) : (positiveAngle/this.twoPi);
 
     return  [newAngle,positiveAngle,interpAmount];
 }
 /** Adjusts the interpolation value of the mouse angle (1/0 mark is at the stationary point) to draw correctly on
  *  the loop (where 0.5 is at the stationary point)
  * */
 Scatterplot.prototype.convertMouseToLoop_interp = function (mouseInterp){
     return (mouseInterp >=0 && mouseInterp <0.5)?(mouseInterp+0.5):(mouseInterp-0.5);
 }
 /**"Animates" the rest of the points while one is being dragged
  * Uses the 't' parameter, which represents approximately how far along a line segment
  * the dragged point has travelled.  The positions of the rest of the points are interpolated
  * based on this t parameter and re-drawn at this interpolated position
  * id: The id of the dragged point
  * interpAmount: The t parameter, or amount to interpolate by
  * startView,endView: Define the range to interpolate across
  * */
 Scatterplot.prototype.interpolatePoints = function(id,interpAmount,startView,endView){
   var ref = this;
   this.svg.selectAll(".displayPoints").filter(function (d){return d.id!=id;})
       .each(function (d){
           var interpolator = d3.interpolate({x:d.nodes[startView][0],y:d.nodes[startView][1]},
               {x:d.nodes[endView][0],y:d.nodes[endView][1]}); 
           var newPoint = interpolator(interpAmount);
           
           d3.select(this).attr("cx",newPoint.x).attr("cy",newPoint.y);
 
           
           if (ref.clickedPoints.indexOf(d.id)!=-1) ref.animatePointLabel(d.id,newPoint.x,newPoint.y);
       })
 }
 /**Re-draws a point label according to the specified position (new position of the point) by
  * updating its x and y attributes
  * @param id of the point label
  * @param x,y, new position of the label
  * */
 Scatterplot.prototype.animatePointLabel = function (id,x,y){
     var ref = this;
     this.svg.select("#pointLabel"+id).attr("x", x).attr("y", y-ref.pointRadius);
 }
 /** Snaps to the nearest view once a dragged point is released
  *  Nearest view is the closest position (either current or next) to the
  *  most recent position of the dragged point. View tracking variables are
  *  updated according to which view is "snapped" to.
  *  id: The id of the dragged point
  *  points: All points along the hint path
  * */
 Scatterplot.prototype.snapToView = function( id, points) {
     if (this.hintPathType==1){ 
         this.snapToView_flashlight(id,points);
         return;
     }
     var distanceCurrent,distanceNext;
     if (this.ambiguousPoints[this.currentView][0] == 1 && this.ambiguousPoints[this.nextView][0] == 1){ 
        distanceCurrent = this.interpValue;
        distanceNext = 0.5;
     }else { 
         
         distanceCurrent = this.calculateDistance(this.mouseX,this.mouseY, points[this.currentView][0], points[this.currentView][1]);
         distanceNext = this.calculateDistance(this.mouseX,this.mouseY, points[this.nextView][0],points[this.nextView][1]);
     }
 
     
     if (distanceCurrent > distanceNext && this.nextView <= this.lastView){ 
         this.currentView = this.nextView;
         this.nextView = this.nextView +1;
      }
 
     
     this.redrawView(this.currentView);
 }
 /** Snaps to the nearest view once a dragged point is released
  *  Nearest view is the closest position
  *  id: The id of the dragged point
  *  points: All points along the hint path
  * */
 Scatterplot.prototype.snapToView_flashlight = function (id,points){
     var minDist = Number.MAX_VALUE;
     var viewToSnapTo = -1;
     var currentPointIndex = -1;
     
      for (var i=0;i<this.hintPathPoints_flashlight.length;i++){
          currentPointIndex = this.hintPathPoints_flashlight[i];
          var currentDist = this.calculateDistance(points[currentPointIndex][0],points[currentPointIndex][1],this.mouseX,this.mouseY);
          if (currentDist<minDist) {
              minDist = currentDist;
              viewToSnapTo = currentPointIndex;
          }
      }
     if (viewToSnapTo<this.lastView){
         this.currentView = viewToSnapTo;
         this.nextView = this.currentView+1;
     }
     this.drawHintPath_flashlight(points[viewToSnapTo],points);
     this.redrawView(viewToSnapTo);
 }
 /** Animates all points in the scatterplot along their hint paths from
  *  startView to endView, this function is called when "fast-forwarding"
  *  is invoked (by clicking a year label on the hint path)
  *  id: of the dragged point (if any)
  *  startView, endView: animation goes from start to end view
  *  Resources: http:
  *            http:
  * */
  Scatterplot.prototype.animatePoints = function( id, startView, endView) {
 
      if (this.hintPathType==1){ 
          this.redrawView(endView);
          return;
      }
 
      if (startView == endView)return;
      var ref = this;
      
      var direction = 1;
      if (startView>endView) direction=-1;
 
     
     var totalObjects = this.numPoints;
     var objectCounter = -1;
     var animateView = startView; 
 
     
     this.svg.selectAll(".displayPoints").each(animate());
 
     
     
     function animate() {
         objectCounter++;
         if (objectCounter==totalObjects) {
             animateView = animateView + direction;
             objectCounter = 0;
         }
 
         
         if (direction == 1 && animateView>=endView) {return};
         if (direction ==-1 && animateView<=endView) {return};
 
         return function(d) {
             
             d3.select(this).transition(400).ease("linear")
             .attr("cx",d.nodes[animateView][0])
             .attr("cy",d.nodes[animateView][1])
             .each("end", animate());
             ref.animatePointLabel(d.id, d.nodes[animateView][0], d.nodes[animateView][1]);
             
             if (d.id == id){
                 d3.selectAll(".hintLabels").attr("fill-opacity",function (b){ return ((b.id==animateView)?1:0.5)});
             }
         };
     }
 }
 /** Redraws the scatterplot's point labels at the specified view
  *  view: the view to draw
  * */
 Scatterplot.prototype.redrawPointLabels = function(view){
     var ref = this;
     this.svg.selectAll(".pointLabels").filter(function (d){return (ref.clickedPoints.indexOf(d.id)!=-1)})
         .attr("x",function (d){return d.nodes[view][0];})
         .attr("y",function (d){return d.nodes[view][1]-ref.pointRadius;});
 }
 /** Redraws the scatterplot at a specified view
  *  view: the view to draw
  *  NOTE: view tracking variables are not updated by this function
  * */
 Scatterplot.prototype.redrawView = function(view) {
     /**if (this.hintPathType==2){ 
         hideSmallHintPath(this);
     }*/
     if (this.hintPathType==0){ 
         this.hideAnchor();
         
         this.svg.selectAll(".hintLabels").attr("fill-opacity",function (d){ return ((d.id==view)?1:0.5)});
         this.svg.selectAll(".displayPoints")/**.transition().duration(300)*/
             .attr("cx",function (d){return d.nodes[view][0];})
             .attr("cy",function (d){return d.nodes[view][1];});
 
     }else if (this.hintPathType==1){ 
         this.svg.selectAll(".displayPoints").transition().duration(300)
             .attr("cx",function (d){return d.nodes[view][0];})
             .attr("cy",function (d){return d.nodes[view][1];});
     }
     this.redrawPointLabels(view);
 }
 /** Called each time a new point is dragged.  Searches for ambiguous regions, and draws the hint path
  *  */
 Scatterplot.prototype.selectPoint = function (point){
     
     var drawingView = adjustView(this);
 
     
    
 
    
    
    
 
     if (this.hintPathType ==0){ 
         this.drawHintPath(drawingView, point.nodes, point.interpYears);
     }else if (this.hintPathType==1){ 
         this.drawHintPath_flashlight(point.nodes[drawingView],point.nodes);
     }else if (this.hintPathType==2){ 
         drawPartialHintPath_line(this,0, point.nodes);
         redrawPartialHintPath_line(this,this.ambiguousPoints);
     }else if (this.hintPathType==3){ 
         this.drawHintPath(drawingView, point.nodes, point.interpYears);
     }
 
     if (this.clickedPoints.indexOf(point.id) ==-1) {
         this.clickedPoints.push(point.id);
         this.drawPointLabel(point.id);
     }
     var ref = this;
     
     this.svg.selectAll(".displayPoints").filter(function (d) {return (ref.clickedPoints.indexOf(d.id)==-1)})
         .transition().duration(300).style("fill-opacity", 0.3);
 }
 /** Draws a label at the top of the selected point
  * */
 
  Scatterplot.prototype.drawPointLabel = function (id){
     var ref = this;
     
     var gElement = this.svg.select("#gDisplayPoints"+id);
     gElement.append("text")
         .attr("x", function(d) {return d.nodes[ref.currentView][0];})
         .attr("y", function(d) {return d.nodes[ref.currentView][1]-ref.pointRadius; })
         .attr("class","pointLabels").attr("id",function (d){return "pointLabel"+ d.id})
         .text(function (d){return d.label;});
 
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
  Scatterplot.prototype.drawHintPath = function (view,points,interpPts){
      var ref = this;
     
     var adjustedPoints = this.placeLabels(points);
 
      this.svg.select("#hintPath").selectAll("text")
        .data(adjustedPoints.map(function (d,i) {
             return {x:d[0]+ ref.pointRadius,y:d[1]+ ref.pointRadius,id:i}
         })).enter().append("svg:text")
         .text(function(d,i) {
              if (interpPts[i]==1) return "";  
              return ref.labels[d.id];
          }).attr("x", function(d) {return d.x;})
         .attr("y", function (d) {  return d.y; })
         .attr("class","hintLabels")
         .attr("fill-opacity",function (d){ return ((d.id==view)?1:0.5)})
         .attr("id",function (d){return "hintLabels"+ d.id})
         .style("font-family","sans-serif").style("font-size","10px").style("text-anchor","middle")
         .style("fill","#666").on("click", this.clickHintLabelFunction);
 
     
     this.svg.select("#hintPath").append("svg:path")
         .attr("d",  this.hintPathGenerator(points))
         .attr("id","path").attr("filter", "url(#blur)")
         .style("fill","none").style("stroke-width",1.5).style("stroke",this.pointColour);
 }
 /** Re-draws a flashlight style hint path as the point is dragged
  *  currentPosition: position of the dragged point
  *  points: all points along the hint path
  * */
 Scatterplot.prototype.drawHintPath_flashlight = function (currentPosition,points){
     this.svg.select("#hintPath").selectAll(".hintLabels").remove();
     this.svg.select("#hintPath").selectAll("path").remove();
     this.hintPathPoints_flashlight = [];
 
     
     
     var distances = [];
     for (var i=0;i<points.length;i++){ 
           distances.push([this.calculateDistance(currentPosition[0],currentPosition[1],points[i][0],points[i][1]),i]);
     }
     distances.sort(function(a,b){return a[0]-b[0]}); 
     var maxDistance = distances[4][0]; 
 
     var pathPoints = [];
     var ref = this;
     for (var i=0;i<4;i++){ 
         pathPoints.push(points[distances[i][1]]);
         var pointIndex = distances[i][1];
         this.svg.select("#hintPath").append("svg:path")
             .attr("d",  this.hintPathGenerator([points[pointIndex],currentPosition]))
             .attr("id","path").attr("filter", "url(#blurFlashlight)").attr("opacity",Math.abs(1-distances[i][0]/maxDistance))
             .style("fill","none").style("stroke-width",1).style("stroke",this.pointColour);
         this.hintPathPoints_flashlight.push(pointIndex);
     }
 
     
     this.svg.select("#hintPath").selectAll("text").data(pathPoints.map(function (d,i){
         return {x:d[0],y:d[1],id:ref.hintPathPoints_flashlight[i],id2:i}
     })).enter().append("text").text(function (d){return ref.labels[d.id]}).attr("x", function(d) {return d.x;})
         .attr("y", function (d) {  return d.y; }).attr("class","hintLabels")
         .attr("fill-opacity",function (d) {return Math.abs(1-distances[d.id2][0]/maxDistance)})
         .attr("id",function (d){return "hintLabels"+ d.id})
         .style("font-family","sans-serif").style("font-size","10px").style("text-anchor","middle")
         .style("fill","#666").on("click", this.clickHintLabelFunction);
 }
 /**This function places labels in ambiguous cases such that they do not overlap
  * points: a 2D array of positions of each label [x,y]...
  * */
 Scatterplot.prototype.placeLabels = function (points){
   if (this.isAmbiguous == 0){return points} 
 
   var ref = this;
   var offset = -1;
   var indexCounter = -1;
   var x = 0;
   var y = 0;
   var adjustedPoints = points.map(function (d,i){
       if (ref.ambiguousPoints[i][0] == 1 /**|| ref.ambiguousPoints[i][0] == 2*/){
           if (ref.ambiguousPoints[i][1] != offset){
               indexCounter = -1;
               offset = ref.ambiguousPoints[i][1];
               x= d[0];
               y = d[1];
           }
           indexCounter++;
           return [x + 25*indexCounter,y-10];
       }
       return [d[0],d[1]];
   });
   return adjustedPoints;
 }
 /**This function places labels in ambiguous cases for a flashlight hint path, aligned vertically and equally spaced
  * points: a 2D array of positions of each label [x,y]...
  * */
 Scatterplot.prototype.placeLabels_flashlight= function (points){
     if (this.isAmbiguous == 0){return points} 
 
     var ref = this;
     var offset = -1;
     var indexCounter = -1;
     var x = 0;
     var y = 0;
     var adjustedPoints = points.map(function (d,i){
         if (ref.ambiguousPoints[i][0] == 1 /**|| ref.ambiguousPoints[i][0] == 2*/){
             if (ref.ambiguousPoints[i][1] != offset){
                 indexCounter = -1;
                 offset = ref.ambiguousPoints[i][1];
                 x= d[0];
                 y = d[1];
             }
             indexCounter++;
             return [x ,y+ 25*indexCounter];
         }
         return [d[0],d[1]];
     });
     return adjustedPoints;
 }
 /** Draws interaction loops as svg paths onto the hint path (if point has stationary cases)
  *  id: of the dragged point
  * */
  Scatterplot.prototype.drawLoops = function (id,points){
     
     var loopGenerator = d3.line().curve(d3.curveBasisClosed); 
     var ref = this;
 
    
     this.svg.select("#hintPath").selectAll(".loops")
         .data(points.map(function (d,i){
             var loopPoints = [];
             loopPoints = ref.calculateLoopPoints(d[0],d[1],d[2]);
             var x = d[0] + (ref.loopRadius/2)*Math.cos(d[2]);
             var y = d[1] + (ref.loopRadius/2)*Math.sin(d[2]);
             var repeatedYears = [];
             for (var j=0;j<ref.ambiguousPoints.length;j++){
                 if (ref.ambiguousPoints[j][0] == 1 && ref.ambiguousPoints[j][1] == i){
                     repeatedYears.push(j);
                 }
             }
             return {points:loopPoints[0],id:i,orientationAngle:d[2],cx:x,cy:y,points2:loopPoints[1],years:repeatedYears};
         }))
         .enter().append("path").attr("class","loops")
         .attr("d",function (d){return loopGenerator(d.points);})
         .attr("id",function (d,i){return "loop"+i;})
         .style("fill","none").style("stroke","#666").style("stroke-dasharray","3,3")
         .attr("filter", "url(#blurLoop)");
 }
 /** Clears the hint path by removing it, also re-sets the transparency of the faded out points and the isAmbiguous flag */
 Scatterplot.prototype.clearHintPath = function () {
     this.isAmbiguous = 0;
     this.removeAnchor();
 
     
     this.svg.select("#hintPath").selectAll("text").remove();
     this.svg.select("#hintPath").selectAll("path").remove();
     this.svg.select("#hintPath").selectAll("circle").remove();
 
     
     this.svg.selectAll(".displayPoints").style("fill-opacity", 1);
 }
 /**Clears the point labels when the background is clicked
  * */
 Scatterplot.prototype.clearPointLabels = function (){
     this.svg.selectAll(".pointLabels").remove();
     this.clickedPoints = [];
 }
 /** Calculates the distance between two points
  * (x1,y1) is the first point
  * (x2,y2) is the second point
  * @return the distance, avoiding the square root
  * */
 Scatterplot.prototype.calculateDistance = function(x1,y1,x2,y2){
     var term1 = x1 - x2;
     var term2 = y1 - y2;
     return (term1*term1)+(term2*term2);
 }
 /** Finds the minimum distance between a point at (x,y), with respect
  * to a line segment defined by points (pt1_x,pt1_y) and (pt2_x,pt2_y)
  * Code based on: http:
  * -distance-between-a-point-and-a-line-segment
  * Formulas can be found at: http:
  * @return the point on the line at the minimum distance and the t parameter, as an array: [x,y,t]
  * */
 Scatterplot.prototype.minDistancePoint = function(x,y,pt1_x,pt1_y,pt2_x,pt2_y){
 
    var distance = this.calculateDistance(pt1_x,pt1_y,pt2_x,pt2_y);
    
    if (distance == 0) return [pt1_x,pt1_y,0];
 
    var t = ((x - pt1_x) * (pt2_x - pt1_x) + (y - pt1_y) * (pt2_y - pt1_y)) / distance;
    if (t < 0) return [pt1_x,pt1_y,t]; 
    if (t > 1) return [pt2_x,pt2_y,t]; 
 
    
     var minX = pt1_x + t*(pt2_x-pt1_x);
     var minY = pt1_y + t*(pt2_y-pt1_y);
     return [minX,minY,t];
 }
 /** Computes the points to lie along an interaction loop
  * Note: this function is only called in findLoops()
  * x,y: Define the center point of the loop (sort of)
  * angle: the angle to orient the loop at
  * @return an array of all loop points and the year index in the format: [[x,y], etc.]
  * */
 Scatterplot.prototype.calculateLoopPoints = function (x,y,angle){
    var drawingPoints = [];
     var loopWidth = Math.PI/5; 
 
     
     drawingPoints.push([x,y]);
 
     
     drawingPoints.push([(x + this.loopRadius*Math.cos(angle+loopWidth)),(y+ this.loopRadius*Math.sin(angle+loopWidth))]);
     drawingPoints.push([(x + this.loopRadius*Math.cos(angle)),(y+ this.loopRadius*Math.sin(angle))]);
     drawingPoints.push([(x + this.loopRadius*Math.cos(angle-loopWidth)),(y+ this.loopRadius*Math.sin(angle-loopWidth))]);
 
    
    drawingPoints.push([x,y]);
    
    
     var loopPoints = [];
     loopWidth = Math.PI/7; 
     var adjustedRadius = this.loopRadius - 10;
     
     loopPoints.push([x,y]);
 
     
     
     
     /**loopPoints.push([(x + adjustedRadius*Math.cos(angle+loopWidth)),(y+ adjustedRadius*Math.sin(angle+loopWidth))]);
     loopPoints.push([(x + adjustedRadius*Math.cos(angle)),(y+ adjustedRadius*Math.sin(angle))]);
     loopPoints.push([(x + adjustedRadius*Math.cos(angle-loopWidth)),(y+ adjustedRadius*Math.sin(angle-loopWidth))]);*/
     
     
     loopPoints.push([(x + adjustedRadius*Math.cos(angle-loopWidth)),(y+ adjustedRadius*Math.sin(angle-loopWidth))]);
     loopPoints.push([(x + adjustedRadius*Math.cos(angle)),(y+ adjustedRadius*Math.sin(angle))]);
     loopPoints.push([(x + adjustedRadius*Math.cos(angle+loopWidth)),(y+ adjustedRadius*Math.sin(angle+loopWidth))]);
     
     
     loopPoints.push([x,y]);
    
    return [drawingPoints,loopPoints];
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
 Scatterplot.prototype.checkAmbiguous = function (id,points){
     var j, currentPoint;
     var repeatedPoints = [];
     var foundIndex = -1;
     var groupNum = 0;
 
     
     this.ambiguousPoints = [];
     
     for (j=0;j<=this.lastView;j++){
         this.ambiguousPoints[j] = [0];
         
     }
     var savedIndex= -1;
     
     
     for (j=0;j<=this.lastView;j++){
         currentPoint = points[j];
         for (var k=0;k<=this.lastView;k++){
             if (j!=k){
                 var distance = findPixelDistance(points[k][0],points[k][1],currentPoint[0],currentPoint[1]);
                 if ((points[k][0] == currentPoint[0] && points[k][1] == currentPoint[1])||(distance<=10)){ 
                     if (Math.abs(k-j)==1){ 
                         this.isAmbiguous = 1;
                         if (Math.abs(savedIndex-j)>1 && savedIndex!=-1){
                             groupNum++;
                         }
                         this.ambiguousPoints[j] = [1,groupNum];
                         savedIndex = j;
                     }/**else{ 
                         if (this.ambiguousPoints[j][0] ==0){ 
                             this.ambiguousPoints[j] = [2,groupNum];
                         }
                     }*/
                 }
             }
         }
     }   
     if (this.isAmbiguous == 1){
         
         var currentGroupNum = -1;
         for (var i=0;i<this.ambiguousPoints.length;i++){
             if (this.ambiguousPoints[i].length>1){
                 if (this.ambiguousPoints[i][1]!=currentGroupNum){
                     repeatedPoints.push([points[i][0],points[i][1],Math.PI*3/2]);
                 }
                 currentGroupNum = this.ambiguousPoints[i][1];
             }
         }
         this.drawLoops(id,repeatedPoints);
     }
 }
 /** Search for x,y in a 2D array with the format: [[x,y]..number of points]
  *  x,y: the point to search for
  *  array: the array to search within
  *  @return -1 if no match is found, or the index of the found match
  * */
 Scatterplot.prototype.findInArray = function (x,y,array)
 {
    if (array.length==0) return -1;
    for (var j=0;j<array.length;j++){
       if (array[j][0]==x && array[j][1]==y){
           return j;
       }
    }
     return -1;
 }

 /** Constructor for a slider widget
 * x: the left margin
 * y: the right margin
 * id: id of the div tag to append the svg container
 * labels: an array of labels corresponding to a tick along the slider
 * description: a title for the slider
 * colour: the colour of the slider
 * spacing: spacing between ticks (in pixels)
 */

function Slider(x, y, labels,description,colour,spacing) {
    
    this.xpos = x;
    this.ypos = y;
    this.mouseX = -1;
    this.numTicks  = labels.length;
    this.title = description;
    this.tickLabels = labels;
    this.displayColour = colour;
    this.tickSpacing = spacing;
    this.sliderOffset = x+(description.length*20); 
    this.width = this.sliderOffset + this.numTicks*this.tickSpacing;
    this.height = 50;
    this.tickYPos = 35; 
    this.anchorYPos = 12; 
    this.sliderHeight = 10; 
 
    this.currentTick = 0; 
    this.nextTick = 1;  
    this.interpValue=0; 
    this.widget = null;  
    this.sliderPos = this.sliderOffset; 
    this.timeDirection = 1 
 
    
    this.tickPositions = []; 
    for (var i=0; i < this.numTicks; i++){
        if (i==0){
             this.tickPositions[i] = this.sliderOffset;
        }else {
              this.tickPositions[i] =  this.tickPositions[i-1] + this.tickSpacing;
        }      
    }     
 }
 /** Append a blank svg and g container to the div tag indicated by "id", this is where the widget
  *  will be drawn.
  * */
 Slider.prototype.init = function() {
    this.widget = d3.select("#mainSvg").append("g").attr("id","gSlider")
        .attr("width", this.width).attr("height", this.height)
        .attr("transform", "translate(" + this.xpos + "," + this.ypos + ")");
 }
 /** Render the widget onto the svg
  *  Note: no data set is required because it was automatically generated in the constructor
  * */
 Slider.prototype.render = function() {
    var ref = this;
 
    
    this.widget.append("text").text(this.title).attr("class","slider")
               .attr("x",0).attr("y",20).attr("fill",this.displayColour)
               .style("font-family", "sans-serif").style("font-size","20px");
 
    
    this.widget.selectAll("rect")
      .data(this.tickPositions.map(function (d,i) {return {id:i,value:d,label:ref.tickLabels[i]};}))
       .enter().append("g").attr("class","slider");
 
    
    this.widget.selectAll("g").append("svg:rect")
       .attr("x", function (d) {return d.value;})
       
        .attr("y", function (d,i){return (10-ref.sliderHeight/2)})
       .attr("width", 2)
        .attr("height", function (d,i){return (12+ref.sliderHeight)})
       .style("fill", ref.displayColour)
       .attr("class","ticks");
 
    
    this.widget.selectAll("g").append("svg:text")
       .text(function(d) { return d.label; })
       .attr("x", function(d) {return d.value}).attr("y", 0)
       .style("font-family", "sans-serif").style("font-size", "14px")
       .style("fill", function (d,i){
            if (ref.tickLabels.length >25){ 
               if (i%5 ==0) return ref.displayColour;
               else return "none";
            }
            return ref.displayColour;
        })
        .attr("text-anchor","middle").attr("class","tickLabels");
 
    
    this.widget.append("rect").attr("class","slider")
        .attr("x",ref.sliderOffset).attr("y",10)
        .attr("width", ref.tickPositions[ref.numTicks-1] - ref.sliderOffset)
        .attr("height", ref.sliderHeight)
        .attr("fill", ref.displayColour);
 
   
   /**this.widget.append("rect")
       .attr("transform", function(d) { return "translate(" +ref.sliderPos + "," + ref.tickYPos + ")"; })
       .attr("rx",4).attr("ry",4) 
       .attr("width", 10).attr("height", 20)
       .attr("stroke", "white").attr("fill", ref.displayColour)
       .style("cursor", "pointer").attr("id","slidingTick");*/
 
  
   this.widget.append("path").attr("d",d3.symbol().type(d3.symbolTriangle).size(180))
       .attr("transform", "translate(" +ref.sliderPos + "," + ref.tickYPos + ")")
       .attr("fill", ref.displayColour).style("stroke","white")
       .style("cursor", "pointer").attr("id","slidingTick").attr("class","slider");
   
    this.widget.append("rect").attr("transform", "translate(" +(ref.sliderPos+1) + "," + ref.anchorYPos + ")")
         .attr("stroke", "none").style("fill", "#bdbdbd").attr("width", 1).attr("height", (ref.sliderHeight-4))
         .style("cursor", "pointer").attr("id","anchor").attr("class","slider");
 }
 /** Re-draws the dragged tick by translating it according to the x-coordinate of the mouse
  *  mouseX: The x-coordinate of the mouse, received from the drag event
  * */
 Slider.prototype.updateDraggedSlider = function( mouseX ) {
    var ref = this;
   this.mouseX = mouseX; 
   var translateX;
 
    var current = ref.tickPositions[ref.currentTick];
    var next = ref.tickPositions[ref.nextTick];
    if (ref.currentTick == 0){ 
        if (mouseX <= current){
            translateX = current;
        }else if (mouseX >= next){
            ref.currentTick = ref.nextTick;
            ref.nextTick++;
            ref.interpValue = (ref.timeDirection == -1)? 1:0;
            translateX = mouseX;
         }else{
            ref.setInterpolation(mouseX,current,next);
            translateX = mouseX;
         }
    }else if (ref.nextTick == (ref.numTicks-1)){ 
        if (mouseX>= next){  
           translateX = next;
        }else if (mouseX <= current){
             ref.nextTick = ref.currentTick;
             ref.currentTick--;
             ref.interpValue = (ref.timeDirection == -1)? 1:0;
             translateX = mouseX;
        }else{
            ref.setInterpolation(mouseX,current,next);
            translateX = mouseX;
        }
    }else{ 
         if (mouseX <= current){ 
             ref.nextTick = ref.currentTick;
             ref.currentTick--;
             ref.interpValue = (ref.timeDirection == -1)? 1:0;
         }else if (mouseX>=next){ 
             ref.currentTick = ref.nextTick;
             ref.nextTick++;
             ref.interpValue = (ref.timeDirection == -1)? 1:0;
         }else{
             ref.setInterpolation(mouseX,current,next);
         }
       translateX = mouseX;
    }
 
     this.widget.select("#slidingTick").attr("transform","translate(" + translateX + "," + ref.tickYPos + ")");
     this.widget.select("#anchor").attr("width",translateX-ref.sliderOffset);
     
 }
 /** Determines how far the slider has travelled between two ticks (current and next) and sets
  * the interpolation value accordingly (as percentage travelled)
  * current,next: the tick indices
  * mouseX: x-coordinate of mouse
  * */
 Slider.prototype.setInterpolation = function( mouseX,current,next) {
      var totalDistance = Math.abs(next-current);
      var distanceTravelled = Math.abs(mouseX - current);
      var newInterp = distanceTravelled/totalDistance;
 
     this.timeDirection = (newInterp>this.interpValue)?1:(newInterp<this.interpValue)?-1:this.interpValue;
     this.interpValue = newInterp;
 }
 /** Updates the location of the draggable tick to the new view
  * */
 Slider.prototype.updateSlider = function( newView ) {
      var ref = this;
     
     if (newView == ref.numTicks){  
         ref.nextTick = newView;
         ref.currentTick = newView -1;
     }else { 
         ref.currentTick = newView;
         ref.nextTick = newView + 1;
     }
     
     this.widget.select("#slidingTick")
                
                 .attr("transform",function (){return "translate(" + ref.tickPositions[newView] + "," + ref.tickYPos + ")";});
     this.widget.select("#anchor").attr("width",this.tickPositions[newView] - this.sliderOffset);
 }
 /** Snaps the draggable tick to the nearest tick on the slider after the mouse is
  *  released
  * */
 Slider.prototype.snapToTick = function() {
      var ref = this;
     this.widget.select("#slidingTick")
         
         .attr("transform",function (){
          var current = ref.tickPositions[ref.currentTick];
          var next = ref.tickPositions[ref.nextTick];
          var currentDist = Math.abs(current - ref.mouseX);
          var nextDist = Math.abs(next - ref.mouseX);
          if (currentDist > nextDist){
             ref.currentTick = ref.nextTick;
             ref.nextTick++;
             ref.widget.select("#anchor").attr("width",next-ref.sliderOffset);
              return "translate(" + next + "," + ref.tickYPos + ")";
             
         }
             ref.widget.select("#anchor").attr("width",current-ref.sliderOffset);
             return "translate(" + current + "," + ref.tickYPos + ")";
         
      });
 
 }
 /** The tick is drawn according the to the provided interpolation amount,
  *  and interpolation occurs between current and next view
  *  Note: This function can be used to update the slider as another visualization
  *  object is dragged (e.g., scatterplot point)
  * */
 Slider.prototype.animateTick = function(interpAmount, currentView, nextView) {
     var ref = this;
     if (interpAmount != 0){
         this.widget.select("#slidingTick")
                .attr("transform",function (){
                      var current = ref.tickPositions[currentView];
                      var next = ref.tickPositions[nextView];
                      var interpX = d3.interpolate(current,next)(interpAmount);
                      ref.widget.select("#anchor").attr("width",interpX-ref.sliderOffset)
                      return "translate("+interpX+","+ref.tickYPos+")";
                  });
     }
 }



/** This file creates and coordinates a scatterplot and a slider according to the provided dataset
 * */


d3.select("#scatter").append("svg").attr("id","mainSvg").on("click",function(){
    scatterplot.clearHintPath();
    scatterplot.clearPointLabels();
});

d3.select("#hintPathForm").selectAll("input").on("change", function change() {
    scatterplot.hintPathType = this.value;
});


var scatterplot   = new Scatterplot(screenWidth*0.6, screenHeight*0.6,50);

scatterplot.init();



scatterplot.clickHintLabelFunction = function (event, d){
    event.stopPropagation(); 
    scatterplot.animatePoints(scatterplot.draggedPoint,scatterplot.currentView, d.id);
    changeView(scatterplot, d.id);
    slider.updateSlider(d.id);
};


var dragPoint = d3.drag()
               .subject(function(_,d){ 
                    return {x:d.nodes[scatterplot.currentView][0],y:d.nodes[scatterplot.currentView][1]};
               }).on("start", function(_,d){
                    scatterplot.clearHintPath();
                    scatterplot.draggedPoint = d.id;
                    scatterplot.previousDragAngle = 0; 
                    scatterplot.selectPoint(d);
              }).on("drag", function(event, d){
                   if (scatterplot.hintPathType!=1){
                       slider.animateTick(scatterplot.interpValue,scatterplot.currentView,scatterplot.nextView);
                   }
                   scatterplot.updateDraggedPoint(d.id,event.x,event.y, d.nodes);
              }).on("end",function (_,d){ 
                                          
                    scatterplot.snapToView(d.id,d.nodes);
                    slider.updateSlider(scatterplot.currentView);
              });


scatterplot.svg.selectAll(".displayPoints").call(dragPoint);

				  

 slider.dragEvent = d3.drag()  
						.on("start", function(){                               
                            scatterplot.clearHintPath();
					     }) 
                      .on("drag", function(event){                               					  
							slider.updateDraggedSlider(event.x);                       
						    scatterplot.interpolatePoints(-1,slider.interpValue,slider.currentTick,slider.nextTick);
					  })
					  .on("end",function (){
					      slider.snapToTick();
                          changeView(scatterplot,slider.currentTick);
                          scatterplot.redrawView(slider.currentTick);
					  });	


slider.widget.select("#slidingTick").call(slider.dragEvent);
				   