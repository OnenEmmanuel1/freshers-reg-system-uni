/**
 * Client JavaScript: Administrative Verification & Management Module
 */

document.addEventListener('DOMContentLoaded', () => {
  const verifyPaymentBtn = document.getElementById('hfrsAdminVerifyPaymentBtn');
  const approveRegBtn = document.getElementById('hfrsAdminApproveRegBtn');
  const rejectRegBtn = document.getElementById('hfrsAdminRejectRegBtn');
  const rejectReasonInput = document.getElementById('hfrsRejectReason');
  const adminAlertContainer = document.getElementById('hfrsAdminAlert');

  function showAlert(message, type = 'danger') {
    if (!adminAlertContainer) return;
    adminAlertContainer.className = `hfrs-alert hfrs-alert-${type}`;
    adminAlertContainer.innerHTML = `<span>${message}</span>`;
    adminAlertContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 1. Verify Payment
  if (verifyPaymentBtn) {
    verifyPaymentBtn.addEventListener('click', async () => {
      const regId = verifyPaymentBtn.getAttribute('data-reg-id');
      verifyPaymentBtn.disabled = true;

      try {
        const res = await fetch('/api/admin/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: regId, status: 'confirmed' })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Payment successfully verified and confirmed!', 'success');
          setTimeout(() => { window.location.reload(); }, 800);
        } else {
          showAlert(data.error || 'Failed to verify payment.');
          verifyPaymentBtn.disabled = false;
        }
      } catch (err) {
        showAlert('Network error while verifying payment.');
        verifyPaymentBtn.disabled = false;
      }
    });
  }

  // 2. Approve Registration
  if (approveRegBtn) {
    approveRegBtn.addEventListener('click', async () => {
      const regId = approveRegBtn.getAttribute('data-reg-id');
      if (!confirm('Are you sure you want to APPROVE this fresher registration application?')) return;

      approveRegBtn.disabled = true;

      try {
        const res = await fetch('/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: regId })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Application APPROVED successfully!', 'success');
          setTimeout(() => { window.location.href = '/admin/dashboard'; }, 1000);
        } else {
          showAlert(data.error || 'Approval failed.');
          approveRegBtn.disabled = false;
        }
      } catch (err) {
        showAlert('Network error while approving registration.');
        approveRegBtn.disabled = false;
      }
    });
  }

  // 3. Reject Registration
  if (rejectRegBtn) {
    rejectRegBtn.addEventListener('click', async () => {
      const regId = rejectRegBtn.getAttribute('data-reg-id');
      const reason = rejectReasonInput ? rejectReasonInput.value.trim() : '';

      if (!reason) {
        showAlert('Please provide a specific reason for rejecting this registration application.');
        return;
      }

      if (!confirm('Are you sure you want to REJECT this fresher registration application?')) return;

      rejectRegBtn.disabled = true;

      try {
        const res = await fetch('/api/admin/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: regId, reason })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Application REJECTED with reason recorded.', 'success');
          setTimeout(() => { window.location.href = '/admin/dashboard'; }, 1000);
        } else {
          showAlert(data.error || 'Rejection failed.');
          rejectRegBtn.disabled = false;
        }
      } catch (err) {
        showAlert('Network error while rejecting registration.');
        rejectRegBtn.disabled = false;
      }
    });
  }
});
