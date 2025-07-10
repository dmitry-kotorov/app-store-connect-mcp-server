import { validateRequired, sanitizeLimit } from '../utils/index.js';
export class BetaHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listBetaGroups(args = {}) {
        const { limit = 100 } = args;
        return this.client.get('/betaGroups', {
            limit: sanitizeLimit(limit),
            include: 'app,betaTesters'
        });
    }
    async listGroupTesters(args) {
        const { groupId, limit = 100 } = args;
        validateRequired(args, ['groupId']);
        return this.client.get(`/betaGroups/${groupId}/betaTesters`, {
            limit: sanitizeLimit(limit)
        });
    }

    async addTesterToGroup(args) {
        const { groupId, email, firstName, lastName } = args;
        validateRequired(args, ['groupId', 'email', 'firstName', 'lastName']);
        const requestBody = {
            data: {
                type: "betaTesters",
                attributes: {
                    email,
                    firstName,
                    lastName
                },
                relationships: {
                    betaGroups: {
                        data: [{
                                id: groupId,
                                type: "betaGroups"
                            }]
                    }
                }
            }
        };
        return this.client.post('/betaTesters', requestBody);
    }
    async removeTesterFromGroup(args) {
        const { groupId, testerId } = args;
        validateRequired(args, ['groupId', 'testerId']);
        const requestBody = {
            data: [{
                    id: testerId,
                    type: "betaTesters"
                }]
        };
        await this.client.delete(`/betaGroups/${groupId}/relationships/betaTesters`, requestBody);
        return {
            success: true,
            message: "Tester removed from group successfully"
        };
    }
}
