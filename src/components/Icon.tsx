import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'plus'
  | 'close'
  | 'sun'
  | 'moon'
  | 'search'
  | 'import'
  | 'export'
  | 'refresh'
  | 'covers'
  | 'spines'
  | 'pencil'
  | 'trash'
  | 'check'
  | 'alert'
  | 'image';

// Trazos de 24×24 con grosor uniforme: un único sistema de iconos para toda la app.
const PATHS: Record<IconName, ReactElement> = {
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  import: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
  export: <path d="M12 15V3M7 8l5-5 5 5M4 20h16" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 3.5V8h4.5M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20.5V16h-4.5" />
    </>
  ),
  covers: (
    <>
      <rect x="3.5" y="4" width="7" height="10" rx="1" />
      <rect x="13.5" y="4" width="7" height="10" rx="1" />
      <path d="M2.5 18h19" />
    </>
  ),
  spines: (
    <>
      <rect x="4" y="4" width="3.5" height="13" rx="0.6" />
      <rect x="9.5" y="6" width="4.5" height="11" rx="0.6" />
      <rect x="16" y="3.5" width="3.5" height="13.5" rx="0.6" />
      <path d="M2.5 20h19" />
    </>
  ),
  pencil: <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20zM13.5 7l3 3" />,
  trash: <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10 10.5v6M14 10.5v6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20.5 16l-5-5-9 8.5" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Estrella estampada: rellena o en hueco, para valoraciones. */
export function StarGlyph({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8L12 2.8z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
