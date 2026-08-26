// CONFIGURATION
// NOTE: For production, consider using a backend proxy to hide this key.
const WEBHOOK_URL = 'https://gauravai.app.n8n.cloud/webhook/mauli-inspection'; 
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

// LIVE MATH CALCULATION & VALIDATION
function updateCalculations() {
    const check = parseFloat(checkQtyInput.value) || 0;
    const ok = parseFloat(okQtyInput.value) || 0;
    const rej = parseFloat(rejQtyInput.value) || 0;
    const rework = parseFloat(reworkQtyInput.value) || 0;

    // Update Percentage Displays
    const rejPct = check > 0 ? ((rej / check) * 100).toFixed(1) : '0.0';
    const reworkPct = check > 0 ? ((rework / check) * 100).toFixed(1) : '0.0';
    
    document.getElementById('rejPercentDisplay').textContent = `Rej %: ${rejPct}%`;
    document.getElementById('reworkPercentDisplay').textContent = `Rework %: ${reworkPct}%`;

    // Validate Math: Ok + Rej MUST equal Check
    // We allow a small floating point tolerance just in case, though integers are expected
    const isMathValid = check === 0 || Math.abs((ok + rej) - check) < 0.01;

    if (!isMathValid && check > 0) {
        mathWarning.style.display = 'flex';
        // submitBtn.disabled = true;  <-- COMMENTED OUT SO YOU CAN CLICK IT
        submitBtn.textContent = "Submit Anyway (Warning)";
    } else {
        mathWarning.style.display = 'none';
        submitBtn.disabled = !document.getElementById('partName').value;
        submitBtn.textContent = "Submit Inspection";
    }
}

// Attach listeners to all quantity inputs
[checkQtyInput, okQtyInput, rejQtyInput, reworkQtyInput].forEach(input => {
    input.addEventListener('input', updateCalculations);
});

// Also check when Part Name changes
document.getElementById('partName').addEventListener('change', updateCalculations);

// FORM SUBMISSION HANDLER
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Double check validation before sending
    const check = parseFloat(checkQtyInput.value) || 0;
    const ok = parseFloat(okQtyInput.value) || 0;
    const rej = parseFloat(rejQtyInput.value) || 0;
    
    if (Math.abs((ok + rej) - check) > 0.01) {
        alert("Cannot submit: Math error detected.");
        return;
    }

    // UI Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusMsg.textContent = '';
    statusMsg.className = '';

    // Prepare Payload
    const payload = {
        partName: document.getElementById('partName').value,
        checkQty: parseInt(checkQtyInput.value, 10),
        okQty: parseInt(okQtyInput.value, 10),
        rejQty: parseInt(rejQtyInput.value, 10),
        reworkQty: parseInt(reworkQtyInput.value, 10),
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
            // SUCCESS STATE
            statusMsg.textContent = '✅ Inspection Logged Successfully!';
            statusMsg.className = 'success';
            
            // Reset Form after delay
            setTimeout(() => {
                form.reset();
                document.getElementById('inspectorId').value = 'INS-001'; // Keep ID
                updateCalculations(); // Reset displays
                statusMsg.textContent = '';
            }, 3000);
            
        } else {
            // ERROR STATE FROM N8N
            const errorMsg = data.errors ? data.errors.join(', ') : (data.message || 'Validation Failed');
            throw new Error(errorMsg);
        }
    } catch (error) {
        // NETWORK OR VALIDATION ERROR
        statusMsg.textContent = '❌ ' + error.message;
        statusMsg.className = 'error';
        submitBtn.disabled = false;
        submitBtn.textContent = "Try Again";
    }
});
