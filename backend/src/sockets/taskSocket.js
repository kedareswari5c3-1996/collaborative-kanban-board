
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const registerTaskSocket = (io) => {
  // Verify the user's JWT before allowing a connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Authenticated user connected:', socket.userId);

    socket.on('joinTenant', async (tenantId) => {
      try {
        const memberships = await prisma.membership.findMany({
          where: { userId: socket.userId },
        });

        let hasAccess = false;

        for (const membership of memberships) {
          if (membership.tenantId === tenantId) {
            hasAccess = true;
            break;
          }

          if (
            membership.role === 'ORG_ADMIN' &&
            membership.tenantId === null
          ) {
            const tenant = await prisma.tenant.findFirst({
              where: {
                id: tenantId,
                organizationId: membership.organizationId,
              },
            });

            if (tenant) {
              hasAccess = true;
              break;
            }
          }
        }

        if (hasAccess) {
          socket.join(`tenant:${tenantId}`);
          socket.emit('joinedTenant', { tenantId });
          console.log(`User joined tenant: ${tenantId}`);
        } else {
          socket.emit('tenantAccessDenied');
        }
      } catch (error) {
        console.error('Tenant access error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
};

module.exports = registerTaskSocket;
