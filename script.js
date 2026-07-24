document.getElementById('addSpareForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        part_number: document.getElementById('part_number').value,
        oem_number: document.getElementById('oem_number').value,
        part_name: document.getElementById('jina_la_spea').value,
        vehicle_model: document.getElementById('model_ya_gari').value,
        shelf_location: document.getElementById('location_shelf').value,
        current_stock: parseInt(document.getElementById('current_stock').value) || 0,
        min_stock: parseInt(document.getElementById('min_stock_alert').value) || 0
    };

    try {
        const response = await fetch('/api/parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Spea imehifadhiwa kikamilifu!');
            document.getElementById('addSpareForm').reset();
        } else {
            alert('Kuna makosa yametokea wakati wa kuhifadhi!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Imeshindikana kuunganisha na server!');
    }
});
