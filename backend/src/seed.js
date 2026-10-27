// Resets the database and fills it with the demo data shown in the Figma screens.
// Every seeded account uses the password below.
import { db, migrateOrders } from './db.js';
import { hashPassword } from './password.js';

export const DEFAULT_DEMO_PASSWORD = 'titibin123';

// Fills the database with the demo data from the Figma screens. With reset=true all existing
// rows are deleted first (used by `npm run seed`); the server only calls it on an empty database.
export function seedDemo({ password = DEFAULT_DEMO_PASSWORD, reset = false } = {}) {
  if (reset) {
    for (const table of ['app_feedback', 'reviews', 'messages', 'orders', 'trips', 'sessions', 'users']) {
      db.exec(`DELETE FROM ${table}`);
    }
    db.exec('DELETE FROM sqlite_sequence');
  }

  const hash = hashPassword(password);
  const insertUser = db.prepare(
    `INSERT INTO users (name, nim, email, campus, password_hash, about, role, rating_sum, rating_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const user = (name, nim, email, campus, role, rating = 0, count = 0, about = '') =>
    Number(insertUser.run(name, nim, email, campus, hash, about, role, rating * count, count).lastInsertRowid);

  const alvin = user('Alvin Pratama', '2702511234', 'alvin@binus.ac.id', 'Anggrek', 'buyer', 0, 0, 'Pecinta jajanan lokal');
  const budi = user('Budi Santoso', '2702528798', 'budi@binus.ac.id', 'Bekasi', 'jastiper', 4.8, 12, 'Suka makan');
  const david = user('David S.', '2602034411', 'david@binus.ac.id', 'Bekasi', 'jastiper', 4.9, 34);
  const clarissa = user('Clarissa W.', '2602077120', 'clarissa@binus.ac.id', 'Syahdan', 'jastiper', 5.0, 52);
  const kevinS = user('Kevin Sanjaya', '2502088765', 'kevin@binus.ac.id', 'Alam Sutera', 'jastiper', 4.9, 124);
  const rafi = user('Rafi Pratama', '2602099001', 'rafi@binus.ac.id', 'Anggrek', 'jastiper', 4.8, 41);
  const fathir = user('Fathir', '2602010892', 'fathir@binus.ac.id', 'Anggrek', 'buyer');
  const kevinW = user('Kevin Wijaya', '250191011', 'kevinw@binus.ac.id', 'Alam Sutera', 'buyer');

  const insertTrip = db.prepare(
    `INSERT INTO trips (jastiper_id, origin, destination, country, stores, depart_date, return_date,
      capacity_kg, categories, max_budget, drop_point, max_slots, kind, event_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const trip = (jastiper, origin, destination, country, stores, depart, ret, kg, cats, dropPoint, slots = null, eventName = '') =>
    Number(
      insertTrip.run(jastiper, origin, destination, country, stores, depart, ret, kg, JSON.stringify(cats), 2000000, dropPoint, slots, eventName ? 'event' : 'trip', eventName)
        .lastInsertRowid,
    );

  const tripKL = trip(david, 'Bekasi & Anggrek', 'Bandung', 'Bandung', 'Cihampelas Walk, Pasar Baru, Dago',
    '2026-10-15', '2026-10-20', 10, ['snack', 'fashion'], 'Food Court Lt. 2 Kampus Anggrek');
  const tripTokyo = trip(clarissa, 'Syahdan', 'Pasar Baru Bandung', 'Bandung', 'Kartika Sari, Batagor Kingsley, Rumah Mode',
    '2026-10-17', '2026-10-25', 14, ['snack', 'fashion'], 'Lobi Utama Kampus Syahdan', 6);
  const tripNarita = trip(budi, 'Bekasi', 'Pekan Raya Jakarta (JIEXPO Kemayoran)', 'Jakarta', 'Booth snack, skincare, dan fashion PRJ',
    '2026-10-14', '2026-10-20', 15, ['snack', 'skincare', 'fashion'], 'Kampus Bekasi', null, 'Pekan Raya Jakarta');
  trip(budi, 'Bekasi', 'Malang Kota', 'Malang', 'Apel Malang, Keripik Tempe Sanan',
    '2026-10-17', '2026-10-24', 15, ['snack'], 'Kampus Bekasi');
  const tripKevin = trip(kevinS, 'Alam Sutera', 'ICE BSD', 'Tangerang', 'Booth Pop Mart & merch anime',
    '2026-10-05', '2026-10-16', 8, ['anime', 'snack'], 'Food Court Kampus Anggrek', null, 'Indonesia Comic Con');
  const tripSg = trip(rafi, 'Anggrek', 'Semarang Kota Lama', 'Semarang', 'Lunpia Gang Lombok, Toko Oen, Bandeng Juwana',
    '2026-10-06', '2026-10-18', 6, ['snack'], 'Kampus Anggrek');

  const insertOrder = db.prepare(
    `INSERT INTO orders (code, buyer_id, trip_id, product_name, quantity, purchase_location, store, weight_kg,
      item_price, jastip_fee, app_fee, handover_point, payment_method, status, reject_reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const order = (code, buyer, tripId, name, qty, location, store, kg, price, handover, status, createdAt, reason = null) =>
    Number(
      insertOrder.run(code, buyer, tripId, name, qty, location, store, kg, price, Math.round(price * 0.2), Math.round(price * 0.1),
        handover, ['pending', 'accepted', 'rejected', 'cancelled'].includes(status) ? null : 'qris', status, reason, createdAt, createdAt)
        .lastInsertRowid,
    );

  // Alvin's orders (Pesanan Saya)
  order('TB-8841-BIN', alvin, tripTokyo, 'Kaos Rumah Mode (M, Hitam)', 2, 'Bandung', 'Rumah Mode', 0.8, 600000,
    'Kampus Syahdan', 'pending', '2026-10-08 14:20:00');
  order('TB-8836-BIN', alvin, tripSg, 'Lunpia Semarang (2 box)', 2, 'Semarang', 'Kota Lama', 0.6, 165000,
    'Kampus Anggrek', 'paid', '2026-10-07 19:05:00');
  const blindbox = order('TB-8829-BIN', alvin, tripKevin, 'Blindbox Pop Mart The Monsters', 1, 'Tangerang',
    'Booth Pop Mart ICE BSD', 0.4, 350000, 'Kampus Anggrek - BINUS Food Court Lt. 1', 'on_the_way', '2026-10-06 10:42:00');
  order('TB-8815-BIN', alvin, tripKL, "Brownies Kartika Sari (3 box)", 3, 'Bandung', 'Cihampelas Walk', 1.2, 254000,
    'Kampus Anggrek', 'rejected', '2026-10-04 08:15:00',
    'Barang melebihi sisa bagasi jastiper. Kamu bisa ajukan ulang ke jastiper lain.');
  order('TB-8810-BIN', alvin, tripKevin, 'Batagor Kingsley (2 box)', 2, 'Tangerang', 'Batagor Kingsley', 0.6, 180000,
    'Kampus Anggrek', 'completed', '2026-10-03 09:00:00');

  // Requests on Budi's Narita trip (Request Titipan Masuk)
  order('TB-8842-BIN', fathir, tripNarita, 'Snack & skincare booth PRJ', 1, 'Jakarta', 'Booth PRJ Hall A', 0.8,
    350000, 'Kampus Anggrek', 'pending', '2026-10-14 09:10:00');
  order('TB-8843-BIN', kevinW, tripNarita, 'Gundam RG Rx-78-2', 1, 'Jakarta', 'Booth hobi PRJ', 1.4,
    720000, 'Kampus Alam Sutera', 'pending', '2026-10-14 11:30:00');
  order('TB-8837-BIN', fathir, tripNarita, 'Cokelat Monggo (4 box)', 4, 'Jakarta', 'Booth PRJ Hall B', 2.5,
    1100000, 'Kampus Anggrek', 'paid', '2026-10-10 16:00:00');
  order('TB-8838-BIN', kevinW, tripNarita, 'Wardah Sunscreen (5 pcs)', 5, 'Jakarta', 'Booth Wardah PRJ', 1.5,
    1400000, 'Kampus Alam Sutera', 'bought', '2026-10-11 10:00:00');
  order('TB-8839-BIN', fathir, tripNarita, 'Bolu Meranti (6 box)', 6, 'Jakarta', 'Booth PRJ Hall B', 3.0,
    2750000, 'Kampus Anggrek', 'accepted', '2026-10-12 13:00:00');

  const insertMsg = db.prepare('INSERT INTO messages (order_id, sender_id, text, created_at) VALUES (?, ?, ?, ?)');
  [
    [kevinS, 'Halo Alvin! Barangnya sudah aman di tanganku, tadi sudah selesai belanja di booth ICE BSD.', '2026-10-15 13:02:00'],
    [kevinS, 'Sekarang aku otw ke Kampus Anggrek, estimasi sekitar 15 menit lagi.', '2026-10-15 13:02:30'],
    [alvin, 'Siap kak, makasih infonya! Boleh minta foto barangnya dulu?', '2026-10-15 13:04:00'],
    [kevinS, 'Segel masih utuh ya.', '2026-10-15 13:05:00'],
    [alvin, 'Aman, segelnya masih rapi. Aku tunggu di Food Court ya.', '2026-10-15 13:06:00'],
    [kevinS, 'Oke, meeting point di Meja 14. Siapin QR serah terimanya ya.', '2026-10-15 13:07:00'],
  ].forEach(([sender, text, at]) => insertMsg.run(blindbox, sender, text, at));

  migrateOrders();
  return password;
}

if (process.argv[1]?.endsWith('seed.js')) {
  const password = seedDemo({ password: process.env.DEMO_PASSWORD, reset: true });
  console.log(`Seeded TitiBin demo data. All accounts use password '${password}'.`);
  console.log('  Buyer:    alvin@binus.ac.id');
  console.log('  Jastiper: budi@binus.ac.id');
}
