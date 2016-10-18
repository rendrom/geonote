angular.module('templates.app', ['common/auth/login/login-form.html', 'common/auth/login/logout-form.html', 'common/auth/login/register-form.html', 'common/auth/login/toolbar.html', 'common/comment/templates/comment.html', 'common/comment/templates/comments.html', 'common/gallery/templates/gallery.html', 'common/gallery/templates/image.html', 'common/modal/templates/dialog.html', 'common/modal/templates/progress.html', 'common/print/print-table.html', 'common/toolbar/templates/toolbar.html', 'entries/detail/templates/detail.html', 'entries/detail/templates/form-widget/addr-input-auto-code.html', 'entries/detail/templates/form-widget/addr-input-auto-regioncode.html', 'entries/detail/templates/form-widget/addr-input-autocomplete.html', 'entries/detail/templates/form/fields/check-box-input.html', 'entries/detail/templates/form/fields/date-input.html', 'entries/detail/templates/form/fields/geom.html', 'entries/detail/templates/form/fields/input.html', 'entries/detail/templates/form/fields/latlng.html', 'entries/detail/templates/form/fields/time-input.html', 'entries/detail/templates/form/fields/typeahead-input.html', 'entries/detail/templates/form/form.html', 'entries/list/templates/entries-list.html', 'entries/list/templates/entries-table.html', 'entries/list/templates/entry-in-list.html', 'entries/manager/editor/base-form.html', 'entries/manager/editor/dynamit-field.html', 'entries/manager/editor/dynamit-fields.html', 'entries/manager/editor/dynamit-options.html', 'entries/manager/editor/editor-modal.html', 'entries/manager/templates/dynamit-in-list.html', 'entries/manager/templates/dynamit-list.html', 'entries/manager/templates/sidebar.html', 'entries/sidebar.html']);

angular.module("common/auth/login/login-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/login-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Войти</h4>\n" +
    "        </div>\n" +
    "        <form id=\"id_auth_form\">\n" +
    "            <div class=\"modal-body\">\n" +
    "                <fieldset>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label for=\"username\">Имя пользователя:</label>\n" +
    "                            <input ng-model=\"auth_user.username\" name=\"username\" required type=\"text\" class=\"form-control\" autofocus>\n" +
    "\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label for=\"password\">Пароль:</label>\n" +
    "                            <input ng-model=\"auth_user.password\" name=\"password\" required type=\"password\" class=\"form-control\">\n" +
    "                    </div>\n" +
    "                </fieldset>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "                <button type=\"submit\" ng-click=\"login()\" class=\"btn btn-primary\">Войти</button>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/logout-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/logout-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Выход</h4>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"modal-body\">\n" +
    "            <p>Вы уверены что хотите выитй?</p>\n" +
    "        </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"cancel()\">Отмена</button>\n" +
    "            <button type=\"submit\" class=\"btn btn-primary\" ng-click=\"logout()\">Выйти</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/register-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/register-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Регистрация</h4>\n" +
    "        </div>\n" +
    "        <form name=\"registerForm\">\n" +
    "            <div class=\"modal-body\">\n" +
    "                <fieldset>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.username.$invalid }\">\n" +
    "                        <label for=\"username\">Имя пользователя:</label>\n" +
    "                        <input ng-model=\"auth_user.username\" name=\"username\" required type=\"text\" autofocus\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.email.$invalid }\">\n" +
    "                        <label for=\"password\">Почта:</label>\n" +
    "                        <input ng-model=\"auth_user.email\" name=\"email\" required type=\"email\" server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.password.$invalid }\">\n" +
    "                        <label for=\"password\">Пароль:</label>\n" +
    "                        <input ng-model=\"auth_user.password\" name=\"password\" required type=\"password\"\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.password2.$invalid }\">\n" +
    "                        <label for=\"password\">Подтверждение пароля:</label>\n" +
    "                        <input ng-model=\"auth_user.password2\" name=\"password2\" required type=\"password\"\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                </fieldset>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "                <button type=\"submit\" ng-click=\"register()\" class=\"btn btn-primary\" ng-disabled=\"registerForm.$invalid\">\n" +
    "                    Зарегистрироваться\n" +
    "                </button>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/toolbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/toolbar.html",
    "<ul ng-cloak class=\"nav navbar-nav navbar-right container-fluid\">\n" +
    "    <li ng-show=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"logout()\">\n" +
    "            <i class=\"fa fa-power-off\"></i>&nbsp;&nbsp;{$ auth.user $}\n" +
    "        </a>\n" +
    "    </li>\n" +
    "    <li ng-hide=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"register()\">Регистрация\n" +
    "        </a>\n" +
    "    </li>\n" +
    "    <li ng-hide=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"login()\">\n" +
    "            <i class=\"fa fa-user\"></i>&nbsp;&nbsp;Вход\n" +
    "        </a>\n" +
    "    </li>\n" +
    "</ul>");
}]);

