import AdminProtection from '@/components/AdminProtection';

export default function AdminLayout({ children }) {
  return (
    <AdminProtection>
      {children}
    </AdminProtection>
  );
}
