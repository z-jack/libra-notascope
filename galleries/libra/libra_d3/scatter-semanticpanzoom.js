// global constants
globalThis.MARGIN = { top: 30, right: 70, bottom: 40, left: 60 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 380 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;
globalThis.FIELD_X = "Horsepower";
globalThis.FIELD_Y = "Miles_per_Gallon";
globalThis.FIELD_COLOR = "Origin";

// global variables
globalThis.data = [];
globalThis.data_detail_level2 = [];
globalThis.data_detail_level1 = [];
globalThis.data_detail_level0 = [];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.color = null;

async function loadData() {
  const binX = (i) =>
    d3
      .bin()
      .value((d) => d[globalThis.FIELD_X])
      .thresholds(i);
  const binY = (i) =>
    d3
      .bin()
      .value((d) => d[globalThis.FIELD_Y])
      .thresholds(i);

  const binXY = (data, i) => binX(i)(data).map(binY(i));
  const mergeXY = (xList) =>
    xList.flatMap((yList) =>
      yList.flatMap((xyList) => {
        const collection = {};
        xyList.forEach((datum) => {
          if (!collection[datum[globalThis.FIELD_COLOR]]) {
            collection[datum[globalThis.FIELD_COLOR]] = [];
          }
          collection[datum[globalThis.FIELD_COLOR]].push(datum);
        });
        return Object.values(collection).map((arr) =>
          arr.reduce(
            (p, c, _, a) => ({
              [globalThis.FIELD_X]:
                p[globalThis.FIELD_X] + c[globalThis.FIELD_X] / a.length,
              [globalThis.FIELD_Y]:
                p[globalThis.FIELD_Y] + c[globalThis.FIELD_Y] / a.length,
              [globalThis.FIELD_COLOR]: c[globalThis.FIELD_COLOR],
              count: p.count + c.count,
            }),
            {
              [globalThis.FIELD_X]: 0,
              [globalThis.FIELD_Y]: 0,
              count: 0,
            }
          )
        );
      })
    );

  globalThis.data = (await d3.json("./data/cars.json")).filter(
    (d) => !!(d["Horsepower"] && d["Miles_per_Gallon"])
  );
  globalThis.data_detail_level0 = globalThis.data.map((x) => ({
    ...x,
    count: 1,
  }));
  globalThis.data_detail_level1 = mergeXY(
    binXY(globalThis.data_detail_level0, 10)
  );
  globalThis.data_detail_level2 = mergeXY(
    binXY(globalThis.data_detail_level1, 8)
  );
  globalThis.data_detail_level3 = mergeXY(
    binXY(globalThis.data_detail_level2, 6)
  );
  globalThis.data_detail_level4 = mergeXY(
    binXY(globalThis.data_detail_level3, 4)
  );
  globalThis.data_detail_level5 = mergeXY(
    binXY(globalThis.data_detail_level4, 2)
  );
  globalThis.data_detail_level6 = mergeXY(
    binXY(globalThis.data_detail_level5, 1)
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

  // Add clip
  svg
    .append("clipPath")
    .attr("id", "clipMainLayer")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", globalThis.WIDTH)
    .attr("height", globalThis.HEIGHT);

  // Add X scale
  globalThis.x = d3
    .scaleLinear()
    .domain(extentX)
    .range([0, globalThis.WIDTH])
    .nice()
    .clamp(false);

  // Add Y scale
  globalThis.y = d3
    .scaleLinear()
    .domain(extentY)
    .nice()
    .range([globalThis.HEIGHT, 0])
    .clamp(false);

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

module.exports = {
  loadData,
  renderStaticVisualization,
};

// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  VIS.renderStaticVisualization();
  const [mainLayer, transformer] = renderMainVisualization();
  mountInteraction(mainLayer, transformer);
}

function renderMainVisualization(
  scaleX = globalThis.x,
  scaleY = globalThis.y,
  data = globalThis.data_detail_level1
) {
  // Find SVG
  const svg = d3.select("#LibraPlayground svg");

  let g = svg.select(".main");
  let returnVal = null;
  if (g.empty()) {
    // create layer if not exists
    const mainLayer = Libra.Layer.initialize("D3Layer", {
      name: "mainLayer",
      width: globalThis.WIDTH,
      height: globalThis.HEIGHT,
      offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
      container: svg.node(),
    });
    g = d3.select(mainLayer.getGraphic());
    g.attr("class", "main");

    Libra.GraphicalTransformer.register("DrawAxesAndMarks", {
      sharedVar: {
        scaleX: globalThis.x,
        scaleY: globalThis.y,
      },
      redraw({ transformer }) {
        const scaleX = transformer.getSharedVar("scaleX");
        const scaleY = transformer.getSharedVar("scaleY");
        const data = transformer.getSharedVar("data");
        renderMainVisualization(scaleX, scaleY, data);
      },
    });

    const transformer = Libra.GraphicalTransformer.initialize(
      "DrawAxesAndMarks",
      {
        layer: mainLayer,
      }
    );

    returnVal = [mainLayer, transformer];
  }

  // Clear the layer
  g.selectChildren().remove();

  // Add X axis
  g.append("g")
    .attr("transform", "translate(0," + globalThis.HEIGHT + ")")
    .call(d3.axisBottom(scaleX))
    .append("text")
    .text(globalThis.FIELD_X)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("x", globalThis.WIDTH / 2)
    .attr("y", 30);

  // Add Y axis
  g.append("g")
    .call(d3.axisLeft(scaleY))
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

  // Draw points code from the input static visualization
  g.append("g")
    .attr("clip-path", `url(#clipMainLayer)`)
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("class", "mark")
    .call((g) =>
      g
        .append("circle")
        .attr("fill", "white")
        .attr("stroke-width", 1)
        .attr("stroke", (d) => globalThis.color(d[globalThis.FIELD_COLOR]))
        .attr("cx", (d) => scaleX(d[globalThis.FIELD_X]))
        .attr("cy", (d) => scaleY(d[globalThis.FIELD_Y]))
        .attr("r", (d) => (d.count ?? 0) + 5)
    )
    .call((g) =>
      g
        .append("text")
        .attr("fill", (d) => globalThis.color(d[globalThis.FIELD_COLOR]))
        .attr("x", (d) => scaleX(d[globalThis.FIELD_X]) - 6)
        .attr("y", (d) => scaleY(d[globalThis.FIELD_Y]) + 6)
        .text((d) => ((d.count ?? 1) > 1 ? d.count : ""))
    );

  return returnVal;
}

function mountInteraction(layer, transformer) {
  Libra.Interaction.build({
    inherit: "PanInstrument",
    layers: [layer],
    sharedVar: {
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });

  Libra.Interaction.build({
    inherit: "SemanticZoomInstrument",
    layers: [layer],
    sharedVar: {
      scaleLevels: {
        3: { data: globalThis.data_detail_level0 },
        0: { data: globalThis.data_detail_level1 },
        "-3": { data: globalThis.data_detail_level2 },
        "-6": { data: globalThis.data_detail_level3 },
        "-9": { data: globalThis.data_detail_level4 },
        "-12": { data: globalThis.data_detail_level5 },
        "-15": { data: globalThis.data_detail_level6 },
      },
      fixRange: true,
      scaleX: globalThis.x,
      scaleY: globalThis.y,
    },
  });
}

main();
