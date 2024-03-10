// global variables
globalThis.vegaSpec = {};

async function loadData() {
  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic treemap visualization example.",
    width: 800,
    height: 600,
    padding: 5,

    data: [
      {
        name: "source",
        url: "data/treemap_data.json",
        transform: [
          {
            type: "stratify",
            key: "id",
            parentKey: "parent",
          },
          {
            type: "pack",
            field: "size",
            sort: { field: "value" },
          },
        ],
      },
    ],

    scales: [
      {
        name: "color",
        type: "linear",
        domain: { data: "source", field: "value" },
        range: { scheme: "yelloworangebrown" },
      },
    ],

    marks: [
      {
        name: "marks",
        type: "rect",
        from: { data: "source" },
        encode: {
          update: {
            x: { field: "x" },
            y: { field: "y" },
            width: { field: "r" },
            height: { field: "r" },
            fill: { scale: "color", field: "value" },
          },
        },
      },
    ],
  };
}

async function renderStaticVisualization() {
  await vega(document.getElementById("LibraPlayground"), globalThis.vegaSpec);
}

module.exports = {
  loadData,
  renderStaticVisualization,
};

Libra.Interaction.build({
  inherit: "HoverInstrument",
  name: "ExcentricLabelingInstrument",
  sharedVar: {
    r: 20,
    stroke: "green",
    strokeWidth: 2,
    countLabelDistance: 20,
    fontSize: 12,
    countLabelWidth: 40,
    maxLabelsNum: 10,
    labelAccessor: (circleElem) => d3.select(circleElem).datum()["label"],
    colorAccessor: (circleElem) => d3.select(circleElem).datum()["color"],
  },
  override: [
    {
      find: "SelectionService",
      comp: "CircleSelectionService",
    },
  ],
  insert: [
    {
      find: "CircleSelectionService",
      flow: [
        {
          comp: "ExcentricLabelingLayoutService",
          resultAlias: "result",
          evaluate({
            labelAccessor,
            colorAccessor,
            r,
            maxLabelsNum,
            event,
            layer,
            result: circles,
          }) {
            if (!event) return [];
            const [layerX, layerY] = d3.pointer(event, layer.getGraphic());
            const rootBBox = layer
              .getContainerGraphic()
              .getBoundingClientRect();
            const layerBBox = layer.getGraphic().transform.baseVal.consolidate()
              ?.matrix ?? { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 };

            function getRawInfos(objs, labelAccessor, colorAccessor) {
              const rawInfos = objs.map((obj) => {
                const bbox = obj.__libra__screenElement.getBoundingClientRect();
                const x = bbox.x + (bbox.width >> 1) - rootBBox.x - layerBBox.e;
                const y =
                  bbox.y + (bbox.height >> 1) - rootBBox.y - layerBBox.f;
                const labelName = labelAccessor(obj); //d3.select(obj).datum()[labelField];
                const color = colorAccessor(obj); //colorScale(d3.select(obj).datum()[colorField]);
                return {
                  x,
                  y,
                  labelWidth: 0,
                  labelHeight: 0,
                  color,
                  labelName,
                };
              });
              return rawInfos;
            }

            function computeSizeOfLabels(rawInfos, root) {
              const tempInfoAttr = "labelText";
              const tempClass = "temp" + String(new Date().getMilliseconds());
              //const tempMountPoint = d3.create("svg:g").attr("class", tempClass);
              const tempMountPoint = root
                .append("svg:g")
                .attr("class", tempClass);
              rawInfos.forEach(
                (rawInfo) =>
                (rawInfo[tempInfoAttr] = tempMountPoint
                  .append("text")
                  .attr("opacity", "0")
                  .attr("x", -Number.MAX_SAFE_INTEGER)
                  .attr("y", -Number.MAX_SAFE_INTEGER)
                  .text(rawInfo.labelName)
                  .node())
              );
              root.node().appendChild(tempMountPoint.node());
              rawInfos.forEach((rawInfo) => {
                const labelBBox = rawInfo[tempInfoAttr].getBBox();
                rawInfo.labelWidth = labelBBox.width;
                rawInfo.labelHeight = 21;
              });
              root.select("." + tempClass).remove();
              rawInfos.forEach((rawInfo) => delete rawInfo[tempInfoAttr]);
            }

            const rawInfos = getRawInfos(circles, labelAccessor, colorAccessor);
            computeSizeOfLabels(rawInfos, d3.select(layer.getGraphic()));
            const compute = excentricLabeling()
              .radius(r)
              .horizontallyCoherent(true)
              .maxLabelsNum(maxLabelsNum);
            const result = compute(rawInfos, layerX, layerY);
            return result;
          },
        },
        (layer) => ({
          comp: "DrawLabelTransformer",
          layer: layer.getLayerFromQueue("LabelLayer"),
          sharedVar: {
            result: [],
          },
          redraw({ layer, transformer }) {
            function renderLines(root, result) {
              const lineGroup = root
                .append("g")
                .attr("class", "exentric-labeling-line");
              const lineGenerator = d3
                .line()
                .x((d) => d.x)
                .y((d) => d.y);
              lineGroup
                .selectAll("path")
                .data(result)
                .join("path")
                .attr("fill", "none")
                .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
                .attr("d", (layoutInfo) =>
                  lineGenerator(layoutInfo.controlPoints)
                );
            }

            function renderBBoxs(root, result) {
              const bboxGroup = root
                .append("g")
                .attr("class", "exentric-labeling-bbox");
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
            }

            function renderTexts(root, result) {
              const textGroup = root
                .append("g")
                .attr("class", "exentric-labeling-text");
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

            layer.setLayersOrder({ selectionLayer: -1 });

            const result = transformer.getSharedVar("result");
            const root = d3.select(layer.getGraphic());
            root.selectAll("*").remove();
            renderLines(root, result);
            renderBBoxs(root, result);
            renderTexts(root, result);
          },
        }),
      ],
    },
    {
      find: "CircleSelectionService",
      flow: [
        {
          comp: "AggregateService",
          resultAlias: "count",
          sharedVar: {
            ops: ["count"],
          },
        },
        (layer) => ({
          comp: "DrawTextTransformer",
          layer: layer.getLayerFromQueue("LensLayer"),
          sharedVar: {
            x: 0,
            y: 0,
            count: 0,
          },
          redraw({ layer, transformer }) {
            const cx =
              transformer.getSharedVar("x") -
              layer
                .getLayerFromQueue("mainLayer")
                .getGraphic()
                .getBoundingClientRect().left;
            const cy =
              transformer.getSharedVar("y") -
              layer
                .getLayerFromQueue("mainLayer")
                .getGraphic()
                .getBoundingClientRect().top;
            const opacity = 1;
            const lensRadius = transformer.getSharedVar("r");
            const stroke = transformer.getSharedVar("stroke");
            const strokeWidth = transformer.getSharedVar("strokeWidth");
            const count = transformer.getSharedVar("count");
            const countLabelDistance =
              transformer.getSharedVar("countLabelDistance");
            const fontSize = transformer.getSharedVar("fontSize");
            const countLabelWidth = transformer.getSharedVar("countLabelWidth");

            const root = d3.select(layer.getGraphic());
            root.selectAll("*").remove();

            const group = root
              .append("g")
              .attr("opacity", opacity)
              .attr("transform", `translate(${cx}, ${cy})`);

            group
              .append("circle")
              .attr("class", "lensCircle")
              .attr("cx", 0)
              .attr("r", lensRadius)
              .attr("fill", "none")
              .attr("stroke", stroke)
              .attr("stroke-width", strokeWidth);
            const countLabel = group
              .append("text")
              .attr("y", -(countLabelDistance + lensRadius))
              .attr("font-size", fontSize)
              .attr("text-anchor", "middle")
              .attr("fill", stroke)
              .text(count);
            const countLabelBBox = countLabel.node().getBBox();
            group
              .append("rect")
              .attr("class", "lensLabelBorder")
              .attr("stroke", stroke)
              .attr("stroke-width", strokeWidth)
              .attr("fill", "none")
              .attr("x", -countLabelWidth >> 1)
              .attr("y", countLabelBBox.y)
              .attr("width", countLabelWidth)
              .attr("height", countLabelBBox.height);
            group
              .append("line")
              .attr("stroke", stroke)
              .attr("stroke-width", strokeWidth)
              .attr("y1", -lensRadius)
              .attr("y2", countLabelBBox.y + countLabelBBox.height);
          },
        }),
      ],
    },
  ],
});

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
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
    container: svg.node(),
  });
  g = d3.select(mainLayer.getGraphic());

  // Draw the treemap
  g.selectAll(".block")
    .data(globalThis.data_detail_level3)
    .join("g")
    .attr("class", "block")
    .append("rect")
    .attr("fill", (d) => globalThis.color(d.groupId))
    .attr("x", function (d) {
      return d.x0;
    })
    .attr("y", function (d) {
      return d.y0;
    })
    .attr("width", function (d) {
      return d.x1 - d.x0;
    })
    .attr("height", function (d) {
      return d.y1 - d.y0;
    });

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "ExcentricLabelingInstrument",
    layers: [layer],
    sharedVar: {
      stroke: "black",
      labelAccessor: (elem) => d3.select(elem).datum().data.name,
      colorAccessor: () => "black",
    },
  });
}

main();
