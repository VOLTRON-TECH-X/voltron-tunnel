export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
      <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export default LoadingSpinner;
