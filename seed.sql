-- UniRegister (hfrs-) Seed Data for UNICROSS Freshers Registration System

USE unicross_freshers_reg_db;

-- Clear existing data in reverse order of dependencies
DELETE FROM payments;
DELETE FROM documents;
DELETE FROM registrations;
DELETE FROM student_profiles;
DELETE FROM users;

-- 1. Insert Users (1 Admin, 5 Sample Students)
-- Password for ALL accounts: password123 -> $2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
(1, 'System Administrator', 'admin@unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'admin', NOW()),
(2, 'John Doe', 'john.doe@student.unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'student', NOW()),
(3, 'Jane Smith', 'jane.smith@student.unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'student', NOW()),
(4, 'Michael Johnson', 'michael.j@student.unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'student', NOW()),
(5, 'Sarah Williams', 'sarah.w@student.unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'student', NOW()),
(6, 'David Okon', 'david.o@student.unicross.edu.ng', '$2a$10$JuNq8N9IbNXl8wBDNMOnueiywXYXCEgckibj07BfSYnvWgxXvcTWW', 'student', NOW());

-- 2. Insert Student Profiles
INSERT INTO student_profiles (id, user_id, application_number, date_of_birth, gender, phone, address, faculty, department, state_of_origin, lga, next_of_kin_name, next_of_kin_phone) VALUES
(1, 2, 'UNI/2026/001', '2004-05-12', 'Male', '08031234567', '12 Calabar Road, Calabar', 'Engineering', 'Computer Engineering', 'Cross River', 'Calabar Municipal', 'Robert Doe', '08039876543'),
(2, 3, 'UNI/2026/002', '2003-11-20', 'Female', '08032345678', '45 Ikom Highway, Ikom', 'Physical Sciences', 'Computer Science', 'Cross River', 'Ikom', 'Mary Smith', '08038765432'),
(3, 4, 'UNI/2026/003', '2004-02-15', 'Male', '08033456789', '8 Ogoja Road, Ogoja', 'Management Sciences', 'Business Administration', 'Cross River', 'Ogoja', 'Peter Johnson', '08037654321'),
(4, 5, 'UNI/2026/004', '2003-08-30', 'Female', '08034567890', '15 Marian Road, Calabar', 'Biological Sciences', 'Microbiology', 'Akwa Ibom', 'Uyo', 'Grace Williams', '08036543210'),
(5, 6, 'UNI/2026/005', '2004-09-05', 'Male', '08035678901', '22 Obudu Street, Obudu', 'Environmental Sciences', 'Architecture', 'Cross River', 'Obudu', 'Joseph Okon', '08035432109');

-- 3. Insert Registrations (Varying stages)
INSERT INTO registrations (id, student_id, status, rejection_reason, submitted_at, reviewed_by, reviewed_at) VALUES
(1, 1, 'draft', NULL, NULL, NULL, NULL),
(2, 2, 'pending_verification', NULL, NOW() - INTERVAL 2 DAY, NULL, NULL),
(3, 3, 'pending_verification', NULL, NOW() - INTERVAL 3 DAY, NULL, NULL),
(4, 4, 'approved', NULL, NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 1 DAY),
(5, 5, 'rejected', 'Uploaded O-Level statement of result is unclear and missing candidate number.', NOW() - INTERVAL 4 DAY, 1, NOW() - INTERVAL 2 DAY);

-- 4. Insert Payments
INSERT INTO payments (id, registration_id, amount, status, reference_encrypted, paid_at, confirmed_by, confirmed_at) VALUES
(1, 2, 25000.00, 'pending', 'SIM_PAY_9823471029_PENDING', NOW() - INTERVAL 2 DAY, NULL, NULL),
(2, 3, 25000.00, 'confirmed', 'SIM_PAY_8471920384_CONFIRMED', NOW() - INTERVAL 3 DAY, 1, NOW() - INTERVAL 2 DAY),
(3, 4, 25000.00, 'confirmed', 'SIM_PAY_7192038471_CONFIRMED', NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 4 DAY),
(4, 5, 25000.00, 'confirmed', 'SIM_PAY_6039281726_CONFIRMED', NOW() - INTERVAL 4 DAY, 1, NOW() - INTERVAL 3 DAY);

-- 5. Insert Documents
INSERT INTO documents (id, registration_id, document_type, filename, storage_path, file_size, mime_type, uploaded_at) VALUES
(1, 2, 'o_level', 'olevel_jane_smith.pdf', '/uploads/olevel_jane_smith.pdf', 1024500, 'application/pdf', NOW() - INTERVAL 2 DAY),
(2, 2, 'admission_letter', 'admission_jane_smith.pdf', '/uploads/admission_jane_smith.pdf', 840200, 'application/pdf', NOW() - INTERVAL 2 DAY),
(3, 3, 'o_level', 'olevel_michael_j.pdf', '/uploads/olevel_michael_j.pdf', 950000, 'application/pdf', NOW() - INTERVAL 3 DAY),
(4, 3, 'admission_letter', 'admission_michael_j.pdf', '/uploads/admission_michael_j.pdf', 720000, 'application/pdf', NOW() - INTERVAL 3 DAY),
(5, 3, 'birth_certificate', 'birth_cert_michael_j.pdf', '/uploads/birth_cert_michael_j.pdf', 540000, 'application/pdf', NOW() - INTERVAL 3 DAY),
(6, 4, 'o_level', 'olevel_sarah_w.pdf', '/uploads/olevel_sarah_w.pdf', 1100000, 'application/pdf', NOW() - INTERVAL 5 DAY),
(7, 4, 'admission_letter', 'admission_sarah_w.pdf', '/uploads/admission_sarah_w.pdf', 890000, 'application/pdf', NOW() - INTERVAL 5 DAY),
(8, 5, 'o_level', 'olevel_david_o.pdf', '/uploads/olevel_david_o.pdf', 300000, 'application/pdf', NOW() - INTERVAL 4 DAY);
