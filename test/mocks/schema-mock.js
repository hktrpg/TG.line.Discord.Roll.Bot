/**
 * Mock for schema.js to avoid parsing issues with top-level return
 */

// Mock mongoose models
const mockModel = (name) => {
    const MockModel = jest.fn().mockImplementation((data) => ({
        _id: 'mock-id-' + Math.random(),
        save: jest.fn().mockResolvedValue({ _id: 'mock-id', ...data }),
        ...data
    }));

    MockModel.find = jest.fn().mockResolvedValue([]);
    MockModel.findOne = jest.fn().mockResolvedValue(null);
    MockModel.findOneAndUpdate = jest.fn().mockResolvedValue(null);
    MockModel.findOneAndDelete = jest.fn().mockResolvedValue(null);
    MockModel.countDocuments = jest.fn().mockResolvedValue(0);
    MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

    return MockModel;
};

// Mock all the schemas used in tests
const block = mockModel('block');
const randomAns = mockModel('randomAns');
const randomAnsPersonal = mockModel('randomAnsPersonal');
const randomAnsAllgroup = mockModel('randomAnsAllgroup');
const randomAnsServer = mockModel('randomAnsServer');
const trpgDatabase = mockModel('trpgDatabase');
const trpgDatabaseAllgroup = mockModel('trpgDatabaseAllgroup');
const trpgCommand = mockModel('trpgCommand');
const trpgLevelSystem = mockModel('trpgLevelSystem');
const trpgLevelSystemMember = mockModel('trpgLevelSystemMember');
const trpgDarkRolling = mockModel('trpgDarkRolling');
const chattest = mockModel('chattest');

module.exports = {
    block,
    randomAns,
    randomAnsPersonal,
    randomAnsAllgroup,
    randomAnsServer,
    trpgDatabase,
    trpgDatabaseAllgroup,
    trpgCommand,
    trpgLevelSystem,
    trpgLevelSystemMember,
    trpgDarkRolling,
    chattest
};