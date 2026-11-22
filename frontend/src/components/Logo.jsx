// Logo ZenQ (salib medis + daun) - sama persis dengan mockup
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="22" y="4" width="20" height="56" rx="6" fill="#0B4A7E" />
      <rect x="4" y="22" width="56" height="20" rx="6" fill="#0B4A7E" />
      <circle cx="36" cy="26" r="5" fill="#3E9FE0" />
      <path d="M14 10c-8 12 0 26 22 32-12-6-18-18-10-30z" fill="#3E9FE0" opacity=".9" />
    </svg>
  );
}

export default Logo;
