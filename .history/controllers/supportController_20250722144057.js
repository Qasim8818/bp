const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = new SupportTicket({
      userId,
      subject,
      message,
      priority,
      status: 'open'
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await SupportTicket.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findOne({ _id: id, userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ _id: id, userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Cannot reply to closed ticket' });
    }

    ticket.replies.push({
      sender: 'user',
      message,
      timestamp: new Date()
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      ticket
    });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findOne({ _id: id, userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Ticket is already closed' });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket closed successfully',
      ticket
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
