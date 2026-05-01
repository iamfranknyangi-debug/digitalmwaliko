import { CardTemplate } from '@/lib/types';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface Props {
  template: CardTemplate;
  title?: string;
  host?: string;
  venue?: string;
  date?: string;
  time?: string;
  description?: string;
  variant?: 'thumb' | 'full';
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Modern, professional invitation card preview.
 * Each thumbnail key maps to a unique graphic composition built with SVG + CSS.
 */
export function TemplatePreview({
  template,
  title,
  host,
  venue,
  date,
  time,
  description,
  variant = 'thumb',
}: Props) {
  const [c1, c2, accent] = template.colors;
  const isFull = variant === 'full';
  const t = title || template.name;
  const isSerif = template.font === 'Playfair Display';
  const fontFamily = isSerif ? "'Playfair Display', serif" : "'Inter', sans-serif";

  const wrap = (children: React.ReactNode, bg: string, text = '#ffffff') => (
    <div
      className={`relative w-full overflow-hidden ${isFull ? 'rounded-xl' : 'rounded-lg'}`}
      style={{
        background: bg,
        color: text,
        aspectRatio: isFull ? '3 / 4' : '4 / 5',
        fontFamily,
      }}
    >
      {children}
    </div>
  );

  // Reusable inner content block
  const Content = ({
    align = 'center',
    accentColor,
    invitedLabel = 'Together with their families',
    smallText,
  }: {
    align?: 'center' | 'left';
    accentColor: string;
    invitedLabel?: string;
    smallText?: string;
  }) => (
    <div
      className={`relative z-10 h-full flex flex-col ${
        align === 'center' ? 'items-center text-center' : 'items-start text-left'
      } justify-center px-6 py-8`}
    >
      <p
        className="uppercase tracking-[0.35em] mb-3 opacity-80"
        style={{ fontSize: isFull ? 10 : 7, color: accentColor, fontFamily: "'Inter', sans-serif" }}
      >
        {invitedLabel}
      </p>
      <h3
        className="font-bold leading-tight mb-2"
        style={{ fontSize: isFull ? 32 : 18, fontFamily }}
      >
        {t}
      </h3>
      {host && (
        <p className="opacity-75 mb-3" style={{ fontSize: isFull ? 12 : 8, fontFamily: "'Inter', sans-serif" }}>
          {host}
        </p>
      )}
      <div
        className="my-2"
        style={{ width: isFull ? 60 : 30, height: 1, background: accentColor, opacity: 0.6 }}
      />
      {isFull && (venue || date || time) && (
        <div className="space-y-1 mt-2 text-xs opacity-90" style={{ fontFamily: "'Inter', sans-serif" }}>
          {date && (
            <p className="flex items-center justify-center gap-2">
              <Calendar className="w-3 h-3" /> {fmtDate(date)}
            </p>
          )}
          {time && (
            <p className="flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" /> {time}
            </p>
          )}
          {venue && (
            <p className="flex items-center justify-center gap-2">
              <MapPin className="w-3 h-3" /> {venue}
            </p>
          )}
        </div>
      )}
      {isFull && description && (
        <p
          className="mt-4 italic opacity-80 max-w-xs"
          style={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }}
        >
          "{description}"
        </p>
      )}
      {smallText && !isFull && (
        <p className="mt-2 opacity-60" style={{ fontSize: 7, fontFamily: "'Inter', sans-serif" }}>
          {smallText}
        </p>
      )}
    </div>
  );

  switch (template.thumbnail) {
    /* ---------- Royal Gold: dark navy + ornate gold corners ---------- */
    case 'royal-gold':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="rg" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 4 Q4 0 8 4 Q4 8 0 4" fill="none" stroke={accent} strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#rg)" />
          </svg>
          {/* Gold corner ornaments */}
          {['top-3 left-3', 'top-3 right-3 rotate-90', 'bottom-3 left-3 -rotate-90', 'bottom-3 right-3 rotate-180'].map(
            (pos, i) => (
              <svg key={i} className={`absolute ${pos}`} width={isFull ? 40 : 22} height={isFull ? 40 : 22} viewBox="0 0 40 40">
                <path d="M2 2 L38 2 M2 2 L2 38 M2 2 Q12 12 22 2 M2 2 Q12 12 2 22" stroke={accent} strokeWidth="1" fill="none" />
                <circle cx="2" cy="2" r="2" fill={accent} />
              </svg>
            )
          )}
          <div
            className="absolute inset-4 border"
            style={{ borderColor: accent, opacity: 0.4 }}
          />
          <Content accentColor={accent} invitedLabel="The Honour of Your Presence" />
        </>,
        `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Emerald Botanical: deep green + leaf motifs ---------- */
    case 'emerald-botanical':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
            <g fill={accent} opacity="0.18">
              <path d="M-10 -10 Q40 30 20 80 Q0 50 -10 80 Z" />
              <path d="M210 260 Q160 220 180 170 Q200 200 210 170 Z" />
              <ellipse cx="170" cy="40" rx="25" ry="8" transform="rotate(35 170 40)" />
              <ellipse cx="30" cy="220" rx="25" ry="8" transform="rotate(-35 30 220)" />
            </g>
            <g stroke={accent} strokeWidth="0.5" fill="none" opacity="0.4">
              <path d="M0 0 Q30 40 15 90" />
              <path d="M200 250 Q170 210 185 160" />
            </g>
          </svg>
          <Content accentColor={accent} invitedLabel="A Garden Celebration" />
        </>,
        `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Blush Minimal: warm cream + thin arch ---------- */
    case 'blush-minimal':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
            <path d="M40 230 Q40 100 100 100 Q160 100 160 230" stroke={accent} strokeWidth="0.8" fill="none" opacity="0.5" />
            <circle cx="100" cy="60" r="3" fill={accent} opacity="0.6" />
          </svg>
          <Content accentColor={accent} invitedLabel="Save the Date" />
        </>,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`,
        accent
      );

    /* ---------- Confetti Pop: gradient + floating shapes ---------- */
    case 'confetti-pop':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 18 }).map((_, i) => {
              const x = (i * 37) % 200;
              const y = (i * 53) % 250;
              const colors = [accent, '#ffffff', c2];
              const fill = colors[i % 3];
              const shape = i % 3;
              return shape === 0 ? (
                <circle key={i} cx={x} cy={y} r={3} fill={fill} opacity="0.85" />
              ) : shape === 1 ? (
                <rect key={i} x={x} y={y} width="5" height="5" fill={fill} opacity="0.8" transform={`rotate(${i * 20} ${x} ${y})`} />
              ) : (
                <path key={i} d={`M${x} ${y} L${x + 4} ${y + 7} L${x - 4} ${y + 7} Z`} fill={fill} opacity="0.75" />
              );
            })}
          </svg>
          <Content accentColor="#ffffff" invitedLabel="Let's Celebrate" />
        </>,
        `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Midnight Bloom: dark gradient + glowing florals ---------- */
    case 'midnight-bloom':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="mb-glow" cx="50%" cy="0%" r="80%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="200" height="250" fill="url(#mb-glow)" />
            <g stroke={accent} fill="none" strokeWidth="0.6" opacity="0.6">
              <circle cx="30" cy="40" r="14" />
              <circle cx="30" cy="40" r="7" />
              <circle cx="170" cy="210" r="18" />
              <circle cx="170" cy="210" r="9" />
              <path d="M30 26 L30 54 M16 40 L44 40 M20 30 L40 50 M40 30 L20 50" />
            </g>
          </svg>
          <Content accentColor={accent} invitedLabel="An Evening Affair" />
        </>,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Executive Navy: corporate, lines + monogram ---------- */
    case 'executive-navy':
      return wrap(
        <>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: accent }} />
          <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: accent }} />
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 250" preserveAspectRatio="none">
            <g stroke="#ffffff" strokeWidth="0.3">
              {Array.from({ length: 25 }).map((_, i) => (
                <line key={i} x1={i * 8} y1="0" x2={i * 8} y2="250" />
              ))}
            </g>
          </svg>
          <div
            className={`absolute ${isFull ? 'top-6 right-6 w-12 h-12' : 'top-3 right-3 w-7 h-7'} border flex items-center justify-center font-bold`}
            style={{ borderColor: accent, color: accent, fontFamily: "'Playfair Display', serif", fontSize: isFull ? 18 : 11 }}
          >
            {(t[0] || 'E').toUpperCase()}
          </div>
          <Content accentColor={accent} invitedLabel="Cordially Invited" />
        </>,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Modern Mono: light, swiss, geometric ---------- */
    case 'modern-mono':
      return wrap(
        <>
          <div className="absolute top-0 left-0 w-1/2 h-1" style={{ background: c2 }} />
          <div className="absolute bottom-0 right-0 w-1/2 h-1" style={{ background: c2 }} />
          <div
            className={`absolute ${isFull ? 'top-6 left-6' : 'top-3 left-3'} font-mono uppercase tracking-widest`}
            style={{ fontSize: isFull ? 9 : 6, color: accent }}
          >
            № 001 — Invitation
          </div>
          <div
            className={`absolute ${isFull ? 'bottom-6 right-6' : 'bottom-3 right-3'} font-mono`}
            style={{ fontSize: isFull ? 9 : 6, color: accent }}
          >
            {date ? fmtDate(date) : '—'}
          </div>
          <Content accentColor={accent} invitedLabel="You're Invited" />
        </>,
        c1,
        c2
      );

    /* ---------- Pastel Cloud: soft pink/blue gradient + dots ---------- */
    case 'pastel-cloud':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
            <circle cx="20" cy="30" r="35" fill={c2} opacity="0.5" />
            <circle cx="180" cy="220" r="45" fill={accent} opacity="0.35" />
            <circle cx="160" cy="50" r="18" fill={accent} opacity="0.25" />
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={i} cx={20 + i * 22} cy={130 + (i % 2) * 8} r="1.5" fill={accent} opacity="0.6" />
            ))}
          </svg>
          <Content accentColor="#8b4a6f" invitedLabel="Welcoming Baby" />
        </>,
        `linear-gradient(180deg, ${c1} 0%, #ffffff 100%)`,
        '#5b3a4f'
      );

    /* ---------- Scholar Crest: graduation, crest + ribbon ---------- */
    case 'scholar-crest':
      return wrap(
        <>
          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 200 250" preserveAspectRatio="none">
            <defs>
              <pattern id="sc-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke={accent} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="250" fill="url(#sc-stripe)" />
          </svg>
          <svg
            className={`absolute left-1/2 -translate-x-1/2 ${isFull ? 'top-6' : 'top-2'}`}
            width={isFull ? 60 : 30}
            height={isFull ? 70 : 35}
            viewBox="0 0 60 70"
          >
            <path d="M30 2 L58 14 L52 50 Q30 66 8 50 L2 14 Z" stroke={accent} strokeWidth="1.5" fill={c2} fillOpacity="0.6" />
            <path d="M30 18 L36 30 L48 30 L38 38 L42 50 L30 42 L18 50 L22 38 L12 30 L24 30 Z" fill={accent} />
          </svg>
          <Content accentColor={accent} invitedLabel="Class of 2026" />
        </>,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    default:
      return wrap(
        <Content accentColor={accent} invitedLabel="You're Invited" />,
        `linear-gradient(135deg, ${c1}, ${c2})`
      );
  }
}