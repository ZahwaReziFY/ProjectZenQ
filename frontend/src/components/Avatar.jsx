import { initials } from '../utils/format';

// Avatar bulat berisi inisial nama (atau foto kalo ada `src`)
function Avatar({ name = '', size = 56, bg = 'linear-gradient(140deg, var(--brand), var(--brand-d))', src, style }) {
  const color = bg === '#fff' ? 'var(--brand-d)' : '#fff';
  return (
    <div
      className="av"
      style={{ width: size, height: size, background: bg, color, fontSize: Math.round(size * 0.36), overflow: 'hidden', ...style }}
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
    </div>
  );
}

export default Avatar;
