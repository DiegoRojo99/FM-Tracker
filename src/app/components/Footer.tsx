export default function Footer(){
  return (
    <footer className="bg-[var(--color-dark)] text-center py-6 text-sm text-[var(--text-muted)] border-t border-[var(--color-surface)] mt-10">
      &copy; {new Date().getFullYear()} FM Tracker. Built for Football Manager fans.
    </footer>
  )
};