const SupportTicket = require('../models/SupportTicket');

// Create new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      category: category || 'general',
      messages: [{ sender: 'user', content: message }],
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'name email');

    res.json({ message: 'Ticket created successfully', ticket: populatedTicket });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reply to ticket
exports.replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket || ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Cannot reply to closed ticket' });
    }

    ticket.messages.push({ sender: 'user', content: message });
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'name email');

    res.json({ message: 'Reply sent successfully', ticket: populatedTicket });

  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { userId: req.user._id };
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
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
    console.error('Get user tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single ticket details
exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'name email');

    if (!ticket || ticket.userId._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Close ticket (user can close their own ticket)
exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id);
    if (!ticket || ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'closed';
    await ticket.save();

    res.json({ message: 'Ticket closed successfully', ticket });

  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
