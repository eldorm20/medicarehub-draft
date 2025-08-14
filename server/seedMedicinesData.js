// Import UzPharm medicine data into storage
import fs from 'fs';
import path from 'path';
import { storage } from './storage.js';

function seedMedicineData() {
  try {
    const testDataPath = path.join(process.cwd(), 'server', 'test_medicines.json');
    if (!fs.existsSync(testDataPath)) {
      console.log('No test data found, run the medicine preparation first');
      return;
    }

    const medicines = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    console.log(`Importing ${medicines.length} medicines...`);

    // Clear existing medicines and import new ones
    storage.medicines = [];
    storage.insertMedicines(medicines);
    
    console.log(`Successfully imported ${medicines.length} medicines!`);
    console.log('Sample medicine:', medicines[0].title);
    
  } catch (error) {
    console.error('Failed to seed medicine data:', error);
  }
}

// Run the seed function
seedMedicineData();