angular.module("common/comment/templates/comment.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/comment/templates/comment.html",
    "<div class=\"comment-block\">\n" +
    "    <div ng-hide=\"comment.editModeOn\">\n" +
    "        <p>{$ c.comment |limitTo: c.textLength $}\n" +
    "            <a ng-if=\"c.comment.length>=comments.commentLenght\" ng-click=\"changeCommentLength(c)\" class=\"show-more\">\n" +
    "                {$ c.readMoreText $}\n" +
    "            </a>\n" +
    "        </p>\n" +
    "        <span class=\"date sub-text\">{$ c.submit_date | date:'yyyy-MM-dd HH:mm'$}&nbsp;|</span>\n" +
    "        <span class=\"user sub-text\">&nbsp;{$ c.user $}&nbsp;</span>\n" +
    "        <span ng-if=\"auth.user == c.user || auth.is_superuser\">|&nbsp;\n" +
    "          <a href=\"\" ng-click=\"deleteComment(c.id)\"><i class=\"fa fa-trash-o delete-comment-btn\"></i></a>&nbsp;&nbsp;\n" +
    "        </span>\n" +
    "        <span ng-if=\"auth.user == c.user || auth.is_superuser\">|&nbsp;\n" +
    "          <a href=\"\" ng-click=\"editComment(comment)\"><i class=\"fa fa-pencil\"></i></a>&nbsp;&nbsp;\n" +
    "        </span>\n" +
    "    </div>\n" +
    "    <div ng-show=\"comment.editModeOn\" class=\"form-group\">\n" +
    "        <div>\n" +
    "            <form name=\"entryForm\" class=\"form-horizontal\" role=\"form\">\n" +
    "                <div>\n" +
    "                    <textarea class=\"form-control\" ng-model=\"c.comment\" id=\"description\" rows=\"2\" name=\"comment\" style=\"resize:vertical;\"></textarea>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "        <div style=\"margin-top: 5px\">\n" +
    "            <button class=\"btn btn-default pull-right\" ng-click=\"updateComment(c)\">Изменить комментирий</button>\n" +
    "            <button class=\"btn btn-default\" ng-click=\"cancelCommentEditing(comment)\">Отмена</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("common/comment/templates/comments.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/comment/templates/comments.html",
    "<div ng-show=\"comments.comments.length && enable\" class=\"comment-modal\">\n" +
    "    <a ng-if=\"comments.comments.length>1\" class=\"show-more more-comments\" ng-click=\"showAllComments()\">\n" +
    "        <div ng-show=\"comments.commentsLimit == comments.beginCommentsLimit\" >\n" +
    "            <span class=\"more-link\" tabindex=\"0\">\n" +
    "                <span class=\"link-text\">Показать&nbsp;комментарии&nbsp;({$ comments.comments.length $})&nbsp;</span>\n" +
    "            </span>\n" +
    "            <div class=\"more-arrow\">\n" +
    "                <i class=\"fa fa-angle-down more-arrow-img\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-hide=\"comments.commentsLimit == comments.beginCommentsLimit\">\n" +
    "            <span class=\"more-link\" tabindex=\"0\">\n" +
    "                <span ng-hide=\"comments.commentsLimit == comments.beginCommentsLimit\" class=\"link-text\">Скрыть комментарии&nbsp;</span>\n" +
    "            </span>\n" +
    "            <div class=\"more-arrow\">\n" +
    "                <i class=\"fa fa-angle-up more-arrow-img\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </a>\n" +
    "    <ul class=\"comment-list\" id=\"entry-comment-list\">\n" +
    "        <li ng-repeat=\"comment in comments.comments | limitTo:comments.commentsLimit\" class=\"animate animate-item\">\n" +
    "            <div data-comment-item data-comment=\"comment\" data-comment-lenght=\"commentLenght\"></div>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div>");
}]);

angular.module("common/gallery/templates/gallery.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/gallery/templates/gallery.html",
    "<div class=\"gallery-widget\"\n" +
    "     ng-file-drop\n" +
    "     ng-file-change=\"upload($files)\"\n" +
    "     drag-over-class=\"dragover\"\n" +
    "     ng-multiple=\"true\"\n" +
    "     accept=\".jpg, .png, .tiff\">\n" +
    "\n" +
    "    <div ng-show=\"images && images.length\">\n" +
    "        <ul rn-carousel >\n" +
    "            <li ng-repeat=\"image in images\">\n" +
    "                <div ng-style=\"{'background-image': 'url(' + image.thumb + ')'}\" class=\"bgimage\">\n" +
    "                    <a  ng-if=\"canedit\" href=\"\" ng-click=\"deleteImage(image.id)\">\n" +
    "                        <i class=\"fa fa-trash-o delete-image-btn\"></i></a>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "    <div class=\"app-photos\"\n" +
    "         ng-file-select\n" +
    "         ng-file-change=\"upload($files)\"\n" +
    "         ng-multiple=\"true\"\n" +
    "         accept=\".jpg, .png, .tiff\"\n" +
    "         ng-if=\"canedit\">\n" +
    "        Добавить фотографии\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("common/gallery/templates/image.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/gallery/templates/image.html",
    "<div>\n" +
    "\n" +
    "    <img ng-src=\"{$image.thumb$}\" class=\"img-responsive\" alt=\"Responsive image\">\n" +
    "\n" +
    "</div>");
}]);

angular.module("common/modal/templates/dialog.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/modal/templates/dialog.html",
    "<div ng-show=\"modalOptions.headerText\" class=\"modal-header\">\n" +
    "  <h3>{$ modalOptions.headerText $}</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "  <p>{$ modalOptions.bodyText $}</p>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "  <button type=\"button\" class=\"btn\"\n" +
    "          data-ng-click=\"modalOptions.close()\">{$ modalOptions.closeButtonText $}</button>\n" +
    "  <button class=\"btn btn-primary\"\n" +
    "          data-ng-click=\"modalOptions.ok();\">{$ modalOptions.actionButtonText $}</button>\n" +
    "</div>\n" +
    "");
}]);

