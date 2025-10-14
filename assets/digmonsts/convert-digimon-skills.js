const fs = require('fs');

// Element mapping indices are defined externally; this file uses reverse mapping only

// Reverse mapping for converting from number to string (kept in sync with elementMapping)
const reverseElementMapping = {
    1: "Fire",
    2: "Ice",
    3: "Plant",
    4: "Water",
    5: "Elec",
    6: "Steel",
    7: "Wind",
    8: "Earth",
    9: "Light",
    10: "Dark",
    0: "Null",
    "-1": "-"
};

function loadJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        return null;
    }
}

function saveJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Successfully saved ${filePath}`);
    } catch (error) {
        console.error(`Error saving ${filePath}:`, error.message);
    }
}

function getSkillType(dmgType) {
    // dmgType mapping
    // 1: Physical, 2: Magic, 4: Fixed damage, 5: Deals x% HP damage, 8: Heal, 0: Non-attack
    switch (dmgType) {
        case 0: return "Support"; // non-attack
        case 1: return "Physical";
        case 2: return "Magic";
        case 4: return "Fixed";
        case 5: return "HP%";
        case 8: return "Heal";
        default: return "Physical";
    }
}

// targetType mapping documented in conversion, not needed at runtime for augmentation

function convertDigimonSkills() {
    console.log('Starting Digimon skills conversion...');
    
    // Load the data files
    const digimonSTS = loadJsonFile('assets/digmonsts/digimonSTS.json');
    const digiDataEdit = loadJsonFile('assets/digmonsts/digi_data_edit.json');
    
    if (!digimonSTS || !digiDataEdit) {
        console.error('Failed to load required data files');
        return;
    }
    
    console.log(`Loaded ${digimonSTS.length} digimon from digimonSTS.json`);
    console.log(`Loaded digiData with ${Object.keys(digiDataEdit.digiData).length} entries`);
    
    // Extract skill data
    const skillData = digiDataEdit.skillData;
    const moveNames = digiDataEdit.moveNames.English;
    const sigMoves = digiDataEdit.sigMoves.English;
    // const moveDescriptions = digiDataEdit.moveDescriptions.English; // not needed for augmentation
    
    let convertedCount = 0;
    let skippedCount = 0;
    
    // Process each digimon in digimonSTS.json
    for (let i = 0; i < digimonSTS.length; i++) {
        const digimon = digimonSTS[i];
        
        // Ensure valid digimon record and init skills array
        if (!digimon.id) {
            continue;
        }
        if (!Array.isArray(digimon.special_skills)) {
            digimon.special_skills = [];
        }
        
        // Find corresponding digimon in digiDataEdit by fieldGuideId
        const digimonId = digimon.id.toString();
        let correspondingDigimon = null;
        
        // Search through digiData to find matching fieldGuideId
        for (const digiData of Object.values(digiDataEdit.digiData)) {
            if (digiData.baseStats && digiData.baseStats.fieldGuideId === digimonId) {
                correspondingDigimon = digiData;
                break;
            }
        }
        
        if (!correspondingDigimon || !correspondingDigimon.moveDetails || !correspondingDigimon.moveDetails.signature) {
            // Even if we cannot find corresponding move details, still augment existing special_skills with defaults
            if (digimon.special_skills.length > 0) {
                for (let s = 0; s < digimon.special_skills.length; s++) {
                    const ss = digimon.special_skills[s];
                    ss.minHits = ss.minHits ?? 1;
                    ss.maxHits = ss.maxHits ?? 1;
                    ss.power = ss.power ?? 0;
                    ss.critRate = ss.critRate ?? 0;
                    ss.alwaysHits = ss.alwaysHits ?? 0;
                    ss.HPDrain = ss.HPDrain ?? 0;
                    ss.SPDrain = ss.SPDrain ?? 0;
                    ss.recoil = ss.recoil ?? 0;
                }
                convertedCount++;
            } else {
                skippedCount++;
            }
            continue;
        }
        
        // Get signature moves
        const signatureMoves = correspondingDigimon.moveDetails.signature;
        
        // Build a quick lookup from move names to IDs for enrichment
        const nameToMoveId = {};
        for (const moveId of Object.keys(signatureMoves)) {
            const n1 = sigMoves[moveId];
            const n2 = moveNames[moveId];
            if (n1) nameToMoveId[n1] = moveId;
            if (n2) nameToMoveId[n2] = moveId;
        }
        
        if (digimon.special_skills.length > 0) {
            // Augment existing special_skills without changing name/description
            for (let s = 0; s < digimon.special_skills.length; s++) {
                const ss = digimon.special_skills[s];
                const moveId = nameToMoveId[ss.name];
                const skill = moveId ? skillData[moveId] : null;
                if (skill) {
                    const element = reverseElementMapping[skill.element] || "Null";
                    ss.element = element;
                    if (ss.type == null) ss.type = getSkillType(skill.dmgType);
                    if (skill.targetType != null && ss.targetType == null) ss.targetType = skill.targetType;
                    if (ss.minHits == null) ss.minHits = skill.minHits ?? 1;
                    if (ss.maxHits == null) ss.maxHits = skill.maxHits ?? 1;
                    if (ss.power == null) ss.power = skill.power ?? 0;
                    if (ss.critRate == null) ss.critRate = skill.critRate ?? 0;
                    if (ss.alwaysHits == null) ss.alwaysHits = skill.alwaysHits ?? 0;
                    if (ss.HPDrain == null) ss.HPDrain = skill.HPDrain ?? 0;
                    if (ss.SPDrain == null) ss.SPDrain = skill.SPDrain ?? 0;
                    if (ss.recoil == null) ss.recoil = skill.recoil ?? 0;
                } else {
                    // Fallback defaults if no matching move found
                    // do not auto-assign sp_cost per requirements
                    if (ss.minHits == null) ss.minHits = 1;
                    if (ss.maxHits == null) ss.maxHits = 1;
                    if (ss.power == null) ss.power = 0;
                    if (ss.critRate == null) ss.critRate = 0;
                    if (ss.alwaysHits == null) ss.alwaysHits = 0;
                    if (ss.HPDrain == null) ss.HPDrain = 0;
                    if (ss.SPDrain == null) ss.SPDrain = 0;
                    if (ss.recoil == null) ss.recoil = 0;
                }
            }
            convertedCount++;
        } else {
            // No existing special_skills: do not create new ones as per requirement
            skippedCount++;
        }
    }
    
    console.log(`\nConversion completed:`);
    console.log(`- Converted: ${convertedCount} digimon`);
    console.log(`- Skipped: ${skippedCount} digimon`);
    
    // Save the updated digimonSTS.json
    const outputFile = 'assets/digmonsts/digimonSTS_converted.json';
    saveJsonFile(outputFile, digimonSTS);
    
    console.log(`\nConversion script completed successfully!`);
    console.log(`Output saved to: ${outputFile}`);
    console.log(`\nTo replace the original file, run:`);
    console.log(`copy "${outputFile}" "assets/digmonsts/digimonSTS.json"`);
}

// Add command line argument support
const args = process.argv.slice(2);
const shouldReplaceOriginal = args.includes('--replace');

if (shouldReplaceOriginal) {
    console.log('Running conversion with --replace flag...');
    // Load the data files
    const digimonSTS = loadJsonFile('assets/digmonsts/digimonSTS.json');
    const digiDataEdit = loadJsonFile('assets/digmonsts/digi_data_edit.json');
    
    if (digimonSTS && digiDataEdit) {
        // Create backup
        const backupFile = `assets/digmonsts/digimonSTS_backup_${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}.json`;
        saveJsonFile(backupFile, digimonSTS);
        console.log(`Backup created: ${backupFile}`);
        
        // Run conversion and replace original
        convertDigimonSkills();
        
        // Copy converted file to original
        const convertedData = loadJsonFile('assets/digmonsts/digimonSTS_converted.json');
        if (convertedData) {
            saveJsonFile('assets/digmonsts/digimonSTS.json', convertedData);
            console.log('Original file replaced successfully!');
        }
    }
} else {
    // Run the conversion normally
    convertDigimonSkills();
}