import NewSaveForm from '@/app/add-save/NewSaveForm';

export default function NewSavePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-background)] via-[var(--color-dark)] to-[var(--color-darker)] px-4 py-8 sm:px-6 sm:py-10">
      <NewSaveForm />
    </div>
  );
}