angular.module("common/modal/templates/progress.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/modal/templates/progress.html",
    "<div class=\"modal-content\">\n" +
    "<div class=\"modal-header\">\n" +
    "    <button class=\"close\" type=\"button\"  ng-click=\"closeModal()\">&times;</button>\n" +
    "    <h4 class=\"modal-title\">{$ title $}</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <progressbar class=\"progress-striped active\" value=\"progressbar.progress\"></progressbar>\n" +
    "</div>\n" +
    "    </div>");
}]);

angular.module("common/print/print-table.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/print/print-table.html",
    "<tr ng-repeat=\"field in fields\" ng-show=\"entryForExport[field]\"><th>{$ entryForExport.meta.verbose_name[field] $}</th><td>{$ entryForExport[field] $}</td></tr>");
}]);

angular.module("common/toolbar/templates/toolbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/toolbar/templates/toolbar.html",
    "<li class=\"dropdown\" ng-cloak ng-show=\"Entries.model\">\n" +
    "    <a id=\"toolsDrop\" role=\"button\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "        &nbsp;&nbsp;Инструменты <b class=\"caret\"></b>\n" +
    "    </a>\n" +
    "    <ul class=\"dropdown-menu\">\n" +
    "        <li><a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\"\n" +
    "               ng-click=\"showFullExtent()\">\n" +
    "            <i class=\"fa fa-arrows-alt\"></i>&nbsp;&nbsp;Вся карта</a>\n" +
    "        </li>\n" +
    "        <li><a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\" ng-click=\"bboxSearchMode()\">\n" +
    "            <i class=\"fa fa-square-o\"></i>&nbsp;&nbsp;Выбрать прямоугольником</a>\n" +
    "        </li>\n" +
    "        <li ng-if=\"(Entries.queryEntryCount && Entries.baseEntryCount != Entries.queryEntryCount)||(is_filter)\">\n" +
    "            <a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\" href=\"\" ng-click=\"cleanSelection()\">\n" +
    "                <i class=\"fa fa-ban\"></i>&nbsp;&nbsp;Сбросить выборку</a>\n" +
    "        </li>\n" +
    "        <li ng-if=\"(auth.user && auth.user===Entries.dynamit.user)\">\n" +
    "            <a href=\"\" ng-click=\"goToCreatePage()\" data-toggle=\"collapse\" data-target=\".navbar-collapse.in\">\n" +
    "                <i class=\"fa fa-plus-square\"></i>&nbsp;&nbsp;{$ NAMES.entry.create_short $}</a>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</li>");
}]);

