const http = require('http');
const express = require('express');
const cors = require('cors');

const config = require('./config/env');
const socket = require('./socket');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const orderRoutes = require('./routes/order.routes');
const payRoutes = require('./routes/pay.routes');
const consultationRoutes = require('./routes/consultation.routes');
const homeVisitRoutes = require('./routes/homeVisit.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const medicineRoutes = require('./routes/medicine.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const articleRoutes = require('./routes/article.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '2mb' })); // 2mb: cukup buat foto chat konsultasi

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/doctors', doctorRoutes);
app.use('/orders', orderRoutes);
app.use('/pay', payRoutes); // scan pembayaran (QR)
app.use('/consultations', consultationRoutes);
app.use('/home-visits', homeVisitRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/medicines', medicineRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/articles', articleRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Express + Socket.IO (video call, telepon, chat real-time) jalan di port yang sama
const server = http.createServer(app);
socket.init(server);

server.listen(config.port, () => {
  console.log(`ZenQ backend jalan di http://localhost:${config.port}`);
});
