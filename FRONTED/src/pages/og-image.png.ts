// src/pages/og-image.png.ts — Dynamic OG image generator using Satori
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get('title') || 'GINKVORA';
  const subtitle = url.searchParams.get('subtitle') || 'Pure Nature, Proven Science';
  const tag = url.searchParams.get('tag') || 'B2B Plant Extracts';

  // Truncate long titles
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          backgroundColor: '#060503',
          backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(212,166,84,0.12) 0%, transparent 60%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        },
        children: [
          // Top: Brand
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #d4a654, #e07830)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: { fontSize: '20px' },
                          children: '🌿',
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'span',
                  props: {
                    style: {
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#d4a654',
                      letterSpacing: '0.06em',
                    },
                    children: 'GINKVORA',
                  },
                },
              ],
            },
          },

          // Middle: Title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'inline-flex',
                      padding: '6px 16px',
                      backgroundColor: 'rgba(212,166,84,0.12)',
                      border: '1px solid rgba(212,166,84,0.3)',
                      borderRadius: '4px',
                      width: 'fit-content',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '13px',
                            color: '#d4a654',
                            fontWeight: '600',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          },
                          children: tag,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontSize: displayTitle.length > 40 ? '48px' : '60px',
                      fontWeight: '700',
                      color: '#f0e8d8',
                      lineHeight: '1.15',
                      margin: '0',
                    },
                    children: displayTitle,
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: {
                      fontSize: '22px',
                      color: '#9a8878',
                      margin: '0',
                      lineHeight: '1.4',
                    },
                    children: subtitle,
                  },
                },
              ],
            },
          },

          // Bottom: Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(212,166,84,0.2)',
                paddingTop: '20px',
              },
              children: [
                {
                  type: 'span',
                  props: {
                    style: { fontSize: '16px', color: '#6a5e52' },
                    children: 'ginkvora.com',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: '12px' },
                    children: [
                      { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'ISO 9001' } },
                      { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'GMP' } },
                      { type: 'span', props: { style: { fontSize: '13px', color: '#5a5248', padding: '4px 10px', border: '1px solid #2a2520', borderRadius: '3px' }, children: 'Halal' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [], // using system sans-serif fallback
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });

  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