angular.module("entries/detail/templates/detail.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/detail.html",
    "<div ng-if=\"!!entry\" class=\"panel panel-default\" id=\"feature\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6 col-lg-7':!emap.sidebar_is_narrow, 'col-xs-8 col-lg-10':emap.sidebar_is_narrow}\">\n" +
    "                        <span ng-show=\" NAMES.entry.short_name\">{$ NAMES.entry.short_name $}:</span>\n" +
    "                        <span ng-show=\"entry.entryid\" class=\"animate entryid-animate\">{$ entry.entryid | truncate $}</span>\n" +
    "                </div>\n" +
    "                <div ng-hide=\"emap.sidebar_is_narrow\" class=\"col-xs-3 col-lg-3\" ng-init=\"previous=null; next=null;\">\n" +
    "                    <span ng-show=\"previous\"><a href=\"\" ng-click=\"goToDetail(previous)\" title=\"Предыдущий платёжный терминал\">\n" +
    "                        <i class=\"fa fa-angle-double-left\"></i></a>\n" +
    "                    </span>\n" +
    "                    <span ng-show=\"brothers\" ><small>{$ num_in_cluster $}/{$ brothers.length $}</small></span>\n" +
    "                    <span ng-show=\"next\"><a href=\"\" ng-click=\"goToDetail(next)\" title=\"Следующий платёжный терминал\">\n" +
    "                        <i class=\"fa fa-angle-double-right\"></i></a>\n" +
    "                    </span>\n" +
    "                </div>\n" +
    "                <div  class=\"col-xs-2 col-lg-1\">\n" +
    "                    <div class=\"dropdown ico-dropdown\" ng-show=\"entry.user == auth.user || auth.is_superuser\" style=\"display:inline-block;\">\n" +
    "                      <a href=\"\" class=\"dropdown-toggle\">\n" +
    "                          <i class=\"fa fa-gears action-ico\" data-toggle=\"dropdown\"\n" +
    "                             onclick=\"$('.dropdown-toggle').dropdown();\"></i></a>\n" +
    "                      <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                          <li role=\"presentation\" ng-show=\"entry.geom\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"showOnTheMap(entry.id)\">\n" +
    "                                  <i class=\"fa fa-map-marker\"></i>&nbsp;&nbsp;Показать на карте</a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\" ng-hide=\"editmode || createmode\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"uploadEntry(entry.id)\">\n" +
    "                                  <i class=\"fa fa-upload\" ></i>&nbsp;&nbsp;Экспортировать</a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"toggleEdit(entry.id)\">\n" +
    "                                  <i class=\"fa fa-pencil\"></i>&nbsp;&nbsp;\n" +
    "                                  <span ng-hide=\"editmode\">Редактировать</span>\n" +
    "                                  <span ng-show=\"editmode\">Отключить редактирование</span>\n" +
    "                              </a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\">\n" +
    "                            <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteEntry(entry.id)\">\n" +
    "                             <i class=\"fa fa-trash-o\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                          </li>\n" +
    "                      </ul>\n" +
    "                    </div>\n" +
    "                    <div ng-hide=\"entry.user == auth.user || auth.is_superuser\" style=\"display:inline-block;\">\n" +
    "                        <a href=\"\" ng-click=\"showOnTheMap(entry.id)\"><i ng-show=\"entry.geom\" class=\"fa fa-map-marker action-ico\"\n" +
    "                                   data-toggle=\"tooltip\" data-placement=\"left\" title=\"Показать на карте\"></i></a>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-1 col-lg-1':!emap.sidebar_is_narrow, 'col-xs-2 col-lg-1':emap.sidebar_is_narrow}\">\n" +
    "                    <a href=\"\" ng-click=\"backToList()\" title=\"Закрыть панель\">\n" +
    "                    <i class=\"fa fa-chevron-left action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div  class=\"sidebar-body sidebar-body-detail\">\n" +
    "        <div ng-show=\"emap.sidebar_is_narrow && brothers\" class=\"panel-body row top-of-list\" ng-init=\"previous=null; next=null;\">\n" +
    "            <div  class=\"col-xs-4\"><button class=\"btn btn-default btn-xs\" ng-click=\"goToDetail(previous)\" ng-show=\"previous\" title=\"Предыдущий платёжный терминал\">\n" +
    "                <i class=\"fa fa-angle-double-left\"></i></button>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-4 text-center changer-center\">{$ num_in_cluster $}/{$ brothers.length $}</div>\n" +
    "            <div class=\"col-xs-4\"><button class=\"btn btn-default btn-xs pull-right\" ng-click=\"goToDetail(next)\" ng-show=\"next\" title=\"Следующий платёжный терминал\">\n" +
    "                <i class=\"fa fa-angle-double-right\"></i></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\" id=\"feature-info\">\n" +
    "\n" +
    "            <div entry-attr data-entry=\"entry\" data-editmode=\"editmode\"></div>\n" +
    "\n" +
    "            <div ng-if=\"Entries.dynamit.photo_gallery\"\n" +
    "                 gallery-list data-entry=\"entry\"\n" +
    "                 data-canedit = \"auth.user === entry.user\"\n" +
    "                 data-enable=\"!editmode\"\n" +
    "                 data-dimensions=\"400x200\"></div>\n" +
    "\n" +
    "            <div ng-if=\"Entries.dynamit.can_comment\" comment-list data-entry=\"entry\" data-enable=\"!editmode\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div ng-cloak class=\"panel-footer\">\n" +
    "        <div class=\"input-group\" ng-hide=\"editmode || !Entries.dynamit.can_comment\">\n" +
    "            <input ng-hide=\"auth.user\" type=\"text\" class=\"form-control comment-input\" readonly placeholder=\"Войдите, чтобы оставить комментарий\">\n" +
    "            <input ng-model=\"comment\" ng-show=\"auth.user\" type=\"text\" class=\"form-control comment-input\" placeholder=\"Оставить комментарий...\">\n" +
    "                <span class=\"input-group-btn\">\n" +
    "                <button ng-click=\"createComment(comment, entry.id)\" class=\"btn btn-default\" type=\"button\">Отправить</button>\n" +
    "                </span>\n" +
    "        </div><!-- /input-group -->\n" +
    "\n" +
    "        <div ng-show=\"editmode || createmode\">\n" +
    "            <button ng-click=\"cancelEditing()\" class=\"btn btn-default pull-left\" type=\"button\">Отменить</button>\n" +
    "            <button ng-click=\"createOrUpdate()\" ng-disabled=\"entryForm.$invalid\" class=\"btn btn-primary pull-right\"  type=\"button\">\n" +
    "                <span ng-show=\"editmode && !createmode\">Обновить</span>\n" +
    "                <span ng-show=\"createmode\">Добавить</span>\n" +
    "            </button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div id=\"id_geom\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"!entry\">\n" +
    "    <div class=\"loading-details\">\n" +
    "        Загрузка...\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-auto-code.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-auto-code.html",
    "<a tabindex=\"-1\">\n" +
    "    <span bind-html-unsafe=\"match.label.code| typeaheadHighlight:query\"></span>\n" +
    "    <span><small><br>{$ match.label.full_name $}</small></span>\n" +
    "    <span><small>{$ match.label.rel_name $}</small></span>\n" +
    "</a>\n" +
    "");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-auto-regioncode.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-auto-regioncode.html",
    "<a tabindex=\"-1\" bind-html-unsafe=\"(match.label.regioncode+' '+match.label.full_name )| typeaheadHighlight:query\"></a>\n" +
    "\n" +
    "");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-autocomplete.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-autocomplete.html",
    "<a tabindex=\"-1\" class=\"autocomplete-list\">\n" +
    "    <span bind-html-unsafe=\"match.label.full_name| typeaheadHighlight:query\"></span>\n" +
    "    <span><small><br>{$ match.label.rel_name $}</small></span>\n" +
    "</a>");
}]);

