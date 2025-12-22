'use client';

import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { IconStar } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { useDemoSession } from '@/contexts/demo-session';
import { toast } from 'sonner';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  const { signInWithGoogle, authReady, authError, clearAuthError } =
    useDemoSession();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!authError) return;
    toast.error(authError);
    clearAuthError();
  }, [authError, clearAuthError]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Login
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <img
            src='/assets/branding/logos/cueva.png'
            alt='Cueva logo'
            className='mr-2 h-7 w-7'
          />
          Laura Butallo Web Dashboard
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        {/* <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;This starter template has saved me countless hours of work
              and helped me deliver projects to my clients faster than ever
              before.&rdquo;
            </p>
            <footer className='text-sm'>Random Dude</footer>
          </blockquote>
        </div> */}
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='text-center text-xl font-bold'>Hola, de nuevo 👋</div>
          <div className='w-full space-y-4'>
            <Button
              type='button'
              variant='outline'
              className='flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-black text-base font-semibold'
              onClick={handleGoogleSignIn}
              disabled={!authReady || signingIn}
            >
              <img
                src='/assets/branding/logos/google_g_logo.svg'
                alt='Google'
                className='h-5 w-5'
              />
              {signingIn ? 'Ingresando…' : 'Continuar con Google'}
            </Button>
          </div>

          <p className='text-muted-foreground px-8 text-center text-sm'>
            Al hacer clic en continuar, aceptas nuestros{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Términos de Servicio
            </Link>{' '}
            y la{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
