/**
 * This code is only for the F2 documentation site. Don't use it anywhere else, you really shouldn't.
 * (c) F2 / Markit On Demand 2012
 */
if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

//F2 docs
var F2Docs = function(){ }

//shortcut
F2Docs.fn = F2Docs.prototype;

/**
 * Init
 */
F2Docs.fn.init = function() {
	
	this.navbarDocsHelper();
	this.bindEvents();
	this.buildLeftRailToc();
	this.buildBookmarks();
	this.formatSourceCodeElements();
	this.demosF2IdLookup();

	$("body").scrollspy();

	//affix left nav
	$("#toc > ul.nav").affix();
}

/**
 * Events
 */
F2Docs.fn.bindEvents = function(){
	this._setupBodyContentAnchorClick();
	this._watchScrollSpy();
}

/** 
 * Highlight Basics or Development nav item, based on filename
 */
F2Docs.fn.navbarDocsHelper = function(){
	var $toc 	= $('ul','div.navbar-docs')
		$collapsedNavToc = $('ul.navinset','div.navbar-inner'),
		file 	= location.pathname.split('/').pop(),
		_setActive = function(eq,$ul){
			$ul.find("li").eq(eq).find("a").addClass("active");
		}
	;

	//remove all 
	$toc.find("a").removeClass("active");

	//add active class to blue,green or orange subnav item
	if (file == 'index.html' || !file){
		_setActive(0,$toc);
		_setActive(0,$collapsedNavToc);
		this.currentPage = "basics";
	} else if (this._checkFileNameForMatch(file)){
		_setActive(1,$toc);
		_setActive(1,$collapsedNavToc);
		this.currentPage = "development";
	}	
}

/**
 * Utility to search devSubSections map for file names 
 * to highlight appropriate section header with CSS class.
 */
F2Docs.fn._checkFileNameForMatch = function(file){
	for (var fileName in this.devSubSections){
		if(file == this.devSubSections[fileName]){ return true; }
	}
}

/**
 * Mapping 
 * Don't reorder these without consequences in this._getCurrentDevSubSection()
 * Adding to them is fine.
 */
F2Docs.fn.devSubSections = {
	'App Development': 		'app-development.html',
	'Container Development':'container-development.html',
	'Extending F2': 		'extending-f2.html',
	'F2.js SDK': 			'f2js-sdk.html',
	'Web Services': 		'web-services.html'
};

/**
 * Lookup in devSubSections for right URL
 */
F2Docs.fn._getCurrentDevSubSection = function(){
	var file = location.pathname.split('/').pop(),
		currSection,
		counter = 0;

	$.each(this.devSubSections,$.proxy(function(idx,item){
		if (item == file) {
			currSection = counter;
		}
		counter++;
	},this));

	return currSection;
}

/**
 * Lookup in devSubSections NAME for insite
 */
F2Docs.fn._getCurrentDevSectionName = function(){
	var file = location.pathname.split('/').pop(),
		currSection,
		counter = 0;

	$.each(this.devSubSections,$.proxy(function(idx,item){
		if (item == file) {
			currSection = idx;
		}
		counter++;
	},this));

	return currSection;
}

F2Docs.fn.getName = function(){
	return this._getCurrentDevSectionName() || document.title.replace('F2 - ','');
}

/**
 * When on Development, we need some special nav.
 */
F2Docs.fn._buildDevSubSectionsHtml = function(){
	var html = [];

	$.each(this.devSubSections,function(idx,item){
		html.push("<li><a href='{url}' data-parent='true'>{label}</a></li>".supplant({url:item, label: idx}));
	});

	return html.join('');
}

/**
 * Add bookmark links to each <h1/2/3/4/5/6>
 */
F2Docs.fn.buildBookmarks = function(){
	var $docsContainer = $('#docs'),
		$headers = $('section', $docsContainer).not('.level1,.level2'),
		link = "<a href='#{id}' title='Permalink' name='{id}' class='docs-anchor'><span class='icon-bookmark'></span></a>";

	$headers.each($.proxy(function(idx,item){
		var $h = $(item).children().first(),
			//name = $h.text(),
			anchor = $(item).prop("id"),
			$link = $(link.supplant({id: anchor}));
			//animate click
			$link.on('click',$.proxy(function(e){
				this._animateAnchor(e,false);
			},this));
		$h.prepend($link);
	},this));
}

/**
 * Build left rail TOC
 */
