import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import testdata from '../testdata.json';

const memberBox = {
  width: 100,
  height: 60,
  marginHeight: 140,
  marginWidth: 50,
};
const margin = { top: 100, right: 120, bottom: 10, left: 40 };
const width = 1200;
const dx = 600;

export const Tree2 = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);

  const tree = d3
    .tree()
    .nodeSize([
      memberBox.height + memberBox.marginHeight,
      memberBox.width + memberBox.marginWidth,
    ])
    .separation(() => 0.5);
  const root = tree(d3.hierarchy(testdata, (person) => person.nodes));

  root.descendants().forEach((node, i) => {
    node._children = node.children;
    if (node.depth && node.data.level > 3) {
      node.children = null;
    }
  });
  // Center the tree.
  let left = root;
  let right = root;
  root.eachBefore((node) => {
    if (node.x < left.x) {
      left = node;
    }
    if (node.x > right.x) {
      right = node;
    }
  });

  useEffect(() => {
    nodesRef.current.innerHTML = '';

    let height = right.x - left.x + margin.top + margin.bottom;
    height = Math.max(height, 320);

    tree(root);

    const svg = d3.select(svgRef.current);
    svg.attr('viewBox', [-margin.left, left.x - margin.top, width, height]);

    const gLink = d3
      .select(linesRef.current)
      .attr('fill', 'none')
      .attr('stroke', 'orange')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // const gNode = ;

    const nodeEnter = d3
      .select(nodesRef.current)
      .selectAll('rect')
      .data(() => root.descendants())
      .join('rect')
      .attr('fill', 'blue')
      .attr('x', -(memberBox.width / 2))
      .attr('y', -(memberBox.height / 2))
      .attr('width', memberBox.width)
      .attr('height', memberBox.height)
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1);

    gLink
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr(
        'd',
        d3
          .link<unknown, d3.HierarchyPointNode<any>>(d3.curveStep)
          .x((d) => d.y)
          .y((d) => d.x)
      );
  }, []);

  return (
    <div className="container">
      <svg
        ref={svgRef}
        max-width="100%"
        height="auto"
        viewBox={`${-margin.left} ${-margin.top} ${width} ${dx}`}
      >
        <g className="lines" ref={linesRef}></g>
        <g className="nodes" ref={nodesRef}></g>
      </svg>
    </div>
  );
};
