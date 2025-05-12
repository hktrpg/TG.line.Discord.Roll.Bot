/**
 * Docling Setup Script
 * This script helps set up the Docling environment
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Define directories
const doclingDir = path.join(__dirname);
const tempDir = path.join(doclingDir, 'temp');

// Ensure directories exist
function ensureDirectories() {
    console.log('Ensuring directories exist...');
    
    if (!fs.existsSync(doclingDir)) {
        fs.mkdirSync(doclingDir, { recursive: true });
        console.log(`Created directory: ${doclingDir}`);
    }
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`Created directory: ${tempDir}`);
    }
}

// Check if Python is installed
function checkPython() {
    console.log('Checking Python installation...');
    
    try {
        // Try with 'python' command
        const pythonVersion = execSync('python --version', { encoding: 'utf8' });
        console.log(`Found Python: ${pythonVersion.trim()}`);
        return 'python';
    } catch (error) {
        try {
            // Try with 'python3' command
            const python3Version = execSync('python3 --version', { encoding: 'utf8' });
            console.log(`Found Python: ${python3Version.trim()}`);
            return 'python3';
        } catch (error) {
            console.error('Python not found. Please install Python 3.9 or later.');
            return null;
        }
    }
}

// Update .env file with Python path
function updateEnvFile(pythonPath) {
    console.log('Updating .env file...');
    
    const envFile = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envFile)) {
        envContent = fs.readFileSync(envFile, 'utf8');
    }
    
    // Check if PYTHON_PATH is already in .env
    if (envContent.includes('PYTHON_PATH=')) {
        envContent = envContent.replace(/PYTHON_PATH=.*(\r?\n|$)/g, `PYTHON_PATH=${pythonPath}$1`);
    } else {
        envContent += `\n# Python Configuration for Docling\nPYTHON_PATH=${pythonPath}\n`;
    }
    
    // Enable Docling
    if (envContent.includes('DOCLING_ENABLED=')) {
        envContent = envContent.replace(/DOCLING_ENABLED=.*(\r?\n|$)/g, 'DOCLING_ENABLED=true$1');
    } else {
        envContent += `DOCLING_ENABLED=true\n`;
    }
    
    fs.writeFileSync(envFile, envContent);
    console.log('Updated .env file with Python configuration.');
}

// Run Python installation helper
function installDocling(pythonPath) {
    console.log('Running Docling installation helper...');
    
    return new Promise((resolve, reject) => {
        const installScript = path.join(doclingDir, 'install_docling.py');
        const pythonProcess = spawn(pythonPath, [installScript]);
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error: ${data.toString()}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Docling installation helper completed successfully.');
                resolve(true);
            } else {
                console.error(`Docling installation helper exited with code ${code}`);
                resolve(false);
            }
        });
    });
}

// Check if the required files exist
function checkRequiredFiles() {
    console.log('Checking required files...');
    
    const requiredFiles = [
        path.join(doclingDir, 'install_docling.py'),
        path.join(doclingDir, 'doc_processor.py'),
        path.join(doclingDir, 'README.md')
    ];
    
    let missingFiles = false;
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.error(`Missing required file: ${file}`);
            missingFiles = true;
        }
    }
    
    if (missingFiles) {
        console.error('Please ensure all required files are present in the docling directory.');
        return false;
    }
    
    return true;
}

// Main function
async function main() {
    console.log('========================================');
    console.log('Docling Setup for Discord Bot');
    console.log('========================================');
    
    // Ensure directories exist
    ensureDirectories();
    
    // Check required files
    if (!checkRequiredFiles()) {
        console.error('Setup failed: Missing required files.');
        rl.close();
        return;
    }
    
    // Check Python
    const pythonPath = checkPython();
    if (!pythonPath) {
        console.error('Setup failed: Python not found.');
        console.log('Please install Python 3.9 or later and try again.');
        rl.close();
        return;
    }
    
    // Update .env file
    updateEnvFile(pythonPath);
    
    // Ask user if they want to install Docling now
    rl.question('Do you want to install Docling now? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            const success = await installDocling(pythonPath);
            
            if (success) {
                console.log('========================================');
                console.log('Setup completed successfully!');
                console.log('Docling is now ready to use with your Discord bot.');
            } else {
                console.log('========================================');
                console.log('Setup completed with warnings.');
                console.log('You may need to manually install Docling:');
                console.log(`${pythonPath} -m pip install docling`);
            }
        } else {
            console.log('========================================');
            console.log('Setup completed. Docling installation skipped.');
            console.log('You can install Docling later by running:');
            console.log(`${pythonPath} -m pip install docling`);
        }
        
        console.log('========================================');
        rl.close();
    });
}

// Run the main function
main().catch(error => {
    console.error('An error occurred during setup:', error);
    rl.close();
}); 