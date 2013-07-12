/*
*  Custom iPhone Style Navigation List with Search
*  Based on SliderNav - A Simple Content Slider with a Navigation Bar
*  Copyright 2010 Monjurul Dolon, http://mdolon.com/
*  Released under the MIT, BSD, and GPL Licenses.
*  More information: http://devgrow.com/slidernav
*/

(function ($) {

	var methods = {

		init: function (options) {
			var settings = $.extend({}, $.fn.sliderNav.defaults, options);

			return $(this).each(function () {
				var slider = $(this),
					opts = settings;

				$(this).data('sliderNavOptions', settings);

				$(slider).addClass('slider');

				$('.slider-content li:first', slider).addClass('selected');

				if (opts.searchEnabled) {
					prepareSearch(slider, opts);
				}

				prepareSelectable(slider, opts);

				$(slider).append('<div class="slider-nav"><ul></ul></div>');

				for (var i in opts.items)
					$('.slider-nav ul', slider).append("<li><a alt='#" + opts.items[i] + "'>" + opts.items[i].replace('hash', '#') + "</a></li>");

				//var height = $('.slider-nav', slider).height(),
				var height = $(slider).sandbox(function () { return $('.slider-nav', this).height(); });
				needsAdjustment = false;

				if (opts.height) {
					var sh = parseInt(opts.height);
					if (sh < height)
						needsAdjustment = true;
					height = sh;
				}

				if (opts.debug)
					$(slider).append('<div id="debug">Scroll Offset: <span>0</span></div>');

				$('.slider-nav a', slider).on('click', function (event) {
					var target = $(this).attr('alt');
					var topPosition = $('.slider-content > ul > li' + target, slider).position().top;
					$('.slider-content > ul > li', slider).removeClass('selected');
					$(target).addClass('selected');
					$('.slider-content', slider).stop().animate({ scrollTop: topPosition });
					if (opts.debug)
						('#debug span', slider).html(topPosition);
				});

				if (opts.arrows) {
					$('.slider-nav', slider).css('top', '20px');
					$(slider).prepend('<div class="slide-up"><span class="arrow up"></span></div>');
					$(slider).append('<div class="slide-down"><span class="arrow down"></span></div>');
				}

				if (opts.searchEnabled) {
					if (opts.arrows) {
						var slideUpHeight = $('.slide-up', slider).height();
						$('.slider-nav', slider).attr('style', 'height: ' + height + 'px !important; top: ' + slideUpHeight + 'px');
					} else {
						$('.slider-nav', slider).attr('style', 'height: ' + height + 'px !important');
					}
					var contentHeight = height - $('.search-container', slider).height() - 1; //1px botted border under search box
					$('.slider-content', slider).attr('style', 'height: ' + contentHeight + 'px !important');
				} else {
					$('.slider-content, .slider-nav', slider).attr('style', 'height: ' + height + 'px !important');
				}

				if (opts.arrows) {
					var contentHeight = $('.slider-content', slider).height();
					$('.slide-down', slider).click(function () {
						$('.slider-content', slider).animate({ scrollTop: "+=" + contentHeight + "px" }, 500);
					});
					$('.slide-up', slider).click(function () {
						$('.slider-content', slider).animate({ scrollTop: "-=" + contentHeight + "px" }, 500);
					});
				}

				if (needsAdjustment) {
					adjustNavigation(height, slider, opts);
				}

				if (opts.searchEnabled) {
					adjustSearchBox(slider);
				}

				adjustContentWidth(slider);

				if (opts.multipleSelect) {
					$('.slider-content ul ul li', slider).each(function (i) {
						var content = $(this).clone().children().remove().end().text();
						$(this).html('<input type="checkbox" id="item_' + i + '">' + '<label for="item_' + i + '">' + content + '</label>');
					});

					$('.slider-content ul ul li input', slider).on('click', function (e) {
						$(this).closest('li').toggleClass('selected');
						e.stopPropagation();
					});
				}
				else {
					$('.slider-content ul ul li span', slider).each(function (i) {
						$(this).hide();
					});
				}

				prepareToolTip(slider);
			});
		},
		reset: function () {
			var slider = $(this);
			$('.slider-content ul li a', slider).show();
			$('.slider-content ul ul li', slider).show();
			$(slider).sliderNav('unhighlight');
			$('#search_button', slider).attr('src', 'images/search.gif');
			$('.search-text-field', slider).val('');
		},
		highlight: function (words) {
			var slider = $(this),
				opts = $(this).data('sliderNavOptions');

			if (!opts)
				opts = $.extend({}, $.fn.sliderNav.defaults);
			if (words.constructor === String) {
				words = [words];
			}
			words = $.grep(words, function (word, i) {
				return word != '';
			});
			words = $.map(words, function (word, i) {
				return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			});

			if (opts.startWithSearch) {
				words = $.map(words, function (word, i) {
					return word = "^" + word;
				});
			}

			if (words.length == 0) { return this; };

			var flag = opts.caseSensitive ? "" : "i";
			var pattern = "(" + words.join("|") + ")";

			var re = new RegExp(pattern, flag);

			return $('.slider-content ul ul li', slider).each(function () {
				findText(this, re, opts);
			});
		},
		unhighlight: function () {
			var slider = $(this);
			var opts = $(this).data('sliderNavOptions');

			if (!opts)
				opts = $.extend({}, $.fn.sliderNav.defaults);
			return $('.slider-content ul ul li', slider).find(opts.highlightElement + "." + opts.highlightClassName).each(function () {
				var parent = this.parentNode;
				parent.replaceChild(this.firstChild, this);
				parent.normalize();
			}).end();
		},
		select: function (value) {
			var slider = $(this),
				opts = $(this).data('sliderNavOptions');

			if (!opts)
				opts = $.extend({}, $.fn.sliderNav.defaults);
			if (typeof value == "number") {
				if (value === -1) {
					// remove current selection
					if (opts.multipleSelect) {
						$('.slider-content ul ul li input', slider).each(function () {
							$(this).attr("checked", false);
						});
					}
					$('.slider-content ul ul li', slider).removeClass("selected");
				} else if (value > -1) {
					if (opts.multipleSelect === false) {
						$('.slider-content ul ul li', slider).removeClass("selected");
						$('.slider-content ul ul li', slider).eq(value).addClass("selected");
					} else {
						var $li = $('.slider-content ul ul li', slider).eq(value);
						$li.children(':checkbox').eq(0).trigger('click');
					}
				}
			} else if (typeof value == "string") {
				var flag = opts.caseSensitive ? "" : "i";
				var pattern;
				if (opts.multipleSelect) {
					pattern = "(" + value.replace(/,\s+/g, ',').split(',').join("|") + ")";
				} else {
					pattern = "(" + value.replace(/,\s+/g, ',') + "$)";
				}
				var re = new RegExp(pattern, flag);
				var $row = $('.slider-content ul ul li', slider).filter(function () {
					if (opts.multipleSelect) {
						return stripAccents($(this).text()).match(re);
					} else {
						var match = stripAccents($(this).text()).match(re);
						return match != null && stripAccents($(this).text()) == match[0];
					}
					//return $(this).text() === value;
				});
				if ($row) {
					if (opts.multipleSelect === false) {
						$('.slider-content ul ul li', slider).removeClass("selected");
						$row.addClass("selected");
					} else {
						$row.children(':checkbox').trigger('click');
					}
				}
			}
		},
		getSelected: function (item) {
			var slider = $(this),
				opts = $(this).data('sliderNavOptions');
			if (opts.multipleSelect) {
				var values = new Array();
				$('.slider-content ul ul li', slider).each(function () {
					var $li = $(this);
					$(this).children('input[type="checkbox"]').each(function () {
						var $checkbox = $(this);
						if ($checkbox.prop("checked") === true) {
							switch (item) {
								case "id":
									values.push($li.data('id'));
									break;
								case "text":
									values.push($li.text());
									break;
								case "description":
									values.push($li.data('description'));
									break;
							}
						}
					});
				});
				return values;
			} else {
				var value = null;
				$('.slider-content ul ul li', slider).each(function () {
					var $li = $(this);
					if ($li.hasClass("selected")) {
						switch (item) {
							case "id":
								value = $li.data('id');
								break;
							case "text":
								value = $li.text();
								break;
							case "description":
								value = $li.data('description');
								break;
						}
					}
				});
				return value;
			}
		},
		getSelectedIndex: function () {
			var slider = $(this),
				opts = $(this).data('sliderNavOptions');
			if (opts.multipleSelect) {
				var items = $('.slider-content ul ul li input:checkbox:checked', slider);
				if (items)
					return items;
				else
					return -1;
			} else {
				var items = $('.slider-content ul ul li', slider).filter(function () { return $(this).hasClass("selected"); });
				if (items)
					return item.eq(0);
				else
					return -1;
			}
		}
	};

	function stripAccents(str) {
		var rExps = [
			{ re: /[\xC0-\xC6]/g, ch: 'A' },
			{ re: /[\xE0-\xE6]/g, ch: 'a' },
			{ re: /[\xC8-\xCB]/g, ch: 'E' },
			{ re: /[\xE8-\xEB]/g, ch: 'e' },
			{ re: /[\xCC-\xCF]/g, ch: 'I' },
			{ re: /[\xEC-\xEF]/g, ch: 'i' },
			{ re: /[\xD2-\xD6]/g, ch: 'O' },
			{ re: /[\xF2-\xF6]/g, ch: 'o' },
			{ re: /[\xD9-\xDC]/g, ch: 'U' },
			{ re: /[\xF9-\xFC]/g, ch: 'u' },
			{ re: /[\xD1]/g, ch: 'N' },
			{ re: /[\xF1]/g, ch: 'n'}];

		for (var i = 0, len = rExps.length; i < len; i++)
			str = str.replace(rExps[i].re, rExps[i].ch);

		return str;
	};

	function findText(node, re, opts) {
		if (node.nodeType == 3)
			return searchText(node, re, opts);
		else if (node.nodeType == 1 && node.childNodes && !(/(script|style)/i.test(node.tagName))) {
			for (var i = 0; i < node.childNodes.length; ++i) {
				i += findText(node.childNodes[i], re, opts);
			}
		}
		return 0;
	};

	function searchText(node, re, opts) {
		var match = stripAccents(node.data).match(re);
		if (match)
			return highlightText(node, match, opts);
		else
			return 0;
	};

	function highlightText(node, match, opts) {
		var spannode = document.createElement(opts.highlightElement || 'span');
		spannode.className = opts.highlightClassName || 'highlight';
		var middlebit = node.splitText(match.index);
		var endbit = middlebit.splitText(match[0].length);
		var middleclone = middlebit.cloneNode(true);
		spannode.appendChild(middleclone);
		middlebit.parentNode.replaceChild(spannode, middlebit);
		return 1;
	};

	function prepareSearch(slider, opts) {
		$(slider).prepend(
			'<div class="search-container">' +
			'	<div class="search-box">' +
			'		<div class="search-text-field-box">' +
			'			<input name="" type="text" id="search" autocomplete="off" class="search-text-field" title="Search" />' +
			'		</div>' +
			'		<div class="search-button">' +
			'			<a href="javascript:void(0);" id="search_button_link" ><img src="images/search.gif" border="0" id="search_button" /></a>' +
			'		</div>' +
			'	</div>' +
			'</div>');

		$('.search-text-field', slider).each(function () {
			this.value = $(this).attr('title');
			$(this).addClass('text-label');
			$(this).focus(function () {
				if (this.value == $(this).attr('title')) {
					this.value = '';
					$(this).removeClass('text-label');
				}
			});
			$(this).blur(function () {
				if (this.value == '') {
					this.value = $(this).attr('title');
					$(this).addClass('text-label');
				}
			});
			$(this).bind('contextmenu', function () { return false });
		});

		$('.search-text-field', slider).bind(opts.bind, function (e) {
			var keyCode = !e.charCode ? e.which : e.charCode;
			var key = String.fromCharCode(keyCode);
			var controlCharacters = [8, 46];
			if (/[a-zA-Z0-9-_ ]/.test(key) || $.inArray(keyCode, controlCharacters) > -1) {
				var search_text = $(this).val();
				if (search_text.length > 0) {
					$('#search_button', slider).attr('src', 'images/delete.gif');
					searchList(search_text, slider, opts);
				}
				else {
					$(slider).sliderNav('reset');
				}
			}
		});
		$('#search_button_link', slider).click(function () {
			var search_text = $('.search-text-field', slider).val();
			if (search_text.length > 0) {
				$(slider).sliderNav('reset');
			}
		});
	};

	function adjustSearchBox(slider) {
		$(slider).sandbox(function () {
			var totalWidth = $('.search-container', this).width();
			var sliderWidth = $('.slider-nav', this).width();
			$('.search-button', this).css('padding-right', sliderWidth);
			totalWidth = totalWidth - sliderWidth;
			totalWidth = totalWidth - $(this).width();
			totalWidth = totalWidth - 5;
			$('.search-text-field-box', this).css('width', totalWidth);
		});
	};

	function prepareSelectable(slider, opts) {
		$('.slider-content ul ul li', slider).on('click', function (e) {
			if (opts.multipleSelect === false) {
				$('.slider-content ul ul li', slider).removeClass("selected");
				$(this).addClass('selected');
				e.preventDefault();
			}
			else {
				if (e.target.type !== 'checkbox' && e.target.tagName !== 'LABEL') {
					$(':checkbox', this).trigger('click');
					e.preventDefault();
				}
			}
		});
	};

	function prepareToolTip(slider) {
		getTip = function () {
			var tTip =
				"<div class='tooltip'>" +
					"<div class='body'>" +
					"</div>" +
				"</div>";
			return tTip;
		}

		if (!($("div.tooltip").length > 0)) {
			var tooltip = $(getTip());
			$("body").prepend(tooltip);
			tooltip.hide();
		}

		$('.slider-content ul ul li[title]:not([title=""])', slider).each(function (i) {
			var $this = $(this);
			var tooltip = $('.tooltip');
			var tipBody = $('.body', tooltip);

			var tipTitle = (this.title);
			this.title = "";

			$this.mousemove(function (e) {
				tipBody.html(tipTitle.replace(/\n/g, '<br />'));

				tooltip.show();

				// boundry check
				if (e.pageY - $(window).scrollTop() + tooltip.height() >= $(window).height()) {
					posY = $(window).height() + $(window).scrollTop() - tooltip.height() - 24;
				} else {
					posY = e.pageY;
				}

				if (e.pageX - $(window).scrollLeft() + tooltip.width() >= $(window).width()) {
					posX = $(window).width() + $(window).scrollTop() - $('#tooltip').width() - 19;
				} else {
					posX = e.pageX;
				}

				tooltip.css({
					top: (posY + 20) + "px",
					left: (posX + 15) + "px"
				});
			}).mouseout(function () {
				tooltip.hide();
			});
		});
	};

	function adjustNavigation(navHeight, slider, opts) {
		var hiddenNav = new Array();
		$(slider).sandbox(function () {
			$('.slider-nav ul li', this).each(function () {
				if ($(this).position().top >= navHeight)
					hiddenNav.push($(this));
			});
		});

		if (hiddenNav.length > 0) {
			var shownNavElements = opts.items.length - hiddenNav.length;
			var count = Math.ceil(opts.items.length / shownNavElements);
			for (var i = 0; i < opts.items.length; i++) {
				if (i >= opts.items.length - count) {
					//Make it show last item
					for (var j = i; j < opts.items.length - 1; j++) {
						$('.slider-nav ul li', slider).eq(j).hide();
					}
					$('.slider-nav ul li', slider).eq(opts.items.length - 1).show();
					break;
				} else {
					//Hide/show items
					if (i % count)
						$('.slider-nav ul li', slider).eq(i).hide();
					else
						$('.slider-nav ul li', slider).eq(i).show();
				}
			}
		}
	};

	function adjustContentWidth(slider) {
		$(slider).sandbox(function () {
			var totalWidth = $(this).width();
			var sliderWidth = $('.slider-nav', this).width();
			$('.slider-content', this).css('width', totalWidth - sliderWidth);
			var totalWidth = totalWidth - sliderWidth;
			$('.slider-content ul ul', this).css('width', totalWidth);
			var paddingWidth = $('.slider-content ul ul li', this).css('padding-left');
			totalWidth = totalWidth - parseInt(paddingWidth);
			paddingWidth = $('.slider-content ul ul li', this).css('padding-right');
			totalWidth = totalWidth - parseInt(paddingWidth);
			var scrollbarWidth = parseInt(scrollBarWidth());
			totalWidth = totalWidth - Math.abs(scrollbarWidth);
			$('.slider-content ul ul li', this).css('width', totalWidth);
		});
	};

	function scrollBarWidth() {
		var $body = $('html');
		var w = $body.css('overflow', 'hidden').width();
		$body.css('overflow', 'scroll');
		w -= $body.width();
		if (!w)
			w = $body.width() - $body[0].clientWidth; // IE in standards mode
		$body.css('overflow', '');
		return w;
	};

	function searchList(inputVal, slider, opts) {
		var list = new Array(),
			pattern = inputVal;

		if (opts.startWithSearch)
			pattern = "^" + pattern;

		$('.slider-content ul ul li', slider).each(function (i) {
			var regExp = opts.caseSensitive ? new RegExp(pattern) : new RegExp(pattern, 'i');
			if (regExp.test($(this).text())) {
				list.push(i);
			}
		});
		if (list.length > 0) {
			$('.slider-content ul li a', slider).hide();
			$(slider).sliderNav('unhighlight');
			$(slider).sliderNav('highlight', inputVal);

			$('.slider-content ul ul li', slider).each(function (i) {
				if ($.inArray(i, list) > -1) {
					$(this).show();
				}
				else {
					$(this).hide();
				}
			});
		}
		else {
			$('.slider-content ul li a', slider).hide();
			$('.slider-content ul ul li', slider).hide();
		}
	};

	$.fn.sliderNav = function (method) {
		if (methods[method])
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		else if (typeof method === 'object' || !method)
			return methods.init.apply(this, arguments);
		else
			$.error('Method ' + method + ' does not exist on jQuery.sliderNav');
	};

	// Publicly accessible defaults
	$.fn.sliderNav.defaults = {
		items: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
		debug: false,
		height: null,
		arrows: true,
		multipleSelect: false,
		searchEnabled: true,
		caseSensitive: false,
		startWithSearch: true,
		enableHighlight: true,
		highlightClassName: 'highlight',
		highlightElement: 'span',
		bind: 'keyup blur'
	};

	/* http://wvega.com/246/get-height-of-a-hidden-element-using-jquery/ */
	/* http://dreamerslab.com/blog/en/get-hidden-elements-width-and-height-with-jquery/ */
	// A jQuery plugin that gets the actual width of hidden DOM elements
	$.fn.sandbox = function (fn) {
		var $target = $(this);

		var $hidden = $target.parents().andSelf().filter(':hidden'),
			result,
			tmp = [];

		var css = { visibility: 'hidden', display: 'block' };

		// replace styles
		$hidden.each(function () {
			var _tmp = {},
				name;

			for (name in css) {
				// save current style
				_tmp[name] = this.style[name];
				// set current style to proper css style
				this.style[name] = css[name];
			}

			tmp.push(_tmp);
		});

		result = fn.apply($target);

		// reset styles
		$hidden.each(function (i) {
			var _tmp = tmp[i],
				name;

			for (name in css) {
				this.style[name] = _tmp[name];
			}
		});

		return result;
	};
})(jQuery);