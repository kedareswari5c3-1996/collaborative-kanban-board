
const prisma = require('../config/prisma');
const { getIO } = require('../config/socket');

const checkBoardAccess = async (userId, board) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
  });

  return memberships.some((membership) => {
    if (membership.organizationId !== board.organizationId) {
      return false;
    }

    return (
      (membership.role === 'ORG_ADMIN' && membership.tenantId === null) ||
      membership.tenantId === board.tenantId
    );
  });
};

// Create task
const createTask = async (req, res) => {
  try {
    const {
      columnId,
      title,
      description,
      status,
      priority,
      position,
      dueDate,
      assignedToId,
    } = req.body;

    if (!columnId || !title) {
      return res.status(400).json({
        message: 'Column ID and task title are required',
      });
    }

    const column = await prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const board = await prisma.board.findUnique({
      where: { id: column.boardId },
    });

    if (!board || !(await checkBoardAccess(req.user.userId, board))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        position: position ?? 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        createdById: req.user.userId,
        columnId: column.id,
        boardId: column.boardId,
        tenantId: column.tenantId,
        organizationId: column.organizationId,
      },
    });

    const io = getIO();

if (io) {
  io.to(`tenant:${task.tenantId}`).emit('taskCreated', task);
}

return res.status(201).json({
  message: 'Task created successfully',
  task,
});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not create task' });
  }
};

// Get tasks for a board
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board || !(await checkBoardAccess(req.user.userId, board))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        boardId: board.id,
        tenantId: board.tenantId,
        organizationId: board.organizationId,
      },
      orderBy: { position: 'asc' },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not fetch tasks' });
  }
};

// Update task

// Update task
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const {
      title,
      description,
      status,
      priority,
      position,
      dueDate,
      assignedToId,
      version,
      columnId,
    } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await prisma.board.findUnique({
      where: { id: task.boardId },
    });

    if (!board || !(await checkBoardAccess(req.user.userId, board))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check task version for concurrent updates
    if (version !== undefined && version !== task.version) {
      return res.status(409).json({
        message: 'Task was changed by someone else. Refresh and try again.',
        currentTask: task,
      });
    }

    // Validate destination column before moving a task
    if (columnId !== undefined) {
      const targetColumn = await prisma.column.findFirst({
        where: {
          id: columnId,
          boardId: task.boardId,
          tenantId: task.tenantId,
          organizationId: task.organizationId,
        },
      });

      if (!targetColumn) {
        return res.status(400).json({
          message: 'Invalid destination column',
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(position !== undefined && { position }),
        ...(columnId !== undefined && { columnId }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(assignedToId !== undefined && { assignedToId }),
        version: { increment: 1 },
      },
    });

    const io = getIO();

console.log('UPDATE EVENT:', updatedTask.id);
console.log('TENANT ROOM:', `tenant:${updatedTask.tenantId}`);

if (io) {
  io.to(`tenant:${updatedTask.tenantId}`).emit(
    'taskUpdated',
    updatedTask
  );
  console.log('TASK UPDATED EVENT EMITTED');
} else {
  console.log('SOCKET.IO INSTANCE NOT FOUND');
}

    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Could not update task',
    });
  }
};


// Delete task

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await prisma.board.findUnique({
      where: { id: task.boardId },
    });

    if (!board || !(await checkBoardAccess(req.user.userId, board))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Actually delete the task from the database
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Notify all users in the same tenant
    const io = getIO();

    if (io) {
      io.to(`tenant:${task.tenantId}`).emit('taskDeleted', {
        taskId: task.id,
      });
    }

    return res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Could not delete task',
    });
  }
};


module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
