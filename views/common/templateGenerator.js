// Template generator for character card pages
// This script generates specific HTML pages from the base template

const fs = require('fs');
const path = require('path');

class CharacterCardTemplateGenerator {
    constructor() {
        this.baseTemplatePath = path.join(__dirname, 'baseCharacterCard.html');
        this.outputDir = path.join(__dirname, '..');
    }

    // Generate private character card page
    generatePrivateCard() {
        const config = {
            TITLE: "Character Card 角色卡",
            BODY_CLASS: "",
            CONTAINER_CLASS: "container-fluid px-3 px-md-4 py-3",
            VUE_CONTAINER_CLASS: "container-fluid px-3 px-md-4 py-3",
            IS_PUBLIC: false,
            PUBLIC_SOCKET_LISTENERS: ""
        };

        return this.generatePage(config, 'characterCard.html');
    }

    // Generate public character card page
    generatePublicCard() {
        const config = {
            TITLE: "Character Card 角色卡",
            BODY_CLASS: "center container",
            CONTAINER_CLASS: "container",
            VUE_CONTAINER_CLASS: "container",
            IS_PUBLIC: true,
            PUBLIC_SOCKET_LISTENERS: this.getPublicSocketListeners()
        };

        return this.generatePage(config, 'characterCardPublic.html');
    }

    // Generate page from template and config
    generatePage(config, filename) {
        try {
            const baseTemplate = fs.readFileSync(this.baseTemplatePath, 'utf8');
            let generatedContent = baseTemplate;

            // Replace template variables
            for (const key of Object.keys(config)) {
                const placeholder = `{{${key}}}`;
                generatedContent = generatedContent.replaceAll(new RegExp(placeholder, 'g'), config[key]);
            }

            // Write to output file
            const outputPath = path.join(this.outputDir, filename);
            fs.writeFileSync(outputPath, generatedContent, 'utf8');

            console.log(`Generated ${filename} successfully`);
            return true;
        } catch (error) {
            console.error(`Error generating ${filename}:`, error);
            return false;
        }
    }

    // Get public socket listeners template
    getPublicSocketListeners() {
        return `
        // Add socket event listener for public card list
        socket.on("getPublicListInfo", function (listInfo) {
            let list = listInfo.temp;
            if (list) {
                if (cardList && cardList.list) {
                    cardList.list = list;
                    $('#cardListModal').modal("show");
                    debugLog('Public card list loaded successfully', 'info');
                } else {
                    debugLog('CardList Vue app not initialized', 'error');
                }
            } else {
                debugLog('Failed to load public card list', 'error');
            }
        });

        // Add socket event listener for card selection
        socket.on("getPublicCardInfo", function (cardInfo) {
            if (cardInfo && cardInfo.temp) {
                const cardData = cardInfo.temp;
                card._id = cardData._id;
                card.id = cardData.id;
                card.name = cardData.name;
                card.state = cardData.state || [];
                card.roll = cardData.roll || [];
                card.notes = cardData.notes || [];
                card.public = cardData.public || false;
                $('#cardListModal').modal("hide");
                debugLog('Card data loaded successfully', 'info');
            } else {
                debugLog('Failed to load card data', 'error');
            }
        });

        // Update getTheSelectedOne function
        function getTheSelectedOne(index) {
            if (cardList && cardList.list && cardList.list[index]) {
                const selectedCard = cardList.list[index];
                socket.emit('getPublicCardInfo', {
                    cardId: selectedCard._id
                });
            } else {
                debugLog('Invalid card selection', 'error');
            }
        }

        // Add/Remove item functions
        function newItem(form) {
            switch (form) {
                case 0:
                    card.state.push({ itemA: "" });
                    break;
                case 1:
                    card.roll.push({ itemA: "" });
                    break;
                case 2:
                    card.notes.push({ itemA: "" });
                    break;
                default:
                    break;
            }
        }

        function removeItem(form) {
            switch (form) {
                case 0:
                    card.state.pop();
                    break;
                case 1:
                    card.roll.pop();
                    break;
                case 2:
                    card.notes.pop();
                    break;
                default:
                    break;
            }
        }`;
    }

    // Generate all pages
    generateAll() {
        console.log('Generating character card pages...');
        
        const privateSuccess = this.generatePrivateCard();
        const publicSuccess = this.generatePublicCard();
        
        if (privateSuccess && publicSuccess) {
            console.log('All pages generated successfully!');
            return true;
        } else {
            console.log('Some pages failed to generate');
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterCardTemplateGenerator;
}

// Auto-generate if run directly
if (require.main === module) {
    const generator = new CharacterCardTemplateGenerator();
    generator.generateAll();
}
