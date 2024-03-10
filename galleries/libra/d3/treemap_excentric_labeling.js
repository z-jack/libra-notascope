// Load data
d3.json('data/flare-2.json').then(data => {
  // Constants
  const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
  const WIDTH = 500 - MARGIN.left - MARGIN.right;
  const HEIGHT = 380 - MARGIN.top - MARGIN.bottom;

  // Treemap layout
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  d3.treemap()
    .size([WIDTH, HEIGHT])
    .padding(0.5)(root);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(root.children.map((node, index) => index))
    .range(d3.schemeTableau10);

  // Create SVG container
  const svg = d3.select('#treemap-container')
    .append('svg')
    .attr('width', WIDTH + MARGIN.left + MARGIN.right)
    .attr('height', HEIGHT + MARGIN.top + MARGIN.bottom)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  // Draw treemap cells
  const cell = svg.selectAll('.cell')
    .data(root.descendants())
    .join('rect')
    .attr('class', 'cell')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => color(d.parent ? d.parent.data.id : null))
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut);

  // Interaction functions
  function handleMouseOver(event, d) {
    const [layerX, layerY] = d3.pointer(event, svg.node());
    const cells = svg.selectAll('.cell').nodes();
    const rawInfos = getRawInfos(cells, d.data.name, (cell) => color(cell.parent.data.id));
    const result = computeExcentricLabeling(rawInfos, layerX, layerY);
    renderExcentricLabeling(result);
  }

  function handleMouseOut() {
    svg.selectAll('.excentricLabelingLine').remove();
    svg.selectAll('.excentricLabelingBBox').remove();
    svg.selectAll('.excentricLabelingText').remove();
  }

  function getRawInfos(objs, labelAccessor, colorAccessor) {
    const rootBBox = svg.node().getBoundingClientRect();
    const layerBBox = svg.node().getBoundingClientRect();

    return objs.map((obj) => {
      const bbox = obj.getBoundingClientRect();
      const x = bbox.x + bbox.width / 2 - rootBBox.x - layerBBox.left;
      const y = bbox.y + bbox.height / 2 - rootBBox.y - layerBBox.top;
      const labelName = labelAccessor;
      const color = colorAccessor(obj);
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

  function computeSizeOfLabels(rawInfos) {
    const tempGroup = svg.append('g').attr('opacity', 0);
    rawInfos.forEach((rawInfo) => {
      const text = tempGroup
        .append('text')
        .text(rawInfo.labelName)
        .node();
      const labelBBox = text.getBBox();
      rawInfo.labelWidth = labelBBox.width;
      rawInfo.labelHeight = labelBBox.height;
    });
    tempGroup.remove();
  }

  function computeExcentricLabeling(rawInfos, layerX, layerY) {
    computeSizeOfLabels(rawInfos);
    const compute = excentricLabeling()
      .radius(20)
      .horizontallyCoherent(true)
      .maxLabelsNum(10);
    return compute(rawInfos, layerX, layerY);
  }

  function renderExcentricLabeling(result) {
    const lineGroup = svg.append('g').attr('class', 'excentricLabelingLine');
    const lineGenerator = d3.line().x(d => d.x).y(d => d.y);
    lineGroup
      .selectAll('path')
      .data(result)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', layoutInfo => layoutInfo.rawInfo.color)
      .attr('d', layoutInfo => lineGenerator(layoutInfo.controlPoints));

    const bboxGroup = svg.append('g').attr('class', 'excentricLabelingBBox');
    bboxGroup
      .selectAll('rect')
      .data(result)
      .join('rect')
      .attr('class', 'labelBBox')
      .attr('fill', 'none')
      .attr('stroke', layoutInfo => layoutInfo.rawInfo.color)
      .attr('x', layoutInfo => layoutInfo.labelBBox.x)
      .attr('y', layoutInfo => layoutInfo.labelBBox.y)
      .attr('width', layoutInfo => layoutInfo.labelBBox.width)
      .attr('height', layoutInfo => layoutInfo.labelBBox.height);

    const textGroup = svg.append('g').attr('class', 'excentricLabelingText');
    textGroup
      .selectAll('text')
      .data(result)
      .join('text')
      .attr('stroke', layoutInfo => layoutInfo.rawInfo.color)
      .attr('x', layoutInfo => layoutInfo.labelBBox.x)
      .attr('y', layoutInfo => layoutInfo.labelBBox.y)
      .attr('dominant-baseline', 'hanging')
      .text(layoutInfo => layoutInfo.rawInfo.labelName);
  }
});