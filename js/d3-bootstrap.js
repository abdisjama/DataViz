(function(global, factory) {
	if (typeof global.d3 !== 'object' || typeof global.d3.version !== 'string')
		throw new Error('Bootstrap\'s JavaScript requires d3v4 or d3v5');
	var v = global.d3.version.split('.');
	if (v[0] != '4' && v[0] != '5')
		throw new Error('Bootstrap\'s JavaScript requires d3v4 or d3v5');
	factory(global.bs = global.bs || { version: "0.2.0" }, global)
})(this, (function(bs, global) {
	// private data
	var toolCnt		= 0,
	    scrollSpyCnt	= 0,
	    scrollSpyData	= [],
	    scrollTween		= function(offset) {
		return function() {
			var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
			return function(t) { scrollTo(0, i(t)); };
		};
	},
	    scrollSpyRefresh	= function(container, id) {
		var that  = this,
		    cnt   = 0,
		    items = [],
		    revs  = []
		    me    = d3.select(this);
		if (typeof scrollSpyData[id] == 'undefined')
			scrollSpyData[id] = { };
		scrollSpyData[id].scrollHeight = container.scrollHeight;
		scrollSpyData[id].scrollY = -100;
		me.selectAll('[href]').each(function() {
			var t = this,
			    l = d3.select(this),
			    h = l.attr('href'),
			    tgt = bs.api.find.target(this, null);
			if (h.substr(0,1)!='#') return;
			l.on('click.bs.scrollspy.link', bs.api.scroll.linkClick)
			items[cnt] = revs[cnt++]  = {
				item:	t,
				target:	tgt.node(),
				top:	bs.api.cumulativeOffset(tgt.node()).top,
				height: tgt.node().offsetHeight
			};
		})
		items.sort(function(a,b) { return a.top-b.top})
		revs.sort(function(a,b) { return b.top-a.top})
		scrollSpyData[id].items = items
		scrollSpyData[id].revs  = revs
	},
	    trigger = function(obj, type, args) {
		obj.each(function() {
			var t = d3.select(this).on(type);
			if (typeof t === 'function')
				t.call(this, args);
		});
	};
	// find the transitionEnd event name
	function whichTransitionEvent() {
		var t,
			el = document.createElement("fakeelement"),
			transitions = {
				"transition"      : "transitionend",
				"OTransition"     : "oTransitionEnd",
				"MozTransition"   : "transitionend",
				"WebkitTransition": "webkitTransitionEnd"
		}
		for (t in transitions)
			if (el.style[t] !== undefined)
				return transitions[t];
		return null;
	}
	bs.api = bs.api || {
		find:{}, 	alert:{},	modal:{},	button:{},
		dropdown:{},	tab:{},		tooltip:{},	carousel:{},
		affix:{},	scroll:{},	collapse:{},	format:{},
		transitionEvent: whichTransitionEvent()
	}
	bs.api.format.number = d3.format(",." + d3.precisionFixed(0.01) + "f");
	bs.api.cumulativeOffset	= function(element) {
		var top = 0, left = 0;
		do {
			top += element.offsetTop  || 0;
			left += element.offsetLeft || 0;
			element = element.offsetParent;
		} while(element);

		return {
			top: top,
			left: left
		};
	}
	// Find real target of the event
	bs.api.find.target	= function(that, t_type) {
		var sel		= d3.select(that),
		    selector	= sel.attr('data-target'),
		    target;
		if (!selector)
			selector= sel.attr('href');
		if (selector && selector!='#')
			target	= d3.select(selector);
		if (typeof target === 'undefined' || target.empty()) {
			target	= sel;
			while(!target.classed(t_type) && typeof target.node !== 'undefined' && typeof target.node().parentNode !== 'undefined' && target.node().nodeName != 'HTML') {
				target = d3.select(target.node().parentNode);
				if (!target.classed(t_type) && target.select('.'+t_type).size()>0)
					target = target.select('.'+t_type)
			}
			if(!target.classed(t_type))
				return null;
		}
		return target;
	},
	bs.api.find.parent	= function(that, p_node) {
		var p = that
		while (p.nodeName != 'HTML' && p.nodeName != p_node && typeof p.parentNode !== 'undefined')
			p = p.parentNode;
		if (p.nodeName != p_node)
			return null;
		return p;
	},
	bs.api.find.classedParent= function(that, p_type) {
		var p = that
		if(typeof p === 'undefined' || p == null)
			return null;
		while (p != null && p.nodeName != 'HTML' && ! d3.select(p).classed(p_type) && typeof p.parentNode !== 'undefined')
			p = p.parentNode;
		if(typeof p === 'undefined' || p == null)
			return null;
		if (! d3.select(p).classed(p_type))
			return null;
		return p;
	},
	bs.api.find.dataParent	= function(that) {
		var sel		= d3.select(that),
		    selector	= sel.attr('data-parent'),
		    parent;
		if (selector == null)
			return null;
		parent = d3.select(selector);
		if(parent.size()<1)
			return null;
		return parent;
	}
	// alert dismiss
	bs.api.alert.click	= function() {
		if (d3.event) d3.event.preventDefault();
		var target = bs.api.find.target(this, 'alert'),
		    close  = function() {
			trigger(target.remove(),'closed.bs.alert');
		};
		if (target == null) return;
		trigger(target,'close.bs.alert');
		if (target.classed('fade') && bs.api.transitionEvent != null)
			target.on(bs.api.transitionEvent, function() {close()}).classed('in', false);
		else
			close();
	}
	// modal button
	bs.api.modal.click	= function() {
		if (d3.select(this).classed('disabled')) return;
		if (d3.event) d3.event.preventDefault();
		var target = bs.api.find.target(this, 'modal'),
		    backdrop,
		    hide2 = function() {
			target.on(bs.api.transitionEvent, function(){});
			if (target.classed("fade")  && bs.api.transitionEvent != null)
				backdrop.on(bs.api.transitionEvent, function() {backdrop.remove()}).classed("in", false);
			else
				backdrop.remove();
			d3.select('body').classed('modal-open',false);
			target.style('display', 'none');
			trigger(target,'hidden.bs.modal');
		},  hide = function() {
			trigger(target,'hide.bs.modal');
			if (target.classed("fade")  && bs.api.transitionEvent != null)
				target.on(bs.api.transitionEvent, function() {hide2()}).classed("in", false)
			else
				hide2(target);
		},  show = function() {
			target.on(bs.api.transitionEvent, function(){});
			target.style('display', 'block');
			target.node().focus();
			target.classed('in',true);
			trigger(target,'shown.bs.modal');
		};
		target.on('click.dismiss.bs.modal', function() {if(d3.event.target!=d3.event.currentTarget || target==null) return;hide();});
		target.selectAll('[data-dismiss="modal"]').on('click.dismiss.bs.modal', function() {if (target == null) return;hide();});
		d3.select('body').classed('modal-open',true);
		backdrop = d3.select('body').append('div').attr('class', 'modal-backdrop').classed('fade', target.classed('fade'));
		backdrop.node().offsetWidth; // force reflow animation
		trigger(target,'show.bs.modal');
		if (target.classed('fade')  && bs.api.transitionEvent != null)
			backdrop.on(bs.api.transitionEvent, function() {show()}).classed('in',true);
		else
			show();
	}
	// Button toggling
	bs.api.button.toggle	= function() {
		if (d3.event) d3.event.preventDefault();
		var	me  = d3.select(this),
			inp = me.select('input');
		if (inp.attr('type') == 'radio') {
			if (me.classed('active')) {
				inp.node().checked = me.classed('active')
				return;
			}
			d3.select(this.parentNode)
				.selectAll('.active').classed('active',false)
		}
		me.classed('active', !me.classed('active'))
		me.attr('aria-pressed', me.classed('active'))
		inp.node().checked = me.classed('active')
		return false;
	}
	// DropDown

	function dropdown_closeAll() {
		d3.selectAll('[data-toggle="dropdown"]').each(function() {
			var t = bs.api.find.target(this, 'dropdown')
			if(t==null || !t.classed('open')) return;
			trigger(t,'hide.bs.dropdown');
			d3.select(this).attr('aria-expanded', 'false');
			t.classed('open', false);
			trigger(t,'hidden.bs.dropdown');
		})
	}

	bs.api.dropdown.closeAll= function() {
		if (d3.event == null) { dropdown_closeAll(); return; }
		var t = bs.api.find.classedParent(d3.event.target, 'dropdown');
		if (t == null)
			dropdown_closeAll();
	}
	bs.api.dropdown.click	= function() {
		if (d3.event) {
			d3.event.preventDefault();
			d3.event.stopPropagation();
		}
		var	me = d3.select(this);
		if (me.classed('disabled')) return;
		var target = bs.api.find.target(this, 'dropdown');
		if (target==null|| target.classed('disabled')) return;
		var o = target.classed('open');

		dropdown_closeAll();
		if (!o) {
			trigger(target,'show.bs.dropdown');
			me.node().focus();
			me.attr('aria-expanded', 'true');
			target.classed('open', true);
			trigger(target,'shown.bs.dropdown');
		}
		return false;
	}
	// Tabs & pills toggling
	bs.api.tab.click	= function() {
		if (d3.event) d3.event.preventDefault();
		var	cur_a	= d3.select(this),
			cur_li	= d3.select(bs.api.find.parent(this,'LI')),
			cur_ul	= d3.select(bs.api.find.parent(this,'UL')),
			cur_tar	= bs.api.find.target(this, 'tab-pane'),
			prv_a	= cur_ul.select('.active a'),
			next	= function() {
				if (prv_a.size()>0) {
					trigger(prv_a.attr('aria-expanded', false),'hidden.bs.tab');
					bs.api.find.target(prv_a.node(), 'tab-pane').classed('active',false);
				}
				cur_li.classed('active', true);
				trigger(cur_a.attr('aria-expanded', true),'show.bs.tab');
				cur_tar.classed('active',true).classed('in',true);
				trigger(cur_a,'shown.bs.tab'); //TODO: should happen after the transition
		};
		if(cur_li.classed('active')) return;
		if (prv_a.size()<1) {
			next();
			return false;
		}
		var	prv_li	= d3.select(bs.api.find.parent(prv_a.node(),'LI')),
			prv_tar	= bs.api.find.target(prv_a.node(), 'tab-pane');
		prv_li.classed('active', false);
		trigger(prv_a.attr('aria-expanded', false),'hide.bs.tab');
		if (prv_tar.classed('fade') && bs.api.transitionEvent != null) {
			prv_tar.on(bs.api.transitionEvent, function() {next()}).classed('in',false);
		} else {
			prv_tar.classed('in',false);
			next();
		}
	};
	// collapse & accordion
	bs.api.collapse.click	= function() {
		if (d3.event) d3.event.preventDefault();
		var	me     = d3.select(this),
			dim    = me.classed('width')?'width':'height',
			sc     = me.classed('width')?'scrollWidth':'scrollHeight',
			target = bs.api.find.target(this, 'collapse'),
			parent = bs.api.find.dataParent(this)
			active = target.classed('in'),
			hide2  = function(t) {
				t.on(bs.api.transitionEvent, function(){});
				t.classed('collapsing',false).classed('collapse',true).style(dim, '');
				trigger(target,'hidden.bs.collapse');
			},
			hide   = function() {
				var m = me,
				    t = target;
				if (parent!=null) {
					m = parent.selectAll('[data-toggle="collapse"]');
					t = parent.selectAll('.collapse.in');
				}
				if(t.size()<1)
					return
				trigger(t,'hide.bs.collapse');
				t.style(dim, t.node()[sc]+"px").node().offsetWidth;
				m.classed('collapsed', true).attr('aria-expended','false')
				t.attr('aria-expended', 'false').classed('collapsing', true).classed('collapse', false).classed('in', false);
				t.on(bs.api.transitionEvent, function() {hide2(t)}).style(dim, '1px')
			},
			show2  = function() {
				target.on(bs.api.transitionEvent, function(){});
				target.classed('collapsing',false).classed('collapse',true).classed('in',true);
				target.style(dim, '');
				trigger(target,'shown.bs.collapse');
			},
			show   = function() {
				if (parent!=null)
					hide()
				trigger(target,'show.bs.collapse');
				target.node().offsetWidth;
				target.attr('aria-expended', 'true').classed('collapsing', true).classed('collapse', false);
				me.classed('collapsed', false).attr('aria-expended','true')
				target.on(bs.api.transitionEvent, function() {show2()}).style(dim, target.node()[sc]+"px")
			};
		if (target.classed('collapsing'))
			return
		if (parent!=null && parent.selectAll('.collapsing').size()>0)
			return
		if (active)
			hide()
		else
			show()
		return true;
	}
	// popover & tooltip handling
	bs.api.tooltip.event	= function() {
		if (d3.event) d3.event.preventDefault();
		var	me	= d3.select(this),
			type	= me.attr('data-toggle'),
			target	= bs.api.find.target(this, type)
			creating= false;

		// creating if missing
		if(target == null) {
			trigger(me,'show.bs.'+type);
			creating=true;
			var	id	= 'd3-bs-'+type+'-'+(toolCnt++),
				pos	= me.attr('data-placement'),
				title	= me.attr('title'),
				text	= me.attr('data-content'),
				arrow;
			me.attr('title', '') // disabling normal tooltip
			if(pos==null || (pos!='left'&&pos!='right'&&pos!='bottom')) pos ='top';
			me.attr('data-target', '#'+id).attr('aria-describedby', '#'+id);
			target = d3.select(this.parentNode).select(function() {
				return this.insertBefore(document.createElement("div"),me.node());
			}).attr('id', id).attr('role', 'tooltip').classed(type, true);

			if (type=='tooltip') {
				arrow = target.append('div').classed('tooltip-arrow',true)
				target.append('div').classed('tooltip-inner',true).html(title)
			} else {
				arrow = target.append('div').classed('arrow',true)
				target.append('h3').classed('popover-title',true).html(title)
				target.append('div').classed('popover-content',true).html(text)
			}
			target.style('display', 'block').classed(pos,true).classed('fade',true)
			var w = target.node().offsetWidth,
			    h = target.node().offsetHeight,
			    b = me.node().getBoundingClientRect(),
			    x = me.node().offsetLeft,		y = me.node().offsetTop
			    bh= b.height,	bw= b.width;
			switch(pos) {
			case 'top':	x += (bw - w)/2;y -= h;		break;
			case 'bottom':	x += (bw - w)/2;y += bh;	break;
			case 'left':	x -= w;		y += (bh - h)/2;break;
			case 'right':	x += bw;	y += (bh - h)/2;break;
			}
			target.style('top', y+'px').style('left',x+'px');
			trigger(me,'inserted.bs.'+type);
		}
		var show = !target.classed('in');
		if (type == 'popover' && d3.event.type == 'mouseover') return;
		if (type == 'tooltip')
			show = (d3.event.type == 'mouseover');
		if (show)
			if(!creating) trigger(me,'show.bs.'+type);
		else
			trigger(me,'hide.bs.'+type);
		target.classed('in', show);
		// TODO: this should come after the transition
		if (show)
			trigger(me,'shown.bs.'+type);
		else
			trigger(me,'hidden.bs.'+type);
	};
	// carousel handling
	bs.api.carousel.moveTo	= function(mv) {
		if (d3.event) d3.event.preventDefault();
		var	dir	= 'left',
			type	= mv,
			id	= 0,
			me	= d3.select(this),
			active	= me.select('.item.active'),
			items	= active.node().parentNode.children,
			next,
			endAnim	= function(next) {
			me.selectAll('.carousel-indicators > .active').classed('active',false);
			me.select('[data-slide-to="'+next+'"]').classed('active',true);
			active.classed('active',false).classed(dir,false).on(bs.api.transitionEvent, null);
			me.selectAll('.item.active').classed('active',false);
			d3.select(items[next]).classed(type,false).classed(dir,false).classed('active',true);
			trigger(me, 'slid.bs.carousel', {'direction':dir});
		};
		if (items.length<2) return;
		for(i=0;i<items.length;i++)
			if (items[i] == active.node())
				id = i
		if(mv==id) return;
		if ((typeof mv == 'number' && mv<id) ||mv=='prev')
			dir  = 'right'
		if (typeof mv == 'number')  {
			next = mv;
			type = dir=='left'?'next':'prev'
		} else {
			next = id;
			if(dir=='left') next++;
			else		next--;
			if (next>=items.length)	next=0;
			else if (next<0)	next = items.length-1;
		}
		trigger(me, 'slide.bs.carousel', {'direction':dir});
		if (me.classed('slide')) {
			var nt  = d3.select(items[next]);
			me.selectAll('.item').on(bs.api.transitionEvent, null)
			nt.classed(type,true)
			nt.node().offsetWidth
			active.classed(dir,true)
			nt.classed(dir,true)
			active.on(bs.api.transitionEvent, function() {endAnim(next)})
		} else
			endAnim(next);
	}
	bs.api.carousel.slide	= function() {
		var	me	= d3.select(this),
			target	= bs.api.find.target(this, 'carousel');
		if (target!=null) me.on('click.bs.carousel.data-api', function() {
			bs.api.carousel.moveTo.call(target.node(), me.attr('data-slide'))
		})
	}
	bs.api.carousel.slideTo	= function() {
		var	me	= d3.select(this),
			target	= bs.api.find.target(this, 'carousel');
		if (target!=null) me.on('click.bs.carousel.data-api', function() {
			bs.api.carousel.moveTo.call(target.node(), parseInt(me.attr('data-slide-to'),10))
		})
	}
	bs.api.carousel.init	= function() {
		var	me	= d3.select(this),
			that	= this,
			interval,
			stop	= function() { clearInterval(interval); },
			start	= function() {stop();interval = setInterval(function() {
					bs.api.carousel.moveTo.call(that, 'next');
				}, 5000);
			};
		me.on('mouseover.bs.carousel', stop);
		me.on('mouseout.bs.carousel', start);
		start();
	}
	// affix handling
	bs.api.affix.scroll	= function(tgt,min,max,h) {
		var	me	= d3.select(this),
			target	= d3.select(tgt),
			y	= window.scrollY;
		if (max<y && me.classed('affix-bottom'))
			return
		else if (max<y) {
			trigger(me, 'affix-bottom.bs.affix');
			me.classed('affix-top',false).classed('affix',false).classed('affix-bottom',true).style('top', (max-h)+'px');
			trigger(me, 'affixed-bottom.bs.affix');
		} else if (min>y && me.classed('affix-top'))
			return
		else if (min>y) {
			trigger(me, 'affix-top.bs.affix');
			me.classed('affix-top',true).classed('affix',false).classed('affix-bottom',false).style('top', null)
			trigger(me, 'affixed-top.bs.affix');
		} else if (me.classed('affix'))
			return
		else {
			trigger(me, 'affix.bs.affix');
			me.classed('affix-top',false).classed('affix',true).classed('affix-bottom',false).style('top', null)
			trigger(me, 'affixed.bs.affix');
		}
	}
	bs.api.affix.init	= function() {
		var	that	= this,
			minPos	= this.getBoundingClientRect().top+window.scrollY,
			maxPos	= document.body.clientHeight,
			max	= d3.select('[data-affix-end="#'+d3.select(this).attr('id')+'"]'),
			h	= this.getBoundingClientRect().height
		if(max.size()>0)
			maxPos = max.node().offsetTop
		maxPos -= h
		d3.select(window).on('scroll.bs.affix.data-api', function() {bs.api.affix.scroll.call(that, window,minPos,document.body.clientHeight,h)})
		d3.select(window).on('click.affix.data-api', function() {
			setTimeout(function() {bs.api.affix.scroll.call(that, window,minPos,document.body.clientHeight,h)},5)
		})
		bs.api.affix.scroll.call(that, window,minPos,document.body.clientHeight,h)
	}
	// scrollSpy
	bs.api.scroll.linkClick	= function() {
		if (d3.event) d3.event.preventDefault();
		var target = bs.api.find.target(this, null)
		d3.transition().duration(1500)
			.tween("scroll", scrollTween(bs.api.cumulativeOffset(target.node()).top));
	}
	bs.api.scroll.scroll	= function(container, id) {
		if ((typeof scrollSpyData[id] == 'undefined') || scrollSpyData[id].scrollHeight!=container.scrollHeight)
			scrollSpyRefresh.call(this,container,id);
		if (Math.abs(scrollSpyData[id].scrollY - window.scrollY)<10)
			return;
		scrollSpyData[id].scrollY = window.scrollY;
		var it = scrollSpyData[id].items.find(function(e) { return e.top>window.scrollY});
		if(typeof it == 'undefined')
			it = scrollSpyData[id].revs[0];
		if ((typeof scrollSpyData[id].current != 'undefined') && scrollSpyData[id].current==it) return;
		scrollSpyData[id].current = it;
		d3.select(this).selectAll('.active').classed('active',false);
		trigger(d3.select(it.item), 'activate.bs.scrollspy');
		var p = it.item;
		do {
			p = p.parentNode;
			if(p.nodeName == 'LI') {
				d3.select(p).classed('active',true);
			}
		} while (p!=this);
	}
	bs.api.scroll.init	= function() {
		var	that	= this,
			id	= scrollSpyCnt++;
			target	= bs.api.find.target(this, null)
		d3.select(window).on('scroll.bs.scrollspy', function() {bs.api.scroll.scroll.call(target.node(),that,id)})
		bs.api.scroll.scroll.call(target.node(),that,id)
	}
	// enabling data-api on load
	d3.select(window)				.on('load.bs.data-api',			function() {
		d3.selectAll('[data-dismiss="alert"]')	.on('click.bs.alert.data-api',		bs.api.alert.click)
		d3.selectAll('[data-toggle="modal"]')	.on('click.bs.modal.data-api',		bs.api.modal.click);
		d3.select(global)			.on('click.bs.dropdown.data-api',	bs.api.dropdown.closeAll)
		d3.selectAll('[data-toggle="dropdown"]').on('click.bs.dropdown.data-api',	bs.api.dropdown.click);
		d3.selectAll('[data-toggle="tab"]')	.on('click.bs.tab.data-api',		bs.api.tab.click);
		d3.selectAll('[data-toggle="pill"]')	.on('click.bs.tab.data-api',		bs.api.tab.click);
		d3.selectAll('[data-toggle="collapse"]').on('click.bs.collapse.data-api',	bs.api.collapse.click);
		d3.selectAll('[data-toggle="popover"]')	.on('click.bs.popover',			bs.api.tooltip.event);
		d3.selectAll('[data-toggle="popover"]')	.on('mouseover.bs.popover',		bs.api.tooltip.event);
		d3.selectAll('[data-toggle="tooltip"]')	.on('mouseover.bs.tooltip',		bs.api.tooltip.event);
		d3.selectAll('[data-toggle="tooltip"]')	.on('mouseout.bs.tooltip',		bs.api.tooltip.event);
		d3.selectAll('[data-toggle^="button"]').each(function() {
			d3.select(this).selectAll('.btn').on('click.bs.button.data-api', 	bs.api.button.toggle);
		});
		d3.selectAll('[data-slide]').each(						bs.api.carousel.slide);
		d3.selectAll('[data-slide-to]').each(						bs.api.carousel.slideTo);
		d3.selectAll('[data-ride="carousel"]').each(					bs.api.carousel.init);
		d3.selectAll('[data-spy="affix"]').each(					bs.api.affix.init);
		d3.selectAll('[data-spy="scroll"]').each(					bs.api.scroll.init)
	});
}));
