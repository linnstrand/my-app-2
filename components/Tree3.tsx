import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import testdata from '../testdata.json';

interface IdHierarchyNode<T> extends d3.HierarchyNode<T> {
  id: string;
  _children?: Item[];
  x0: number;
  y0: number;
}

interface IdHierarchyPointNode<T> extends d3.HierarchyPointNode<T> {
  id: string;
  _children?: IdHierarchyPointNode<Item>[];
  x0: number;
  y0: number;
}

interface Item {
  id: string;
  name: string;
  value?: number;
  target?: Partial<d3.HierarchyRectangularNode<Item>>;
  color?: string;
}

const width = 1200;
const startWidth = 940;
const startHeight = 940;
const dx = 800;
const dy = width / 6;
const margin = { top: 10, right: 120, bottom: 10, left: 40 };
const memberBox = {
  width: 160,
  height: 65,
  marginHeight: 180,
  marginWidth: 50,
};

export const Tree3 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const root = useMemo<IdHierarchyPointNode<Item>>(() => {
    const r = d3.hierarchy(
      testdata,
      (person) => person.nodes
    ) as IdHierarchyPointNode<any>;
    r.x0 = dy / 20;
    r.y0 = 0;

    r.descendants().forEach((node, i) => {
      node.id = i.toString();
      node._children = node.children;
      if (node.depth && node.data.level > 3) {
        node.children = null;
      }
    });
    return r;
  }, []);

  const tree = d3
    .tree<Item>()
    .nodeSize([
      memberBox.height + memberBox.marginHeight,
      memberBox.width + memberBox.marginWidth,
    ])
    .separation(() => 0.5);

  useEffect(() => {
    containerRef.current.innerHTML = '';

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('height', `${startHeight}px`)
      .attr('width', `${startWidth}px`);

    const gContainer = svg
      .append('g')
      .attr('cursor', 'grab')
      .attr('id', 'SVGcontainer')
      .classed('svg-content-responsive', true);

    gContainer
      .append('g')
      .attr('id', 'link-container')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    gContainer
      .append('g')
      .attr('id', 'node-container')
      .attr('cursor', 'pointer')
      .attr('pointer-events', 'all');

    update(root);
  }, []);

  const update = (source: IdHierarchyPointNode<Item>) => {
    const pointNode = tree(root) as IdHierarchyPointNode<Item>;
    const nodes = pointNode.descendants().reverse();
    const links = pointNode.links();

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
      x1 - x0 + margin.top + margin.bottom + memberBox.height * 2,
      startWidth
    );
    const wwidth = Math.max(
      y1 - y0 + margin.left + margin.right + memberBox.width / 2
    );

    const transition = d3
      .select(containerRef.current)
      .select('svg')
      .transition()
      .duration(200)
      .attr(
        'viewBox',
        `${-margin.left - memberBox.width / 2} ${
          x0 - memberBox.height - margin.top
        } ${wwidth} ${height}`
      );

    // update the nodes...
    const node = d3
      .select('#node-container')
      .selectAll('g')
      .data(nodes, (d: IdHierarchyPointNode<Item>) => d.id);

    // Enter new nodes at the clicked node
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
      .on('click', (event, d) => {
        if (d.children) {
          d._children = [...d.children];
          d.children = null;
        } else if (d._children) {
          d.children = [...d._children];
          d._children = null;
        }
        update(d);
      });

    // Transition nodes to their new position.
    node
      .merge(nodeEnter)
      .transition(transition)
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1);

    nodeEnter
      .append('rect')
      .attr('class', 'node-frame')
      .attr('fill-opacity', (d) => (d._children || d.children ? 1 : 0.5))
      .attr('stroke-opacity', 1)
      .attr('x', -(memberBox.width / 2))
      .attr('y', -(memberBox.height / 2))
      .attr('width', memberBox.width)
      .attr('height', memberBox.height);

    const text = nodeEnter.append('text').style('fill-opacity', 1);

    text
      .append('tspan')
      .text((d) => d.data.name)
      .attr('x', -(memberBox.width / 2 - 6))
      .attr('y', -(memberBox.height / 3 - 2));
    text
      .append('tspan')
      .text((d) => d.data.name)
      .attr('x', -(memberBox.width / 2 - 6))
      .attr('y', -(memberBox.height / 3) + 22);
    text
      .append('tspan')
      .text((d) => d.data.name)
      .attr('x', -(memberBox.width / 2 - 6))
      .attr('y', -(memberBox.height / 3) + 42);

    node
      .exit()
      .transition(transition)
      .remove()
      .attr('transform', (d) => `translate(${source.y},${source.x})`)
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0);

    const link = d3
      .select('#link-container')
      .selectAll('path')
      .data(links, (d: Item) => d.target.id);

    // Enter any new links at the parent's previous position.
    const curve = d3
      .link<unknown, d3.HierarchyPointNode<any>>(d3.curveStep)
      .x((d) => d.y)
      .y((d) => d.x);

    const linkEnter = link
      .enter()
      .append('path')
      .attr('d', (d) => {
        const o = { x: source.x0, y: source.y0 };
        return curve({ source: o, target: o });
      });

    // Transition links to their new position.
    link
      .merge(linkEnter)
      .transition(transition)
      .attr('d', (d) => {
        return curve(d, 1);
      });

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr('d', (d) => {
        const o = { x: source.x, y: source.y };
        return curve({ source: o, target: o });
      });

    // Stash the old positions for transition.
    pointNode.each((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  };

  return <div ref={containerRef} className="container"></div>;
};
