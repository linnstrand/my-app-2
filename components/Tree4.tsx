import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import testdata from '../testdata.json';

const width = 1200;

export const Tree3 = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const dx = 800;
  const dy = width / 6;
  const margin = { top: 10, right: 120, bottom: 10, left: 40 };
  const memberBox = {
    width: 205,
    height: 65,
    marginHeight: 180,
    marginWidth: 50,
  };

  useEffect(() => {
    containerRef.current.innerHTML = '';

    const tree = d3
      .tree()
      .nodeSize([
        memberBox.height + memberBox.marginHeight,
        memberBox.width + memberBox.marginWidth,
      ])
      .separation(() => 0.5);
    const root = d3.hierarchy(testdata, (person) => {
      return person.nodes;
    });

    root.x0 = dy / 20;
    root.y0 = 0;

    root.descendants().forEach((node, i) => {
      node._children = node.children;
      if (node.depth && node.data.level > 3) {
        node.children = null;
      }
    });

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('viewBox', [-margin.left, -margin.top, width, dx]);
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

    const update = (source) => {
      console.log('update with source: ', source);

      const nodes = root.descendants().reverse();
      const links = root.links();

      tree(root);

      // find min & max x (vertical)
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

      let height = right.x - left.x + margin.top + margin.bottom;
      height = Math.max(height, 320);

      svg.attr('viewBox', () => [
        -margin.left - memberBox.width / 2,
        left.x - margin.top - memberBox.height / 2,
        width,
        height + memberBox.height,
      ]);

      // update the nodes...
      const node = gNode
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      node
        .append('rect')
        .attr('fill-opacity', 0.5)
        .attr('stroke-opacity', 1)
        .attr('fill', 'blue')
        .attr('x', -(memberBox.width / 2))
        .attr('y', -(memberBox.height / 2))
        .attr('width', memberBox.width)
        .attr('height', memberBox.height);

      addExpandIcon(node);
      addText(node);

      node.attr('transform', (d) => `translate(${d.y},${d.x})`);

      gLink
        .selectAll('path')
        .data(links)
        .join('path')
        .attr(
          'd',
          d3
            .link<unknown, d3.HierarchyPointNode<any>>(d3.curveStep)
            .x((d) => d.y)
            .y((d) => d.x)
        );

      // Stash the old positions for transition.
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function addExpandIcon(nodeEnter) {
        let expandIcon = nodeEnter
          .append('g')
          .attr('class', 'expandIcon')
          .attr(
            'transform',
            (d) => `translate(${memberBox.width / 2 - 15},${-10})`
          );

        expandIcon
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 3)
          .attr('fill', '#aaa');

        expandIcon
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 10)
          .attr('r', 3)
          .attr('fill', '#aaa');

        expandIcon
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 20)
          .attr('r', 3)
          .attr('fill', '#aaa');

        expandIcon
          .append('rect')
          .attr('class', 'box')
          .attr('x', -8)
          .attr('y', -8)
          .attr('width', 16)
          .attr('height', 36)
          .style('fill-opacity', 0)
          .style('stroke-opacity', 0)
          .on('click', (event, d) => {
            // event.stopPropagation();
            if (d.children) {
              d._children = [...d.children];
              d.children = null;
            } else if (d._children) {
              d.children = [...d._children];
              d._children = null;
            }
            update(d);
          });
      }

      function addText(nodeEnter) {
        const yOffset = 10;

        nodeEnter
          .append('text')
          .attr('dx', -(memberBox.width / 2) + 10)
          .attr('dy', -memberBox.height / 2 + 25 + yOffset)
          .attr('text-anchor', 'left')
          .attr('class', 'name')
          .attr('level', (d) => d.data.level)
          .on('click', (event, d) => {
            event.stopPropagation();
            console.warn('Show modal for: ', d.data.name);
          })
          .text((d) => nodeName(d)) // Check for null firstName in the case of 'Unknown' lastName.
          .style('fill-opacity', 1);
      }

      function nodeName(node) {
        const person = node.data;
        return person.name;
      }
    };
    update(root);
  }, []);

  return <div ref={containerRef} className="container"></div>;
};
