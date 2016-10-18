var maxCommentLenght = 120;
var beginCommentsLimit = 1;


$('#sidebar').on('click',function(){
    $('.dropdown-toggle').each(function () {
      var $parent = getParent($(this));
      var relatedTarget = { relatedTarget: this };
      if (!$parent.hasClass('open')) return;
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
      if (e.isDefaultPrevented()) return;
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget)
    })
});

function getParent($this) {
    var selector = $this.attr('data-target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }
    var $parent = selector && $(selector);
    return $parent && $parent.length ? $parent : $this.parent()
  }


$('#featureModal').on('hidden.bs.modal', function () {
//    TODO: не зависить от класса
    $('.animate-item').removeClass('animate-item')
});

