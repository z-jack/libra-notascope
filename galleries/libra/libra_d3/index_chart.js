// global constants
globalThis.MARGIN = { top: 20, right: 70, bottom: 50, left: 50 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 380 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;
globalThis.IBMURL = "./data/stocks/IBM.csv";
globalThis.GOOGURL = "./data/stocks/GOOG.csv";
globalThis.MSFTURL = "./data/stocks/MSFT.csv";
globalThis.AAPLURL = "./data/stocks/AAPL.csv";
globalThis.AMZNURL = "./data/stocks/AMZN.csv";
globalThis.STOCKSURL = "./data/stocks/stocks.csv";

// global variables
globalThis.data = [];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.color = null;

async function loadData() {
  const data = await d3.csv(globalThis.STOCKSURL, (d) => ({
    name: d.symbol,
    date: new Date(d.date),
    value: +d.price,
  }));

  globalThis.data = d3.groups(data, (d) => d.name);

  const date = data[0].date;

  globalThis.data.forEach(([_, items]) => {
    if (items.length > 0) {
      let leftItemIndex = 0;
      let rightItemIndex = 0;
      for (let i = 1; i < items.length; ++i) {
        const item = items[i];
        if (date <= item.date) {
          leftItemIndex = i - 1;
          rightItemIndex = i;
          break;
        }
      }
      const leftItem = items[leftItemIndex];
      const rightItem = items[rightItemIndex];
      const a =
        leftItem.date === rightItem.date
          ? 1
          : (date - leftItem.date) / (rightItem.date - leftItem.date);
      let baseValue = leftItem.value * a + rightItem.value * (1 - a);
      items.forEach(({ value }, i) => {
        items[i].k = value / baseValue;
      });
    }
  });
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
    .attr(
      "viewbox",
      `0 0 ${globalThis.WIDTH + globalThis.MARGIN.left + globalThis.MARGIN.right
      } ${globalThis.HEIGHT + globalThis.MARGIN.top + globalThis.MARGIN.bottom}`
    )
    .append("g")
    .attr(
      "transform",
      "translate(" + globalThis.MARGIN.left + "," + globalThis.MARGIN.top + ")"
    );

  // Add X axis
  globalThis.x = d3
    .scaleUtc()
    .domain(
      d3.extent(
        globalThis.data.flatMap((d) => d[1]),
        (d) => d.date
      )
    )
    .range([0, globalThis.WIDTH]);
  svg
    .append("g")
    .attr("transform", "translate(0," + globalThis.HEIGHT + ")")
    .call(d3.axisBottom(globalThis.x).tickSizeOuter(0))
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("y2", -globalThis.HEIGHT)
    );

  // Add Y axis
  globalThis.y = d3
    .scaleLinear()
    .domain(
      d3.extent(
        globalThis.data.flatMap((d) => d[1]),
        (d) => d.k
      )
    )
    .range([globalThis.HEIGHT, 0]);

  // Add color scale
  globalThis.color = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(globalThis.data.map((d) => d.name));

  svg
    .append("g")
    .call((g) =>
      g
        .append("text")
        .text('symbol')
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
          ['MSFT', 'AMZN', 'IBM', 'GOOG', 'AAPL']
        )
        .join("g")
        .call((g) => {
          g.append("line")
            .attr("fill-opacity", "0")
            .attr("stroke-width", 2)
            .attr("stroke", (d) => globalThis.color(d))
            .attr("x1", globalThis.WIDTH + 5)
            .attr("x2", globalThis.WIDTH + 15)
            .attr("y1", (_, i) => i * 20)
            .attr("y2", (_, i) => i * 20);
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

module.exports = {
  loadData,
  renderStaticVisualization,
};

// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  VIS.renderStaticVisualization();
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization(
  scaleY = globalThis.y,
  data = globalThis.data
) {
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  let returnVal = null;
  let g = svg.select(".main");
  if (g.empty()) {
    const mainLayer = Libra.Layer.initialize("D3Layer", {
      name: "mainLayer",
      width: globalThis.WIDTH,
      height: globalThis.HEIGHT,
      offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
      container: svg.node(),
    });
    g = d3.select(mainLayer.getGraphic()).attr("class", "main");

    returnVal = mainLayer;
  }
  g.selectChildren().remove();

  const line = d3
    .line()
    .x((d) => globalThis.x(d.date))
    .y((d) => scaleY(d.k));

  g.append("g")
    .call(d3.axisLeft(scaleY).tickFormat(d3.format(".0%")))
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("x2", globalThis.WIDTH)
    );

  g.append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("stroke", (d) => globalThis.color(d[0]))
    .datum((d) => d[1])
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", (d) => line(d));

  return returnVal;
}

function mountInteraction(layer) {
  // Initialize Main Transformer
  const mainTransformer = Libra.GraphicalTransformer.initialize(
    "MainTransformer",
    {
      layer,
      sharedVar: {
        result: { scaleY: globalThis.y, data: globalThis.data },
      },
      redraw({ transformer }) {
        const { scaleY, data } = transformer.getSharedVar("result");
        renderMainVisualization(scaleY, data);
      },
    }
  );

  // Initialize Service
  const normalizationService = Libra.Service.initialize(
    "NormalizationService",
    {
      constructor: Libra.Service.AnalysisService,
      transformers: [mainTransformer],
      sharedVar: { point: 0 },
      evaluate({ point }) {
        const date = globalThis.x.invert(point);
        const data = JSON.parse(JSON.stringify(globalThis.data));
        data.forEach(([_, items]) => {
          if (items.length > 0) {
            items.forEach(({ date }, i) => {
              items[i].date = new Date(date);
            });
            let leftItemIndex = 0;
            let rightItemIndex = 0;
            for (let i = 1; i < items.length; ++i) {
              const item = items[i];
              if (date <= item.date) {
                leftItemIndex = i - 1;
                rightItemIndex = i;
                break;
              }
            }
            const leftItem = items[leftItemIndex];
            const rightItem = items[rightItemIndex];
            const a =
              leftItem.date === rightItem.date
                ? 1
                : (date - leftItem.date) / (rightItem.date - leftItem.date);
            let baseValue = leftItem.value * a + rightItem.value * (1 - a);
            items.forEach(({ value }, i) => {
              items[i].k = value / baseValue;
            });
          }
        });

        const scaleY = globalThis.y.copy();
        scaleY.domain(
          d3.extent(
            data.flatMap((d) => d[1]),
            (d) => d.k
          )
        );

        return { scaleY, data };
      },
    }
  );

  // Attach HelperLineInstrument to the main layer
  const helperLineInstrument = Libra.Instrument.initialize(
    "HelperLineInstrument",
    {
      layers: [layer],
      services: [normalizationService],
      sharedVar: {
        orientation: ["vertical"],
        style: {
          stroke: "black",
        },
      },
    }
  );

  helperLineInstrument.on("hover", function ({ instrument }) {
    const barX = instrument.getSharedVar("x") - globalThis.MARGIN.left;
    instrument.services.setSharedVar("point", barX);
  });
}

main();
