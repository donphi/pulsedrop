import { LoginForm } from '@/components/auth/LoginForm';
import { AuthTemplate } from '@/components/auth/AuthTemplate';

export default function LoginPage() {
  return (
    <AuthTemplate
      title="Sign in to your account"
      footerText="Not a member?"
      footerLinkText="Register now"
      footerLinkHref="/register"
    >
      <LoginForm />
    </AuthTemplate>
  );
}