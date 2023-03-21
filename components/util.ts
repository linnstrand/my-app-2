import * as d3 from 'd3';
export interface Data {
  name: string;
  value?: number;
  target?: Partial<d3.HierarchyRectangularNode<Data>>;
  current?: d3.HierarchyRectangularNode<Data>;
  children?: Data[];
  color?: string;
}
