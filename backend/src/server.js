import express from 'express';
import cors from 'cors';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { networkInterfaces } from 'node:os';
import { db, UPLOAD_DIR } from './db.js';
import { hashPassword, verifyPassword } from './password.js';

const JASTIP_FEE_RATE = 0.2;
const APP_FEE_RATE = 0.1;
const PORT = Number(process.env.PORT || 4000);

// Order lifecycle. Buyer requests -> jastiper accepts -> buyer pays into escrow ->
// jastiper buys, flies home, walks to the meeting point -> buyer confirms receipt.
const JASTIPER_ADVANCE = { paid: 'bought', bought: 'arrived', arrived: 'on_the_way' };
const ACTIVE_STATUSES = ['accepted', 'paid', 'bought', 'arrived', 'on_the_way', 'completed'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const route = (fn) => (req, res, next) => {
  try {
    const result = fn(req, res);
    if (result !== undefined) res.json(result);
  } catch (err) {
    next(err);
  }
};

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    nim: u.nim,
    email: u.email,
    campus: u.campus,
    about: u.about,
    role: u.role,
    rating: u.rating_count ? Math.round((u.rating_sum / u.rating_count) * 10) / 10 : null,
    ratingCount: u.rating_count,
  };
}

function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function saveUpload(dataUrl) {
  if (!dataUrl) return null;
  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new HttpError(400, 'Foto harus berupa JPG, PNG, atau WEBP');
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw new HttpError(400, 'Ukuran foto maksimal 5MB');
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${match[2] === 'jpeg' ? 'jpg' : match[2]}`;
  writeFileSync(join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

function usedKg(tripId) {
  const placeholders = ACTIVE_STATUSES.map(() => '?').join(',');
  return db
    .prepare(`SELECT COALESCE(SUM(weight_kg), 0) AS kg, COUNT(*) AS n FROM orders WHERE trip_id = ? AND status IN (${placeholders})`)
    .get(tripId, ...ACTIVE_STATUSES);
}

function serializeTrip(t) {
  const used = usedKg(t.id);
  const earnings = db
    .prepare(`SELECT COALESCE(SUM(jastip_fee), 0) AS fee FROM orders WHERE trip_id = ? AND status NOT IN ('rejected','cancelled')`)
    .get(t.id);
  const pending = db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE trip_id = ? AND status = 'pending'`).get(t.id);
  return {
    id: t.id,
    origin: t.origin,
    destination: t.destination,
    country: t.country,
    stores: t.stores,
    departDate: t.depart_date,
    returnDate: t.return_date,
    capacityKg: t.capacity_kg,
    usedKg: Math.round(used.kg * 10) / 10,
    remainingKg: Math.max(0, Math.round((t.capacity_kg - used.kg) * 10) / 10),
    slotsLeft: t.max_slots ? Math.max(0, t.max_slots - used.n) : null,
    categories: JSON.parse(t.categories),
    maxBudget: t.max_budget,
    dropPoint: t.drop_point,
    catalogPhoto: t.catalog_photo,
    potentialFee: earnings.fee,
    pendingRequests: pending.n,
    jastiper: publicUser(getUser(t.jastiper_id)),
  };
}

function serializeOrder(o) {
  const trip = o.trip_id ? db.prepare('SELECT * FROM trips WHERE id = ?').get(o.trip_id) : null;
  const review = db.prepare('SELECT rating FROM reviews WHERE order_id = ?').get(o.id);
  return {
    id: o.id,
    code: o.code,
    productName: o.product_name,
    quantity: o.quantity,
    purchaseLocation: o.purchase_location,
    store: o.store,
    weightKg: o.weight_kg,
    itemPrice: o.item_price,
    jastipFee: o.jastip_fee,
    appFee: o.app_fee,
    total: o.item_price + o.jastip_fee + o.app_fee,
    handoverPoint: o.handover_point,
    photo: o.photo,
    paymentMethod: o.payment_method,
    status: o.status,
    rejectReason: o.reject_reason,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    reviewed: Boolean(review),
    trip: trip
      ? { id: trip.id, origin: trip.origin, destination: trip.destination, country: trip.country, dropPoint: trip.drop_point }
      : null,
    buyer: publicUser(getUser(o.buyer_id)),
    jastiper: trip ? publicUser(getUser(trip.jastiper_id)) : null,
  };
}

function loadOrderFor(req) {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!o) throw new HttpError(404, 'Pesanan tidak ditemukan');
  const trip = o.trip_id ? db.prepare('SELECT * FROM trips WHERE id = ?').get(o.trip_id) : null;
  const isBuyer = o.buyer_id === req.user.id;
  const isJastiper = trip?.jastiper_id === req.user.id;
  if (!isBuyer && !isJastiper) throw new HttpError(403, 'Kamu tidak punya akses ke pesanan ini');
  return { o, trip, isBuyer, isJastiper };
}

