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

  // ---------- Shared ornate panel used by every refined template ----------
  const script = "'Great Vibes', cursive";
  const serif = "'Playfair Display', serif";
  const sans = "'Inter', sans-serif";

  type PanelTheme = {
    /** ink color for body text inside panel */
    ink: string;
    /** panel background gradient */
    panelBg: string;
    /** primary accent (frame, dividers, icons) */
    accentColor: string;
    /** secondary deep color used for ribbon + bottom pill */
    deep: string;
    /** color of tagline above title */
    tagColor?: string;
    /** small uppercase ribbon label */
    ribbon: string;
    /** large script word above the formal title */
    scriptWord: string;
    /** uppercase tagline above script */
    tagline: string;
  };

  const OrnatePanel = ({
    theme,
    decoration,
  }: {
    theme: PanelTheme;
    /** decorative SVG layer painted behind the panel */
    decoration: React.ReactNode;
  }) => {
    const { ink, panelBg, accentColor, deep, ribbon, scriptWord, tagline } = theme;
    const tagColor = theme.tagColor || ink;
    return (
      <>
        {decoration}

        {/* Inner panel */}
        <div
          className="absolute"
          style={{
            left: '10%',
            right: '10%',
            top: '7%',
            bottom: isFull ? '13%' : '15%',
            background: panelBg,
            borderRadius: 8,
            boxShadow: `inset 0 0 0 1px ${accentColor}66, 0 6px 20px rgba(0,0,0,0.18)`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: 'calc(10% + 6px)',
            right: 'calc(10% + 6px)',
            top: 'calc(7% + 6px)',
            bottom: `calc(${isFull ? '13%' : '15%'} + 6px)`,
            border: `1px solid ${accentColor}`,
            borderRadius: 4,
            opacity: 0.55,
          }}
        />

        {/* Panel content */}
        <div
          className="absolute flex flex-col items-center text-center"
          style={{
            left: '14%',
            right: '14%',
            top: isFull ? '10%' : '10%',
            bottom: isFull ? '17%' : '19%',
            color: ink,
            justifyContent: 'space-between',
            padding: isFull ? '8px 0' : '4px 0',
          }}
        >
          {/* Top: tagline + script + ribbon */}
          <div className="flex flex-col items-center" style={{ width: '100%' }}>
            <svg width={isFull ? 60 : 30} height={isFull ? 14 : 8} viewBox="0 0 60 14">
              <path d="M2 7 Q15 2 30 7 Q45 12 58 7" stroke={accentColor} strokeWidth="0.8" fill="none" />
              <path d="M30 4 L33 7 L30 10 L27 7 Z" fill={accentColor} />
            </svg>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 700,
                fontSize: isFull ? 12 : 6.5,
                letterSpacing: isFull ? 2 : 1,
                marginTop: isFull ? 8 : 4,
                color: tagColor,
              }}
            >
              {tagline}
            </p>
            <p
              style={{
                fontFamily: script,
                fontSize: isFull ? 54 : 26,
                lineHeight: 1,
                color: accentColor,
                marginTop: isFull ? 4 : 2,
              }}
            >
              {scriptWord}
            </p>
            <div
              className="flex items-center justify-center"
              style={{
                background: deep,
                color: '#fff',
                fontFamily: serif,
                fontWeight: 600,
                fontSize: isFull ? 10 : 5.5,
                letterSpacing: isFull ? 2 : 1,
                padding: isFull ? '5px 18px' : '2.5px 9px',
                marginTop: isFull ? 8 : 4,
                borderRadius: 2,
                border: `1px solid ${accentColor}`,
              }}
            >
              <span style={{ color: accentColor, marginRight: 6 }}>•</span>
              {ribbon}
              <span style={{ color: accentColor, marginLeft: 6 }}>•</span>
            </div>
          </div>

          {/* Middle: names */}
          <div className="flex flex-col items-center" style={{ width: '100%' }}>
            {isFull && (
              <p style={{ fontFamily: sans, fontSize: 10.5, color: ink, opacity: 0.85, lineHeight: 1.4 }}>
                With great joy, we invite you to celebrate
              </p>
            )}
            <p
              style={{
                fontFamily: serif,
                fontWeight: 700,
                fontSize: isFull ? 26 : 13,
                color: deep,
                lineHeight: 1.1,
                marginTop: isFull ? 8 : 3,
                letterSpacing: 0.5,
              }}
            >
              {t}
            </p>
            <svg width={isFull ? 80 : 36} height={isFull ? 10 : 6} viewBox="0 0 80 10" style={{ marginTop: 4 }}>
              <line x1="0" y1="5" x2="32" y2="5" stroke={accentColor} strokeWidth="0.6" />
              <path d="M40 2 L44 5 L40 8 L36 5 Z" fill={accentColor} />
              <line x1="48" y1="5" x2="80" y2="5" stroke={accentColor} strokeWidth="0.6" />
            </svg>
            {host && isFull && (
              <p style={{ fontFamily: sans, fontSize: 11, color: ink, opacity: 0.85, marginTop: 6 }}>
                Hosted by {host}
              </p>
            )}
          </div>

          {/* Info row */}
          {isFull ? (
            <div className="flex items-stretch justify-center gap-3" style={{ width: '100%' }}>
              {[
                { icon: <Calendar className="w-3.5 h-3.5" />, label: 'DATE', val: date ? fmtDate(date) : 'Saturday' },
                { icon: <Clock className="w-3.5 h-3.5" />, label: 'TIME', val: time || '6:00 PM' },
                { icon: <MapPin className="w-3.5 h-3.5" />, label: 'VENUE', val: venue || 'Venue Hall' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 flex-1 justify-center px-2"
                  style={{ borderLeft: i > 0 ? `1px solid ${accentColor}55` : 'none' }}
                >
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{ width: 26, height: 26, border: `1.5px solid ${accentColor}`, color: deep, background: '#ffffff' }}
                  >
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p style={{ fontFamily: serif, fontWeight: 700, fontSize: 8.5, letterSpacing: 1.2, color: ink }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily: sans, fontSize: 8.5, color: ink, opacity: 0.85, lineHeight: 1.2 }}>
                      {item.val}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5" style={{ marginTop: 2 }}>
              {[Calendar, Clock, MapPin].map((Icon, i) => (
                <div
                  key={i}
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 11, height: 11, border: `0.8px solid ${accentColor}`, color: deep, background: '#ffffff' }}
                >
                  <Icon style={{ width: 5.5, height: 5.5 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom contact pill */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-between"
          style={{
            bottom: isFull ? '4%' : '5%',
            width: '76%',
            background: deep,
            color: '#fff',
            padding: isFull ? '8px 18px' : '4px 9px',
            borderRadius: 999,
            border: `1px solid ${accentColor}`,
            fontFamily: sans,
            fontSize: isFull ? 8.5 : 4.8,
            boxShadow: `0 4px 12px ${deep}55`,
          }}
        >
          <div className="text-left">
            <p style={{ fontFamily: serif, fontWeight: 700, letterSpacing: 1.2, color: accentColor, fontSize: isFull ? 8.5 : 4.8 }}>
              CONTACT
            </p>
            <p style={{ opacity: 0.95 }}>+255 712 345 678</p>
          </div>
          <svg width={isFull ? 40 : 18} height={isFull ? 10 : 5} viewBox="0 0 40 10">
            <path d="M2 5 Q10 1 20 5 Q30 9 38 5" stroke={accentColor} fill="none" strokeWidth="0.8" />
          </svg>
          <div className="text-right">
            <p style={{ fontFamily: serif, fontWeight: 700, letterSpacing: 1.2, color: accentColor, fontSize: isFull ? 8.5 : 4.8 }}>
              RSVP
            </p>
            <p style={{ opacity: 0.95 }}>Reply by 20th</p>
          </div>
        </div>
      </>
    );
  };

  switch (template.thumbnail) {
    /* ---------- Royal Gold: deep navy + ornate damask ---------- */
    case 'royal-gold':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#2a2418',
            panelBg: 'linear-gradient(180deg, #fffaee 0%, #f5ead0 100%)',
            accentColor: accent,
            deep: c1,
            ribbon: 'WEDDING CEREMONY',
            scriptWord: 'Wedding',
            tagline: 'THE HONOUR OF YOUR PRESENCE',
          }}
          decoration={
            <>
              <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="rg-d" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M0 5 Q5 0 10 5 Q5 10 0 5" fill="none" stroke={accent} strokeWidth="0.4" />
                    <circle cx="5" cy="5" r="0.6" fill={accent} />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#rg-d)" />
              </svg>
              {[
                'top-2 left-2',
                'top-2 right-2 rotate-90',
                'bottom-2 left-2 -rotate-90',
                'bottom-2 right-2 rotate-180',
              ].map((pos, i) => (
                <svg
                  key={i}
                  className={`absolute ${pos}`}
                  width={isFull ? 56 : 28}
                  height={isFull ? 56 : 28}
                  viewBox="0 0 56 56"
                >
                  <path
                    d="M4 4 L52 4 M4 4 L4 52 M4 4 Q20 18 30 4 Q34 18 4 24 M10 10 Q24 14 28 22"
                    stroke={accent}
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle cx="4" cy="4" r="2.5" fill={accent} />
                  <circle cx="30" cy="4" r="1.2" fill={accent} />
                  <circle cx="4" cy="30" r="1.2" fill={accent} />
                </svg>
              ))}
            </>
          }
        />,
        `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Emerald Botanical: deep green + tropical leaves ---------- */
    case 'emerald-botanical':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#1f2a23',
            panelBg: 'linear-gradient(180deg, #fbf8ef 0%, #f0e9d4 100%)',
            accentColor: accent,
            deep: c1,
            ribbon: 'GARDEN CELEBRATION',
            scriptWord: 'Together',
            tagline: 'WE JOYFULLY INVITE YOU',
          }}
          decoration={
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
              <g fill={c1} opacity="0.55">
                <path d="M-10 -10 Q50 20 30 90 Q5 60 -10 90 Z" />
                <path d="M210 260 Q150 230 170 160 Q195 190 210 160 Z" />
              </g>
              <g fill={accent} opacity="0.7">
                <ellipse cx="25" cy="20" rx="22" ry="7" transform="rotate(35 25 20)" />
                <ellipse cx="40" cy="60" rx="18" ry="6" transform="rotate(60 40 60)" />
                <ellipse cx="175" cy="230" rx="22" ry="7" transform="rotate(-35 175 230)" />
                <ellipse cx="160" cy="195" rx="18" ry="6" transform="rotate(-60 160 195)" />
              </g>
              <g stroke={accent} strokeWidth="0.6" fill="none" opacity="0.6">
                <path d="M0 0 Q35 50 18 100" />
                <path d="M200 250 Q165 200 182 150" />
              </g>
            </svg>
          }
        />,
        `linear-gradient(160deg, #f5e9c8 0%, #e8d8a8 100%)`
      );

    /* ---------- Blush Minimal: warm cream + soft arch shadow ---------- */
    case 'blush-minimal':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#5a3a2e',
            panelBg: 'linear-gradient(180deg, #ffffff 0%, #fdf2f0 100%)',
            accentColor: accent,
            deep: '#8b4a3a',
            ribbon: 'SAVE THE DATE',
            scriptWord: 'Forever',
            tagline: 'A LOVE STORY BEGINS',
          }}
          decoration={
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
              <circle cx="40" cy="40" r="60" fill="#f5d8cc" opacity="0.5" />
              <circle cx="170" cy="220" r="55" fill="#eccab8" opacity="0.55" />
              <g stroke={accent} strokeWidth="0.5" fill="none" opacity="0.4">
                <path d="M20 200 Q40 180 60 200 Q40 220 20 200 Z" />
                <path d="M170 50 Q190 30 210 50 Q190 70 170 50 Z" />
              </g>
            </svg>
          }
        />,
        '#fdf2f0'
      );

    /* ---------- Confetti Pop: vibrant gradient birthday ---------- */
    case 'confetti-pop':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#2a1a3a',
            panelBg: 'linear-gradient(180deg, #ffffff 0%, #fef3ff 100%)',
            accentColor: accent,
            deep: c1,
            ribbon: 'BIRTHDAY BASH',
            scriptWord: 'Celebrate',
            tagline: "LET'S MAKE MEMORIES",
          }}
          decoration={
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
              {Array.from({ length: 24 }).map((_, i) => {
                const x = (i * 41) % 200;
                const y = (i * 59) % 250;
                const palette = [accent, c2, '#ffffff', '#fda4af'];
                const fill = palette[i % 4];
                const shape = i % 3;
                return shape === 0 ? (
                  <circle key={i} cx={x} cy={y} r={3} fill={fill} opacity="0.85" />
                ) : shape === 1 ? (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width="5"
                    height="5"
                    fill={fill}
                    opacity="0.8"
                    transform={`rotate(${i * 20} ${x} ${y})`}
                  />
                ) : (
                  <path key={i} d={`M${x} ${y} L${x + 4} ${y + 7} L${x - 4} ${y + 7} Z`} fill={fill} opacity="0.75" />
                );
              })}
            </svg>
          }
        />,
        `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Midnight Bloom: dark + glowing botanicals ---------- */
    case 'midnight-bloom':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#f5ecd4',
            panelBg: 'linear-gradient(180deg, #1a1530 0%, #0c0a1f 100%)',
            accentColor: accent,
            deep: c2,
            ribbon: 'EVENING AFFAIR',
            scriptWord: 'Enchanted',
            tagline: 'UNDER THE STARS',
          }}
          decoration={
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="mb-glow2" cx="50%" cy="0%" r="80%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="200" height="250" fill="url(#mb-glow2)" />
              {Array.from({ length: 30 }).map((_, i) => (
                <circle
                  key={i}
                  cx={(i * 37) % 200}
                  cy={(i * 61) % 250}
                  r={0.8}
                  fill={accent}
                  opacity={0.6}
                />
              ))}
              <g stroke={accent} fill="none" strokeWidth="0.7" opacity="0.65">
                <circle cx="25" cy="35" r="14" />
                <circle cx="25" cy="35" r="7" />
                <circle cx="175" cy="215" r="16" />
                <circle cx="175" cy="215" r="8" />
                <path d="M25 21 L25 49 M11 35 L39 35" />
                <path d="M175 199 L175 231 M159 215 L191 215" />
              </g>
            </svg>
          }
        />,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Executive Navy: refined corporate ---------- */
    case 'executive-navy':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#1a2238',
            panelBg: 'linear-gradient(180deg, #ffffff 0%, #f4f1e8 100%)',
            accentColor: accent,
            deep: c1,
            ribbon: 'CORPORATE GALA',
            scriptWord: 'Distinction',
            tagline: 'CORDIALLY INVITED',
          }}
          decoration={
            <>
              <div className="absolute top-0 left-0 right-0" style={{ height: isFull ? 6 : 3, background: accent }} />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: isFull ? 6 : 3, background: accent }} />
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 250" preserveAspectRatio="none">
                <g stroke="#ffffff" strokeWidth="0.3">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <line key={i} x1={i * 8} y1="0" x2={i * 8} y2="250" />
                  ))}
                </g>
              </svg>
            </>
          }
        />,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Modern Mono: swiss editorial ---------- */
    case 'modern-mono':
      return wrap(
        <OrnatePanel
          theme={{
            ink: c2,
            panelBg: '#ffffff',
            accentColor: '#171717',
            deep: '#171717',
            tagColor: '#171717',
            ribbon: 'EVENT INVITATION',
            scriptWord: 'Gathering',
            tagline: '№ 001 — INVITATION',
          }}
          decoration={
            <>
              <div className="absolute top-0 left-0 w-1/2" style={{ height: isFull ? 4 : 2, background: c2 }} />
              <div className="absolute bottom-0 right-0 w-1/2" style={{ height: isFull ? 4 : 2, background: c2 }} />
              <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 250" preserveAspectRatio="none">
                {Array.from({ length: 50 }).map((_, i) => (
                  <line key={i} x1="0" y1={i * 5} x2="200" y2={i * 5} stroke="#171717" strokeWidth="0.2" />
                ))}
              </svg>
            </>
          }
        />,
        c1,
        c2
      );

    /* ---------- Pastel Cloud: baby shower ---------- */
    case 'pastel-cloud':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#5b3a4f',
            panelBg: 'linear-gradient(180deg, #ffffff 0%, #fef3f7 100%)',
            accentColor: '#c97aa3',
            deep: '#8b4a6f',
            ribbon: 'BABY SHOWER',
            scriptWord: 'Little One',
            tagline: 'WELCOMING BABY',
          }}
          decoration={
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">
              <circle cx="20" cy="30" r="50" fill={c2} opacity="0.45" />
              <circle cx="180" cy="225" r="55" fill={accent} opacity="0.35" />
              <circle cx="165" cy="55" r="20" fill={accent} opacity="0.25" />
              <circle cx="35" cy="200" r="22" fill={c2} opacity="0.3" />
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={i} cx={(i * 31) % 200} cy={(i * 47) % 250} r="1.5" fill={accent} opacity="0.5" />
              ))}
            </svg>
          }
        />,
        `linear-gradient(180deg, ${c1} 0%, #ffffff 100%)`,
        '#5b3a4f'
      );

    /* ---------- Scholar Crest: graduation ---------- */
    case 'scholar-crest':
      return wrap(
        <OrnatePanel
          theme={{
            ink: '#2a1a1f',
            panelBg: 'linear-gradient(180deg, #fffaee 0%, #f5ead0 100%)',
            accentColor: accent,
            deep: c2,
            ribbon: 'CLASS OF 2026',
            scriptWord: 'Graduation',
            tagline: 'A SCHOLARLY MILESTONE',
          }}
          decoration={
            <>
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 250" preserveAspectRatio="none">
                <defs>
                  <pattern id="sc-stripe2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke={accent} strokeWidth="0.6" />
                  </pattern>
                </defs>
                <rect width="200" height="250" fill="url(#sc-stripe2)" />
              </svg>
              <svg
                className={`absolute left-1/2 -translate-x-1/2`}
                style={{ top: isFull ? -8 : -4 }}
                width={isFull ? 70 : 36}
                height={isFull ? 80 : 40}
                viewBox="0 0 60 70"
              >
                <path
                  d="M30 2 L58 14 L52 50 Q30 66 8 50 L2 14 Z"
                  stroke={accent}
                  strokeWidth="1.5"
                  fill={c2}
                  fillOpacity="0.85"
                />
                <path
                  d="M30 18 L36 30 L48 30 L38 38 L42 50 L30 42 L18 50 L22 38 L12 30 L24 30 Z"
                  fill={accent}
                />
              </svg>
            </>
          }
        />,
        `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`
      );

    /* ---------- Ivory Arch Send-Off: ornate cream + gold + dark green ---------- */
    case 'ivory-arch': {
      const deepGreen = '#0f3d2e';
      const script = "'Great Vibes', cursive";
      const serif = "'Playfair Display', serif";
      const sans = "'Inter', sans-serif";
      const ink = '#2a2a1f';
      // Botanical cluster - reused in 4 corners
      const Botanical = ({ flip = false, vflip = false }: { flip?: boolean; vflip?: boolean }) => (
        <svg
          viewBox="0 0 100 100"
          className="absolute"
          style={{
            width: isFull ? 140 : 70,
            height: isFull ? 140 : 70,
            transform: `scale(${flip ? -1 : 1}, ${vflip ? -1 : 1})`,
          }}
        >
          <defs>
            <radialGradient id={`rose-${flip}-${vflip}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fffdf7" />
              <stop offset="60%" stopColor="#f5e8d0" />
              <stop offset="100%" stopColor="#d9b885" />
            </radialGradient>
          </defs>
          {/* Trailing leaves */}
          <g fill={accent} opacity="0.85">
            <path d="M5 5 Q20 18 12 38 Q4 22 5 5 Z" />
            <path d="M2 30 Q18 38 16 60 Q6 48 2 30 Z" opacity="0.7" />
            <path d="M8 55 Q22 62 22 82 Q10 70 8 55 Z" opacity="0.6" />
            <path d="M30 2 Q42 14 36 32 Q26 20 30 2 Z" opacity="0.7" />
          </g>
          <g stroke={accent} strokeWidth="0.6" fill="none" opacity="0.7">
            <path d="M0 0 Q25 35 18 75" />
            <path d="M15 8 Q30 25 28 50" />
          </g>
          {/* Rose */}
          <circle cx="22" cy="22" r="16" fill={`url(#rose-${flip}-${vflip})`} stroke="#c9a24a" strokeWidth="0.4" />
          <circle cx="22" cy="22" r="10" fill="#fdf6e8" opacity="0.7" />
          <circle cx="22" cy="22" r="5" fill="#e8d4a8" opacity="0.6" />
          <path
            d="M22 14 Q28 18 28 22 Q28 26 22 30 Q16 26 16 22 Q16 18 22 14 Z"
            fill="#fffdf7"
            opacity="0.5"
          />
        </svg>
      );

      return wrap(
        <>
          {/* Cream marble bg */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, #fbf6ec 0%, #f3e9d6 60%, #e8d9bc 100%)`,
            }}
          />
          {/* Subtle sparkle dots */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 250" preserveAspectRatio="none">
            {Array.from({ length: 14 }).map((_, i) => (
              <circle
                key={i}
                cx={(i * 47) % 200}
                cy={(i * 71) % 250}
                r={0.8}
                fill="#e8c98a"
                opacity="0.5"
              />
            ))}
          </svg>

          {/* Corner botanicals */}
          <div className="absolute top-0 left-0"><Botanical /></div>
          <div className="absolute top-0 right-0"><Botanical flip /></div>
          <div className="absolute bottom-0 left-0"><Botanical vflip /></div>
          <div className="absolute bottom-0 right-0"><Botanical flip vflip /></div>

          {/* Arched ivory panel */}
          <div
            className="absolute"
            style={{
              left: '12%',
              right: '12%',
              top: '8%',
              bottom: isFull ? '14%' : '16%',
              background: 'linear-gradient(180deg, #fffdf7 0%, #fbf3e3 100%)',
              borderTopLeftRadius: '50% 25%',
              borderTopRightRadius: '50% 25%',
              boxShadow: 'inset 0 0 0 1px rgba(201,162,74,0.45), 0 6px 20px rgba(120,80,20,0.12)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: 'calc(12% + 6px)',
              right: 'calc(12% + 6px)',
              top: 'calc(8% + 6px)',
              bottom: `calc(${isFull ? '14%' : '16%'} + 6px)`,
              border: `1px solid ${accent}`,
              borderTopLeftRadius: '50% 25%',
              borderTopRightRadius: '50% 25%',
              opacity: 0.5,
            }}
          />

          {/* Panel content */}
          <div
            className="absolute flex flex-col items-center text-center"
            style={{
              left: '16%',
              right: '16%',
              top: isFull ? '11%' : '11%',
              bottom: isFull ? '18%' : '20%',
              color: ink,
              justifyContent: 'space-between',
              padding: isFull ? '8px 0' : '4px 0',
            }}
          >
            {/* Top flourish */}
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              <svg width={isFull ? 60 : 30} height={isFull ? 14 : 8} viewBox="0 0 60 14">
                <path d="M2 7 Q15 2 30 7 Q45 12 58 7" stroke={accent} strokeWidth="0.8" fill="none" />
                <path d="M30 4 L33 7 L30 10 L27 7 Z" fill={accent} />
              </svg>
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 700,
                  fontSize: isFull ? 13 : 7,
                  letterSpacing: isFull ? 2 : 1,
                  marginTop: isFull ? 8 : 4,
                  color: ink,
                }}
              >
                MNAKARIBISHWA KWENYE
              </p>
              <p
                style={{
                  fontFamily: script,
                  fontSize: isFull ? 56 : 28,
                  lineHeight: 1,
                  color: accent,
                  marginTop: isFull ? 4 : 2,
                  textShadow: '0 1px 0 rgba(255,240,200,0.8)',
                }}
              >
                Send-Off
              </p>
              {/* Green ribbon badge */}
              <div
                className="flex items-center justify-center"
                style={{
                  background: deepGreen,
                  color: '#fff',
                  fontFamily: serif,
                  fontWeight: 600,
                  fontSize: isFull ? 11 : 6,
                  letterSpacing: isFull ? 2 : 1,
                  padding: isFull ? '6px 22px' : '3px 11px',
                  marginTop: isFull ? 8 : 4,
                  borderRadius: 2,
                  border: `1px solid ${accent}`,
                }}
              >
                <span style={{ color: accent, marginRight: 6 }}>•</span>
                KITCHEN PARTY
                <span style={{ color: accent, marginLeft: 6 }}>•</span>
              </div>
            </div>

            {/* Middle - names */}
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              {isFull && (
                <p style={{ fontFamily: sans, fontSize: 11, color: ink, opacity: 0.85, lineHeight: 1.4 }}>
                  Kwa furaha kubwa, tunayo heshima kukualika
                  <br />
                  kwenye sherehe ya kumuaga binti yetu mpendwa
                </p>
              )}
              <p
                style={{
                  fontFamily: script,
                  fontSize: isFull ? 44 : 20,
                  color: deepGreen,
                  lineHeight: 1,
                  marginTop: isFull ? 10 : 4,
                }}
              >
                {host || t}
              </p>
              <svg width={isFull ? 80 : 36} height={isFull ? 10 : 6} viewBox="0 0 80 10" style={{ marginTop: 4 }}>
                <line x1="0" y1="5" x2="32" y2="5" stroke={accent} strokeWidth="0.6" />
                <path d="M40 2 L44 5 L40 8 L36 5 Z" fill={accent} />
                <line x1="48" y1="5" x2="80" y2="5" stroke={accent} strokeWidth="0.6" />
              </svg>
              {isFull && (
                <p style={{ fontFamily: sans, fontSize: 11, color: ink, opacity: 0.85, marginTop: 8 }}>
                  anayetarajia kuanza maisha mapya ya ndoa.
                </p>
              )}
            </div>

            {/* Info row */}
            {isFull ? (
              <div className="flex items-stretch justify-center gap-3" style={{ width: '100%' }}>
                {[
                  { icon: <Calendar className="w-4 h-4" />, label: 'TAREHE', val: date ? fmtDate(date) : 'Jumamosi, 24 Mei 2026' },
                  { icon: <Clock className="w-4 h-4" />, label: 'MUDA', val: time || 'Saa 1:00 Asubuhi' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'MAHALI', val: venue || 'Ukumbi wa Neema' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1 justify-center px-2" style={{ borderLeft: i > 0 ? `1px solid ${accent}55` : 'none' }}>
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 28, height: 28, border: `1.5px solid ${accent}`, color: deepGreen, background: '#fffdf7' }}
                    >
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p style={{ fontFamily: serif, fontWeight: 700, fontSize: 9, letterSpacing: 1.2, color: ink }}>{item.label}</p>
                      <p style={{ fontFamily: sans, fontSize: 9, color: ink, opacity: 0.85, lineHeight: 1.2 }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5" style={{ marginTop: 2 }}>
                {[Calendar, Clock, MapPin].map((Icon, i) => (
                  <div key={i} className="rounded-full flex items-center justify-center" style={{ width: 12, height: 12, border: `0.8px solid ${accent}`, color: deepGreen }}>
                    <Icon style={{ width: 6, height: 6 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom dark green pill - contact / RSVP */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-between"
            style={{
              bottom: isFull ? '4%' : '5%',
              width: '74%',
              background: deepGreen,
              color: '#fff',
              padding: isFull ? '10px 22px' : '5px 10px',
              borderRadius: 999,
              border: `1px solid ${accent}`,
              fontFamily: sans,
              fontSize: isFull ? 9 : 5,
              boxShadow: '0 4px 12px rgba(15,61,46,0.25)',
            }}
          >
            <div className="text-left">
              <p style={{ fontFamily: serif, fontWeight: 700, letterSpacing: 1.2, color: accent, fontSize: isFull ? 9 : 5 }}>MAWASILIANO</p>
              <p style={{ opacity: 0.95 }}>0712 345 678</p>
            </div>
            <svg width={isFull ? 40 : 18} height={isFull ? 10 : 5} viewBox="0 0 40 10">
              <path d="M2 5 Q10 1 20 5 Q30 9 38 5" stroke={accent} fill="none" strokeWidth="0.8" />
              <path d="M18 3 L20 5 L18 7 M22 3 L20 5 L22 7" stroke={accent} fill="none" strokeWidth="0.6" />
            </svg>
            <div className="text-right">
              <p style={{ fontFamily: serif, fontWeight: 700, letterSpacing: 1.2, color: accent, fontSize: isFull ? 9 : 5 }}>RSVP</p>
              <p style={{ opacity: 0.95 }}>Kabla ya 20 Mei</p>
            </div>
          </div>
        </>,
        '#fbf6ec',
        ink
      );
    }

    default:
      return wrap(
        <Content accentColor={accent} invitedLabel="You're Invited" />,
        `linear-gradient(135deg, ${c1}, ${c2})`
      );
  }
}