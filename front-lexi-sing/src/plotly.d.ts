declare module 'plotly.js-dist' {
  export function newPlot(div: string | HTMLElement, data: any[], layout?: any, config?: any): Promise<void>;
  export function react(div: string | HTMLElement, data: any[], layout?: any, config?: any): Promise<void>;
  export function restyle(div: string | HTMLElement, aobj: any, traces?: number[]): Promise<void>;
  export function relayout(div: string | HTMLElement, aobj: any): Promise<void>;
  export function purge(div: string | HTMLElement): void;
}
