const form = document.getElementById('budget-form');
const resultsBody = document.getElementById('results-body');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    base_currency: document.getElementById('base-currency').value,
    expenses: document.getElementById('expenses').value.split(',').map((item) => item.trim()),
    buffer_percentage: document.getElementById('buffer').value,
    target_currencies: Array.from(document.querySelectorAll('.target-currency')).map((el) => el.value),
  };

  resultsBody.innerHTML = '<tr><td colspan="2">Loading...</td></tr>';

  try {
    const response = await fetch('http://localhost:8000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Unable to simulate budget');
    }

    const rows = Object.entries(data.converted_totals)
      .map(([currency, amount]) => `<tr><td>${currency}</td><td>${amount}</td></tr>`)
      .join('');

    resultsBody.innerHTML = rows || '<tr><td colspan="2">No conversion data available.</td></tr>';
  } catch (error) {
    resultsBody.innerHTML = `<tr><td colspan="2">${error.message}</td></tr>`;
  }
});
