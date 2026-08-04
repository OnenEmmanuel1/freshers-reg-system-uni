/**
 * UniRegister (hfrsEngine.js)
 * Central Business Logic & Workflow Engine for UNICROSS Freshers Registration System
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');

class HFRSEngine {
  /**
   * 1. Duplicate Registration Check
   * Checks if duplicate registration exists by matching (Name + Date of Birth) or Application Number / Email
   */
  static async checkDuplicateRegistration({ name, date_of_birth, email, application_number, excludeUserId = null }) {
    let sql = `
      SELECT u.id as user_id, u.email, sp.application_number, u.name, sp.date_of_birth
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE (LOWER(u.email) = LOWER(?) OR (LOWER(u.name) = LOWER(?) AND sp.date_of_birth = ?))
    `;
    const params = [email || '', name || '', date_of_birth || '1900-01-01'];

    if (application_number) {
      sql += ` OR (sp.application_number = ?)`;
      params.push(application_number);
    }

    const rows = await db.query(sql, params);
    
    if (excludeUserId) {
      return rows.filter(r => r.user_id !== excludeUserId);
    }
    return rows;
  }

  /**
   * 2. Create Student Account
   */
  static async createStudentAccount({ name, email, password }) {
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }

    // Check duplicate email
    const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUsers.length > 0) {
      throw new Error('DUPLICATE_EMAIL: An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const res = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "student")',
      [name.trim(), email.toLowerCase().trim(), password_hash]
    );
    const userId = res.insertId;

    // Generate initial application number: UNI/2026/1000 + userId
    const appNum = `UNI/2026/${1000 + userId}`;

    // Create empty student profile
    const profileRes = await db.query(
      `INSERT INTO student_profiles 
       (user_id, application_number, date_of_birth, gender, phone, address, faculty, department, state_of_origin, lga, next_of_kin_name, next_of_kin_phone) 
       VALUES (?, ?, '2000-01-01', 'Male', '', '', '', '', '', '', '', '')`,
      [userId, appNum]
    );

    // Create initial draft registration record
    await db.query(
      'INSERT INTO registrations (student_id, status) VALUES (?, "draft")',
      [profileRes.insertId]
    );

    return { userId, applicationNumber: appNum };
  }

  /**
   * 3. Authenticate User (Student or Admin)
   */
  static async authenticateUser({ email, password }) {
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    const users = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      throw new Error('INVALID_CREDENTIALS: Invalid email address or password.');
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS: Invalid email address or password.');
    }

    // Omit password hash
    delete user.password_hash;
    return user;
  }

  /**
   * 4. Save/Update Student Bio-Data Profile
   */
  static async saveStudentProfile(userId, profileData) {
    const {
      date_of_birth, gender, phone, address,
      faculty, department, state_of_origin, lga,
      next_of_kin_name, next_of_kin_phone
    } = profileData;

    // Server-side validation
    if (!date_of_birth || !gender || !phone || !address || !faculty || !department || !state_of_origin || !lga || !next_of_kin_name || !next_of_kin_phone) {
      throw new Error('VALIDATION_ERROR: All bio-data and academic profile fields are required.');
    }

    // Check duplicate student registration (Name + DOB)
    const userRows = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRows[0] ? userRows[0].name : '';

    const duplicates = await this.checkDuplicateRegistration({
      name: userName,
      date_of_birth,
      excludeUserId: userId
    });

    const activeDuplicates = duplicates.filter(d => d.application_number && d.date_of_birth);
    if (activeDuplicates.length > 0) {
      throw new Error('DUPLICATE_REGISTRATION: A student record with matching name and date of birth already exists in the system.');
    }

    // Update profile
    await db.query(
      `UPDATE student_profiles SET
        date_of_birth = ?,
        gender = ?,
        phone = ?,
        address = ?,
        faculty = ?,
        department = ?,
        state_of_origin = ?,
        lga = ?,
        next_of_kin_name = ?,
        next_of_kin_phone = ?
      WHERE user_id = ?`,
      [date_of_birth, gender, phone, address, faculty, department, state_of_origin, lga, next_of_kin_name, next_of_kin_phone, userId]
    );

    return { message: 'Profile updated successfully.' };
  }

  /**
   * 5. Process Simulated Payment
   */
  static async processSimulatedPayment(userId, { amount = 25000.00 }) {
    const profiles = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) {
      throw new Error('Student profile not found.');
    }
    const studentId = profiles[0].id;

    const regs = await db.query('SELECT id FROM registrations WHERE student_id = ?', [studentId]);
    if (regs.length === 0) {
      throw new Error('Registration record not found.');
    }
    const registrationId = regs[0].id;

    const ref = `SIM_PAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if payment row already exists
    const existingPayments = await db.query('SELECT id FROM payments WHERE registration_id = ?', [registrationId]);
    if (existingPayments.length > 0) {
      await db.query(
        `UPDATE payments SET amount = ?, reference_encrypted = ?, paid_at = NOW() WHERE registration_id = ?`,
        [amount, ref, registrationId]
      );
    } else {
      await db.query(
        `INSERT INTO payments (registration_id, amount, status, reference_encrypted, paid_at) VALUES (?, ?, 'pending', ?, NOW())`,
        [registrationId, amount, ref]
      );
    }

    return { reference: ref, amount, status: 'pending', message: 'Simulated payment initiated successfully.' };
  }

  /**
   * 6. Save Uploaded Document Metadata
   */
  static async saveUploadedDocument(userId, { document_type, filename, storage_path, file_size, mime_type }) {
    const validTypes = ['o_level', 'admission_letter', 'birth_certificate', 'lga_cert', 'passport_photo'];
    if (!validTypes.includes(document_type)) {
      throw new Error(`INVALID_DOCUMENT_TYPE: Allowed document types are: ${validTypes.join(', ')}.`);
    }

    const profiles = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) throw new Error('Student profile not found.');
    const studentId = profiles[0].id;

    const regs = await db.query('SELECT id FROM registrations WHERE student_id = ?', [studentId]);
    if (regs.length === 0) throw new Error('Registration record not found.');
    const registrationId = regs[0].id;

    // Check if document of this type already exists for this registration
    const existing = await db.query(
      'SELECT id FROM documents WHERE registration_id = ? AND document_type = ?',
      [registrationId, document_type]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE documents SET filename = ?, storage_path = ?, file_size = ?, mime_type = ?, uploaded_at = NOW()
         WHERE id = ?`,
        [filename, storage_path, file_size, mime_type, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO documents (registration_id, document_type, filename, storage_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [registrationId, document_type, filename, storage_path, file_size, mime_type]
      );
    }

    return { message: 'Document uploaded and registered successfully.' };
  }

  /**
   * 7. Submit Registration For Verification
   */
  static async submitRegistrationForVerification(userId) {
    const profiles = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) throw new Error('Student profile not found.');
    const profile = profiles[0];

    // Check bio-data profile completeness
    if (!profile.phone || !profile.address || !profile.faculty || !profile.department) {
      throw new Error('INCOMPLETE_PROFILE: You must complete your bio-data and academic details before submitting.');
    }

    const regs = await db.query('SELECT * FROM registrations WHERE student_id = ?', [profile.id]);
    if (regs.length === 0) throw new Error('Registration record not found.');
    const reg = regs[0];

    // Check payment record
    const payments = await db.query('SELECT * FROM payments WHERE registration_id = ?', [reg.id]);
    if (payments.length === 0) {
      throw new Error('MISSING_PAYMENT: You must complete the simulated acceptance & registration payment step.');
    }

    // Check document upload (at least O-Level and Admission Letter)
    const docs = await db.query('SELECT document_type FROM documents WHERE registration_id = ?', [reg.id]);
    const docTypes = docs.map(d => d.document_type);
    if (!docTypes.includes('o_level') || !docTypes.includes('admission_letter')) {
      throw new Error('MISSING_DOCUMENTS: Please upload both your O-Level Result and Admission Letter before submission.');
    }

    // Transition status to pending_verification
    await db.query(
      `UPDATE registrations SET status = 'pending_verification', submitted_at = NOW(), rejection_reason = NULL WHERE id = ?`,
      [reg.id]
    );

    return { status: 'pending_verification', message: 'Registration submitted successfully for administrative verification.' };
  }

  /**
   * 8. Get Full Student Registration Summary
   */
  static async getStudentRegistrationSummary(userId) {
    const users = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw new Error('User not found.');
    const user = users[0];

    const profiles = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) return { user, profile: null, registration: null, payment: null, documents: [] };
    const profile = profiles[0];

    const regs = await db.query('SELECT * FROM registrations WHERE student_id = ?', [profile.id]);
    const registration = regs[0] || null;

    let payment = null;
    let documents = [];

    if (registration) {
      const pmts = await db.query('SELECT * FROM payments WHERE registration_id = ?', [registration.id]);
      payment = pmts[0] || null;

      documents = await db.query('SELECT * FROM documents WHERE registration_id = ? ORDER BY uploaded_at DESC', [registration.id]);
    }

    return { user, profile, registration, payment, documents };
  }

  /**
   * 9. Admin: Get Pending Registrations Queue
   */
  static async adminGetPendingQueue({ search = '', faculty = '', department = '' }) {
    let sql = `
      SELECT 
        r.id as registration_id,
        r.status as registration_status,
        r.submitted_at,
        sp.id as student_profile_id,
        sp.application_number,
        sp.faculty,
        sp.department,
        sp.date_of_birth,
        sp.phone,
        u.id as user_id,
        u.name as student_name,
        u.email as student_email,
        p.id as payment_id,
        p.amount as payment_amount,
        p.status as payment_status,
        p.reference_encrypted as payment_ref,
        p.paid_at as payment_date,
        (SELECT COUNT(*) FROM documents WHERE registration_id = r.id) as doc_count
      FROM registrations r
      JOIN student_profiles sp ON r.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE r.status = 'pending_verification'
    `;
    const params = [];

    if (search) {
      sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(sp.application_number) LIKE ?)`;
      const s = `%${search.toLowerCase()}%`;
      params.push(s, s, s);
    }

    if (faculty) {
      sql += ` AND sp.faculty = ?`;
      params.push(faculty);
    }

    if (department) {
      sql += ` AND sp.department = ?`;
      params.push(department);
    }

    sql += ` ORDER BY r.submitted_at ASC`;

    return await db.query(sql, params);
  }

  /**
   * 10. Admin: Verify Payment
   */
  static async adminVerifyPayment(adminUserId, registrationId, paymentStatus = 'confirmed') {
    const pmts = await db.query('SELECT * FROM payments WHERE registration_id = ?', [registrationId]);
    if (pmts.length === 0) {
      throw new Error('NO_PAYMENT_FOUND: No payment record exists for this registration.');
    }

    await db.query(
      `UPDATE payments SET status = ?, confirmed_by = ?, confirmed_at = NOW() WHERE registration_id = ?`,
      [paymentStatus, adminUserId, registrationId]
    );

    return { message: `Payment verified and status marked as ${paymentStatus}.` };
  }

  /**
   * 11. Admin: Approve Registration
   * ENFORCED SERVER-SIDE: Payment MUST be confirmed before approval can happen!
   */
  static async adminApproveRegistration(adminUserId, registrationId) {
    const regs = await db.query('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (regs.length === 0) throw new Error('Registration not found.');

    const payments = await db.query('SELECT * FROM payments WHERE registration_id = ?', [registrationId]);
    if (payments.length === 0 || payments[0].status !== 'confirmed') {
      throw new Error('PAYMENT_UNCONFIRMED: Application cannot be approved with an unconfirmed payment. Please verify payment first.');
    }

    await db.query(
      `UPDATE registrations SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL WHERE id = ?`,
      [adminUserId, registrationId]
    );

    return { message: 'Registration successfully approved.' };
  }

  /**
   * 12. Admin: Reject Registration
   */
  static async adminRejectRegistration(adminUserId, registrationId, reason = '') {
    const regs = await db.query('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (regs.length === 0) throw new Error('Registration not found.');

    await db.query(
      `UPDATE registrations SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reason || 'Registration rejected due to missing or invalid documentation.', adminUserId, registrationId]
    );

    return { message: 'Registration rejected.' };
  }

  /**
   * 13. Admin: Search All Student Records
   */
  static async adminSearchStudentRecords({ search = '', status = '', faculty = '', department = '' }) {
    let sql = `
      SELECT 
        r.id as registration_id,
        r.status as registration_status,
        r.submitted_at,
        r.reviewed_at,
        r.rejection_reason,
        sp.id as student_profile_id,
        sp.application_number,
        sp.faculty,
        sp.department,
        sp.gender,
        sp.phone,
        sp.state_of_origin,
        sp.lga,
        u.id as user_id,
        u.name as student_name,
        u.email as student_email,
        p.status as payment_status,
        p.amount as payment_amount,
        p.paid_at as payment_date
      FROM registrations r
      JOIN student_profiles sp ON r.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(sp.application_number) LIKE ?)`;
      const s = `%${search.toLowerCase()}%`;
      params.push(s, s, s);
    }

    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (faculty) {
      sql += ` AND sp.faculty = ?`;
      params.push(faculty);
    }

    if (department) {
      sql += ` AND sp.department = ?`;
      params.push(department);
    }

    sql += ` ORDER BY r.id DESC`;

    return await db.query(sql, params);
  }

  /**
   * 14. Admin: Get Reports and Analytics Metrics
   */
  static async adminGetReportsAndAnalytics() {
    const totalStudentsRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalStudents = totalStudentsRes[0].count;

    const statusCountsRes = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM registrations 
      GROUP BY status
    `);
    
    const counts = { draft: 0, pending_verification: 0, approved: 0, rejected: 0 };
    statusCountsRes.forEach(r => { counts[r.status] = r.count; });

    const totalRevenueRes = await db.query(`
      SELECT SUM(amount) as total 
      FROM payments 
      WHERE status = 'confirmed'
    `);
    const totalRevenue = totalRevenueRes[0].total || 0;

    // Calculate average approval time (hours from submission to reviewed_at)
    const avgTimeRes = await db.query(`
      SELECT AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as avg_hours
      FROM registrations
      WHERE status = 'approved' AND submitted_at IS NOT NULL AND reviewed_at IS NOT NULL
    `);
    const avgApprovalHours = avgTimeRes[0].avg_hours ? Math.round(avgTimeRes[0].avg_hours * 10) / 10 : 0;

    // Faculty breakdown
    const facultyBreakdown = await db.query(`
      SELECT sp.faculty, COUNT(r.id) as count
      FROM registrations r
      JOIN student_profiles sp ON r.student_id = sp.id
      GROUP BY sp.faculty
    `);

    return {
      totalStudents,
      statusCounts: counts,
      totalRevenue,
      avgApprovalHours,
      facultyBreakdown
    };
  }

  /**
   * 15. Admin: Generate CSV Export
   */
  static async adminGenerateCSV() {
    const records = await this.adminSearchStudentRecords({});
    
    const headers = [
      'Registration ID', 'Application Number', 'Student Name', 'Email', 
      'Faculty', 'Department', 'Phone', 'Gender', 'State of Origin',
      'Registration Status', 'Payment Status', 'Submitted At', 'Reviewed At'
    ];

    const rows = records.map(r => [
      r.registration_id,
      `"${r.application_number || ''}"`,
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.student_email}"`,
      `"${r.faculty}"`,
      `"${r.department}"`,
      `"${r.phone}"`,
      `"${r.gender}"`,
      `"${r.state_of_origin}"`,
      `"${r.registration_status}"`,
      `"${r.payment_status || 'unpaid'}"`,
      `"${r.submitted_at ? new Date(r.submitted_at).toISOString() : ''}"`,
      `"${r.reviewed_at ? new Date(r.reviewed_at).toISOString() : ''}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

module.exports = HFRSEngine;
