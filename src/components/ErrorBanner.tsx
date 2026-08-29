export function ErrorBanner({ message }: { message: string }) {
  return <p className="banner banner--error">{message}</p>;
}
