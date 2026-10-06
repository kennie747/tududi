jest.mock('../../../../modules/oidc/service');
jest.mock('../../../../modules/oidc/provisioningService');
jest.mock('../../../../modules/oidc/auditService');
jest.mock('../../../../models', () => ({ User: { findByPk: jest.fn() } }));

const oidcService = require('../../../../modules/oidc/service');
const provisioningService = require('../../../../modules/oidc/provisioningService');
const { User } = require('../../../../models');
const controller = require('../../../../modules/oidc/controller');

describe('OIDC controller - handleCallback in link mode', () => {
    const res = () => ({ redirect: jest.fn() });

    beforeEach(() => jest.clearAllMocks());

    it('returns to an existing SPA route (Profile > OIDC/SSO tab) after linking', async () => {
        oidcService.handleCallback.mockResolvedValue({
            linkMode: true,
            claims: { sub: 'g-1', email: 'me@example.com' },
        });
        User.findByPk.mockResolvedValue({ id: 7 });
        provisioningService.linkIdentityToUser.mockResolvedValue({});
        const r = res();

        await controller.handleCallback(
            { params: { slug: 'google' }, query: {}, session: { userId: 7 } },
            r
        );

        expect(provisioningService.linkIdentityToUser).toHaveBeenCalledWith(
            7,
            'google',
            { sub: 'g-1', email: 'me@example.com' }
        );
        expect(r.redirect).toHaveBeenCalledWith(
            '/profile?section=oidc&success=linked'
        );
        expect(controller.LINK_SUCCESS_REDIRECT).not.toMatch(
            /^\/profile\/security/
        );
    });

    it('still sends unauthenticated link attempts to /login', async () => {
        oidcService.handleCallback.mockResolvedValue({
            linkMode: true,
            claims: { sub: 'g-1' },
        });
        const r = res();

        await controller.handleCallback(
            { params: { slug: 'google' }, query: {}, session: {} },
            r
        );

        expect(r.redirect.mock.calls[0][0]).toMatch(/^\/login\?error=/);
        expect(provisioningService.linkIdentityToUser).not.toHaveBeenCalled();
    });
});
