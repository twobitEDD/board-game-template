/// <reference types="react-scripts" />

// React 19 JSX compatibility - allow ExoticComponent to be used as JSX
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass {
      render(): React.ReactNode;
    }
    interface IntrinsicAttributes extends React.Attributes {}
    interface ElementChildrenAttribute {
      children: {};
    }
    interface ElementAttributesProperty {
      props: {};
    }
  }
}



// Dynamic Labs component type overrides for React 19 compatibility
declare module '@dynamic-labs/sdk-react-core' {
  import { ReactElement, ReactNode } from 'react';
  
  interface DynamicContextProps {
    settings: any;
    children: ReactNode;
  }
  
  export const DynamicContextProvider: (props: DynamicContextProps) => ReactElement | null;
  export const useDynamicContext: () => any;
}