angular.module("entries/detail/templates/form/fields/check-box-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/check-box-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input class=\"attr-input\" name=\"{$field$}\" ng-model=\"entry[field]\"\n" +
    "                   type=\"{$ type $}\"/>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/date-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/date-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <div class=\"input-group\">\n" +
    "                <input type=\"text\" class=\"form-control\" datepicker-popup=\"{$ format $}\" ng-model=\"entry[field]\"\n" +
    "                       is-open=\"opened\" datepicker-options=\"dateOptions\" server-error ng-change=\"formatDate()\"\n" +
    "                       ng-required=\"required\" close-text=\"Close\"/>\n" +
    "              <span class=\"input-group-btn\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" ng-click=\"open($event)\"><i\n" +
    "                        class=\"glyphicon glyphicon-calendar\"></i></button>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/geom.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/geom.html",
    "<button ng-hide=\"entry.geom\" ng-click=\"drawNewEntryMarker()\" id=\"entry-draw-btn\" class=\"btn btn-default btn-xs pull-left\" type=\"button\">\n" +
    "    <span ng-hide=\"drawNewMarkerMode\">Указать местоположение</span>\n" +
    "    <span ng-show=\"drawNewMarkerMode\">Отменить</span>\n" +
    "</button>\n" +
    "<div ng-show=\"entry.geom\">\n" +
    "    <div>\n" +
    "        <button ng-click=\"triggerEntryMarkerEdit()\" class=\"btn btn-default btn-xs pull-left\" type=\"button\">\n" +
    "            <span ng-hide=\"geomEditMode\">Изменить местоположение</span>\n" +
    "            <span ng-show=\"geomEditMode\">Закончить редакирование</span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form/fields/input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input class=\"form-control attr-input\" name=\"{$field$}\" ng-model=\"entry[field]\"\n" +
    "                   type=\"{$ type $}\" ng-required=\"\" server-error ng-maxlength=\"max_length\"/>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/latlng.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/latlng.html",
    "<input name=\"coordinates\" type=\"text\" class=\"form-control attr-input\" placeholder=\"широта, долгота\"\n" +
    "       ng-model=\"entry.coordinates\" ng-change=\"getGeometryFromCoordInput(entry)\" ng-focus=\"cancelEntryMarkerEdit()\">");
}]);

angular.module("entries/detail/templates/form/fields/time-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/time-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-xs-6\">\n" +
    "                    Hours step is:\n" +
    "                    <select class=\"form-control\" ng-model=\"hstep\" ng-options=\"opt for opt in options.hstep\"></select>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-6\">\n" +
    "                    Minutes step is:\n" +
    "                    <select class=\"form-control\" ng-model=\"mstep\" ng-options=\"opt for opt in options.mstep\"></select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form/fields/typeahead-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/typeahead-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input ng-init=\"entryAddr[field] = entry[field]\"\n" +
    "                   class=\"form-control attr-input\"\n" +
    "                   type=\"text\" name=\"{$field$}\" ng-model=\"entryAddr[field]\" autocomplete=\"off\"\n" +
    "                   typeahead=\"address for address in addressAutocomplate($viewValue, field, panel)\"\n" +
    "                   typeahead-input-formatter=\"formatAddr($model, field)\"\n" +
    "                   typeahead-on-select=\"onAddressSelect($item, $model, $label, field, panel)\"\n" +
    "                   typeahead-template-url=\"{$ getTypeheadTemplate(field) $}\"\n" +
    "                   typeahead-min-length=\"{$ getTypeheadMinLength(field) $}\"\n" +
    "                   typeahead-wait-ms=\"600\">\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("entries/detail/templates/form/form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/form.html",
    "<div class=\"panel-group\" id=\"accordion\" role=\"tablist\" aria-multiselectable=\"true\">\n" +
    "    <form name=\"entryForm\" id=\"entryform\">\n" +
    "        <div class=\"panel panel-default\" ng-repeat=\"panel in panels\">\n" +
    "            <div class=\"panel-heading\" role=\"tab\" id=\"{$panel.id$}\" ng-init=\"panel.collapsed = is_collapsed(panel)\">\n" +
    "                <h4 class=\"panel-title\">\n" +
    "                    <a data-toggle=\"collapse\" data-parent=\"#accordion\" ng-click=\"collapseToggle(panel)\">\n" +
    "                        <span>{$panel.title$}</span>\n" +
    "                    <span><i class=\"fa pull-right\"\n" +
    "                             ng-class=\"{'fa-chevron-down':panel.collapsed, 'fa-chevron-up':!panel.collapsed}\"></i>\n" +
    "                    </span>\n" +
    "                    </a>\n" +
    "                </h4>\n" +
    "            </div>\n" +
    "            <div id=\"collapse{$panel.id$}\" class=\"panel-collapse collapse\" ng-class=\"{'in': !panel.collapsed}\"\n" +
    "                 role=\"tabpanel\" aria-labelledby=\"headingOne\">\n" +
    "                <div>\n" +
    "                    <table class='table table-condensed'>\n" +
    "                        <tr ng-repeat=\"field in panel.fields\" ng-form=\"entryFieldForm-{$ field $}\"\n" +
    "                            ng-show=\"((entryMeta[field] || panel['custom_edit_template'][field]) && (createmode || editmode)) ||\n" +
    "                            (entry[field] && !editmode && !(panel.edit_only && panel.edit_only.indexOf(field)>-1))\">\n" +
    "                            <th class=\"attr-row-title\">{$ entryMeta[field]['label'] $}</th>\n" +
    "                            <td ng-if=\"!editmode\">{$ entry[field] $}</td>\n" +
    "                            <td ng-if=\"editmode\">\n" +
    "                                <div input-control></div>\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                    </table>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </form>\n" +
    "</div>");
}]);

