const prisma = require('../config/prisma');

// Check whether the user can access the tenant
const checkTenantAccess = async (userId, tenantId) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      OR: [
        { tenantId },
        {
          tenantId: null,
          role: 'ORG_ADMIN',
        },
      ],
    },
    include: {
      organization: {
        include: {
          tenants: true,
        },
      },
    },
  });

  if (!membership) {
    return false;
  }

  return membership.organization.tenants.some(
    (tenant) => tenant.id === tenantId
  );
};

// Create a board
const createBoard = async (req, res) => {
  try {
    const { name, tenantId } = req.body;

    if (!name || !tenantId) {
      return res.status(400).json({
        message: 'Board name and tenant ID are required',
      });
    }

    const hasAccess = await checkTenantAccess(
      req.user.userId,
      tenantId
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have access to this tenant',
      });
    }

    const board = await prisma.board.create({
      data: {
        name,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });

    res.status(201).json({
      message: 'Board created successfully',
      board,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not create board',
    });
  }
};

// Get boards for a tenant
const getBoards = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const hasAccess = await checkTenantAccess(
      req.user.userId,
      tenantId
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have access to this tenant',
      });
    }

    const boards = await prisma.board.findMany({
      where: { tenantId },
    });

    res.status(200).json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not fetch boards',
    });
  }
};

module.exports = { createBoard, getBoards };