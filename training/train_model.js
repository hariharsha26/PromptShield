// train_model.js
// This script loads the training_dataset.xlsx (or CSV) and builds embeddings for prompts.
// It saves the embeddings and associated metadata to a JSON file for later inference.

const tf = require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Paths (adjust if needed)
const DATA_PATH = path.join(__dirname, 'training_dataset.xlsx'); // EXCEL (in model folder)
const OUTPUT_PATH = path.join(__dirname, 'model_data.json');

async function loadData() {
    const workbook = xlsx.readFile(DATA_PATH);
    const sheetName = workbook.SheetNames[0];
    const records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    // Expected columns: id,prompt,category,risk_level,action
    const prompts = records.map(r => r.prompt);
    const categories = records.map(r => r.category);
    const riskLevels = records.map(r => parseFloat(r.risk_level) || 0);
    const actions = records.map(r => r.action);
    return { prompts, categories, riskLevels, actions };
}

async function main() {
    console.log('Loading Universal Sentence Encoder...');
    const model = await use.load();
    const { prompts, categories, riskLevels, actions } = await loadData();
    console.log(`Encoding ${prompts.length} prompts...`);
    const embeddings = await model.embed(prompts);
    const embedArray = await embeddings.array();
    // Save data
    const modelData = {
        prompts,
        categories,
        riskLevels,
        actions,
        embeddings: embedArray
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(modelData));
    console.log('Model data saved to', OUTPUT_PATH);
}

main().catch(err => console.error(err));
