const Promo = require('../../models/Promo');

exports.createPromo = async (req, res) => {
  const promo = await Promo.create(req.body);
  res.json(promo);
};