angular.module("entries/list/templates/entries-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entries-list.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-if=\"(auth.user && auth.user===Entries.dynamit.user)\">\n" +
    "                <td class=\"create-entry-cell\" ng-click=\"goToCreatePage()\" title=\"{$ NAMES.entry.create $}\">\n" +
    "                    <span><i class=\"glyphicon glyphicon-plus create-ico\" ></i></span>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "            <tr ng-repeat=\"e in entries\" class=\"animate\" ng-class=\"{'animate-item':!appConf.previousEntry}\" id=\"entry-{$e.id$}\">\n" +
    "                <td entry-in-list data-entry=\"e\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    <div ng-if=\"nextPage\" ng-click=\"showMore()\" class=\"box-content\">\n" +
    "        <button class=\"btn btn-default center-block show-more-btn\" data-loading-text=\"Загрузка...\">\n" +
    "            Загрузить ещё\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/list/templates/entries-table.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entries-table.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-repeat=\"e in entries\" class=\"animate\" ng-class=\"{'animate-item':!appConf.previousEntry}\" id=\"entry-{$e.id$}\">\n" +
    "                <td entry-in-list data-entry=\"e\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    <div ng-if=\"nextPage\" ng-click=\"showMore()\" class=\"box-content\">\n" +
    "        <button class=\"btn btn-default center-block show-more-btn\" data-loading-text=\"Загрузка...\">\n" +
    "            Загрузить ещё\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/list/templates/entry-in-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entry-in-list.html",
    "<td class=\"feature-name\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <a class=\"inherit-color\" href=\"\" ng-click=\"goToDetail(e.id)\">{$ ::e.entryListName $}</a>\n" +
    "        </div>\n" +
    "        <div  class=\"col-xs-3 ico-in-list ico-part\">\n" +
    "            <div class=\"ico-dropdown list-ico dropdown\" ng-show=\"e.user == auth.user || auth.is_superuser\">\n" +
    "               <div class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                  <i class=\"fa fa-gears action-ico\"\n" +
    "                     onclick=\"angular.element('.dropdown-toggle').dropdown();\"></i></div>\n" +
    "              <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"goToDetail(e.id)\">\n" +
    "                          <i class=\"fa fa-info-circle action-ico\"></i>&nbsp;&nbsp;Информация</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"startEdit(e.id)\">\n" +
    "                          <i class=\"fa fa-pencil action-ico\" ></i>&nbsp;&nbsp;Редактировать</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                    <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteEntry(e.id, e.entryid)\">\n" +
    "                     <i class=\"fa fa-trash-o action-ico\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                  </li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "            <div ng-hide=\"e.user == auth.user || auth.is_superuser\" class=\"list-ico\">\n" +
    "                <i class=\"fa fa-info-circle action-ico\" title=\"Информация\" ng-click=\"goToDetail(e.id)\"></i>\n" +
    "            </div>\n" +
    "            <div class=\"list-ico\">\n" +
    "               <i ng-show=\"e.geom\" ng-click=\"showOnTheMap(e.id)\"\n" +
    "                  class=\"fa fa-map-marker action-ico\" data-placement=\"left\" title=\"Показать на карте\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</td>");
}]);

angular.module("entries/manager/editor/base-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/base-form.html",
    "<form name=\"baseForm\">\n" +
    "    <fieldset>\n" +
    "        <div class=\"row\">\n" +
    "            <!-- Name -->\n" +
    "            <div class=\"form-group col-xs-6\" ng-class=\"{'has-error': dynamitForm.baseForm.name.$invalid }\">\n" +
    "                <label class=\"control-label\" for=\"name\">{$ meta.actions['name'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <input id=\"name\" name=\"name\" ng-model=\"dynamit.name\" type=\"text\" placeholder=\"\"\n" +
    "                           class=\"form-control\" required=\"\" server-error\n" +
    "                           ng-maxlength=\"meta.actions['name'].max_length\" ng-change=\"slugify(dynamit)\">\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['name'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['name'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <!-- Slug -->\n" +
    "            <div class=\"form-group col-xs-6\" ng-class=\"{'has-error': dynamitForm.baseForm.slug.$invalid }\">\n" +
    "                <label class=\"control-label\" for=\"slug\">{$ meta.actions['slug'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <input id=\"slug\" name=\"slug\" ng-model=\"dynamit.slug\" type=\"text\" placeholder=\"\"\n" +
    "                           class=\"form-control\" required=\"\" server-error ng-change=\"selfslugify(dynamit)\"\n" +
    "                           ng-maxlength=\"meta.actions['slug'].max_length\">\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['slug'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['slug'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <!-- Descriptions -->\n" +
    "        <div class=\"form-group\">\n" +
    "            <label class=\"control-label\" for=\"description\">{$ meta.actions['description'].label $}</label>\n" +
    "\n" +
    "            <div class=\"controls\">\n" +
    "                <textarea id=\"description\" ng-model=\"dynamit.description\" name=\"description\"\n" +
    "                          class=\"form-control\" rows=\"2\"></textarea>\n" +
    "\n" +
    "                <p ng-if=\"meta.actions['description'].help_text\"\n" +
    "                   class=\"help-block\">{$ meta.actions['description'].help_text $}</p>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </fieldset>\n" +
    "</form>");
}]);

