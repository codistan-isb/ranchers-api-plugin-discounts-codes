import ReactionError from "@reactioncommerce/reaction-error";

const DEAL_TAG_ID = "QxJefMA3viGnquk6Y";

/**
 * @summary Cart item is a deal (not ala carte)
 * @param {Object} item Cart item
 * @returns {Boolean} True when item is a deal
 */
function isDealItem(item) {
  return (
    item?.isDeal === true ||
    (Array.isArray(item?.productTagIds) && item.productTagIds.includes(DEAL_TAG_ID))
  );
}

/**
 * @name discounts/codes/credit
 * @method
 * @memberof Discounts/Codes/Methods
 * @summary calculates a credit off cart for discount codes
 * @param {String} cartId cartId
 * @param {String} discountId discountId
 * @param {Object} collections Map of MongoDB collections
 * @returns {Number} returns discount total
 */
export default async function getCreditOffDiscount(cartId, discountId, collections) {
  const { Cart, Discounts } = collections;

  const discountMethod = await Discounts.findOne({ _id: discountId });
  if (!discountMethod) throw new ReactionError("not-found", "Discount not found");

  // For "credit" type discount, the `discount` string is expected to parse as a float
  const discountAmount = Number(discountMethod.discount);
  if (isNaN(discountAmount)) throw new ReactionError("invalid", `"${discountMethod.discount}" is not a number`);

  const cart = await Cart.findOne({ _id: cartId });
  if (!cart) throw new ReactionError("not-found", "Cart not found");

  // Cap credit at ala carte subtotal so deals are not discounted
  const alaCarteSubtotal = (cart.items || []).reduce((sum, item) => {
    if (isDealItem(item)) return sum;
    return sum + (item.subtotal?.amount || 0);
  }, 0);

  return Math.min(discountAmount || 0, alaCarteSubtotal);
}
