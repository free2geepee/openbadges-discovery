var HumanView = require('human-view');
var templates = require('templates');

module.exports = HumanView.extend({
  template: templates.achievement,
  render: function (opts) {
    var container = opts.containerEl;
    this.renderAndBind();
    this.$el.appendTo(container);
  }
});
