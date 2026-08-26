// CONFIGURATION
const WEBHOOK_URL = 'https://gauravai.app.n8n.cloud/webhook/mauli-inspection'; // Verify 'mauli' vs 'maui'
const API_KEY = 'maui-brakes-secret-2026';

// DOM ELEMENTS
const form = document.getElementById('inspectionForm');
const checkQtyInput = document.getElementById('checkQty');
const okQtyInput = document.getElementById('okQty');
const rejQtyInput = document.getElementById('rejQty');
const reworkQtyInput = document.getElementById('reworkQty');
const mathWarning = document.getElementById('mathWarning');
const statusMsg = document.getElementById('statusMessage');
const submitBtn = document.getElementById('submitBtn');

// LIVE MATH CALCULATION
function updateCalculations() {
    const check = parseFloat(checkQtyInput.value) || 0;
    const ok = parseFloat(okQtyInput.value) || 0;
    const rej = parseFloat(rejQtyInput.value) || 0;
    const rework = parseFloat(reworkQtyInput.value) || 0;

    // Update Percentages
    document.getElementById('rejPercentDisplay').textContent = 
        `Rej %: ${check ? ((rej / check) * 100).toFixed(1) : 0}%`;
    document.getElementById('reworkPercentDisplay').textContent = 
        `Rework %: ${check ? ((rework / check) * 100).toFixed(1) : 0}%`;

    // Validate Math
    if (check > 0 && (ok + rej) !== check) {
        mathWarning.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        mathWarning.style.display = 'none';
        submitBtn.disabled = false;
    }
}

[checkQtyInput, okQtyInput, rejQtyInput, reworkQtyInput].forEach(input => {
    input.addEventListener('input', updateCalculations);
});

// FORM SUBMISSION
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusMsg.textContent = '';
    statusMsg.className = '';

    const payload = {
        partName: document.getElementById('partName').value,
        checkQty: Number(checkQtyInput.value),
        okQty: Number(okQtyInput.value),
        rejQty: Number(rejQtyInput.value),
        reworkQty: Number(reworkQtyInput.value),
        inspectorId: document.getElementById('inspectorId').value,
        shift: document.getElementById('shift').value
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            statusMsg.textContent = '✅ Inspection Logged Successfully!';
            statusMsg.className = 'success';
            form.reset();
            document.getElementById('inspectorId').value = 'INS-001'; // Reset default
            updateCalculations();
        } else {
            throw new Error(data.errors ? data.errors.join(', ') : 'Validation Failed');
        }
    } catch (error) {
        statusMsg.textContent = '❌ ' + error.message;
        statusMsg.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Inspection';
    }
});