function setStatus(id, status, extra = {}) {
  const sets = ['status = ?', "updated_at = datetime('now')"];
  const values = [status];
  for (const [col, val] of Object.entries(extra)) {
    sets.push(`${col} = ?`);
    values.push(val);
  }
  db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...values, id);
}

function nextOrderCode() {
  const row = db
    .prepare("SELECT COALESCE(MAX(CAST(substr(code, 4, length(code) - 7) AS INTEGER)), 8800) AS n FROM orders")
    .get();
  return `TB-${row.n + 1}-BIN`;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (_req, res) => res.json({ ok: true }));

// ---------- Auth ----------

function createSession(userId) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

app.post(
  '/auth/register',
  route((req) => {
    const { name, nim, email, campus, password } = req.body ?? {};
    if (!name?.trim() || !nim?.trim() || !email?.trim() || !campus?.trim() || !password) {
      throw new HttpError(400, 'Semua data wajib diisi');
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith('@binus.ac.id')) throw new HttpError(400, 'Gunakan email @binus.ac.id');
    if (password.length < 8) throw new HttpError(400, 'Kata sandi minimal 8 karakter');
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalized)) {
      throw new HttpError(409, 'Email sudah terdaftar');
    }
    const info = db
      .prepare('INSERT INTO users (name, nim, email, campus, password_hash) VALUES (?, ?, ?, ?, ?)')
      .run(name.trim(), nim.trim(), normalized, campus.trim(), hashPassword(password));
    const id = Number(info.lastInsertRowid);
    return { token: createSession(id), user: publicUser(getUser(id)) };
  }),
);

app.post(
  '/auth/login',
  route((req) => {
    const { email, password } = req.body ?? {};
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim().toLowerCase());
    if (!user || !password || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, 'Email atau kata sandi salah');
    }
    return { token: createSession(user.id), user: publicUser(user) };
  }),
);

// Everything below requires a session token.
app.use((req, _res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const session = token && db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!session) return next(new HttpError(401, 'Sesi berakhir, silakan masuk lagi'));
  req.user = getUser(session.user_id);
  req.token = token;
  next();
});

app.post(
  '/auth/logout',
  route((req) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    return { ok: true };
  }),
);

app.get(
  '/me',
  route((req) => {
    const u = req.user;
    const trips = db.prepare('SELECT COUNT(*) AS n FROM trips WHERE jastiper_id = ?').get(u.id).n;
    const requests = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE buyer_id = ?').get(u.id).n;
    return { ...publicUser(u), stats: { trips, requests } };
  }),
);

app.patch(
  '/me',
  route((req) => {
    const allowed = { name: 'name', nim: 'nim', campus: 'campus', about: 'about', role: 'role' };
    const body = req.body ?? {};
    if (body.role && !['buyer', 'jastiper'].includes(body.role)) throw new HttpError(400, 'Peran tidak valid');
    for (const [key, col] of Object.entries(allowed)) {
      if (typeof body[key] === 'string') {
        db.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).run(body[key].trim(), req.user.id);
      }
    }
    return publicUser(getUser(req.user.id));
  }),
);

// ---------- Trips ----------

app.get(
  '/trips',
  route((req) => {
    const q = `%${String(req.query.q ?? '').trim()}%`;
    const country = String(req.query.country ?? '').trim();
    const rows = db
      .prepare(
        `SELECT * FROM trips
         WHERE return_date >= date('now')
           AND jastiper_id != ?
           AND (destination LIKE ? OR country LIKE ? OR stores LIKE ? OR origin LIKE ?)
           AND (? = '' OR country = ?)
         ORDER BY depart_date ASC`,
      )
      .all(req.user.id, q, q, q, q, country, country);
    return rows.map(serializeTrip);
  }),
);

app.get(
  '/trips/mine',
  route((req) => {
    const rows = db.prepare('SELECT * FROM trips WHERE jastiper_id = ? ORDER BY depart_date DESC').all(req.user.id);
    return rows.map(serializeTrip);
  }),
);

app.get(
  '/trips/:id',
  route((req) => {
    const t = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(req.params.id));
    if (!t) throw new HttpError(404, 'Trip tidak ditemukan');
    const trip = serializeTrip(t);
    if (t.jastiper_id === req.user.id) {
      trip.orders = db
        .prepare('SELECT * FROM orders WHERE trip_id = ? ORDER BY created_at DESC')
        .all(t.id)
        .map(serializeOrder);
    }
    return trip;
  }),
);

