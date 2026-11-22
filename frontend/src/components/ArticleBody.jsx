/**
 * Menampilkan isi artikel dari teks biasa (tanpa HTML, jadi aman dari script jahat):
 *   paragraf dipisah baris kosong, "## Judul" = subjudul, "- teks" = poin.
 */
function ArticleBody({ content = '' }) {
  const blocks = content.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="abody">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        // Blok bisa diawali subjudul lalu langsung poin-poin
        const out = [];
        let list = [];
        let para = [];
        const flushList = () => { if (list.length) { out.push(<ul key={`u${out.length}`}>{list.map((t, j) => <li key={j}>{t}</li>)}</ul>); list = []; } };
        const flushPara = () => { if (para.length) { out.push(<p key={`p${out.length}`}>{para.join(' ')}</p>); para = []; } };
        lines.forEach((raw) => {
          const line = raw.trim();
          if (line.startsWith('## ')) { flushList(); flushPara(); out.push(<h2 key={`h${out.length}`}>{line.slice(3)}</h2>); }
          else if (line.startsWith('- ')) { flushPara(); list.push(line.slice(2)); }
          else { flushList(); para.push(line); }
        });
        flushList();
        flushPara();
        return <div key={i}>{out}</div>;
      })}
    </div>
  );
}

export default ArticleBody;
