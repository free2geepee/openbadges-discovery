var HumanView = require('human-view');
var templates = require('templates');

module.exports = HumanView.extend({
  template: templates.includes.dashTitle,
  initialize: function (opts) {
    this.backpack = opts.sources.backpack;
    this.wishlist = opts.sources.wishlist;
    this.pathways = opts.sources.pathways;
    this.listenToAndRun(this.backpack, 'add', this.render);
    this.listenToAndRun(this.wishlist, 'add', this.render);
    this.listenToAndRun(this.pathways, 'add', this.render);
  },
  render: function() {
    this.renderAndBind({
      backpack: this.backpack,
      wishlist: this.wishlist,
      pathways: this.pathways
    });
  }
});