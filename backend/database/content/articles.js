/**
 * Konten edukasi bawaan ZenQ (10 artikel).
 * Dimasukkan ke database lewat:  npm run content   (otomatis juga saat npm run seed)
 *
 * Format isi (content):
 *   - paragraf dipisah 1 baris kosong
 *   - "## Judul"  -> subjudul
 *   - "- teks"    -> poin/bullet
 *
 * Isi bersifat edukasi umum, bukan pengganti pemeriksaan dokter. Sebelum aplikasi dipakai publik,
 * sebaiknya ditinjau ulang oleh tenaga kesehatan. Admin bisa mengubah semuanya di menu Konten.
 */
module.exports = [
  {
    slug: 'satu-sendok-madu-sebelum-tidur',
    title: 'Madu sebelum tidur: bantu tidur atau cuma mitos?',
    category: 'Tahukah Kamu?',
    emoji: '🍯',
    is_featured: true,
    tags: ['tidur'],
    summary: 'Segelas air hangat dengan sedikit madu sering jadi ritual sebelum tidur. Ini yang perlu diketahui sebelum menjadikannya kebiasaan.',
    content: `Banyak orang meminum air hangat dengan madu sebelum tidur karena terasa menenangkan. Rasa hangat dan manis memang bisa membuat tubuh lebih rileks, sehingga sebagian orang merasa lebih mudah terlelap.

Namun, madu bukan obat tidur. Kualitas tidur jauh lebih ditentukan oleh kebiasaan sehari-hari dibanding satu jenis makanan atau minuman.

## Yang perlu diperhatikan
- Madu tetap gula. Satu sendok makan madu mengandung sekitar 60 kalori, jadi batasi jumlahnya, terutama bila sedang menjaga berat badan atau gula darah.
- Penyandang diabetes sebaiknya berkonsultasi dulu dengan dokter sebelum rutin mengonsumsi madu.
- Jangan berikan madu kepada bayi di bawah 1 tahun karena berisiko botulisme.
- Sikat gigi setelah minum madu agar gigi tidak berlubang.

## Kebiasaan yang lebih berpengaruh untuk tidur
- Tidur dan bangun di jam yang sama setiap hari, termasuk akhir pekan.
- Hindari kopi, teh pekat, dan minuman berenergi setelah sore hari.
- Redupkan lampu dan jauhkan ponsel 30 sampai 60 menit sebelum tidur.

Jika sulit tidur berlangsung lebih dari beberapa minggu dan mengganggu aktivitas, bicarakan dengan dokter lewat fitur konsultasi ZenQ.`,
  },
  {
    slug: 'rahasia-otak-tetap-fokus',
    title: 'Rahasia otak tetap fokus seharian',
    category: 'Gaya Hidup',
    emoji: '🧠',
    tags: ['fokus'],
    summary: 'Kurang minum dan duduk terlalu lama bisa membuat konsentrasi turun. Kebiasaan kecil ini membantu otak tetap segar.',
    content: `Rasa lelah dan sulit fokus di siang hari sering bukan karena kurang tidur saja. Kurang minum, jarang bergerak, dan bekerja tanpa jeda juga berperan.

## Cukupi cairan tubuh
Kekurangan cairan ringan saja sudah bisa membuat kepala terasa berat dan konsentrasi menurun. Minumlah air putih secara teratur sepanjang hari, jangan menunggu haus. Tanda sederhana tubuh cukup cairan adalah warna urine kuning pucat.

## Ambil jeda singkat
- Setiap 45 sampai 60 menit, berdiri dan bergerak 3 sampai 5 menit.
- Alihkan pandangan dari layar ke objek jauh selama sekitar 20 detik untuk mengistirahatkan mata.
- Tarik napas dalam beberapa kali untuk menurunkan ketegangan.

## Atur pola makan
Sarapan dengan karbohidrat kompleks, protein, dan buah membantu energi lebih stabil. Hindari makan siang terlalu berat dan manis karena sering membuat mengantuk.

## Kurangi gangguan
Matikan notifikasi yang tidak penting dan kerjakan satu tugas dalam satu waktu. Berpindah-pindah tugas membuat otak lebih cepat lelah.

Jika sulit berkonsentrasi disertai sakit kepala berulang, mudah lupa, atau perubahan suasana hati yang berat, konsultasikan dengan dokter.`,
  },
  {
    slug: 'lupakan-ponsel-tidur-nyenyak',
    title: 'Lupakan ponsel untuk tidur lebih nyenyak',
    category: 'Tidur',
    emoji: '📵',
    tags: ['tidur'],
    summary: 'Main ponsel sebelum tidur membuat otak tetap terjaga. Begini cara membangun kebiasaan tidur yang lebih sehat.',
    content: `Menggulir media sosial di tempat tidur terasa santai, tetapi kebiasaan ini sering membuat kita tidur lebih larut dan bangun kurang segar.

## Kenapa ponsel mengganggu tidur?
- Cahaya terang dari layar, terutama cahaya biru, dapat menekan hormon melatonin yang membantu tubuh mengantuk.
- Konten yang menarik membuat otak tetap aktif dan waktu tidur terus tertunda.
- Notifikasi di malam hari bisa membangunkan dan memutus siklus tidur.

## Berapa lama tidur yang dibutuhkan?
Orang dewasa umumnya membutuhkan 7 sampai 9 jam tidur per malam. Remaja dan anak-anak membutuhkan waktu tidur yang lebih panjang.

## Cara memulai
- Letakkan ponsel di luar jangkauan tempat tidur dan gunakan alarm biasa bila perlu.
- Hentikan penggunaan gawai 30 sampai 60 menit sebelum tidur.
- Aktifkan mode jangan ganggu pada jam tidur.
- Ganti dengan aktivitas yang menenangkan, seperti membaca buku, peregangan ringan, atau mandi air hangat.
- Jaga kamar tetap gelap, sejuk, dan tenang.

Perubahan kecil yang dilakukan konsisten selama 1 sampai 2 minggu biasanya sudah terasa manfaatnya.`,
  },
  {
    slug: 'jangan-takut-matahari-pagi',
    title: 'Jangan takut matahari pagi',
    category: 'Gaya Hidup',
    emoji: '☀️',
    tags: ['vitamin'],
    summary: 'Paparan sinar matahari membantu tubuh membentuk vitamin D. Kuncinya: secukupnya dan tidak sampai kulit terbakar.',
    content: `Sinar matahari membantu kulit membentuk vitamin D, yang berperan menjaga kesehatan tulang, otot, dan daya tahan tubuh. Sinar pagi juga membantu mengatur jam biologis sehingga tidur malam lebih teratur.

## Berapa lama sebaiknya berjemur?
Untuk kebanyakan orang, berjemur sekitar 10 sampai 15 menit beberapa kali seminggu sudah cukup membantu. Waktu yang nyaman adalah pagi hari ketika sinar belum terlalu terik. Orang dengan kulit lebih gelap mungkin membutuhkan waktu sedikit lebih lama.

## Tetap aman
- Jangan sampai kulit memerah atau terbakar.
- Lindungi mata dan jangan menatap matahari langsung.
- Jika berada di luar ruangan lebih lama, gunakan tabir surya, topi, atau pakaian yang menutup kulit.
- Minum air yang cukup.

## Sumber vitamin D lain
Ikan berlemak seperti kembung, sarden, dan salmon, kuning telur, serta susu yang diperkaya vitamin D.

Orang lanjut usia, ibu hamil, dan orang yang jarang terkena matahari lebih berisiko kekurangan vitamin D. Tanyakan ke dokter sebelum mengonsumsi suplemen, karena dosis yang berlebihan juga tidak baik.`,
  },
  {
    slug: 'kapan-terakhir-cek-gula-darah',
    title: 'Kapan terakhir cek gula darah?',
    category: 'Penyakit Kronis',
    emoji: '🩸',
    tags: ['diabetes'],
    summary: 'Diabetes sering tidak bergejala di awal. Pemeriksaan rutin membantu mendeteksinya sebelum menimbulkan komplikasi.',
    content: `Diabetes tipe 2 bisa berkembang selama bertahun-tahun tanpa keluhan yang jelas. Banyak orang baru mengetahuinya ketika sudah muncul komplikasi pada mata, ginjal, saraf, atau jantung.

## Gejala yang patut diwaspadai
- Sering haus dan sering buang air kecil, terutama di malam hari.
- Cepat lapar tetapi berat badan turun tanpa sebab.
- Mudah lelah, pandangan kabur, atau luka yang lama sembuh.
- Kesemutan di tangan atau kaki.

## Siapa yang perlu lebih rutin memeriksa?
- Usia 40 tahun ke atas.
- Memiliki berat badan berlebih atau lingkar perut besar.
- Ada keluarga inti dengan diabetes.
- Memiliki tekanan darah tinggi atau kolesterol tinggi.
- Pernah mengalami diabetes saat hamil.

## Pemeriksaan yang umum dilakukan
Gula darah puasa, gula darah sewaktu, atau HbA1c yang menggambarkan rata-rata gula darah 2 sampai 3 bulan terakhir. Dokter akan menentukan pemeriksaan yang paling sesuai.

## Langkah pencegahan
Jaga berat badan, aktif bergerak minimal 150 menit per minggu, kurangi minuman manis, dan perbanyak sayur. Jika hasil pemeriksaan tinggi, segera konsultasikan dengan dokter untuk penanganan lebih lanjut.`,
  },
  {
    slug: 'kenali-dan-kendalikan-hipertensi',
    title: 'Kenali dan kendalikan tekanan darah tinggi',
    category: 'Penyakit Kronis',
    emoji: '❤️',
    tags: ['hipertensi', 'jantung'],
    summary: 'Hipertensi dijuluki silent killer karena sering tanpa gejala. Cek tekanan darah secara berkala dan terapkan pola hidup CERDIK.',
    content: `Tekanan darah tinggi atau hipertensi sering tidak menimbulkan keluhan, padahal dalam jangka panjang dapat meningkatkan risiko stroke, serangan jantung, dan gagal ginjal. Satu-satunya cara mengetahuinya adalah dengan mengukur tekanan darah.

## Angka yang perlu diketahui
Tekanan darah dianggap tinggi bila hasil pengukuran berulang menunjukkan 140/90 mmHg atau lebih. Satu kali hasil tinggi belum tentu hipertensi, jadi pengukuran perlu diulang dalam kondisi tenang.

## Pola hidup CERDIK
Kementerian Kesehatan mengampanyekan CERDIK untuk mencegah penyakit tidak menular:
- Cek kesehatan secara berkala.
- Enyahkan asap rokok.
- Rajin aktivitas fisik.
- Diet sehat dengan kalori seimbang.
- Istirahat cukup.
- Kelola stres.

## Kurangi garam
Batasi garam sekitar 1 sendok teh per hari dari semua sumber makanan. Waspadai garam tersembunyi pada makanan kemasan, mi instan, saus, kerupuk, dan makanan olahan.

## Jika sudah didiagnosis hipertensi
Minum obat sesuai anjuran dokter setiap hari, walaupun merasa sehat. Jangan menghentikan obat sendiri. Periksa tekanan darah secara rutin dan catat hasilnya untuk dibawa saat kontrol.

Segera ke IGD bila tekanan darah sangat tinggi disertai nyeri dada, sesak napas, sakit kepala hebat, atau kelemahan pada salah satu sisi tubuh.`,
  },
  {
    slug: 'cegah-demam-berdarah-3m-plus',
    title: 'Cegah demam berdarah dengan 3M Plus',
    category: 'Pencegahan',
    emoji: '🦟',
    tags: ['dbd'],
    summary: 'Nyamuk Aedes aegypti berkembang biak di air bersih yang tergenang. Gerakan 3M Plus adalah cara paling efektif memutus rantainya.',
    content: `Demam berdarah dengue (DBD) ditularkan oleh nyamuk Aedes aegypti yang aktif menggigit pada pagi hingga sore hari. Nyamuk ini bertelur di genangan air bersih di sekitar rumah.

## Gerakan 3M Plus
- Menguras dan menyikat tempat penampungan air seperti bak mandi dan ember, minimal seminggu sekali.
- Menutup rapat tempat penampungan air.
- Mendaur ulang atau memanfaatkan kembali barang bekas yang bisa menampung air.

Plus-nya antara lain: memakai losion antinyamuk, memasang kawat kasa, menaburkan larvasida (bubuk abate) di tempat yang sulit dikuras, memelihara ikan pemakan jentik, dan tidak menggantung pakaian bekas pakai.

## Kenali gejalanya
Demam tinggi mendadak 2 sampai 7 hari, sakit kepala, nyeri di belakang mata, nyeri otot dan sendi, mual, serta bintik merah di kulit.

## Tanda bahaya, segera ke rumah sakit
- Muntah terus-menerus atau tidak bisa minum.
- Nyeri perut hebat.
- Mimisan, gusi berdarah, atau muntah dan BAB berwarna hitam.
- Lemas, gelisah, tangan dan kaki dingin.

Hati-hati, fase kritis DBD sering terjadi justru saat demam mulai turun, biasanya di hari ke-3 sampai ke-5. Tetap minum yang cukup dan pantau kondisi.`,
  },
  {
    slug: 'cuci-tangan-pakai-sabun-yang-benar',
    title: 'Cuci tangan pakai sabun yang benar',
    category: 'Pencegahan',
    emoji: '🧼',
    tags: ['kebersihan'],
    summary: 'Cuci tangan dengan sabun dan air mengalir adalah cara sederhana mencegah diare, flu, dan berbagai infeksi.',
    content: `Tangan menyentuh banyak benda setiap hari dan menjadi jalan utama kuman masuk ke tubuh lewat mata, hidung, dan mulut. Mencuci tangan dengan sabun terbukti menurunkan risiko diare dan infeksi saluran pernapasan.

## Kapan harus cuci tangan?
- Sebelum makan dan sebelum menyiapkan makanan.
- Setelah dari toilet atau mengganti popok.
- Setelah batuk, bersin, atau membuang ingus.
- Setelah memegang hewan, sampah, atau fasilitas umum.
- Sebelum dan sesudah merawat orang sakit.

## Langkah mencuci tangan
- Basahi tangan dengan air mengalir, lalu tuangkan sabun.
- Gosok kedua telapak tangan.
- Gosok punggung tangan dan sela-sela jari.
- Gosok bagian dalam jari dengan posisi saling mengunci.
- Gosok ibu jari secara memutar.
- Gosok ujung jari pada telapak tangan.
- Bilas dengan air mengalir dan keringkan dengan tisu atau handuk bersih.

Lakukan seluruh langkah selama sekitar 20 detik, kira-kira sepanjang menyanyikan lagu "Selamat Ulang Tahun" dua kali.

## Bagaimana dengan hand sanitizer?
Hand sanitizer dengan kandungan alkohol minimal 60% bisa dipakai saat tidak ada air dan sabun. Namun, sabun dan air tetap lebih baik bila tangan terlihat kotor atau berminyak.`,
  },
  {
    slug: 'isi-piringku-makan-seimbang',
    title: 'Isi Piringku: panduan makan seimbang',
    category: 'Gizi',
    emoji: '🥗',
    tags: ['gizi'],
    summary: 'Lupakan istilah "4 sehat 5 sempurna". Pedoman Isi Piringku membantu mengatur porsi makan agar gizi lebih seimbang.',
    content: `Isi Piringku adalah pedoman gizi seimbang dari Kementerian Kesehatan yang menggambarkan porsi makan dalam satu piring untuk sekali makan.

## Pembagian piring
- Setengah piring diisi sayur dan buah, dengan porsi sayur lebih banyak daripada buah.
- Setengah piring lainnya diisi makanan pokok dan lauk pauk, dengan porsi makanan pokok sedikit lebih banyak daripada lauk.

Makanan pokok bisa berupa nasi, jagung, ubi, singkong, kentang, atau roti. Lauk pauk diutamakan yang bervariasi: ikan, telur, ayam, daging tanpa lemak, tahu, tempe, dan kacang-kacangan.

## Pelengkap penting
- Minum air putih yang cukup setiap hari.
- Aktif bergerak minimal 30 menit sehari.
- Cuci tangan sebelum makan.
- Pantau berat badan secara berkala.

## Batasi gula, garam, dan lemak
Anjuran batas harian untuk orang dewasa adalah gula 4 sendok makan, garam 1 sendok teh, dan minyak 5 sendok makan. Ingat bahwa batas ini mencakup gula, garam, dan minyak yang tersembunyi di makanan dan minuman kemasan.

Kebutuhan gizi anak, ibu hamil, lansia, dan orang dengan penyakit tertentu bisa berbeda. Konsultasikan dengan dokter atau ahli gizi untuk anjuran yang lebih spesifik.`,
  },
  {
    slug: 'tanda-bahaya-segera-ke-igd',
    title: 'Tanda bahaya yang harus segera dibawa ke IGD',
    category: 'Kegawatdaruratan',
    emoji: '🚑',
    tags: ['darurat', 'stroke', 'jantung'],
    summary: 'Beberapa keluhan tidak boleh ditunda. Kenali tanda serangan jantung dan stroke agar pertolongan datang tepat waktu.',
    content: `Pada kondisi gawat darurat, setiap menit sangat berharga. Pertolongan yang cepat dapat mencegah kecacatan bahkan menyelamatkan nyawa. Jangan menunggu keluhan hilang sendiri.

## Tanda serangan jantung
- Nyeri dada seperti ditekan, diremas, atau terasa berat, lebih dari beberapa menit.
- Nyeri menjalar ke lengan kiri, leher, rahang, atau punggung.
- Disertai keringat dingin, sesak napas, mual, atau lemas.

## Tanda stroke: ingat "SeGeRa Ke RS"
- Senyum tidak simetris atau wajah mencong.
- Gerak separuh tubuh lemah atau tiba-tiba tidak bisa digerakkan.
- Bicara pelo atau tiba-tiba sulit bicara dan memahami ucapan.
- Kebas atau baal pada separuh tubuh.
- Rabun atau pandangan kabur mendadak.
- Sakit kepala hebat mendadak atau gangguan keseimbangan.

## Kondisi lain yang perlu segera ditangani
- Sesak napas berat atau bibir kebiruan.
- Kejang, pingsan, atau penurunan kesadaran.
- Perdarahan hebat yang sulit berhenti.
- Luka bakar luas atau cedera kepala berat.
- Reaksi alergi berat dengan bengkak di wajah dan sulit bernapas.

## Yang bisa dilakukan
Hubungi layanan gawat darurat 119 atau segera menuju IGD terdekat. Gunakan fitur Darurat di ZenQ untuk melihat rumah sakit terdekat. Jangan memberi makan atau minum pada orang yang tidak sadar, dan jangan menyetir sendiri bila mengalami gejala di atas.`,
  },
];