F2Docs.fn.buildLeftRailToc = function(){

	var $toc 			= $('div.span12','div.navbar-docs'),
		$docsContainer 	= $('#docs'),
		file 			= location.pathname.split('/').pop(),
		$sections 		= $('> section', $docsContainer),
		$sectionsL2		= $sections.filter("section.level2"),//find <section> elements in main content area
		$sectionsL3		= $sections.filter("section.level3")
		$navWrap 		= $('<ul class="nav nav-list"></ul>')
		$listContainer	= $('<ul class="nav nav-list"></ul>'),
		$pageHeading	= $("h1",$docsContainer);

	//build table of contents based on sections within generated markdown file
	if (!$sections.length) return;

	//quickly touch <h1> and add an ID attr. this regex removes all spaces and changes to dashes.
	$pageHeading.prop("id", $pageHeading.text().toLowerCase().replace(/\s+/g, '-'));

	//OK, we are on the development section, add the sub-sections
	if ("development" == this.currentPage){
		$navWrap.append(this._buildDevSubSectionsHtml());
	}

	//need to add very first section (page title/<h1>)
	if ("development" != this.currentPage){
		$listContainer.append("<li class='active'><a href='{url}'>{label}</a></li>".supplant({url: this._getPgUrl($pageHeading.attr("id")), label: $pageHeading.text()}));
	}

	//loop over all sections, build nav based on <h2>'s inside the <section.level2>
	$sections.each($.proxy(function(idx,item){

		var $item = $(item),
			sectionTitle = $item.children().first().text(),
			sectionId = $item.prop("id"),
			isActive = (sectionId == String(location.hash.replace("#",""))) ? " class='active'" : "",
			$li;

		$li = $("<li{isActive}><a href='#{id}' data-id='{id}'>{label}</a></li>".supplant({id: sectionId, label: sectionTitle, isActive: isActive}));

		$listContainer.append($li);
	},this));

	//now, determine *where* to insert links. 
	// if they are Level2 
	if ($listContainer.find("li").length){
		if ("development" == this.currentPage){
			$navWrap
				.find("li")
				.eq(this._getCurrentDevSubSection())
				.addClass("active")
				.append($listContainer)
			;
		} else {
			//we are on Basics, and have no subnav. 
			//navWrap *is* the list.
			$navWrap = $listContainer;
		}
	}

	//cache inner nav for this page
	this.$currentSectionNavList = ("development" == this.currentPage) ? $navWrap.find('li.active > ul.nav-list') : $navWrap;

	//append links
	$('#toc').html($navWrap);
	var $responsiveItems = $navWrap.children().clone();
	$('ul', $responsiveItems).removeClass('nav-list').addClass('navinset');
	$('#tocResponsive').append($responsiveItems);

	//add click event
	$("a",$navWrap).on("click",$.proxy(function(e){
		this._animateAnchor(e,true);
	},this));
}

F2Docs.fn._setupBodyContentAnchorClick = function(){
	$('a[href^="#"]','#docs').on('click',$.proxy(function(e){
		this._animateAnchor(e,false);
	},this));
}

F2Docs.fn._animateAnchor = function(e, isTableOfContentsLink){
	var $this = $(e.currentTarget),
		destinationId = $this.attr("href").replace(".","\\\\."),
		$destination = $(destinationId),
		offset;

	//don't stop top-level (non-anchor) links from going to their location
	if (destinationId.indexOf("#") > -1){
		e.preventDefault();
	}

	if (isTableOfContentsLink){
		$("li.active", "#toc ul").removeClass("active");
		$this.parent().addClass("active");
	}

	//if we have a location.hash change, animate scrollTop to it.
	if (destinationId.indexOf("#") > -1){
		offset = $destination.offset() || {};
		$('html,body').animate({ scrollTop: offset.top },function(){
			location.hash = destinationId;
		});
		return false
	}
};

/**
 * Because of our page layout, bootstrap scrollspy doesn't pick up H1 
 * and the active class never gets added back when you scroll to top of page
 * This fixes that.
 */
F2Docs.fn._watchScrollSpy = function(){
	$(window).on('scroll',$.proxy(function(e){
		var $nav = this.$currentSectionNavList;
		var $activeNav = ("development" == this.currentPage) ? $nav.parent() : $('li',$nav).first();
		if (document.body.scrollTop < 1 && !$activeNav.hasClass('active')){
			$('li',$nav).removeClass('active');
			$activeNav.addClass('active');
		}
	},this));
}

F2Docs.fn._getPgUrl = function (id) {
	if ("about-f2" == id){
		return "index.html";
	}
}

/**
 * Takes <pre><code>something();</code></pre> and converts to <pre>something();</pre>
 * Removes unneeded CSS classnames, adds correct ones for prettify.js
 * Calls prettyPrint()
 * Changes out mailto links that pandoc turns into <code> elements.
 */
