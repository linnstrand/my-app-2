import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Data } from './util';
import testdata from '../testdata.json';

export const Tree = () => {
  const size = 1000;
  const [data, setData] = useState({
    name: 'graph',
    children: [
      { name: 'BetweennessCentrality', value: 3534 },
      { name: 'LinkDistance', value: 5731 },
      { name: 'MaxFlowMinCut', value: 7840 },
      { name: 'ShortestPaths', value: 5914 },
      { name: 'SpanningTree', value: 3416 },
    ],
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);

  const margin = { top: 10, right: 120, bottom: 10, left: 40 };
  const memberBox = {
    width: 205,
    height: 65,
    marginHeight: 180,
    marginWidth: 50,
  };
  const direction = 1;

  const setStartPosition = (transform: string) => {
    d3.select(linesRef.current).attr('transform', transform);
    d3.select(nodesRef.current).attr('transform', transform);
  };

  useEffect(() => {
    const tree = d3
      .tree()
      .nodeSize([
        memberBox.height + memberBox.marginHeight,
        memberBox.width + memberBox.marginWidth,
      ])
      .separation(() => 0.5);

    const hierarchy = tree(d3.hierarchy(data)).sort((a, b) =>
      d3.descending(a.height, b.height)
    ); // set x/y
    // prevent appending duplicates, since useLayoutEffect runs twice
    nodesRef.current.innerHTML = '';

    const links =
      // we want to set start position, same as nodes
      d3
        .select(linesRef.current)
        .selectAll('path')
        .data(() => hierarchy.links())
        .join('path')
        .attr('stroke', 'white');

    const nodes = d3
      .select(nodesRef.current)
      .selectAll('g')
      .data(() => hierarchy.descendants())
      .join('g');

    nodes
      .append('foreignObject')
      .attr('x', 100)
      .attr('y', 400)
      .attr('width', 100)
      .attr('height', 40).html(`<div class="card">
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

    // Center the tree
    // if the tree is left/right (it is), x is used to calculate height
    let x0 = size;
    let x1 = -size;
    hierarchy.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const rootElement = d3
      .select(nodesRef.current)
      .selectChild()
      .node() as SVGGraphicsElement;
    // its better to adjust position with translate then changing the viewport
    setStartPosition(
      `translate(${Math.ceil(rootElement?.getBBox()?.width ?? 60 + 10)},${
        -x0 + 10
      })`
    );
    // We let tree height be dynamic to keep the margins and size
    const height = x1 - x0 + 10 * 2;
    const svg = d3.select(svgRef.current);
    svg.attr('height', () => height);
    svg.attr('viewBox', () => [0, 0, size, height]);
  }, []);

  return (
    <>
      <div className="tree-container">
        <div className="container">
          <svg
            ref={svgRef}
            width={`${size}px`}
            height={`${size}px`}
            viewBox={`0 0 ${100} ${size}`}
          >
            <g className="lines" ref={linesRef}></g>
            <g className="nodes" ref={nodesRef}></g>
          </svg>
        </div>
      </div>
    </>
  );
};
