import ReactionError from "@reactioncommerce/reaction-error";
/**
 * @name discounts/codes/discount
 * @method
 * @memberof Discounts/Codes/Methods
 * @summary calculates percentage off discount rates
 * @param {String} cartId cartId
 * @param {String} discountId discountId
 * @param {Object} collections Map of MongoDB collections
 * @returns {Number} returns discount total
 */
export default async function getPercentageOffDiscount(
  cartId,
  discountId,
  collections
) {

  // console.log("in percentage discount")
  console.log(cartId, discountId);
  const { Cart, Discounts, Accounts, AllowedDomains } = collections;

  const discountMethod = await Discounts.findOne({ _id: discountId });
  if (!discountMethod)
    throw new ReactionError("not-found", "Discount not found");

  // For "discount" type discount, the `discount` string is expected to parse as a float, a percent
  const discountAmount = Number(discountMethod.discount);
  if (isNaN(discountAmount))
    throw new ReactionError(
      "invalid",
      `"${discountMethod.discount}" is not a number`
    );

  const cart = await Cart.findOne({ _id: cartId });
  if (!cart) throw new ReactionError("not-found", "Cart not found");
  let cartOwnerDetail = await Accounts.findOne({
    _id: cart.accountId,
  });
    let itemDiscount=discountMethod.discount;

  // let AllowedDomainsResp = await AllowedDomains.findOne({});
  // let customerEmail;
  // let discountDomains;
  // discountDomains = AllowedDomainsResp?.domains;

  // if (cartOwnerDetail) {
  //   // if (cartOwnerDetail?.emails[0]?.verified === true) {
  //   customerEmail = cartOwnerDetail?.emails[0]?.address;
  //   // }
  // }

  let discount = 0;
  // let customerDomain;
  // customerDomain = customerEmail?.split("@")[1];


   for (const item of cart.items) {
    // console.log(item);
      // if (discountDomains?.includes(customerDomain)) {
      // if (item.isDeal === true) {
      //   console.log("true");
      //   discount += (item.subtotal.amount * dealDiscount) / 100;
      // } else
       if (item.isDeal !=true) {
        console.log("Not true");
        discount += (item.subtotal.amount * itemDiscount) / 100;
      }
      // }
    }
    return Math.ceil(discount);

    
  // if (discountDomains?.includes(customerDomain)) {
  //   // let dealDiscount;
  //   if (AllowedDomainsResp) {
  //     // dealDiscount = Number(AllowedDomainsResp?.DealDiscount);
  //     itemDiscount = Number(AllowedDomainsResp?.ItemDiscount);
  //   }
  //   for (const item of cart.items) {
  //     // if (discountDomains?.includes(customerDomain)) {
  //     // if (item.isDeal === true) {
  //     //   console.log("true");
  //     //   discount += (item.subtotal.amount * dealDiscount) / 100;
  //     // } else
  //      if (item.isDeal === false) {
  //       console.log("Not true");
  //       discount += (item.subtotal.amount * itemDiscount) / 100;
  //     }
  //     // }
  //   }
  //   return discount;
  // } else {
  //   return discount;
  // }
}
