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
    const root = d3.hierarchy(testdata, (person) => person.nodes);

    root.x0 = dy / 20;
    root.y0 = 0;

    root.descendants().forEach((node, i) => {
      node.id = i;
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
      const nodes = root.descendants().reverse();
      const links = root.links();

      tree(root);

      let x0 = width;
      let x1 = -width;
      root.each((d) => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
      });

      const height = Math.max(x1 - x0 + margin.top + margin.bottom, 320);

      const transition = svg
        .transition()
        .duration(200)
        .attr('viewBox', [
          -margin.left - memberBox.width / 2,
          x0 - margin.top - memberBox.height / 2,
          width,
          height + memberBox.height,
        ])
        .tween(
          'resize',
          window.ResizeObserver ? null : () => () => svg.dispatch('toggle')
        );

      // update the nodes...
      const node = gNode.selectAll('g.node').data(nodes, (d) => d.id);

      // Enter new nodes
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .on('click', (event, d) => {
          d.children = d.children ? null : d._children;
          update(d);
        });

      nodeEnter
        .append('rect')
        .attr('class', 'frame')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0);
      // nodeEnter
      //   .append('rect')
      //   .attr('fill-opacity', 0.5)
      //   .attr('stroke-opacity', 1)
      //   .attr('fill', 'blue')
      //   .attr('x', -(memberBox.width / 2))
      //   .attr('y', -(memberBox.height / 2))
      //   .attr('width', memberBox.width)
      //   .attr('height', memberBox.height)
      //   .on('click', (e, d) => {
      //     d._children ? (d._children = [...d.children]) : (d._children = null);
      //     update(d);
      //   });

      const yOffset = 10;

      nodeEnter
        .append('text')
        .attr('dx', -(memberBox.width / 2) + 10)
        .attr('dy', -memberBox.height / 2 + 25 + yOffset)
        .attr('text-anchor', 'left')
        .attr('class', 'name')
        .attr('level', (d) => d.data.level)
        .text((d) => d.data?.name)
        .style('fill-opacity', 1);

      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      nodeUpdate
        .select('rect.frame')
        .attr('fill-opacity', 0.5)
        .attr('stroke-opacity', 1)
        .attr('fill', 'blue')
        .attr('x', -(memberBox.width / 2))
        .attr('y', -(memberBox.height / 2))
        .attr('width', memberBox.width)
        .attr('height', memberBox.height);

      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr('transform', (d) => `translate(${1 * source.y},${source.x})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);

      const link = gLink.selectAll('path').data(links, (d) => d.target.id);

      // Enter any new links at the parent's previous position.
      const linkEnter = link
        .enter()
        .append('path')
        .attr(
          'd',
          d3
            .link<unknown, d3.HierarchyPointNode<any>>(d3.curveStep)
            .x((d) => d.y)
            .y((d) => d.x)
        );

      link
        .merge(linkEnter)
        .transition(transition)
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
    };
    update(root);
  }, []);

  return <div ref={containerRef} className="container"></div>;
};