angular.module("entries/manager/editor/dynamit-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-field.html",
    "<tr class=\"tr-block\">\n" +
    "    <td class=\"drag-block\" ng-show=\"candrag\"><i class=\"fa fa-sort\"></i></td>\n" +
    "    <td>\n" +
    "        <input name=\"verbose_name\" ng-model=\"f.verbose_name\" type=\"text\" placeholder=\"\"\n" +
    "               class=\"form-control input-block-level\" required=\"\" server-error ng-change=\"slugify(f)\"\n" +
    "               ng-maxlength=\"meta['verbose_name'].max_length\">\n" +
    "    </td>\n" +
    "    <td>\n" +
    "        <input name=\"name\" ng-model=\"f.name\" type=\"text\" placeholder=\"\"\n" +
    "               class=\"form-control input-block-level\" required=\"\" ng-change=\"selfslugify(f)\"\n" +
    "               ng-maxlength=\"meta['name'].max_length\">\n" +
    "    </td>\n" +
    "    <td>\n" +
    "        <select name=\"field_type\" ng-model=\"f.field_type\" class=\"form-control input-block-level\" required>\n" +
    "            <option ng-repeat=\"c in meta['field_type']['choices']\" value=\"{$c.value$}\"\n" +
    "                    ng-selected=\"f.field_type === c.value\">{$c.display_name$}</option>\n" +
    "        </select>\n" +
    "    </td>\n" +
    "\n" +
    "    <td class=\"trash-block\"><a href=\"\" ng-click=\"removeField(f)\">\n" +
    "        <i class=\"fa fa-trash-o \"></i></a></td>\n" +
    "</tr>\n" +
    "");
}]);

angular.module("entries/manager/editor/dynamit-fields.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-fields.html",
    "<div ng-if=\"meta.actions['fields']\">\n" +
    "    <div ng-show='false' ng-click=\"candrag = !candrag\">\n" +
    "        <span ng-show=\"candrag\"><i class=\"fa fa-toggle-on\"></i>&nbsp;Выключить сортировку полей</span>\n" +
    "        <span ng-hide=\"candrag\"><i class=\"fa fa-toggle-off\"></i>&nbsp;Включить сортировку полей</span>\n" +
    "    </div>\n" +
    "    <form name=\"fieldsForm\" ng-if=\"dynamit.fields.length\">\n" +
    "        <table class=\"input-block-level\">\n" +
    "            <thead>\n" +
    "                <tr>\n" +
    "                    <th ng-show=\"candrag\"></th>\n" +
    "                    <th>{$ meta.actions['fields']['verbose_name'].label $}</th>\n" +
    "                    <th>{$ meta.actions['fields']['name'].label $}</th>\n" +
    "                    <th>{$ meta.actions['fields']['field_type'].label $}</th>\n" +
    "                </tr>\n" +
    "            </thead>\n" +
    "            <tbody ui-sortable=\"sortableOptions\" ng-model=\"dynamit.fields\" class=\"list\">\n" +
    "                <tr ng-repeat=\"field in dynamit.fields\"\n" +
    "                    dynamit-field\n" +
    "                    data-field=\"field\"\n" +
    "                    data-candrag=\"candrag\"\n" +
    "                    data-meta=\"meta.actions['fields']\"\n" +
    "                    data-action=\"removeDynamitField(field)\"></tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </form>\n" +
    "    <div class=\"add-field-block\" ng-click=\"addEmptyField()\">\n" +
    "        Добавить поле\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/manager/editor/dynamit-options.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-options.html",
    "<form name=\"optionsForm\">\n" +
    "    <fieldset>\n" +
    "\n" +
    "        <!-- Options -->\n" +
    "        <div class=\"form-group multi-cbx\">\n" +
    "            <label class=\"control-label\" for=\"options\">Опции</label>\n" +
    "\n" +
    "            <div class=\"form-group\">\n" +
    "                <label class=\"checkbox-inline\" for=\"can_comment\">\n" +
    "                    <input type=\"checkbox\" name=\"can_comment\" id=\"can_comment\"\n" +
    "                           ng-model=\"dynamit.can_comment\" value=\"{$ meta.actions['can_comment'].label $}\">\n" +
    "                    {$ meta.actions['can_comment'].label $}\n" +
    "                </label>\n" +
    "                <label class=\"checkbox-inline\" for=\"photo_gallery\">\n" +
    "                    <input type=\"checkbox\" name=\"photo_gallery\" id=\"photo_gallery\"\n" +
    "                           ng-model=\"dynamit.photo_gallery\" value=\"{$ meta.actions['photo_gallery'].label $}\">\n" +
    "                    {$ meta.actions['photo_gallery'].label $}\n" +
    "                </label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <!-- Entry name select -->\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"form-group col-lg-5\">\n" +
    "                <label class=\"control-label\" for=\"description\">{$ meta.actions['entryname'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <select name=\"entryname\" ng-model=\"dynamit.entryname\"\n" +
    "                            class=\"form-control input-block-level input-sm\">\n" +
    "                        <option value=\"id\" ng-selected=\"dynamit.entryname === 'id'\">ID</option>\n" +
    "                        <option ng-repeat=\"f in dynamit.fields\" ng-show=\"f.name && f.verbose_name\"\n" +
    "\n" +
    "                                value=\"{$f.name$}\" ng-selected=\"f.name === dynamit.entryname\">{$ f.verbose_name $}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['entryname'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['entryname'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </fieldset>\n" +
    "</form>");
}]);

