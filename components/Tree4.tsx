import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import testdata from '../testdata.json';

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

export const Tree4 = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [view, setView] = useState(
    `${-margin.left} ${-margin.top} ${width} ${dx}`
  );

  const update = (root) => {
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

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    setNodes(root.descendants().reverse());
    setLinks(root.links());

    const height = Math.max(
      x1 - x0 + margin.top + margin.bottom + memberBox.height * 2,
      startWidth
    );
    const wwidth = Math.max(
      y1 - y0 + margin.left + margin.right + memberBox.width / 2
    );

    setView(
      `${-margin.left - memberBox.width / 2} ${
        x0 - memberBox.height - margin.top
      } ${wwidth} ${height}`
    );
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
    tree(root);
    update(root);
  }, []);

  return (
    <div>
      <div className="tree-container">
        <div className="container">
          <svg
            preserveAspectRatio="xMidYMid meet"
            width={`${startWidth}px`}
            height={`${startHeight}px`}
            viewBox={view}
          >
            <g className="lines">
              {links &&
                links.map((n) => {
                  const l = d3
                    .link<unknown, d3.HierarchyPointNode<any>>(d3.curveStep)
                    .x((d) => d.y)
                    .y((d) => d.x)(n);
                  console.log(l);
                  return <path key={l} d={l} />;
                })}
            </g>
            <g className="nodes">
              {nodes && nodes.map((n) => <Leaf key={n.id} n={n} />)}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

const Leaf = ({ n }) => {
  return (
    <g className="node-container" transform={`translate(${n.y}, ${n.x})`}>
      <foreignObject
        x={-memberBox.width / 2}
        y={-memberBox.height / 2}
        style={{
          height: memberBox.height,
          width: memberBox.width,
        }}
      >
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{n.data.name}</h5>
            <a onClick={() => update(n)} className="btn btn-primary">
              expand
            </a>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