app.post(
  '/trips',
  route((req) => {
    const b = req.body ?? {};
    const required = ['origin', 'destination', 'departDate', 'returnDate'];
    for (const key of required) if (!String(b[key] ?? '').trim()) throw new HttpError(400, 'Lengkapi detail trip');
    const capacity = Number(b.capacityKg);
    if (!(capacity > 0)) throw new HttpError(400, 'Kapasitas harus lebih dari 0 kg');
    if (!Array.isArray(b.categories) || b.categories.length === 0) throw new HttpError(400, 'Pilih minimal 1 kategori');
    if (b.returnDate < b.departDate) throw new HttpError(400, 'Tanggal kembali harus setelah berangkat');
    const [city, country = city] = String(b.destination).split(',').map((s) => s.trim());
    const info = db
      .prepare(
        `INSERT INTO trips (jastiper_id, origin, destination, country, stores, depart_date, return_date,
          capacity_kg, categories, max_budget, drop_point, catalog_photo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.user.id,
        b.origin.trim(),
        city,
        country,
        String(b.stores ?? '').trim(),
        b.departDate,
        b.returnDate,
        capacity,
        JSON.stringify(b.categories),
        b.maxBudget ? Number(b.maxBudget) : null,
        String(b.dropPoint ?? `Kampus ${b.origin}`).trim(),
        saveUpload(b.catalogPhoto),
      );
    return serializeTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(info.lastInsertRowid)));
  }),
);

// ---------- Orders ----------

app.get(
  '/orders',
  route((req) => {
    // Buyer view: my requests. Jastiper view: requests on my trips.
    const rows =
      req.query.as === 'jastiper'
        ? db
            .prepare(
              `SELECT o.* FROM orders o JOIN trips t ON t.id = o.trip_id
               WHERE t.jastiper_id = ? ORDER BY o.created_at DESC`,
            )
            .all(req.user.id)
        : db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
    return rows.map(serializeOrder);
  }),
);

app.get('/orders/:id', route((req) => serializeOrder(loadOrderFor(req).o)));

app.post(
  '/orders',
  route((req) => {
    const b = req.body ?? {};
    if (!String(b.productName ?? '').trim() || !String(b.purchaseLocation ?? '').trim()) {
      throw new HttpError(400, 'Nama produk dan lokasi pembelian wajib diisi');
    }
    const quantity = Math.max(1, Math.floor(Number(b.quantity) || 1));
    const weight = Number(b.weightKg);
    const price = Math.round(Number(b.itemPrice));
    if (!(weight > 0)) throw new HttpError(400, 'Estimasi berat wajib diisi');
    if (!(price > 0)) throw new HttpError(400, 'Estimasi harga barang wajib diisi');
    if (!String(b.handoverPoint ?? '').trim()) throw new HttpError(400, 'Pilih titik serah terima');

    let tripId = null;
    if (b.tripId) {
      const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(b.tripId));
      if (!trip) throw new HttpError(404, 'Trip tidak ditemukan');
      if (trip.jastiper_id === req.user.id) throw new HttpError(400, 'Tidak bisa titip di trip sendiri');
      tripId = trip.id;
    }

    const info = db
      .prepare(
        `INSERT INTO orders (code, buyer_id, trip_id, product_name, quantity, purchase_location, store,
          weight_kg, item_price, jastip_fee, app_fee, handover_point, photo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        nextOrderCode(),
        req.user.id,
        tripId,
        b.productName.trim().slice(0, 80),
        quantity,
        b.purchaseLocation.trim(),
        String(b.store ?? '').trim(),
        weight,
        price,
        Math.round(price * JASTIP_FEE_RATE),
        Math.round(price * APP_FEE_RATE),
        b.handoverPoint.trim(),
        saveUpload(b.photo),
      );
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(info.lastInsertRowid)));
  }),
);

