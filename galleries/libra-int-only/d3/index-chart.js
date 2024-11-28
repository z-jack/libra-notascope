  // For each given series, the update function needs to identify the date—closest to the current
  // date—that actually contains a value. To do this efficiently, it uses a bisector:
  const bisect = d3.bisector(d => d.Date).left;

  // Define the update function, that translates each of the series vertically depending on the
  // ratio between its value at the current date and the value at date 0. Thanks to the log
  // scale, this gives the same result as a normalization by the value at the current date.
  function update(date) {
    date = d3.utcDay.round(date);
    rule.attr("transform", `translate(${x(date) + 0.5},0)`);
    serie.attr("transform", ({ values }) => {
      const i = bisect(values, date, 0, values.length - 1);
      return `translate(0,${y(1) - y(values[i].value / values[0].value)})`;
    });
    svg.property("value", date).dispatch("input"); // for viewof compatibility
  }

  // When the user mouses over the chart, update it according to the date that is
  // referenced by the horizontal position of the pointer.
  svg.on("mousemove touchmove", function (event) {
    update(x.invert(d3.pointer(event, this)[0]));
    d3.event.preventDefault();
  });