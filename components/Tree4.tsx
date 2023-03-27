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
  const [root, setRoot] = useState(() => {
    const r = d3.hierarchy(testdata, (person) => person.nodes);
    r.x0 = dy / 20;
    r.y0 = 0;

    r.descendants().forEach((node, i) => {
      node.id = i;
      node._children = node.children;
      if (node.depth && node.data.level > 3) {
        node.children = null;
      }
    });
    return r;
  });

  const [view, setView] = useState(
    `${-margin.left} ${-margin.top} ${width} ${dx}`
  );

  const tree = d3
    .tree()
    .nodeSize([
      memberBox.height + memberBox.marginHeight,
      memberBox.width + memberBox.marginWidth,
    ])
    .separation(() => 0.5);

  const update = (source = root) => {
    tree(root);
    setNodes(root.descendants().reverse());
    setLinks(root.links());

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

    setView(
      `${-margin.left - memberBox.width / 2} ${
        x0 - memberBox.height - margin.top
      } ${wwidth} ${height}`
    );

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  };

  useEffect(() => {
    if (nodes.length > 0) {
      return;
    }
    update();
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
                  return <path key={l} d={l} />;
                })}
            </g>
            <g className="nodes">
              {nodes &&
                nodes.map((n) => <Leaf key={n.id} n={n} update={update} />)}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

const Leaf = ({ n, update }) => {
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
            <button
              onClick={() => {
                if (n.children) {
                  n._children = [...n.children];
                  n.children = null;
                } else if (n._children) {
                  n.children = [...n._children];
                  n._children = null;
                }
                update(n);
              }}
              className="btn btn-primary"
            >
              expand
            </button>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
