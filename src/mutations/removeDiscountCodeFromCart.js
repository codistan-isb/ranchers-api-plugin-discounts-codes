import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";
import getCart from "../util/getCart.js";

const inputSchema = new SimpleSchema({
  cartId: String,
  discountId: String,
  shopId: String,
  token: {
    type: String,
    optional: true
  }
});

/**
 * @summary Whether a cart billing discount entry matches any candidate id/code
 * @param {Object} billingDoc Cart billing entry
 * @param {String[]} candidates Discount document id, billing id, and/or promo code
 * @returns {Boolean} True when this billing entry should be removed
 */
function billingMatchesDiscount(billingDoc, candidates) {
  if (!billingDoc || !candidates?.length) return false;

  return candidates.some(
    (id) =>
      billingDoc._id === id ||
      billingDoc.data?.discountId === id ||
      billingDoc.data?.code === id
  );
}

/**
 * @method removeDiscountCodeFromCart
 * @summary Removes a discount code from a cart
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - an object of all mutation arguments that were sent by the client
 * @param {Object} input.cartId - Cart to remove discount from
 * @param {Object} input.discountId - Discount id, billing id, or promo code to remove
 * @param {String} input.shopId - Shop cart belongs to
 * @param {String} [input.token] - Cart token, if anonymous
 * @returns {Promise<Object>} An object with the updated cart with the removed discount
 */
export default async function removeDiscountCodeFromCart(context, input) {
  inputSchema.validate(input);

  const { cartId, discountId, shopId, token } = input;
  const { collections } = context;
  const { Cart, Discounts } = collections;

  let cart = await getCart(context, shopId, cartId, {
    cartToken: token,
    throwIfNotFound: false
  });

  // If we didn't find a cart via account/token selector, fall back to cart id
  // (same approach as applyDiscountCodeToCart).
  if (!cart) {
    cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
      throw new ReactionError("not-found", "Cart not found");
    }
  }

  if (!Array.isArray(cart.billing) || cart.billing.length === 0) {
    cart.billing = [];
    cart.discount = 0;
    return cart;
  }

  // Resolve all possible identifiers clients may send:
  // opaque/raw discount _id, promo code, or billing entry _id
  const matchCandidates = new Set([discountId]);
  const discount = await Discounts.findOne({
    $or: [{ _id: discountId }, { code: discountId }]
  });
  if (discount) {
    matchCandidates.add(discount._id);
    if (discount.code) matchCandidates.add(discount.code);
  }

  const updatedCartBilling = cart.billing.filter(
    (doc) => !billingMatchesDiscount(doc, [...matchCandidates])
  );

  // Idempotent: if nothing matched, return cart as-is instead of erroring
  if (cart.billing.length === updatedCartBilling.length) {
    return cart;
  }

  cart.billing = updatedCartBilling;
  if (cart.billing.length === 0) {
    cart.discount = 0;
  }

  const savedCart = await context.mutations.saveCart(context, cart);

  return savedCart;
}
