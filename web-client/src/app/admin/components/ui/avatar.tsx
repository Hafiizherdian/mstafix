import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL gambar avatar. Jika kosong maka akan menampilkan inisial */
  src?: string;
  /** Nama lengkap untuk inisial & alt */
  name: string;
  /** Ukuran avatar dalam pixel. Default 36 */
  size?: number;
}

export function Avatar({ src, name, size = 36, className, ...props }: AvatarProps) {
  const initials = React.useMemo(() => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden bg-zinc-700 text-xs font-medium text-white select-none',
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Avatar ${name}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
