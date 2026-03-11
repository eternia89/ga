#!/usr/bin/env tsx

/**
 * Seed mock operational data in Indonesian for the GA Operations app.
 * Run AFTER: supabase db reset (applies seed.sql) or npm run wipe:ops
 *
 * Creates for Jaknot (JN):
 *   - 110 requests  (10 per status × 11 statuses)
 *   - 60  jobs      (10 per status × 6 statuses)
 *   - 40  inventory items (10 per status × 4 statuses)
 *   - 40  inventory movements (10 per status × 4 statuses)
 *   - 5   maintenance templates
 *   - 12  maintenance schedules
 *   - 30  job comments
 *
 * Creates for Jakmall (JM):
 *   - 22 requests (2 per status)
 *   - 12 jobs (2 per status)
 *   - 10 inventory items
 *
 * Usage: npm run seed:ops
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Supabase client ──────────────────────────────────────────────────────────

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ─── Known UUIDs (from seed.sql) ─────────────────────────────────────────────

const C = {
  jaknot: '00000000-0000-4000-a000-000000000001',
  jakmall: '00000000-0000-4000-a000-000000000002',
};

const DIV = {
  ga_jn:  '00000000-0000-4000-a001-000000000001',
  fin_jn: '00000000-0000-4000-a001-000000000002',
  it_jn:  '00000000-0000-4000-a001-000000000003',
  ops_jn: '00000000-0000-4000-a001-000000000004',
  mkt_jn: '00000000-0000-4000-a001-000000000005',
  hr_jn:  '00000000-0000-4000-a001-000000000006',
  ga_jm:  '00000000-0000-4000-a001-000000000007',
  fin_jm: '00000000-0000-4000-a001-000000000008',
  it_jm:  '00000000-0000-4000-a001-000000000009',
  ops_jm: '00000000-0000-4000-a001-000000000010',
};

const LOC = {
  kedoya_jn: '00000000-0000-4000-a002-000000000001',
  gv_jn:     '00000000-0000-4000-a002-000000000002',
  gdg3_jn:   '00000000-0000-4000-a002-000000000003',
  kedoya_jm: '00000000-0000-4000-a002-000000000004',
};

const CAT = {
  listrik_jn:    '00000000-0000-4000-a003-000000000001',
  air_jn:        '00000000-0000-4000-a003-000000000002',
  ac_jn:         '00000000-0000-4000-a003-000000000003',
  bersih_jn:     '00000000-0000-4000-a003-000000000004',
  keaman_jn:     '00000000-0000-4000-a003-000000000005',
  furni_req_jn:  '00000000-0000-4000-a003-000000000006',
  elektronik_jn: '00000000-0000-4000-a003-000000000007',
  furni_ast_jn:  '00000000-0000-4000-a003-000000000008',
  kendaraan_jn:  '00000000-0000-4000-a003-000000000009',
  peralatan_jn:  '00000000-0000-4000-a003-000000000010',
  listrik_jm:    '00000000-0000-4000-a003-000000000011',
  air_jm:        '00000000-0000-4000-a003-000000000012',
  ac_jm:         '00000000-0000-4000-a003-000000000013',
  furni_req_jm:  '00000000-0000-4000-a003-000000000014',
  elektronik_jm: '00000000-0000-4000-a003-000000000015',
  furni_ast_jm:  '00000000-0000-4000-a003-000000000016',
  kendaraan_jm:  '00000000-0000-4000-a003-000000000017',
};

const U = {
  samuel: '00000000-0000-4000-a004-000000000001', // admin, Jakmall
  okka:   '00000000-0000-4000-a004-000000000002', // ga_staff, Jakmall
  agus:   '00000000-0000-4000-a004-000000000003', // ga_lead, Jaknot
  eva:    '00000000-0000-4000-a004-000000000004', // ga_staff, Jaknot
  dwiky:  '00000000-0000-4000-a004-000000000005', // ga_staff, Jaknot
  ria:    '00000000-0000-4000-a004-000000000006', // general_user, Jaknot
  hadi:   '00000000-0000-4000-a004-000000000007', // general_user, Jaknot
  makmur: '00000000-0000-4000-a004-000000000008', // general_user, Jaknot
  amil:   '00000000-0000-4000-a004-000000000009', // general_user, Jaknot
  maldini:'00000000-0000-4000-a004-000000000010', // general_user, Jaknot
  rudy:   '00000000-0000-4000-a004-000000000011', // finance_approver, Jaknot
};

// ─── Display ID helpers (base-36, same as DB functions) ───────────────────────

function toBase36(n: number, width = 3): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (n === 0) return '0'.padStart(width, '0');
  let result = '';
  let val = n;
  while (val > 0) {
    result = chars[val % 36] + result;
    val = Math.floor(val / 36);
  }
  return result.padStart(width, '0');
}

const reqId  = (cc: string, seq: number) => `R${cc}-26-${toBase36(seq)}`;
const jobId  = (cc: string, seq: number) => `J${cc}-26-${toBase36(seq)}`;
const astId  = (cc: string, seq: number) => `I${cc}-26-${toBase36(seq)}`;

// ─── Date helpers ─────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

// Cycle through array
const pick = <T>(arr: readonly T[], i: number): T => arr[i % arr.length];

// ─── Shared data pools ───────────────────────────────────────────────────────

const JN_REQUESTERS = [U.ria, U.hadi, U.makmur, U.amil, U.maldini];
const JN_GA_STAFF   = [U.eva, U.dwiky];
const JN_DIVS       = [DIV.ga_jn, DIV.fin_jn, DIV.it_jn, DIV.ops_jn, DIV.mkt_jn, DIV.hr_jn];
const JN_LOCS       = [LOC.kedoya_jn, LOC.gv_jn, LOC.gdg3_jn];

const COSTS = [500_000, 1_200_000, 2_500_000, 3_750_000, 5_000_000, 7_500_000, 10_000_000, 15_000_000];

const REJECTION_REASONS = [
  'Anggaran tidak mencukupi untuk pengerjaan ini pada kuartal ini.',
  'Permintaan duplikat dengan tiket yang sudah ada sebelumnya.',
  'Prioritas tidak sesuai dengan program kerja GA saat ini.',
  'Vendor yang sesuai tidak tersedia dalam waktu dekat.',
  'Perlu persetujuan direksi terlebih dahulu sebelum dikerjakan.',
];

const FEEDBACK_COMMENTS = [
  'Pengerjaan cepat dan rapi, terima kasih tim GA!',
  'Sudah selesai dengan baik, sangat puas dengan hasilnya.',
  'Cukup memuaskan, namun waktu respons bisa lebih cepat.',
  'Pekerjaan baik meskipun sempat ada delay di hari kedua.',
  'Hasil akhir sesuai harapan, kualitas pengerjaan sangat baik.',
];

// ─── Request templates ────────────────────────────────────────────────────────

const REQ_TEMPLATES = [
  // Kelistrikan
  { title: 'Lampu ruang konferensi A padam',          desc: 'Lampu TL di ruang konferensi A lantai 3 mati total. Perlu penggantian segera karena ruangan digunakan untuk meeting harian.',                       cat: CAT.listrik_jn,   priority: 'medium' },
  { title: 'Stop kontak konslet di ruang IT',          desc: 'Terjadi konslet pada stop kontak di dekat server rack lantai 2. Perlu penanganan segera untuk mencegah kerusakan perangkat.',                       cat: CAT.listrik_jn,   priority: 'urgent' },
  { title: 'Kabel listrik terkelupas area loading dock',desc: 'Ditemukan kabel listrik yang terkelupas di area loading dock lantai 1. Berbahaya bagi keselamatan karyawan dan pengunjung.',                       cat: CAT.listrik_jn,   priority: 'high'   },
  { title: 'MCB sering trip di panel listrik lantai 2',desc: 'MCB pada panel listrik lantai 2 sering trip secara tiba-tiba, mengganggu operasional kantor terutama di sore hari.',                               cat: CAT.listrik_jn,   priority: 'high'   },
  { title: 'Genset tidak menyala saat PLN padam',      desc: 'Saat terjadi pemadaman PLN kemarin, genset tidak berfungsi normal. Perlu pengecekan dan servis genset segera.',                                    cat: CAT.listrik_jn,   priority: 'urgent' },
  { title: 'Kipas exhaust toilet lantai 2 mati',       desc: 'Exhaust fan di toilet wanita lantai 2 tidak berputar, menyebabkan bau tidak sedap di area toilet. Sudah berlangsung 5 hari.',                      cat: CAT.listrik_jn,   priority: 'low'    },
  { title: 'Instalasi colokan tambahan di aula',       desc: 'Ruang aula kekurangan stop kontak untuk event dan training. Perlu tambahan minimal 4 stop kontak di sisi timur dan barat aula.',                  cat: CAT.listrik_jn,   priority: 'medium' },
  // AC & Ventilasi
  { title: 'AC ruang direktur tidak dingin',           desc: 'AC di ruang direktur utama mengeluarkan suara bising dan tidak mendinginkan ruangan secara optimal. Suhu terasa lebih dari 30°C.',                 cat: CAT.ac_jn,        priority: 'high'   },
  { title: 'AC server room suhu tidak stabil',         desc: 'Suhu di server room fluktuatif antara 25-35°C. AC tidak dapat menjaga suhu sesuai standar. Ada risiko kerusakan server jika tidak segera ditangani.',cat: CAT.ac_jn,        priority: 'urgent' },
  { title: 'AC menetes air di ruang marketing',        desc: 'AC di ruang marketing menetes air ke lantai sehingga licin dan berpotensi membahayakan karyawan yang berlalu-lalang.',                             cat: CAT.ac_jn,        priority: 'medium' },
  { title: 'AC unit outdoor bocor di rooftop',         desc: 'Unit outdoor AC di rooftop bocor cairan. Perlu pengecekan freon dan servis berkala sebelum kerusakan meluas ke dalam ruangan.',                    cat: CAT.ac_jn,        priority: 'medium' },
  // Plumbing & Air
  { title: 'Kran wastafel toilet pria bocor',          desc: 'Kran wastafel di toilet pria lantai 3 bocor terus-menerus, membuang air sia-sia dan membuat lantai basah sepanjang waktu.',                        cat: CAT.air_jn,       priority: 'medium' },
  { title: 'WC tersumbat toilet lantai 1',             desc: 'WC di toilet lantai 1 tersumbat dan tidak bisa digunakan. Membutuhkan penanganan plumber segera agar tidak mengganggu operasional kantor.',         cat: CAT.air_jn,       priority: 'high'   },
  { title: 'Saluran pembuangan dapur kantor mampet',   desc: 'Saluran pembuangan air di dapur kantor mampet, air menggenang saat cuci piring. Sudah terjadi 3 hari berturut-turut dan mulai menimbulkan bau.',   cat: CAT.air_jn,       priority: 'medium' },
  { title: 'Tanki air atap bocor',                     desc: 'Tanki air di rooftop mengalami kebocoran, air menetes ke plafon lantai 5. Perlu pengecekan dan perbaikan segera sebelum kerusakan meluas.',         cat: CAT.air_jn,       priority: 'high'   },
  { title: 'Perbaikan pipa air panas pantry',          desc: 'Pipa air panas di pantry lantai 3 mengeluarkan suara berisik saat digunakan dan terkadang aliran macet. Perlu pengecekan dan perbaikan.',          cat: CAT.air_jn,       priority: 'low'    },
  // Kebersihan
  { title: 'Atap bocor di area lobi belakang',         desc: 'Plafon area lobi belakang bocor saat hujan deras. Air menetes ke lantai dan mengancam keselamatan karyawan. Sudah terjadi 2 musim hujan.',          cat: CAT.bersih_jn,    priority: 'high'   },
  { title: 'Karpet ruang direksi perlu diganti',       desc: 'Karpet di ruang direksi mengalami kerusakan parah dengan bercak permanen yang tidak bisa dibersihkan. Perlu penggantian untuk kesan profesional.',  cat: CAT.bersih_jn,    priority: 'low'    },
  { title: 'Sampah menumpuk di area loading dock',     desc: 'Sampah di area loading dock menumpuk dan belum diangkut selama 3 hari. Menimbulkan bau tidak sedap dan mengganggu operasional pengiriman barang.',  cat: CAT.bersih_jn,    priority: 'medium' },
  { title: 'Pengecatan ulang toilet lantai 4',         desc: 'Cat di toilet lantai 4 sudah mengelupas dan berjamur di beberapa titik. Perlu pengecatan ulang untuk estetika dan standar kebersihan.',             cat: CAT.bersih_jn,    priority: 'low'    },
  { title: 'Pengecatan ulang marka area parkir motor', desc: 'Marka parkir motor di area basement sudah memudar, perlu pengecatan ulang agar kendaraan bisa parkir dengan tertib dan aman.',                      cat: CAT.bersih_jn,    priority: 'low'    },
  // Keamanan & Akses
  { title: 'CCTV area parkir basement mati',           desc: 'Kamera CCTV di area parkir basement tidak aktif sejak 2 minggu lalu. Keamanan area parkir tidak terpantau, berisiko untuk kendaraan karyawan.',    cat: CAT.keaman_jn,    priority: 'high'   },
  { title: 'Kartu akses pintu lantai 4 error',         desc: 'Kartu akses untuk pintu utama lantai 4 sering error, beberapa karyawan tidak bisa masuk tanpa bantuan security tiap pagi hari.',                   cat: CAT.keaman_jn,    priority: 'medium' },
  { title: 'Pintu darurat lantai 2 macet',             desc: 'Pintu darurat lantai 2 tidak bisa dibuka dari dalam. Kondisi ini sangat berbahaya jika terjadi situasi darurat seperti kebakaran.',                cat: CAT.keaman_jn,    priority: 'urgent' },
  { title: 'Mesin fingerprint resepsionis rusak',      desc: 'Mesin absensi fingerprint di area resepsionis tidak bisa membaca sidik jari. Karyawan terlambat absen dan data kehadiran menjadi tidak akurat.',    cat: CAT.keaman_jn,    priority: 'medium' },
  // Furniture & Interior
  { title: 'Kursi putar ruang rapat B rusak',          desc: '5 kursi putar di ruang rapat B patah rodanya dan tidak bisa digunakan untuk meeting klien. Perlu penggantian sebelum meeting besar minggu depan.',  cat: CAT.furni_req_jn, priority: 'high'   },
  { title: 'Meja operasional gudang 3 lapuk',          desc: 'Meja operasional di gudang 3 sudah lapuk dan tidak stabil. Ada risiko patah saat digunakan. Perlu diganti dengan meja yang lebih kuat.',            cat: CAT.furni_req_jn, priority: 'medium' },
  { title: 'Papan whiteboard ruang training retak',    desc: 'Papan whiteboard di ruang training retak di bagian tengah. Perlu penggantian sebelum jadwal training karyawan baru bulan depan.',                   cat: CAT.furni_req_jn, priority: 'low'    },
  { title: 'Lemari arsip lantai 3 tidak bisa dikunci', desc: 'Lemari arsip di ruang admin lantai 3 pintunya tidak bisa dikunci. Keamanan dokumen penting dan rahasia perusahaan terancam.',                       cat: CAT.furni_req_jn, priority: 'high'   },
  { title: 'Penggantian kaca jendela retak',           desc: 'Kaca jendela di ruang meeting lantai 2 retak akibat tertimpa benda saat renovasi. Perlu diganti segera untuk keamanan dan kenyamanan.',             cat: CAT.furni_req_jn, priority: 'medium' },
  { title: 'Sofa lobi rusak bagian rangka',            desc: 'Sofa di area lobi depan rusak bagian rangka bawah sehingga tidak nyaman. Perlu perbaikan atau penggantian sebelum kunjungan klien minggu ini.',     cat: CAT.furni_req_jn, priority: 'medium' },
] as const;

// ─── Seed Jaknot Requests ─────────────────────────────────────────────────────

async function seedJaknotRequests(supabase: SupabaseClient): Promise<string[]> {
  const REQUEST_STATUSES = [
    'submitted', 'triaged', 'in_progress', 'pending_approval',
    'approved', 'rejected', 'completed', 'pending_acceptance',
    'accepted', 'closed', 'cancelled',
  ] as const;

  const rows: Record<string, unknown>[] = [];
  let seq = 0;
  const ids: string[] = [];

  for (const status of REQUEST_STATUSES) {
    for (let i = 0; i < 10; i++) {
      seq++;
      const tmpl    = REQ_TEMPLATES[(seq - 1) % REQ_TEMPLATES.length];
      const req     = JN_REQUESTERS[(seq - 1) % JN_REQUESTERS.length];
      const div     = JN_DIVS[(seq - 1) % JN_DIVS.length];
      const loc     = JN_LOCS[(seq - 1) % JN_LOCS.length];
      const staff   = JN_GA_STAFF[(seq - 1) % JN_GA_STAFF.length];
      const cost    = pick(COSTS, seq - 1);
      const created = daysAgo((seq % 55) + 5);
      const later   = (offset: number) =>
        new Date(new Date(created).getTime() + offset * 86_400_000).toISOString();

      const row: Record<string, unknown> = {
        company_id:   C.jaknot,
        division_id:  div,
        location_id:  loc,
        category_id:  tmpl.cat,
        requester_id: req,
        display_id:   reqId('JN', seq),
        title:        tmpl.title,
        description:  tmpl.desc,
        priority:     tmpl.priority,
        status,
        created_at:   created,
      };

      switch (status) {
        case 'triaged':
          row.assigned_to = staff;
          break;
        case 'in_progress':
          row.assigned_to    = staff;
          row.estimated_cost = cost;
          break;
        case 'pending_approval':
          row.assigned_to    = staff;
          row.requires_approval = true;
          row.estimated_cost = cost;
          break;
        case 'approved':
          row.assigned_to    = staff;
          row.requires_approval = true;
          row.estimated_cost = cost;
          row.approved_at    = later(2);
          row.approved_by    = U.rudy;
          break;
        case 'rejected':
          row.assigned_to      = staff;
          row.requires_approval = true;
          row.estimated_cost   = cost;
          row.rejected_at      = later(2);
          row.rejected_by      = U.rudy;
          row.rejection_reason = pick(REJECTION_REASONS, seq - 1);
          break;
        case 'completed':
          row.assigned_to    = staff;
          row.estimated_cost = cost;
          row.actual_cost    = Math.round(cost * 0.9);
          row.completed_at   = later(4);
          break;
        case 'pending_acceptance':
          row.assigned_to    = staff;
          row.estimated_cost = cost;
          row.actual_cost    = Math.round(cost * 0.92);
          row.completed_at   = daysAgo(2);
          break;
        case 'accepted':
          row.assigned_to      = staff;
          row.estimated_cost   = cost;
          row.actual_cost      = Math.round(cost * 0.88);
          row.completed_at     = later(4);
          row.accepted_at      = later(6);
          row.feedback_rating  = (seq % 4) + 2; // 2-5
          row.feedback_comment = pick(FEEDBACK_COMMENTS, seq - 1);
          break;
        case 'closed':
          row.assigned_to    = staff;
          row.estimated_cost = cost;
          row.actual_cost    = Math.round(cost * 0.85);
          row.completed_at   = later(4);
          row.accepted_at    = later(7);
          row.feedback_rating = (seq % 3) + 3; // 3-5
          break;
        case 'cancelled':
          // no extra fields required
          break;
      }

      rows.push(row);
    }
  }

  // Insert in batches of 20
  for (let i = 0; i < rows.length; i += 20) {
    const { data, error } = await supabase.from('requests').insert(rows.slice(i, i + 20)).select('id');
    if (error) throw new Error(`Requests batch ${i}: ${error.message}`);
    ids.push(...(data?.map((r: { id: string }) => r.id) ?? []));
  }

  return ids;
}

// ─── Seed Jakmall Requests (2 per status) ────────────────────────────────────

async function seedJakmallRequests(supabase: SupabaseClient): Promise<void> {
  const JM_STATUSES = ['submitted', 'triaged', 'in_progress', 'pending_approval',
    'approved', 'rejected', 'completed', 'pending_acceptance', 'accepted', 'closed', 'cancelled'] as const;
  const JM_CATS = [CAT.listrik_jm, CAT.air_jm, CAT.ac_jm, CAT.furni_req_jm];
  const JM_REQUESTERS = [U.samuel]; // samuel is the admin who submits as proxy in Jakmall

  const rows: Record<string, unknown>[] = [];
  let seq = 0;

  for (const status of JM_STATUSES) {
    for (let i = 0; i < 2; i++) {
      seq++;
      const tmpl = REQ_TEMPLATES[(seq + 5) % REQ_TEMPLATES.length];
      const cost = pick(COSTS, seq);
      const created = daysAgo((seq % 30) + 3);
      const later = (offset: number) =>
        new Date(new Date(created).getTime() + offset * 86_400_000).toISOString();

      const row: Record<string, unknown> = {
        company_id:   C.jakmall,
        division_id:  pick([DIV.ga_jm, DIV.ops_jm, DIV.it_jm], seq - 1),
        location_id:  LOC.kedoya_jm,
        category_id:  pick(JM_CATS, seq - 1),
        requester_id: U.samuel,
        display_id:   reqId('JM', seq),
        title:        tmpl.title,
        description:  tmpl.desc,
        priority:     pick(['low', 'medium', 'high', 'urgent'] as const, seq - 1),
        status,
        created_at:   created,
      };

      switch (status) {
        case 'triaged':
          row.assigned_to = U.okka;
          break;
        case 'in_progress':
          row.assigned_to = U.okka; row.estimated_cost = cost;
          break;
        case 'pending_approval':
          row.assigned_to = U.okka; row.requires_approval = true; row.estimated_cost = cost;
          break;
        case 'approved':
          row.assigned_to = U.okka; row.requires_approval = true; row.estimated_cost = cost;
          row.approved_at = later(2); row.approved_by = U.samuel;
          break;
        case 'rejected':
          row.assigned_to = U.okka; row.requires_approval = true; row.estimated_cost = cost;
          row.rejected_at = later(2); row.rejected_by = U.samuel;
          row.rejection_reason = pick(REJECTION_REASONS, seq);
          break;
        case 'completed':
          row.assigned_to = U.okka; row.estimated_cost = cost;
          row.actual_cost = Math.round(cost * 0.9); row.completed_at = later(3);
          break;
        case 'pending_acceptance':
          row.assigned_to = U.okka; row.estimated_cost = cost;
          row.actual_cost = Math.round(cost * 0.9); row.completed_at = daysAgo(1);
          break;
        case 'accepted':
          row.assigned_to = U.okka; row.estimated_cost = cost;
          row.actual_cost = Math.round(cost * 0.88); row.completed_at = later(3);
          row.accepted_at = later(5); row.feedback_rating = (seq % 3) + 3;
          break;
        case 'closed':
          row.assigned_to = U.okka; row.estimated_cost = cost;
          row.actual_cost = Math.round(cost * 0.85);
          row.completed_at = later(3); row.accepted_at = later(6);
          break;
      }
      rows.push(row);
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { error } = await supabase.from('requests').insert(rows.slice(i, i + 20));
    if (error) throw new Error(`Jakmall requests batch ${i}: ${error.message}`);
  }
}

// ─── Job templates ────────────────────────────────────────────────────────────

const JOB_TEMPLATES = [
  { title: 'Penggantian lampu TL ruang konferensi A',      desc: 'Ganti seluruh lampu TL yang mati di ruang konferensi A lantai 3. Estimasi 4 unit lampu 36W.',            type: 'standalone' },
  { title: 'Perbaikan AC server room',                      desc: 'Servis dan perbaikan unit AC di server room. Cek freon, bersihkan filter, dan kalibrasi termostat.',       type: 'standalone' },
  { title: 'Inspeksi sistem kelistrikan gedung',            desc: 'Pemeriksaan menyeluruh instalasi listrik seluruh lantai. Cek panel, grounding, dan kabel yang terkelupas.', type: 'standalone' },
  { title: 'Penggantian kran bocor toilet lantai 3',        desc: 'Ganti kran wastafel yang bocor di toilet pria lantai 3. Pastikan tidak ada kebocoran setelah penggantian.',  type: 'request_linked' },
  { title: 'Pembersihan saluran air seluruh gedung',        desc: 'Pembersihan dan pengecekan saluran pembuangan air di seluruh toilet, pantry, dan area outdoor.',            type: 'standalone' },
  { title: 'Servis genset bulanan',                         desc: 'Servis rutin genset meliputi penggantian oli, cek aki, busi, dan uji coba start manual.',                  type: 'preventive_maintenance' },
  { title: 'Instalasi stop kontak tambahan di aula',        desc: 'Pasang 4 stop kontak 3 phase di dinding timur dan barat ruang aula untuk kebutuhan event.',               type: 'request_linked' },
  { title: 'Perbaikan kunci pintu darurat lantai 2',        desc: 'Perbaiki mekanisme kunci pintu darurat lantai 2 yang macet. Pastikan bisa dibuka dari dalam dengan mudah.',type: 'request_linked' },
  { title: 'Pembaruan firmware dan cek CCTV',               desc: 'Update firmware seluruh kamera CCTV dan periksa DVR. Pastikan semua sudut terpantau dengan baik.',         type: 'standalone' },
  { title: 'Penggantian karpet ruang direksi',              desc: 'Lepas karpet lama dan pasang karpet baru di ruang direksi. Ukuran 6x8 meter, warna abu-abu gelap.',        type: 'request_linked' },
  { title: 'Pengecatan ulang toilet lantai 4',              desc: 'Cat ulang dinding dan plafon toilet lantai 4 menggunakan cat anti-jamur warna putih.',                     type: 'request_linked' },
  { title: 'Penggantian unit AC indoor ruang marketing',    desc: 'Bongkar unit AC indoor lama dan pasang unit baru 2 PK. Termasuk instalasi dan uji coba.',                 type: 'request_linked' },
  { title: 'Inspeksi rutin lift gedung',                    desc: 'Pemeriksaan rutin 3 bulan sekali: cek kabel, rem darurat, lampu kabin, dan kapasitas beban.',             type: 'preventive_maintenance' },
  { title: 'Perbaikan atap bocor lobi belakang',            desc: 'Identifikasi titik kebocoran atap lobi belakang dan tambal dengan waterproofing. Termasuk cat ulang plafon.', type: 'request_linked' },
  { title: 'Penggantian kursi rusak ruang rapat B',         desc: 'Beli dan pasang 5 kursi putar baru di ruang rapat B. Spesifikasi: dengan roda, sandaran tangan, hitam.',   type: 'request_linked' },
  { title: 'Servis berkala panel listrik MDP',              desc: 'Servis panel listrik MDP: bersihkan busbar, cek torque, uji trip MCB, dan ganti fuse yang lemah.',         type: 'preventive_maintenance' },
  { title: 'Pemasangan exhaust fan tambahan pantry',        desc: 'Pasang 2 unit exhaust fan di pantry lantai 3 dan 4 untuk sirkulasi udara yang lebih baik.',               type: 'standalone' },
  { title: 'Perbaikan pagar halaman kantor',                desc: 'Perbaiki pagar besi di sisi selatan kantor yang bengkok akibat terserempet kendaraan.',                   type: 'standalone' },
  { title: 'Pembersihan dan servis AC split seluruh lantai',desc: 'Pembersihan filter, evaporator, dan kondensor seluruh AC split. 24 unit di 6 lantai.',                    type: 'preventive_maintenance' },
  { title: 'Penggantian kaca jendela retak lantai 2',       desc: 'Ganti kaca jendela tempered yang retak di ruang meeting lantai 2. Ukuran 120x150 cm.',                    type: 'request_linked' },
] as const;

// ─── Seed Jaknot Jobs ─────────────────────────────────────────────────────────

async function seedJaknotJobs(supabase: SupabaseClient, requestIds: string[]): Promise<string[]> {
  const JOB_STATUSES = ['created', 'assigned', 'in_progress', 'pending_approval', 'completed', 'cancelled'] as const;

  const rows: Record<string, unknown>[] = [];
  let seq = 0;
  const ids: string[] = [];

  for (const status of JOB_STATUSES) {
    for (let i = 0; i < 10; i++) {
      seq++;
      const tmpl    = JOB_TEMPLATES[(seq - 1) % JOB_TEMPLATES.length];
      const staff   = JN_GA_STAFF[(seq - 1) % JN_GA_STAFF.length];
      const loc     = JN_LOCS[(seq - 1) % JN_LOCS.length];
      const cost    = pick(COSTS, seq - 1);
      const created = daysAgo((seq % 45) + 2);
      const later   = (offset: number) =>
        new Date(new Date(created).getTime() + offset * 86_400_000).toISOString();

      // Link some jobs to requests (request_linked type)
      const reqId_link = tmpl.type === 'request_linked' && requestIds.length > 0
        ? pick(requestIds, seq - 1)
        : undefined;

      const row: Record<string, unknown> = {
        company_id: C.jaknot,
        location_id: loc,
        display_id: jobId('JN', seq),
        title: tmpl.title,
        description: tmpl.desc,
        status,
        priority: pick(['low', 'medium', 'high', 'urgent'] as const, seq - 1),
        job_type: tmpl.type,
        created_by: U.agus,
        request_id: reqId_link ?? null,
        estimated_cost: cost,
        created_at: created,
      };

      switch (status) {
        case 'assigned':
          row.assigned_to = staff;
          break;
        case 'in_progress':
          row.assigned_to = staff;
          row.started_at  = later(1);
          break;
        case 'pending_approval':
          row.assigned_to          = staff;
          row.started_at           = later(1);
          row.approval_submitted_at = later(3);
          break;
        case 'completed':
          row.assigned_to  = staff;
          row.started_at   = later(1);
          row.completed_at = later(4);
          row.actual_cost  = Math.round(cost * 0.9);
          break;
        case 'cancelled':
          // no extra fields
          break;
      }

      rows.push(row);
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { data, error } = await supabase.from('jobs').insert(rows.slice(i, i + 20)).select('id');
    if (error) throw new Error(`Jobs batch ${i}: ${error.message}`);
    ids.push(...(data?.map((r: { id: string }) => r.id) ?? []));
  }

  return ids;
}

// ─── Seed Jakmall Jobs (2 per status) ────────────────────────────────────────

async function seedJakmallJobs(supabase: SupabaseClient): Promise<void> {
  const JOB_STATUSES = ['created', 'assigned', 'in_progress', 'pending_approval', 'completed', 'cancelled'] as const;
  const rows: Record<string, unknown>[] = [];
  let seq = 0;

  for (const status of JOB_STATUSES) {
    for (let i = 0; i < 2; i++) {
      seq++;
      const tmpl = JOB_TEMPLATES[(seq + 3) % JOB_TEMPLATES.length];
      const cost = pick(COSTS, seq);
      const created = daysAgo((seq % 25) + 2);
      const later = (offset: number) =>
        new Date(new Date(created).getTime() + offset * 86_400_000).toISOString();

      const row: Record<string, unknown> = {
        company_id: C.jakmall,
        location_id: LOC.kedoya_jm,
        display_id: jobId('JM', seq),
        title: tmpl.title,
        description: tmpl.desc,
        status,
        priority: pick(['low', 'medium', 'high'] as const, seq - 1),
        job_type: 'standalone',
        created_by: U.samuel,
        estimated_cost: cost,
        created_at: created,
      };

      switch (status) {
        case 'assigned':  row.assigned_to = U.okka; break;
        case 'in_progress': row.assigned_to = U.okka; row.started_at = later(1); break;
        case 'pending_approval':
          row.assigned_to = U.okka; row.started_at = later(1);
          row.approval_submitted_at = later(3);
          break;
        case 'completed':
          row.assigned_to = U.okka; row.started_at = later(1);
          row.completed_at = later(4); row.actual_cost = Math.round(cost * 0.9);
          break;
      }
      rows.push(row);
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { error } = await supabase.from('jobs').insert(rows.slice(i, i + 20));
    if (error) throw new Error(`Jakmall jobs batch ${i}: ${error.message}`);
  }
}

// ─── Inventory item templates ─────────────────────────────────────────────────

const ASSET_TEMPLATES = [
  { name: 'Laptop Dell Latitude 5520',          cat: 'elektronik', brand: 'Dell',       model: 'Latitude 5520',  cond: 'good'      },
  { name: 'Laptop Lenovo ThinkPad E15',         cat: 'elektronik', brand: 'Lenovo',     model: 'ThinkPad E15',   cond: 'excellent'  },
  { name: 'Monitor LG 24 inch',                 cat: 'elektronik', brand: 'LG',         model: '24MK430H',       cond: 'good'      },
  { name: 'Monitor ASUS 27 inch 4K',            cat: 'elektronik', brand: 'ASUS',       model: 'PA279CRV',       cond: 'excellent'  },
  { name: 'Printer HP LaserJet M404n',          cat: 'elektronik', brand: 'HP',         model: 'LaserJet M404n', cond: 'fair'      },
  { name: 'Proyektor Epson EB-X41',             cat: 'elektronik', brand: 'Epson',      model: 'EB-X41',         cond: 'fair'      },
  { name: 'UPS APC Smart-UPS 1500VA',           cat: 'elektronik', brand: 'APC',        model: 'SMT1500RM2U',    cond: 'good'      },
  { name: 'Access Point Ubiquiti UniFi U6',     cat: 'elektronik', brand: 'Ubiquiti',   model: 'U6-Pro',         cond: 'excellent'  },
  { name: 'Kamera CCTV Hikvision 4MP',          cat: 'elektronik', brand: 'Hikvision',  model: 'DS-2CD2143G0-I', cond: 'good'      },
  { name: 'Mesin Absensi ZKTeco F22',           cat: 'peralatan',  brand: 'ZKTeco',     model: 'F22',            cond: 'fair'      },
  { name: 'Meja Kerja Kayu Mahogani 160cm',     cat: 'furniture',  brand: 'Olympic',    model: 'Executive Desk', cond: 'good'      },
  { name: 'Kursi Ergonomis Herman Miller',      cat: 'furniture',  brand: 'Herman Miller', model: 'Aeron',       cond: 'excellent'  },
  { name: 'Lemari Arsip Besi 4 Pintu',         cat: 'furniture',  brand: 'Brother',    model: 'Filing Cabinet', cond: 'fair'      },
  { name: 'Sofa Lobi 3 Dudukan',               cat: 'furniture',  brand: 'IKEA',       model: 'Kivik',          cond: 'good'      },
  { name: 'Meja Meeting Oval 10 Orang',        cat: 'furniture',  brand: 'Kantor Pos', model: 'Conference M10', cond: 'excellent'  },
  { name: 'Partisi Kantor Modular',            cat: 'furniture',  brand: 'Workspace',  model: 'Modular-120',    cond: 'good'      },
  { name: 'Toyota Avanza 2022',                cat: 'kendaraan',  brand: 'Toyota',     model: 'Avanza 1.5 G',   cond: 'excellent'  },
  { name: 'Honda Brio 2021',                   cat: 'kendaraan',  brand: 'Honda',      model: 'Brio Satya E',   cond: 'good'      },
  { name: 'Mitsubishi L300 Box 2020',          cat: 'kendaraan',  brand: 'Mitsubishi', model: 'L300 Box',       cond: 'fair'      },
  { name: 'Mesin Fotokopi Ricoh MP 2014',      cat: 'peralatan',  brand: 'Ricoh',      model: 'MP 2014',        cond: 'fair'      },
] as const;

function catIdFor(cat: string): string {
  const map: Record<string, string> = {
    elektronik: CAT.elektronik_jn,
    furniture:  CAT.furni_ast_jn,
    kendaraan:  CAT.kendaraan_jn,
    peralatan:  CAT.peralatan_jn,
  };
  return map[cat] ?? CAT.elektronik_jn;
}

// ─── Seed Jaknot Inventory Items ──────────────────────────────────────────────

async function seedJaknotInventory(supabase: SupabaseClient): Promise<{ itemIds: string[]; activeItemIds: string[] }> {
  const ITEM_STATUSES = ['active', 'under_repair', 'broken', 'sold_disposed'] as const;
  const CONDITIONS    = ['excellent', 'good', 'fair', 'poor'] as const;

  const rows: Record<string, unknown>[] = [];
  let seq = 0;
  const allIds: string[] = [];
  const activeIds: string[] = [];

  for (const status of ITEM_STATUSES) {
    for (let i = 0; i < 10; i++) {
      seq++;
      const tmpl = ASSET_TEMPLATES[(seq - 1) % ASSET_TEMPLATES.length];
      const loc  = JN_LOCS[(seq - 1) % JN_LOCS.length];

      rows.push({
        company_id:     C.jaknot,
        location_id:    loc,
        category_id:    catIdFor(tmpl.cat),
        display_id:     astId('JN', seq),
        name:           `${tmpl.name} #${seq}`,
        description:    `${tmpl.name} milik perusahaan. Serial: SN-JN-${String(seq).padStart(4, '0')}.`,
        status,
        condition:      pick(CONDITIONS, seq - 1),
        brand:          tmpl.brand,
        model:          tmpl.model,
        serial_number:  `SN-JN-${String(seq).padStart(4, '0')}`,
        purchase_date:  new Date(Date.now() - (seq * 30 + 365) * 86_400_000).toISOString().slice(0, 10),
        purchase_price: pick(COSTS, seq - 1) * 3,
        acquisition_date: new Date(Date.now() - seq * 30 * 86_400_000).toISOString().slice(0, 10),
        created_at:     daysAgo((seq % 90) + 10),
      });
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { data, error } = await supabase.from('inventory_items').insert(rows.slice(i, i + 20)).select('id, status');
    if (error) throw new Error(`Inventory batch ${i}: ${error.message}`);
    for (const item of (data ?? [])) {
      allIds.push(item.id);
      if (item.status === 'active') activeIds.push(item.id);
    }
  }

  return { itemIds: allIds, activeItemIds: activeIds };
}

// ─── Seed Inventory Movements ─────────────────────────────────────────────────

async function seedInventoryMovements(supabase: SupabaseClient, activeItemIds: string[]): Promise<void> {
  const MOV_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const;

  // We need 1 item per pending movement (unique partial index)
  // Use first 40 active items (10 per status)
  const rows: Record<string, unknown>[] = [];

  let itemIdx = 0;
  for (const status of MOV_STATUSES) {
    for (let i = 0; i < 10; i++) {
      const item = activeItemIds[itemIdx % activeItemIds.length];
      itemIdx++;
      const fromLoc = JN_LOCS[i % JN_LOCS.length];
      const toLoc   = JN_LOCS[(i + 1) % JN_LOCS.length];
      const created = daysAgo((i + 1) * 3);
      const later   = (offset: number) =>
        new Date(new Date(created).getTime() + offset * 86_400_000).toISOString();

      const row: Record<string, unknown> = {
        company_id:      C.jaknot,
        item_id:         item,
        from_location_id: fromLoc,
        to_location_id:  toLoc,
        initiated_by:    pick(JN_GA_STAFF, i),
        status,
        notes:           `Pemindahan aset dari ${fromLoc === LOC.kedoya_jn ? 'Kedoya' : fromLoc === LOC.gv_jn ? 'GV' : 'Gudang 3'} ke ${toLoc === LOC.kedoya_jn ? 'Kedoya' : toLoc === LOC.gv_jn ? 'GV' : 'Gudang 3'}.`,
        created_at:      created,
      };

      switch (status) {
        case 'accepted':
          row.receiver_id  = pick(JN_GA_STAFF, i + 1);
          row.received_at  = later(1);
          break;
        case 'rejected':
          row.receiver_id      = pick(JN_GA_STAFF, i + 1);
          row.rejection_reason = pick(['Aset tidak sesuai kondisi yang diharapkan.', 'Lokasi tujuan tidak membutuhkan aset ini saat ini.', 'Dokumen pengiriman tidak lengkap.'], i);
          row.rejected_at      = later(1);
          break;
        case 'cancelled':
          row.cancelled_at = later(0);
          break;
      }

      rows.push(row);
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { error } = await supabase.from('inventory_movements').insert(rows.slice(i, i + 20));
    if (error) throw new Error(`Movements batch ${i}: ${error.message}`);
  }
}

// ─── Seed Maintenance Templates ───────────────────────────────────────────────

async function seedMaintenanceTemplates(supabase: SupabaseClient): Promise<string[]> {
  const templates = [
    {
      company_id:  C.jaknot,
      category_id: CAT.ac_jn,
      name:        'Servis Rutin AC Split',
      description: 'Prosedur servis berkala AC split 3 bulanan untuk seluruh unit kantor.',
      checklist: JSON.stringify([
        { id: '1', type: 'checkbox', label: 'Matikan unit dan lepas tutup AC' },
        { id: '2', type: 'checkbox', label: 'Bersihkan filter udara dengan air dan sabun' },
        { id: '3', type: 'checkbox', label: 'Semprot evaporator dengan cairan pembersih khusus' },
        { id: '4', type: 'checkbox', label: 'Cek dan bersihkan saluran pembuangan air' },
        { id: '5', type: 'checkbox', label: 'Ukur tekanan freon (min. 65-70 PSI)' },
        { id: '6', type: 'checkbox', label: 'Uji coba pendinginan selama 15 menit' },
        { id: '7', type: 'checkbox', label: 'Dokumentasikan hasil servis dan kondisi unit' },
      ]),
    },
    {
      company_id:  C.jaknot,
      category_id: CAT.listrik_jn,
      name:        'Inspeksi Panel Listrik Bulanan',
      description: 'Pemeriksaan rutin panel listrik MDP dan SDP setiap bulan.',
      checklist: JSON.stringify([
        { id: '1', type: 'checkbox', label: 'Periksa kondisi fisik busbar dan kabel' },
        { id: '2', type: 'checkbox', label: 'Cek torque semua baut terminal' },
        { id: '3', type: 'checkbox', label: 'Uji fungsi MCB (trip test)' },
        { id: '4', type: 'checkbox', label: 'Ukur suhu busbar dengan thermal camera' },
        { id: '5', type: 'checkbox', label: 'Cek indikator beban (voltmeter, amperemeter)' },
        { id: '6', type: 'checkbox', label: 'Bersihkan debu di dalam panel' },
        { id: '7', type: 'checkbox', label: 'Catat pembacaan meteran dan laporkan anomali' },
      ]),
    },
    {
      company_id:  C.jaknot,
      category_id: CAT.kendaraan_jn,
      name:        'Servis Kendaraan Operasional',
      description: 'Servis berkala kendaraan operasional setiap 5.000 km atau 3 bulan.',
      checklist: JSON.stringify([
        { id: '1', type: 'checkbox', label: 'Ganti oli mesin dan filter oli' },
        { id: '2', type: 'checkbox', label: 'Cek dan isi tekanan ban' },
        { id: '3', type: 'checkbox', label: 'Periksa kondisi rem depan dan belakang' },
        { id: '4', type: 'checkbox', label: 'Cek level air radiator dan aki' },
        { id: '5', type: 'checkbox', label: 'Periksa lampu-lampu kendaraan' },
        { id: '6', type: 'checkbox', label: 'Uji wiper dan cairan washer' },
        { id: '7', type: 'checkbox', label: 'Test drive dan dokumentasi kondisi' },
      ]),
    },
    {
      company_id:  C.jaknot,
      category_id: CAT.elektronik_jn,
      name:        'Pemeliharaan Perangkat IT Berkala',
      description: 'Pembersihan dan pengecekan perangkat IT (PC, printer, server) setiap semester.',
      checklist: JSON.stringify([
        { id: '1', type: 'checkbox', label: 'Bersihkan debu di dalam casing PC/server' },
        { id: '2', type: 'checkbox', label: 'Update driver dan firmware perangkat' },
        { id: '3', type: 'checkbox', label: 'Cek kondisi kipas dan heatsink' },
        { id: '4', type: 'checkbox', label: 'Uji kapasitas dan kondisi baterai laptop' },
        { id: '5', type: 'checkbox', label: 'Bersihkan head dan roller printer' },
        { id: '6', type: 'checkbox', label: 'Verifikasi backup data berjalan normal' },
        { id: '7', type: 'checkbox', label: 'Catat kondisi dan umur perangkat' },
      ]),
    },
    {
      company_id:  C.jaknot,
      category_id: CAT.furni_ast_jn,
      name:        'Inspeksi Furniture Kantor',
      description: 'Pemeriksaan kondisi furniture kantor (meja, kursi, lemari) setiap 6 bulan.',
      checklist: JSON.stringify([
        { id: '1', type: 'checkbox', label: 'Cek stabilitas dan kekuatan struktur meja' },
        { id: '2', type: 'checkbox', label: 'Periksa roda dan mekanisme kursi putar' },
        { id: '3', type: 'checkbox', label: 'Cek kondisi engsel dan kunci lemari' },
        { id: '4', type: 'checkbox', label: 'Perbarui cat atau finishing yang terkelupas' },
        { id: '5', type: 'checkbox', label: 'Kencangkan sekrup dan baut yang kendur' },
        { id: '6', type: 'checkbox', label: 'Dokumentasikan furniture yang perlu penggantian' },
      ]),
    },
  ];

  const { data, error } = await supabase.from('maintenance_templates').insert(templates).select('id');
  if (error) throw new Error(`Maintenance templates: ${error.message}`);
  return data?.map((r: { id: string }) => r.id) ?? [];
}

// ─── Seed Maintenance Schedules ───────────────────────────────────────────────

async function seedMaintenanceSchedules(supabase: SupabaseClient, templateIds: string[], activeItemIds: string[]): Promise<string[]> {
  const schedules = templateIds.flatMap((templateId, tIdx) => {
    // Assign 2-3 schedules per template using different active items
    const count = tIdx < 2 ? 3 : 2;
    return Array.from({ length: count }, (_, i) => {
      const itemId  = activeItemIds[(tIdx * 3 + i) % activeItemIds.length];
      const interval = [7, 14, 30, 90, 180][tIdx % 5];
      const lastDone = daysAgo(interval + (i + 1) * 3);
      const nextDue  = new Date(new Date(lastDone).getTime() + interval * 86_400_000).toISOString();
      const isPaused = tIdx === 3 && i === 0; // one paused schedule for variety

      return {
        company_id:         C.jaknot,
        item_id:            itemId,
        template_id:        templateId,
        assigned_to:        pick(JN_GA_STAFF, tIdx + i),
        interval_days:      interval,
        interval_type:      i % 2 === 0 ? 'fixed' : 'floating',
        last_completed_at:  lastDone,
        next_due_at:        nextDue,
        is_paused:          isPaused,
        is_active:          !isPaused,
        paused_reason:      isPaused ? 'Aset sedang dalam perbaikan, jadwal PM ditangguhkan sementara.' : null,
        paused_at:          isPaused ? daysAgo(5) : null,
      };
    });
  });

  const { data, error } = await supabase.from('maintenance_schedules').insert(schedules).select('id');
  if (error) throw new Error(`Maintenance schedules: ${error.message}`);
  return data?.map((r: { id: string }) => r.id) ?? [];
}

// ─── Seed Job Comments ────────────────────────────────────────────────────────

async function seedJobComments(supabase: SupabaseClient, jobIds: string[]): Promise<void> {
  const COMMENTS = [
    'Sudah dilakukan pengecekan awal. Akan segera disiapkan material yang diperlukan.',
    'Material sudah tiba. Pengerjaan dijadwalkan besok pagi mulai pukul 08.00.',
    'Pengerjaan 50% selesai. Estimasi selesai besok sore.',
    'Ditemukan kerusakan tambahan: kabel grounding juga perlu diganti. Mohon persetujuan untuk penambahan item.',
    'Pengerjaan selesai. Mohon dicek dan dikonfirmasi jika sudah memuaskan.',
    'Ada kendala teknis: part yang dibutuhkan belum tersedia. Perlu waktu 2-3 hari tambahan.',
    'Sudah koordinasi dengan vendor. Tim akan datang Selasa depan pukul 09.00.',
    'Pekerjaan dibatalkan karena situasi darurat lain yang lebih prioritas.',
    'Perlu akses ke ruangan yang terkunci. Mohon koordinasi dengan admin.',
    'Update: sudah dikerjakan sebagian, sisa bagian atap selesai besok.',
  ];

  const rows: Record<string, unknown>[] = [];

  // Add 3 comments to the first 10 jobs
  for (let j = 0; j < Math.min(10, jobIds.length); j++) {
    for (let c = 0; c < 3; c++) {
      rows.push({
        job_id:     jobIds[j],
        user_id:    pick([U.agus, ...JN_GA_STAFF], j + c),
        company_id: C.jaknot,
        content:    pick(COMMENTS, j * 3 + c),
        created_at: daysAgo(10 - j - c),
      });
    }
  }

  for (let i = 0; i < rows.length; i += 20) {
    const { error } = await supabase.from('job_comments').insert(rows.slice(i, i + 20));
    if (error) throw new Error(`Job comments batch ${i}: ${error.message}`);
  }
}

// ─── Seed Jakmall Inventory ───────────────────────────────────────────────────

async function seedJakmallInventory(supabase: SupabaseClient): Promise<void> {
  const rows = Array.from({ length: 10 }, (_, i) => {
    const tmpl = ASSET_TEMPLATES[(i + 5) % ASSET_TEMPLATES.length];
    return {
      company_id:     C.jakmall,
      location_id:    LOC.kedoya_jm,
      category_id:    i < 4 ? CAT.elektronik_jm : i < 7 ? CAT.furni_ast_jm : CAT.kendaraan_jm,
      display_id:     astId('JM', i + 1),
      name:           `${tmpl.name} #${i + 1}`,
      description:    `${tmpl.name} milik Jakmall. Serial: SN-JM-${String(i + 1).padStart(4, '0')}.`,
      status:         pick(['active', 'active', 'active', 'under_repair', 'broken'] as const, i),
      condition:      pick(['excellent', 'good', 'fair', 'poor'] as const, i),
      brand:          tmpl.brand,
      model:          tmpl.model,
      serial_number:  `SN-JM-${String(i + 1).padStart(4, '0')}`,
      purchase_date:  new Date(Date.now() - (i * 60 + 200) * 86_400_000).toISOString().slice(0, 10),
      purchase_price:   pick(COSTS, i) * 2,
      acquisition_date: new Date(Date.now() - (i * 60 + 200) * 86_400_000).toISOString().slice(0, 10),
      created_at:       daysAgo((i + 1) * 5),
    };
  });

  const { error } = await supabase.from('inventory_items').insert(rows);
  if (error) throw new Error(`Jakmall inventory: ${error.message}`);
}

// ─── Update id_counters ───────────────────────────────────────────────────────

async function updateIdCounters(supabase: SupabaseClient): Promise<void> {
  const counters = [
    // Jaknot
    { company_id: C.jaknot, entity_type: 'request_26', prefix: 'R', current_value: 110, reset_period: 'yearly' },
    { company_id: C.jaknot, entity_type: 'job_26',     prefix: 'J', current_value: 60,  reset_period: 'yearly' },
    { company_id: C.jaknot, entity_type: 'asset_26',   prefix: 'I', current_value: 40,  reset_period: 'yearly' },
    // Jakmall
    { company_id: C.jakmall, entity_type: 'request_26', prefix: 'R', current_value: 22, reset_period: 'yearly' },
    { company_id: C.jakmall, entity_type: 'job_26',     prefix: 'J', current_value: 12, reset_period: 'yearly' },
    { company_id: C.jakmall, entity_type: 'asset_26',   prefix: 'I', current_value: 10, reset_period: 'yearly' },
  ];

  const { error } = await supabase.from('id_counters').insert(counters);
  if (error) throw new Error(`id_counters: ${error.message}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createAdminClient();
  console.log('\nSeeding operational mock data (Indonesian)...\n');

  console.log('📋 Jaknot requests (110)...');
  const jnRequestIds = await seedJaknotRequests(supabase);
  console.log(`   ✓ ${jnRequestIds.length} requests created`);

  console.log('📋 Jakmall requests (22)...');
  await seedJakmallRequests(supabase);
  console.log('   ✓ done');

  console.log('🔧 Jaknot jobs (60)...');
  const jnJobIds = await seedJaknotJobs(supabase, jnRequestIds);
  console.log(`   ✓ ${jnJobIds.length} jobs created`);

  console.log('🔧 Jakmall jobs (12)...');
  await seedJakmallJobs(supabase);
  console.log('   ✓ done');

  console.log('📦 Jaknot inventory items (40)...');
  const { itemIds, activeItemIds } = await seedJaknotInventory(supabase);
  console.log(`   ✓ ${itemIds.length} items created (${activeItemIds.length} active)`);

  console.log('🚚 Jaknot inventory movements (40)...');
  await seedInventoryMovements(supabase, activeItemIds);
  console.log('   ✓ done');

  console.log('📦 Jakmall inventory items (10)...');
  await seedJakmallInventory(supabase);
  console.log('   ✓ done');

  console.log('🗓️  Maintenance templates (5)...');
  const templateIds = await seedMaintenanceTemplates(supabase);
  console.log(`   ✓ ${templateIds.length} templates created`);

  console.log('📅 Maintenance schedules (12)...');
  const scheduleIds = await seedMaintenanceSchedules(supabase, templateIds, activeItemIds);
  console.log(`   ✓ ${scheduleIds.length} schedules created`);

  console.log('💬 Job comments (30)...');
  await seedJobComments(supabase, jnJobIds);
  console.log('   ✓ done');

  console.log('🔢 Updating id_counters...');
  await updateIdCounters(supabase);
  console.log('   ✓ done');

  console.log('\n✅ Seed complete!\n');
  console.log('Summary:');
  console.log('  Jaknot  : 110 requests | 60 jobs | 40 assets | 40 movements | 5 templates | 12 schedules');
  console.log('  Jakmall :  22 requests | 12 jobs | 10 assets');
  console.log('');
  console.log('All users login with password: asdf1234');
  console.log('  agus@jaknot.com (ga_lead) | eva@jaknot.com | dwiky@jaknot.com (ga_staff)');
  console.log('  ria, hadi, makmur, amil, maldini @jaknot.com (general_user)');
  console.log('  rudy@jaknot.com (finance_approver)');
  console.log('  samuel@jakmall.com (admin) | okka@jakmall.com (ga_staff)\n');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
