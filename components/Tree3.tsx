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

export const Tree3 = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const dx = 600;
  const height = 800;
  const dy = width / 6;
  const margin = { top: 10, right: 120, bottom: 10, left: 40 };
  const memberBox = {
    width: 205,
    height: 65,
    marginHeight: 180,
    marginWidth: 50,
  };
  const direction = 1;

  useEffect(() => {
    containerRef.current.innerHTML = '';
    function zoomed({ transform }) {
      gContainer.attr('transform', transform);
    }

    const zoom = d3.zoom().scaleExtent([0.5, 2]).on('zoom', zoomed);

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

    console.log('root: ', root);

    console.log(`width: ${width}`);
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
    // .on('click', reset);
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

    svg.call(zoom);

    function reset() {
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([150, height / 2])
        );
    }

    function update(source) {
      console.log('update with source: ', source);

      const nodes = root.descendants().reverse();
      const links = root.links();
      const duration = 350;

      // compute the new tree layout.
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

      const transition = svg
        .transition()
        .duration(duration)
        .ease(d3.easeQuad)
        .attr('viewBox', [-margin.left, left.x - margin.top, width, height])
        .tween(
          'resize',
          window.ResizeObserver ? null : () => svg.dispatch('toggle')
        );

      // update the nodes...
      const node = gNode
        .selectAll('g.node')
        .data(nodes, (d) => d.id)
        // @ts-ignore
        .call(
          d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );
      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('class', (node) => addNodeClasses(node));

      nodeEnter
        .append('rect')
        .attr('class', 'frame')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0);

      // add expandIcon
      addExpandIcon(nodeEnter);
      addText(nodeEnter);

      nodeEnter
        .append('path')
        .attr('class', 'blessing-indicator')
        .attr('d', 'M0 0 L10 0, 0 10 Z')
        .attr('stroke-width', 1)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0);

      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      nodeUpdate
        .select('rect.frame')
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1)
        .attr('x', -(memberBox.width / 2))
        .attr('y', -(memberBox.height / 2))
        .attr('width', memberBox.width)
        .attr('height', memberBox.height);

      nodeUpdate
        .select('path.blessing-indicator')
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attr(
          'transform',
          `translate(${-memberBox.width / 2 + 1}, ${-memberBox.height / 2 + 1})`
        );

      nodeUpdate
        .select('.expandIcon')
        .style('visibility', (node) => {
          // const person = node.data;
          // console.log('expandIcon node: ', node);
          // const v = (person.nodes?.length > 0) || false;
          const v = node.children?.length > 0 || node._children?.length > 0;
          // console.log('expandIcon visible: ', v);
          return v ? 'visible' : 'hidden';
        })
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);
      // .attr('name', (d) => { console.log('nodeUpdate expandIcon d: ', d); })

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr(
          'transform',
          (d) => `translate(${direction * source.y},${source.x})`
        )
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);

      nodeExit
        .select('path.blessing-indicator')
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .attr('transform', 'translate(0, 0)');

      // Update the links…
      const link = gLink.selectAll('path').data(links, (d) => d.target.id);

      function transitionElbow(d) {
        return (
          'M' +
          d.source.y +
          ',' +
          d.source.x +
          'H' +
          d.source.y +
          'V' +
          d.source.x +
          'H' +
          d.source.y
        );
      }
      function elbow(d, direction) {
        const memberBox = {
          width: 205,
          height: 65,
          marginHeight: 180,
          marginWidth: 50,
        };

        // start point x1, y1
        const x1 = d.source.y + (direction * memberBox.width) / 2;
        const y1 = d.source.x;
        // endpoint x4, y4
        const x4 = d.target.y - (direction * memberBox.width) / 2;
        const y4 = d.target.x;

        const x2 = x1 + (x4 - x1) / 2;
        const y2 = y1;

        const x3 = x2;
        const y3 = y4;

        return `M${x1},${y1}H${x2}V${y2 + (y3 - y2)}H${x4}`;
      }
      // Enter any new links at the parent's previous position.
      const linkEnter = link
        .enter()
        .append('path')
        .attr('d', (d) => {
          const o = { x: source.x0, y: source.y0 };
          return transitionElbow({ source: o, target: o });
        });

      // Transition links to their new position.
      link
        .merge(linkEnter)
        .transition(transition)
        .attr('d', (d) => {
          return elbow(d, direction);
        });

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition(transition)
        .remove()
        .attr('d', (d) => {
          const o = { x: source.x, y: source.y };
          return transitionElbow({ source: o, target: o });
        });

      // Stash the old positions for transition.
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function dragstarted() {
        // @ts-ignore
        d3.select(this).raise();
        gContainer.attr('cursor', 'grabbing');
      }

      function dragged(event, d) {
        // @ts-ignore
        d3.select(this)
          .attr('cx', (d.x = event.x))
          .attr('cy', (d.y = event.y));
      }

      function dragended() {
        gContainer.attr('cursor', 'grab');
      }

      function addNodeClasses(node) {
        const displayClasses = ['node', 'person', 'ancestor'];
        const person = node.data;
        console.log('person: ', person);
        if (
          person.id /* && !person.generated && person.datasource === 'zbar' */
        ) {
          displayClasses.push('person-member');
        }
        if (person.isProminent) {
          displayClasses.push('person-prominent');
        }
        if (person.hasDocument) {
          displayClasses.push('person-blessing');
        }
        if (person.unconfirmed) {
          displayClasses.push('person-unconfirmed');
        }
        if (person.level === 1) {
          displayClasses.push('person-match');
        }
        if (
          person.generated ||
          (person.datasource === 'pump' && person.id === null)
        ) {
          displayClasses.push('add-root');
        }
        if (
          person.generated ||
          (person.datasource === 'pump' &&
            person.id !== null &&
            person.id.indexOf('pump') === 0)
        ) {
          displayClasses.push('person-added');
        }
        if (person.childLinked && person.datasource === 'zbar') {
          displayClasses.push('person-added-id');
        }
        return displayClasses.join(' ');
      }

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
    }
    update(root);
  }, []);

  return <div ref={containerRef} className="container"></div>;
};
