/** Props shared by every Next.js route error boundary. */
export type RouteErrorProps = {
  error: unknown;
  reset: () => void;
};