F2Docs.fn.formatSourceCodeElements = function(){
	$("pre")
		.removeClass("sourceCode")
		.addClass("prettyprint linenums")
		.find("code").replaceWith(function() {
			return $(this).contents();
		})
		.end()
		.filter(".javascript")
		.removeClass("javascript")
		.addClass("lang-js")
		.end()
		.filter(".html")
		.removeClass("html")
		.addClass("lang-html")
	;
	window.prettyPrint && prettyPrint();

	//fix mailto links from pandoc so they don't have <code> around them.
	//pandoc supports a param to disable this, need to fix that in the build
	$('a[href^="mailto"]','#docs').each(function(idx,item){
		$(item)
			.html($(this).text())
			.prev('script').remove()
			.end()
			.next('noscript').remove()
		;
	});
}
/**
 * MOD On Demand Analytics
 */
F2Docs.fn.insite = function(){
	window._waq = window._waq || []; 
	if (F2.gitbranch() !== 'master') { return; }
	(function() {
		var domain = 'insite.wallst.com'; 
		_waq.push(['_setup', {reportingid: '544506', domain: domain}]); 
		var wa = document.createElement('script'); 
		wa.type = 'text/javascript'; 
		wa.async = true; 
		wa.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + domain + '/js/wa.js'; 
		var s = document.getElementsByTagName('script')[0]; 
		s.parentNode.insertBefore(wa, s);
	})();
	//F2.log(this.getName())
	_waq.push(['_trackPageView', {category: 'Docs', name: this.getName() }]);
	_waq.push(['_trackLinks']);
}

/** 
 * Init events for F2 ID Lookup API demo 
 */
F2Docs.fn.demosF2IdLookup = function(){
	this.$lookupForm = $('#demo-F2IDLookupForm');
	if (!this.$lookupForm.length) { return; }

	this.$lookupForm.on('submit', $.proxy(function(e){
		e.preventDefault();
		this._demosF2IdLookupSubmit();
	},this));
}

/** 
 * F2 ID Lookup API demo onSubmit handler
 */
F2Docs.fn._demosF2IdLookupSubmit = function(){
	var $lookupType = this.$lookupForm.find('select'),
		lookupType = $lookupType.val(),
		$query = this.$lookupForm.find('input'),
		query = $query.val(),
		$button = this.$lookupForm.find('button'),
		$controlGroup = this.$lookupForm.find('div.control-group'),
		endpoint, 
		template,
		endpointUrl = function(e,q){
			return e + '?query=' + q;
		},
		handleResp = $.noop,
		servicesConfig = F2.Services(),
		_this = this
	;

	//trap any errors
	if (lookupType == '#' || query == ''){
		$controlGroup
			.addClass('error')
			.children('div.help-block')
			.show()
		;

		if (lookupType = '#') { $lookupType.focus(); }
		if (query == ''){ $query.focus(); }
		return false;

	} else if ($controlGroup.hasClass('error')) {
		//remove error state if user intially made mistake
		$controlGroup
			.removeClass('error')
			.children('div.help-block')
			.hide()
		;
	}

	//make user-typed stuff nice looking
	query = query.toUpperCase();
	$query.val(query);

	//config
	endpoint = servicesConfig.baseDomain + '/' +servicesConfig.version+ '/Lookup/{type}/jsonp'.supplant({type:lookupType});
	template = ['<h4>Results</h4>',
				'<p>Query: ',
					'<code>{endpoint}</code> ',
					'<a href="{endpointUrlFull}" target="_blank" title="Open in new window"><i class="icon-share-alt"></i></a>',
				'</p>',
				'<pre id="demoLookupJsonOutput" class="prettyprint linenums lang-js">{response}</pre>'
	].join('');

	//when we're done...
	handleResp = function(jqxhr, data, isError){
		var resp = ((isError) ? '/** Error */' : '') + JSON.stringify(data,null,4),
			html = template.supplant({
				endpoint: endpointUrl(endpoint,query), 
				endpointUrlFull: jqxhr.url, 
				response: resp
			})
		;
		//insert response in DOM
		$('#demo-F2IDLookupResults').html(html);
		//move page up, so results are in focus
		_this.$lookupForm.parents('#demo').find('a:first').click();
		//prettify it
		window.prettyPrint && prettyPrint('demoLookupJsonOutput');
		$query.select();
		$button.button('reset');
	}

	$.ajax({
		url: endpoint,
		data: { query: query },
		dataType: 'jsonp',
		beforeSend: function(){
			$button.button('loading');
		}
	}).done(function(data,txtStatus){
		handleResp(this,data);
	}).fail(function(data,txtStatus){
		handleResp(this,data,true);
	});

	//ODA
	_waq.push(['_trackAction', {category: 'Docs', name: 'Demo - F2 ID Lookup', label: lookupType, value: query}]);
}

/**
 * Let's do this.
 */
$(function() {
	F2Docs = new F2Docs();
	F2Docs.init();
	F2Docs.insite();
});
