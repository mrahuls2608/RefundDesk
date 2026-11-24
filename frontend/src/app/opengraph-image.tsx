import { ImageResponse } from 'next/og';

export const alt = 'RefundDesk: AI investigates, humans approve, money moves once';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#0B1120', color: '#F1F5F9' }}>
        <div style={{ fontSize: 32, color: '#60A5FA', marginBottom: 24 }}>RefundDesk</div>
        <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.1 }}>Payment disputes resolved in minutes.</div>
        <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.1, color: '#9B9B9B' }}>Every refund paid exactly once.</div>
        <div style={{ fontSize: 28, marginTop: 40, color: '#94A3B8' }}>AI investigates · humans approve · money moves once</div>
      </div>
    ),
    size,
  );
}
