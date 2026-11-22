/**
 * Daftar obat umum di Indonesia untuk pencocokan hasil scan.
 *
 * Dimasukkan ke database lewat:  npm run obat   (aman, obat yang sudah ada tidak ditimpa)
 * `npm run seed` juga otomatis memasukkan daftar ini.
 *
 * PENTING:
 *  - Informasi di sini bersifat umum. Dosis selalu mengikuti label kemasan / resep dokter.
 *  - bpom_number & status halal sengaja DIKOSONGKAN karena tidak boleh dikarang.
 *    Isi setelah dicek di https://cekbpom.pom.go.id dan https://bpjph.halal.go.id
 *    (lewat panel admin / pgAdmin). Badge "Terdaftar BPOM" dan "Logo Halal" tetap muncul
 *    kalau Gemini membaca nomor BPOM / logo halal langsung dari foto kemasan.
 *
 * Format: [nama, zat aktif, kata kunci tambahan, kategori, dosis, efek samping, interaksi, kontraindikasi]
 */
const LABEL = 'Ikuti aturan pakai di kemasan';
const RESEP = 'Sesuai resep dokter';

const ROWS = [
  // ---- Nyeri & demam ----
  ['Panadol', 'Paracetamol', ['panadol', 'paracetamol', 'parasetamol'], 'Pereda nyeri & penurun demam', LABEL, 'Jarang; ruam kulit atau mual', 'Jangan digabung dengan obat lain yang mengandung paracetamol; hindari alkohol', 'Gangguan fungsi hati berat'],
  ['Panadol Extra', 'Paracetamol, Caffeine', ['panadol', 'extra', 'kafein', 'caffeine'], 'Pereda nyeri (sakit kepala)', LABEL, 'Sulit tidur, jantung berdebar (karena kafein)', 'Kurangi kopi/teh; jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan hati berat, maag berat'],
  ['Sanmol', 'Paracetamol', ['sanmol', 'paracetamol'], 'Pereda nyeri & penurun demam', LABEL, 'Jarang; ruam kulit atau mual', 'Jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan fungsi hati berat'],
  ['Tempra', 'Paracetamol', ['tempra', 'paracetamol', 'sirup', 'anak'], 'Penurun demam & pereda nyeri anak', LABEL + ' (sesuai usia/berat badan anak)', 'Jarang; ruam kulit', 'Jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan fungsi hati berat'],
  ['Biogesic', 'Paracetamol', ['biogesic', 'paracetamol'], 'Pereda nyeri & penurun demam', LABEL, 'Jarang; ruam kulit atau mual', 'Jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan fungsi hati berat'],
  ['Bodrex', 'Paracetamol, Caffeine', ['bodrex', 'kafein', 'caffeine'], 'Pereda sakit kepala', LABEL, 'Sulit tidur, jantung berdebar', 'Kurangi kopi/teh; jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan hati berat'],
  ['Oskadon', 'Paracetamol, Caffeine', ['oskadon', 'kafein', 'caffeine'], 'Pereda sakit kepala', LABEL, 'Sulit tidur, jantung berdebar', 'Kurangi kopi/teh; jangan digabung dengan obat lain yang mengandung paracetamol', 'Gangguan hati berat'],
  ['Paramex', 'Paracetamol, Propyphenazone, Caffeine, Dexchlorpheniramine maleate', ['paramex', 'propifenazon', 'deksklorfeniramin'], 'Pereda sakit kepala', LABEL, 'Mengantuk, mulut kering', 'Menambah kantuk bila bersama obat penenang/alkohol', 'Gangguan hati berat; jangan berkendara setelah minum'],
  ['Proris', 'Ibuprofen', ['proris', 'ibuprofen'], 'Pereda nyeri & penurun demam (OAINS)', LABEL + ', diminum sesudah makan', 'Nyeri lambung, mual', 'Hati-hati bersama pengencer darah dan OAINS lain', 'Tukak lambung, gangguan ginjal'],
  ['Asam Mefenamat 500 mg', 'Mefenamic acid', ['mefenamat', 'mefenamic', 'ponstan'], 'Pereda nyeri (obat keras, wajib resep)', RESEP + ', sesudah makan', 'Nyeri lambung, diare', 'Hati-hati bersama pengencer darah dan OAINS lain', 'Tukak lambung, gangguan ginjal'],
  ['Cataflam', 'Diclofenac potassium', ['cataflam', 'diclofenac', 'diklofenak'], 'Pereda nyeri & radang (obat keras, wajib resep)', RESEP + ', sesudah makan', 'Nyeri lambung, pusing', 'Hati-hati bersama pengencer darah dan OAINS lain', 'Tukak lambung, gangguan jantung/ginjal'],
  ['Counterpain', 'Methyl salicylate, Menthol, Eugenol', ['counterpain', 'metil', 'salisilat', 'menthol'], 'Krim pereda nyeri otot (obat luar)', 'Oleskan tipis pada area nyeri', 'Kulit kemerahan/panas', '-', 'Jangan dioles pada luka terbuka atau sekitar mata'],

  // ---- Flu, batuk, pilek ----
  ['Mixagrip Flu', 'Paracetamol, Phenylephrine HCl, Chlorpheniramine maleate', ['mixagrip', 'fenilefrin', 'klorfeniramin'], 'Obat flu', LABEL, 'Mengantuk, mulut kering', 'Menambah kantuk bila bersama obat penenang/alkohol', 'Hipertensi berat, gangguan hati; jangan berkendara'],
  ['Decolgen', 'Paracetamol, Phenylephrine HCl, Chlorpheniramine maleate', ['decolgen', 'fenilefrin', 'klorfeniramin'], 'Obat flu', LABEL, 'Mengantuk, mulut kering', 'Menambah kantuk bila bersama obat penenang/alkohol', 'Hipertensi berat, gangguan hati; jangan berkendara'],
  ['Neozep Forte', 'Paracetamol, Phenylephrine HCl, Chlorpheniramine maleate', ['neozep', 'forte'], 'Obat flu', LABEL, 'Mengantuk, mulut kering', 'Menambah kantuk bila bersama obat penenang/alkohol', 'Hipertensi berat, gangguan hati; jangan berkendara'],
  ['OBH Combi', 'Succus liquiritiae, Ammonium chloride', ['obh', 'combi', 'batuk', 'hitam'], 'Obat batuk berdahak', LABEL, 'Mual (jarang)', '-', 'Penderita diabetes perhatikan kandungan gula sirup'],
  ['Bisolvon', 'Bromhexine HCl', ['bisolvon', 'bromhexine', 'bromheksin'], 'Pengencer dahak', LABEL, 'Mual, gangguan lambung ringan', '-', 'Tukak lambung (konsultasikan)'],
  ['Ambroxol 30 mg', 'Ambroxol HCl', ['ambroxol', 'ambroksol'], 'Pengencer dahak', LABEL, 'Mual, gangguan lambung ringan', '-', 'Tukak lambung (konsultasikan)'],
  ['Gliseril Guaiakolat (GG)', 'Guaifenesin', ['guaifenesin', 'gliseril', 'guaiakolat'], 'Pengencer dahak', LABEL, 'Mual, pusing', '-', 'Hipersensitif terhadap guaifenesin'],
  ['Dextromethorphan', 'Dextromethorphan HBr', ['dextromethorphan', 'dekstrometorfan', 'dmp'], 'Pereda batuk kering', LABEL, 'Mengantuk, pusing', 'Jangan bersama obat antidepresan golongan MAOI', 'Batuk berdahak, asma'],
  ['Loratadine 10 mg', 'Loratadine', ['loratadine', 'loratadin'], 'Antihistamin (alergi)', LABEL, 'Sakit kepala, mulut kering', '-', 'Gangguan hati berat (konsultasikan)'],

  // ---- Lambung & pencernaan ----
  ['Promag', 'Hydrotalcite, Magnesium hydroxide, Simethicone', ['promag', 'hidrotalsit', 'simetikon'], 'Obat maag', 'Dikunyah, ' + LABEL.toLowerCase(), 'Sembelit atau diare', 'Beri jeda 2 jam dengan obat lain', 'Gangguan ginjal berat'],
  ['Mylanta', 'Aluminium hydroxide, Magnesium hydroxide, Simethicone', ['mylanta', 'simetikon', 'simethicone'], 'Obat maag', LABEL, 'Sembelit atau diare', 'Beri jeda 2 jam dengan obat lain', 'Gangguan ginjal berat'],
  ['Polysilane', 'Dimethylpolysiloxane, Aluminium hydroxide, Magnesium hydroxide', ['polysilane', 'dimetilpolisiloksan'], 'Obat maag & kembung', LABEL, 'Sembelit atau diare', 'Beri jeda 2 jam dengan obat lain', 'Gangguan ginjal berat'],
  ['Omeprazole 20 mg', 'Omeprazole', ['omeprazole', 'omeprazol'], 'Penurun asam lambung (obat keras, wajib resep)', RESEP + ', sebelum makan', 'Sakit kepala, diare', 'Dapat berinteraksi dengan clopidogrel', 'Hipersensitif terhadap omeprazole'],
  ['Domperidone 10 mg', 'Domperidone', ['domperidone', 'domperidon'], 'Anti mual & muntah (obat keras, wajib resep)', RESEP + ', sebelum makan', 'Mulut kering, sakit kepala', 'Hati-hati bersama obat jantung tertentu', 'Gangguan irama jantung, gangguan hati'],
  ['Entrostop', 'Attapulgite, Pectin', ['entrostop', 'attapulgit', 'pektin'], 'Obat diare', LABEL, 'Sembelit', 'Beri jeda 2-3 jam dengan obat lain', 'Diare berdarah atau disertai demam tinggi'],
  ['New Diatabs', 'Attapulgite', ['diatabs', 'attapulgit'], 'Obat diare', LABEL, 'Sembelit', 'Beri jeda 2-3 jam dengan obat lain', 'Diare berdarah atau disertai demam tinggi'],
  ['Imodium', 'Loperamide HCl', ['imodium', 'loperamide', 'loperamid'], 'Obat diare', LABEL, 'Sembelit, perut kembung', '-', 'Anak di bawah 6 tahun, diare berdarah'],
  ['Diapet', 'Ekstrak daun jambu biji, kunyit, buah mojokeling, kulit delima', ['diapet', 'jambu', 'herbal'], 'Obat herbal diare', LABEL, 'Jarang', '-', 'Diare berdarah atau disertai demam tinggi'],
  ['Norit', 'Activated carbon', ['norit', 'karbon', 'arang', 'carbon'], 'Penyerap racun/diare', LABEL, 'Tinja berwarna hitam (normal)', 'Beri jeda 2 jam dengan obat lain', 'Sumbatan usus'],
  ['Lacto-B', 'Probiotik (Lactobacillus acidophilus, Bifidobacterium, Streptococcus thermophilus)', ['lacto', 'probiotik', 'lactobacillus'], 'Probiotik pencernaan', LABEL, 'Kembung ringan', 'Beri jeda 2 jam dengan antibiotik', '-'],
  ['Zinc 20 mg', 'Zinc sulfate', ['zinc', 'zink', 'zinkid'], 'Pendamping oralit untuk diare anak', LABEL + ' (biasanya 10 hari)', 'Mual, muntah', '-', 'Hipersensitif terhadap zinc'],
  ['Dulcolax', 'Bisacodyl', ['dulcolax', 'bisacodyl', 'bisakodil'], 'Pencahar (sembelit)', LABEL, 'Mulas, kram perut', 'Jangan diminum bersamaan dengan susu atau antasida', 'Sumbatan usus, nyeri perut tanpa sebab jelas'],
  ['Microlax', 'Sodium citrate, Sodium lauryl sulfoacetate, Sorbitol', ['microlax', 'sorbitol'], 'Pencahar lewat dubur', LABEL, 'Rasa tidak nyaman di dubur', '-', 'Hipersensitif terhadap kandungannya'],
  ['Antimo', 'Dimenhydrinate', ['antimo', 'dimenhydrinate', 'dimenhidrinat'], 'Anti mabuk perjalanan', LABEL + ' (30-60 menit sebelum berangkat)', 'Mengantuk, mulut kering', 'Menambah kantuk bila bersama obat penenang/alkohol', 'Jangan berkendara setelah minum'],
  ['Combantrin', 'Pyrantel pamoate', ['combantrin', 'pirantel', 'pyrantel'], 'Obat cacing', LABEL, 'Mual, sakit perut ringan', '-', 'Gangguan hati'],

  // ---- Vitamin & suplemen ----
  ['Enervon-C', 'Vitamin C, Vitamin B kompleks', ['enervon', 'multivitamin'], 'Multivitamin', LABEL, 'Jarang', '-', '-'],
  ['Redoxon', 'Ascorbic acid', ['redoxon', 'ascorbic', 'askorbat', 'effervescent'], 'Suplemen vitamin C', LABEL, 'Gangguan lambung bila dosis tinggi', '-', 'Riwayat batu ginjal (konsultasikan)'],
  ['Imboost', 'Echinacea purpurea extract, Zinc', ['imboost', 'echinacea'], 'Suplemen daya tahan tubuh', LABEL, 'Jarang', '-', 'Penyakit autoimun (konsultasikan)'],
  ['Stimuno', 'Phyllanthus niruri extract', ['stimuno', 'meniran', 'phyllanthus'], 'Suplemen herbal daya tahan tubuh', LABEL, 'Jarang', '-', 'Penyakit autoimun (konsultasikan)'],
  ['Sangobion', 'Ferrous gluconate, Vitamin B12, Asam folat, Vitamin C', ['sangobion', 'zat', 'besi', 'ferrous'], 'Penambah darah', LABEL, 'Tinja hitam, sembelit, mual', 'Jangan diminum bersama teh, kopi, susu, atau antasida', 'Kelebihan zat besi (hemokromatosis)'],
  ['Neurobion', 'Vitamin B1, Vitamin B6, Vitamin B12', ['neurobion', 'thiamine', 'pyridoxine', 'cyanocobalamin'], 'Vitamin neurotropik (saraf)', LABEL, 'Jarang', 'Vitamin B6 dosis tinggi dapat mengurangi efek levodopa', '-'],
  ['CDR', 'Calcium carbonate, Vitamin C, Vitamin D, Vitamin B6', ['cdr', 'kalsium', 'calcium'], 'Suplemen kalsium', LABEL, 'Sembelit, kembung', 'Beri jeda dengan antibiotik dan suplemen zat besi', 'Kadar kalsium darah tinggi, batu ginjal'],
  ['Asam Folat 1 mg', 'Folic acid', ['folat', 'folic'], 'Suplemen (kehamilan, anemia)', LABEL, 'Jarang', '-', '-'],

  // ---- Herbal & obat luar ----
  ['Tolak Angin', 'Herbal (jahe, daun mint, adas, madu)', ['tolak', 'angin', 'sidomuncul', 'herbal'], 'Obat herbal masuk angin', LABEL, 'Jarang', '-', 'Penderita diabetes perhatikan kandungan madu'],
  ['Antangin', 'Herbal (jahe, daun mint, ginseng, madu)', ['antangin', 'herbal', 'jahe'], 'Obat herbal masuk angin', LABEL, 'Jarang', '-', 'Penderita diabetes perhatikan kandungan madu'],
  ['Betadine', 'Povidone iodine', ['betadine', 'povidone', 'iodine', 'povidon'], 'Antiseptik luka (obat luar)', 'Oleskan pada luka 1-3 kali sehari', 'Iritasi kulit', '-', 'Alergi iodin, gangguan tiroid'],
  ['Insto', 'Tetrahydrozoline HCl', ['insto', 'tetrahydrozoline', 'tetrahidrozolin', 'tetes', 'mata'], 'Tetes mata merah', LABEL, 'Mata perih sesaat', '-', 'Glaukoma; jangan dipakai lebih dari 3 hari'],
  ['Canesten', 'Clotrimazole', ['canesten', 'clotrimazole', 'klotrimazol'], 'Krim antijamur (obat luar)', 'Oleskan 2-3 kali sehari', 'Kulit kemerahan/gatal', '-', 'Hipersensitif terhadap clotrimazole'],
  ['Daktarin', 'Miconazole nitrate', ['daktarin', 'miconazole', 'mikonazol'], 'Krim antijamur (obat luar)', 'Oleskan 2 kali sehari', 'Kulit kemerahan/gatal', '-', 'Hipersensitif terhadap miconazole'],

  // ---- Obat resep yang sering ditanyakan ----
  ['Amlodipine 5 mg', 'Amlodipine besylate', ['amlodipine', 'amlodipin'], 'Obat hipertensi (obat keras, wajib resep)', RESEP, 'Pergelangan kaki bengkak, pusing', 'Hati-hati bersama jus grapefruit dan obat hipertensi lain', 'Tekanan darah sangat rendah'],
  ['Captopril 25 mg', 'Captopril', ['captopril', 'kaptopril'], 'Obat hipertensi (obat keras, wajib resep)', RESEP + ', sebelum makan', 'Batuk kering, pusing', 'Hati-hati bersama suplemen kalium', 'Kehamilan, riwayat angioedema'],
  ['Metformin 500 mg', 'Metformin HCl', ['metformin'], 'Obat diabetes (obat keras, wajib resep)', RESEP + ', bersama/sesudah makan', 'Mual, diare, perut tidak nyaman', 'Hindari alkohol berlebihan', 'Gangguan ginjal berat'],
  ['Salbutamol 2 mg', 'Salbutamol', ['salbutamol', 'albuterol'], 'Pelega napas asma (obat keras, wajib resep)', RESEP, 'Tangan gemetar, jantung berdebar', 'Hati-hati bersama obat beta-blocker', 'Gangguan irama jantung (konsultasikan)'],
  ['Dexamethasone 0,5 mg', 'Dexamethasone', ['dexamethasone', 'deksametason'], 'Kortikosteroid (obat keras, wajib resep)', RESEP, 'Nafsu makan naik, gula darah naik', 'Hati-hati bersama OAINS dan obat diabetes', 'Infeksi jamur sistemik; jangan dipakai jangka panjang tanpa dokter'],
];

module.exports = ROWS.map(([name, generic, keywords, category, dosage, sideEffects, interactions, contraindications]) => ({
  name,
  generic_name: generic,
  keywords,
  category,
  dosage,
  side_effects: sideEffects,
  interactions,
  contraindications,
}));
