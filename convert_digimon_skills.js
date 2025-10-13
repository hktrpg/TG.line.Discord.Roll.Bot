const fs = require('fs');
const path = require('path');

// Element mapping from digimonSTS.json to digi_data_edit.json
const elementMapping = {
    "Fire": 1,
    "Water": 2,
    "Plant": 3,
    "Ice": 4,
    "Elec": 5,
    "Earth": 6,
    "Steel": 7,
    "Wind": 8,
    "Light": 9,
    "Dark": 10,
    "Null": 0,
    "-": -1
};

// Reverse mapping for converting from number to string
const reverseElementMapping = {
    1: "Fire",
    2: "Water", 
    3: "Plant",
    4: "Ice",
    5: "Elec",
    6: "Earth",
    7: "Steel",
    8: "Wind",
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
    // Map dmgType to skill type
    // Based on the data structure analysis
    switch(dmgType) {
        case 1: return "Physical";
        case 8: return "Magic";
        case 2: return "Physical";
        case 3: return "Physical";
        case 4: return "Physical";
        case 5: return "Physical";
        case 6: return "Physical";
        case 7: return "Physical";
        case 9: return "Magic";
        case 10: return "Magic";
        default: return "Physical";
    }
}

function getTargetDescription(targetType) {
    // Map targetType to description
    switch(targetType) {
        case 1: return "1 enemy";
        case 2: return "1 enemy";
        case 3: return "All enemies";
        case 4: return "1 ally";
        case 5: return "All allies";
        default: return "1 enemy";
    }
}

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
    const moveDescriptions = digiDataEdit.moveDescriptions.English;
    
    let convertedCount = 0;
    let skippedCount = 0;
    
    // Process each digimon in digimonSTS.json
    for (let i = 0; i < digimonSTS.length; i++) {
        const digimon = digimonSTS[i];
        
        // Skip if not a digimon object or already has special_skills
        if (!digimon.id || !Array.isArray(digimon.special_skills) || digimon.special_skills.length > 0) {
            continue;
        }
        
        // Find corresponding digimon in digiDataEdit by fieldGuideId
        const digimonId = digimon.id.toString();
        let correspondingDigimon = null;
        
        // Search through digiData to find matching fieldGuideId
        for (const [key, digiData] of Object.entries(digiDataEdit.digiData)) {
            if (digiData.baseStats && digiData.baseStats.fieldGuideId === digimonId) {
                correspondingDigimon = digiData;
                break;
            }
        }
        
        if (!correspondingDigimon || !correspondingDigimon.moveDetails || !correspondingDigimon.moveDetails.signature) {
            skippedCount++;
            continue;
        }
        
        // Get signature moves
        const signatureMoves = correspondingDigimon.moveDetails.signature;
        const specialSkills = [];
        
        // Process each signature move
        for (const [moveId, moveData] of Object.entries(signatureMoves)) {
            if (!skillData[moveId]) {
                continue;
            }
            
            const skill = skillData[moveId];
            const moveName = sigMoves[moveId] || moveNames[moveId] || `Unknown Skill ${moveId}`;
            const moveDescription = moveDescriptions[moveId] || `No description available for ${moveId}`;
            
            // Convert element from number to string
            const element = reverseElementMapping[skill.element] || "Null";
            
            // Get skill type
            const type = getSkillType(skill.dmgType);
            
            // Get target description
            const targetDesc = getTargetDescription(skill.targetType);
            
            // Create special skill object
            let description = moveDescription;
            
            // If no description available, create a basic one
            if (!description || description.trim() === '') {
                if (skill.power === 0) {
                    description = `Special ${element} ${type.toLowerCase()} skill.\nTarget: ${targetDesc}`;
                } else {
                    description = `Performs ${element} ${type.toLowerCase()} attack at power ${skill.power}.\nTarget: ${targetDesc}`;
                }
            }
            
            const specialSkill = {
                name: moveName,
                element: element,
                sp_cost: "25", // Default SP cost, you may need to adjust this
                type: type,
                description: description
            };
            
            specialSkills.push(specialSkill);
        }
        
        // Update the digimon with special skills
        if (specialSkills.length > 0) {
            digimonSTS[i].special_skills = specialSkills;
            convertedCount++;
            console.log(`Converted ${digimon.name} (ID: ${digimon.id}) - Added ${specialSkills.length} special skills`);
        } else {
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
        const backupFile = `assets/digmonsts/digimonSTS_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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