app.post(
  '/orders/:id/accept',
  route((req) => {
    const { o, trip, isJastiper } = loadOrderFor(req);
    if (!isJastiper) throw new HttpError(403, 'Hanya jastiper yang bisa menerima titipan');
    if (o.status !== 'pending') throw new HttpError(409, 'Request ini sudah diproses');
    const remaining = trip.capacity_kg - usedKg(trip.id).kg;
    if (o.weight_kg > remaining) {
      throw new HttpError(409, `Sisa bagasi hanya ${Math.max(0, remaining).toFixed(1)} kg`);
    }
    setStatus(o.id, 'accepted');
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/reject',
  route((req) => {
    const { o, isJastiper } = loadOrderFor(req);
    if (!isJastiper) throw new HttpError(403, 'Hanya jastiper yang bisa menolak titipan');
    if (o.status !== 'pending') throw new HttpError(409, 'Request ini sudah diproses');
    setStatus(o.id, 'rejected', { reject_reason: String(req.body?.reason || 'Jastiper tidak dapat memenuhi request ini.') });
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/cancel',
  route((req) => {
    const { o, isBuyer } = loadOrderFor(req);
    if (!isBuyer) throw new HttpError(403, 'Hanya pembeli yang bisa membatalkan');
    if (!['pending', 'accepted'].includes(o.status)) throw new HttpError(409, 'Pesanan yang sudah dibayar tidak bisa dibatalkan');
    setStatus(o.id, 'cancelled');
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/pay',
  route((req) => {
    const { o, isBuyer } = loadOrderFor(req);
    if (!isBuyer) throw new HttpError(403, 'Hanya pembeli yang bisa membayar');
    if (o.status !== 'accepted') throw new HttpError(409, 'Pesanan belum diterima jastiper');
    const method = String(req.body?.method ?? '');
    if (!['qris', 'va', 'binuspay'].includes(method)) throw new HttpError(400, 'Pilih metode pembayaran');
    // Payment is simulated: funds are marked as held in campus escrow.
    setStatus(o.id, 'paid', { payment_method: method });
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/advance',
  route((req) => {
    const { o, isJastiper } = loadOrderFor(req);
    if (!isJastiper) throw new HttpError(403, 'Hanya jastiper yang bisa memperbarui status');
    const next = JASTIPER_ADVANCE[o.status];
    if (!next) throw new HttpError(409, 'Status pesanan tidak bisa dimajukan');
    setStatus(o.id, next);
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/confirm',
  route((req) => {
    const { o, isBuyer } = loadOrderFor(req);
    if (!isBuyer) throw new HttpError(403, 'Hanya pembeli yang bisa konfirmasi penerimaan');
    if (!['arrived', 'on_the_way'].includes(o.status)) throw new HttpError(409, 'Barang belum siap diserahkan');
    setStatus(o.id, 'completed');
    return serializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  }),
);

app.post(
  '/orders/:id/review',
  route((req) => {
    const { o, trip, isBuyer } = loadOrderFor(req);
    if (!isBuyer) throw new HttpError(403, 'Hanya pembeli yang bisa memberi ulasan');
    if (o.status !== 'completed') throw new HttpError(409, 'Selesaikan pesanan dulu sebelum memberi ulasan');
    if (db.prepare('SELECT 1 FROM reviews WHERE order_id = ?').get(o.id)) throw new HttpError(409, 'Ulasan sudah dikirim');
    const rating = Math.round(Number(req.body?.rating));
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Rating 1 sampai 5');
    db.prepare(
      'INSERT INTO reviews (order_id, reviewer_id, jastiper_id, rating, tags, text, tip) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(
      o.id,
      req.user.id,
      trip.jastiper_id,
      rating,
      JSON.stringify(req.body?.tags ?? []),
      String(req.body?.text ?? '').slice(0, 200),
      Math.max(0, Math.round(Number(req.body?.tip) || 0)),
    );
    db.prepare('UPDATE users SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?').run(
      rating,
      trip.jastiper_id,
    );
    return { ok: true };
  }),
);

// ---------- Chat ----------

app.get(
  '/orders/:id/messages',
  route((req) => {
    loadOrderFor(req);
    return db
      .prepare('SELECT id, sender_id AS senderId, text, photo, created_at AS createdAt FROM messages WHERE order_id = ? ORDER BY id')
      .all(Number(req.params.id));
  }),
);

app.post(
  '/orders/:id/messages',
  route((req) => {
    const { o } = loadOrderFor(req);
    const text = String(req.body?.text ?? '').trim();
    const photo = saveUpload(req.body?.photo);
    if (!text && !photo) throw new HttpError(400, 'Pesan kosong');
    db.prepare('INSERT INTO messages (order_id, sender_id, text, photo) VALUES (?, ?, ?, ?)').run(o.id, req.user.id, text, photo);
    return { ok: true };
  }),
);

// ---------- App feedback ----------

app.post(
  '/feedback',
  route((req) => {
    const rating = Math.round(Number(req.body?.rating));
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Rating 1 sampai 5');
    db.prepare('INSERT INTO app_feedback (user_id, rating, tags, text) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      rating,
      JSON.stringify(req.body?.tags ?? []),
      String(req.body?.text ?? '').slice(0, 300),
    );
    return { ok: true };
  }),
);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Terjadi kesalahan server' : err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
  console.log(`TitiBin API listening on http://localhost:${PORT}`);
  if (lan.length) console.log(`On your phone (same Wi-Fi): ${lan.join(', ')}`);
});
