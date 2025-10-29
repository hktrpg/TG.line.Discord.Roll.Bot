// 角色卡頁面生成腳本
// 使用方式: node generatePages.js [private|public|all]

const fs = require('fs');
const path = require('path');

// 導入配置管理器
const PageConfigManager = require('./pageConfigManager.js');

class PageGenerator {
    constructor() {
        this.baseTemplatePath = path.join(__dirname, 'baseCharacterCard.html');
        this.outputDir = path.join(__dirname, '..');
        this.configManager = new PageConfigManager();
    }

    // 生成頁面
    generatePage(pageType) {
        try {
            const config = this.configManager.generatePageConfig(pageType);
            const baseTemplate = fs.readFileSync(this.baseTemplatePath, 'utf8');
            
            let generatedContent = baseTemplate;

            // 替換模板變數
            for (const key of Object.keys(config)) {
                const placeholder = `{{${key}}}`;
                generatedContent = generatedContent.replaceAll(new RegExp(placeholder, 'g'), config[key]);
            }

            // 確定輸出文件名
            const filename = pageType === 'public' ? 'characterCardPublic.html' : 'characterCard.html';
            const outputPath = path.join(this.outputDir, filename);

            // 寫入文件
            fs.writeFileSync(outputPath, generatedContent, 'utf8');

            console.log(`✅ Generated ${filename} successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Error generating ${pageType} page:`, error.message);
            return false;
        }
    }

    // 生成所有頁面
    generateAll() {
        console.log('🚀 Generating character card pages...\n');
        
        const privateSuccess = this.generatePage('private');
        const publicSuccess = this.generatePage('public');
        
        console.log('\n📊 Generation Summary:');
        console.log(`Private Card: ${privateSuccess ? '✅ Success' : '❌ Failed'}`);
        console.log(`Public Card: ${publicSuccess ? '✅ Success' : '❌ Failed'}`);
        
        if (privateSuccess && publicSuccess) {
            console.log('\n🎉 All pages generated successfully!');
            return true;
        } else {
            console.log('\n⚠️  Some pages failed to generate');
            return false;
        }
    }

    // 驗證生成的文件
    validateGeneratedFiles() {
        const files = ['characterCard.html', 'characterCardPublic.html'];
        const results = {};

        for (const filename of files) {
            const filePath = path.join(this.outputDir, filename);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const hasTemplateVars = content.includes('{{');
                
                results[filename] = {
                    exists: true,
                    hasTemplateVars: hasTemplateVars,
                    size: content.length
                };
            } catch (error) {
                results[filename] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        console.log('\n🔍 Validation Results:');
        for (const filename of Object.keys(results)) {
            const result = results[filename];
            if (result.exists) {
                const status = result.hasTemplateVars ? '⚠️  Has template variables' : '✅ Valid';
                console.log(`${filename}: ${status} (${result.size} bytes)`);
            } else {
                console.log(`${filename}: ❌ Missing (${result.error})`);
            }
        }

        return results;
    }
}

// 主執行邏輯
function main() {
    const args = process.argv.slice(2);
    const pageType = args[0] || 'all';
    
    const generator = new PageGenerator();
    
    switch (pageType.toLowerCase()) {
        case 'private':
            generator.generatePage('private');
            break;
        case 'public':
            generator.generatePage('public');
            break;
        case 'all':
        default:
            generator.generateAll();
            break;
    }
    
    // 驗證生成的文件
    generator.validateGeneratedFiles();
}

// 如果直接執行此腳本
if (require.main === module) {
    main();
}

module.exports = PageGenerator;
