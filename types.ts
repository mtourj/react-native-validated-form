export interface ScrollableComponent<P = any, S = any>
  extends React.Component<P, S> {
  getScrollResponder: () => void;
  scrollTo: (y: number, x?: number, animated?: boolean) => void;
  scrollToPosition: (x: number, y: number, animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  scrollForExtraHeightOnAndroid: (extraHeight: number) => void;
  scrollToFocusedInput: (
    reactNode: Object,
    extraHeight?: number,
    keyboardOpeningTime?: number
  ) => void;
}
