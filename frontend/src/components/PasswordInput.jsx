import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '../i18n';

/**
 * Kolom kata sandi dengan tombol mata untuk menampilkan / menyembunyikan isinya.
 * Dipakai persis seperti <input type="password" ... />, semua props diteruskan ke input.
 */
function PasswordInput(props) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const label = show ? t('Sembunyikan kata sandi') : t('Tampilkan kata sandi');

  return (
    <div className="pwfield">
      <input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="pweye"
        onClick={() => setShow((s) => !s)}
        aria-label={label}
        aria-pressed={show}
        title={label}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default PasswordInput;
