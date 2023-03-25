import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import testdata from '../testdata.json';

const width = 1200;
const startWidth = 940;
const startHeight = 940;

export const Tree4 = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<SVGSVGElement>([null]);
  const linesRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState([]);

  const dx = 800;
  const dy = width / 6;
  const margin = { top: 10, right: 120, bottom: 10, left: 40 };
  const memberBox = {
    width: 160,
    height: 65,
    marginHeight: 180,
    marginWidth: 50,
  };

  useEffect(() => {
    if (nodes.length > 0) {
      return;
    }
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

    const svg = d3.select(svgRef.current);
    const gLink = d3.select(linesRef.current);
    const gNode = d3.select(nodesRef.current);

    const update = (source) => {
      const nodes = root.descendants().reverse();
      setNodes(nodes);
      console.log(nodes);
      const links = root.links();

      // how many items on the top lvl?

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
        )
        .tween(
          'resize',
          window.ResizeObserver ? null : () => () => svg.dispatch('toggle')
        );

      const link = gLink.selectAll('path').data(links, (d) => d.target.id);

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
    update(root);
  }, []);

  // return <div ref={containerRef} className="container"></div>;
  return (
    <>
      <div className="tree-container">
        <div className="container">
          <svg
            ref={svgRef}
            width={`${startWidth}px`}
            height={`${startHeight}px`}
            viewBox={`${-margin.left} ${-margin.top} ${width} ${dx}`}
          >
            <g className="lines" ref={linesRef}></g>
            <g className="nodes" ref={nodesRef}>
              {nodes &&
                nodes.map((n) => {
                  console.log(n);
                  return (
                    <g
                      key={n.id}
                      className="node-container"
                      style={{ transform: `translate(${n.y}, ${n.x})` }}
                    >
                      <foreignObject
                        x={memberBox.width / 2}
                        y={memberBox.height / 2}
                        style={{
                          height: memberBox.height,
                          width: memberBox.width,
                        }}
                      >
                        <Leaf source={n} />
                      </foreignObject>
                    </g>
                  );
                })}
            </g>
          </svg>
        </div>
      </div>
    </>
  );
};

const Leaf = ({ source }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{source.data.name}</h5>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the cards content.
        </p>
        <a href="#" className="btn btn-primary">
          Go somewhere
        </a>
      </div>
    </div>
  );
};
