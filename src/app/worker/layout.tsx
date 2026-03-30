export const metadata = {
  title: 'Worker Hours — Back of Beyond Ranch',
  description: 'Log your daily work hours',
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f3f4f6', color: '#111827' }}>
        {children}
      </body>
    </html>
  );
}
