import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import testdata from '../testdata.json';

const width = 1200;
const startWidth = 940;
const startHeight = 940;
interface IdHierarchyNode<T> extends d3.HierarchyNode<T> {
  id?: string;
  _children?: any[];
  x0: number;
  y0: number;
}

interface IdHierarchyPointNode<T> extends d3.HierarchyPointNode<T> {
  id?: string;
  _children?: any[];
  x0: number;
  y0: number;
}

const dx = 800;
const dy = width / 6;
const margin = { top: 10, right: 120, bottom: 10, left: 40 };
const memberBox = {
  width: 160,
  height: 65,
  marginHeight: 180,
  marginWidth: 50,
};
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

    const pointNode = tree(root) as IdHierarchyPointNode<any>;

    let x0 = width;
    let x1 = -width;
    let y0 = startHeight;
    let y1 = -startHeight;
    pointNode.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const height = Math.max(
      x1 - x0 + margin.top + margin.bottom + memberBox.height / 2,
      startWidth
    );
    const wwidth = Math.max(
      y1 - y0 + margin.left + margin.right + memberBox.width / 2
    );

    // when this changes, we need to do a node update

    const svg = d3.select(svgRef.current);
    svg.attr(
      'viewBox',
      `${-memberBox.width / 2} ${
        x0 - memberBox.height - margin.top
      } ${wwidth} ${height}`
    );

    const gLink = d3
      .select(linesRef.current)
      .attr('fill', 'none')
      .attr('stroke', 'orange')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // const gNode = ;

    const nodeEnter = d3
      .select(nodesRef.current)
      .selectAll('g')
      .data(() => root.descendants())
      .join('g')
      .attr('fill', 'blue')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1);
    nodeEnter
      .append('foreignObject')
      .attr('x', -(memberBox.width / 2))
      .attr('y', -(memberBox.height / 2))
      .attr('width', memberBox.width)
      .attr('height', memberBox.height).html(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">Card title</h5>
          <p class="card-text">
            Some quick example text to build on the card title and make up the
            bulk of the cards content.
          </p>
          <a href="#" class="btn btn-primary">
            Go somewhere
          </a>
        </div>
      </div>`);

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
        preserveAspectRatio="xMidYMid meet"
        width={`${startWidth}px`}
        height={`${startHeight}px`}
        viewBox={`${-margin.left} ${-margin.top} ${width} ${dx}`}
      >
        <g className="lines" ref={linesRef}></g>
        <g className="nodes" ref={nodesRef}></g>
      </svg>
    </div>
  );
};
