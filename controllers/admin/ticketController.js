const SupportTicket = require('../../models/SupportTicket');
const User = require('../../models/User');

// Get all tickets with filtering and pagination
exports.getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = req.query;

    let query = {};
    
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get ticket details
exports.getTicketDetails = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin reply to ticket
exports.adminReplyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: 'admin',
      content: message,
      timestamp: new Date()
    });

    await ticket.save();

    res.json({ message: 'Reply sent successfully', ticket });

  } catch (error) {
    console.error('Admin reply to ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket status updated', ticket });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign ticket to admin
exports.assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { assignedTo: adminId },
      { new: true }
    ).populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket assigned successfully', ticket });

  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get ticket statistics
exports.getTicketStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await SupportTicket.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTickets = await SupportTicket.countDocuments(dateQuery);
    const openTickets = await SupportTicket.countDocuments({ ...dateQuery, status: 'open' });
    const closedTickets = await SupportTicket.countDocuments({ ...dateQuery, status: 'closed' });

    res.json({
      totalTickets,
      openTickets,
      closedTickets,
      statusBreakdown: stats
    });

  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
