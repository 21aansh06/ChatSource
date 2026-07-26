import { NotebookList } from '@/features/notebooks/components/NotebookList';

export const metadata = {
  title: 'My Notebooks | NotebookLM ChatSource',
  description: 'Manage your RAG notebook containers and source collections.',
};

export default function NotebooksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <NotebookList />
    </div>
  );
}
