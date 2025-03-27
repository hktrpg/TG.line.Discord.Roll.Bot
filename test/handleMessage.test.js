const { getReplyContent } = require('../modules/discord/handleMessage');

describe('Discord Handle Message Tests', () => {
    describe('getReplyContent Tests', () => {
        test('Returns empty string when no reference exists', async () => {
            const message = { reference: null };
            const result = await getReplyContent(message);
            expect(result).toBe('');
        });

        test('Returns message content when only content exists', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: 'Test content',
                            embeds: []
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('Test content\n');
        });

        test('Returns embed title and description when only embed exists', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: '',
                            embeds: [{
                                title: 'Test Title',
                                description: 'Test Description'
                            }]
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('Test Title\nTest Description\n');
        });

        test('Returns embed title when only title exists', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: '',
                            embeds: [{
                                title: 'Test Title'
                            }]
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('Test Title\n');
        });

        test('Returns embed description when only description exists', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: '',
                            embeds: [{
                                description: 'Test Description'
                            }]
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('Test Description\n');
        });

        test('Returns combined content when both embed and content exist', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: 'Test content',
                            embeds: [{
                                title: 'Test Title',
                                description: 'Test Description'
                            }]
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('Test Title\nTest Description\nTest content\n');
        });

        test('Handles fetch error gracefully', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockRejectedValue(new Error('Failed to fetch message'))
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('');
        });

        test('Handles empty embeds array', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: '',
                            embeds: []
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('');
        });

        test('Handles undefined embeds', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: ''
                        })
                    }
                }
            };
            const result = await getReplyContent(message);
            expect(result).toBe('');
            expect(message.channel.messages.fetch).toHaveBeenCalledWith('123');
        });

        test('Handles undefined content', async () => {
            const message = {
                reference: { messageId: '123' },
                channel: {
                    messages: {
                        fetch: jest.fn().mockResolvedValue({
                            content: undefined,
                            embeds: []
                        })
                    }
                }
            };

            const result = await getReplyContent(message);
            expect(result).toBe('');
            expect(message.channel.messages.fetch).toHaveBeenCalledWith('123');
        });
    });
}); 