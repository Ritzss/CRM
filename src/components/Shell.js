import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function Shell({ profile, user, children }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#F6F6F3]">
        <Sidebar profile={profile} user={user} />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
