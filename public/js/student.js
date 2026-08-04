/**
 * Client JavaScript: Student Registration Module & Real-Time Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('hfrsProfileForm');
  const paymentBtn = document.getElementById('hfrsPayBtn');
  const uploadForm = document.getElementById('hfrsDocUploadForm');
  const finalSubmitBtn = document.getElementById('hfrsFinalSubmitBtn');
  const alertContainer = document.getElementById('hfrsStudentAlert');
  const statusPollingBadge = document.getElementById('hfrsLiveStatusBadge');

  function showAlert(message, type = 'danger') {
    if (!alertContainer) return;
    alertContainer.className = `hfrs-alert hfrs-alert-${type}`;
    alertContainer.innerHTML = `<span>${message}</span>`;
    alertContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 1. Profile Bio-Data Save
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const dataObj = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/student/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataObj)
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Bio-Data Profile saved successfully! Proceeding to Step 2: Payment...', 'success');
          setTimeout(() => {
            window.location.href = '/student/registration?step=2';
          }, 1000);
        } else {
          showAlert(data.error || 'Failed to save profile details.');
        }
      } catch (err) {
        showAlert('Network error while saving profile.');
      }
    });
  }

  // 2. Simulated Acceptance Fee Payment Processing via Checkout Modal
  const modalPayConfirmBtn = document.getElementById('hfrsModalPayConfirmBtn');
  if (modalPayConfirmBtn) {
    modalPayConfirmBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      modalPayConfirmBtn.disabled = true;
      modalPayConfirmBtn.innerHTML = '⌛ Processing & Encrypting Payment Token...';

      try {
        const res = await fetch('/api/student/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 25000.00 })
        });
        const data = await res.json();

        if (data.success) {
          showAlert(`Payment Successful & Encrypted! Reference: ${data.reference}. Proceeding to Step 3: Document Uploads...`, 'success');
          const modal = document.getElementById('hfrsPaymentGatewayModal');
          if (modal) modal.style.display = 'none';
          setTimeout(() => {
            window.location.href = '/student/registration?step=3';
          }, 1200);
        } else {
          showAlert(data.error || 'Payment transaction failed.');
          modalPayConfirmBtn.disabled = false;
          modalPayConfirmBtn.innerHTML = 'Complete Payment (₦25,000.00)';
        }
      } catch (err) {
        showAlert('Network error while processing payment transaction.');
        modalPayConfirmBtn.disabled = false;
        modalPayConfirmBtn.innerHTML = 'Complete Payment (₦25,000.00)';
      }
    });
  }

  // 3. Document Upload Form
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const docTypeSelect = document.getElementById('document_type');
      const fileInput = document.getElementById('documentFile');

      if (!fileInput.files || fileInput.files.length === 0) {
        showAlert('Please select a file to upload.');
        return;
      }

      const formData = new FormData();
      formData.append('document_type', docTypeSelect.value);
      formData.append('documentFile', fileInput.files[0]);

      try {
        const res = await fetch('/api/student/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          showAlert(`Document "${docTypeSelect.value.toUpperCase()}" uploaded successfully!`, 'success');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          showAlert(data.error || 'Document upload failed.');
        }
      } catch (err) {
        showAlert('Network error while uploading document.');
      }
    });
  }

  // 4. Final Submission Button
  if (finalSubmitBtn) {
    finalSubmitBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to submit your complete registration for administrative verification? You will not be able to edit details while verification is pending.')) {
        return;
      }

      try {
        const res = await fetch('/api/student/submit', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showAlert('Registration submitted successfully! Redirecting to tracking view...', 'success');
          setTimeout(() => {
            window.location.href = '/student/status';
          }, 1000);
        } else {
          showAlert(data.error || 'Submission failed.');
        }
      } catch (err) {
        showAlert('Network error during registration submission.');
      }
    });
  }

  // 5. Real-Time Status Polling (Every 10 seconds on status / dashboard pages)
  if (statusPollingBadge) {
    setInterval(async () => {
      try {
        const res = await fetch('/api/student/status');
        const data = await res.json();

        if (data.success && data.status) {
          const currentText = statusPollingBadge.innerText.trim().toLowerCase();
          const newStatus = data.status.toLowerCase();

          if (!currentText.includes(newStatus)) {
            // Update badge dynamically
            let badgeClass = 'hfrs-badge-pending';
            let label = 'PENDING VERIFICATION';

            if (newStatus === 'approved') {
              badgeClass = 'hfrs-badge-approved';
              label = 'APPROVED';
            } else if (newStatus === 'rejected') {
              badgeClass = 'hfrs-badge-rejected';
              label = 'REJECTED';
            } else if (newStatus === 'draft') {
              badgeClass = 'hfrs-badge-draft';
              label = 'DRAFT INCOMPLETE';
            }

            statusPollingBadge.className = `hfrs-badge ${badgeClass}`;
            statusPollingBadge.innerHTML = `<span>●</span> ${label}`;

            // If status changed to approved or rejected, refresh page to show details
            if (newStatus === 'approved' || newStatus === 'rejected') {
              window.location.reload();
            }
          }
        }
      } catch (e) {
        // Silent catch for background polling
      }
    }, 10000);
  }
});
