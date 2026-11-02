
const prisma = require('../config/prisma');

// Check whether the user can access a board
const checkBoardAccess = async (userId, board) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
  });

  return memberships.some((membership) => {
    if (membership.organizationId !== board.organizationId) {
      return false;
    }

    if (
      membership.role === 'ORG_ADMIN' &&
      membership.tenantId === null
    ) {
      return true;
    }

    return membership.tenantId === board.tenantId;
  });
};

// Create a column
const createColumn = async (req, res) => {
  try {
    const { boardId, name, position } = req.body;

    if (!boardId || !name) {
      return res.status(400).json({
        message: 'Board ID and column name are required',
      });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const hasAccess = await checkBoardAccess(req.user.userId, board);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const column = await prisma.column.create({
      data: {
        name,
        position: position ?? 0,
        organizationId: board.organizationId,
        tenantId: board.tenantId,
        boardId: board.id,
      },
    });

    return res.status(201).json({
      message: 'Column created successfully',
      column,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not create column' });
  }
};

// Get columns for a board
const getColumns = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    console.log('DEBUG USER:', req.user.userId);
console.log('DEBUG BOARD:', board.id);
console.log('DEBUG MEMBERSHIPS:', await prisma.membership.findMany({
  where: { userId: req.user.userId },
}));
    const hasAccess = await checkBoardAccess(req.user.userId, board);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const columns = await prisma.column.findMany({
      where: {
        boardId: board.id,
        tenantId: board.tenantId,
        organizationId: board.organizationId,
      },
      orderBy: { position: 'asc' },
    });

    return res.status(200).json(columns);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not fetch columns' });
  }
};

// Update a column
const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { name, position } = req.body;

    const column = await prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const board = await prisma.board.findUnique({
      where: { id: column.boardId },
    });

    const hasAccess = board &&
      await checkBoardAccess(req.user.userId, board);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
      },
    });

    return res.status(200).json({
      message: 'Column updated successfully',
      column: updatedColumn,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not update column' });
  }
};

// Delete a column
const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const column = await prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const board = await prisma.board.findUnique({
      where: { id: column.boardId },
    });

    const hasAccess = board &&
      await checkBoardAccess(req.user.userId, board);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    return res.status(200).json({
      message: 'Column deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not delete column' });
  }
};

module.exports = {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
};
