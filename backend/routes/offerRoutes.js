const express = require("express");
const {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
} = require("../controllers/offerController");

const router = express.Router(); // only once

router.get("/", getAllOffers);
router.post("/", createOffer);
router.put("/:id", updateOffer);
router.delete("/:id", deleteOffer);

module.exports = router;
