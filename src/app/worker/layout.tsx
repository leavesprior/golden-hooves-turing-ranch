export const metadata = {
  title: 'Worker Hours — Back of Beyond Ranch',
  description: 'Log your daily work hours',
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  // 2026-06-17 fix: a NESTED route layout must NOT render <html>/<body> — only the
  // root app/layout does. Rendering them here caused the hydration error the full
  // test found on /worker and /worker/danna. Use a styled wrapper instead.
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f3f4f6', color: '#111827' }}>
      {children}
    </div>
  );
}
