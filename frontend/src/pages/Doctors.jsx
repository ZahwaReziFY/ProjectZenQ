import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import DoctorCard from '../components/DoctorCard';
import StateMessage from '../components/StateMessage';
import { useLang } from '../i18n';

const SORTS = [['rating', 'Rating Tertinggi'], ['online', 'Sedang Online'], ['murah', 'Termurah']];

function Doctors() {
  const { t } = useLang();
  const [params] = useSearchParams();
  // ?q= dipake chatbot buat langsung nyari spesialisasi yang disarankan
  const [q, setQ] = useState(params.get('q') || '');
  const [debounced, setDebounced] = useState(params.get('q') || '');
  const [sort, setSort] = useState(params.get('sort') || ''); // ?sort=online dari profil dokter yang offline

  // Tunggu user berhenti ngetik 300ms baru request
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = new URLSearchParams();
  if (debounced) query.set('search', debounced);
  if (sort === 'online') query.set('online', 'true');
  else if (sort) query.set('sort', sort);
  const { data: doctors, loading, error } = useFetch(`/doctors?${query}`);

  return (
    <div className="wrap">
      <h1 className="title">{t('Rekomendasi Dokter')}</h1>
      <p className="sub">{t('Pilih dokter yang sesuai dengan kebutuhan Anda.')}</p>

      <div className="row" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <input placeholder={t('Cari nama dokter atau spesialis')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {SORTS.map(([k, l]) => (
            <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(sort === k ? '' : k)}>{t(l)}</button>
          ))}
        </div>
      </div>

      <StateMessage loading={loading && !doctors} error={error} />
      <div className="grid g3">
        {doctors?.length
          ? doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)
          : !loading && <div className="muted">{t('Dokter tidak ditemukan.')}</div>}
      </div>
    </div>
  );
}

export default Doctors;