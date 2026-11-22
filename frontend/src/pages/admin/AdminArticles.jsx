import { useRef, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { useFetch } from '../../hooks/useFetch';
import { fileToDataUrl, resizeToDataUrl } from '../../utils/image';
import ArticleCover, { ARTICLE_CATEGORIES } from '../../components/ArticleCover';
import ArticleBody from '../../components/ArticleBody';
import StateMessage from '../../components/StateMessage';
import { useLang } from '../../i18n';

const EMPTY = { title: '', category: 'Gaya Hidup', summary: '', content: '', cover_url: '', is_featured: false, is_published: true };

/**
 * Kelola Konten Edukasi (admin): tambah, ubah, sembunyikan/tampilkan, jadikan unggulan, hapus.
 * Pasien cuma bisa membaca di halaman Edukasi.
 */
function AdminArticles() {
  const { t } = useLang();
  const { data: articles, loading, error, refetch } = useFetch('/admin/articles');
  const [form, setForm] = useState(null); // null = editor tertutup
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const coverRef = useRef(null);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const openNew = () => { setForm({ ...EMPTY }); setPreview(false); setMessage(null); };
  const openEdit = (a) => {
    setForm({ ...EMPTY, ...a, summary: a.summary || '', cover_url: a.cover_url || '' });
    setPreview(false);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pickCover = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = await resizeToDataUrl(await fileToDataUrl(f), 1280, 0.8);
      setForm((v) => ({ ...v, cover_url: url }));
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (form.id) await api.put(`/admin/articles/${form.id}`, form);
      else await api.post('/admin/articles', form);
      setMessage({ ok: true, text: form.id ? t('Artikel diperbarui.') : t('Artikel ditambahkan.') });
      setForm(null);
      refetch();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const patch = async (a, body) => {
    await api.put(`/admin/articles/${a.id}`, body);
    refetch();
  };

  const remove = async (a) => {
    if (!window.confirm(t('Hapus artikel "{title}"?', { title: a.title }))) return;
    await api.delete(`/admin/articles/${a.id}`);
    refetch();
  };

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1 className="title">{t('Konten Edukasi')}</h1>
          <p className="sub">{t('Artikel yang tampil di halaman Edukasi pasien. Berita dari API tampil otomatis di bawahnya.')}</p>
        </div>
        {!form && <button className="btn" onClick={openNew}><Plus size={17} />{' '}{t('Artikel Baru')}</button>}
      </div>

      {message && !form && <div className={`toast ${message.ok ? '' : 'err'}`} style={{ marginTop: 0, marginBottom: 18 }}>{message.text}</div>}

      {form && (
        <form className="card editor" onSubmit={save} style={{ marginBottom: 24 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <h3>{form.id ? t('Ubah Artikel') : t('Artikel Baru')}</h3>
            <button type="button" className="iconb" aria-label={t('Tutup editor')} onClick={() => setForm(null)}><X size={18} /></button>
          </div>

          <div className="split" style={{ '--cols': '1.4fr 1fr', gap: 22 }}>
            <div>
              <div className="field"><label>{t('Judul')}</label><input required value={form.title} onChange={update('title')} placeholder={t('Contoh: Cara menjaga tekanan darah tetap normal')} /></div>
              <div className="grid g2" style={{ gap: 14 }}>
                <div className="field">
                  <label>{t('Kategori')}</label>
                  <select value={form.category} onChange={update('category')}>
                    {ARTICLE_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                  </select>
                </div>
                <div className="field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
                  <label className="row" style={{ gap: 8, margin: 0, color: 'var(--text)' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={form.is_published} onChange={update('is_published')} />{' '}{t('Tampilkan ke pasien')}
                  </label>
                  <label className="row" style={{ gap: 8, margin: 0, color: 'var(--text)' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={form.is_featured} onChange={update('is_featured')} />{' '}{t('Jadikan artikel unggulan')}
                  </label>
                </div>
              </div>
              <div className="field"><label>{t('Ringkasan (tampil di kartu artikel)')}</label><textarea rows={2} style={{ minHeight: 70 }} value={form.summary} onChange={update('summary')} /></div>
              <div className="field">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <label>{t('Isi artikel')}</label>
                  <button type="button" className="link small" onClick={() => setPreview(!preview)}>{preview ? t('Tulis') : t('Pratinjau')}</button>
                </div>
                {preview
                  ? <div className="card" style={{ maxHeight: 420, overflow: 'auto' }}><ArticleBody content={form.content} /></div>
                  : <textarea required rows={14} value={form.content} onChange={update('content')}
                      placeholder={t('Paragraf dipisah 1 baris kosong.\n\n## Subjudul\n- poin pertama\n- poin kedua')} />}
                <div className="small muted" style={{ marginTop: 6 }}>{t('Format: baris kosong = paragraf baru,')}{' '}<b>## </b>{' '}{t('= subjudul,')}{' '}<b>- </b>{' '}{t('= poin.')}</div>
              </div>
            </div>

            <div>
              <label>{t('Sampul')}</label>
              <ArticleCover article={{ ...form, cover_url: form.cover_url || null }} className="editor-cover" iconSize={64} />
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="btn ghost sm" onClick={() => coverRef.current?.click()}><ImagePlus size={15} />{' '}{t('Unggah foto')}</button>
                {form.cover_url && <button type="button" className="btn ghost sm" onClick={() => setForm({ ...form, cover_url: '' })}>{t('Pakai sampul otomatis')}</button>}
              </div>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={pickCover} />
              <p className="small muted">{t('Tanpa foto, sampul dibuat otomatis sesuai kategori.')}</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn" disabled={saving}>{saving ? t('Menyimpan…') : t('Simpan Artikel')}</button>
            <button type="button" className="btn ghost" onClick={() => setForm(null)}>{t('Batal')}</button>
          </div>
          {message && <div className={`toast ${message.ok ? '' : 'err'}`}>{message.text}</div>}
        </form>
      )}

      <StateMessage loading={loading} error={error} empty={articles && !articles.length} emptyText={t('Belum ada artikel.')} />
      <div className="grid" style={{ gap: 12 }}>
        {articles?.map((a) => (
          <div key={a.id} className={`card arow ${a.is_published ? '' : 'hidden'}`}>
            <ArticleCover article={a} className="arow-cover" iconSize={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="small" style={{ color: 'var(--gold)', fontWeight: 700 }}>{t(a.category)}</span>
                {a.is_featured && <span className="chip orange"><Star size={12} fill="currentColor" />{' '}{t('Unggulan')}</span>}
                {!a.is_published && <span className="chip">{t('Disembunyikan')}</span>}
              </div>
              <b style={{ display: 'block', marginTop: 2 }}>{a.title}</b>
              {a.summary && <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.summary}</div>}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="iconb" title={a.is_featured ? t('Sudah unggulan') : t('Jadikan unggulan')} aria-label={t('Jadikan unggulan')}
                disabled={a.is_featured} onClick={() => patch(a, { is_featured: true })}><Star size={17} /></button>
              <button className="iconb" title={a.is_published ? t('Sembunyikan') : t('Tampilkan')} aria-label={a.is_published ? t('Sembunyikan') : t('Tampilkan')}
                onClick={() => patch(a, { is_published: !a.is_published })}>{a.is_published ? <Eye size={17} /> : <EyeOff size={17} />}</button>
              <button className="iconb" title={t('Ubah')} aria-label={t('Ubah')} onClick={() => openEdit(a)}><Pencil size={17} /></button>
              <button className="iconb danger" title={t('Hapus')} aria-label={t('Hapus')} onClick={() => remove(a)}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminArticles;
