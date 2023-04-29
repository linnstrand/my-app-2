import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import {
  memberBox,
  IdHierarchyPointNode,
  width,
  startHeight,
  margin,
  startWidth,
  IdHierarchyNode,
} from './util';

const dy = width / 6;

interface Data {
  parentId?: string;
  id: string;
  children?: Data[];
  name?: string;
}

type t = d3.StratifyOperator<Data>['path'];

interface Props {
  data: Data | Array<Data>;
  path?: Parameters<d3.StratifyOperator<Data>['path']>;
  id?: (d: Data) => string;
  parentId?: (d: Data) => string;
}

const initial = {
  id: '01',
  name: 'start',
};

export const CreateTree = ({
  data,
  path,
  id = Array.isArray(data) ? (d: Data) => d.id : null,
  parentId = Array.isArray(data) ? (d: Data) => d.parentId : null,
}: Props) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const setHierarchy = (data: Data | Array<Data>) => {
    let r;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return d3.hierarchy(initial);
    }
    if (Array.isArray(data)) {
      r = Boolean(path)
        ? d3.stratify().path(path[0])(data)
        : d3.stratify().id(id).parentId(parentId)(data);
    } else {
      r = d3.hierarchy(data);
    }

    r.x0 = dy / 20;
    r.y0 = 0;

    r.descendants().forEach((node, i) => {
      node._children = node.children;
      if (node.depth && node.data.level > 3) {
        node.children = null;
      }
    });
    return r;
  };

  const [root, setRoot] = useState<IdHierarchyPointNode<any>>(
    setHierarchy(data)
  );

  useEffect(() => {
    const update = (source) => {
      const nodes = root.descendants().reverse();
      const links = root.links();

      const tree = d3
        .tree()
        .nodeSize([
          memberBox.height + memberBox.marginHeight,
          memberBox.width + memberBox.marginWidth,
        ])
        .separation(() => 0.5);

      const desc = root.descendants();
      root.descendants().forEach((node, i) => {
        node._children = node.children;
        if (node.depth > 3) {
          node.children = null;
        }
      });
      // Center the tree.
      let left = root;
      let right = root;
      root.eachBefore((node) => {
        if (node.data.x < left.data.x) {
          left = node;
        }
        if (node.data.x > right.data.x) {
          right = node;
        }
      });

      tree(root);

      let x0 = width;
      let x1 = -width;
      let y0 = startHeight;
      let y1 = -startHeight;
      root.each((d) => {
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

      const transition = svg
        .transition()
        .duration(200)
        .attr(
          'viewBox',
          `${-margin.left - memberBox.width / 2} ${
            x0 - memberBox.height - margin.top
          } ${wwidth} ${height}`
        );

      // update the nodes...
      const node = gNode.selectAll('g').data(nodes);

      // Enter new nodes at the clicked node
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('transform', (_) => `translate(${source.y0},${source.x0})`)
        .on('click', (_, d) => {
          setHierarchy(
            Array.isArray(data)
              ? [...data, { id: '02', name: 'new item' }]
              : [data, { id: '02', name: 'new item' }]
          );
          update(root);
        });

      const nodeFrame = nodeEnter
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0);

      nodeEnter
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('level', (d) => d.data.level)
        .text((d) => d.data.name)
        .style('fill-opacity', 1);

      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      nodeFrame
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1)
        .attr('fill', 'white')
        .attr('x', -(memberBox.width / 2))
        .attr('y', -(memberBox.height / 2))
        .attr('width', memberBox.width)
        .attr('height', memberBox.height);

      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr('transform', (d) => `translate(${source.y},${source.x})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);

      const link = gLink.selectAll('path').data(links, (d: any) => d.target.id);

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
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };
    const svg = d3.select(svgRef.current);

    const gContainer = svg
      .append('g')
      .attr('cursor', 'grab')
      .attr('id', 'SVGcontainer')
      .classed('svg-content-responsive', true);

    const gLink = gContainer
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    const gNode = gContainer
      .append('g')
      .attr('id', 'node-container')
      .attr('cursor', 'pointer')
      .attr('pointer-events', 'all');
    update(root);
  }, []);

  return (
    <div className="container">
      <svg
        ref={svgRef}
        preserveAspectRatio="xMidYMid meet"
        width={`${startWidth}px`}
        height={`${startHeight}px`}
        viewBox={`${-margin.left - memberBox.width / 2} ${
          -memberBox.height - margin.top
        } ${startWidth} ${startHeight}`}
      ></svg>
    </div>
  );
};
