import Auth from '@/components/Auth';
import { useRouter } from 'next/router';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <div>
      <Auth onSuccess={handleAuthSuccess} />
    </div>
  );
}
