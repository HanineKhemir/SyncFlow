export const NoteLine = {
  async lastEditedBy(parent: any, _args: any, context) {
    if (!parent.lastEditedById) return null; // ✅ handles nulls

    // Fetch only when needed
    return context.userService.findOne(parent.lastEditedById);
  }}
  export const Operation = {
  async performedBy(parent: any, _args: any, context) {
    if (!parent.performedById) return null;

    // Fetch only when needed
    return context.userService.findOne(parent.performedById);
  }
};
