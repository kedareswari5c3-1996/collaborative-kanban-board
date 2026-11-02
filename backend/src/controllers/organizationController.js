const prisma = require('../config/prisma');

const createOrganization = async (req, res) => {
  try {
    const { name, tenantName } = req.body;

    if (!name || !tenantName) {
      return res.status(400).json({
        message: 'Organization name and tenant name are required',
      });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        tenants: {
          create: {
            name: tenantName,
          },
        },
        memberships: {
          create: {
            userId: req.user.userId,
            role: 'ORG_ADMIN',
          },
        },
      },
      include: {
        tenants: true,
        memberships: true,
      },
    });

    res.status(201).json({
      message: 'Organization and tenant created successfully',
      organization,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not create organization',
    });
  }
};

const getOrganizations = async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        organization: {
          include: {
            tenants: true,
          },
        },
      },
    });

    res.json(memberships);
  } catch (error) {
    res.status(500).json({
      message: 'Could not fetch organizations',
    });
  }
};

module.exports = {
  createOrganization,
  getOrganizations,
};