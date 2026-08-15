export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error"
          : "rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success"
      }
    >
      {error ?? success}
    </p>
  );
}
