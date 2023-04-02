export interface IdHierarchyNode<T> extends d3.HierarchyNode<T> {
  id?: string;
  _children?: any[];
  x0: number;
  y0: number;
}

export interface IdHierarchyPointNode<T> extends d3.HierarchyPointNode<T> {
  id?: string;
  _children?: any[];
  x0: number;
  y0: number;
}

export const memberBox = {
  width: 160,
  height: 65,
  marginHeight: 180,
  marginWidth: 50,
};

export const width = 1200;
export const startWidth = 940;
export const startHeight = 940;
export const margin = { top: 10, right: 120, bottom: 10, left: 40 };