angular.module("entries/manager/editor/editor-modal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/editor-modal.html",
    "<div id=\"dynamit-editor\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "        <h4 class=\"modal-title\">\n" +
    "            <span ng-hide=\"oldDynamit\">Добавление нового слоя</span>\n" +
    "            <span ng-show=\"oldDynamit\">Редактироване слоя \"{$oldDynamit.name$}\"</span>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <form name=\"dynamitForm\" id=\"dynamit-form\">\n" +
    "            <tabset>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Основные параметры&nbsp;<i ng-if=\"dynamitForm.baseForm.$invalid\"\n" +
    "                                                   class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-base-form></div>\n" +
    "                </tab>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Колонки&nbsp;<i ng-if=\"dynamitForm.fieldsForm.$invalid\" class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-fields></div>\n" +
    "                </tab>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Настройка записей&nbsp;<i ng-if=\"dynamitForm.optionsForm.$invalid\" class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-options=\"\"></div>\n" +
    "                </tab>\n" +
    "            </tabset>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <div class=\"pull-left\">\n" +
    "            <div ng-click=\"dynamit.is_public = !dynamit.is_public\">\n" +
    "                <i class=\"fa fa-eye fa-2x is-public\" ng-show=\"dynamit.is_public\" title=\"Публичный слой\"></i>\n" +
    "                <i class=\"fa fa-eye-slash fa-2x is-public\" ng-hide=\"dynamit.is_public\" title=\"Закрытый слой\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "\n" +
    "        <button ng-hide=\"oldDynamit\" type=\"submit\" ng-click=\"create()\" ng-disabled=\"dynamitForm.$invalid\"\n" +
    "                class=\"btn btn-primary\">\n" +
    "            Создать слой\n" +
    "        </button>\n" +
    "        <button ng-show=\"oldDynamit\" type=\"submit\" ng-click=\"update()\" ng-disabled=\"dynamitForm.$invalid\"\n" +
    "                class=\"btn btn-primary\">\n" +
    "            Обновить слой\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("entries/manager/templates/dynamit-in-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/dynamit-in-list.html",
    "<td class=\"feature-name\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <a class=\"inherit-color\" href=\"\" ng-click=\"goToEntry(d)\">{$ d.name $}</a><br>\n" +
    "            <div ng-show=\"d.description\"><small>{$ d.description | limitTo: 120 $}</small></div>\n" +
    "            <span><small>{$ ::d.user $}</small></span>\n" +
    "            <span ng-show=\"d.photo_gallery\">&nbsp;<i class=\"fa fa-picture-o\"></i></span>\n" +
    "            <span ng-show=\"d.can_comment\">&nbsp;<i class=\"fa fa-comment-o\"></i></span>\n" +
    "            <span ng-show=\"d.is_public\">&nbsp;<i class=\"fa fa-eye\"></i></span>\n" +
    "            <span ng-hide=\"d.is_public\">&nbsp;<i class=\"fa fa-eye-slash\"></i></span>\n" +
    "        </div>\n" +
    "        <div  class=\"col-xs-3\">\n" +
    "            <div class=\"ico-dropdown ico-in-list ico-part list-ico dropdown\" ng-show=\"d.user == auth.user || auth.is_superuser\">\n" +
    "               <div class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                  <i class=\"fa fa-gears action-ico\"\n" +
    "                     onclick=\"angular.element('.dropdown-toggle').dropdown();\"></i></div>\n" +
    "              <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"startEdit(d)\">\n" +
    "                          <i class=\"fa fa-pencil action-ico\" ></i>&nbsp;&nbsp;Редактировать</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                    <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteDynamit(d)\">\n" +
    "                     <i class=\"fa fa-trash-o action-ico\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                  </li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</td>");
}]);

angular.module("entries/manager/templates/dynamit-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/dynamit-list.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-if=\"!!auth.user\">\n" +
    "                <td class=\"create-entry-cell\" title=\"Создать слой\"\n" +
    "                    ng-click=\"goToCreatePage()\"\n" +
    "                    ng-file-drop\n" +
    "                    ng-file-change=\"upload($files)\"\n" +
    "                    drag-over-class=\"dragover\"\n" +
    "                    accept=\".geojson,.kml,.gpx\">\n" +
    "                    <span><i class=\"glyphicon glyphicon-plus create-ico\"></i></span>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "            <tr ng-repeat=\"d in Dynamit.dynamits\" class=\"animate\" id=\"entry-{$d.id$}\">\n" +
    "                <td dynamit-in-list data-entry=\"d\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/manager/templates/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/sidebar.html",
    "<div class=\"panel panel-default\" id=\"features\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6': !is_narrow, 'col-xs-7': is_narrow}\">\n" +
    "                    <span>Список слоёв</span>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-4': !is_narrow, 'col-xs-3': is_narrow}\" ng-cloak>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-2\"><a href=\"\" ng-click=\"hideSidebar()\"><i class=\"fa fa-times action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div class=\"sidebar-body\">\n" +
    "            <div dynamit-list></div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("entries/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/sidebar.html",
    "<div class=\"panel panel-default\" id=\"features\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6': !is_narrow, 'col-xs-7': is_narrow}\">\n" +
    "                    <span>Список</span>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-4': !is_narrow, 'col-xs-3': is_narrow}\" ng-cloak>\n" +
    "                    <div ng-if=\"entries && Entries.baseEntryCount != Entries.queryEntryCount\">\n" +
    "                      <small><span ng-hide=\"is_narrow\">Выбрано:</span>{$ Entries.queryEntryCount $}\n" +
    "                      <i class=\"fa fa-ban action-ico\" ng-click=\"cleanSelection()\" title=\"Сбросить выборку\"></i></small>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-2\"><a href=\"\" ng-click=\"hideSidebar()\"><i class=\"fa fa-times action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div class=\"sidebar-body\" endless-scroll=\"showMore()\">\n" +
    "\n" +
    "            <div entries-list></div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);
