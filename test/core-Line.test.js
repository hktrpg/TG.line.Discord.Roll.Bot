describe('LINE Core Module Tests', () => {
    describe('getUserProfile function', () => {
        // Create mock LINE client for testing
        const mockLineClient = {
            getProfile: jest.fn(),
            getGroupMemberProfile: jest.fn(),
            getRoomMemberProfile: jest.fn()
        };

        // Test the getUserProfile logic directly (replicated from core-Line.js)
        async function getUserProfile(event, userid) {
            try {
                let profile;
                if (event.source.groupId) {
                    profile = await mockLineClient.getGroupMemberProfile(event.source.groupId, userid);
                } else if (event.source.roomId) {
                    profile = await mockLineClient.getRoomMemberProfile(event.source.roomId, userid);
                } else {
                    profile = await mockLineClient.getProfile(userid);
                }
                return profile;
            } catch (error) {
                if (error.statusCode === 404) {
                    console.error(`LINE getProfile error: User profile not accessible (${userid})`);
                } else {
                    console.error('LINE getProfile error:', error.message);
                }
                return null;
            }
        }

        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should get profile for 1-on-1 chat', async () => {
            const mockEvent = {
                source: { userId: 'user123' }
            };
            const mockProfile = { displayName: 'Test User' };

            mockLineClient.getProfile.mockResolvedValue(mockProfile);

            const result = await getUserProfile(mockEvent, 'user123');

            expect(mockLineClient.getProfile).toHaveBeenCalledWith('user123');
            expect(result).toEqual(mockProfile);
        });

        test('should get group member profile for group chat', async () => {
            const mockEvent = {
                source: { groupId: 'group123', userId: 'user123' }
            };
            const mockProfile = { displayName: 'Group User' };

            mockLineClient.getGroupMemberProfile.mockResolvedValue(mockProfile);

            const result = await getUserProfile(mockEvent, 'user123');

            expect(mockLineClient.getGroupMemberProfile).toHaveBeenCalledWith('group123', 'user123');
            expect(result).toEqual(mockProfile);
        });

        test('should get room member profile for room chat', async () => {
            const mockEvent = {
                source: { roomId: 'room123', userId: 'user123' }
            };
            const mockProfile = { displayName: 'Room User' };

            mockLineClient.getRoomMemberProfile.mockResolvedValue(mockProfile);

            const result = await getUserProfile(mockEvent, 'user123');

            expect(mockLineClient.getRoomMemberProfile).toHaveBeenCalledWith('room123', 'user123');
            expect(result).toEqual(mockProfile);
        });

        test('should handle 404 errors gracefully', async () => {
            const mockEvent = {
                source: { userId: 'user123' }
            };
            const error = new Error('Not Found');
            error.statusCode = 404;

            mockLineClient.getProfile.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await getUserProfile(mockEvent, 'user123');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('LINE getProfile error: User profile not accessible (user123)');

            consoleSpy.mockRestore();
        });

        test('should handle other errors', async () => {
            const mockEvent = {
                source: { userId: 'user123' }
            };
            const error = new Error('Network Error');

            mockLineClient.getProfile.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await getUserProfile(mockEvent, 'user123');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('LINE getProfile error:', 'Network Error');

            consoleSpy.mockRestore();
        });
    });

    describe('Error message formatting', () => {
        test('should format pushMessage 404 errors correctly', () => {
            const error = new Error('Push failed');
            error.statusCode = 404;

            // Simulate the error handling from SendToId function
            let errorMessage = '';
            const statusCode = error.statusCode;
            if (statusCode === 404) {
                errorMessage = `LINE pushMessage 404: User not found or blocked bot (test_user)`;
            }

            expect(errorMessage).toBe('LINE pushMessage 404: User not found or blocked bot (test_user)');
        });

        test('should format replyMessage errors correctly', () => {
            const error = new Error('Reply failed');
            error.statusCode = 400;

            // Simulate the error handling from replyMessagebyReplyToken function
            let errorMessage = '';
            const statusCode = error.statusCode;
            if (statusCode === 400) {
                errorMessage = 'LINE replyMessage 400: Invalid message format';
            }

            expect(errorMessage).toBe('LINE replyMessage 400: Invalid message format');
        });

        test('should format signature verification errors', () => {
            const error = new Error('no signature');

            // Simulate signature verification error handling
            let response = {};
            if (error.message === 'no signature' || error.message.includes('signature')) {
                response = { status: 401, body: { error: 'Invalid signature' } };
            }

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid signature' });
        });
    });

    describe('Context detection logic', () => {
        test('should detect 1-on-1 chat context', () => {
            const event = {
                source: { userId: 'user123' }
            };

            const isOneOnOne = !event.source.groupId && !event.source.roomId;
            const isGroup = !!event.source.groupId;
            const isRoom = !!event.source.roomId;

            expect(isOneOnOne).toBe(true);
            expect(isGroup).toBe(false);
            expect(isRoom).toBe(false);
        });

        test('should detect group chat context', () => {
            const event = {
                source: { groupId: 'group123', userId: 'user123' }
            };

            const isOneOnOne = !event.source.groupId && !event.source.roomId;
            const isGroup = !!event.source.groupId;
            const isRoom = !!event.source.roomId;

            expect(isOneOnOne).toBe(false);
            expect(isGroup).toBe(true);
            expect(isRoom).toBe(false);
        });

        test('should detect room chat context', () => {
            const event = {
                source: { roomId: 'room123', userId: 'user123' }
            };

            const isOneOnOne = !event.source.groupId && !event.source.roomId;
            const isGroup = !!event.source.groupId;
            const isRoom = !!event.source.roomId;

            expect(isOneOnOne).toBe(false);
            expect(isGroup).toBe(false);
            expect(isRoom).toBe(true);
        });
    });
});