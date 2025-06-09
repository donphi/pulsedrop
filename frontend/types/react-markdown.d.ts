declare module 'react-markdown' {
  import { ReactNode } from 'react';

  export interface ReactMarkdownOptions {
    children: string;
    remarkPlugins?: any[];
    [key: string]: any;
  }

  export default function ReactMarkdown(props: ReactMarkdownOptions): ReactNode;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
}