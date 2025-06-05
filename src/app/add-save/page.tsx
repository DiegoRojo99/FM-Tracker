import NewSaveForm from '@/app/add-save/NewSaveForm';

export default function NewSavePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create New Save</h1>
      <div className='mx-auto w-fit'>
        <NewSaveForm />
      </div>
    </div>
  );
}
